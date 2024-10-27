import { useTranslation } from 'react-i18next';

import './HomePage.css';
import CardContainer from '../components/CardContainer';
import CardGroup from '../components/CardGroup';
import { useApiListGroups } from '../utils/use-api';

function HomePage() {
	const { t } = useTranslation();
	const { groupList, isLoading } = useApiListGroups();

	return (
		<>
			<div className="main-title-div">
				<div className="flex justify-center items-center flex-col h-1/2 ">
					<h1 className="main-title">{t('MainTitle')}</h1>
					<p className="text-secondary text-lg text-center font-bold w-80 md:w-auto md:text-2xl">{t('MainSubTitle')}</p>
				</div>
			</div>

			<div className="manage-groups">
				<p className="text-xl text-base-content md:text-2xl">{t('GenGroupTitle')}</p>
				<p>{t('GenGroupSubTitle')}</p>
				<div className="flex justify-center items-center m-5">
					<button className="btn btn-primary w-64">{`+ ${t('createGroup')}`}</button>
				</div>

				{isLoading ? (
					<p>{t('Loading')}</p>
				) : (
					<CardContainer>
						{groupList.map((groupItem) => (
							<CardGroup key={groupItem.id} group={groupItem} />
						))}
					</CardContainer>
				)}
			</div>
		</>
	);
}

export default HomePage;
