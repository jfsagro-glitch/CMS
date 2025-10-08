import { useContext } from 'react';
import { DemoDataContext } from '../contexts/DemoDataContext.types';

export const useDemoData = () => {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData must be used within DemoDataProvider');
  }
  return context;
};
