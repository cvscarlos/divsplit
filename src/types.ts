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

export interface GroupConfig {
	name?: string;
	/** Chosen emoji icon for the event (shown on its card). */
	icon?: string;
	/** Member who holds the pooled top-up cash (a holder, not an owner). Defaults to the first member. */
	holderId?: string;
	/** @deprecated Renamed to `holderId`; migrated on load. */
	bankerId?: string;
}

/** The versioned root keys of a group, each carrying an offline-first last-modified stamp. */
export type RootKey = 'config' | 'members' | 'transactions';

export interface Group {
	config: GroupConfig;
	members?: Member[];
	transactions?: Transaction[];
	/**
	 * Device-generated (ms) timestamp of the last local change to each root key. Used for
	 * per-key last-writer-wins on sync, so a stale or empty server value never clobbers a
	 * newer local one. Not part of the versioned core — metadata only.
	 */
	keyUpdatedAt?: Partial<Record<RootKey, number>>;
}

export interface GroupListItem {
	id: string;
	name: string;
	icon?: string;
}
