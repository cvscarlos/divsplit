import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, UserPlus, Save, Check } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { Avatar } from '../../components/Avatar';
import { generateId } from '../../utils/id';
import { EVENT_ICONS } from '../../utils/event-icons';
import { memberInTransactions, reassignMember } from '../../utils/members';
import type { Group, Member, Transaction } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function GroupConfig() {
	const memberBase: Member = { id: generateId(), name: '' };

	const { data: group, updateGroup } = useGroupContext();
	const [formFields, setFormFields] = useState<{ name: string }>({ name: '' });
	const [members, setMembers] = useState<Member[]>([{ ...memberBase }]);
	const [holderId, setHolderId] = useState<string>('');
	const [icon, setIcon] = useState<string>('');
	const [saved, setSaved] = useState(false);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	// The member pending deletion that still has transactions to reassign, and the target.
	const [reassignFrom, setReassignFrom] = useState<Member | null>(null);
	const [reassignTo, setReassignTo] = useState<string>('');
	const { t } = useTranslation();

	useEffect(() => {
		setFormFields({ name: group.config?.name || '---' });
		// Clone so editing a name doesn't mutate the context's member objects in place.
		if (group.members) setMembers(group.members.map((m) => ({ ...m })));
		setHolderId(group.config?.holderId || group.members?.[0]?.id || '');
		setIcon(group.config?.icon || '');
		setTransactions(group.transactions ?? []);
	}, [group]);

	function addMember() {
		setMembers([...members, { ...memberBase, id: generateId() }]);
	}
	function removeMember(member: Member) {
		// If the member has transactions, ask where to move them before removing.
		if (memberInTransactions(transactions, member.id)) {
			setReassignTo(members.find((m) => m.id !== member.id)?.id ?? '');
			setReassignFrom(member);
			return;
		}
		const remaining = members.filter((m) => m.id !== member.id);
		setMembers(remaining);
		// If we removed the cash holder, hand the role to the first remaining member.
		if (member.id === holderId) setHolderId(remaining[0]?.id ?? '');
	}
	function confirmReassign() {
		if (!reassignFrom || !reassignTo) return;
		setTransactions(reassignMember(transactions, reassignFrom.id, reassignTo));
		setMembers(members.filter((m) => m.id !== reassignFrom.id));
		// The member taking over the transactions also takes over as cash holder.
		if (reassignFrom.id === holderId) setHolderId(reassignTo);
		setReassignFrom(null);
	}
	function handleMemberName(member: Member, event: ChangeEvent<HTMLInputElement>) {
		const name = event.target.value;
		setMembers(members.map((m) => (m.id === member.id ? { ...m, name } : m)));
	}

	function handleFieldChange(event: ChangeEvent<HTMLInputElement>) {
		setFormFields({ ...formFields, [event.target.name]: event.target.value });
	}

	function handleGroupSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const validHolder = members.some((m) => m.id === holderId) ? holderId : members[0]?.id;
		const updatedGroup: Group = {
			...group,
			config: { ...group.config, name: formFields.name, holderId: validHolder, icon },
			members,
			transactions,
		};

		updateGroup(updatedGroup);
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	}

	return (
		<form onSubmit={handleGroupSubmit} className="space-y-6">
			<div className="grid gap-6 md:grid-cols-5">
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>{t('GroupInformation')}</CardTitle>
						<CardDescription>{t('GroupName')}</CardDescription>
					</CardHeader>
					<CardContent>
						<Label htmlFor="group-name" className="mb-2">
							{t('GroupName')}
						</Label>
						<Input
							id="group-name"
							type="text"
							placeholder={t('TypeHere')}
							value={formFields.name}
							name="name"
							onChange={handleFieldChange}
						/>

						<Label htmlFor="group-holder" className="mt-4 mb-2">
							{t('Top-holder')}
						</Label>
						<select
							id="group-holder"
							value={holderId}
							onChange={(e) => setHolderId(e.target.value)}
							className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px]"
						>
							{members.map((member) => (
								<option key={member.id} value={member.id}>
									{member.name || t('Name')}
								</option>
							))}
						</select>
						<p className="text-muted-foreground mt-1.5 text-xs">{t('HolderHint')}</p>

						<Label className="mt-4 mb-2">{t('Icon')}</Label>
						<div className="flex flex-wrap gap-1.5">
							{Object.entries(EVENT_ICONS).map(([name, Ico]) => (
								<button
									key={name}
									type="button"
									onClick={() => setIcon(icon === name ? '' : name)}
									aria-pressed={icon === name}
									className={`flex size-9 items-center justify-center rounded-lg border transition-colors ${
										icon === name
											? 'border-primary bg-primary/10 text-primary'
											: 'border-border text-muted-foreground hover:bg-accent'
									}`}
								>
									<Ico className="size-5" />
								</button>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="md:col-span-3">
					<CardHeader>
						<CardTitle>{t('Members')}</CardTitle>
						<CardDescription>{members.length}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{members.map((member) => (
							<div key={member.id} className="flex items-end gap-3">
								<Avatar name={member.name || '?'} className="mb-1.5" />
								<div className="flex-1">
									<Label className="text-muted-foreground mb-1.5 text-xs">{t('Name')}</Label>
									<Input
										type="text"
										placeholder={t('TypeHere')}
										value={member.name}
										onChange={(event) => handleMemberName(member, event)}
									/>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="text-muted-foreground hover:text-destructive mb-0.5"
									onClick={() => removeMember(member)}
									aria-label={`Remove ${member.name || 'member'}`}
								>
									<Trash2 />
								</Button>
							</div>
						))}
						<Button type="button" variant="outline" size="sm" onClick={addMember}>
							<UserPlus /> {t('addMember')}
						</Button>
					</CardContent>
				</Card>
			</div>

			<div className="flex items-center justify-end gap-3">
				{saved && (
					<span
						key={Date.now()}
						className="save-flash inline-flex items-center gap-1.5 text-sm font-medium text-green-600"
					>
						<Check className="size-4" /> {t('Saved')}
					</span>
				)}
				<Button type="submit" size="lg">
					<Save /> {t('Save')}
				</Button>
			</div>

			{reassignFrom && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
					role="dialog"
					aria-modal="true"
				>
					<Card className="w-full max-w-sm">
						<CardHeader>
							<CardTitle>{t('Move transactions')}</CardTitle>
							<CardDescription>{t('MoveTransactionsHint', { name: reassignFrom.name || t('Name') })}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<select
								value={reassignTo}
								onChange={(e) => setReassignTo(e.target.value)}
								className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px]"
							>
								{members
									.filter((m) => m.id !== reassignFrom.id)
									.map((m) => (
										<option key={m.id} value={m.id}>
											{m.name || t('Name')}
										</option>
									))}
							</select>
							<div className="flex justify-end gap-2">
								<Button type="button" variant="outline" onClick={() => setReassignFrom(null)}>
									{t('Cancel')}
								</Button>
								<Button type="button" onClick={confirmReassign} disabled={!reassignTo}>
									{t('Move and remove')}
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</form>
	);
}
