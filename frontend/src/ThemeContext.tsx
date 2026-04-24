import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'grey' | 'lavender' | 'fall' | 'forest' | 'sea' | 'bubblegum';

const ThemeContext = createContext<{
    theme: Theme;
    setTheme: (theme: Theme) => void;
} | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('grey');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};