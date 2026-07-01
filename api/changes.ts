import { createHash } from 'node:crypto';
import { connectDb } from './_lib/db.js';
import { Change, EventDoc } from './_lib/models.js';
import { queryParam } from './_lib/http.js';
import type { ApiRequest, ApiResponse } from './_lib/http.js';

/**
 * /api/changes
 *   GET  ?eventId=…&since=<ISO>  → changes for an event the device hasn't seen yet
 *   POST { change, core }        → append one change and refresh the projection cache
 *
 * The server owns the tamper-evidence chain: the client never sends a hash. The server
 * chains the change onto the event's current head and computes hash = H(parents + payload),
 * so the integrity of the log can't depend on trusting the client.
 *
 * Slice: the client also sends the resulting `core` (config/members/transactions), so the
 * projection is a trivial upsert. Server-side delta-folding and DAG fork/conflict handling
 * come in a later pass.
 */

type InboundChange = {
	id?: string; // stable change id (client generateId) → idempotency key
	eventId?: string;
	author?: string;
	ts?: string; // when the action happened on the author's device
	delta?: unknown; // reversible jsondiffpatch delta of the event core
	summary?: { key: string; params?: unknown }[]; // translatable ChangeEntry[]
};

type RootKey = 'config' | 'members' | 'transactions';

type PostBody = {
	change?: InboundChange;
	core?: { config?: unknown; members?: unknown[]; transactions?: unknown[] };
	// Device-generated (ms) last-modified stamp per root key, for per-key last-writer-wins.
	keyUpdatedAt?: Partial<Record<RootKey, number>>;
};

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
	await connectDb();

	if (req.method === 'GET') {
		const eventId = queryParam(req.query.eventId);
		if (!eventId) {
			res.status(400).json({ error: 'eventId is required' });
			return;
		}

		const since = queryParam(req.query.since);
		const query: Record<string, unknown> = { eventId };
		if (since) query.receivedAt = { $gt: new Date(since) };

		const changes = await Change.find(query).sort({ receivedAt: 1 }).lean();
		res.status(200).json({ changes });
		return;
	}

	if (req.method === 'POST') {
		const { change, core, keyUpdatedAt } = (req.body || {}) as PostBody;
		if (!change?.id || !change.eventId) {
			res.status(400).json({ error: 'change { id, eventId } is required' });
			return;
		}

		// Chain onto the event's current head; the server computes the hash.
		const projection = await EventDoc.findById(change.eventId).lean<{
			headHash?: string;
			keyUpdatedAt?: Partial<Record<RootKey, number>>;
		} | null>();
		const parents = projection?.headHash ? [projection.headHash] : [];
		const ts = change.ts ? new Date(change.ts) : new Date();
		const payload = {
			parents,
			eventId: change.eventId,
			id: change.id,
			author: change.author || '',
			ts,
			delta: change.delta,
			summary: change.summary || [],
		};
		const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

		// Append-only + idempotent for the LOG: a re-synced change id isn't inserted twice. But we
		// still refresh the projection below even on a duplicate — a client-side consolidation can
		// re-push the same change id carrying a fuller core, and skipping the update would silently
		// drop those edits (name/transactions folded into an already-synced version).
		let duplicate = false;
		try {
			await Change.create({ _id: change.id, ...payload, hash });
		} catch (err) {
			if ((err as { code?: number }).code === 11000) duplicate = true;
			else throw err;
		}

		// Refresh the projection cache with per-key last-writer-wins: only overwrite a root key
		// when the incoming device stamp is at least as new as the stored one, so a late or stale
		// write can't roll a key back. balanceCache is never taken from the client (recomputed later).
		if (core) {
			const incoming = keyUpdatedAt || {};
			const existingTs = projection?.keyUpdatedAt || {};
			const coreByKey: Record<RootKey, unknown> = {
				config: core.config || {},
				members: core.members || [],
				transactions: core.transactions || [],
			};
			const set: Record<string, unknown> = { headHash: hash };
			const mergedTs: Partial<Record<RootKey, number>> = { ...existingTs };
			for (const key of ['config', 'members', 'transactions'] as RootKey[]) {
				if ((incoming[key] || 0) >= (existingTs[key] || 0)) {
					set[key] = coreByKey[key];
					if (incoming[key]) mergedTs[key] = incoming[key];
				}
			}
			set.keyUpdatedAt = mergedTs;
			await EventDoc.findByIdAndUpdate(change.eventId, { $set: set }, { upsert: true });
		}

		res.status(200).json({ ok: true, hash, duplicate });
		return;
	}

	res.status(405).json({ error: 'method not allowed' });
}
