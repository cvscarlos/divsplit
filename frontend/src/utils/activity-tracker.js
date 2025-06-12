import ObjectId from 'bson-objectid';

/**
 * Activity types for tracking changes
 */
export const ACTIVITY_TYPES = {
	// Group activities
	GROUP_UPDATED: 'group_updated',
	MEMBER_CREATED: 'member_created',
	MEMBER_UPDATED: 'member_updated',
	MEMBER_DELETED: 'member_deleted',

	// Transaction activities
	TRANSACTION_CREATED: 'transaction_created',
	TRANSACTION_UPDATED: 'transaction_updated',
	TRANSACTION_DELETED: 'transaction_deleted',
};

/**
 * Create a new activity entry
 * @param {string} type - Activity type from ACTIVITY_TYPES
 * @param {Object} data - Activity data
 * @param {string} data.description - Human readable description
 * @param {Object} data.details - Additional details about the change
 * @param {string} data.userId - ID of the user who made the change (optional)
 * @returns {Object} Activity object
 */
export function createActivity(type, data) {
	return {
		id: new ObjectId().toHexString(),
		type,
		description: data.description,
		details: data.details || {},
		userId: data.userId || null,
		timestamp: new Date(),
	};
}

/**
 * Add activity to group data
 * @param {Object} group - Group object
 * @param {Object} activity - Activity object
 * @returns {Object} Updated group object
 */
export function addActivityToGroup(group, activity) {
	const updatedGroup = { ...group };
	updatedGroup.activities = updatedGroup.activities || [];
	updatedGroup.activities.unshift(activity); // Add to beginning for chronological order

	// Keep only last 100 activities to prevent storage bloat
	if (updatedGroup.activities.length > 100) {
		updatedGroup.activities = updatedGroup.activities.slice(0, 100);
	}

	return updatedGroup;
}

/**
 * Track group name change
 * @param {Object} group - Group object
 * @param {string} oldName - Previous name
 * @param {string} newName - New name
 * @returns {Object} Updated group object
 */
export function trackGroupNameChange(group, oldName, newName) {
	if (oldName === newName) return group;

	const activity = createActivity(ACTIVITY_TYPES.GROUP_UPDATED, {
		description: `Group name changed from "${oldName}" to "${newName}"`,
		details: { oldName, newName },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track member addition
 * @param {Object} group - Group object
 * @param {Object} member - Member object
 * @returns {Object} Updated group object
 */
export function trackMemberAdded(group, member) {
	const activity = createActivity(ACTIVITY_TYPES.MEMBER_CREATED, {
		description: `Member "${member.name}" was added to the group`,
		details: { memberId: member.id, memberName: member.name, prepaid: member.prepaid },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track member removal
 * @param {Object} group - Group object
 * @param {Object} member - Member object
 * @returns {Object} Updated group object
 */
export function trackMemberRemoved(group, member) {
	const activity = createActivity(ACTIVITY_TYPES.MEMBER_DELETED, {
		description: `Member "${member.name}" was removed from the group`,
		details: { memberId: member.id, memberName: member.name },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track member name change
 * @param {Object} group - Group object
 * @param {string} memberId - Member ID
 * @param {string} oldName - Previous name
 * @param {string} newName - New name
 * @returns {Object} Updated group object
 */
export function trackMemberNameChange(group, memberId, oldName, newName) {
	if (oldName === newName) return group;

	const activity = createActivity(ACTIVITY_TYPES.MEMBER_UPDATED, {
		description: `Member name changed from "${oldName}" to "${newName}"`,
		details: { memberId, oldName, newName, changeType: 'name' },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track member prepaid amount change
 * @param {Object} group - Group object
 * @param {string} memberId - Member ID
 * @param {string} memberName - Member name
 * @param {number} oldAmount - Previous prepaid amount
 * @param {number} newAmount - New prepaid amount
 * @returns {Object} Updated group object
 */
export function trackMemberPrepaidChange(group, memberId, memberName, oldAmount, newAmount) {
	if (oldAmount === newAmount) return group;

	const activity = createActivity(ACTIVITY_TYPES.MEMBER_UPDATED, {
		description: `${memberName}'s prepaid amount changed from $${oldAmount} to $${newAmount}`,
		details: { memberId, memberName, oldAmount, newAmount, changeType: 'prepaid' },
	});

	return addActivityToGroup(group, activity);
}

/**
 * Track transaction creation
 * @param {Object} group - Group object
 * @param {Object} transaction - Transaction object
 * @returns {Object} Updated group object
 */
export function trackTransactionCreated(group, transaction) {
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
 * @param {Object} group - Group object
 * @param {Object} oldTransaction - Previous transaction data
 * @param {Object} newTransaction - Updated transaction data
 * @returns {Object} Updated group object
 */
export function trackTransactionUpdated(group, oldTransaction, newTransaction) {
	const changes = [];

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
 * @param {Object} group - Group object
 * @param {Object} transaction - Transaction object that was deleted
 * @returns {Object} Updated group object
 */
export function trackTransactionDeleted(group, transaction) {
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
 * @param {Object} group - Group object
 * @param {Array} oldMembers - Previous members array
 * @param {Array} newMembers - New members array
 * @returns {Object} Updated group object
 */
export function trackMemberChanges(group, oldMembers = [], newMembers = []) {
	let updatedGroup = { ...group };

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
			updatedGroup = trackMemberPrepaidChange(
				updatedGroup,
				newMember.id,
				newMember.name,
				oldMember.prepaid,
				newMember.prepaid,
			);
		}
	}

	return updatedGroup;
}
