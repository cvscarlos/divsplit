import { describe, it, expect } from 'vitest';

import type { Group, Transaction } from '../types';
import { computeBalances, computeSettlement, type Transfer } from './settlement';

function netTransfer(transfers: Transfer[], memberId: string): number {
	let net = 0;
	for (const t of transfers) {
		if (t.toId === memberId) net += t.amount;
		if (t.fromId === memberId) net -= t.amount;
	}
	return Math.round(net * 100) / 100;
}

function balanceOf(group: Group, memberId: string): number {
	return computeBalances(group).find((b) => b.memberId === memberId)!.balance;
}

// The worked example from the design spec.
const beachTrip: Group = {
	config: { name: 'Beach Trip', bankerId: 'alice' },
	members: [
		{ id: 'alice', name: 'Alice', prepaid: 100 },
		{ id: 'bob', name: 'Bob', prepaid: 0 },
		{ id: 'carol', name: 'Carol', prepaid: 50 },
	],
	transactions: [
		{
			id: 't1',
			date: '2026-06-14',
			description: 'Dinner',
			total: 120,
			paidBy: { carol: 120 },
			paidFor: { alice: 40, bob: 40, carol: 40 },
		},
	],
};

describe('computeBalances', () => {
	it('computes prepaid + paidBy - paidFor per member', () => {
		const balances = computeBalances(beachTrip);
		const byId = Object.fromEntries(balances.map((b) => [b.memberId, b.balance]));
		expect(byId).toEqual({ alice: 60, bob: -40, carol: 130 });
	});

	it('includes the member name', () => {
		const alice = computeBalances(beachTrip).find((b) => b.memberId === 'alice');
		expect(alice?.name).toBe('Alice');
	});
});

describe('computeSettlement', () => {
	it('settles every member to their fair share (banker holds the prepaid pot)', () => {
		const { transfers, bankerId } = computeSettlement(beachTrip);
		const pot = 150; // sum of prepaid
		for (const m of beachTrip.members!) {
			const effective = balanceOf(beachTrip, m.id) - (m.id === bankerId ? pot : 0);
			// Each member's net cash movement must equal their effective balance.
			expect(netTransfer(transfers, m.id)).toBeCloseTo(effective, 2);
		}
	});

	it('exposes net balances (post-banker) that sum to zero and match the transfers', () => {
		const { netBalances, transfers } = computeSettlement(beachTrip);
		const sum = netBalances.reduce((acc, b) => acc + b.balance, 0);
		expect(Math.abs(sum)).toBeLessThan(0.005);
		for (const nb of netBalances) {
			expect(netTransfer(transfers, nb.memberId)).toBeCloseTo(nb.balance, 2);
		}
	});

	it('produces at most n-1 transfers with positive amounts', () => {
		const { transfers } = computeSettlement(beachTrip);
		expect(transfers.length).toBeLessThanOrEqual(beachTrip.members!.length - 1);
		expect(transfers.every((t) => t.amount > 0)).toBe(true);
	});

	it('returns no transfers when everyone is already even', () => {
		const even: Group = {
			config: { bankerId: 'a' },
			members: [
				{ id: 'a', name: 'A', prepaid: 0 },
				{ id: 'b', name: 'B', prepaid: 0 },
			],
			transactions: [
				{
					id: 't1',
					date: '2026-01-01',
					description: 'x',
					total: 100,
					paidBy: { a: 50, b: 50 },
					paidFor: { a: 50, b: 50 },
				},
			],
		};
		expect(computeSettlement(even).transfers).toEqual([]);
	});

	it('handles a single payer and single ower', () => {
		const g: Group = {
			config: { bankerId: 'a' },
			members: [
				{ id: 'a', name: 'A', prepaid: 0 },
				{ id: 'b', name: 'B', prepaid: 0 },
			],
			transactions: [
				{
					id: 't1',
					date: '2026-01-01',
					description: 'x',
					total: 100,
					paidBy: { a: 100 },
					paidFor: { a: 50, b: 50 },
				},
			],
		};
		expect(computeSettlement(g).transfers).toEqual([
			{ fromId: 'b', fromName: 'B', toId: 'a', toName: 'A', amount: 50 },
		]);
	});

	it('keeps cents balanced with non-even splits (no phantom transfers)', () => {
		const g: Group = {
			config: { bankerId: 'a' },
			members: [
				{ id: 'a', name: 'A', prepaid: 0 },
				{ id: 'b', name: 'B', prepaid: 0 },
				{ id: 'c', name: 'C', prepaid: 0 },
			],
			transactions: [
				{
					id: 't1',
					date: '2026-01-01',
					description: 'x',
					total: 100,
					paidBy: { a: 100 },
					paidFor: { a: 33.33, b: 33.33, c: 33.34 },
				},
			],
		};
		const { transfers } = computeSettlement(g);
		expect(transfers.every((t) => t.amount > 0)).toBe(true);
		// Every member ends within a cent of their effective balance.
		for (const m of g.members!) {
			const effective = balanceOf(g, m.id) - (m.id === 'a' ? 0 : 0);
			expect(netTransfer(transfers, m.id)).toBeCloseTo(effective, 2);
		}
	});

	it('defaults the banker to the first member when bankerId is unset', () => {
		const g: Group = {
			config: {},
			members: [
				{ id: 'a', name: 'A', prepaid: 0 },
				{ id: 'b', name: 'B', prepaid: 0 },
			],
			transactions: [],
		};
		expect(computeSettlement(g).bankerId).toBe('a');
	});

	it('does not throw and returns no transfers for an empty group', () => {
		const empty: Group = { config: {} };
		const result = computeSettlement(empty);
		expect(result.transfers).toEqual([]);
		expect(result.balances).toEqual([]);
	});

	it('produces at most n-1 transfers for a 10-member group', () => {
		const members = Array.from({ length: 10 }, (_, i) => ({ id: `m${i}`, name: `M${i}`, prepaid: 0 }));
		const paidFor = Object.fromEntries(members.map((m) => [m.id, 10]));
		const g: Group = {
			config: { bankerId: 'm0' },
			members,
			transactions: [{ id: 't1', date: '2026-01-01', description: 'x', total: 100, paidBy: { m0: 100 }, paidFor }],
		};
		const { transfers } = computeSettlement(g);
		expect(transfers.length).toBeLessThanOrEqual(9);
	});
});

