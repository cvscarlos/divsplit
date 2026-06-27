import localforage from 'localforage';
import type { EventVersion, VersionedCore } from './versioning';

/**
 * Offline-first background sync (Google-Docs style).
 *
 * Every saved version is appended to a durable **outbox** in IndexedDB and the app keeps
 * working offline. A background flusher drains the outbox to the backend whenever possible
 * — on save, when the connection returns (`online` event), on load, and on a periodic
 * backstop. A small status (`synced | syncing | pending | offline`) drives the header icon.
 *
 * The outbox is the local source of truth for "not yet sent"; nothing is lost if the user
 * is offline for a long time. (Pulling remote changes + fork/conflict handling are a later
 * pass — this is push only.)
 */
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline';

const outbox = localforage.createInstance({ name: 'outbox' });

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

// Background triggers (browser only).
if (typeof window !== 'undefined') {
	window.addEventListener('online', () => void flush());
	window.addEventListener('offline', () => void refreshStatus());
	void flush(); // drain anything left from a previous session
	setInterval(() => void flush(), 20000); // backstop for transient server errors
}
