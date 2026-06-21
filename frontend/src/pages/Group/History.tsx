import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RotateCcw, GitCommitVertical } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { listVersions, buildRestore } from '../../utils/versioning';
import type { EventVersion } from '../../utils/versioning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function relativeTime(ts: string, lng: string) {
	const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
	const rtf = new Intl.RelativeTimeFormat(lng, { numeric: 'auto' });
	if (mins < 1) return rtf.format(0, 'minute');
	if (mins < 60) return rtf.format(-mins, 'minute');
	const hours = Math.floor(mins / 60);
	if (hours < 24) return rtf.format(-hours, 'hour');
	return new Date(ts).toLocaleDateString(lng);
}

export function GroupHistory() {
	const { t, i18n } = useTranslation();
	const { groupId } = useParams();
	const { data: group, updateGroup } = useGroupContext();
	const [versions, setVersions] = useState<EventVersion[]>([]);

	useEffect(() => {
		if (groupId) listVersions(groupId).then(setVersions);
	}, [groupId, group]);

	const head = versions[versions.length - 1]?.v ?? 0;
	const genesis = versions[0]?.v ?? 0; // the "Event created" version — nothing precedes it

	// Revert an action: roll the event back to the snapshot taken right BEFORE that
	// version's change (v-1), saved as a new forward version. Works on any action,
	// including the latest one, so a just-made delete can be undone directly.
	async function revert(v: number) {
		if (!groupId) return;
		const restored = await buildRestore(groupId, group, v - 1);
		updateGroup(restored, { change: { key: 'REVERTED', params: { v } } });
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('History')}</CardTitle>
			</CardHeader>
			<CardContent>
				{versions.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-12 text-center">
						<span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
							<GitCommitVertical className="size-7" />
						</span>
						<p className="text-muted-foreground">{t('No history yet')}</p>
						<p className="text-muted-foreground/70 max-w-xs text-sm">{t('VersionsHint')}</p>
					</div>
				) : (
					<ul className="divide-border divide-y">
						{[...versions].reverse().map((version) => {
							const isHead = version.v === head;
							return (
								<li key={version.v} className="flex items-start gap-4 py-4">
									<span className="bg-primary/15 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full">
										<GitCommitVertical className="size-4" />
									</span>
									<div className="min-w-0 flex-1">
										<ul className="space-y-0.5 text-sm leading-snug">
											{(version.changes ?? []).map((change, i) => (
												<li key={i}>{t(change.key, change.params)}</li>
											))}
										</ul>
										<p className="text-muted-foreground mt-1 text-xs">
											v{version.v}
											{version.author ? ` · ${version.author}` : ''} · {relativeTime(version.ts, i18n.language)}
											{isHead ? ` · ${t('Current')}` : ''}
										</p>
										{version.v !== genesis && (
											<button
												type="button"
												className="text-primary mt-1.5 inline-flex items-center gap-1 text-xs hover:underline"
												onClick={() => revert(version.v)}
												aria-label={t('Revert this change')}
											>
												<RotateCcw className="size-3.5" /> {t('Revert')}
											</button>
										)}
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