describe('settle-up transfers (stored as transactions)', () => {
	// A transfer: sender on paidBy (credit), recipient on paidFor (debit).
	const transfer = (id: string, from: string, to: string, amount: number): Transaction => ({
		id,
		type: 'transfer',
		date: '2026-06-15',
		description: 'Settle up',
		total: amount,
		paidBy: { [from]: amount },
		paidFor: { [to]: amount },
	});

	const singlePayer: Group = {
		config: { bankerId: 'a' },
		members: [
			{ id: 'a', name: 'A', prepaid: 0 },
			{ id: 'b', name: 'B', prepaid: 0 },
		],
		transactions: [
			{ id: 't1', date: '2026-01-01', description: 'x', total: 100, paidBy: { a: 100 }, paidFor: { a: 50, b: 50 } },
		],
	};

	it('folds a transfer into balances: payer up, payee down', () => {
		const g: Group = { ...singlePayer, transactions: [...singlePayer.transactions!, transfer('p1', 'b', 'a', 50)] };
		const byId = Object.fromEntries(computeBalances(g).map((b) => [b.memberId, b.balance]));
		expect(byId).toEqual({ a: 0, b: 0 });
	});

	it('settles everyone once the suggested transfers are recorded as transfers', () => {
		const withTransfers: Group = {
			...beachTrip,
			transactions: [
				...beachTrip.transactions!,
				transfer('p1', 'bob', 'carol', 40),
				transfer('p2', 'alice', 'carol', 90),
			],
		};
		expect(computeSettlement(withTransfers).transfers).toEqual([]);
	});

	it('a partial transfer reduces but does not clear the debt', () => {
		const g: Group = { ...singlePayer, transactions: [...singlePayer.transactions!, transfer('p1', 'b', 'a', 20)] };
		expect(computeSettlement(g).transfers).toEqual([
			{ fromId: 'b', fromName: 'B', toId: 'a', toName: 'A', amount: 30 },
		]);
	});
});
