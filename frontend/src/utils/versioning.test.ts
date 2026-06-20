import { describe, it, expect } from 'vitest';
import { create } from 'jsondiffpatch';

import { describeChange, reconstructCore } from './versioning';
import type { EventVersion, VersionedCore } from './versioning';

const differ = create({ objectHash: (o: unknown) => (o as { id?: string })?.id ?? JSON.stringify(o) });

function core(partial: Partial<VersionedCore>): VersionedCore {
	return { config: {}, members: [], transactions: [], ...partial };
}

const tx = (id: string, description: string, total: number) => ({
	id,
	description,
	total,
	date: '',
	paidBy: {},
	paidFor: {},
});

describe('describeChange', () => {
	it('reports an event name change', () => {
		const lines = describeChange(core({ config: { name: 'A' } }), core({ config: { name: 'B' } }));
		expect(lines).toContain('Name: "A" → "B"');
	});

	it('reports member add, remove and rename', () => {
		const a = core({ members: [{ id: '1', name: 'Ana' }] });
		const b = core({
			members: [
				{ id: '1', name: 'Ana Maria' },
				{ id: '2', name: 'Bruno' },
			],
		});
		const lines = describeChange(a, b);
		expect(lines).toContain('Renamed "Ana" → "Ana Maria"');
		expect(lines).toContain('Added member "Bruno"');
		expect(describeChange(a, core({ members: [] }))).toContain('Removed member "Ana"');
	});

	it('reports transaction add and amount edit', () => {
		const a = core({ transactions: [tx('t1', 'Dinner', 80)] });
		const b = core({ transactions: [tx('t1', 'Dinner', 100)] });
		expect(describeChange(a, b).join(' ')).toContain('$80 → $100');
		expect(describeChange(core({}), a)).toContain('Added "Dinner" ($80)');
	});

	it('says no visible changes when the cores are equal', () => {
		expect(describeChange(core({}), core({}))).toEqual(['No visible changes']);
	});
});

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
		const versions: EventVersion[] = [
			{ v: 1, ts: '', message: '', author: '', delta: differ.diff(a, b)! },
			{ v: 2, ts: '', message: '', author: '', delta: differ.diff(b, c)! },
		];

		expect(reconstructCore(c, versions, 2)).toEqual(c); // head — unchanged
		expect(reconstructCore(c, versions, 1)).toEqual(b);
		expect(reconstructCore(c, versions, 0)).toEqual(a); // genesis
	});
});
