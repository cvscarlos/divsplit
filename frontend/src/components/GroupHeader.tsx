import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Settings2, Receipt, History, ArrowLeftRight } from 'lucide-react';

import { useGroupContext } from '../context/GroupContext';
import { cn } from '@/lib/utils';

export function GroupHeader() {
	const { data: group } = useGroupContext();
	const { t } = useTranslation();
	const { groupId, section } = useParams();

	const tabs = [
		{ key: 'config', label: t('Config'), icon: Settings2 },
		{ key: 'transactions', label: t('Transactions'), icon: Receipt },
		{ key: 'settlement', label: t('Settle up'), icon: ArrowLeftRight },
		{ key: 'activity', label: t('Activity'), icon: History },
	];

	return (
		<div className="mb-9">
			<p className="text-muted-foreground text-center text-xs font-semibold tracking-[0.2em] uppercase">Group</p>
			<h1 className="mt-1.5 text-center font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
				{group.config?.name || 'Untitled group'}
			</h1>

			<nav className="mt-6 flex justify-center">
				<div className="bg-muted inline-flex gap-1 rounded-full p-1">
					{tabs.map((tab) => {
						const active = section === tab.key;
						const Icon = tab.icon;
						return (
							<Link
								key={tab.key}
								to={`/group/${groupId}/${tab.key}`}
								className={cn(
									'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
									active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
								)}
							>
								<Icon className="size-4" />
								<span className="hidden sm:inline">{tab.label}</span>
							</Link>
						);
					})}
				</div>
			</nav>
		</div>
	);
}
