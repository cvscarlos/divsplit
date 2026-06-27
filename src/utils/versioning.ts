/**
 * Event version history (git/Google-Docs style), optimised for SMALL storage.
 *
 * Strategy: store ONE reversible delta per save (jsondiffpatch) — no full snapshots.
 * Any past state is reconstructed by reverse-applying ("unpatch") deltas from the
 * current state back to the target version. Restoring is a NEW forward version
 * (history is never destroyed), like reverting a git commit.
 *
 * The versioned "core" is the whole event except the history itself: config,
 * members, and transactions. Change lines are derived by diffing those root keys
 * (see describeChanges), so every change is logged straight from the data.
 */
import localforage from 'localforage';
import { create } from 'jsondiffpatch';
import type { Delta } from 'jsondiffpatch';

import type { Group, GroupConfig, Member, Transaction } from '../types';
import { generateId } from './id';

const historyStore = localforage.createInstance({ name: 'history' });

// No `textDiff` option → strings are stored whole as [old, new] (no diff_match_patch
// dependency). Keeps deltas reversible and the bundle lean.
const differ = create({
	objectHash: (obj: unknown) => (obj as { id?: string })?.id || JSON.stringify(obj),
	arrays: { detectMove: true, includeValueOnMove: false },
});

/** Change keys that remove data — these always start a fresh, restorable version. */
const DESTRUCTIVE_CHANGES = new Set(['TX_REMOVED', 'MEMBER_REMOVED', 'TRANSFER_UNDONE', 'TOPUP_UNDONE']);

/** Burst window for folding consecutive same-author edits into one version. */
const CONSOLIDATE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Whether a save should be folded (Google-Docs style) into the previous version
 * rather than creating a new one. A save is kept separate when it's a standalone
 * change (e.g. a restore), when it removes data (so the pre-removal state stays
 * restorable), when the author differs, or when it's outside the burst window.
 */
export function shouldConsolidate(
	last: EventVersion | undefined,
	changes: ChangeEntry[],
	author: string,
	hasStandaloneChange: boolean,
	now: number = Date.now(),
): boolean {
	if (hasStandaloneChange) return false;
	if (changes.some((c) => DESTRUCTIVE_CHANGES.has(c.key))) return false;
	if (!last || (last.changes?.length || 0) === 0) return false;
	if (last.author !== author) return false;
	return now - new Date(last.ts).getTime() < CONSOLIDATE_WINDOW_MS;
}

export interface VersionedCore {
	config: GroupConfig;
	members: Member[];
	transactions: Transaction[];
}

/**
 * One change line, stored as a translatable named key + params (NOT baked text),
 * so history renders in the user's language. Keys are produced by describeChanges.
 */
export interface ChangeEntry {
	key: string;
	params?: Record<string, unknown>;
}

export interface EventVersion {
	v: number;
	/** Stable global id — the idempotency key when syncing this version to the backend. */
	id: string;
	ts: string;
	/** Per-action changes for this save, as translatable key+params. */
	changes: ChangeEntry[];
	author: string;
	delta: Delta;
}

const EMPTY_CORE: VersionedCore = { config: {}, members: [], transactions: [] };

export function coreOf(group: Group): VersionedCore {
	return {
		config: group.config || {},
		members: group.members || [],
		transactions: group.transactions || [],
	};
}

export async function listVersions(eventId: string): Promise<EventVersion[]> {
	return (await historyStore.getItem<EventVersion[]>(eventId)) || [];
}

const memberName = (id: string, members: Member[]): string => members.find((m) => m.id === id)?.name || id;

/** A named change line for a transaction, picking the key by its type. */
function describeTransaction(tx: Transaction, members: Member[], removed: boolean): ChangeEntry {
	const type = tx.type || 'expense';
	if (type === 'transfer') {
		const from = memberName(Object.keys(tx.paidBy)[0] || '', members);
		const to = memberName(Object.keys(tx.paidFor)[0] || '', members);
		return { key: removed ? 'TRANSFER_UNDONE' : 'TRANSFER_PAID', params: { from, to, amount: tx.total } };
	}
	if (type === 'topup') {
		const name = memberName(Object.keys(tx.paidBy)[0] || '', members);
		return { key: removed ? 'TOPUP_UNDONE' : 'TOPUP_ADDED', params: { name, amount: tx.total } };
	}
	return { key: removed ? 'TX_REMOVED' : 'TX_ADDED', params: { description: tx.description, total: tx.total } };
}

const txModified = (a: Transaction, b: Transaction): boolean =>
	a.description !== b.description ||
	a.total !== b.total ||
	new Date(a.date).getTime() !== new Date(b.date).getTime() ||
	JSON.stringify(a.paidBy) !== JSON.stringify(b.paidBy) ||
	JSON.stringify(a.paidFor) !== JSON.stringify(b.paidFor);

/**
 * Derive the human change lines for a save by diffing each versioned root key
 * (config / members / transactions) of the prev vs next state — so every change
 * is described from the data itself, never depending on a UI action to log it.
 * Config sub-changes only fire when the old value existed, so creation stays quiet
 * (the caller prepends EVENT_CREATED for the first save).
 */
