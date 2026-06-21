import { describe, it, expect } from 'vitest';

import type { Group, Transaction } from '../types';
import { computeBalances, computeSettlement, topupTotal, type Transfer } from './settlement';

const member = (id: string) => ({ id, name: id.toUpperCase() });

const topup = (id: string, m: string, amount: number): Transaction => ({
	id,
	type: 'topup',
	date: '2026-01-01',
	description: 'Top up',
	total: amount,
	paidBy: { [m]: amount },
	paidFor: {},
});

const expense = (id: string, paidBy: Record<string, number>, paidFor: Record<string, number>): Transaction => ({
	id,
	date: '2026-01-01',
	description: 'x',
	total: Object.values(paidBy).reduce((s, v) => s + v, 0),
	paidBy,
	paidFor,
});

const transfer = (id: string, from: string, to: string, amount: number): Transaction => ({
	id,
	type: 'transfer',
	date: '2026-01-01',
	description: 'Settle up',
	total: amount,
	paidBy: { [from]: amount },
	paidFor: { [to]: amount },
});

const netTransfer = (transfers: Transfer[], id: string) =>
	Math.round(
		transfers.reduce((net, t) => net + (t.toId === id ? t.amount : 0) - (t.fromId === id ? t.amount : 0), 0) * 100,
	) / 100;

describe('computeBalances', () => {
	it('sums paidBy minus paidFor across all transactions (top-up credits its member)', () => {
		const g: Group = {
			config: {},
			members: [member('a'), member('b')],
			transactions: [expense('e1', { a: 100 }, { a: 50, b: 50 }), topup('t1', 'a', 30)],
		};
		const byId = Object.fromEntries(computeBalances(g).map((b) => [b.memberId, b.balance]));
		expect(byId).toEqual({ a: 80, b: -50 });
	});
});

describe('topupTotal', () => {
	it('sums only top-up transactions', () => {
		const g: Group = {
			config: {},
			members: [member('a'), member('b')],
			transactions: [topup('t1', 'a', 100), topup('t2', 'b', 50), expense('e1', { a: 20 }, { a: 10, b: 10 })],
		};
		expect(topupTotal(g)).toBe(150);
	});
});

describe('computeSettlement', () => {
	it('refunds each member their top-up when nothing is spent (holder is the hub)', () => {
		const g: Group = {
			config: { holderId: 'a' },
			members: [member('a'), member('b'), member('c')],
			transactions: [topup('t1', 'b', 100), topup('t2', 'c', 50)],
		};
		expect(computeSettlement(g).transfers).toEqual([
			{ fromId: 'a', fromName: 'A', toId: 'b', toName: 'B', amount: 100 },
			{ fromId: 'a', fromName: 'A', toId: 'c', toName: 'C', amount: 50 },
		]);
	});

	it('holder refunds unused top-ups and out-of-pocket spend after expenses', () => {
		const g: Group = {
			config: { holderId: 'a' },
			members: [member('a'), member('b'), member('c')],
			transactions: [
				topup('t1', 'a', 100),
				topup('t2', 'b', 100),
				topup('t3', 'c', 100),
				expense('e1', { b: 90 }, { a: 30, b: 30, c: 30 }), // B paid the street food out of pocket
			],
		};
		const { transfers } = computeSettlement(g);
		// A holds the 300 pot: effective A −230, B +160, C +70.
		expect(netTransfer(transfers, 'a')).toBeCloseTo(-230, 2);
		expect(netTransfer(transfers, 'b')).toBeCloseTo(160, 2);
		expect(netTransfer(transfers, 'c')).toBeCloseTo(70, 2);
		expect(transfers.every((t) => t.fromId === 'a')).toBe(true); // holder is the hub
	});

	it('falls back to plain fewest-transfers when there are no top-ups', () => {
		const g: Group = {
			config: {},
			members: [member('a'), member('b')],
			transactions: [expense('e1', { a: 100 }, { a: 50, b: 50 })],
		};
		expect(computeSettlement(g).transfers).toEqual([
			{ fromId: 'b', fromName: 'B', toId: 'a', toName: 'A', amount: 50 },
		]);
	});

	it('settles everyone once the suggested refund transfers are recorded', () => {
		const base: Group = {
			config: { holderId: 'a' },
			members: [member('a'), member('b'), member('c')],
			transactions: [topup('t1', 'b', 100), topup('t2', 'c', 50)],
		};
		const withRefunds: Group = {
			...base,
			transactions: [...base.transactions!, transfer('r1', 'a', 'b', 100), transfer('r2', 'a', 'c', 50)],
		};
		expect(computeSettlement(withRefunds).transfers).toEqual([]);
	});

	it('defaults the holder to the first member when holderId is unset', () => {
		const g: Group = { config: {}, members: [member('a'), member('b')], transactions: [topup('t1', 'b', 10)] };
		expect(computeSettlement(g).holderId).toBe('a');
	});

	it('returns no transfers and no holder for an empty group', () => {
		const result = computeSettlement({ config: {} });
		expect(result).toEqual({ balances: [], transfers: [], holderId: null });
	});

	it('produces at most n-1 transfers for a 10-member group', () => {
		const members = Array.from({ length: 10 }, (_, i) => member(`m${i}`));
		const transactions = members.slice(1).map((m, i) => topup(`t${i}`, m.id, 10));
		const g: Group = { config: { holderId: 'm0' }, members, transactions };
		expect(computeSettlement(g).transfers.length).toBeLessThanOrEqual(9);
	});
});
