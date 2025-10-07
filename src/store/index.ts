import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import cardsReducer from './slices/cardsSlice';
import extendedCardsReducer from './slices/extendedCardsSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    cards: cardsReducer,
    extendedCards: extendedCardsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Игнорируем проверку сериализации для Date объектов
        ignoredActions: [
          'cards/setCards',
          'cards/addCard',
          'cards/updateCard',
          'extendedCards/setExtendedCards',
          'extendedCards/addExtendedCard',
          'extendedCards/updateExtendedCard',
        ],
        ignoredPaths: ['cards.items', 'extendedCards.items'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

