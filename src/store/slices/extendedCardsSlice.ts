import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ExtendedCollateralCard, ExtendedFilterParams, SortParams } from '@/types';

interface ExtendedCardsState {
  items: ExtendedCollateralCard[];
  filteredItems: ExtendedCollateralCard[];
  selectedCard: ExtendedCollateralCard | null;
  filters: ExtendedFilterParams;
  sort: SortParams | null;
  loading: boolean;
  error: string | null;
}

const initialState: ExtendedCardsState = {
  items: [],
  filteredItems: [],
  selectedCard: null,
  filters: {},
  sort: null,
  loading: false,
  error: null,
};

const extendedCardsSlice = createSlice({
  name: 'extendedCards',
  initialState,
  reducers: {
    setExtendedCards: (state, action: PayloadAction<ExtendedCollateralCard[]>) => {
      state.items = action.payload;
      state.filteredItems = applyFiltersAndSort(action.payload, state.filters, state.sort);
    },
    addExtendedCard: (state, action: PayloadAction<ExtendedCollateralCard>) => {
      state.items.push(action.payload);
      state.filteredItems = applyFiltersAndSort(state.items, state.filters, state.sort);
    },
    updateExtendedCard: (state, action: PayloadAction<ExtendedCollateralCard>) => {
      const index = state.items.findIndex(card => card.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
        state.filteredItems = applyFiltersAndSort(state.items, state.filters, state.sort);
      }
    },
    deleteExtendedCard: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(card => card.id !== action.payload);
      state.filteredItems = applyFiltersAndSort(state.items, state.filters, state.sort);
    },
    deleteExtendedCards: (state, action: PayloadAction<string[]>) => {
      state.items = state.items.filter(card => !action.payload.includes(card.id));
      state.filteredItems = applyFiltersAndSort(state.items, state.filters, state.sort);
    },
    setSelectedExtendedCard: (state, action: PayloadAction<ExtendedCollateralCard | null>) => {
      state.selectedCard = action.payload;
    },
    setExtendedFilters: (state, action: PayloadAction<ExtendedFilterParams>) => {
      state.filters = action.payload;
      state.filteredItems = applyFiltersAndSort(state.items, action.payload, state.sort);
    },
    setExtendedSort: (state, action: PayloadAction<SortParams | null>) => {
      state.sort = action.payload;
      state.filteredItems = applyFiltersAndSort(state.items, state.filters, action.payload);
    },
    clearExtendedFilters: (state) => {
      state.filters = {};
      state.filteredItems = applyFiltersAndSort(state.items, {}, state.sort);
    },
    setExtendedLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setExtendedError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// Вспомогательная функция для применения фильтров и сортировки
function applyFiltersAndSort(
  items: ExtendedCollateralCard[],
  filters: ExtendedFilterParams,
  sort: SortParams | null
): ExtendedCollateralCard[] {
  let result = [...items];

  // Применяем фильтры
  if (filters.mainCategory) {
    result = result.filter(card => card.mainCategory === filters.mainCategory);
  }

  if (filters.status) {
    result = result.filter(card => card.status === filters.status);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    result = result.filter(card =>
      card.name.toLowerCase().includes(query) ||
      card.number.toLowerCase().includes(query) ||
      card.address?.fullAddress?.toLowerCase().includes(query)
    );
  }

  if (filters.region) {
    result = result.filter(card =>
      card.address?.region?.toLowerCase().includes(filters.region!.toLowerCase())
    );
  }

  if (filters.hasDocuments !== undefined) {
    result = result.filter(card =>
      filters.hasDocuments ? card.documents.length > 0 : card.documents.length === 0
    );
  }

  // Применяем сортировку
  if (sort) {
    result.sort((a, b) => {
      const aValue = a[sort.field as keyof ExtendedCollateralCard];
      const bValue = b[sort.field as keyof ExtendedCollateralCard];

      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return result;
}

export const {
  setExtendedCards,
  addExtendedCard,
  updateExtendedCard,
  deleteExtendedCard,
  deleteExtendedCards,
  setSelectedExtendedCard,
  setExtendedFilters,
  setExtendedSort,
  clearExtendedFilters,
  setExtendedLoading,
  setExtendedError,
} = extendedCardsSlice.actions;

export default extendedCardsSlice.reducer;

