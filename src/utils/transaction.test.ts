import { describe, it, expect } from 'vitest';

import { getTransactionError, autoSplit, isTransactionBalanced } from './transaction';

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

describe('isTransactionBalanced', () => {
	it('is balanced when both sides sum to the total', () => {
		expect(isTransactionBalanced(40, { a: 40 }, { a: 20, b: 20 })).toBe(true);
	});

	it('flags a few cents left unassigned on the consumed side', () => {
		// Regression: 236,55 split into 7×33,79 = 236,53 leaves 0,02 → invalid.
		expect(
			isTransactionBalanced(
				236.55,
				{ a: 236.55 },
				{ a: 33.79, b: 33.79, c: 33.79, d: 33.79, e: 33.79, f: 33.79, g: 33.79 },
			),
		).toBe(false);
	});

	it('flags when nobody paid or nobody consumed', () => {
		expect(isTransactionBalanced(40, {}, { a: 40 })).toBe(false);
		expect(isTransactionBalanced(40, { a: 40 }, {})).toBe(false);
	});
});
