import React, { useState, useEffect } from 'react';
import { theme, ConfigProvider } from 'antd';
import {
  darkGrayTheme,
  windowsXPTheme,
  matrixTheme,
  blackWhiteTheme,
  windows97Theme,
  iosTheme,
} from '../styles/theme';
import { ThemeContext, ThemeMode } from './ThemeContext.types';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('cms-theme');
    return (saved as ThemeMode) || 'dark-gray';
  });

  useEffect(() => {
    localStorage.setItem('cms-theme', currentTheme);
    
    // Add smooth transition class before theme change
    document.documentElement.classList.add('theme-transitioning');
    
    // Use requestAnimationFrame for smooth transition
    requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-theme', currentTheme);
      
      // Remove transition class after animation completes
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 500);
    });
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
      case 'windows-97':
        return windows97Theme;
      case 'ios':
        return iosTheme;
      case 'matrix':
        return {
          ...matrixTheme,
          algorithm: theme.darkAlgorithm,
        };
      case 'dark':
        return {
          ...blackWhiteTheme,
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
      <ConfigProvider theme={getThemeConfig()}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
};
