import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import './home.css';
import CardContainer from '../components/CardContainer';
import Header from '../components/Header';
import { ThemeContext } from '../context/ThemeContext';
import CardGroup from '../components/CardGroup';
import { useApiListGroups } from '../utils/use-api';

function HomePage() {
	const { t } = useTranslation();
	const { theme } = useContext(ThemeContext);
	const { groupList, isLoading } = useApiListGroups();

	return (
		<div data-theme={theme} className="my-custom-container">
			<Header />
			<div className="flex justify-center items-center flex-col h-4/5">
				<h1 className="my-custom-mainTitle">{t('MainTitle')}</h1>
				<p className="text-secondary text-lg text-center font-bold w-80 md:w-auto md:text-2xl">
					{t('MainSubTitle')}
				</p>
			</div>

			<div className="custom-manage-groups">
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
