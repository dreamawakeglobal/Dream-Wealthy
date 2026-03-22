/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check local storage for saved theme preference
        const savedTheme = localStorage.getItem('dreamWealthyTheme');
        return savedTheme || 'light';
    });

    const [expenseBorderColor, setExpenseBorderColor] = useState(() => {
        // Check local storage for selected expense boundary color
        const savedColor = localStorage.getItem('dreamWealthyExpenseBorderColor');
        return savedColor || 'none';
    });

    useEffect(() => {
        // Apply theme to document data attribute
        document.documentElement.setAttribute('data-theme', theme);
        // Save to local storage
        localStorage.setItem('dreamWealthyTheme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('dreamWealthyExpenseBorderColor', expenseBorderColor);
    }, [expenseBorderColor]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, expenseBorderColor, setExpenseBorderColor }}>
            {children}
        </ThemeContext.Provider>
    );
};
