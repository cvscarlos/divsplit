import mongoose from 'mongoose';

/**
 * One Mongo connection reused across warm serverless invocations — a *connection*
 * cache (not a data cache), so we don't open a new pool on every request and
 * exhaust Atlas. The module stays loaded between warm calls, so `cached` survives.
 */
let cached: Promise<typeof mongoose> | null = null;

export function connectDb(): Promise<typeof mongoose> {
	if (!cached) {
		const uri = process.env.MONGO_URI;
		if (!uri) throw new Error('MONGO_URI is not set');
		cached = mongoose.connect(uri);
	}
	return cached;
}
