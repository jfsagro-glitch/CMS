import React, { useState } from 'react';
import { message } from 'antd';
import { useAppDispatch } from '@/store/hooks';
import { setExtendedCards } from '@/store/slices/extendedCardsSlice';
import { generateDemoCards } from '@/services/demoDataGenerator';
import extendedStorageService from '@/services/ExtendedStorageService';
import { DemoDataContext } from './DemoDataContext.types';

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
      message.success({
        content: `Загружено ${demoCards.length} демо-карточек`,
        key: 'demo',
        duration: 3,
      });
    } catch (error) {
      message.error({ content: 'Ошибка загрузки демо-данных', key: 'demo' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDemoData = async () => {
    try {
      setIsLoading(true);
      message.loading({ content: 'Удаление демо-данных...', key: 'clear' });
      
      // Получаем все карточки
      const allCards = await extendedStorageService.getExtendedCards();
      
      // Удаляем все карточки
      for (const card of allCards) {
        await extendedStorageService.deleteExtendedCard(card.id);
      }
      
      // Очищаем store
      dispatch(setExtendedCards([]));
      
      message.success({
        content: 'Все демо-данные удалены',
        key: 'clear',
        duration: 3,
      });
    } catch (error) {
      message.error({ content: 'Ошибка удаления демо-данных', key: 'clear' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DemoDataContext.Provider value={{ loadDemoData, clearDemoData, isLoading }}>
      {children}
    </DemoDataContext.Provider>
  );
};
