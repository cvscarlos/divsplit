import './App.css';
import './i18n';
import AppRouter from '@routes/AppRouter';
import ThemeProvider from '@context/ThemeContext';
import { Container } from '@components/Container';

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
