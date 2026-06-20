import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PiggyBank } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { trackTopupRecorded } from '../../utils/activity-tracker';
import { generateId } from '../../utils/id';
import type { Transaction } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function GroupTopUp() {
	const { t } = useTranslation();
	const { groupId } = useParams();
	const navigate = useNavigate();
	const { data: group, updateGroup } = useGroupContext();
	const members = group.members ?? [];

	const [memberId, setMemberId] = useState<string>(members[0]?.id ?? '');
	const [amount, setAmount] = useState<number>(0);
	const [note, setNote] = useState<string>('');
	const [error, setError] = useState<string | null>(null);

	if (members.length === 0) {
		return (
			<Card className="mx-auto max-w-md text-center">
				<CardContent className="text-muted-foreground py-10">{t('No transactions found')}</CardContent>
			</Card>
		);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!memberId || !amount) {
			setError(t('Please choose a member and an amount.'));
			return;
		}
		const name = members.find((m) => m.id === memberId)?.name ?? '';
		const txn: Transaction = {
			id: generateId(),
			type: 'topup',
			date: new Date(),
			createdAt: new Date(),
			description: note || 'Top up',
			total: amount,
			paidBy: { [memberId]: amount },
			paidFor: {},
		};
		const updated = trackTopupRecorded(group, name, amount);
		updated.transactions = [...(updated.transactions ?? []), txn];
		updateGroup(updated);
		navigate(`/group/${groupId}/settlement`);
	}

	return (
		<form onSubmit={handleSubmit} className="mx-auto max-w-md">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PiggyBank className="text-primary size-5" /> {t('Top up')}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="topup-member" className="mb-1.5">
							{t('Member')}
						</Label>
						<select
							id="topup-member"
							value={memberId}
							onChange={(e) => setMemberId(e.target.value)}
							className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px]"
						>
							{members.map((m) => (
								<option key={m.id} value={m.id}>
									{m.name || t('Name')}
								</option>
							))}
						</select>
					</div>
					<div>
						<Label htmlFor="topup-amount" className="mb-1.5">
							{t('Amount')}
						</Label>
						<div className="relative">
							<span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
								$
							</span>
							<Input
								id="topup-amount"
								className="tnum pl-7"
								type="number"
								placeholder="0"
								value={amount || ''}
								onChange={(e) => setAmount(Number(e.target.value) || 0)}
							/>
						</div>
					</div>
					<div>
						<Label htmlFor="topup-note" className="mb-1.5">
							{t('Note')}
						</Label>
						<Input
							id="topup-note"
							type="text"
							placeholder={t('TypeHere')}
							value={note}
							onChange={(e) => setNote(e.target.value)}
						/>
					</div>
					<div className="flex items-center justify-end gap-4">
						{error && (
							<p role="alert" className="text-destructive text-sm font-medium">
								{error}
							</p>
						)}
						<Button type="submit">
							<PiggyBank /> {t('Top up')}
						</Button>
					</div>
				</CardContent>
			</Card>
		</form>
	);
}
