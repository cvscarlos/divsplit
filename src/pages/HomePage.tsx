import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck, Gauge, Sparkles, FileSpreadsheet, History } from 'lucide-react';

import { EventsGrid } from '../components/EventsGrid';
import { generateId } from '../utils/id';
import { Button } from '@/components/ui/button';

function HomePage() {
	const { t } = useTranslation();
	const navigate = useNavigate();

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
					<img
						src="/logo.png"
						alt=""
						aria-hidden
						className="h-24 w-auto md:h-32"
						style={{ filter: 'drop-shadow(0 0 18px color-mix(in srgb, var(--primary) 45%, transparent))' }}
					/>

					<div className="space-y-6">
						<h1 className="text-foreground text-5xl font-extralight tracking-tight md:text-7xl">
							{t('HERO_LINE1')}
							<br />
							<span className="from-primary to-secondary bg-gradient-to-r bg-clip-text font-bold text-transparent">
								{t('HERO_ACCENT')}
							</span>
						</h1>
						<p className="text-muted-foreground mx-auto max-w-xl text-lg font-light text-pretty md:text-xl">
							{t('HERO_SUBTITLE')}
						</p>
					</div>

					<div className="flex flex-col items-center gap-10">
						<Button
							size="lg"
							onClick={createGroup}
							className="group rounded-full px-12 py-7 text-base font-semibold tracking-wider uppercase shadow-[0_18px_50px_-12px_color-mix(in_srgb,var(--primary)_55%,transparent)] transition-transform hover:-translate-y-1"
						>
							{t('CREATE_AN_EVENT')}
							<ArrowUpRight className="transition-transform group-hover:rotate-45" />
						</Button>
						<div className="text-muted-foreground/50 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] tracking-[0.3em] uppercase">
							<span className="flex items-center gap-2">
								<ShieldCheck className="size-4" /> {t('SECURE')}
							</span>
							<span className="flex items-center gap-2">
								<Gauge className="size-4" /> {t('REAL_TIME')}
							</span>
							<span className="flex items-center gap-2">
								<FileSpreadsheet className="size-4" /> {t('NO_SPREADSHEETS')}
							</span>
						</div>
					</div>
				</div>
			</section>

			{/* messaging: privacy + enjoy-the-moment + trust/reversible-history (no feature cards) */}
			<section className="mx-auto max-w-3xl space-y-20 px-6 py-24 text-center">
				<div>
					<ShieldCheck className="text-secondary mx-auto size-8" />
					<h2 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{t('PRIVACY_HEADLINE')}</h2>
					<p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg text-pretty">{t('PRIVACY_BODY')}</p>
				</div>
				<div>
					<Sparkles className="text-primary mx-auto size-8" />
					<h2 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{t('MOMENT_HEADLINE')}</h2>
					<p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg text-pretty">{t('MOMENT_BODY')}</p>
				</div>
				<div>
					<History className="text-secondary mx-auto size-8" />
					<h2 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{t('TRUST_HEADLINE')}</h2>
					<p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg text-pretty">{t('TRUST_BODY')}</p>
				</div>
			</section>

			<EventsGrid />

			<footer className="border-border border-t border-dashed">
				<div className="text-muted-foreground mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs sm:flex-row sm:px-6">
					<span>
						© {new Date().getFullYear()} DivSplit — {t('ALL_RIGHTS_RESERVED')}.
					</span>
					<div className="flex gap-4">
						<button type="button" className="hover:text-primary transition-colors hover:underline">
							{t('PRIVACY_POLICY')}
						</button>
						<button type="button" className="hover:text-primary transition-colors hover:underline">
							{t('TERMS_OF_SERVICE')}
						</button>
					</div>
				</div>
			</footer>
		</div>
	);
}

export default HomePage;
