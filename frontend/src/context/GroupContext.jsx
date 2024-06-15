import { createContext } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { useApiGetGroup } from '../utils/use-api';
import Loading from './Loading';

export const GroupContext = createContext();

GroupProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default function GroupProvider({ children }) {
	const { groupId } = useParams();
	console.log('groupId', groupId);
	const { data, loading, updateGroup } = useApiGetGroup(groupId);
	const value = {
		group: data,
		updateGroup,
	};

	return <GroupContext.Provider value={value}>{loading ? children : <Loading />}</GroupContext.Provider>;
}
