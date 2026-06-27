import { createHash } from 'node:crypto';
import { connectDb } from './_lib/db';
import { Change, EventDoc } from './_lib/models';

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

type PostBody = {
	change?: InboundChange;
	core?: { config?: unknown; members?: unknown[]; transactions?: unknown[] };
};

export default async function handler(req: Request): Promise<Response> {
	await connectDb();
	const url = new URL(req.url);

	if (req.method === 'GET') {
		const eventId = url.searchParams.get('eventId');
		if (!eventId) return Response.json({ error: 'eventId is required' }, { status: 400 });

		const since = url.searchParams.get('since');
		const query: Record<string, unknown> = { eventId };
		if (since) query.receivedAt = { $gt: new Date(since) };

		const changes = await Change.find(query).sort({ receivedAt: 1 }).lean();
		return Response.json({ changes });
	}

	if (req.method === 'POST') {
		const { change, core } = (await req.json()) as PostBody;
		if (!change?.id || !change.eventId) {
			return Response.json({ error: 'change { id, eventId } is required' }, { status: 400 });
		}

		// Chain onto the event's current head; the server computes the hash.
		const projection = await EventDoc.findById(change.eventId).lean<{ headHash?: string } | null>();
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

		// Append-only + idempotent: a re-synced change (same id) is a no-op.
		try {
			await Change.create({ _id: change.id, ...payload, hash });
		} catch (err) {
			if ((err as { code?: number }).code === 11000) {
				return Response.json({ ok: true, duplicate: true });
			}
			throw err;
		}

		// Refresh the projection cache. balanceCache is intentionally NOT taken from the
		// client — it's recomputed server-side later, never trusted as input.
		if (core) {
			await EventDoc.findByIdAndUpdate(
				change.eventId,
				{
					$set: {
						config: core.config || {},
						members: core.members || [],
						transactions: core.transactions || [],
						headHash: hash,
					},
				},
				{ upsert: true },
			);
		}

		return Response.json({ ok: true, hash });
	}

	return Response.json({ error: 'method not allowed' }, { status: 405 });
}
