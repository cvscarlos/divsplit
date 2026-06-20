import { useRef, useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Wallet, HandCoins, Save, Check } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { trackTransactionCreated, trackTransactionUpdated } from '../../utils/activity-tracker';
import { getTransactionError } from '../../utils/transaction';
import { generateId } from '../../utils/id';
import type { AmountMap, Transaction } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const PAID_BY = 'paid-by';
const PAID_FOR = 'paid-for';

type ListType = typeof PAID_BY | typeof PAID_FOR;

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

export function GroupTransaction({ transactionId }: { transactionId: string }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
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
	const [date, setDate] = useState<string>(formatDateForInput(existingTransaction?.date));
	const manuallyChanged = useRef<Record<string, boolean>>(existingTransaction?.manuallyChanged || {});
	const [error, setError] = useState<string | null>(null);

	// Update state when transaction changes (e.g., navigating between transactions)
	useEffect(() => {
		setPaidBy(existingTransaction?.paidBy || {});
		setPaidFor(existingTransaction?.paidFor || {});
		setTotal(existingTransaction?.total || 0);
		setDescription(existingTransaction?.description || '');
		setDate(formatDateForInput(existingTransaction?.date));
		manuallyChanged.current = existingTransaction?.manuallyChanged || {};
	}, [existingTransaction]);

	function handleMemberChange(listType: ListType, id: string, inputValue: string | number, isChecked: boolean) {
		const data = PAID_BY === listType ? paidBy : paidFor;
		const handler = PAID_BY === listType ? setPaidBy : setPaidFor;
		const numericValue = Number.parseFloat(String(inputValue));

		if (!isChecked) {
			delete data[id];
		}
		if (isChecked && !data[id]) {
			data[id] = 0; // força o item a existir
		}

		const tempData: AmountMap = { ...data };

		let manualChangedSum = 0;
		const manuallyChangedKeys = Object.keys(manuallyChanged.current);
		manuallyChangedKeys.forEach((key) => {
			manualChangedSum += key === id ? numericValue : data[key];
			delete tempData[key]; // Ignoro os que o usuário mudou manualmente
		});

		const tempDataKeys = Object.keys(tempData);
		const divideBy = Math.max(1, tempDataKeys.length || 1);
		const subtotal = Math.max(0, round((total - manualChangedSum) / divideBy));
		tempDataKeys.forEach((k) => {
			data[k] = subtotal;
		});

		// Caso a divisão não seja exata, ajusta a diferença na pessoa atual
		const currentTotal = Object.values(data).reduce((acc, val) => acc + val, 0);
		const currentTotalDiff = total - currentTotal;
		if (currentTotalDiff !== 0) {
			const personId = isChecked ? id : tempDataKeys[0];
			if (personId !== undefined) {
				const personTotal = round(data[personId] + currentTotalDiff);
				data[personId] = personTotal;
			}
		}

		if (isChecked) {
			if (numericValue) data[id] = numericValue;
		}

		handler({ ...data });
	}

	function getRemainingValue(fieldset: ListType): number {
		const data = PAID_BY === fieldset ? paidBy : paidFor;
		const values = Object.values(data);
		const sum = values.reduce((acc, value) => acc + value, 0);
		return round(total - sum);
	}

	function handleGroupSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const validationError = getTransactionError({ date, total, description });
		if (validationError) {
			setError(validationError);
			return;
		}
		setError(null);

		try {
			let updatedGroup = { ...group };
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

			if (isNew) {
				// Track transaction creation
				updatedGroup = trackTransactionCreated(updatedGroup, transactionData);
				updatedGroup.transactions = [...(updatedGroup.transactions ?? []), transactionData];
			} else {
				const transactions = updatedGroup.transactions ?? [];
				const transactionIndex = transactions.findIndex(({ id: txId }) => txId === transactionId);
				if (transactionIndex !== -1) {
					const oldTransaction = transactions[transactionIndex];
					// Track transaction update
					updatedGroup = trackTransactionUpdated(updatedGroup, oldTransaction, transactionData);
					const newTransactions = [...(updatedGroup.transactions ?? [])];
					newTransactions[transactionIndex] = { ...newTransactions[transactionIndex], ...transactionData };
					updatedGroup.transactions = newTransactions;
				} else {
					throw new Error('Transaction not found');
				}
			}
			updateGroup(updatedGroup);
			if (isNew) {
				navigate(`/group/${groupId}/transactions/${id}`);
			}
		} catch (err) {
			console.error('Error submitting transaction:', err);
			setError('Something went wrong saving this transaction.');
		}
	}

	function membersList(listType: ListType) {
		return group?.members?.map(({ id, name }) => {
			const data = PAID_BY === listType ? paidBy : paidFor;
			const checked = Boolean(data[id]);
			return (
				<label
					key={listType + id}
					className={cn(
						'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
						checked ? 'border-primary/60 bg-primary/5' : 'border-border/60 hover:bg-muted/40',
					)}
				>
					<input
						className="accent-primary size-4"
						type="checkbox"
						value={id}
						checked={checked}
						onChange={(e) => handleMemberChange(listType, id, 0, e.target.checked)}
					/>
					<span className="flex-1 text-sm font-medium">{name}</span>
					<div className="relative w-28">
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
							onKeyDown={() => {
								manuallyChanged.current[id] = true;
							}}
						/>
					</div>
				</label>
			);
		});
	}

	function remainingRow(listType: ListType) {
		const remaining = getRemainingValue(listType);
		const balanced = remaining === 0;
		return (
			<div className="mt-3 flex items-center justify-between border-t border-dashed pt-3 text-sm">
				<span className="text-muted-foreground">{t('Remaining')}</span>
				<span
					className={cn(
						'tnum inline-flex items-center gap-1 font-semibold',
						balanced ? 'text-muted-foreground' : 'text-primary',
					)}
				>
					{balanced && <Check className="size-4" />}${remaining}
				</span>
			</div>
		);
	}

	// Show demo data link if no members exist
	if (!group?.members || group.members.length === 0) {
		return (
			<Card className="mx-auto max-w-md text-center">
				<CardHeader>
					<CardTitle>{t('Transaction')}</CardTitle>
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
					<CardTitle>{t('Transaction')}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-3">
					<div>
						<Label htmlFor="tx-date" className="mb-1.5">
							{t('Date')}
						</Label>
						<Input id="tx-date" type="date" name="date" value={date} onChange={(e) => setDate(e.target.value)} />
					</div>
					<div>
						<Label htmlFor="tx-total" className="mb-1.5">
							{t('Total')}
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
								value={total || ''}
								onChange={(e) => setTotal(Number(e.target.value) || total)}
							/>
						</div>
					</div>
					<div>
						<Label htmlFor="tx-desc" className="mb-1.5">
							{t('Description')}
						</Label>
						<Input
							id="tx-desc"
							type="text"
							name="description"
							placeholder={t('TypeHere')}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Wallet className="text-primary size-5" /> {t('Paid by')}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">{membersList(PAID_BY)}</div>
						{remainingRow(PAID_BY)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<HandCoins className="text-primary size-5" /> {t('Paid for')}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">{membersList(PAID_FOR)}</div>
						{remainingRow(PAID_FOR)}
					</CardContent>
				</Card>
			</div>

			<div className="flex items-center justify-end gap-4">
				{error && (
					<p role="alert" className="text-destructive text-sm font-medium">
						{error}
					</p>
				)}
				<Button type="submit" size="lg">
					<Save /> {t('Save')}
				</Button>
			</div>
		</form>
	);
}
