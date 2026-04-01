/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('dreamWealthyTheme');
        return savedTheme || 'light';
    });

    const [expenseBorderColor, setExpenseBorderColor] = useState(() => {
        const savedColor = localStorage.getItem('dreamWealthyExpenseBorderColor');
        return savedColor || 'none';
    });

    useEffect(() => {
        // Apply theme to document data attribute
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dreamWealthyTheme', theme);
    }, [theme]);

    useEffect(() => {
        // Load cloud border color once on mount across all tabs
        const loadCloudData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.user_metadata?.expenseBorderColor) {
                const cloudColor = session.user.user_metadata.expenseBorderColor;
                setExpenseBorderColor(cloudColor);
                localStorage.setItem('dreamWealthyExpenseBorderColor', cloudColor);
            }
        };
        loadCloudData();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user?.user_metadata?.expenseBorderColor) {
                setExpenseBorderColor(session.user.user_metadata.expenseBorderColor);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSetExpenseBorderColor = async (color) => {
        setExpenseBorderColor(color);
        localStorage.setItem('dreamWealthyExpenseBorderColor', color);
        // Force synchronous push to Supabase Cloud Profile
        try {
            await supabase.auth.updateUser({
                data: { expenseBorderColor: color }
            });
        } catch(e) { console.error('Failed to sync border color', e); }
    };

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, expenseBorderColor, setExpenseBorderColor: handleSetExpenseBorderColor }}>
            {children}
        </ThemeContext.Provider>
    );
};
