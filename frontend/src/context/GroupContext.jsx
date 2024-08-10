import { createContext } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { useApiGetGroup } from '../utils/use-api';
import Loading from '../components/Loading';

export const GroupContext = createContext();

GroupProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default function GroupProvider({ children }) {
	const { groupId } = useParams();
	const { data, loading, updateGroup } = useApiGetGroup(groupId);
	const value = [data, updateGroup];

	return (
		<GroupContext.Provider value={value}>
			{children}
			{loading ? <Loading /> : null}
		</GroupContext.Provider>
	);
}
