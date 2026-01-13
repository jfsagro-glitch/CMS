import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setInitialized, setSettings } from './store/slices/appSlice';
import { setCards } from './store/slices/cardsSlice';
import {
  setCases as setWorkflowCases,
  setTemplates as setWorkflowTemplates,
  DEFAULT_WORKFLOW_TEMPLATES,
} from './store/slices/workflowSlice';
import extendedStorageService from './services/ExtendedStorageService';
import employeeService from './services/EmployeeService';
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
import NormHoursPage from './modules/Settings/NormHoursPage';
import MetricsPage from './modules/Settings/MetricsPage';
import { AppraisalCompaniesPage } from './modules/Settings/AppraisalCompaniesPage';
import UploadPage from './modules/Upload/UploadPage';
import ReferencePage from './modules/Reference/ReferencePage';
import WorkflowPage from './modules/Workflow/WorkflowPage';
import WorkflowCasePage from './modules/Workflow/WorkflowCasePage';
import WorkflowSettingsPage from './modules/Workflow/WorkflowSettingsPage';
import ProjectsPortfolioPage from './modules/ProjectsPortfolio/ProjectsPortfolioPage';
import { ConsultingHomePage } from './modules/ProjectsPortfolio/ConsultingHomePage';
import { ServicesPage } from './modules/ProjectsPortfolio/ServicesPage';
import { CasesPage } from './modules/ProjectsPortfolio/CasesPage';
import { BrandStoryPage } from './modules/ProjectsPortfolio/BrandStoryPage';
import { CommercialOfferPage } from './modules/ProjectsPortfolio/CommercialOfferPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import 'antd/dist/reset.css';
import './styles/global.css';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme: appTheme, initialized } = useAppSelector(state => state.app);
  const workflowState = useAppSelector(state => state.workflow);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Очищаем старые задачи из localStorage, если они слишком большие (чтобы избежать QuotaExceededError)
        // Пытаемся удалить сразу, без чтения, чтобы избежать QuotaExceededError при чтении
        try {
          // Просто удаляем старые данные, если они есть
          localStorage.removeItem('zadachnik_tasks');
          console.log('✅ Очищены старые задачи из localStorage (данные теперь в IndexedDB)');
        } catch (error) {
          // Если не удалось удалить, просто продолжаем (не критично)
          console.warn('Не удалось очистить задачи из localStorage (не критично):', error);
        }

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

          // Проверяем наличие сотрудников
          const employees = employeeService.getEmployees();
          const activeEmployees = employees.filter(emp => emp.isActive);

          // Проверяем, есть ли задачи, и достаточно ли их (минимум 60 задач на сотрудника)
          let tasksData: any[] = [];
          try {
            tasksData = await extendedStorageService.getTasks();
          } catch (error) {
            // Fallback на localStorage (только если IndexedDB недоступен)
            try {
              const existingTasks = localStorage.getItem('zadachnik_tasks');
              if (existingTasks) {
                // Проверяем размер перед парсингом
                if (existingTasks.length < 4 * 1024 * 1024) {
                  // Только если меньше 4MB
                  tasksData = JSON.parse(existingTasks);
                } else {
                  console.warn(
                    'Задачи в localStorage слишком большие, используем только IndexedDB'
                  );
                }
              }
            } catch (e) {
              console.warn('Не удалось загрузить задачи из localStorage:', e);
            }
          }

          const minTasksPerEmployee = 60;
          const expectedMinTasks = activeEmployees.length * minTasksPerEmployee;

          if (!tasksData || tasksData.length === 0 || tasksData.length < expectedMinTasks) {
            const { generateTasksForEmployees } = await import('./utils/generateTasksForEmployees');
            await generateTasksForEmployees();
            tasksData = await extendedStorageService.getTasks();
            console.log(
              `✅ Сгенерировано ${tasksData.length} задач для ${
                activeEmployees.length
              } активных сотрудников (${(tasksData.length / activeEmployees.length).toFixed(
                1
              )} задач на сотрудника)`
            );
          } else {
            console.log(
              `✅ Загружено ${tasksData.length} задач для ${
                activeEmployees.length
              } активных сотрудников (${(tasksData.length / activeEmployees.length).toFixed(
                1
              )} задач на сотрудника)`
            );
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

        // Загрузка workflow (кейсы и шаблоны) из IndexedDB
        try {
          const wfCases = await extendedStorageService.getWorkflowCases();
          if (wfCases && wfCases.length > 0) {
            dispatch(setWorkflowCases(wfCases));
          }
          const wfTemplates = await extendedStorageService.getWorkflowTemplates();
          if (wfTemplates && wfTemplates.length > 0) {
            dispatch(setWorkflowTemplates(wfTemplates));
          } else {
            await extendedStorageService.saveWorkflowTemplates(DEFAULT_WORKFLOW_TEMPLATES);
            dispatch(setWorkflowTemplates(DEFAULT_WORKFLOW_TEMPLATES));
          }
        } catch (error) {
          console.warn('Не удалось загрузить workflow из IndexedDB:', error);
        }

        dispatch(setInitialized(true));
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initApp();
  }, [dispatch]);

  // Сохраняем workflow кейсы и шаблоны в IndexedDB при изменениях (после инициализации)
  useEffect(() => {
    if (!initialized) return;
    (async () => {
      try {
        await extendedStorageService.saveWorkflowCases(workflowState.cases);
        await extendedStorageService.saveWorkflowTemplates(workflowState.templates);
      } catch (error) {
        console.warn('Не удалось сохранить workflow в IndexedDB:', error);
      }
    })();
  }, [initialized, workflowState.cases, workflowState.templates]);

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
                  <Route path="projects-portfolio" element={<ProjectsPortfolioPage />}>
                    <Route index element={<ConsultingHomePage />} />
                    <Route path="services" element={<ServicesPage />} />
                    <Route path="cases" element={<CasesPage />} />
                    <Route path="about" element={<BrandStoryPage />} />
                    <Route path="offer" element={<CommercialOfferPage />} />
                  </Route>
                  <Route path="workflow" element={<WorkflowPage />} />
                  <Route path="workflow/object/:id" element={<WorkflowCasePage />} />
                  <Route
                    path="workflow/settings"
                    element={<Navigate to="/settings/workflow" replace />}
                  />
                  <Route path="settings" element={<PlaceholderPage title="Настройки" />} />
                  <Route path="settings/workflow" element={<WorkflowSettingsPage />} />
                  <Route path="settings/employees" element={<EmployeesPage />} />
                  <Route path="settings/reference-data" element={<ReferenceDataPage />} />
                  <Route path="settings/norm-hours" element={<NormHoursPage />} />
                  <Route path="settings/metrics" element={<MetricsPage />} />
                  <Route path="settings/appraisal-companies" element={<AppraisalCompaniesPage />} />
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
