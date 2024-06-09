import { useState, useEffect } from 'react';

/**
 * @typedef {Object} ApiGroup
 * @property {string} foo
 */

/**
 * @returns {ApiGroup[]}
 */
const useApiGroups = () => {
	const [data, setData] = useState({ isLoading: true, groups: [] });

	useEffect(() => {
		const fetchData = async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setData({ isLoading: false, groups: [{ foo: 'bar', id: 1 }] });
		};
		fetchData();
	}, []);

	return data;
};

export default useApiGroups;
