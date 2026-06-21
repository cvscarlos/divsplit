import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';

import { useGroupContext } from '../context/GroupContext';
import { getPreferredName } from '../utils/identity';
import { generateId } from '../utils/id';
import { Avatar } from './Avatar';
import type { Group, Member } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Trust-based "who are you?" step shown on first open of an event link.
 * Pick an existing member, or add yourself. The creator of a brand-new event
 * just types their name (becomes the first member).
 */
export function IdentityGate() {
	const { t } = useTranslation();
	const { data: group, updateGroup, identify } = useGroupContext();
	const [name, setName] = useState(getPreferredName());

	const members = (group.members || []).filter((m) => m.name.trim());
	const isNewEvent = members.length === 0;

	function pick(member: Member) {
		identify(member);
	}

	function join(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;

		const member: Member = { id: generateId(), name: trimmed };
		identify(member); // sets the acting identity so the save is attributed to them

		const updated: Group = {
			...group,
			members: [...(group.members || []), member],
			// The creator of a brand-new event also becomes the default cash holder.
			...(isNewEvent ? { config: { ...group.config, holderId: group.config?.holderId || member.id } } : {}),
		};
		updateGroup(updated);
	}

	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-center text-2xl">
						{isNewEvent ? t('Welcome to DivSplit') : t('Who are you?')}
					</CardTitle>
					<p className="text-muted-foreground text-center text-sm">
						{isNewEvent ? t("What's your name?") : t('Pick your name to continue')}
					</p>
				</CardHeader>
				<CardContent className="space-y-5">
					{!isNewEvent && (
						<div className="flex flex-wrap justify-center gap-2">
							{members.map((member) => (
								<button
									key={member.id}
									type="button"
									onClick={() => pick(member)}
									className="border-border hover:border-primary hover:bg-accent flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-1.5 text-sm font-medium transition-colors"
								>
									<Avatar name={member.name} className="size-7 ring-0" />
									{member.name}
								</button>
							))}
						</div>
					)}

					<form onSubmit={join} className="space-y-2">
						{!isNewEvent && <p className="text-muted-foreground text-center text-xs">{t("I'm not listed")}</p>}
						<div className="flex gap-2">
							<Input type="text" placeholder={t('Your name')} value={name} onChange={(e) => setName(e.target.value)} />
							<Button type="submit" disabled={!name.trim()}>
								<UserPlus /> {isNewEvent ? t('Continue') : t('Join')}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
