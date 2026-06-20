import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ObjectId from 'bson-objectid';
import { Plus, Loader2, Users, Plane, UtensilsCrossed, Flame } from 'lucide-react';

import CardContainer from '../components/CardContainer';
import CardGroup from '../components/CardGroup';
import { useApiListGroups } from '../utils/use-api';
import { Button } from '@/components/ui/button';

function HomePage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { groupList, loading } = useApiListGroups();

	const glowPink = useRef<HTMLDivElement>(null);
	const glowGreen = useRef<HTMLDivElement>(null);

	// Parallax: the ambient glows drift with the cursor (disabled if reduced-motion).
	useEffect(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const onMove = (e: MouseEvent) => {
			const x = e.clientX - window.innerWidth / 2;
			const y = e.clientY - window.innerHeight / 2;
			if (glowPink.current) glowPink.current.style.transform = `translate(${x / 20}px, ${y / 20}px)`;
			if (glowGreen.current) glowGreen.current.style.transform = `translate(${-x / 25}px, ${-y / 25}px)`;
		};
		window.addEventListener('mousemove', onMove);
		return () => window.removeEventListener('mousemove', onMove);
	}, []);

	const createGroup = () => navigate(`/group/${new ObjectId().toHexString()}/config`);

	return (
		<div>
			<section className="bg-background relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
				{/* neon grid + ambient glows + scan-line (theme-aware via tokens) */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0"
					style={{
						backgroundImage:
							'linear-gradient(color-mix(in srgb, var(--primary) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--primary) 7%, transparent) 1px, transparent 1px)',
						backgroundSize: '40px 40px',
					}}
				/>
				<div ref={glowPink} aria-hidden className="bg-primary/15 pointer-events-none absolute top-4 left-1/4 size-80 rounded-full blur-3xl" />
				<div ref={glowGreen} aria-hidden className="pointer-events-none absolute right-1/4 bottom-4 size-72 rounded-full blur-3xl" style={{ backgroundColor: 'color-mix(in srgb, var(--chart-4) 16%, transparent)' }} />
				<div aria-hidden className="hero-scan" />

				<div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
				{/* floating emblem with two counter-spinning orbital rings */}
				<div className="relative mx-auto flex size-48 items-center justify-center md:size-56">
					<div className="hero-float relative flex size-full items-center justify-center">
						<div aria-hidden className="bg-primary/20 absolute inset-8 rounded-full blur-2xl" />
						<img
							src="/logo.png"
							alt=""
							aria-hidden
							className="relative size-24"
							style={{ filter: 'drop-shadow(0 0 18px color-mix(in srgb, var(--primary) 55%, transparent))' }}
						/>
						<div aria-hidden className="hero-orbit border-primary/30 absolute inset-0 rounded-full border">
							<span
								className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full"
								style={{ backgroundColor: 'var(--chart-4)', boxShadow: '0 0 12px var(--chart-4)' }}
							/>
						</div>
						<div aria-hidden className="hero-orbit-reverse border-primary/20 absolute inset-5 rounded-full border">
							<span
								className="absolute -bottom-1.5 left-1/2 size-2.5 -translate-x-1/2 rounded-full"
								style={{ backgroundColor: 'var(--chart-3)', boxShadow: '0 0 12px var(--chart-3)' }}
							/>
						</div>
					</div>
				</div>

				<h1 className="text-foreground relative mt-10 text-4xl font-extrabold tracking-tight sm:text-6xl">
					{t('HeroLine1')}{' '}
					<span className="text-primary block [text-shadow:0_0_28px_color-mix(in_srgb,var(--primary)_60%,transparent)]">
						{t('HeroAccent')}
					</span>
				</h1>
				<p className="text-muted-foreground relative mx-auto mt-6 max-w-md text-lg text-pretty">{t('HeroSubtitle')}</p>
				<div className="relative mt-8">
					<Button size="lg" onClick={createGroup}>
						<Plus /> {t('createGroup')}
					</Button>
				</div>
				<div className="text-muted-foreground/60 mt-10 flex items-center gap-3 text-xs tracking-widest uppercase">
					<span className="bg-border h-px w-8" />
					{t('Ready to split the future')}
					<span className="bg-border h-px w-8" />
				</div>
				</div>

				{/* decorative category pills */}
				<div className="absolute right-6 bottom-10 left-6 z-10 flex flex-wrap justify-center gap-3 opacity-70 md:gap-6">
					<span className="border-border bg-card/60 flex items-center gap-2 rounded-full border px-4 py-2 text-xs backdrop-blur-sm">
						<Plane className="size-4" style={{ color: 'var(--chart-4)' }} /> {t('Group Trips')}
					</span>
					<span className="border-border bg-card/60 flex items-center gap-2 rounded-full border px-4 py-2 text-xs backdrop-blur-sm">
						<UtensilsCrossed className="size-4" style={{ color: 'var(--chart-3)' }} /> {t('Restaurant Bills')}
					</span>
					<span className="border-border bg-card/60 flex items-center gap-2 rounded-full border px-4 py-2 text-xs backdrop-blur-sm">
						<Flame className="text-primary size-4" /> {t('BBQ Parties')}
					</span>
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
						<p className="text-muted-foreground">{t('No groups yet')}</p>
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
						</CardContainer>
					</>
				)}
			</section>

			<footer className="border-border border-t border-dashed">
				<div className="text-muted-foreground mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs sm:flex-row sm:px-6">
					<span>© {new Date().getFullYear()} DivSplit — {t('All rights reserved')}.</span>
					<div className="flex gap-4">
						<a href="#" className="hover:text-primary transition-colors hover:underline">
							{t('Privacy Policy')}
						</a>
						<a href="#" className="hover:text-primary transition-colors hover:underline">
							{t('Terms of Service')}
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}

export default HomePage;
