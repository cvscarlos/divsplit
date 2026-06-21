import type { AmountMap, Transaction } from '../types';

/** Move a member's amount in one map (paidBy/paidFor) to another member, summing if needed. */
function moveAmount(map: AmountMap, fromId: string, toId: string): AmountMap {
	if (!(fromId in map)) return map;
	const next = { ...map };
	const amount = next[fromId];
	delete next[fromId];
	if (amount) next[toId] = (next[toId] ?? 0) + amount;
	return next;
}

/** True if the member is referenced by any transaction (as payer or consumer). */
export function memberInTransactions(transactions: Transaction[] = [], memberId: string): boolean {
	return transactions.some((t) => memberId in (t.paidBy ?? {}) || memberId in (t.paidFor ?? {}));
}

/** Reassign every reference of `fromId` to `toId` across all transactions. */
export function reassignMember(transactions: Transaction[] = [], fromId: string, toId: string): Transaction[] {
	return transactions.map((t) => ({
		...t,
		paidBy: moveAmount(t.paidBy ?? {}, fromId, toId),
		paidFor: moveAmount(t.paidFor ?? {}, fromId, toId),
	}));
}
