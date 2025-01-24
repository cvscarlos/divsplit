import { useParams } from 'react-router-dom';

import { GroupConfig } from '../pages/Group/Config.jsx';
import { NotFound } from '../pages/NotFound';
import { GroupProvider } from '../context/GroupContext.jsx';
import { GroupHeader } from './GroupHeader.jsx';
import { Debug } from './Debug.jsx';
import { GroupListTransactions } from '../pages/Group/ListTransactions.jsx';
import { GroupTransaction } from '../pages/Group/Transaction.jsx';

export function GroupPageWrapper() {
	const { section, sectionItem } = useParams();

	const pages = {
		config: section === 'config',
		transactions: section === 'transactions',
	};

	return (
		<GroupProvider>
			<GroupHeader />
			<div className="prose">
				{!pages[section] && <NotFound />}
				{pages.config && <GroupConfig />}
				{pages.transactions &&
					(sectionItem ? <GroupTransaction transactionId={sectionItem} /> : <GroupListTransactions />)}
			</div>
			<Debug />
		</GroupProvider>
	);
}
