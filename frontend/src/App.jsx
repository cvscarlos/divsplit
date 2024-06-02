import { useContext } from 'react';
import './App.css';
import { ThemeContext } from './context/ThemeContext';

function App() {
	const { theme, toggleTheme } = useContext(ThemeContext);

	return (
		<div className={`background ${theme}`}>
			<h1 className={theme}>olá mundo!</h1>
			<button onClick={toggleTheme} className={theme}>
				tema
			</button>
		</div>
	);
}

export default App;
