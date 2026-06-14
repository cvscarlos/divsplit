import type { Group } from '../types';

export interface MemberBalance {
	memberId: string;
	name: string;
	/** prepaid + paidBy − paidFor. Positive = owed money, negative = owes. */
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
	/** Raw position per member: prepaid + paidBy − paidFor. */
	balances: MemberBalance[];
	/** Net position after the banker absorbs the prepaid pot; sums to ~0 and matches `transfers`. */
	netBalances: MemberBalance[];
	transfers: Transfer[];
	bankerId: string | null;
}

/** Amounts below this (half a cent) are treated as settled. */
const EPS = 0.005;

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

/**
 * Per-member balance: prepaid + everything they paid (paidBy) − everything they
 * should be charged (paidFor), summed across all transactions.
 */
export function computeBalances(group: Group): MemberBalance[] {
	const members = group.members ?? [];
	const transactions = group.transactions ?? [];

	// Both expenses and transfers are transactions: paidBy is money in (credit),
	// paidFor is money out (debit). A settle-up transfer therefore folds in for free
	// (the payer is paidBy, the recipient is paidFor).
	return members.map((member) => {
		let paidBy = 0;
		let paidFor = 0;
		for (const tx of transactions) {
			paidBy += tx.paidBy?.[member.id] ?? 0;
			paidFor += tx.paidFor?.[member.id] ?? 0;
		}
		return {
			memberId: member.id,
			name: member.name,
			balance: round((member.prepaid ?? 0) + paidBy - paidFor),
		};
	});
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
			transfers.push({
				fromId: debtor.id,
				fromName: debtor.name,
				toId: creditor.id,
				toName: creditor.name,
				amount,
			});
		}
		debtor.amount = round(debtor.amount - amount);
		creditor.amount = round(creditor.amount - amount);
		if (debtor.amount <= EPS) i++;
		if (creditor.amount <= EPS) j++;
	}
	return transfers;
}

/**
 * Compute balances and the fewest transfers to settle the group. The banker
 * holds the prepaid pot (Σ prepaid), so their effective balance is reduced by
 * it — which makes effective balances sum to zero and settle peer-to-peer.
 */
export function computeSettlement(group: Group): SettlementResult {
	const members = group.members ?? [];
	const balances = computeBalances(group);

	if (members.length === 0) {
		return { balances, netBalances: [], transfers: [], bankerId: null };
	}

	const configuredBanker = group.config?.bankerId;
	const bankerId =
		configuredBanker && members.some((m) => m.id === configuredBanker) ? configuredBanker : members[0].id;

	const pot = members.reduce((sum, m) => sum + (m.prepaid ?? 0), 0);

	const effective: EffectiveEntry[] = balances.map((b) => ({
		id: b.memberId,
		name: b.name,
		amount: round(b.balance - (b.memberId === bankerId ? pot : 0)),
	}));

	const netBalances: MemberBalance[] = effective.map((e) => ({
		memberId: e.id,
		name: e.name,
		balance: e.amount,
	}));

	return { balances, netBalances, transfers: minimizeTransfers(effective), bankerId };
}
