/**
 * Shared domain types for DivSplit.
 *
 * Everything is stored as a single `Group` object per group id in IndexedDB
 * (see `utils/use-api.ts`). These types describe that persisted shape.
 */

/** Maps a member id to a money amount (used by transaction `paidBy` / `paidFor`). */
export type AmountMap = Record<string, number>;

export interface Member {
	id: string;
	name: string;
	/** @deprecated Legacy pre-funded amount; migrated to a `topup` transaction on load. */
	prepaid?: number;
}

/**
 * 'expense' = consumption (the full split form). 'transfer' = money moved between
 * members (a settle-up, or prepaid into the pot) — same shape, simpler entry.
 */
export type TransactionType = 'expense' | 'transfer' | 'topup';

export interface Transaction {
	id: string;
	/** Defaults to 'expense' when absent. */
	type?: TransactionType;
	date: string | Date;
	description: string;
	total: number;
	/** Money in (credit). For a transfer this is the sender, member id -> amount. */
	paidBy: AmountMap;
	/** Money out (debit). For a transfer this is the recipient, member id -> amount. */
	paidFor: AmountMap;
	/** Member ids whose amount the user typed manually (exempt from auto-split). */
	manuallyChanged?: Record<string, boolean>;
	createdAt?: string | Date;
	updatedAt?: string | Date;
}

export interface Activity {
	id: string;
	type: string;
	description: string;
	details: Record<string, unknown>;
	userId: string | null;
	timestamp: string | Date;
}

export interface GroupConfig {
	name?: string;
	/** Member who holds the pooled top-up cash (a holder, not an owner). Defaults to the first member. */
	holderId?: string;
	/** @deprecated Renamed to `holderId`; migrated on load. */
	bankerId?: string;
}

export interface Group {
	config: GroupConfig;
	members?: Member[];
	transactions?: Transaction[];
	activities?: Activity[];
	/** Legacy field present in demo data; the live UI uses `config.name`. */
	header?: { name?: string };
}

export interface GroupListItem {
	id: string;
	name: string;
}
