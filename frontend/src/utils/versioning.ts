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

export interface VersionedCore {
	config: GroupConfig;
	members: Member[];
	transactions: Transaction[];
}

export interface EventVersion {
	v: number;
	ts: string;
	message: string;
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
	opts: { message?: string; author?: string } = {},
): Promise<EventVersion | null> {
	const prevCore = prev ? coreOf(prev) : EMPTY_CORE;
	const delta = differ.diff(prevCore, coreOf(next));
	if (!delta) return null;

	const versions = await listVersions(eventId);
	const v = (versions[versions.length - 1]?.v ?? 0) + 1;
	const version: EventVersion = {
		v,
		ts: new Date().toISOString(),
		message: opts.message || summarizeDelta(delta),
		author: opts.author || '',
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

/** Coarse, storage-cheap message for a save (the detailed diff is computed on demand). */
function summarizeDelta(delta: Delta): string {
	const d = delta as Record<string, unknown>;
	const parts: string[] = [];
	if (d.config) parts.push('event details');
	if (d.members) parts.push('members');
	if (d.transactions) parts.push('transactions');
	return parts.length ? `Updated ${parts.join(', ')}` : 'Updated event';
}

/** Human-readable diff between two reconstructed cores (for the History detail view). */
export function describeChange(before: VersionedCore, after: VersionedCore): string[] {
	const lines: string[] = [];

	if (before.config?.name !== after.config?.name) {
		lines.push(`Name: "${before.config?.name ?? ''}" → "${after.config?.name ?? ''}"`);
	}
	if (before.config?.holderId !== after.config?.holderId) {
		const name = after.members.find((m) => m.id === after.config?.holderId)?.name ?? '—';
		lines.push(`Holder → ${name}`);
	}

	diffById(
		before.members,
		after.members,
		(m) => `Added member "${m.name}"`,
		(m) => `Removed member "${m.name}"`,
		(a, b) => (a.name !== b.name ? `Renamed "${a.name}" → "${b.name}"` : null),
		lines,
	);

	diffById(
		before.transactions,
		after.transactions,
		(t) => `Added "${t.description}" ($${t.total})`,
		(t) => `Removed "${t.description}" ($${t.total})`,
		(a, b) => {
			const c: string[] = [];
			if (a.description !== b.description) c.push(`renamed to "${b.description}"`);
			if (a.total !== b.total) c.push(`$${a.total} → $${b.total}`);
			return c.length ? `"${a.description}": ${c.join(', ')}` : null;
		},
		lines,
	);

	return lines.length ? lines : ['No visible changes'];
}

function diffById<T extends { id: string }>(
	before: T[],
	after: T[],
	onAdd: (item: T) => string,
	onRemove: (item: T) => string,
	onChange: (a: T, b: T) => string | null,
	out: string[],
): void {
	const beforeMap = new Map(before.map((x) => [x.id, x]));
	const afterMap = new Map(after.map((x) => [x.id, x]));
	for (const b of before) if (!afterMap.has(b.id)) out.push(onRemove(b));
	for (const a of after) {
		const b = beforeMap.get(a.id);
		if (!b) out.push(onAdd(a));
		else {
			const line = onChange(b, a);
			if (line) out.push(line);
		}
	}
}
