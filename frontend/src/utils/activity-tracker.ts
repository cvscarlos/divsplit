import type { Activity, Group, Member, Transaction } from '../types';
import { generateId } from './id';

/**
 * Activity types for tracking changes
 */
export const ACTIVITY_TYPES = {
	// Group activities
	GROUP_CREATED: 'group_created',
	GROUP_UPDATED: 'group_updated',
	MEMBER_CREATED: 'member_created',
	MEMBER_UPDATED: 'member_updated',
	MEMBER_DELETED: 'member_deleted',

	// Transaction activities
	TRANSACTION_CREATED: 'transaction_created',
	TRANSACTION_UPDATED: 'transaction_updated',
	TRANSACTION_DELETED: 'transaction_deleted',

	// Settle-up transfer activities
	TRANSFER_RECORDED: 'transfer_recorded',
	TRANSFER_REMOVED: 'transfer_removed',

	// Top-up activities
	TOPUP_RECORDED: 'topup_recorded',
	TOPUP_REMOVED: 'topup_removed',
} as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];

interface ActivityInput {
	/**
	 * A stable, named message key (e.g. 'EVENT_RENAMED', 'TRANSFER_PAID') — NOT a
	 * baked sentence. It's translated at render time via i18n, so history reads in
	 * the user's language and stays human-readable in raw storage. Matching keys
	 * live in the locale files. `details` carries the interpolation params.
	 */
	description: string;
	details?: Record<string, unknown>;
	userId?: string | null;
}

/**
 * The member currently acting on this device (trust-based identity, no login).
 * Set from GroupContext so every tracked change is attributed to a name.
 */
let currentActor: { id: string; name: string } | null = null;
export function setCurrentActor(actor: { id: string; name: string } | null): void {
	currentActor = actor;
}

/**
 * Create a new activity entry
 */
function createActivity(type: ActivityType, data: ActivityInput): Activity {
	return {
		id: generateId(),
		type,
		description: data.description,
		details: { ...(data.details || {}), ...(currentActor?.name ? { actorName: currentActor.name } : {}) },
		userId: data.userId ?? currentActor?.id ?? null,
		timestamp: new Date(),
	};
}

/**
 * Add activity to group data
 */
function addActivityToGroup(group: Group, activity: Activity): Group {
	const updatedGroup: Group = { ...group };
	updatedGroup.activities = updatedGroup.activities || [];
	updatedGroup.activities.unshift(activity); // Add to beginning for chronological order

	// Keep only last 100 activities to prevent storage bloat
	if (updatedGroup.activities.length > 100) {
		updatedGroup.activities = updatedGroup.activities.slice(0, 100);
	}

	return updatedGroup;
}

/**
 * Track event creation. Appended at the end so it stays the oldest entry.
 */
export function trackEventCreated(group: Group): Group {
	const activity = createActivity(ACTIVITY_TYPES.GROUP_CREATED, { description: 'EVENT_CREATED' });
	const updatedGroup: Group = { ...group };
	updatedGroup.activities = [...(updatedGroup.activities || []), activity];
	return updatedGroup;
}

/**
 * Track group name change
 */
