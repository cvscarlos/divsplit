import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RotateCcw, GitCommitVertical, ChevronDown } from 'lucide-react';

import { useGroupContext } from '../../context/GroupContext';
import { listVersions, reconstructCore, describeChange, buildRestore, coreOf } from '../../utils/versioning';
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
	const [open, setOpen] = useState<number | null>(null);

	useEffect(() => {
		if (groupId) listVersions(groupId).then(setVersions);
	}, [groupId, group]);

	const head = versions[versions.length - 1]?.v ?? 0;

	function diffLines(v: number): string[] {
		const before = reconstructCore(coreOf(group), versions, v - 1);
		const after = reconstructCore(coreOf(group), versions, v);
		return describeChange(before, after);
	}

	async function restore(v: number) {
		if (!groupId) return;
		const restored = await buildRestore(groupId, group, v);
		updateGroup(restored, { message: `Restored to version ${v}` });
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('Version history')}</CardTitle>
			</CardHeader>
			<CardContent>
				{versions.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-12 text-center">
						<span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
							<GitCommitVertical className="size-7" />
						</span>
						<p className="text-muted-foreground">{t('No versions yet')}</p>
						<p className="text-muted-foreground/70 max-w-xs text-sm">{t('VersionsHint')}</p>
					</div>
				) : (
					<ul className="divide-border divide-y">
						{[...versions].reverse().map((version) => {
							const isHead = version.v === head;
							const isOpen = open === version.v;
							return (
								<li key={version.v} className="py-4">
									<div className="flex items-start gap-4">
										<span className="bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
											<GitCommitVertical className="size-4" />
										</span>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-sm leading-snug font-medium">{version.message}</p>
												{isHead && (
													<span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
														{t('Current')}
													</span>
												)}
											</div>
											<p className="text-muted-foreground mt-0.5 text-xs">
												v{version.v}
												{version.author ? ` · ${version.author}` : ''} · {relativeTime(version.ts)}
											</p>

											<div className="mt-2 flex items-center gap-4">
												<button
													type="button"
													className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
													onClick={() => setOpen(isOpen ? null : version.v)}
												>
													<ChevronDown className={`size-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
													{t('Changes')}
												</button>
												{!isHead && (
													<button
														type="button"
														className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
														onClick={() => restore(version.v)}
													>
														<RotateCcw className="size-3.5" /> {t('Restore')}
													</button>
												)}
											</div>

											{isOpen && (
												<ul className="text-muted-foreground border-border mt-2 space-y-1 border-l pl-3 text-xs">
													{diffLines(version.v).map((line, i) => (
														<li key={i} className="tnum">
															{line}
														</li>
													))}
												</ul>
											)}
										</div>
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
