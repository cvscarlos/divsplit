import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { GroupConfig } from '../pages/Group/Config.jsx';
import { NotFound } from '../pages/NotFound';
import { GroupProvider } from '../context/GroupContext.jsx';
import { GroupHeader } from './GroupHeader.jsx';
import { Debug } from './Debug.jsx';
import { GroupListTransactions } from '../pages/Group/ListTransactions.jsx';
import { GroupTransaction } from '../pages/Group/Transaction.jsx';
import { useGroupContext } from '../context/GroupContext.jsx';

function GroupContent() {
	const { section, sectionItem } = useParams();
	const { data: group, loadDemo } = useGroupContext();
	const { t } = useTranslation();

	const pages = {
		config: section === 'config',
		transactions: section === 'transactions',
	};

	// Check if group needs sample data (no members or empty group name)
	const needsSampleData =
		!group?.members || group.members.length === 0 || !group?.config?.name || group.config.name === '---';

	return (
		<>
			<GroupHeader />
			<div className="prose">
				{!pages[section] && <NotFound />}
				{pages.config && <GroupConfig />}
				{pages.transactions &&
					(sectionItem ? <GroupTransaction transactionId={sectionItem} /> : <GroupListTransactions />)}
			</div>

			{/* Global load sample data link - shows on all pages when group is empty */}
			{needsSampleData && (
				<div className="text-center mt-4 mb-6">
					<p className="text-sm text-gray-600">
						{t('Need some data to get started?')}{' '}
						<button type="button" className="text-blue-600 underline" onClick={loadDemo}>
							{t('Load sample data')}
						</button>
					</p>
				</div>
			)}

			<Debug />
		</>
	);
}

export function GroupPageWrapper() {
	return (
		<GroupProvider>
			<GroupContent />
		</GroupProvider>
	);
}
