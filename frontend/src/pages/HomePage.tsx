import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, Users, Infinity as InfinityIcon, ArrowUpRight, ShieldCheck, Gauge } from 'lucide-react';

import CardContainer from '../components/CardContainer';
import CardGroup from '../components/CardGroup';
import { useApiListGroups } from '../utils/use-api';
import { generateId } from '../utils/id';
import { Button } from '@/components/ui/button';

function HomePage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { groupList, loading } = useApiListGroups();

	const createGroup = () => navigate(`/group/${generateId()}/config`);

	return (
		<div>
			<section className="bg-background relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
				{/* static "liquid" gradient glows (theme-aware tints) */}
				<div
					aria-hidden
					className="pointer-events-none absolute -top-40 -left-32 size-[34rem] rounded-full blur-[110px]"
					style={{
						background:
							'linear-gradient(135deg, color-mix(in srgb, var(--secondary) 20%, transparent), color-mix(in srgb, var(--primary) 12%, transparent))',
					}}
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute -right-32 -bottom-40 size-[30rem] rounded-full blur-[110px]"
					style={{
						background:
							'linear-gradient(135deg, color-mix(in srgb, var(--primary) 16%, transparent), color-mix(in srgb, var(--secondary) 12%, transparent))',
					}}
				/>

				<div className="relative z-10 flex max-w-3xl flex-col items-center gap-14">
					<InfinityIcon
						className="text-primary size-24 md:size-32"
						strokeWidth={1.25}
						style={{ filter: 'drop-shadow(0 0 18px color-mix(in srgb, var(--primary) 45%, transparent))' }}
					/>

					<div className="space-y-6">
						<h1 className="text-foreground text-5xl font-extralight tracking-tight md:text-7xl">
							{t('HeroLine1')}
							<br />
							<span className="from-primary to-secondary bg-gradient-to-r bg-clip-text font-bold text-transparent">
								{t('HeroAccent')}
							</span>
						</h1>
						<p className="text-muted-foreground mx-auto max-w-xl text-lg font-light text-pretty md:text-xl">
							{t('HeroSubtitle')}
						</p>
					</div>

					<div className="flex flex-col items-center gap-10">
						<Button
							size="lg"
							onClick={createGroup}
							className="group rounded-full px-12 py-7 text-base font-semibold tracking-wider uppercase shadow-[0_18px_50px_-12px_color-mix(in_srgb,var(--primary)_55%,transparent)] transition-transform hover:-translate-y-1"
						>
							{t('Create an event')}
							<ArrowUpRight className="transition-transform group-hover:rotate-45" />
						</Button>
						<div className="text-muted-foreground/50 flex items-center gap-8 text-[10px] tracking-[0.3em] uppercase">
							<span className="flex items-center gap-2">
								<ShieldCheck className="size-4" /> {t('Encrypted')}
							</span>
							<span className="flex items-center gap-2">
								<Gauge className="size-4" /> {t('Real-time')}
							</span>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
				{loading ? (
					<div className="text-muted-foreground flex items-center justify-center gap-2 py-16">
						<Loader2 className="size-5 animate-spin" /> {t('Loading')}
					</div>
				) : groupList.length === 0 ? (
					<div className="border-border bg-card/50 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
						<span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
							<Users className="size-7" />
						</span>
						<p className="text-muted-foreground">{t('No events yet')}</p>
						<Button onClick={createGroup}>
							<Plus /> {t('createGroup')}
						</Button>
					</div>
				) : (
					<>
						<div className="mb-6 flex flex-col gap-1">
							<h2 className="font-sans text-2xl font-semibold tracking-tight">{t('GenGroupTitle')}</h2>
							<p className="text-muted-foreground text-sm">{t('GenGroupSubTitle')}</p>
						</div>
						<CardContainer>
							{groupList.map((groupItem) => (
								<CardGroup key={groupItem.id} group={groupItem} />
							))}
							<button
								type="button"
								onClick={createGroup}
								className="group border-border text-muted-foreground hover:border-primary hover:text-primary flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors"
							>
								<span className="bg-muted group-hover:bg-primary/10 flex size-12 items-center justify-center rounded-full transition-colors">
									<Plus className="size-6" />
								</span>
								<span className="text-sm font-medium">{t('createGroup')}</span>
							</button>
						</CardContainer>
					</>
				)}
			</section>

			<footer className="border-border border-t border-dashed">
				<div className="text-muted-foreground mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs sm:flex-row sm:px-6">
					<span>
						© {new Date().getFullYear()} DivSplit — {t('All rights reserved')}.
					</span>
					<div className="flex gap-4">
						<button type="button" className="hover:text-primary transition-colors hover:underline">
							{t('Privacy Policy')}
						</button>
						<button type="button" className="hover:text-primary transition-colors hover:underline">
							{t('Terms of Service')}
						</button>
					</div>
				</div>
			</footer>
		</div>
	);
}

export default HomePage;
