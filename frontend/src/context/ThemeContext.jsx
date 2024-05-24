import { createContext, useEffect, useState } from "react";



export const ThemeContext = createContext()

export default function ThemeProvider({ children }) {
  
    const getInitialTheme = () =>{
        const initialTheme = localStorage.getItem('theme')
        return initialTheme ? JSON.parse(initialTheme) : 'light'
        
    }

    const [theme, setTheme] = useState(getInitialTheme())

    useEffect(()=>{
        localStorage.setItem('theme',JSON.stringify(theme))
    },[theme])

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light')
        console.log(theme)
        
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
        </ThemeContext.Provider>
    )
}