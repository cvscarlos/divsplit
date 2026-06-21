import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, UserPlus, Save } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { Avatar } from '../../components/Avatar';
import { trackGroupNameChange, trackMemberChanges } from '../../utils/activity-tracker';
import { generateId } from '../../utils/id';
import { EVENT_ICONS } from '../../utils/event-icons';
import type { Member } from '../../types';
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
	const { t } = useTranslation();

	useEffect(() => {
		setFormFields({ name: group.config?.name || '---' });
		// Clone so edits don't mutate the context's member objects (which would make
		// trackMemberChanges see "no change" when comparing old vs new).
		if (group.members) setMembers(group.members.map((m) => ({ ...m })));
		setHolderId(group.config?.holderId || group.members?.[0]?.id || '');
		setIcon(group.config?.icon || '');
	}, [group]);

	function addMember() {
		setMembers([...members, { ...memberBase, id: generateId() }]);
	}
	function removeMember(member: Member) {
		setMembers(members.filter((m) => m.id !== member.id));
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

		let updatedGroup = { ...group };

		const oldGroupName = group.config?.name || '';
		updatedGroup = trackGroupNameChange(updatedGroup, oldGroupName, formFields.name);
		updatedGroup = trackMemberChanges(updatedGroup, group.members || [], members);

		const validHolder = members.some((m) => m.id === holderId) ? holderId : members[0]?.id;
		updatedGroup.config = { ...updatedGroup.config, name: formFields.name, holderId: validHolder, icon };
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

			<div className="flex justify-end">
				<Button type="submit" size="lg">
					<Save /> {t('Save')}
				</Button>
			</div>
		</form>
	);
}
