import { connectDb } from './_lib/db';
import { Change, EventDoc } from './_lib/models';

/**
 * /api/changes
 *   GET  ?eventId=…&since=<ISO>  → changes for an event the device hasn't seen yet
 *   POST { change, core }        → append one change (insert-only, idempotent) and
 *                                  refresh the projection cache from the resulting core
 *
 * Slice-1 contract: the client sends the resulting `core` (config/members/transactions)
 * alongside the change, so the projection is a trivial upsert. Folding the delta
 * server-side and DAG conflict handling come in a later pass.
 */

type PostBody = {
	change?: { _id?: string; eventId?: string; hash?: string; [k: string]: unknown };
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
		if (!change?._id || !change.eventId || !change.hash) {
			return Response.json({ error: 'change { _id, eventId, hash } is required' }, { status: 400 });
		}

		// Append-only + idempotent: a re-synced change (same _id or hash) is a no-op.
		try {
			await Change.create(change);
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
						headHash: change.hash,
					},
				},
				{ upsert: true },
			);
		}

		return Response.json({ ok: true });
	}

	return Response.json({ error: 'method not allowed' }, { status: 405 });
}
