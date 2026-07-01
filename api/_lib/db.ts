import mongoose from 'mongoose';

/**
 * One Mongo connection reused across warm serverless invocations — a *connection*
 * cache (not a data cache).
 *
 * This app's traffic is low and bursty: it can sit idle for a week, then get a few
 * requests. So:
 *  - most calls are cold starts where there's nothing to reuse — that's expected and fine;
 *  - a cached "connected" promise can point at a socket Atlas already dropped while idle,
 *    so we re-check `readyState` and reconnect if it's dead;
 *  - a failed connect must NOT stay cached — a rejected promise would poison every later
 *    request until the next cold start — so we reset it. That also lets a request succeed
 *    on retry once a paused / free-tier Atlas has finished waking up.
 */
let cached: Promise<typeof mongoose> | null = null;

export function connectDb(): Promise<typeof mongoose> {
	// readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting.
	// Reuse a live or connecting connection; otherwise (re)connect.
	const state = mongoose.connection.readyState;
	if (cached && (state === 1 || state === 2)) return cached;

	const uri = process.env.MONGO_URI;
	if (!uri) throw new Error('MONGO_URI is not set');

	cached = mongoose
		.connect(uri, {
			dbName: 'divsplit_db', // pin the database in code so local and prod never diverge (was the URI default, 'test')
			serverSelectionTimeoutMS: 8000, // fail fast instead of hanging the function if Atlas is waking
			maxPoolSize: 5, // a mostly-idle serverless backend never needs a big pool
		})
		.catch((err) => {
			cached = null; // never cache a failed connection — let the next request retry
			throw err;
		});

	return cached;
}
