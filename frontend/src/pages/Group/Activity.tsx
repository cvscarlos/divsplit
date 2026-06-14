import { useTranslation } from 'react-i18next';
import { Users, Receipt, Trash2, Pencil, Plus, History, ArrowLeftRight, PiggyBank } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { ACTIVITY_TYPES } from '../../utils/activity-tracker';
import type { Activity } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function GroupActivity() {
	const { t } = useTranslation();
	const { data: group } = useGroupContext();

	function getActivityIcon(type: string): { Icon: LucideIcon; tone: string } {
		switch (type) {
			case ACTIVITY_TYPES.GROUP_UPDATED:
				return { Icon: Users, tone: 'bg-accent text-accent-foreground' };
			case ACTIVITY_TYPES.MEMBER_CREATED:
				return { Icon: Plus, tone: 'bg-primary/15 text-primary' };
			case ACTIVITY_TYPES.MEMBER_UPDATED:
				return { Icon: Pencil, tone: 'bg-accent text-accent-foreground' };
			case ACTIVITY_TYPES.MEMBER_DELETED:
				return { Icon: Trash2, tone: 'bg-destructive/15 text-destructive' };
			case ACTIVITY_TYPES.TRANSACTION_CREATED:
				return { Icon: Plus, tone: 'bg-primary/15 text-primary' };
			case ACTIVITY_TYPES.TRANSACTION_UPDATED:
				return { Icon: Pencil, tone: 'bg-accent text-accent-foreground' };
			case ACTIVITY_TYPES.TRANSACTION_DELETED:
				return { Icon: Trash2, tone: 'bg-destructive/15 text-destructive' };
			case ACTIVITY_TYPES.TRANSFER_RECORDED:
				return { Icon: ArrowLeftRight, tone: 'bg-primary/15 text-primary' };
			case ACTIVITY_TYPES.TRANSFER_REMOVED:
				return { Icon: Trash2, tone: 'bg-destructive/15 text-destructive' };
			case ACTIVITY_TYPES.TOPUP_RECORDED:
				return { Icon: PiggyBank, tone: 'bg-primary/15 text-primary' };
			case ACTIVITY_TYPES.TOPUP_REMOVED:
				return { Icon: Trash2, tone: 'bg-destructive/15 text-destructive' };
			default:
				return { Icon: Receipt, tone: 'bg-muted text-muted-foreground' };
		}
	}

	function formatTimestamp(timestamp: string | Date) {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

		if (diffInHours < 1) {
			const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
			return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
		} else if (diffInHours < 24) {
			const hours = Math.floor(diffInHours);
			return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		} else if (diffInHours < 168) {
			const days = Math.floor(diffInHours / 24);
			return `${days} day${days > 1 ? 's' : ''} ago`;
		} else {
			return date.toLocaleDateString();
		}
	}

	function renderActivity(activity: Activity) {
		const { id, type, description, timestamp } = activity;
		const { Icon, tone } = getActivityIcon(type);

		return (
			<li key={id} className="flex items-start gap-4 py-4">
				<span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
					<Icon className="size-4" />
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-sm leading-snug">{description}</p>
					<p className="text-muted-foreground mt-0.5 text-xs">{formatTimestamp(timestamp)}</p>
				</div>
			</li>
		);
	}

	const activities = group.activities || [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('Activity Log')}</CardTitle>
			</CardHeader>
			<CardContent>
				{activities.length > 0 ? (
					<ul className="divide-border divide-y">{activities.map(renderActivity)}</ul>
				) : (
					<div className="flex flex-col items-center gap-3 py-12 text-center">
						<span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
							<History className="size-7" />
						</span>
						<p className="text-muted-foreground">No activity yet</p>
						<p className="text-muted-foreground/70 max-w-xs text-sm">
							Activity will appear here when you make changes to the group or transactions.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
