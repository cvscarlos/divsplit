/**
 * Format a value as currency: always 2 decimals, with the active language's
 * grouping/decimal separators (pt-BR uses "." thousands and "," decimals).
 * The "$" symbol is kept to match the rest of the UI.
 */
export function formatMoney(value: number, lng = 'en'): string {
	const locale = lng.startsWith('pt') ? 'pt-BR' : 'en-US';
	const n = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
	return `$${n}`;
}
