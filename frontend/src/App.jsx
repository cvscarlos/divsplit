import './App.css';
import './i18n.js';
import AppRouter from '@routes/AppRouter.jsx';
import ThemeProvider from '@context/ThemeContext.jsx';
import { Container } from '@components/Container.jsx';

function App() {
	return (
		<ThemeProvider>
			<Container>
				<AppRouter />
			</Container>
		</ThemeProvider>
	);
}

export default App;
