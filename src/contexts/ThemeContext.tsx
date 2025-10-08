import React, { useState, useEffect } from 'react';
import { theme, ConfigProvider } from 'antd';
import { darkGrayTheme, windowsXPTheme, matrixTheme } from '../styles/theme';
import { ThemeContext, ThemeMode } from './ThemeContext.types';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('cms-theme');
    return (saved as ThemeMode) || 'dark-gray';
  });

  useEffect(() => {
    localStorage.setItem('cms-theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const getThemeConfig = () => {
    switch (currentTheme) {
      case 'dark-gray':
        return {
          ...darkGrayTheme,
          algorithm: theme.darkAlgorithm,
        };
      case 'windows-xp':
        return windowsXPTheme;
      case 'matrix':
        return {
          ...matrixTheme,
          algorithm: theme.darkAlgorithm,
        };
      case 'dark':
        return {
          algorithm: theme.darkAlgorithm,
        };
      case 'light':
      default:
        return {
          algorithm: theme.defaultAlgorithm,
        };
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: setCurrentTheme }}>
      <ConfigProvider theme={getThemeConfig()}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

