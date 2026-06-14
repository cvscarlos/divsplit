import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { jsonParseSafe, jsonStringifySafe } from '../utils/tools';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
	theme: Theme;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getInitialTheme = (): Theme => {
	const initialTheme = localStorage.getItem('divsplit_theme');
	const parsed = initialTheme ? jsonParseSafe<Theme>(initialTheme) : 'light';
	return parsed === 'light' || parsed === 'dark' ? parsed : 'light';
};

export default function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>(getInitialTheme());

	useEffect(() => {
		localStorage.setItem('divsplit_theme', jsonStringifySafe(theme));
	}, [theme]);

	const toggleTheme = () => {
		setTheme(theme === 'light' ? 'dark' : 'light');
	};

	return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeContext(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useThemeContext must be used within a ThemeProvider');
	}
	return context;
}
