import type { Group } from '../types';
import { computeSettlement } from './settlement';

/**
 * Export an event to TSV — data portability, "free to leave". Three sections so the
 * (potentially long) transaction list stays last:
 *   1. Prepaid (top-ups) per member
 *   2. Balances per member
 *   3. Transactions — the spreadsheet-style split table (who paid / split among / each owes)
 *
 * Numbers and dates follow the active language so it pastes cleanly into a localized sheet.
 */
type Translate = (key: string) => string;
const TAB = '\t';

function money(n: number, lng: string): string {
	const locale = lng.startsWith('pt') ? 'pt-BR' : 'en-US';
	return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
}
function dateStr(d: string | Date, lng: string): string {
	const date = new Date(d);
	return isNaN(date.getTime()) ? '' : date.toLocaleDateString(lng.startsWith('pt') ? 'pt-BR' : 'en-US');
}

export function eventToTsv(group: Group, t: Translate, lng: string): string {
	const members = group.members ?? [];
	const names = members.map((m) => m.name);
	const txns = group.transactions ?? [];
	const blanks = Array(Math.max(0, members.length - 1)).fill('');

	// Section 1 — prepaid (sum of each member's top-ups).
	const prepaid: Record<string, number> = {};
	for (const tx of txns) {
		if (tx.type !== 'topup') continue;
		for (const [id, amt] of Object.entries(tx.paidBy)) prepaid[id] = (prepaid[id] || 0) + amt;
	}

	// Section 2 — balances.
	const balanceById = new Map(computeSettlement(group).balances.map((b) => [b.memberId, b.balance]));

	// Section 3 — everything that isn't a top-up (expenses + recorded transfers).
	const rows = txns.filter((tx) => tx.type !== 'topup');

	const lines: string[] = [];
	lines.push(`DivSplit — ${group.config?.name || t('UNTITLED_EVENT')}`);
	lines.push('');

	lines.push([t('TOP_UPS'), ...names].join(TAB));
	lines.push(['', ...members.map((m) => money(prepaid[m.id] || 0, lng))].join(TAB));
	lines.push('');

	lines.push([t('BALANCES'), ...names].join(TAB));
	lines.push(['', ...members.map((m) => money(balanceById.get(m.id) || 0, lng))].join(TAB));
	lines.push('');

	lines.push(t('TRANSACTIONS'));
	lines.push(
		[
			t('DESCRIPTION'),
			t('AMOUNT'),
			t('DATE'),
			t('EXPORT_WHO_PAID'),
			...blanks,
			t('EXPORT_SPLIT_AMONG'),
			...blanks,
			t('EXPORT_EACH_OWES'),
			...blanks,
		].join(TAB),
	);
	lines.push(['', '', '', ...names, ...names, ...names].join(TAB));
	for (const tx of rows) {
		const paidBy = members.map((m) => (tx.paidBy?.[m.id] ? money(tx.paidBy[m.id], lng) : ''));
		const split = members.map((m) => (tx.paidFor && m.id in tx.paidFor ? 'TRUE' : 'FALSE'));
		const share = members.map((m) => (tx.paidFor && m.id in tx.paidFor ? money(tx.paidFor[m.id] || 0, lng) : ''));
		lines.push([tx.description, money(tx.total, lng), dateStr(tx.date, lng), ...paidBy, ...split, ...share].join(TAB));
	}

	return lines.join('\n');
}

/** Trigger a browser download of the given text as a .tsv file. */
export function downloadTsv(filename: string, content: string): void {
	const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
