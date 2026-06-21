import { describe, it, expect } from 'vitest';
import { create } from 'jsondiffpatch';

import { reconstructCore } from './versioning';
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
