import { useRef, useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Wallet, HandCoins, Save, Check, Trash2, Wand2 } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { useToast } from '../../components/Toast';
import { getTransactionError, autoSplit, round, isTransactionBalanced, splitCents } from '../../utils/transaction';
import { formatMoney } from '../../utils/money';
import { generateId } from '../../utils/id';
import type { AmountMap, Group, Transaction } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const PAID_BY = 'paid-by';
const PAID_FOR = 'paid-for';

type ListType = typeof PAID_BY | typeof PAID_FOR;

// Credit vs debit at a glance: who put money in (green) vs who used it (amber).
const COLUMN_STYLE: Record<ListType, { row: string; accent: string; tint: string }> = {
	[PAID_BY]: {
		row: 'border-emerald-500/60 bg-emerald-500/10',
		accent: 'accent-emerald-500',
		tint: 'text-emerald-600 dark:text-emerald-400',
	},
	[PAID_FOR]: {
		row: 'border-amber-500/60 bg-amber-500/10',
		accent: 'accent-amber-500',
		tint: 'text-amber-600 dark:text-amber-400',
	},
};

export function GroupTransaction({ transactionId }: { transactionId: string }) {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const toast = useToast();
	const { groupId } = useParams();
	const { data: group, updateGroup, loadDemo } = useGroupContext();

	// Find existing transaction or use defaults
	const existingTransaction =
		transactionId !== 'new' ? group.transactions?.find(({ id }) => id === transactionId) : null;

	// Helper function to format date for input field
	const formatDateForInput = (dateValue?: string | Date) => {
		if (!dateValue) return '';
		const date = new Date(dateValue);
		return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
	};

	// Initialize state with existing data or defaults
	const [paidBy, setPaidBy] = useState<AmountMap>(existingTransaction?.paidBy || {});
	const [paidFor, setPaidFor] = useState<AmountMap>(existingTransaction?.paidFor || {});
	const [total, setTotal] = useState<number>(existingTransaction?.total || 0);
	const [description, setDescription] = useState<string>(existingTransaction?.description || '');
	const [date, setDate] = useState<string>(formatDateForInput(existingTransaction?.date || new Date()));
	const manuallyChanged = useRef<Record<string, boolean>>(existingTransaction?.manuallyChanged || {});
	const [error, setError] = useState<string | null>(null);
	const [attempted, setAttempted] = useState(false);
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	// Update state when transaction changes (e.g., navigating between transactions)
	useEffect(() => {
		setPaidBy(existingTransaction?.paidBy || {});
		setPaidFor(existingTransaction?.paidFor || {});
		setTotal(existingTransaction?.total || 0);
		setDescription(existingTransaction?.description || '');
		setDate(formatDateForInput(existingTransaction?.date || new Date()));
		manuallyChanged.current = existingTransaction?.manuallyChanged || {};
	}, [existingTransaction]);

	function handleMemberChange(listType: ListType, id: string, inputValue: string | number, isChecked: boolean) {
		const data = PAID_BY === listType ? paidBy : paidFor;
		const handler = PAID_BY === listType ? setPaidBy : setPaidFor;
		const next: AmountMap = { ...data };

		if (!isChecked) {
			// Unchecked (or the amount field cleared) → drop the member and its manual flag.
			delete next[id];
			delete manuallyChanged.current[id];
		} else {
			const numericValue = Number.parseFloat(String(inputValue));
			if (Number.isFinite(numericValue) && numericValue > 0) {
				// The user typed an amount → pin it; the rest auto-split around it.
				manuallyChanged.current[id] = true;
				next[id] = numericValue;
			} else if (!(id in next)) {
				// Just checked, no amount yet → joins the auto-split pool.
				next[id] = 0;
			}
		}

		handler(autoSplit(next, manuallyChanged.current, total));
	}

	function getRemainingValue(fieldset: ListType): number {
		const data = PAID_BY === fieldset ? paidBy : paidFor;
		const values = Object.values(data);
		const sum = values.reduce((acc, value) => acc + value, 0);
		return round(total - sum);
	}

	// Per-member "Add" link: dump the whole leftover onto this one person, balancing the
	// column in one click. Fair distribution across everyone is the "split equally" action.
	function fillRemaining(listType: ListType, id: string) {
		const data = PAID_BY === listType ? paidBy : paidFor;
		const handler = PAID_BY === listType ? setPaidBy : setPaidFor;
		const remaining = getRemainingValue(listType);
		if (remaining === 0) return;
		manuallyChanged.current[id] = true;
		handler({ ...data, [id]: round((data[id] || 0) + remaining) });
	}

	// Bottom action: spread the whole leftover across everyone as evenly as possible (the
	// indivisible cents land on the first members), balancing the column in one click.
	function distributeRemaining(listType: ListType) {
		const data = PAID_BY === listType ? paidBy : paidFor;
		const handler = PAID_BY === listType ? setPaidBy : setPaidFor;
		const ids = Object.keys(data);
		const remCents = Math.round(getRemainingValue(listType) * 100);
		if (!ids.length || remCents === 0) return;
		const adds = splitCents(remCents, ids.length);
		const next: AmountMap = { ...data };
		ids.forEach((id, i) => {
			next[id] = round((next[id] || 0) + adds[i] / 100);
			manuallyChanged.current[id] = true;
		});
		handler(next);
	}

	function handleGroupSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const validationError = getTransactionError({ date, total, description });
		if (validationError) {
			setError(validationError);
			return;
		}
		setError(null);
		// Both sides must add up to the total — block saving a split that leaves money
		// unassigned (e.g. a rounding remainder), even when editing a previously-bad row.
		// `attempted` lights up the offending column until it's balanced.
		if (!isTransactionBalanced(total, paidBy, paidFor)) {
			setAttempted(true);
			return;
		}

		try {
			const updatedGroup: Group = { ...group };
			const transactionDate = new Date(date);
			const isNew = transactionId === 'new';
			const id = isNew ? generateId() : transactionId;

			const transactionData: Transaction = {
				id,
				date: transactionDate,
				description,
				total,
				paidBy,
				paidFor,
				manuallyChanged: manuallyChanged.current,
				...(isNew ? { createdAt: new Date() } : { updatedAt: new Date() }),
			};

			const transactions = updatedGroup.transactions || [];
			if (isNew) {
				updatedGroup.transactions = [...transactions, transactionData];
			} else {
				const transactionIndex = transactions.findIndex(({ id: txId }) => txId === transactionId);
				if (transactionIndex === -1) throw new Error('Transaction not found');
				const newTransactions = [...transactions];
				newTransactions[transactionIndex] = { ...newTransactions[transactionIndex], ...transactionData };
				updatedGroup.transactions = newTransactions;
			}
			updateGroup(updatedGroup);
			toast(t('SAVED'));
			navigate(`/group/${groupId}/transactions`);
		} catch (err) {
			console.error('Error submitting transaction:', err);
			setError('Something went wrong saving this transaction.');
		}
	}

	function confirmDelete() {
		if (!existingTransaction) return;
		const updatedGroup: Group = {
			...group,
			transactions: (group.transactions || []).filter((tx) => tx.id !== existingTransaction.id),
		};
		updateGroup(updatedGroup);
		toast(t('DELETED'));
		navigate(`/group/${groupId}/transactions`);
	}

	function membersList(listType: ListType) {
		const style = COLUMN_STYLE[listType];
		const remaining = getRemainingValue(listType); // 0 when balanced
		return group?.members?.map(({ id, name }) => {
			const data = PAID_BY === listType ? paidBy : paidFor;
			const checked = id in data;
			return (
				<label
					key={listType + id}
					className={cn(
						'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
						checked ? style.row : 'border-border/60 hover:bg-muted/40',
					)}
				>
					<input
						className={cn('size-4', style.accent)}
						type="checkbox"
						value={id}
						checked={checked}
						onChange={(e) => handleMemberChange(listType, id, 0, e.target.checked)}
					/>
					<span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
					{checked && remaining !== 0 && (
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								fillRemaining(listType, id);
							}}
							className="text-muted-foreground hover:text-foreground inline-flex shrink-0 cursor-pointer items-center gap-1 text-[10px] font-medium underline-offset-2 hover:underline"
							title={t('ADD_REMAINING_TO_MEMBER')}
							aria-label={t('ADD_REMAINING_TO_MEMBER')}
						>
							<Wand2 className="size-3" />
							{t('ADD')}{' '}
							<span className="tnum">
								{remaining > 0 ? '+' : ''}
								{formatMoney(remaining, i18n.language)}
							</span>
						</button>
					)}
					<div className="relative w-36 shrink-0">
						<span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
							$
						</span>
						<Input
							className="tnum h-9 pl-7"
							type="number"
							name={`${id}-value`}
							placeholder="0"
							value={data[id] || ''}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								handleMemberChange(listType, id, e.target.value, Boolean(e.target.value))
							}
						/>
					</div>
				</label>
			);
		});
	}

	function remainingRow(listType: ListType) {
		const remaining = getRemainingValue(listType);
		const balanced = remaining === 0;
		const invalid = attempted && !balanced; // flagged after a blocked save until balanced
		const memberCount = Object.keys(PAID_BY === listType ? paidBy : paidFor).length;
		const perEach = memberCount ? round(remaining / memberCount) : 0;
		return (
			<div
				className={cn(
					'mt-3 flex items-center justify-between text-sm',
					invalid ? 'bg-destructive/10 rounded-md px-3 py-2' : 'border-t border-dashed pt-3',
				)}
			>
				<span className="flex items-center gap-3">
					<span className={invalid ? 'text-destructive' : 'text-muted-foreground'}>{t('REMAINING')}</span>
					{!balanced && perEach !== 0 && (
						<button
							type="button"
							onClick={() => distributeRemaining(listType)}
							className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-[10px] font-medium underline-offset-2 hover:underline"
						>
							<Wand2 className="size-3" />
							{t('SPLIT_EQUALLY')}{' '}
							<span className="tnum">
								({perEach > 0 ? '+' : ''}
								{formatMoney(perEach, i18n.language)})
							</span>
						</button>
					)}
				</span>
				<span
					className={cn(
						'tnum inline-flex items-center gap-1 font-semibold',
						balanced ? 'text-muted-foreground' : invalid ? 'text-destructive' : COLUMN_STYLE[listType].tint,
					)}
				>
					{balanced && <Check className="size-4" />}
					{formatMoney(remaining, i18n.language)}
				</span>
			</div>
		);
	}

	// Show demo data link if no members exist
	if (!group?.members || group.members.length === 0) {
		return (
			<Card className="mx-auto max-w-md text-center">
				<CardHeader>
					<CardTitle>{t('TRANSACTION')}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground text-sm">No members found in this group.</p>
					<Button variant="outline" onClick={loadDemo}>
						Load demo data
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<form onSubmit={handleGroupSubmit} className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t('TRANSACTION')}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-3">
					<div>
						<Label htmlFor="tx-date" className="mb-1.5">
							{t('DATE')}
						</Label>
						<Input
							id="tx-date"
							type="date"
							name="date"
							aria-invalid={Boolean(error) && !date}
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor="tx-total" className="mb-1.5">
							{t('TOTAL')}
						</Label>
						<div className="relative">
							<span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
								$
							</span>
							<Input
								id="tx-total"
								className="tnum pl-7"
								type="number"
								name="total"
								placeholder="0"
								aria-invalid={Boolean(error) && !total}
								value={total || ''}
								onChange={(e) => setTotal(Number(e.target.value) || total)}
							/>
						</div>
					</div>
					<div>
						<Label htmlFor="tx-desc" className="mb-1.5">
							{t('DESCRIPTION')}
						</Label>
						<Input
							id="tx-desc"
							type="text"
							name="description"
							placeholder={t('TYPE_HERE')}
							aria-invalid={Boolean(error) && !description}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 md:grid-cols-2">
				<Card className={cn(attempted && getRemainingValue(PAID_BY) !== 0 && 'border-destructive')}>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Wallet className={cn('size-5', COLUMN_STYLE[PAID_BY].tint)} /> {t('PAID_BY')}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">{membersList(PAID_BY)}</div>
						{remainingRow(PAID_BY)}
					</CardContent>
				</Card>

				<Card className={cn(attempted && getRemainingValue(PAID_FOR) !== 0 && 'border-destructive')}>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<HandCoins className={cn('size-5', COLUMN_STYLE[PAID_FOR].tint)} /> {t('PAID_FOR')}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">{membersList(PAID_FOR)}</div>
						{remainingRow(PAID_FOR)}
					</CardContent>
				</Card>
			</div>

			<div className="flex items-center justify-between gap-4">
				{existingTransaction ? (
					<Button
						type="button"
						variant="ghost"
						className="text-muted-foreground hover:text-destructive"
						onClick={() => setConfirmingDelete(true)}
					>
						<Trash2 /> {t('DELETE')}
					</Button>
				) : (
					<span />
				)}
				<div className="flex items-center gap-4">
					{(error || (attempted && !isTransactionBalanced(total, paidBy, paidFor))) && (
						<p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-1.5 text-sm font-medium">
							{error || t('SPLIT_NOT_BALANCED')}
						</p>
					)}
					<Button type="submit" size="lg">
						<Save /> {t('SAVE')}
					</Button>
				</div>
			</div>

			{confirmingDelete && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
					role="dialog"
					aria-modal="true"
				>
					<Card className="w-full max-w-sm">
						<CardHeader>
							<CardTitle>{t('DELETE_THIS_TRANSACTION')}</CardTitle>
							<CardDescription>{t('DELETE_TRANSACTION_HINT')}</CardDescription>
						</CardHeader>
						<CardContent className="flex justify-end gap-2">
							<Button type="button" variant="outline" onClick={() => setConfirmingDelete(false)}>
								{t('CANCEL')}
							</Button>
							<Button type="button" variant="destructive" onClick={confirmDelete}>
								<Trash2 /> {t('DELETE')}
							</Button>
						</CardContent>
					</Card>
				</div>
			)}
		</form>
	);
}
