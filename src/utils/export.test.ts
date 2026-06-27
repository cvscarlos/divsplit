import { describe, it, expect } from 'vitest';

import { eventToTsv } from './export';
import type { Group } from '../types';

// Fake translator: returns the key, so assertions are language-agnostic.
const t = (k: string) => k;

const group: Group = {
	config: { name: 'Trip' },
	members: [
		{ id: 'a', name: 'Ana' },
		{ id: 'b', name: 'Bob' },
	],
	transactions: [
		{ id: 'tp', type: 'topup', date: '2026-06-01', description: 'Prepaid', total: 50, paidBy: { a: 50 }, paidFor: {} },
		{ id: 't1', date: '2026-06-02', description: 'Dinner', total: 40, paidBy: { a: 40 }, paidFor: { a: 20, b: 20 } },
	],
};

describe('eventToTsv', () => {
	const tsv = eventToTsv(group, t, 'en');
	const lines = tsv.split('\n');

	it('has the three sections', () => {
		expect(tsv).toContain('TOP_UPS');
		expect(tsv).toContain('BALANCES');
		expect(tsv).toContain('TRANSACTIONS');
	});

	it('puts each top-up under its member in the prepaid row', () => {
		const prepaidRow = lines[lines.indexOf(`TOP_UPS\tAna\tBob`) + 1];
		expect(prepaidRow).toBe('\t50.00\t0.00'); // Ana prepaid 50, Bob 0
	});

	it('renders a transaction row: total, who-paid, split flags, and each share', () => {
		const row = lines.find((l) => l.startsWith('Dinner\t'));
		// Dinner | 40 | date | paidBy(Ana,Bob) | split(Ana,Bob) | share(Ana,Bob)
		expect(row).toContain('Dinner\t40.00\t');
		expect(row).toContain('\t40.00\t\t'); // Ana paid 40, Bob paid nothing
		expect(row).toContain('TRUE\tTRUE'); // both consumed
		expect(row?.endsWith('20.00\t20.00')).toBe(true); // each owes 20
	});

	it('excludes top-ups from the transactions list', () => {
		expect(lines.some((l) => l.startsWith('Prepaid\t'))).toBe(false);
	});
});
