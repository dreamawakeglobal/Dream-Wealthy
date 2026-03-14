import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../SoundContext';
import { useLocation } from 'react-router-dom';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const { playPop } = useSound();
    const location = useLocation();

    if (location.pathname === '/') return null;

    const handleThemeToggle = () => {
        playPop();
        toggleTheme();
    };

    return (
        <div className="system-toggles-container">
            <button
                onClick={handleThemeToggle}
                className="fixed-system-toggle"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
                {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
        </div>
    );
};

export default ThemeToggle;
