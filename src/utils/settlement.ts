import { round as npRound, plus, minus } from 'number-precision';

import type { Group } from '../types';

export interface MemberBalance {
	memberId: string;
	name: string;
	/** Σ paidBy − Σ paidFor across all transactions. Positive = owed money, negative = owes. */
	balance: number;
}

export interface Transfer {
	fromId: string;
	fromName: string;
	toId: string;
	toName: string;
	amount: number;
}

export interface SettlementResult {
	balances: MemberBalance[];
	transfers: Transfer[];
	/** The top-holder (holds the pooled top-up cash); settlement refunds route through them. */
	holderId: string | null;
}

/** Amounts below this (half a cent) are treated as settled. */
const EPS = 0.005;

// 2-decimal rounding via number-precision (float-drift safe); see utils/transaction.ts.
function round(value: number): number {
	return npRound(value, 2);
}

/**
 * Per-member balance: everything they put in (paidBy, incl. top-ups) minus their
 * share of expenses (paidFor), across every transaction. A top-up is a transaction
 * that only credits its member; a settle-up transfer credits sender / debits recipient.
 */
export function computeBalances(group: Group): MemberBalance[] {
	const members = group.members || [];
	const transactions = group.transactions || [];

	return members.map((member) => {
		let paidBy = 0;
		let paidFor = 0;
		for (const tx of transactions) {
			paidBy = plus(paidBy, tx.paidBy?.[member.id] || 0);
			paidFor = plus(paidFor, tx.paidFor?.[member.id] || 0);
		}
		return { memberId: member.id, name: member.name, balance: round(minus(paidBy, paidFor)) };
	});
}

/** Total money currently held in the pot (sum of all top-up transactions). */
export function topupTotal(group: Group): number {
	return round(
		(group.transactions || []).filter((tx) => tx.type === 'topup').reduce((sum, tx) => plus(sum, tx.total), 0),
	);
}

interface EffectiveEntry {
	id: string;
	name: string;
	amount: number;
}

/**
 * Greedy min-cash-flow: repeatedly settle the largest debtor against the largest
 * creditor. Produces at most n−1 transfers. Assumes amounts sum to ~0.
 */
function minimizeTransfers(entries: EffectiveEntry[]): Transfer[] {
	const creditors = entries
		.filter((e) => e.amount > EPS)
		.map((e) => ({ ...e }))
		.sort((a, b) => b.amount - a.amount);
	const debtors = entries
		.filter((e) => e.amount < -EPS)
		.map((e) => ({ ...e, amount: -e.amount }))
		.sort((a, b) => b.amount - a.amount);

	const transfers: Transfer[] = [];
	let i = 0;
	let j = 0;
	while (i < debtors.length && j < creditors.length) {
		const debtor = debtors[i];
		const creditor = creditors[j];
		const amount = round(Math.min(debtor.amount, creditor.amount));
		if (amount > EPS) {
			transfers.push({ fromId: debtor.id, fromName: debtor.name, toId: creditor.id, toName: creditor.name, amount });
		}
		debtor.amount = round(minus(debtor.amount, amount));
		creditor.amount = round(minus(creditor.amount, amount));
		if (debtor.amount <= EPS) i++;
		if (creditor.amount <= EPS) j++;
	}
	return transfers;
}

/**
 * Compute balances and the fewest transfers to settle the group.
 *
 * The top-holder physically holds the pooled top-up cash, so for the transfer
 * computation their position is offset by −Σtop-ups (they owe the pot back). This
 * makes effective balances sum to zero and routes refunds through the holder. When
 * there are no top-ups the offset is zero and it degrades to plain peer-to-peer
 * fewest-transfers.
 */
export function computeSettlement(group: Group): SettlementResult {
	const members = group.members || [];
	const balances = computeBalances(group);

	if (members.length === 0) {
		return { balances, transfers: [], holderId: null };
	}

	const configured = group.config?.holderId;
	const holderId = configured && members.some((m) => m.id === configured) ? configured : members[0].id;
	const pot = topupTotal(group);

	const effective: EffectiveEntry[] = balances.map((b) => ({
		id: b.memberId,
		name: b.name,
		amount: round(minus(b.balance, b.memberId === holderId ? pot : 0)),
	}));

	return { balances, transfers: minimizeTransfers(effective), holderId };
}
