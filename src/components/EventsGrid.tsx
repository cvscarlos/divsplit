import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, Users } from 'lucide-react';

import CardContainer from './CardContainer';
import CardGroup from './CardGroup';
import { useApiListGroups } from '../utils/use-api';
import { generateId } from '../utils/id';
import { Button } from '@/components/ui/button';

/** The events listing (loading / empty / grid). Shared by the Home page and /events. */
export function EventsGrid() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { groupList, loading } = useApiListGroups();
	const createGroup = () => navigate(`/group/${generateId()}/config`);

	return (
		<section id="events-grid" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
			{loading ? (
				<div className="text-muted-foreground flex items-center justify-center gap-2 py-16">
					<Loader2 className="size-5 animate-spin" /> {t('LOADING')}
				</div>
			) : groupList.length === 0 ? (
				<div className="border-border bg-card/50 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
					<span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
						<Users className="size-7" />
					</span>
					<p className="text-muted-foreground">{t('NO_EVENTS_YET')}</p>
					<Button onClick={createGroup}>
						<Plus /> {t('CREATE_GROUP')}
					</Button>
				</div>
			) : (
				<>
					<div className="mb-6 flex flex-col gap-1">
						<h2 className="font-sans text-2xl font-semibold tracking-tight">{t('GEN_GROUP_TITLE')}</h2>
						<p className="text-muted-foreground text-sm">{t('GEN_GROUP_SUB_TITLE')}</p>
					</div>
					<CardContainer>
						{groupList.map((groupItem, index) => (
							<CardGroup key={groupItem.id} group={groupItem} index={index} />
						))}
						<button
							type="button"
							onClick={createGroup}
							className="group border-border text-muted-foreground hover:border-primary hover:text-primary flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors"
						>
							<span className="bg-muted group-hover:bg-primary/10 flex size-12 items-center justify-center rounded-full transition-colors">
								<Plus className="size-6" />
							</span>
							<span className="text-sm font-medium">{t('CREATE_GROUP')}</span>
						</button>
					</CardContainer>
				</>
			)}
		</section>
	);
}
