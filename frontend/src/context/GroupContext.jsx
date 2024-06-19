import { createContext, useState } from 'react';
import PropTypes from 'prop-types';

export const GroupContext = createContext();

GroupProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default function GroupProvider({ children }) {
	const [group, setGroup] = useState({});

	return <GroupContext.Provider value={{ group, setGroup }}>{children}</GroupContext.Provider>;
}
