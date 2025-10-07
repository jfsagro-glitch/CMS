import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppSettings, ThemeMode } from '@/types';

interface AppState extends AppSettings {
  loading: boolean;
  initialized: boolean;
}

const initialState: AppState = {
  theme: 'light',
  language: 'ru',
  sidebarCollapsed: false,
  loading: false,
  initialized: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'ru' | 'en'>) => {
      state.language = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
    setSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  setTheme,
  setLanguage,
  toggleSidebar,
  setSidebarCollapsed,
  setLoading,
  setInitialized,
  setSettings,
} = appSlice.actions;

export default appSlice.reducer;

