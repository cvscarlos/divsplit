import { useTranslation } from 'react-i18next';

import './HomePage.css';
import CardContainer from '../components/CardContainer';
import Header from '../components/Header';
import CardGroup from '../components/CardGroup';
import { useApiListGroups } from '../utils/use-api';

function HomePage() {
	const { t } = useTranslation();
	const { groupList, isLoading } = useApiListGroups();

	return (
		<div className="divsplit-container">
			<Header />
			<div className="flex justify-center items-center flex-col h-4/5">
				<h1 className="main-title">{t('MainTitle')}</h1>
				<p className="text-secondary text-lg text-center font-bold w-80 md:w-auto md:text-2xl">
					{t('MainSubTitle')}
				</p>
			</div>

			<div className="manage-groups">
				<p className="text-xl text-base-content md:text-2xl">{t('GenGroupTitle')}</p>
				<p>{t('GenGroupSubTitle')}</p>

				{isLoading ? (
					<p>{t('loading')}</p>
				) : (
					<CardContainer>
						{groupList.map((groupItem) => (
							<CardGroup key={groupItem.id} group={groupItem} />
						))}
					</CardContainer>
				)}
			</div>
		</div>
	);
}

export default HomePage;
