import './index.css';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './i18n';

import AppRouter from '@routes/AppRouter';
import ThemeProvider from '@context/ThemeContext';
import { Container } from '@components/Container';
import { ToastProvider } from '@components/Toast';

function App() {
	return (
		<ThemeProvider>
			<ToastProvider>
				<Container>
					<AppRouter />
				</Container>
			</ToastProvider>
		</ThemeProvider>
	);
}

export default App;
