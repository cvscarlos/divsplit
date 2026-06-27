import type { ReactNode } from 'react';
import { round as npRound, plus, minus } from 'number-precision';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeftRight, Check, Undo2, PiggyBank } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { generateId } from '../../utils/id';
import { computeSettlement, type Transfer } from '../../utils/settlement';
import { formatMoney } from '../../utils/money';
import { Avatar } from '../../components/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Transaction } from '../../types';

const SETTLED_EPS = 0.005;

// Settle-up pills/amounts reuse the transaction split palette: receiving (credit, "a receber")
// = emerald, owing (debit, "a pagar") = amber — the same green/orange as the Paid-by / Consumed-by columns.
const settlePill = (positive: boolean) => (positive ? 'bg-emerald-500' : 'bg-amber-500');
const settleAmount = (positive: boolean) =>
	positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';

// Shared row for the Top-ups / Recorded-payments lists: left content + amount + Undo.
function UndoRow({ children, amount, onUndo }: { children: ReactNode; amount: number; onUndo: () => void }) {
	const { t, i18n } = useTranslation();
	return (
		<li className="border-border/60 flex items-center gap-2 rounded-lg border px-3 py-2">
			{children}
			<span className="tnum ml-auto font-semibold">{formatMoney(amount, i18n.language)}</span>
			<Button
				type="button"
				size="sm"
				variant="ghost"
				className="text-muted-foreground hover:text-destructive shrink-0"
				onClick={onUndo}
			>
				<Undo2 /> {t('UNDO')}
			</Button>
		</li>
	);
}

export function GroupSettlement() {
	const { t, i18n } = useTranslation();
	const { groupId } = useParams();
	const { data: group, updateGroup } = useGroupContext();
	const { balances, transfers, holderId } = computeSettlement(group);

	const nameOf = (id: string) => group.members?.find((m) => m.id === id)?.name || id;
	const txns = group.transactions || [];
	const recordedTransfers = txns.filter((tx) => tx.type === 'transfer');
	const recordedTopups = txns.filter((tx) => tx.type === 'topup');

	const deposited: Record<string, number> = {};
	for (const tx of recordedTopups) {
		for (const [id, amount] of Object.entries(tx.paidBy)) deposited[id] = plus(deposited[id] || 0, amount);
	}
	// Total top-up cash the holder physically keeps on behalf of the whole group.
	const heldPool = Object.values(deposited).reduce((sum, v) => plus(sum, v), 0);

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
		updateGroup({ ...group, transactions: [...(group.transactions || []), txn] });
	}

	function removeTransaction(txn: Transaction) {
		updateGroup({ ...group, transactions: (group.transactions || []).filter((tx) => tx.id !== txn.id) });
	}

	if (!group.members || group.members.length === 0) {
		return (
			<Card className="mx-auto max-w-md text-center">
				<CardContent className="text-muted-foreground py-10">{t('NO_TRANSACTIONS_FOUND')}</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-end">
				<Button asChild variant="outline" size="sm">
					<Link to={`/group/${groupId}/topup`}>
						<PiggyBank /> {t('TOP_UP')}
					</Link>
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>{t('BALANCES')}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1">
						{balances.map((b) => {
							const settled = Math.abs(b.balance) < SETTLED_EPS;
							const positive = b.balance > 0;
							// The holder physically keeps the whole top-up pool, so their real position is
							// their balance minus what they hold for everyone — often flipping them to "owes".
							const isHolder = b.memberId === holderId;
							const showHeld = isHolder && heldPool > SETTLED_EPS;
							const final = npRound(minus(b.balance, heldPool), 2);
							const finalSettled = Math.abs(final) < SETTLED_EPS;
							const finalPositive = final > 0;
							return (
								<div
									key={b.memberId}
									className="border-border/60 flex items-center gap-3 border-b border-dashed py-2 last:border-0"
								>
									<Avatar name={b.name} className="size-8 text-xs" />
									<span className="min-w-0 flex-1">
										<span className="flex items-center gap-2 text-sm font-medium">
											<span className="truncate">{b.name}</span>
											{isHolder && <Badge variant="muted">{t('HOLDER')}</Badge>}
										</span>
										{deposited[b.memberId] ? (
											<span className="text-muted-foreground tnum block text-xs">
												{t('DEPOSITED')} {formatMoney(deposited[b.memberId], i18n.language)}
											</span>
										) : null}
									</span>

									{showHeld ? (
										<div className="text-right">
											<span className="text-muted-foreground tnum block text-xs">
												{t('GETS_BACK')} {formatMoney(b.balance, i18n.language)}
											</span>
											<span className="text-muted-foreground tnum block text-xs">
												{t('CAIXA_HELD')} −{formatMoney(heldPool, i18n.language)}
											</span>
											<span className="mt-1 flex items-center justify-end gap-2">
												<span
													className={cn(
														'tnum text-sm font-semibold',
														finalSettled ? 'text-muted-foreground' : settleAmount(finalPositive),
													)}
												>
													{finalSettled ? t('SETTLED') : formatMoney(Math.abs(final), i18n.language)}
												</span>
												{!finalSettled && (
													<Badge className={cn('text-white', settlePill(finalPositive))}>
														{finalPositive ? t('GETS_BACK') : t('OWES')}
													</Badge>
												)}
											</span>
										</div>
									) : (
										<>
											<span
												className={cn(
													'tnum text-sm font-semibold',
													settled ? 'text-muted-foreground' : settleAmount(positive),
												)}
											>
												{settled ? t('SETTLED') : formatMoney(Math.abs(b.balance), i18n.language)}
											</span>
											{!settled && (
												<Badge className={cn('text-white', settlePill(positive))}>
													{positive ? t('GETS_BACK') : t('OWES')}
												</Badge>
											)}
										</>
									)}
								</div>
							);
						})}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t('TRANSFERS')}</CardTitle>
					</CardHeader>
					<CardContent>
						{transfers.length === 0 ? (
							<div className="flex flex-col items-center gap-3 py-10 text-center">
								<span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
									<ArrowLeftRight className="size-7" />
								</span>
								<p className="text-muted-foreground">{t('EVERYONE_IS_SETTLED_UP')}</p>
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
										<span className="tnum text-primary ml-auto font-semibold">
											{formatMoney(tr.amount, i18n.language)}
										</span>
										<Button
											type="button"
											size="sm"
											variant="outline"
											className="ml-1 shrink-0"
											onClick={() => markPaid(tr)}
										>
											<Check /> {t('MARK_PAID')}
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
						<CardTitle>{t('TOP_UPS')}</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{recordedTopups.map((txn) => {
								const memberId = Object.keys(txn.paidBy)[0] || '';
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
						<CardTitle>{t('RECORDED_PAYMENTS')}</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{recordedTransfers.map((txn) => {
								const fromId = Object.keys(txn.paidBy)[0] || '';
								const toId = Object.keys(txn.paidFor)[0] || '';
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
