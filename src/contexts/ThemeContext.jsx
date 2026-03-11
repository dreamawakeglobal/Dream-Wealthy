import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check local storage for saved theme preference
        const savedTheme = localStorage.getItem('dreamWealthyTheme');
        return savedTheme || 'light';
    });

    useEffect(() => {
        // Apply theme to document data attribute
        document.documentElement.setAttribute('data-theme', theme);
        // Save to local storage
        localStorage.setItem('dreamWealthyTheme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
