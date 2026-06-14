export interface TransactionInput {
	date: string;
	total: number;
	description: string;
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
