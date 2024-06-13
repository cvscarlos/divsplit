import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import './App.css';
import './i18n.js';
import IndexRouter from './routes/router.jsx';
import ThemeProvider from './context/ThemeContext.jsx';
import GroupProvider from './context/GroupContext.jsx';

function App() {
	return (
		<React.StrictMode>
			<BrowserRouter>
				<ThemeProvider>
					<GroupProvider>
						<IndexRouter />
					</GroupProvider>
				</ThemeProvider>
			</BrowserRouter>
		</React.StrictMode>
	);
}

export default App;