export function describeChanges(prev: VersionedCore, next: VersionedCore): ChangeEntry[] {
	const changes: ChangeEntry[] = [];
	const members = [...next.members, ...prev.members]; // union for name lookups (covers removed members)
	const pc = prev.config || {};
	const nc = next.config || {};

	// config
	if (pc.name && nc.name && pc.name !== nc.name)
		changes.push({ key: 'EVENT_RENAMED', params: { old: pc.name, new: nc.name } });
	if (pc.holderId && pc.holderId !== nc.holderId)
		changes.push({ key: 'HOLDER_CHANGED', params: { name: memberName(nc.holderId || '', members) } });
	if (pc.icon !== undefined && pc.icon !== nc.icon) changes.push({ key: 'ICON_CHANGED' });

	// members
	const prevM = new Map(prev.members.map((m) => [m.id, m]));
	const nextM = new Map(next.members.map((m) => [m.id, m]));
	for (const m of next.members) if (!prevM.has(m.id)) changes.push({ key: 'MEMBER_ADDED', params: { name: m.name } });
	for (const m of prev.members) if (!nextM.has(m.id)) changes.push({ key: 'MEMBER_REMOVED', params: { name: m.name } });
	for (const m of next.members) {
		const p = prevM.get(m.id);
		if (p && p.name !== m.name) changes.push({ key: 'MEMBER_RENAMED', params: { old: p.name, new: m.name } });
	}

	// transactions
	const prevT = new Map(prev.transactions.map((t) => [t.id, t]));
	const nextT = new Map(next.transactions.map((t) => [t.id, t]));
	for (const t of next.transactions) if (!prevT.has(t.id)) changes.push(describeTransaction(t, members, false));
	for (const t of prev.transactions) if (!nextT.has(t.id)) changes.push(describeTransaction(t, members, true));
	for (const t of next.transactions) {
		const p = prevT.get(t.id);
		if (p && txModified(p, t)) changes.push({ key: 'TX_UPDATED', params: { description: t.description } });
	}

	return changes;
}

/** Record a version if the core changed. Returns the new version (or null). */
export async function recordVersion(
	eventId: string,
	prev: Group | null,
	next: Group,
	opts: { change?: ChangeEntry; author?: string } = {},
): Promise<EventVersion | null> {
	const nextCore = coreOf(next);
	const prevCore = prev ? coreOf(prev) : EMPTY_CORE;
	const delta = differ.diff(prevCore, nextCore);
	if (!delta) return null;

	const author = opts.author || '';
	// Derive the change lines from the actual state diff (per root key), so nothing is
	// ever missed. The first-ever save is the event's creation.
	const changes: ChangeEntry[] = opts.change
		? [opts.change]
		: [...(prev ? [] : [{ key: 'EVENT_CREATED' }]), ...describeChanges(prevCore, nextCore)];

	const versions = await listVersions(eventId);
	const last = versions[versions.length - 1];

	// Google-Docs style: fold a burst of normal edits by the same author into the last
	// version. Restores and destructive saves stay separate (see shouldConsolidate).
	if (shouldConsolidate(last, changes, author, !!opts.change)) {
		const base = reconstructCore(prevCore, versions, last.v - 1); // state before `last`
		const mergedDelta = differ.diff(base, nextCore);
		if (!mergedDelta) {
			// the burst cancelled out vs its base → drop the version entirely
			versions.pop();
			await historyStore.setItem(eventId, versions);
			return null;
		}
		last.delta = mergedDelta;
		last.changes = [...changes, ...(last.changes || [])];
		last.ts = new Date().toISOString();
		await historyStore.setItem(eventId, versions);
		return last;
	}

	const entries: ChangeEntry[] = changes.length ? changes : [{ key: 'EVENT_UPDATED' }];
	const version: EventVersion = {
		v: (last?.v || 0) + 1,
		id: generateId(),
		ts: new Date().toISOString(),
		changes: entries,
		author,
		delta,
	};
	versions.push(version);
	await historyStore.setItem(eventId, versions);
	return version;
}

/** Reconstruct the core state as it was at version `targetV` (0 = before any change). */
export function reconstructCore(currentCore: VersionedCore, versions: EventVersion[], targetV: number): VersionedCore {
	let state: VersionedCore = structuredClone(currentCore);
	for (let i = versions.length - 1; i >= 0; i--) {
		if (versions[i].v <= targetV) break;
		state = differ.unpatch(state, versions[i].delta) as VersionedCore;
	}
	return state;
}

/** Build a group restored to `targetV` (caller persists it as a new forward version). */
export async function buildRestore(eventId: string, currentGroup: Group, targetV: number): Promise<Group> {
	const versions = await listVersions(eventId);
	const core = reconstructCore(coreOf(currentGroup), versions, targetV);
	return { ...currentGroup, config: core.config, members: core.members, transactions: core.transactions };
}
