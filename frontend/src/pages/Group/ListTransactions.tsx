import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { Trash2, Plus, ReceiptText } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { trackTransactionDeleted } from '../../utils/activity-tracker';
import type { Transaction } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function GroupListTransactions() {
	const { t } = useTranslation();
	const { groupId } = useParams();
	const navigate = useNavigate();
	const { data: group, updateGroup } = useGroupContext();

	function handleDeleteTransaction(transaction: Transaction, event: MouseEvent<HTMLButtonElement>) {
		event.preventDefault();
		event.stopPropagation();

		if (window.confirm(`Are you sure you want to delete the transaction "${transaction.description}"?`)) {
			let updatedGroup = { ...group };

			// Track transaction deletion
			updatedGroup = trackTransactionDeleted(updatedGroup, transaction);

			// Remove transaction from the list
			updatedGroup.transactions = (updatedGroup.transactions || []).filter((tx) => tx.id !== transaction.id);

			updateGroup(updatedGroup);
		}
	}

	function renderTransaction(transaction: Transaction) {
		const { id, total, createdAt, description } = transaction;
		return (
			<TableRow key={id} className="cursor-pointer" onClick={() => navigate(`/group/${groupId}/transactions/${id}`)}>
				<TableCell className="text-muted-foreground tnum">
					{createdAt ? new Date(createdAt).toLocaleDateString() : '—'}
				</TableCell>
				<TableCell className="font-medium">{description}</TableCell>
				<TableCell className="tnum text-right font-semibold">${total}</TableCell>
				<TableCell className="w-12 text-right">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="text-muted-foreground hover:text-destructive size-8"
						onClick={(e) => handleDeleteTransaction(transaction, e)}
						aria-label={`Delete ${description}`}
					>
						<Trash2 className="size-4" />
					</Button>
				</TableCell>
			</TableRow>
		);
	}

	// Settle-up transfers and top-ups live on the Settle up page; the expenses list shows expenses only.
	const expenses = (group.transactions ?? []).filter((tx) => tx.type !== 'transfer' && tx.type !== 'topup');
	const hasTransactions = expenses.length > 0;

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
				<CardTitle>{t('Transactions')}</CardTitle>
				{hasTransactions && (
					<Button asChild size="sm">
						<Link to={`/group/${groupId}/transactions/new`}>
							<Plus /> {t('Add Transaction')}
						</Link>
					</Button>
				)}
			</CardHeader>
			<CardContent>
				{hasTransactions ? (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t('Date')}</TableHead>
								<TableHead>{t('Description')}</TableHead>
								<TableHead className="text-right">{t('Total')}</TableHead>
								<TableHead className="text-right">{t('Actions')}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>{expenses.map(renderTransaction)}</TableBody>
					</Table>
				) : (
					<div className="flex flex-col items-center gap-4 py-12 text-center">
						<span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
							<ReceiptText className="size-7" />
						</span>
						<p className="text-muted-foreground">{t('No transactions found')}</p>
						<Button asChild>
							<Link to={`/group/${groupId}/transactions/new`}>
								<Plus /> {t('Add Transaction')}
							</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
