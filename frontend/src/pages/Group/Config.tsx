import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, UserPlus, Save } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { Avatar } from '../../components/Avatar';
import { trackGroupNameChange, trackMemberChanges } from '../../utils/activity-tracker';
import type { Member } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function GroupConfig() {
	const memberBase: Member = { id: `0_${Date.now()}`, name: '', prepaid: 0 };

	const { data: group, updateGroup } = useGroupContext();
	const [formFields, setFormFields] = useState<{ name: string }>({ name: '' });
	const [members, setMembers] = useState<Member[]>([{ ...memberBase }]);
	const [bankerId, setBankerId] = useState<string>('');
	const { t } = useTranslation();

	useEffect(() => {
		setFormFields({ name: group.config?.name || '---' });
		if (group.members) setMembers(group.members);
		setBankerId(group.config?.bankerId || group.members?.[0]?.id || '');
	}, [group]);

	const memberName = 'memberName';
	const memberPrepaid = 'memberPrepaid';
	function addMember() {
		setMembers([...members, { ...memberBase, id: `${members.length}_${Date.now()}` }]);
	}
	function removeMember(member: Member) {
		setMembers(members.filter((m) => m.id !== member.id));
	}
	function handleMemberFields(member: Member, event: ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.target;
		if (name == memberName) member.name = value;
		else if (name == memberPrepaid) member.prepaid = Number(value);
		setMembers([...members]);
	}

	function handleFieldChange(event: ChangeEvent<HTMLInputElement>) {
		setFormFields({ ...formFields, [event.target.name]: event.target.value });
	}

	function handleGroupSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		let updatedGroup = { ...group };

		// Track group name change
		const oldGroupName = group.config?.name || '';
		const newGroupName = formFields.name;
		updatedGroup = trackGroupNameChange(updatedGroup, oldGroupName, newGroupName);

		// Track member changes
		const oldMembers = group.members || [];
		updatedGroup = trackMemberChanges(updatedGroup, oldMembers, members);

		// Apply the changes
		const validBanker = members.some((m) => m.id === bankerId) ? bankerId : members[0]?.id;
		updatedGroup.config = { ...updatedGroup.config, name: formFields.name, bankerId: validBanker };
		updatedGroup.members = members;

		updateGroup(updatedGroup);
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

						<Label htmlFor="group-banker" className="mt-4 mb-2">
							{t('Banker')}
						</Label>
						<select
							id="group-banker"
							value={bankerId}
							onChange={(e) => setBankerId(e.target.value)}
							className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px]"
						>
							{members.map((member) => (
								<option key={member.id} value={member.id}>
									{member.name || t('Name')}
								</option>
							))}
						</select>
						<p className="text-muted-foreground mt-1.5 text-xs">{t('BankerHint')}</p>
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
										name={memberName}
										onChange={(event) => handleMemberFields(member, event)}
									/>
								</div>
								<div className="w-28">
									<Label className="text-muted-foreground mb-1.5 text-xs">{t('PrepaidAmount')}</Label>
									<div className="relative">
										<span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
											$
										</span>
										<Input
											type="number"
											className="tnum pl-7"
											placeholder="0"
											value={member.prepaid}
											name={memberPrepaid}
											onChange={(event) => handleMemberFields(member, event)}
										/>
									</div>
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

			<div className="flex justify-end">
				<Button type="submit" size="lg">
					<Save /> {t('Save')}
				</Button>
			</div>
		</form>
	);
}
