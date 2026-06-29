import localforage from 'localforage';
import { coreOf } from './versioning';
import type { EventVersion, VersionedCore } from './versioning';
import { generateId } from './id';
import type { Group, RootKey } from '../types';

type KeyTimestamps = Partial<Record<RootKey, number>>;
const ROOT_KEYS: RootKey[] = ['config', 'members', 'transactions'];

/**
 * Offline-first background sync (Google-Docs style), bidirectional.
 *
 * **Push:** every saved version is appended to a durable **outbox** in IndexedDB and the app
 * keeps working offline. A flusher drains the outbox to the backend whenever possible — on
 * save, when the connection returns (`online`), on load, and on a periodic backstop.
 *
 * **Pull:** `pull(eventId)` mirrors the server's full state back down — the projection
 * (config/members/transactions) and the change log (history) — so a second browser sees the
 * same data and history. Pull is skipped while local edits are still queued, then runs once
 * they've flushed, so it never clobbers unsynced work.
 *
 * ponytail: conflict resolution is last-writer-wins on the projection (the server folds each
 * POST's full core). Real DAG merge would go here if concurrent offline editing matters.
 */
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline';

const outbox = localforage.createInstance({ name: 'outbox' });
// Same named stores as use-api.ts / versioning.ts — localforage shares them by name,
// so pull can rebuild local state without a circular import back into those modules.
const groupStore = localforage.createInstance({ name: 'group' });
const historyStore = localforage.createInstance({ name: 'history' });

type Outbound = {
	queuedAt: number;
	change: { id: string; eventId: string; author: string; ts: string; delta: unknown; summary: unknown };
	core: VersionedCore;
	keyUpdatedAt?: KeyTimestamps;
};

// --- status store (consumed by the UI via useSyncExternalStore) ---
let status: SyncStatus = 'synced';
const listeners = new Set<() => void>();

export function subscribeSync(cb: () => void): () => void {
	listeners.add(cb);
	return () => listeners.delete(cb);
}
export function getSyncStatus(): SyncStatus {
	return status;
}
function setStatus(next: SyncStatus): void {
	if (next === status) return;
	status = next;
	listeners.forEach((l) => l());
}

// --- data-revision store: bumped whenever a pull writes new local data, so any open view
// re-reads it. Shared (not per-hook) so a manual sync from the header refreshes the page too.
let dataRevision = 0;
const dataListeners = new Set<() => void>();
export function subscribeData(cb: () => void): () => void {
	dataListeners.add(cb);
	return () => dataListeners.delete(cb);
}
export function getDataRevision(): number {
	return dataRevision;
}
function bumpData(): void {
	dataRevision++;
	dataListeners.forEach((l) => l());
}

const online = (): boolean => typeof navigator === 'undefined' || navigator.onLine;

async function refreshStatus(): Promise<void> {
	const pending = await outbox.length();
	setStatus(!online() ? 'offline' : pending > 0 ? 'pending' : 'synced');
}

// --- flush ---
let flushing = false;

export async function flush(): Promise<void> {
	if (flushing || !online()) {
		await refreshStatus();
		return;
	}
	if ((await outbox.length()) === 0) {
		setStatus('synced');
		return;
	}

	flushing = true;
	setStatus('syncing');
	try {
		const items: [string, Outbound][] = [];
		await outbox.iterate<Outbound, void>((value, key) => {
			items.push([key, value]);
		});
		items.sort((a, b) => a[1].queuedAt - b[1].queuedAt); // FIFO

		for (const [key, payload] of items) {
			let res: Response;
			try {
				res = await fetch('/api/changes', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ change: payload.change, core: payload.core, keyUpdatedAt: payload.keyUpdatedAt }),
				});
			} catch {
				break; // network dropped mid-flush — stop, retry on the next trigger
			}
			if (res.ok) await outbox.removeItem(key);
			else break; // server error — leave it queued and retry later
		}
	} finally {
		flushing = false;
		await refreshStatus();
	}
}

/** Append a saved version to the outbox and kick a flush (best-effort). */
export async function enqueue(
	eventId: string,
	version: EventVersion,
	core: VersionedCore,
	keyUpdatedAt?: KeyTimestamps,
): Promise<void> {
	const item: Outbound = {
		queuedAt: Date.now(),
		change: {
			id: version.id,
			eventId,
			author: version.author,
			ts: version.ts,
			delta: version.delta,
			summary: version.changes,
		},
		core,
		keyUpdatedAt,
	};
	await outbox.setItem(version.id, item);
	setStatus(online() ? 'pending' : 'offline');
	void flush();
}

// --- pull (server → local) ---

type RemoteChange = { _id: string; ts: string; author?: string; delta?: unknown; summary?: EventVersion['changes'] };

async function outboxHas(eventId: string): Promise<boolean> {
	let found = false;
	await outbox.iterate<Outbound, void>((v) => {
		if (v.change.eventId === eventId) found = true;
	});
	return found;
}

/** Map the server change log to local version records (history is display + restore). */
export function remoteChangesToVersions(changes: RemoteChange[]): EventVersion[] {
	return changes.map((c, i) => ({
		v: i + 1,
		id: c._id,
		ts: new Date(c.ts).toISOString(),
		changes: c.summary || [],
		author: c.author || '',
		delta: c.delta as EventVersion['delta'],
	}));
}

