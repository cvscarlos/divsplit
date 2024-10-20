import { useEffect, useState } from 'react';
import localforage from 'localforage';
import ObjectId from 'bson-objectid';

/**
 * @typedef {Object} GroupListItem
 * @property {string} id
 */
/**
 * @typedef {Object} Group
 * @property {Object} config
 */

const groupListStore = localforage.createInstance({ name: 'groupList' });
const groupStore = localforage.createInstance({ name: 'group' });

function generateId() {
	return new ObjectId().toHexString();
}

async function loadSampleData() {
	if (await groupListStore.getItem('groups')) return;
	await groupListStore.setItem('groups', [
		{ id: generateId(), name: 'Grupo Teste' },
		{ id: generateId(), name: 'Grupo Teste' },
		{ id: generateId(), name: 'Grupo Teste' },
	]);
}

/**
 * @returns {{loading: boolean, groupList: GroupListItem[]}}
 */
export function useApiListGroups() {
	const [loading, setLoading] = useState(false);
	const [groupList, setGroupList] = useState([]);

	useEffect(() => {
		setLoading(true);
		const fetchData = async () => {
			await loadSampleData();
			const groups = (await groupListStore.getItem('groups')) || [];
			setGroupList(groups);
			setLoading(false);
		};
		fetchData();
	}, []);

	return { loading, groupList };
}

async function updateGroupName(newName, groupId) {
	const groups = (await groupListStore.getItem('groups')) || [];
	const groupIndex = groups.findIndex((group) => group.id === groupId);
	if (groupIndex === -1) return;
	groups[groupIndex].name = newName;
	await groupListStore.setItem('groups', groups);
}

function groupStandardize(group = {}) {
	group ||= {};
	group.config ||= {}; // Initialize config if not present
	return group;
}

/**
 * @param {string} groupId
 * @returns {{data: Group, loading: boolean, updateGroup: (updatedData: Group) => void}}
 */
export function useApiGetGroup(groupId) {
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState(groupStandardize());
	const [dataToSave, setDataToSave] = useState(null);

	useEffect(() => {
		let abort = false;
		setLoading(true);

		const fetchData = async () => {
			if (abort) return;
			if (!groupId) return;

			if (dataToSave) {
				await groupStore.setItem(groupId, dataToSave);
				if (!abort) setDataToSave(null);
				if (!abort) await updateGroupName(dataToSave.config.name, groupId);
			}

			const group = groupStandardize(await groupStore.getItem(groupId));

			if (!abort) setData(group);
			if (!abort) setLoading(false);
		};
		fetchData();

		return () => (abort = true);
	}, [dataToSave, groupId]);

	return {
		data,
		loading,
		updateGroup: (updatedData) => {
			setDataToSave(updatedData);
		},
	};
}
