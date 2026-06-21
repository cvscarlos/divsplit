import { describe, it, expect } from 'vitest';
import { create } from 'jsondiffpatch';

import { reconstructCore, shouldConsolidate } from './versioning';
import type { EventVersion, VersionedCore } from './versioning';

const differ = create({ objectHash: (o: unknown) => (o as { id?: string })?.id ?? JSON.stringify(o) });

function core(partial: Partial<VersionedCore>): VersionedCore {
	return { config: {}, members: [], transactions: [], ...partial };
}

function version(v: number, before: VersionedCore, after: VersionedCore): EventVersion {
	return { v, ts: '', changes: [], author: '', delta: differ.diff(before, after)! };
}

describe('reconstructCore', () => {
	it('reverse-applies deltas back to any earlier version', () => {
		const a = core({ config: { name: 'A' }, members: [{ id: '1', name: 'Ana' }] });
		const b = core({ config: { name: 'B' }, members: [{ id: '1', name: 'Ana' }] });
		const c = core({
			config: { name: 'C' },
			members: [
				{ id: '1', name: 'Ana' },
				{ id: '2', name: 'Bruno' },
			],
		});
		const versions: EventVersion[] = [version(1, a, b), version(2, b, c)];

		expect(reconstructCore(c, versions, 2)).toEqual(c); // head — unchanged
		expect(reconstructCore(c, versions, 1)).toEqual(b);
		expect(reconstructCore(c, versions, 0)).toEqual(a); // genesis
	});
});

describe('shouldConsolidate', () => {
	const now = 1_000_000;
	const recent = (): EventVersion => ({
		v: 1,
		ts: new Date(now - 1000).toISOString(),
		changes: [{ key: 'TX_ADDED' }],
		author: 'Ana',
		delta: {},
	});

	it('folds a recent same-author normal edit into the last version', () => {
		expect(shouldConsolidate(recent(), [{ key: 'TX_UPDATED' }], 'Ana', false, now)).toBe(true);
	});

	it('never folds a destructive change, so the pre-delete state stays restorable', () => {
		// Regression: deleting a transaction must create its own version to restore from.
		expect(shouldConsolidate(recent(), [{ key: 'TX_REMOVED' }], 'Ana', false, now)).toBe(false);
		expect(shouldConsolidate(recent(), [{ key: 'MEMBER_REMOVED' }], 'Ana', false, now)).toBe(false);
	});

	it('never folds a standalone change (e.g. a restore)', () => {
		expect(shouldConsolidate(recent(), [], 'Ana', true, now)).toBe(false);
	});

	it('does not fold across a different author or outside the time window', () => {
		expect(shouldConsolidate(recent(), [{ key: 'TX_UPDATED' }], 'Bob', false, now)).toBe(false);
		expect(shouldConsolidate(recent(), [{ key: 'TX_UPDATED' }], 'Ana', false, now + 10 * 60 * 1000)).toBe(false);
	});

	it('does not fold when there is no prior version', () => {
		expect(shouldConsolidate(undefined, [{ key: 'TX_ADDED' }], 'Ana', false, now)).toBe(false);
	});
});
