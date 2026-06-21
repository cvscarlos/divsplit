import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';

import { useApiGetGroup } from '../utils/use-api';
import type { SaveMeta } from '../utils/use-api';
import type { Group, Member } from '../types';
import {
	getDeviceUid,
	getEventMemberId,
	setEventMemberId,
	clearEventMemberId,
	setPreferredName,
} from '../utils/identity';
import Loading from '../components/Loading';

interface GroupContextValue {
	data: Group;
	updateGroup: (updatedData: Group, meta?: SaveMeta) => void;
	loadDemo: () => Promise<void>;
	/** The member this device is acting as (trust-based identity). */
	currentMemberId: string | null;
	currentMember: Member | undefined;
	identify: (member: Member) => void;
	clearIdentity: () => void;
}

const GroupContext = createContext<GroupContextValue | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
	const { groupId } = useParams();
	const { data, loading, updateGroup, loadDemo } = useApiGetGroup(groupId);
	const [currentMemberId, setCurrentMemberId] = useState<string | null>(groupId ? getEventMemberId(groupId) : null);

	// Ensure this device has a stable id, and load the saved identity for this event.
	useEffect(() => {
		getDeviceUid();
		setCurrentMemberId(groupId ? getEventMemberId(groupId) : null);
	}, [groupId]);

	const currentMember = data.members?.find((m) => m.id === currentMemberId);

	const identify = (member: Member) => {
		if (!groupId) return;
		setEventMemberId(groupId, member.id);
		setPreferredName(member.name);
		setCurrentMemberId(member.id);
	};

	const clearIdentity = () => {
		if (groupId) clearEventMemberId(groupId);
		setCurrentMemberId(null);
	};

	const value: GroupContextValue = {
		data,
		updateGroup,
		loadDemo,
		currentMemberId,
		currentMember,
		identify,
		clearIdentity,
	};

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
