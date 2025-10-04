// src/app/functionality/ThemeContext.tsx
// invisible change 2

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  isDarkMode: false, // Default value
  toggleTheme: () => {},
});

// Custom hook for easy access to the ThemeContext
export const useTheme = () => useContext(ThemeContext);

// ThemeProvider component to wrap your app
interface ThemeProviderProps {
  isDarkMode: boolean;
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ isDarkMode: initialIsDarkMode, children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('helix_theme') : null;
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {}
    return initialIsDarkMode;
  });

  useEffect(() => {
    setIsDarkMode(initialIsDarkMode);
  }, [initialIsDarkMode]);

  // Reflect on <body> and persist
  useEffect(() => {
    try {
      const themeName = isDarkMode ? 'dark' : 'light';
      if (typeof document !== 'undefined') {
        document.body.dataset.theme = themeName;
        document.body.classList.toggle('theme-dark', isDarkMode);
        document.body.classList.toggle('theme-light', !isDarkMode);
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('helix_theme', themeName);
        // Broadcast for listeners (e.g., Loading)
        window.dispatchEvent(new CustomEvent('helix-theme-changed', { detail: { theme: themeName } }));
      }
    } catch {}
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
