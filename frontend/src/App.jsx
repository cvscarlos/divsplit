import './App.css';
import './i18n.js';
import IndexRouter from './routes/router.jsx';
import ThemeProvider from './context/ThemeContext.jsx';
import { Container } from './components/Container.jsx';

function App() {
	return (
		<ThemeProvider>
			<Container>
				<IndexRouter />
			</Container>
		</ThemeProvider>
	);
}

export default App;
