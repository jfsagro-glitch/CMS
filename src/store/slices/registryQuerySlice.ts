import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { CardStatus, MainCategory } from '@/types';
import type { RootState } from '@/store';

export type RegistrySortField = 'number' | 'name' | 'createdAt' | 'updatedAt';
export type RegistrySortOrder = 'asc' | 'desc';

export interface RegistrySort {
  field: RegistrySortField;
  order: RegistrySortOrder;
}

export interface RegistryFilters {
  mainCategory?: MainCategory;
  status?: CardStatus;
  searchQuery?: string;
  region?: string;
}

export interface RegistryQueryState {
  page: number;
  pageSize: number;
  filters: RegistryFilters;
  sort: RegistrySort | null;
  reloadToken: number;
}

const initialState: RegistryQueryState = {
  page: 1,
  pageSize: 30,
  filters: {},
  sort: null,
  reloadToken: 0,
};

const registryQuerySlice = createSlice({
  name: 'registryQuery',
  initialState,
  reducers: {
    setRegistryPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setRegistryPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = 1;
    },
    setRegistryFilters: (state, action: PayloadAction<RegistryFilters>) => {
      state.filters = action.payload;
      state.page = 1;
    },
    setRegistrySort: (state, action: PayloadAction<RegistrySort | null>) => {
      state.sort = action.payload;
      state.page = 1;
    },
    setRegistrySearch: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;
      state.page = 1;
    },
    resetRegistryFilters: (state) => {
      state.filters = {};
      state.page = 1;
    },
    bumpRegistryReloadToken: (state) => {
      state.reloadToken += 1;
    },
  },
});

export const {
  setRegistryPage,
  setRegistryPageSize,
  setRegistryFilters,
  setRegistrySort,
  setRegistrySearch,
  resetRegistryFilters,
  bumpRegistryReloadToken,
} = registryQuerySlice.actions;

export default registryQuerySlice.reducer;

export const selectRegistryQuery = (state: RootState) => state.registryQuery;

export const selectRegistryPagination = createSelector([selectRegistryQuery], query => ({
  page: query.page,
  pageSize: query.pageSize,
}));

export const selectRegistryFilters = createSelector([selectRegistryQuery], query => query.filters);

export const selectRegistrySort = createSelector([selectRegistryQuery], query => query.sort);
