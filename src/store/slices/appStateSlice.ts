import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AppSettings } from '@/types';
import extendedStorageService from '@/services/ExtendedStorageService';

/**
 * Application State Machine
 * 
 * States:
 * - 'idle': Initial state, waiting to start
 * - 'loading': Database initialization in progress
 * - 'ready': Database ready, no errors
 * - 'error': Initialization failed (retryable)
 * - 'critical_error': Fatal error (requires user intervention)
 */
export enum AppInitState {
  Idle = 'idle',
  Loading = 'loading',
  Ready = 'ready',
  Error = 'error',
  CriticalError = 'critical_error',
}

interface AppStateStore {
  initState: AppInitState;
  settings: AppSettings | null;
  error: string | null;
  retries: number;
  maxRetries: number;
}

const initialState: AppStateStore = {
  initState: AppInitState.Idle,
  settings: null,
  error: null,
  retries: 0,
  maxRetries: 3,
};

/**
 * Async thunk for complete app initialization
 * Handles:
 * - Database initialization
 * - Settings loading
 * - Employee sync
 * - Demo data auto-load if DB empty
 * - Task migration from localStorage
 */
export const initializeApp = createAsyncThunk(
  'appState/initializeApp',
  async (_, { rejectWithValue }) => {
    try {
      // 1. Initialize database
      await extendedStorageService.initDatabase();

      // 2. Load settings
      const settings = await extendedStorageService.getSettings();

      // 3. Ensure employees are synced
      try {
        const { syncEmployeesToZadachnik } = await import('@/utils/syncEmployeesToZadachnik');
        syncEmployeesToZadachnik();
      } catch (err) {
        console.warn('Employee sync failed (non-critical):', err);
      }

      // 4. Check if cards exist; if not, load demo data
      const cards = await extendedStorageService.getExtendedCards();
      if (cards.length === 0) {
        try {
          const { loadDemoData } = await import('@/utils/demoData');
          await loadDemoData(extendedStorageService);
        } catch (err) {
          console.warn('Demo data auto-load failed:', err);
          // Non-critical, continue
        }
      }

      // 5. Ensure tasks are migrated to IndexedDB
      try {
        await extendedStorageService.getTasks();
        // Tasks successfully loaded from IndexedDB
      } catch (err) {
        // Attempt fallback to localStorage only as last resort
        console.warn('Task load from IndexedDB failed:', err);
      }

      return settings;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during initialization';
      return rejectWithValue(message);
    }
  }
);

const appStateSlice = createSlice({
  name: 'appState',
  initialState,
  reducers: {
    /**
     * Manual state reset (useful for retry flows)
     */
    resetInitState: (state) => {
      state.initState = AppInitState.Idle;
      state.error = null;
      state.retries = 0;
    },

    /**
     * Manual error clear
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Manually set init state (for testing/debugging)
     */
    setInitState: (state, action: PayloadAction<AppInitState>) => {
      state.initState = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Pending: DB initialization started
      .addCase(initializeApp.pending, (state) => {
        state.initState = AppInitState.Loading;
        state.error = null;
      })
      // Fulfilled: DB initialization succeeded
      .addCase(initializeApp.fulfilled, (state, action) => {
        state.initState = AppInitState.Ready;
        state.settings = action.payload;
        state.error = null;
        state.retries = 0;
      })
      // Rejected: DB initialization failed
      .addCase(initializeApp.rejected, (state, action) => {
        const message = action.payload as string;
        state.retries += 1;

        if (state.retries >= state.maxRetries) {
          // Critical error: max retries exceeded
          state.initState = AppInitState.CriticalError;
          state.error = `Initialization failed after ${state.maxRetries} attempts: ${message}`;
        } else {
          // Retryable error
          state.initState = AppInitState.Error;
          state.error = message;
        }
      });
  },
});

export const { resetInitState, clearError, setInitState } = appStateSlice.actions;
export default appStateSlice.reducer;
