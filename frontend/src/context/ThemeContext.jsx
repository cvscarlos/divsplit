import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { jsonParseSafe, jsonStringifySafe } from '../utils/tools';

const ThemeContext = createContext();

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

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeContext() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useThemeContext must be used within a ThemeProvider');
	}
	return context;
}
