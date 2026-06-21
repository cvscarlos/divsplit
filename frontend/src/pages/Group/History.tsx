import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RotateCcw, GitCommitVertical } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { listVersions, buildRestore } from '../../utils/versioning';
import type { EventVersion } from '../../utils/versioning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function relativeTime(ts: string) {
	const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
	if (mins < 1) return 'Just now';
	if (mins < 60) return `${mins} min ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	return new Date(ts).toLocaleDateString();
}

export function GroupHistory() {
	const { t } = useTranslation();
	const { groupId } = useParams();
	const { data: group, updateGroup } = useGroupContext();
	const [versions, setVersions] = useState<EventVersion[]>([]);

	useEffect(() => {
		if (groupId) listVersions(groupId).then(setVersions);
	}, [groupId, group]);

	const head = versions[versions.length - 1]?.v ?? 0;

	async function restore(v: number) {
		if (!groupId) return;
		const restored = await buildRestore(groupId, group, v);
		updateGroup(restored, { message: `Restored to version ${v}` });
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
							const lines = version.changes?.length ? version.changes : [version.message];
							return (
								<li key={version.v} className="flex items-start gap-4 py-4">
									<span className="bg-primary/15 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full">
										<GitCommitVertical className="size-4" />
									</span>
									<div className="min-w-0 flex-1">
										<ul className="space-y-0.5 text-sm leading-snug">
											{lines.map((line, i) => (
												<li key={i}>{line}</li>
											))}
										</ul>
										<p className="text-muted-foreground mt-1 text-xs">
											v{version.v}
											{version.author ? ` · ${version.author}` : ''} · {relativeTime(version.ts)}
											{isHead ? ` · ${t('Current')}` : ''}
										</p>
										{!isHead && (
											<button
												type="button"
												className="text-primary mt-1.5 inline-flex items-center gap-1 text-xs hover:underline"
												onClick={() => restore(version.v)}
											>
												<RotateCcw className="size-3.5" /> {t('Restore')}
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
