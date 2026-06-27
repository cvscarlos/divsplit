import { connectDb } from './_lib/db.js';
import { EventDoc } from './_lib/models.js';
import { queryParam } from './_lib/http.js';
import type { ApiRequest, ApiResponse } from './_lib/http.js';

// GET /api/event?id=<eventId> — the projection (cache) for one event.
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
	await connectDb();
	const id = queryParam(req.query.id);
	if (!id) {
		res.status(400).json({ error: 'id is required' });
		return;
	}

	const event = await EventDoc.findById(id).lean();
	if (!event) {
		res.status(404).json({ error: 'not found' });
		return;
	}
	res.status(200).json({ event });
}
