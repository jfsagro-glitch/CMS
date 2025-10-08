import React, { createContext, useContext, useState } from 'react';
import { message } from 'antd';
import { useAppDispatch } from '@/store/hooks';
import { setExtendedCards } from '@/store/slices/extendedCardsSlice';
import { generateDemoCards } from '@/services/demoDataGenerator';
import extendedStorageService from '@/services/ExtendedStorageService';

interface DemoDataContextType {
  loadDemoData: () => Promise<void>;
  isLoading: boolean;
}

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

export const DemoDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const loadDemoData = async () => {
    try {
      setIsLoading(true);
      const demoCards = generateDemoCards();
      message.loading({ content: 'Загрузка демо-данных...', key: 'demo' });
      
      for (const card of demoCards) {
        await extendedStorageService.saveExtendedCard(card);
      }
      
      dispatch(setExtendedCards(demoCards));
      message.success({ content: `Загружено ${demoCards.length} демо-карточек`, key: 'demo', duration: 3 });
    } catch (error) {
      message.error({ content: 'Ошибка загрузки демо-данных', key: 'demo' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DemoDataContext.Provider value={{ loadDemoData, isLoading }}>
      {children}
    </DemoDataContext.Provider>
  );
};

export const useDemoData = () => {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData must be used within DemoDataProvider');
  }
  return context;
};
