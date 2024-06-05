import CardContainer from '../../components/CardContainer';
import Header from '../../components/Header';

import './home.css';
import { ThemeContext } from '../../context/ThemeContext';
import { useContext } from 'react';
import CardGroup from '../../components/CardGroup';

function HomePage() {
    const { theme } = useContext(ThemeContext);
    return (
        <>
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

                    <CardContainer>
                        <CardGroup />
                        <CardGroup />
                        <CardGroup />
                    </CardContainer>
                </div>
            </div>
        </>
    );
}

export default HomePage;
