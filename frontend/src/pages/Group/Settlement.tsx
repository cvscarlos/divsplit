import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeftRight } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { computeSettlement } from '../../utils/settlement';
import { Avatar } from '../../components/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SETTLED_EPS = 0.005;

export function GroupSettlement() {
	const { t } = useTranslation();
	const { data: group } = useGroupContext();
	const { balances, transfers, bankerId } = computeSettlement(group);

	if (!group.members || group.members.length === 0) {
		return (
			<Card className="mx-auto max-w-md text-center">
				<CardContent className="text-muted-foreground py-10">{t('No transactions found')}</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>{t('Balances')}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-1">
					{balances.map((b) => {
						const settled = Math.abs(b.balance) < SETTLED_EPS;
						const positive = b.balance > 0;
						return (
							<div
								key={b.memberId}
								className="border-border/60 flex items-center gap-3 border-b border-dashed py-2 last:border-0"
							>
								<Avatar name={b.name} className="size-8 text-xs" />
								<span className="flex-1 truncate text-sm font-medium">
									{b.name}
									{b.memberId === bankerId && (
										<Badge variant="muted" className="ml-2 align-middle">
											{t('Banker')}
										</Badge>
									)}
								</span>
								<span
									className={cn(
										'tnum text-sm font-semibold',
										settled ? 'text-muted-foreground' : positive ? 'text-primary' : 'text-foreground',
									)}
								>
									{settled ? t('settled') : `$${Math.abs(b.balance)}`}
								</span>
								{!settled && (
									<Badge variant={positive ? 'default' : 'secondary'}>{positive ? t('gets back') : t('owes')}</Badge>
								)}
							</div>
						);
					})}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t('Transfers')}</CardTitle>
				</CardHeader>
				<CardContent>
					{transfers.length === 0 ? (
						<div className="flex flex-col items-center gap-3 py-10 text-center">
							<span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
								<ArrowLeftRight className="size-7" />
							</span>
							<p className="text-muted-foreground">{t('Everyone is settled up')}</p>
						</div>
					) : (
						<ul className="space-y-2">
							{transfers.map((tr, i) => (
								<li
									key={`${tr.fromId}-${tr.toId}-${i}`}
									className="border-border/60 flex items-center gap-2 rounded-lg border px-3 py-2.5"
								>
									<span className="truncate text-sm font-semibold">{tr.fromName}</span>
									<span className="text-muted-foreground hidden text-xs sm:inline">{t('pays')}</span>
									<ArrowRight className="text-muted-foreground size-4 shrink-0" />
									<span className="truncate text-sm font-semibold">{tr.toName}</span>
									<span className="tnum text-primary ml-auto font-semibold">${tr.amount}</span>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
