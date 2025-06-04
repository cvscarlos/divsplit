import { createContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { jsonParseSafe, jsonStringifySafe } from '../utils/tools';

export const ThemeContext = createContext();

const getInitialTheme = () => {
	const initialTheme = localStorage.getItem('divsplit_theme');
	return initialTheme ? jsonParseSafe(initialTheme) : 'light';
};

ThemeProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default function ThemeProvider({ children }) {
	const [theme, setTheme] = useState(getInitialTheme());

	useEffect(() => {
		localStorage.setItem('divsplit_theme', jsonStringifySafe(theme));
	}, [theme]);

	const toggleTheme = () => {
		setTheme(theme === 'light' ? 'dark' : 'light');
	};

	return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
