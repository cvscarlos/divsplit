import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';

import { useApiGetGroup } from '../utils/use-api';
import Loading from '../components/Loading';

const GroupContext = createContext();

GroupProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export function GroupProvider({ children }) {
	const { groupId } = useParams();
	const { data, loading, updateGroup, loadDemo } = useApiGetGroup(groupId);
	const value = { data, updateGroup, loadDemo };

	return (
		<GroupContext.Provider value={value}>
			{loading ? <Loading /> : null}
			{children}
		</GroupContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGroupContext() {
	const context = useContext(GroupContext);
	if (context === undefined) {
		throw new Error('useGroupContext must be used within a GroupProvider');
	}
	return context;
}
