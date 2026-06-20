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
	const activity = createActivity(ACTIVITY_TYPES.GROUP_CREATED, { description: 'Event created' });
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
		description: `Event name changed from "${oldName}" to "${newName}"`,
		details: { oldName, newName },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track member addition
 */
export function trackMemberAdded(group: Group, member: Member): Group {
	const activity = createActivity(ACTIVITY_TYPES.MEMBER_CREATED, {
		description: `Member "${member.name}" was added to the event`,
		details: { memberId: member.id, memberName: member.name, prepaid: member.prepaid },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track member removal
 */
function trackMemberRemoved(group: Group, member: Member): Group {
	const activity = createActivity(ACTIVITY_TYPES.MEMBER_DELETED, {
		description: `Member "${member.name}" was removed from the event`,
		details: { memberId: member.id, memberName: member.name },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track member name change
 */
function trackMemberNameChange(group: Group, memberId: string, oldName: string, newName: string): Group {
	if (oldName === newName) return group;

	const activity = createActivity(ACTIVITY_TYPES.MEMBER_UPDATED, {
		description: `Member name changed from "${oldName}" to "${newName}"`,
		details: { memberId, oldName, newName, changeType: 'name' },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track transaction creation
 */
export function trackTransactionCreated(group: Group, transaction: Transaction): Group {
	const activity = createActivity(ACTIVITY_TYPES.TRANSACTION_CREATED, {
		description: `Transaction "${transaction.description}" was created for $${transaction.total}`,
		details: {
			transactionId: transaction.id,
			description: transaction.description,
			total: transaction.total,
			date: transaction.date,
		},
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track transaction update
 */
export function trackTransactionUpdated(group: Group, oldTransaction: Transaction, newTransaction: Transaction): Group {
	const changes: string[] = [];

	if (oldTransaction.description !== newTransaction.description) {
		changes.push(`description from "${oldTransaction.description}" to "${newTransaction.description}"`);
	}

	if (oldTransaction.total !== newTransaction.total) {
		changes.push(`total from $${oldTransaction.total} to $${newTransaction.total}`);
	}

	if (new Date(oldTransaction.date).getTime() !== new Date(newTransaction.date).getTime()) {
		changes.push(
			`date from ${new Date(oldTransaction.date).toLocaleDateString()} to ${new Date(newTransaction.date).toLocaleDateString()}`,
		);
	}

	if (changes.length === 0) return group;

	const activity = createActivity(ACTIVITY_TYPES.TRANSACTION_UPDATED, {
		description: `Transaction "${newTransaction.description}" was updated: ${changes.join(', ')}`,
		details: {
			transactionId: newTransaction.id,
			changes: changes,
			oldTransaction: {
				description: oldTransaction.description,
				total: oldTransaction.total,
				date: oldTransaction.date,
			},
			newTransaction: {
				description: newTransaction.description,
				total: newTransaction.total,
				date: newTransaction.date,
			},
		},
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track transaction deletion
 */
export function trackTransactionDeleted(group: Group, transaction: Transaction): Group {
	const activity = createActivity(ACTIVITY_TYPES.TRANSACTION_DELETED, {
		description: `Transaction "${transaction.description}" was deleted (was $${transaction.total})`,
		details: {
			transactionId: transaction.id,
			description: transaction.description,
			total: transaction.total,
			date: transaction.date,
		},
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
			updatedGroup = trackMemberNameChange(updatedGroup, newMember.id, oldMember.name, newMember.name);
		}
	}

	return updatedGroup;
}

/**
 * Track a recorded settle-up transfer (one member paying another back).
 */
export function trackTransferRecorded(group: Group, fromName: string, toName: string, amount: number): Group {
	const activity = createActivity(ACTIVITY_TYPES.TRANSFER_RECORDED, {
		description: `${fromName} paid ${toName} $${amount}`,
		details: { fromName, toName, amount },
	});
	return addActivityToGroup(group, activity);
}

/**
 * Track the removal (undo) of a settle-up transfer.
 */
export function trackTransferRemoved(group: Group, fromName: string, toName: string, amount: number): Group {
	const activity = createActivity(ACTIVITY_TYPES.TRANSFER_REMOVED, {
		description: `Removed payment: ${fromName} → ${toName} $${amount}`,
		details: { fromName, toName, amount },
	});
	return addActivityToGroup(group, activity);
}

/**
 * Track a recorded top-up (a member adding money to the pot).
 */
export function trackTopupRecorded(group: Group, memberName: string, amount: number): Group {
	const activity = createActivity(ACTIVITY_TYPES.TOPUP_RECORDED, {
		description: `${memberName} topped up $${amount}`,
		details: { memberName, amount },
	});
	return addActivityToGroup(group, activity);
}

/**
 * Track the removal (undo) of a top-up.
 */
export function trackTopupRemoved(group: Group, memberName: string, amount: number): Group {
	const activity = createActivity(ACTIVITY_TYPES.TOPUP_REMOVED, {
		description: `Removed top-up: ${memberName} $${amount}`,
		details: { memberName, amount },
	});
	return addActivityToGroup(group, activity);
}
