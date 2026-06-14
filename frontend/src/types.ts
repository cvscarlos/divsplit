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
	/** Pre-funded balance, like a pre-paid card. */
	prepaid: number;
}

export interface Transaction {
	id: string;
	date: string | Date;
	description: string;
	total: number;
	/** Who actually paid, member id -> amount. */
	paidBy: AmountMap;
	/** Who should be charged / consumed, member id -> amount. */
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
