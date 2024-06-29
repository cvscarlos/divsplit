import './App.css';
import './i18n.js';
import IndexRouter from './routes/router.jsx';
import ThemeProvider from './context/ThemeContext.jsx';

function App() {
	return (
		<ThemeProvider>
			<IndexRouter />
		</ThemeProvider>
	);
}

export default App;
