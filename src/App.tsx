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
import { ThemeProvider } from './contexts/ThemeContext';
import { DemoDataProvider } from './contexts/DemoDataContext';
import MainLayout from './components/layout/MainLayout';
import ExtendedRegistryPage from './modules/Registry/ExtendedRegistryPage';
import PlaceholderPage from './modules/Placeholder/PlaceholderPage';
import InsurancePage from './modules/Insurance/InsurancePage';
import PortfolioPage from './modules/Portfolio/PortfolioPage';
import CollateralDossierPage from './modules/CollateralDossier/CollateralDossierPage';
import MonitoringPage from './modules/Monitoring/MonitoringPage';
import ReportsPage from './modules/Reports/ReportsPage';
import TasksPage from './modules/Tasks/TasksPage';
import CMSCheckPage from './modules/CMSCheck/CMSCheckPage';
import MobileInspectionPage from './modules/CMSCheck/MobileInspectionPage';
import CollateralConclusionsPage from './modules/CollateralConclusions/CollateralConclusionsPage';
import FNPServicePage from './modules/FNP/FNPServicePage';
import CreditRiskPage from './modules/CreditRisk/CreditRiskPage';
import AppraisalPage from './modules/Appraisal/AppraisalPage';
import EGRNPage from './modules/EGRN/EGRNPage';
import KPIPage from './modules/KPI/KPIPage';
import AnalyticsPage from './modules/Analytics/AnalyticsPage';
import EmployeesPage from './modules/Settings/EmployeesPage';
import ReferenceDataPage from './modules/Settings/ReferenceDataPage';
import UploadPage from './modules/Upload/UploadPage';
import ReferencePage from './modules/Reference/ReferencePage';
import ErrorBoundary from './components/common/ErrorBoundary';
import 'antd/dist/reset.css';
import './styles/global.css';

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

        // Синхронизация сотрудников с zadachnik
        try {
          const { syncEmployeesToZadachnik } = await import('./utils/syncEmployeesToZadachnik');
          syncEmployeesToZadachnik();
          
          // Проверяем, есть ли задачи, если нет - генерируем
          const existingTasks = localStorage.getItem('zadachnik_tasks');
          if (!existingTasks || JSON.parse(existingTasks).length === 0) {
            const { generateTasksForEmployees } = await import('./utils/generateTasksForEmployees');
            generateTasksForEmployees();
            console.log('✅ Задачи для сотрудников сгенерированы автоматически');
          }
        } catch (error) {
          console.warn('Не удалось синхронизировать сотрудников с zadachnik:', error);
        }

        // Загрузка демо-данных осмотров при первом запуске
        try {
          const inspectionService = (await import('./services/InspectionService')).default;
          await inspectionService.initDatabase();
          const inspections = await inspectionService.getInspections();
          
          if (inspections.length === 0) {
            const { loadInspectionDemoData } = await import('./utils/inspectionDemoData');
            await loadInspectionDemoData();
            console.log('✅ Демо-данные осмотров загружены автоматически');
          }
        } catch (error) {
          console.warn('Демо-данные осмотров не загружены:', error);
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
      <div
        style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
          height: '100vh',
        }}
      >
        Загрузка...
      </div>
    );
  }

  const getThemeAlgorithm = () => {
    switch (appTheme) {
      case 'dark':
        return theme.darkAlgorithm;
      case 'compact':
        return [theme.defaultAlgorithm, theme.compactAlgorithm];
      default:
        return theme.defaultAlgorithm;
    }
  };

      return (
        <ThemeProvider>
          <DemoDataProvider>
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
                  <Route path="portfolio" element={<PortfolioPage />} />
                  <Route path="collateral-dossier" element={<CollateralDossierPage />} />
                  <Route path="collateral-conclusions" element={<CollateralConclusionsPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="kpi" element={<KPIPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="insurance" element={<InsurancePage />} />
                  <Route path="fnp" element={<FNPServicePage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="credit-risk" element={<CreditRiskPage />} />
                  <Route path="appraisal" element={<AppraisalPage />} />
                  <Route path="cms-check" element={<CMSCheckPage />} />
                  <Route path="inspection/:token" element={<MobileInspectionPage />} />
                  <Route path="egrn" element={<EGRNPage />} />
                      <Route path="upload" element={<UploadPage />} />
                  <Route path="monitoring" element={<MonitoringPage />} />
                  <Route path="reference" element={<ReferencePage />} />
                      <Route path="settings" element={<PlaceholderPage title="Настройки" />} />
                      <Route path="settings/employees" element={<EmployeesPage />} />
                      <Route path="settings/reference-data" element={<ReferenceDataPage />} />
                    </Route>
                  </Routes>
                </HashRouter>
              </AntApp>
            </ConfigProvider>
          </DemoDataProvider>
        </ThemeProvider>
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
