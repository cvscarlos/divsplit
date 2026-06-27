import { useEffect, useState, useSyncExternalStore } from 'react';
import localforage from 'localforage';

import type { Group, GroupListItem } from '../types';
import { recordVersion, coreOf } from './versioning';
import type { ChangeEntry } from './versioning';
import { enqueue, pull, subscribeData, getDataRevision } from './sync';
import { getEventMemberId } from './identity';

export interface SaveMeta {
	/** A standalone change entry for the version (e.g. a restore), key+params. */
	change?: ChangeEntry;
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
	const name = group.config?.name || '';
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
	const standardized: Group = group || ({} as Group);
	standardized.config ||= {}; // Initialize config if not present

	// Legacy migration: "banker" → "holder".
	if (standardized.config.bankerId && !standardized.config.holderId) {
		standardized.config.holderId = standardized.config.bankerId;
	}
	delete standardized.config.bankerId;

	// Legacy migration: a member's prepaid number → a top-up transaction (held by
	// the holder). Deterministic id keeps it idempotent across reloads.
	const members = standardized.members || [];
	const legacy = members.filter((m) => (m.prepaid || 0) > 0);
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

const isEmptyGroup = (group?: Group | null): boolean => !group || (!group.members?.length && !group.config?.name);

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
	// A pull writing new data bumps this shared revision; re-reading local storage on change
	// covers both the background loop and a manual sync triggered from the header.
	const dataRevision = useSyncExternalStore(subscribeData, getDataRevision, getDataRevision);

	// Background pull: mirror the server's full state (projection + history) into local storage when online.
	useEffect(() => {
		if (!groupId) return;
		const run = () => void pull(groupId);
		run();
		window.addEventListener('online', run);
		const iv = setInterval(run, 20000);
		return () => {
			window.removeEventListener('online', run);
			clearInterval(iv);
		};
	}, [groupId]);

	useEffect(() => {
		let abort = false;
		setLoading(true);

		const fetchData = async () => {
			if (abort) return;
			if (!groupId) return;

			if (dataToSave) {
				const prev = await groupStore.getItem<Group>(groupId);
				const toSave = dataToSave.group;
				await groupStore.setItem(groupId, toSave);
				const memberId = getEventMemberId(groupId);
				const author = dataToSave.meta?.author || toSave.members?.find((m) => m.id === memberId)?.name || '';
				// recordVersion derives change lines from the state diff (and logs creation on the first save).
				const version = await recordVersion(groupId, prev, toSave, { change: dataToSave.meta?.change, author });
				// Queue for background sync (durable outbox; flushes when online).
				if (version) void enqueue(groupId, version, coreOf(toSave));
				if (!abort) setDataToSave(null);
				if (!abort) await updateGroupIndex(toSave, groupId);
			}

			let group = groupStandardize(await groupStore.getItem<Group>(groupId));

			// Fresh visitor opening a shared link: nothing local yet, so pull the
			// server state first so the identity gate can show the existing members.
			if (isEmptyGroup(group)) {
				if (await pull(groupId)) group = groupStandardize(await groupStore.getItem<Group>(groupId));
			}

			// Opening any event (even one that arrived via a pull, not a local save) lists it on
			// home/events — works offline too, since it indexes whatever is already local.
			if (!abort && !isEmptyGroup(group)) await updateGroupIndex(group, groupId);

			if (!abort) setData(group);
			if (!abort) setLoading(false);
		};
		fetchData();

		return () => {
			abort = true;
		};
	}, [dataToSave, groupId, dataRevision]);

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
