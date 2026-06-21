import mongoose, { Schema } from 'mongoose';

/**
 * Mongoose models for the sync backend (see ARCHITECTURE §1.5).
 *
 * Two collections:
 *  - `Change` — the append-only, tamper-evident source of truth (a Merkle DAG).
 *    Insert-only is enforced by the API layer, NOT the schema.
 *  - `Event`  — a projection/cache folded from the changes; rebuildable, never the
 *    source of truth.
 *
 * Event-shaped fields (config / members / transactions / delta / params) are stored
 * as `Mixed` because they mirror the frontend domain types verbatim and stay schemaless.
 */

/** One translatable history line: a named key + interpolation params (a ChangeEntry). */
const summarySchema = new Schema(
	{
		key: { type: String, required: true },
		params: { type: Schema.Types.Mixed },
	},
	{ _id: false },
);

const changeSchema = new Schema(
	{
		// The change id (frontend `generateId()` hex). Used as `_id` so a re-synced
		// change is an idempotent duplicate-key no-op.
		_id: { type: String, required: true },
		eventId: { type: String, required: true },
		// Parent change hashes the author had seen. Usually one; a fork (concurrent
		// offline edit) is detected when a parent isn't the current head.
		parents: { type: [String], default: [] },
		// hash = H(parents + payload): altering any entry breaks every descendant.
		hash: { type: String, required: true },
		author: { type: String, default: '' },
		// When the action happened on the author's device (used to sort the log).
		ts: { type: Date, required: true },
		// Server arrival order — separate from `ts`, since offline devices sync late.
		receivedAt: { type: Date, default: Date.now },
		// Reversible jsondiffpatch delta of the event core (config/members/transactions).
		delta: { type: Schema.Types.Mixed },
		// Translatable change lines derived from the delta.
		summary: { type: [summarySchema], default: [] },
	},
	{ versionKey: false },
);

changeSchema.index({ eventId: 1, receivedAt: 1 }); // fetch changes a device hasn't seen yet
changeSchema.index({ hash: 1 }, { unique: true }); // content-addressed; tamper-evident + dedupe

const eventSchema = new Schema(
	{
		_id: { type: String, required: true }, // eventId
		config: { type: Schema.Types.Mixed, default: {} },
		members: { type: [Schema.Types.Mixed], default: [] },
		transactions: { type: [Schema.Types.Mixed], default: [] },
		// Recomputed server-side from transactions; never accepted from the client.
		balanceCache: { type: Schema.Types.Mixed },
		// Hash of the most recently folded change — the DAG head for this projection.
		headHash: { type: String },
	},
	{ versionKey: false, timestamps: { createdAt: false, updatedAt: true } },
);

// `models.X ?? model(...)` avoids re-registering the model when the module is
// re-evaluated on a warm serverless invocation (OverwriteModelError).
export const Change = mongoose.models.Change ?? mongoose.model('Change', changeSchema);
export const EventDoc = mongoose.models.Event ?? mongoose.model('Event', eventSchema);
