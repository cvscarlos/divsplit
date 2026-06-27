import { connectDb } from './_lib/db';
import { EventDoc } from './_lib/models';

// GET /api/event?id=<eventId> — the projection (cache) for one event.
export default async function handler(req: Request): Promise<Response> {
	await connectDb();
	// req.url can be relative under some runtimes; a base keeps URL parsing valid either way.
	const id = new URL(req.url, `http://${req.headers.get('host') || 'localhost'}`).searchParams.get('id');
	if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

	const event = await EventDoc.findById(id).lean();
	if (!event) return Response.json({ error: 'not found' }, { status: 404 });
	return Response.json({ event });
}
