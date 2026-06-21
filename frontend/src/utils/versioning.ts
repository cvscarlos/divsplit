/**
 * Event version history (git/Google-Docs style), optimised for SMALL storage.
 *
 * Strategy: store ONE reversible delta per save (jsondiffpatch) — no full snapshots.
 * Any past state is reconstructed by reverse-applying ("unpatch") deltas from the
 * current state back to the target version. Restoring is a NEW forward version
 * (history is never destroyed), like reverting a git commit.
 *
 * Only the "core" of the event (config, members, transactions) is versioned — the
 * activity log and the history itself are excluded so deltas stay tiny.
 */
import localforage from 'localforage';
import { create } from 'jsondiffpatch';
import type { Delta } from 'jsondiffpatch';

import type { Group, GroupConfig, Member, Transaction } from '../types';

const historyStore = localforage.createInstance({ name: 'history' });

// No `textDiff` option → strings are stored whole as [old, new] (no diff_match_patch
// dependency). Keeps deltas reversible and the bundle lean.
const differ = create({
	objectHash: (obj: unknown) => (obj as { id?: string })?.id ?? JSON.stringify(obj),
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
	if (!last || (last.changes?.length ?? 0) === 0) return false;
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
 * so history renders in the user's language. See activity-tracker for the keys.
 */
export interface ChangeEntry {
	key: string;
	params?: Record<string, unknown>;
}

export interface EventVersion {
	v: number;
	ts: string;
	/** Per-action changes for this save, as translatable key+params. */
	changes: ChangeEntry[];
	author: string;
	delta: Delta;
}

const EMPTY_CORE: VersionedCore = { config: {}, members: [], transactions: [] };

export function coreOf(group: Group): VersionedCore {
	return {
		config: group.config ?? {},
		members: group.members ?? [],
		transactions: group.transactions ?? [],
	};
}

export async function listVersions(eventId: string): Promise<EventVersion[]> {
	return (await historyStore.getItem<EventVersion[]>(eventId)) ?? [];
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
	// The per-action changes are whatever activities this save added — each carries
	// a named key + params, translated at render time.
	const prevActivityIds = new Set((prev?.activities ?? []).map((a) => a.id));
	const changes: ChangeEntry[] = (next.activities ?? [])
		.filter((a) => !prevActivityIds.has(a.id))
		.map((a) => ({ key: a.description, params: a.details }));

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
		last.changes = [...changes, ...(last.changes ?? [])];
		last.ts = new Date().toISOString();
		await historyStore.setItem(eventId, versions);
		return last;
	}

	const entries: ChangeEntry[] = opts.change ? [opts.change] : changes.length ? changes : [{ key: 'EVENT_UPDATED' }];
	const version: EventVersion = {
		v: (last?.v ?? 0) + 1,
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
