import GroupProvider from '../context/GroupContext';

export function GroupPage() {
	// use Group Context

	return (
		<GroupProvider>
			<div>Group </div>
		</GroupProvider>
	);
}