const hasLocalData = (g?: Group | null): boolean => !!g && (!!g.members?.length || !!g.config?.name);

/**
 * Push a locally-held event the server doesn't know about yet (created offline, or before
 * sync worked) so other devices can load it. Enqueues the current state through the durable
 * outbox; future edits sync normally. Idempotent — the server dedupes by change id.
 */
async function backfillToServer(eventId: string): Promise<void> {
	const group = await groupStore.getItem<Group>(eventId);
	if (!hasLocalData(group)) return;
	const versions = (await historyStore.getItem<EventVersion[]>(eventId)) || [];
	const last: EventVersion = versions[versions.length - 1] || {
		v: 1,
		id: generateId(),
		ts: new Date().toISOString(),
		changes: [{ key: 'EVENT_CREATED' }],
		author: '',
		delta: {},
	};
	await enqueue(eventId, last, coreOf(group as Group), group!.keyUpdatedAt);
	await flush();
}

// Coalesce concurrent pulls for the same event (e.g. the on-open trigger and the empty-seed
// load path both fire on mount) into one network round-trip; callers share the result.
const pullInFlight = new Map<string, Promise<boolean>>();

/**
 * Pull the server's full state for one event into local storage. Returns true when local
 * data actually changed (so the caller can re-render). No-op when offline or while local
 * edits are still queued (avoids clobbering them). If the server doesn't know the event yet
 * but we hold it locally, push it up first (backfill) so it can sync from then on.
 */
export function pull(eventId: string): Promise<boolean> {
	const existing = pullInFlight.get(eventId);
	if (existing) return existing;
	const run = runPull(eventId).finally(() => pullInFlight.delete(eventId));
	pullInFlight.set(eventId, run);
	return run;
}

async function runPull(eventId: string): Promise<boolean> {
	if (!eventId || !online()) return false;
	await flush(); // push pending local edits first
	if (await outboxHas(eventId)) return false; // still unsynced → retry on the next tick

	setStatus('syncing'); // any Mongo round-trip shows the spinning cloud
	try {
		let projection:
			{ config?: unknown; members?: unknown[]; transactions?: unknown[]; keyUpdatedAt?: KeyTimestamps } | undefined;
		let changes: RemoteChange[];
		try {
			const [pRes, cRes] = await Promise.all([
				fetch(`/api/event?id=${encodeURIComponent(eventId)}`),
				fetch(`/api/changes?eventId=${encodeURIComponent(eventId)}`),
			]);
			if (!cRes.ok || (!pRes.ok && pRes.status !== 404)) return false; // real error → bail
			changes = ((await cRes.json()) as { changes?: RemoteChange[] }).changes || [];
			// 404 = the event isn't on the server yet (not an error) → leave projection undefined.
			projection = pRes.status === 404 ? undefined : ((await pRes.json()) as { event?: typeof projection }).event;
		} catch {
			return false; // offline / backend down
		}
		if (!projection) {
			await backfillToServer(eventId); // server doesn't have it but we do → upload our copy
			return false;
		}

		// Per-key last-writer-wins: keep the local value of a root key unless the server's stamp
		// for it is strictly newer. Shields a fresh local edit from a stale server read (e.g. Atlas
		// read-after-write replica lag returning an older projection right after a push).
		const prev = await groupStore.getItem<Group>(eventId);
		const cloud: Record<RootKey, unknown> = {
			config: projection.config || {},
			members: projection.members || [],
			transactions: projection.transactions || [],
		};
		const cloudTs = projection.keyUpdatedAt || {};
		const localTs = prev?.keyUpdatedAt || {};
		const merged: Group = { config: {}, members: [], transactions: [], keyUpdatedAt: {} };
		for (const key of ROOT_KEYS) {
			const takeCloud = prev?.[key] === undefined || (cloudTs[key] || 0) > (localTs[key] || 0);
			const value = (takeCloud ? cloud[key] : prev[key]) ?? (key === 'config' ? {} : []);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(merged as any)[key] = value;
			const ts = takeCloud ? cloudTs[key] : localTs[key];
			if (ts) merged.keyUpdatedAt![key] = ts;
		}
		const versions = remoteChangesToVersions(changes);

		// Skip the write (and the re-render) when nothing changed.
		const prevV = await historyStore.getItem<EventVersion[]>(eventId);
		const sameCore = !!prev && JSON.stringify(coreOf(prev)) === JSON.stringify(coreOf(merged));
		const sameLog =
			(prevV?.length || 0) === versions.length && prevV?.[prevV.length - 1]?.id === versions[versions.length - 1]?.id;
		if (sameCore && sameLog) return false;

		await groupStore.setItem(eventId, merged);
		await historyStore.setItem(eventId, versions);
		bumpData(); // signal open views to re-read
		return true;
	} finally {
		await refreshStatus();
	}
}

/** Manual sync (header cloud): push the outbox, then pull the open event if there is one. */
export async function syncNow(eventId?: string): Promise<void> {
	await flush();
	if (eventId) await pull(eventId);
	else await refreshStatus();
}

// Background triggers (browser only).
if (typeof window !== 'undefined') {
	window.addEventListener('online', () => void flush());
	window.addEventListener('offline', () => void refreshStatus());
	void flush(); // drain anything left from a previous session
	setInterval(() => void flush(), 20000); // backstop for transient server errors
}
