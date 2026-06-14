import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ObjectId from 'bson-objectid';
import { Plus, Loader2 } from 'lucide-react';

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
				<div
					aria-hidden
					className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
				/>
				<div
					aria-hidden
					className="bg-accent/40 pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full blur-3xl"
				/>
				<p className="text-primary relative text-sm font-semibold tracking-[0.22em] uppercase">DivSplit</p>
				<h1 className="relative mx-auto mt-4 max-w-2xl font-serif text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
					{t('MainTitle')}
				</h1>
				<p className="text-muted-foreground relative mx-auto mt-5 max-w-md text-lg text-pretty">{t('MainSubTitle')}</p>
				<div className="relative mt-8">
					<Button size="lg" onClick={createGroup}>
						<Plus /> {t('createGroup')}
					</Button>
				</div>
			</section>

			<section>
				<div className="mb-6 flex flex-col gap-1">
					<h2 className="font-serif text-2xl font-semibold tracking-tight">{t('GenGroupTitle')}</h2>
					<p className="text-muted-foreground text-sm">{t('GenGroupSubTitle')}</p>
				</div>

				{loading ? (
					<div className="text-muted-foreground flex items-center justify-center gap-2 py-16">
						<Loader2 className="size-5 animate-spin" /> {t('Loading')}
					</div>
				) : (
					<CardContainer>
						{groupList.map((groupItem) => (
							<CardGroup key={groupItem.id} group={groupItem} />
						))}
					</CardContainer>
				)}
			</section>
		</div>
	);
}

export default HomePage;
