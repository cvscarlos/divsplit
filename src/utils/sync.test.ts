import { describe, it, expect } from 'vitest';

import { remoteChangesToVersions, mergeByKey } from './sync';
import type { Group } from '../types';

describe('mergeByKey (per-key last-writer-wins — the sync regression guard)', () => {
	// Transactions/members are opaque to the merge, so the test uses minimal stand-ins.
	const local = (over: Record<string, unknown>): Group =>
		({ config: {}, members: [], transactions: [], ...over }) as Group;

	it('takes every cloud key for a fresh visitor with no local data', () => {
		const cloud = {
			config: { name: 'Trip' },
			members: [{ id: 'm1', name: 'Ana' }],
			transactions: [{ id: 't1' }],
			keyUpdatedAt: { config: 5, members: 5, transactions: 5 },
		};
		const { merged, serverBehind } = mergeByKey(null, cloud);
		expect(merged.config).toEqual({ name: 'Trip' });
		expect(merged.members).toEqual([{ id: 'm1', name: 'Ana' }]);
		expect(serverBehind).toBe(false);
	});

	it('keeps a newer local key over a stale cloud read (the friend-name / replica-lag bug)', () => {
		const prev = local({ config: { name: 'My Trip' }, keyUpdatedAt: { config: 100 } });
		// Cloud is behind for config (older stamp, empty name) — must NOT clobber local.
		const { merged, serverBehind } = mergeByKey(prev, { config: {}, keyUpdatedAt: { config: 50 } });
		expect(merged.config).toEqual({ name: 'My Trip' });
		expect(serverBehind).toBe(true); // server is behind → caller re-pushes
	});

	it('takes the cloud key when the server stamp is strictly newer', () => {
		const prev = local({ config: { name: 'old' }, keyUpdatedAt: { config: 100 } });
		const { merged, serverBehind } = mergeByKey(prev, { config: { name: 'new' }, keyUpdatedAt: { config: 200 } });
		expect(merged.config).toEqual({ name: 'new' });
		expect(serverBehind).toBe(false);
	});

	it('keeps local on equal stamps and does not flag the server behind (no ping-pong)', () => {
		const prev = local({ transactions: [{ id: 't1' }], keyUpdatedAt: { transactions: 100 } });
		const { merged, serverBehind } = mergeByKey(prev, {
			transactions: [{ id: 't1' }],
			keyUpdatedAt: { transactions: 100 },
		});
		expect(merged.transactions).toEqual([{ id: 't1' }]);
		expect(serverBehind).toBe(false);
	});

	it('merges keys independently — keep newer-local config, take newer-cloud transactions', () => {
		const prev = local({
			config: { name: 'mine' },
			transactions: [],
			keyUpdatedAt: { config: 300, transactions: 100 },
		});
		const cloud = {
			config: { name: 'stale' },
			transactions: [{ id: 't9' }],
			keyUpdatedAt: { config: 200, transactions: 400 },
		};
		const { merged, serverBehind } = mergeByKey(prev, cloud);
		expect(merged.config).toEqual({ name: 'mine' }); // local newer
		expect(merged.transactions).toEqual([{ id: 't9' }]); // cloud newer
		expect(serverBehind).toBe(true); // config is ahead locally
	});
});

describe('remoteChangesToVersions', () => {
	it('maps the server change log to ordered local versions (summary → changes)', () => {
		const versions = remoteChangesToVersions([
			{ _id: 'a', ts: '2026-06-01T00:00:00.000Z', author: 'Ana', summary: [{ key: 'EVENT_CREATED' }], delta: {} },
			{ _id: 'b', ts: '2026-06-02T00:00:00.000Z', author: 'Bo', summary: [{ key: 'TX_ADDED' }], delta: {} },
		]);

		expect(versions.map((v) => v.v)).toEqual([1, 2]);
		expect(versions.map((v) => v.id)).toEqual(['a', 'b']);
		expect(versions[1].author).toBe('Bo');
		expect(versions[1].changes).toEqual([{ key: 'TX_ADDED' }]);
	});

	it('defaults a missing summary/author to empty', () => {
		const [v] = remoteChangesToVersions([{ _id: 'x', ts: '2026-06-01T00:00:00.000Z' }]);
		expect(v.changes).toEqual([]);
		expect(v.author).toBe('');
	});
});
