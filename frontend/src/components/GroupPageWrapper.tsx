import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { GroupConfig } from '../pages/Group/Config';
import { NotFound } from '../pages/NotFound';
import { GroupProvider, useGroupContext } from '../context/GroupContext';
import { GroupHeader } from './GroupHeader';
import { Debug } from './Debug';
import { GroupListTransactions } from '../pages/Group/ListTransactions';
import { GroupTransaction } from '../pages/Group/Transaction';
import { GroupActivity } from '../pages/Group/Activity';

function GroupContent() {
	const { section, sectionItem } = useParams();
	const { data: group, loadDemo } = useGroupContext();
	const { t } = useTranslation();

	const pages: Record<string, boolean> = {
		config: section === 'config',
		transactions: section === 'transactions',
		activity: section === 'activity',
	};

	const isKnownSection = section ? Boolean(pages[section]) : false;

	// Check if group needs sample data (no members or empty group name)
	const needsSampleData =
		!group?.members || group.members.length === 0 || !group?.config?.name || group.config.name === '---';

	return (
		<>
			<GroupHeader />
			<div className="prose">
				{!isKnownSection && <NotFound />}
				{pages.config && <GroupConfig />}
				{pages.transactions &&
					(sectionItem ? <GroupTransaction transactionId={sectionItem} /> : <GroupListTransactions />)}
				{pages.activity && <GroupActivity />}
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
