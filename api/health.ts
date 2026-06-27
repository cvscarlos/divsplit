import { connectDb } from './_lib/db';
import type { ApiResponse } from './_lib/http';

// GET /api/health — quick check that the function runtime + MONGO_URI + Atlas all work.
export default async function handler(_req: unknown, res: ApiResponse): Promise<void> {
	try {
		const mongoose = await connectDb();
		res.status(200).json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'connecting' });
	} catch (err) {
		res.status(500).json({ ok: false, error: String(err) });
	}
}
