import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

import { GroupConfig } from '../pages/Group/Config';
import { NotFound } from '../pages/NotFound';
import { GroupProvider, useGroupContext } from '../context/GroupContext';
import { GroupHeader } from './GroupHeader';
import { IdentityGate } from './IdentityGate';
import { Debug } from './Debug';
import { GroupListTransactions } from '../pages/Group/ListTransactions';
import { GroupTransaction } from '../pages/Group/Transaction';
import { GroupActivity } from '../pages/Group/Activity';
import { GroupHistory } from '../pages/Group/History';
import { GroupSettlement } from '../pages/Group/Settlement';
import { GroupTopUp } from '../pages/Group/TopUp';
import { Button } from '@/components/ui/button';

function GroupContent() {
	const { section, sectionItem } = useParams();
	const { data: group, loadDemo, currentMemberId } = useGroupContext();
	const { t } = useTranslation();

	// Trust-based identity: pick who you are before viewing/editing the event.
	if (!currentMemberId) return <IdentityGate />;

	const pages: Record<string, boolean> = {
		config: section === 'config',
		transactions: section === 'transactions',
		settlement: section === 'settlement',
		topup: section === 'topup',
		activity: section === 'activity',
		versions: section === 'versions',
	};

	const isKnownSection = section ? Boolean(pages[section]) : false;

	// Check if group needs sample data (no members or empty group name)
	const needsSampleData =
		!group?.members || group.members.length === 0 || !group?.config?.name || group.config.name === '---';

	return (
		<>
			<GroupHeader />
			<div>
				{!isKnownSection && <NotFound />}
				{pages.config && <GroupConfig />}
				{pages.transactions &&
					(sectionItem ? <GroupTransaction transactionId={sectionItem} /> : <GroupListTransactions />)}
				{pages.settlement && <GroupSettlement />}
				{pages.topup && <GroupTopUp />}
				{pages.activity && <GroupActivity />}
				{pages.versions && <GroupHistory />}
			</div>

			{/* Global load sample data prompt — shows when the group is empty */}
			{needsSampleData && (
				<div className="border-border bg-muted/40 mx-auto mt-8 flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center">
					<Sparkles className="text-primary size-6" />
					<p className="text-muted-foreground text-sm">{t('Need some data to get started?')}</p>
					<Button variant="outline" size="sm" onClick={loadDemo}>
						{t('Load sample data')}
					</Button>
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
