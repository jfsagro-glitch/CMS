import type { ExtendedCollateralCard, ExtendedFilterParams } from '@/types';

export type ExtendedCardSortField = 'number' | 'name' | 'createdAt' | 'updatedAt';

export interface ExtendedCardSort {
  field: ExtendedCardSortField;
  order: 'asc' | 'desc';
}

export interface ExtendedCardQueryInput {
  filters?: ExtendedFilterParams;
  page: number;
  pageSize: number;
  sort?: ExtendedCardSort | null;
}

export interface ExtendedCardQueryResult {
  items: ExtendedCollateralCard[];
  total: number;
}
