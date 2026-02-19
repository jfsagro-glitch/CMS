import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import appStateReducer from './slices/appStateSlice';
import cardsReducer from './slices/cardsSlice';
import extendedCardsReducer from './slices/extendedCardsSlice';
import workflowReducer from './slices/workflowSlice';
import registryQueryReducer from './slices/registryQuerySlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    appState: appStateReducer,
    cards: cardsReducer,
    extendedCards: extendedCardsReducer,
    workflow: workflowReducer,
    registryQuery: registryQueryReducer,
  },
  middleware: getDefaultMiddleware =>
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
