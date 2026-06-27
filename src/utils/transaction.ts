import type { AmountMap } from '../types';

export interface TransactionInput {
	date: string;
	total: number;
	description: string;
}

export function round(value: number): number {
	return Math.round(value * 100) / 100;
}

const sumAmounts = (m: AmountMap = {}): number => Object.values(m).reduce((sum, v) => sum + v, 0);

/**
 * A transaction is balanced when both sides add up to the total: the payers (`paidBy`)
 * cover it and the consumers (`paidFor`) account for all of it. Cent-rounding tolerated.
 */
export function isTransactionBalanced(total: number, paidBy: AmountMap, paidFor: AmountMap): boolean {
	return round(total - sumAmounts(paidBy)) === 0 && round(total - sumAmounts(paidFor)) === 0;
}

/**
 * Split `cents` across `n` slots as evenly as possible; the sum of the result always equals
 * `cents`. An even amount lands the same on each slot; an indivisible one drops the leftover
 * cents on the first slots (sign-aware, so negatives spread the same way).
 */
export function splitCents(cents: number, n: number): number[] {
	if (n <= 0) return [];
	const step = Math.sign(cents);
	const base = Math.trunc(cents / n);
	let extra = cents - base * n;
	return Array.from({ length: n }, () => {
		const add = base + (extra !== 0 ? step : 0);
		if (extra !== 0) extra -= step;
		return add;
	});
}

/**
 * Distribute `total` across the members present in `amounts`: members the user
 * typed an amount for (flagged in `manual`) keep their value; everyone else
 * splits the leftover equally, with any rounding remainder landing on the last
 * auto member so the column always sums back to `total`.
 */
export function autoSplit(amounts: AmountMap, manual: Record<string, boolean>, total: number): AmountMap {
	const ids = Object.keys(amounts);
	const autoIds = ids.filter((id) => !manual[id]);
	const next: AmountMap = { ...amounts };
	if (autoIds.length === 0) return next;

	const manualSum = ids.filter((id) => manual[id]).reduce((sum, id) => sum + (amounts[id] || 0), 0);
	// Only the non-negative leftover is split; if manual amounts already exceed the
	// total the auto members get 0 (over-allocation surfaces as a negative "remaining").
	const leftover = Math.max(0, total - manualSum);
	const each = round(leftover / autoIds.length);
	autoIds.forEach((id) => (next[id] = each));

	// Land the rounding remainder of the split on the last auto member (within the pool only).
	const diff = round(leftover - each * autoIds.length);
	if (leftover > 0 && diff !== 0) {
		const last = autoIds[autoIds.length - 1];
		next[last] = round(next[last] + diff);
	}
	return next;
}

/**
 * Validate the required transaction fields. Returns a human-readable error
 * message, or null when the input is valid.
 */
export function getTransactionError({ date, total, description }: TransactionInput): string | null {
	if (!date || !total || !description) {
		return 'Please fill in the date, total and description.';
	}
	if (isNaN(new Date(date).getTime())) {
		return 'Please enter a valid date.';
	}
	return null;
}
