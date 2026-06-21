import { useEffect, useState } from 'react';
import localforage from 'localforage';

import type { Group, GroupListItem } from '../types';
import { trackEventCreated } from './activity-tracker';
import { recordVersion } from './versioning';
import { getEventMemberId } from './identity';

export interface SaveMeta {
	/** Human label for the version entry (e.g. "Restored to version 3"). */
	message?: string;
	/** Member name to attribute the version to. */
	author?: string;
}

const groupListStore = localforage.createInstance({ name: 'groupList' });
const groupStore = localforage.createInstance({ name: 'group' });

export function useApiListGroups(): { loading: boolean; groupList: GroupListItem[] } {
	const [loading, setLoading] = useState(false);
	const [groupList, setGroupList] = useState<GroupListItem[]>([]);

	useEffect(() => {
		setLoading(true);
		const fetchData = async () => {
			const groups = (await groupListStore.getItem<GroupListItem[]>('groups')) || [];
			setGroupList(groups);
			setLoading(false);
		};
		fetchData();
	}, []);

	return { loading, groupList };
}

async function updateGroupIndex(group: Group, groupId: string): Promise<void> {
	const groups = (await groupListStore.getItem<GroupListItem[]>('groups')) || [];
	const name = group.config?.name ?? '';
	const icon = group.config?.icon;
	const groupIndex = groups.findIndex((g) => g.id === groupId);
	// Upsert: a freshly created group won't be in the index yet, so add it
	// instead of silently dropping it (otherwise it never shows on the home list).
	if (groupIndex === -1) {
		groups.push({ id: groupId, name, icon });
	} else {
		groups[groupIndex] = { ...groups[groupIndex], name, icon };
	}
	await groupListStore.setItem('groups', groups);
}

function groupStandardize(group?: Group | null): Group {
	const standardized: Group = group ?? ({} as Group);
	standardized.config ||= {}; // Initialize config if not present

	// Legacy migration: "banker" → "holder".
	if (standardized.config.bankerId && !standardized.config.holderId) {
		standardized.config.holderId = standardized.config.bankerId;
	}
	delete standardized.config.bankerId;

	// Legacy migration: a member's prepaid number → a top-up transaction (held by
	// the holder). Deterministic id keeps it idempotent across reloads.
	const members = standardized.members ?? [];
	const legacy = members.filter((m) => (m.prepaid ?? 0) > 0);
	if (legacy.length) {
		standardized.transactions ||= [];
		for (const m of legacy) {
			const id = `topup-legacy-${m.id}`;
			if (!standardized.transactions.some((tx) => tx.id === id)) {
				standardized.transactions.unshift({
					id,
					type: 'topup',
					date: new Date(),
					description: 'Prepaid',
					total: m.prepaid as number,
					paidBy: { [m.id]: m.prepaid as number },
					paidFor: {},
				});
			}
			delete m.prepaid;
		}
	}

	return standardized;
}

/**
 * Load demo data for a group
 */
async function loadDemoData(groupId: string): Promise<void> {
	try {
		const response = await fetch('/demo_data.json');
		const demoData = (await response.json()) as Group;
		await groupStore.setItem(groupId, demoData);

		// Also update the group list if this group doesn't exist
		const groups = (await groupListStore.getItem<GroupListItem[]>('groups')) || [];
		const groupExists = groups.some((group) => group.id === groupId);
		if (!groupExists) {
			groups.push({ id: groupId, name: demoData.config?.name || 'Demo Group' });
			await groupListStore.setItem('groups', groups);
		}
	} catch (error) {
		console.error('Error loading demo data:', error);
	}
}

export interface UseApiGetGroup {
	data: Group;
	loading: boolean;
	updateGroup: (updatedData: Group, meta?: SaveMeta) => void;
	loadDemo: () => Promise<void>;
}

export function useApiGetGroup(groupId: string | undefined): UseApiGetGroup {
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<Group>(groupStandardize());
	const [dataToSave, setDataToSave] = useState<{ group: Group; meta?: SaveMeta } | null>(null);

	useEffect(() => {
		let abort = false;
		setLoading(true);

		const fetchData = async () => {
			if (abort) return;
			if (!groupId) return;

			if (dataToSave) {
				const prev = await groupStore.getItem<Group>(groupId);
				// First time this event is persisted → log an "Event created" entry.
				const toSave = prev ? dataToSave.group : trackEventCreated(dataToSave.group);
				await groupStore.setItem(groupId, toSave);
				const memberId = getEventMemberId(groupId);
				const author = dataToSave.meta?.author ?? toSave.members?.find((m) => m.id === memberId)?.name ?? '';
				await recordVersion(groupId, prev, toSave, { message: dataToSave.meta?.message, author });
				if (!abort) setDataToSave(null);
				if (!abort) await updateGroupIndex(toSave, groupId);
			}

			const group = groupStandardize(await groupStore.getItem<Group>(groupId));

			if (!abort) setData(group);
			if (!abort) setLoading(false);
		};
		fetchData();

		return () => {
			abort = true;
		};
	}, [dataToSave, groupId]);

	const loadDemo = async () => {
		if (!groupId) return;
		await loadDemoData(groupId);
		// Trigger a re-fetch by forcing a state update
		const group = groupStandardize(await groupStore.getItem<Group>(groupId));
		setData(group);
	};

	return {
		data,
		loading,
		updateGroup: (updatedData: Group, meta?: SaveMeta) => {
			setDataToSave({ group: updatedData, meta });
		},
		loadDemo,
	};
}
