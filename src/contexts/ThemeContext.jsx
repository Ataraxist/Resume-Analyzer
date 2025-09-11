import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Track whether user has explicitly set a preference
  const [userThemePreference, setUserThemePreference] = useState(() => {
    return localStorage.getItem('theme');
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    // If user has a saved preference, use that
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Otherwise, use system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Function to handle system theme changes
    const handleSystemThemeChange = (e) => {
      // Only update if user hasn't set their own preference
      if (!userThemePreference) {
        setIsDarkMode(e.matches);
      }
    };

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [userThemePreference]);

  useEffect(() => {
    // Update document class based on isDarkMode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    // Save user preference when they explicitly toggle
    const themeToSave = newTheme ? 'dark' : 'light';
    localStorage.setItem('theme', themeToSave);
    setUserThemePreference(themeToSave);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}