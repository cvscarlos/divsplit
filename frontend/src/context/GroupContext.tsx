import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';

import { useApiGetGroup } from '../utils/use-api';
import type { Group } from '../types';
import Loading from '../components/Loading';

interface GroupContextValue {
	data: Group;
	updateGroup: (updatedData: Group) => void;
	loadDemo: () => Promise<void>;
}

const GroupContext = createContext<GroupContextValue | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
	const { groupId } = useParams();
	const { data, loading, updateGroup, loadDemo } = useApiGetGroup(groupId);
	const value: GroupContextValue = { data, updateGroup, loadDemo };

	return (
		<GroupContext.Provider value={value}>
			{loading ? <Loading /> : null}
			{children}
		</GroupContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGroupContext(): GroupContextValue {
	const context = useContext(GroupContext);
	if (context === undefined) {
		throw new Error('useGroupContext must be used within a GroupProvider');
	}
	return context;
}
