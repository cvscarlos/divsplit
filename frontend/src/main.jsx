import React from 'react';
import ReactDOM from 'react-dom/client';

import './i18n.js';
import './index.css';
import App from './App.jsx';
import ThemeProvider from './context/ThemeContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<ThemeProvider>
			<App />
		</ThemeProvider>
	</React.StrictMode>,
);
