import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeftRight, Check, Undo2 } from 'lucide-react';
import ObjectId from 'bson-objectid';

import { useGroupContext } from '../../context/GroupContext';
import { computeSettlement, type Transfer } from '../../utils/settlement';
import { trackTransferRecorded, trackTransferRemoved } from '../../utils/activity-tracker';
import { Avatar } from '../../components/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Transaction } from '../../types';

const SETTLED_EPS = 0.005;

export function GroupSettlement() {
	const { t } = useTranslation();
	const { data: group, updateGroup } = useGroupContext();
	const { netBalances, transfers, bankerId } = computeSettlement(group);

	const nameOf = (id: string) => group.members?.find((m) => m.id === id)?.name ?? id;
	const recorded = (group.transactions ?? []).filter((tx) => tx.type === 'transfer');

	function markPaid(transfer: Transfer) {
		const txn: Transaction = {
			id: String(new ObjectId()),
			type: 'transfer',
			date: new Date(),
			createdAt: new Date(),
			description: 'Settle up',
			total: transfer.amount,
			paidBy: { [transfer.fromId]: transfer.amount },
			paidFor: { [transfer.toId]: transfer.amount },
		};
		const updated = trackTransferRecorded(group, transfer.fromName, transfer.toName, transfer.amount);
		updated.transactions = [...(updated.transactions ?? []), txn];
		updateGroup(updated);
	}

	function undoTransfer(txn: Transaction) {
		const fromId = Object.keys(txn.paidBy)[0] ?? '';
		const toId = Object.keys(txn.paidFor)[0] ?? '';
		const updated = trackTransferRemoved(group, nameOf(fromId), nameOf(toId), txn.total);
		updated.transactions = (updated.transactions ?? []).filter((t) => t.id !== txn.id);
		updateGroup(updated);
	}

	if (!group.members || group.members.length === 0) {
		return (
			<Card className="mx-auto max-w-md text-center">
				<CardContent className="text-muted-foreground py-10">{t('No transactions found')}</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>{t('Balances')}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1">
						{netBalances.map((b) => {
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
										className="border-border/60 flex items-center gap-2 rounded-lg border px-3 py-2"
									>
										<span className="truncate text-sm font-semibold">{tr.fromName}</span>
										<ArrowRight className="text-muted-foreground size-4 shrink-0" />
										<span className="truncate text-sm font-semibold">{tr.toName}</span>
										<span className="tnum text-primary ml-auto font-semibold">${tr.amount}</span>
										<Button
											type="button"
											size="sm"
											variant="outline"
											className="ml-1 shrink-0"
											onClick={() => markPaid(tr)}
										>
											<Check /> {t('Mark paid')}
										</Button>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>

			{recorded.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>{t('Recorded payments')}</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{recorded.map((txn) => {
								const fromId = Object.keys(txn.paidBy)[0] ?? '';
								const toId = Object.keys(txn.paidFor)[0] ?? '';
								return (
									<li key={txn.id} className="border-border/60 flex items-center gap-2 rounded-lg border px-3 py-2">
										<span className="truncate text-sm font-medium">{nameOf(fromId)}</span>
										<ArrowRight className="text-muted-foreground size-4 shrink-0" />
										<span className="truncate text-sm font-medium">{nameOf(toId)}</span>
										<span className="tnum ml-auto font-semibold">${txn.total}</span>
										<span className="text-muted-foreground hidden text-xs sm:inline">
											{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : ''}
										</span>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											className="text-muted-foreground hover:text-destructive shrink-0"
											onClick={() => undoTransfer(txn)}
										>
											<Undo2 /> {t('Undo')}
										</Button>
									</li>
								);
							})}
						</ul>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
