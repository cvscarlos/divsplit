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
			<section
				className="relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:py-20"
				style={{
					backgroundColor: '#0A0A12',
					backgroundImage:
						'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 40px)',
				}}
			>
				{/* top neon scanline + ambient glows */}
				<div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff2d78] to-transparent" />
				<div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-[#ff2d78]/20 blur-3xl" />
				<div aria-hidden className="pointer-events-none absolute -bottom-24 right-0 size-72 rounded-full bg-[#00ffcc]/15 blur-3xl" />

				{/* glowing emblem inside rotated diamond frames */}
				<div className="relative mx-auto flex size-48 items-center justify-center">
					<div aria-hidden className="absolute inset-0 rotate-45 rounded-[28%] border border-[#00ffcc]/25" />
					<div aria-hidden className="absolute inset-3 rotate-[38deg] rounded-[28%] border border-[#ffe04a]/20" />
					<div aria-hidden className="absolute inset-8 rounded-full bg-[#ff2d78]/25 blur-2xl" />
					<img src="/logo.png" alt="" aria-hidden className="relative size-24 drop-shadow-[0_0_24px_rgba(255,45,120,0.5)]" />
					<span aria-hidden className="absolute top-1/2 left-1 size-3 rounded-full bg-[#00ffcc] shadow-[0_0_12px_#00ffcc]" />
					<span aria-hidden className="absolute right-3 bottom-9 size-3 rounded-full bg-[#ffe04a] shadow-[0_0_12px_#ffe04a]" />
				</div>

				<h1 className="relative mt-10 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
					{t('HeroLine1')}{' '}
					<span className="block text-[#5BFFC7] [text-shadow:0_0_28px_rgba(91,255,199,0.7)]">{t('HeroAccent')}</span>
				</h1>
				<p className="relative mx-auto mt-6 max-w-md text-lg text-pretty text-white/55">{t('HeroSubtitle')}</p>
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
