import { createContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

export const ThemeContext = createContext();

ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default function ThemeProvider({ children }) {
    const getInitialTheme = () => {
        const initialTheme = localStorage.getItem('theme');
        return initialTheme ? JSON.parse(initialTheme) : 'light';
    };

    const [theme, setTheme] = useState(getInitialTheme());

    useEffect(() => {
        localStorage.setItem('theme', JSON.stringify(theme));
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
