import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CollateralCard, FilterParams, SortParams } from '@/types';

interface CardsState {
  items: CollateralCard[];
  filteredItems: CollateralCard[];
  selectedCard: CollateralCard | null;
  filters: FilterParams;
  sort: SortParams | null;
  loading: boolean;
  error: string | null;
}

const initialState: CardsState = {
  items: [],
  filteredItems: [],
  selectedCard: null,
  filters: {},
  sort: null,
  loading: false,
  error: null,
};

const cardsSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {
    setCards: (state, action: PayloadAction<CollateralCard[]>) => {
      state.items = action.payload;
      state.filteredItems = applyFiltersAndSort(action.payload, state.filters, state.sort);
    },
    addCard: (state, action: PayloadAction<CollateralCard>) => {
      state.items.push(action.payload);
      state.filteredItems = applyFiltersAndSort(state.items, state.filters, state.sort);
    },
    updateCard: (state, action: PayloadAction<CollateralCard>) => {
      const index = state.items.findIndex(card => card.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
        state.filteredItems = applyFiltersAndSort(state.items, state.filters, state.sort);
      }
    },
    deleteCard: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(card => card.id !== action.payload);
      state.filteredItems = applyFiltersAndSort(state.items, state.filters, state.sort);
    },
    deleteCards: (state, action: PayloadAction<string[]>) => {
      state.items = state.items.filter(card => !action.payload.includes(card.id));
      state.filteredItems = applyFiltersAndSort(state.items, state.filters, state.sort);
    },
    setSelectedCard: (state, action: PayloadAction<CollateralCard | null>) => {
      state.selectedCard = action.payload;
    },
    setFilters: (state, action: PayloadAction<FilterParams>) => {
      state.filters = action.payload;
      state.filteredItems = applyFiltersAndSort(state.items, action.payload, state.sort);
    },
    setSort: (state, action: PayloadAction<SortParams | null>) => {
      state.sort = action.payload;
      state.filteredItems = applyFiltersAndSort(state.items, state.filters, action.payload);
    },
    clearFilters: state => {
      state.filters = {};
      state.filteredItems = applyFiltersAndSort(state.items, {}, state.sort);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// Вспомогательная функция для применения фильтров и сортировки
function applyFiltersAndSort(
  items: CollateralCard[],
  filters: FilterParams,
  sort: SortParams | null
): CollateralCard[] {
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
    result = result.filter(
      card => card.name.toLowerCase().includes(query) || card.number.toLowerCase().includes(query)
    );
  }

  if (filters.dateFrom) {
    result = result.filter(card => card.createdAt >= filters.dateFrom!);
  }

  if (filters.dateTo) {
    result = result.filter(card => card.createdAt <= filters.dateTo!);
  }

  // Применяем сортировку
  if (sort) {
    result.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return result;
}

export const {
  setCards,
  addCard,
  updateCard,
  deleteCard,
  deleteCards,
  setSelectedCard,
  setFilters,
  setSort,
  clearFilters,
  setLoading,
  setError,
} = cardsSlice.actions;

export default cardsSlice.reducer;
