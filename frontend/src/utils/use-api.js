import { useEffect, useState } from 'react';
import localforage from 'localforage';

/**
 * @typedef {Object} ApiGroupListItem
 * @property {string} id
 */

const groupListStore = localforage.createInstance({ name: 'groupList' });
const groupStore = localforage.createInstance({ name: 'group' });

/**
 * @returns {ApiGroupListItem[]}
 */
export function useApiListGroups() {
	const [data, setData] = useState({ isLoading: true, groups: [] });

	useEffect(() => {
		const fetchData = async () => {
			// For example only
			await groupListStore.setItem('groups', [{ id: 'abc' }, { id: 'def' }, { id: 'ghi' }]);

			const groups = (await groupListStore.getItem('groups')) || [];
			setData({ isLoading: false, groups });
		};
		fetchData();
	}, []);

	return data;
}

export function useApiGetGroup(groupId) {
	const [data, setData] = useState({ isLoading: true, group: null });

	useEffect(() => {
		const fetchData = async () => {
			const group = (await groupStore.getItem(groupId)) || {};
			setData({ isLoading: false, group });
		};
		fetchData();
	}, [groupId]);

	return data;
}
