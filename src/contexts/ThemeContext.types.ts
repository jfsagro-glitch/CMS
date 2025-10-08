import { createContext } from 'react';

export type ThemeMode = 'light' | 'dark' | 'windows-xp' | 'dark-gray' | 'matrix' | 'windows-97' | 'ios';

export interface ThemeContextType {
  currentTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

