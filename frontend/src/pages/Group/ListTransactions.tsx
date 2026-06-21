import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Pencil, Plus, ReceiptText, ArrowUp, ArrowDown, Check } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { formatMoney } from '../../utils/money';
import type { Transaction } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type SortKey = 'date' | 'description' | 'total';

export function GroupListTransactions() {
	const { t, i18n } = useTranslation();
	const { groupId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { data: group } = useGroupContext();
	const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });
	// Saving a transaction navigates here with { saved: true }; show a pill, then consume the flag.
	const [justSaved, setJustSaved] = useState(Boolean((location.state as { saved?: boolean } | null)?.saved));

	useEffect(() => {
		if (!justSaved) return;
		navigate(location.pathname, { replace: true, state: null }); // so a reload won't re-show it
		const timer = setTimeout(() => setJustSaved(false), 2400);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function toggleSort(key: SortKey) {
		// Click a new column → sensible default (text asc, date/number desc); same column → flip.
		setSort((s) =>
			s.key === key
				? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
				: { key, dir: key === 'description' ? 'asc' : 'desc' },
		);
	}

	const locale = i18n.language.startsWith('pt') ? 'pt-BR' : 'en-US';

	function renderTransaction(transaction: Transaction) {
		const { id, total, date, description } = transaction;
		return (
			<TableRow key={id} className="cursor-pointer" onClick={() => navigate(`/group/${groupId}/transactions/${id}`)}>
				<TableCell className="text-muted-foreground tnum">
					{date ? new Date(date).toLocaleDateString(locale) : '—'}
				</TableCell>
				<TableCell className="font-medium">{description}</TableCell>
				<TableCell className="tnum text-right font-semibold">{formatMoney(total, i18n.language)}</TableCell>
				<TableCell className="w-12 text-right">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="text-muted-foreground hover:text-primary size-8"
						onClick={() => navigate(`/group/${groupId}/transactions/${id}`)}
						aria-label={`Edit ${description}`}
					>
						<Pencil className="size-4" />
					</Button>
				</TableCell>
			</TableRow>
		);
	}

	// Settle-up transfers and top-ups live on the Settle up page; the expenses list shows expenses only.
	const expenses = (group.transactions ?? []).filter((tx) => tx.type !== 'transfer' && tx.type !== 'topup');
	const hasTransactions = expenses.length > 0;

	const sorted = [...expenses].sort((a, b) => {
		const cmp =
			sort.key === 'date'
				? new Date(a.date).getTime() - new Date(b.date).getTime()
				: sort.key === 'total'
					? a.total - b.total
					: a.description.localeCompare(b.description);
		return sort.dir === 'asc' ? cmp : -cmp;
	});

	const SortHead = ({ col, label, align }: { col: SortKey; label: string; align?: 'right' }) => (
		<TableHead className={align === 'right' ? 'text-right' : undefined}>
			<button
				type="button"
				onClick={() => toggleSort(col)}
				className={`hover:text-foreground inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}
			>
				{label}
				{sort.key === col &&
					(sort.dir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />)}
			</button>
		</TableHead>
	);

	return (
		<>
			{justSaved && (
				<div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center">
					<span className="save-pill inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
						<Check className="size-4" /> {t('Saved')}
					</span>
				</div>
			)}
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
									<SortHead col="date" label={t('Date')} />
									<SortHead col="description" label={t('Description')} />
									<SortHead col="total" label={t('Total')} align="right" />
									<TableHead className="text-right">{t('Edit')}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>{sorted.map(renderTransaction)}</TableBody>
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
		</>
	);
}
