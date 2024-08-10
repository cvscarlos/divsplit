// Este arquivo é apenas um inicializador da aplicação,
// nenhum código deve ser escrito aqui, apenas a inicialização

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('app-root')).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
