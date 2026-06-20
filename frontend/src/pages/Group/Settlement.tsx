import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeftRight, Check, Undo2, PiggyBank } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { generateId } from '../../utils/id';
import { computeSettlement, type Transfer } from '../../utils/settlement';
import { trackTransferRecorded, trackTransferRemoved, trackTopupRemoved } from '../../utils/activity-tracker';
import { Avatar } from '../../components/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Transaction } from '../../types';

const SETTLED_EPS = 0.005;

// Shared row for the Top-ups / Recorded-payments lists: left content + amount + Undo.
function UndoRow({ children, amount, onUndo }: { children: ReactNode; amount: number; onUndo: () => void }) {
	const { t } = useTranslation();
	return (
		<li className="border-border/60 flex items-center gap-2 rounded-lg border px-3 py-2">
			{children}
			<span className="tnum ml-auto font-semibold">${amount}</span>
			<Button
				type="button"
				size="sm"
				variant="ghost"
				className="text-muted-foreground hover:text-destructive shrink-0"
				onClick={onUndo}
			>
				<Undo2 /> {t('Undo')}
			</Button>
		</li>
	);
}

export function GroupSettlement() {
	const { t } = useTranslation();
	const { groupId } = useParams();
	const { data: group, updateGroup } = useGroupContext();
	const { balances, transfers, holderId } = computeSettlement(group);

	const nameOf = (id: string) => group.members?.find((m) => m.id === id)?.name ?? id;
	const txns = group.transactions ?? [];
	const recordedTransfers = txns.filter((tx) => tx.type === 'transfer');
	const recordedTopups = txns.filter((tx) => tx.type === 'topup');

	const deposited: Record<string, number> = {};
	for (const tx of recordedTopups) {
		for (const [id, amount] of Object.entries(tx.paidBy)) deposited[id] = (deposited[id] ?? 0) + amount;
	}

	function markPaid(transfer: Transfer) {
		const txn: Transaction = {
			id: generateId(),
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

	function removeTransaction(txn: Transaction) {
		const fromId = Object.keys(txn.paidBy)[0] ?? '';
		const updated =
			txn.type === 'topup'
				? trackTopupRemoved(group, nameOf(fromId), txn.total)
				: trackTransferRemoved(group, nameOf(fromId), nameOf(Object.keys(txn.paidFor)[0] ?? ''), txn.total);
		updated.transactions = (updated.transactions ?? []).filter((tx) => tx.id !== txn.id);
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
			<div className="flex justify-end">
				<Button asChild variant="outline" size="sm">
					<Link to={`/group/${groupId}/topup`}>
						<PiggyBank /> {t('Top up')}
					</Link>
				</Button>
			</div>

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
									<span className="min-w-0 flex-1">
										<span className="flex items-center gap-2 text-sm font-medium">
											<span className="truncate">{b.name}</span>
											{b.memberId === holderId && <Badge variant="muted">{t('Holder')}</Badge>}
										</span>
										{deposited[b.memberId] ? (
											<span className="text-muted-foreground tnum block text-xs">
												{t('Deposited')} ${deposited[b.memberId]}
											</span>
										) : null}
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

			{recordedTopups.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>{t('Top-ups')}</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{recordedTopups.map((txn) => {
								const memberId = Object.keys(txn.paidBy)[0] ?? '';
								return (
									<UndoRow key={txn.id} amount={txn.total} onUndo={() => removeTransaction(txn)}>
										<PiggyBank className="text-primary size-4 shrink-0" />
										<span className="truncate text-sm font-medium">{nameOf(memberId)}</span>
									</UndoRow>
								);
							})}
						</ul>
					</CardContent>
				</Card>
			)}

			{recordedTransfers.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>{t('Recorded payments')}</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{recordedTransfers.map((txn) => {
								const fromId = Object.keys(txn.paidBy)[0] ?? '';
								const toId = Object.keys(txn.paidFor)[0] ?? '';
								return (
									<UndoRow key={txn.id} amount={txn.total} onUndo={() => removeTransaction(txn)}>
										<span className="truncate text-sm font-medium">{nameOf(fromId)}</span>
										<ArrowRight className="text-muted-foreground size-4 shrink-0" />
										<span className="truncate text-sm font-medium">{nameOf(toId)}</span>
									</UndoRow>
								);
							})}
						</ul>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
