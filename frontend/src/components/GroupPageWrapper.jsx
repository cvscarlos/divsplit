import { useParams } from 'react-router-dom';

import { GroupConfig } from '../pages/GroupConfig';
import { GroupTransactions } from '../pages/GroupTransactions.jsx';
import { NotFound } from '../pages/NotFound';
import GroupProvider from '../context/GroupContext.jsx';
import { GroupHeader } from './GroupHeader.jsx';

export function GroupPageWrapper() {
	const { section } = useParams();

	const pages = {
		config: section === 'config',
		transactions: section === 'transactions',
	};

	return (
		<GroupProvider>
			<GroupHeader>
				{pages.config && <GroupConfig />}
				{pages.transactions && <GroupTransactions />}
				{!pages[section] && <NotFound />}
			</GroupHeader>
		</GroupProvider>
	);
}
