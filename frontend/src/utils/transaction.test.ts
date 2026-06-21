import { describe, it, expect } from 'vitest';

import { getTransactionError, autoSplit } from './transaction';

describe('getTransactionError', () => {
	it('returns null when date, total and description are all present and valid', () => {
		expect(getTransactionError({ date: '2026-06-14', total: 120, description: 'Dinner' })).toBeNull();
	});

	it('flags missing required fields', () => {
		expect(getTransactionError({ date: '', total: 120, description: 'Dinner' })).toMatch(/date|total|description/i);
		expect(getTransactionError({ date: '2026-06-14', total: 0, description: 'Dinner' })).toMatch(
			/date|total|description/i,
		);
		expect(getTransactionError({ date: '2026-06-14', total: 120, description: '' })).toMatch(/date|total|description/i);
	});

	it('flags an unparseable date', () => {
		expect(getTransactionError({ date: 'not-a-date', total: 120, description: 'Dinner' })).toMatch(/valid date/i);
	});
});

describe('autoSplit', () => {
	it('splits the whole total across auto members equally', () => {
		expect(autoSplit({ a: 0, b: 0 }, {}, 40)).toEqual({ a: 20, b: 20 });
	});

	it('gives a single auto member the full total (so it stays checked, not 0)', () => {
		// Regression: a freshly checked sole member must receive the total, not 0.
		expect(autoSplit({ a: 0 }, {}, 40)).toEqual({ a: 40 });
	});

	it('keeps a manually-entered amount and splits only the leftover', () => {
		// Regression: with one manual member, "remaining" must reflect the gap, not 0.
		expect(autoSplit({ a: 20, b: 0 }, { a: true }, 40)).toEqual({ a: 20, b: 20 });
		expect(autoSplit({ a: 20 }, { a: true }, 40)).toEqual({ a: 20 }); // leftover stays unassigned → remaining 20
	});

	it('lands the rounding remainder on the last auto member so the column sums to total', () => {
		const split = autoSplit({ a: 0, b: 0, c: 0 }, {}, 10);
		expect(Object.values(split).reduce((s, v) => s + v, 0)).toBe(10);
	});

	it('never assigns a negative share when manual amounts exceed the total', () => {
		expect(autoSplit({ a: 50, b: 0 }, { a: true }, 40)).toEqual({ a: 50, b: 0 });
	});
});
