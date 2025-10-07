import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setInitialized, setSettings } from './store/slices/appSlice';
import { setCards } from './store/slices/cardsSlice';
import extendedStorageService from './services/ExtendedStorageService';
import MainLayout from './components/layout/MainLayout';
import ExtendedRegistryPage from './modules/Registry/ExtendedRegistryPage';
import PlaceholderPage from './modules/Placeholder/PlaceholderPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import 'antd/dist/reset.css';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme: appTheme, initialized } = useAppSelector(state => state.app);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Инициализация расширенной базы данных
        await extendedStorageService.initDatabase();

        // Загрузка настроек
        const settings = await extendedStorageService.getSettings();
        dispatch(setSettings(settings));

        // Загрузка расширенных карточек
        const cards = await extendedStorageService.getExtendedCards();
        
        // Автозагрузка демо-данных при первом запуске (если база пустая)
        if (cards.length === 0) {
          try {
            const { loadDemoData } = await import('./utils/demoData');
            await loadDemoData(extendedStorageService);
            const demoCards = await extendedStorageService.getExtendedCards();
            dispatch(setCards(demoCards));
            console.log('✅ Демо-данные загружены автоматически');
          } catch (error) {
            console.warn('Демо-данные не загружены:', error);
            dispatch(setCards(cards));
          }
        } else {
          dispatch(setCards(cards));
        }

        dispatch(setInitialized(true));
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initApp();
  }, [dispatch]);

  if (!initialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Загрузка...
      </div>
    );
  }

  const getThemeAlgorithm = () => {
    if (appTheme === 'dark') return theme.darkAlgorithm;
    if (appTheme === 'compact') return [theme.defaultAlgorithm, theme.compactAlgorithm];
    return theme.defaultAlgorithm;
  };

  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: getThemeAlgorithm(),
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <HashRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/registry" replace />} />
              <Route path="registry" element={<ExtendedRegistryPage />} />
              <Route path="tasks" element={<PlaceholderPage title="Задачи" />} />
              <Route path="reports" element={<PlaceholderPage title="Отчеты" />} />
              <Route path="mobile-appraiser" element={<PlaceholderPage title="Мобильный оценщик" />} />
              <Route path="smartdeal" element={<PlaceholderPage title="SmartDeal" />} />
              <Route path="upload" element={<PlaceholderPage title="Загрузка" />} />
              <Route path="monitoring" element={<PlaceholderPage title="Мониторинг" />} />
              <Route path="settings" element={<PlaceholderPage title="Настройки" />} />
            </Route>
          </Routes>
        </HashRouter>
      </AntApp>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </ErrorBoundary>
  );
};

export default App;

