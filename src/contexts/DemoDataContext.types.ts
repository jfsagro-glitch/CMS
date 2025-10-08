import { createContext } from 'react';

export interface DemoDataContextType {
  loadDemoData: () => Promise<void>;
  clearDemoData: () => Promise<void>;
  isLoading: boolean;
}

export const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);
