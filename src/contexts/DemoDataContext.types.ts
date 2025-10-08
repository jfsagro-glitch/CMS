import { createContext } from 'react';

export interface DemoDataContextType {
  loadDemoData: () => Promise<void>;
  isLoading: boolean;
}

export const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);