export function trackGroupNameChange(group: Group, oldName: string, newName: string): Group {
	if (oldName === newName) return group;

	const activity = createActivity(ACTIVITY_TYPES.GROUP_UPDATED, {
		description: 'EVENT_RENAMED',
		details: { old: oldName, new: newName },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track member addition
 */
export function trackMemberAdded(group: Group, member: Member): Group {
	const activity = createActivity(ACTIVITY_TYPES.MEMBER_CREATED, {
		description: 'MEMBER_ADDED',
		details: { name: member.name },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track member removal
 */
function trackMemberRemoved(group: Group, member: Member): Group {
	const activity = createActivity(ACTIVITY_TYPES.MEMBER_DELETED, {
		description: 'MEMBER_REMOVED',
		details: { name: member.name },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track member name change
 */
function trackMemberNameChange(group: Group, oldName: string, newName: string): Group {
	if (oldName === newName) return group;

	const activity = createActivity(ACTIVITY_TYPES.MEMBER_UPDATED, {
		description: 'MEMBER_RENAMED',
		details: { old: oldName, new: newName },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track transaction creation
 */
export function trackTransactionCreated(group: Group, transaction: Transaction): Group {
	const activity = createActivity(ACTIVITY_TYPES.TRANSACTION_CREATED, {
		description: 'TX_ADDED',
		details: { description: transaction.description, total: transaction.total },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track transaction update
 */
export function trackTransactionUpdated(group: Group, oldTransaction: Transaction, newTransaction: Transaction): Group {
	const changed =
		oldTransaction.description !== newTransaction.description ||
		oldTransaction.total !== newTransaction.total ||
		new Date(oldTransaction.date).getTime() !== new Date(newTransaction.date).getTime();

	if (!changed) return group;

	const activity = createActivity(ACTIVITY_TYPES.TRANSACTION_UPDATED, {
		description: 'TX_UPDATED',
		details: { description: newTransaction.description },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track transaction deletion
 */
export function trackTransactionDeleted(group: Group, transaction: Transaction): Group {
	const activity = createActivity(ACTIVITY_TYPES.TRANSACTION_DELETED, {
		description: 'TX_REMOVED',
		details: { description: transaction.description, total: transaction.total },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Compare two arrays of members and track changes
 */
export function trackMemberChanges(group: Group, oldMembers: Member[] = [], newMembers: Member[] = []): Group {
	let updatedGroup: Group = { ...group };

	// Create maps for easier comparison
	const oldMembersMap = new Map(oldMembers.map((m) => [m.id, m]));
	const newMembersMap = new Map(newMembers.map((m) => [m.id, m]));

	// Track removed members
	for (const oldMember of oldMembers) {
		if (!newMembersMap.has(oldMember.id)) {
			updatedGroup = trackMemberRemoved(updatedGroup, oldMember);
		}
	}

	// Track added and modified members
	for (const newMember of newMembers) {
		const oldMember = oldMembersMap.get(newMember.id);

		if (!oldMember) {
			// New member added
			updatedGroup = trackMemberAdded(updatedGroup, newMember);
		} else {
			// Check for changes in existing member
			updatedGroup = trackMemberNameChange(updatedGroup, oldMember.name, newMember.name);
		}
	}

	return updatedGroup;
}

/**
 * Track a recorded settle-up transfer (one member paying another back).
 */
export function trackTransferRecorded(group: Group, fromName: string, toName: string, amount: number): Group {
	const activity = createActivity(ACTIVITY_TYPES.TRANSFER_RECORDED, {
		description: 'TRANSFER_PAID',
		details: { from: fromName, to: toName, amount },
	});
	return addActivityToGroup(group, activity);
}

/**
 * Track the removal (undo) of a settle-up transfer.
 */
export function trackTransferRemoved(group: Group, fromName: string, toName: string, amount: number): Group {
	const activity = createActivity(ACTIVITY_TYPES.TRANSFER_REMOVED, {
		description: 'TRANSFER_UNDONE',
		details: { from: fromName, to: toName, amount },
	});
	return addActivityToGroup(group, activity);
}

/**
 * Track a recorded top-up (a member adding money to the pot).
 */
export function trackTopupRecorded(group: Group, memberName: string, amount: number): Group {
	const activity = createActivity(ACTIVITY_TYPES.TOPUP_RECORDED, {
		description: 'TOPUP_ADDED',
		details: { name: memberName, amount },
	});
	return addActivityToGroup(group, activity);
}

/**
 * Track the removal (undo) of a top-up.
 */
export function trackTopupRemoved(group: Group, memberName: string, amount: number): Group {
	const activity = createActivity(ACTIVITY_TYPES.TOPUP_REMOVED, {
		description: 'TOPUP_UNDONE',
		details: { name: memberName, amount },
	});
	return addActivityToGroup(group, activity);
}
