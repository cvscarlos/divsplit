import { connectDb } from './_lib/db';

// GET /api/health — quick check that the function runtime + MONGO_URI + Atlas all work.
export default async function handler(): Promise<Response> {
	try {
		const mongoose = await connectDb();
		return Response.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'connecting' });
	} catch (err) {
		return Response.json({ ok: false, error: String(err) }, { status: 500 });
	}
}
