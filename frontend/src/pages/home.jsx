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
	const { groups, isLoading } = useApiListGroups();

	return (
		<div data-theme={theme} className="my-custom-container">
			<Header />
			<div className="flex justify-center items-center flex-col h-4/5">
				<h1 className="my-custom-mainTitle">Divida Suas Despesas em Grupo com Facilidade</h1>
				<p className="text-secondary text-2xl sm:text-center">
					Evite preocupações na hora de dividir as despesas entre amigos
				</p>
			</div>

			<div className="custom-manage-groups">
				<p className="text-3xl text-black">Seus Grupos de Gerenciamento de Despesas</p>
				<p>Visualize e Gerencie os Seus Grupos Ativos</p>

				{isLoading ? (
					<p>{t('loading')}</p>
				) : (
					<CardContainer>
						{groups.map(({ id }) => (
							<CardGroup key={id} id={id} />
						))}
					</CardContainer>
				)}
			</div>
		</div>
	);
}

export default HomePage;