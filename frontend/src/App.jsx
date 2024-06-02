import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import './App.css';
import { ThemeContext } from './context/ThemeContext';

function App() {
	const { theme, toggleTheme } = useContext(ThemeContext);
	const { t } = useTranslation();

	return (
		<div className={`background ${theme}`}>
			<h1 className={theme}>{t('helloWorld')}</h1>
			<button onClick={toggleTheme} className={theme}>
				{t('toggleTheme')}
			</button>
		</div>
	);
}

export default App;
