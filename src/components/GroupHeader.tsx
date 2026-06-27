import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Settings2, Receipt, History, ArrowLeftRight, Share2 } from 'lucide-react';

import { useGroupContext } from '../context/GroupContext';
import { ShareDialog } from './ShareDialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function GroupHeader() {
	const { data: group, currentMember, clearIdentity } = useGroupContext();
	const { t } = useTranslation();
	const { groupId, section } = useParams();
	const [sharing, setSharing] = useState(false);
	const shareUrl = `${window.location.origin}/group/${groupId}`;

	const tabs = [
		{ key: 'transactions', label: t('TRANSACTIONS'), icon: Receipt },
		{ key: 'settlement', label: t('SETTLE_UP'), icon: ArrowLeftRight },
		{ key: 'config', label: t('CONFIG'), icon: Settings2 },
		{ key: 'history', label: t('HISTORY'), icon: History },
	];

	return (
		<div className="mb-9">
			<p className="text-muted-foreground text-center text-xs font-semibold tracking-[0.2em] uppercase">{t('EVENT')}</p>
			<h1 className="mt-1.5 text-center font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
				{group.config?.name || t('UNTITLED_EVENT')}
			</h1>

			{currentMember && (
				<p className="text-muted-foreground mt-2 text-center text-xs">
					{t('YOU')}: <span className="text-foreground font-medium">{currentMember.name}</span> ·{' '}
					<button type="button" onClick={clearIdentity} className="hover:text-foreground underline">
						{t('CHANGE')}
					</button>
				</p>
			)}

			<div className="mt-3 flex justify-center">
				<Button variant="outline" size="sm" onClick={() => setSharing(true)}>
					<Share2 className="size-4" /> {t('SHARE')}
				</Button>
			</div>

			{sharing && <ShareDialog url={shareUrl} onClose={() => setSharing(false)} />}

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
