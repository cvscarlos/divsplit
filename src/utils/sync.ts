import localforage from 'localforage';
import { coreOf } from './versioning';
import type { EventVersion, VersionedCore } from './versioning';
import { generateId } from './id';
import type { Group } from '../types';

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
					body: JSON.stringify({ change: payload.change, core: payload.core }),
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
export async function enqueue(eventId: string, version: EventVersion, core: VersionedCore): Promise<void> {
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
	await enqueue(eventId, last, coreOf(group as Group));
	await flush();
}

/**
 * Pull the server's full state for one event into local storage. Returns true when local
 * data actually changed (so the caller can re-render). No-op when offline or while local
 * edits are still queued (avoids clobbering them). If the server doesn't know the event yet
 * but we hold it locally, push it up first (backfill) so it can sync from then on.
 */
export async function pull(eventId: string): Promise<boolean> {
	if (!eventId || !online()) return false;
	await flush(); // push pending local edits first
	if (await outboxHas(eventId)) return false; // still unsynced → retry on the next tick

	let projection: { config?: unknown; members?: unknown[]; transactions?: unknown[] } | undefined;
	let changes: RemoteChange[];
	try {
		const [pRes, cRes] = await Promise.all([
			fetch(`/api/event?id=${encodeURIComponent(eventId)}`),
			fetch(`/api/changes?eventId=${encodeURIComponent(eventId)}`),
		]);
		if (!pRes.ok || !cRes.ok) return false;
		projection = ((await pRes.json()) as { event?: typeof projection }).event;
		changes = ((await cRes.json()) as { changes?: RemoteChange[] }).changes || [];
	} catch {
		return false; // offline / backend down
	}
	if (!projection) {
		await backfillToServer(eventId); // server doesn't have it but we do → upload our copy
		return false;
	}

	const core = {
		config: projection.config || {},
		members: projection.members || [],
		transactions: projection.transactions || [],
	};
	const versions = remoteChangesToVersions(changes);

	// Skip the write (and the re-render) when nothing changed.
	const prev = await groupStore.getItem<Group>(eventId);
	const prevV = await historyStore.getItem<EventVersion[]>(eventId);
	const sameCore =
		!!prev &&
		JSON.stringify({
			config: prev.config || {},
			members: prev.members || [],
			transactions: prev.transactions || [],
		}) === JSON.stringify(core);
	const sameLog =
		(prevV?.length || 0) === versions.length && prevV?.[prevV.length - 1]?.id === versions[versions.length - 1]?.id;
	if (sameCore && sameLog) return false;

	await groupStore.setItem(eventId, core);
	await historyStore.setItem(eventId, versions);
	return true;
}

// Background triggers (browser only).
if (typeof window !== 'undefined') {
	window.addEventListener('online', () => void flush());
	window.addEventListener('offline', () => void refreshStatus());
	void flush(); // drain anything left from a previous session
	setInterval(() => void flush(), 20000); // backstop for transient server errors
}
