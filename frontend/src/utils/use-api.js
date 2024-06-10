import { useEffect, useState } from 'react';
import localforage from 'localforage';

/**
 * @typedef {Object} ApiGroup
 * @property {string} id
 */

const groupsStore = localforage.createInstance({ name: 'groupsStore' });

/**
 * @returns {ApiGroup[]}
 */
const useApiGroups = () => {
	const [data, setData] = useState({ isLoading: true, groups: [] });

	useEffect(() => {
		const fetchData = async () => {
			// For example only
			await groupsStore.setItem('groups', [{ id: 'abc' }, { id: 'def' }, { id: 'ghi' }]);

			const groups = (await groupsStore.getItem('groups')) || [];
			setData({ isLoading: false, groups });
		};
		fetchData();
	}, []);

	return data;
};

export default useApiGroups;
