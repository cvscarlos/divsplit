import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ObjectId from 'bson-objectid';
import { Plus, Loader2, Users } from 'lucide-react';

import CardContainer from '../components/CardContainer';
import CardGroup from '../components/CardGroup';
import { useApiListGroups } from '../utils/use-api';
import { Button } from '@/components/ui/button';

function HomePage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { groupList, loading } = useApiListGroups();

	const createGroup = () => navigate(`/group/${new ObjectId().toHexString()}/config`);

	return (
		<div className="space-y-14">
			<section className="border-border bg-card relative overflow-hidden rounded-3xl border px-6 py-16 text-center shadow-sm sm:py-20">
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
				<div aria-hidden className="bg-primary/10 pointer-events-none absolute top-0 left-1/4 size-80 -translate-y-1/3 rounded-full blur-3xl" />
				<div aria-hidden className="pointer-events-none absolute right-1/4 bottom-0 size-72 translate-y-1/3 rounded-full blur-3xl" style={{ backgroundColor: 'color-mix(in srgb, var(--chart-4) 14%, transparent)' }} />
				<div aria-hidden className="hero-scan" />

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
			</section>

			<section>
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
		</div>
	);
}

export default HomePage;
