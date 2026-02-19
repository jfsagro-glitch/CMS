import React, { useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setInitialized } from './store/slices/appSlice';
import { setCards } from './store/slices/cardsSlice';
import { initializeApp, AppInitState } from './store/slices/appStateSlice';
import {
  setCases as setWorkflowCases,
  setTemplates as setWorkflowTemplates,
  DEFAULT_WORKFLOW_TEMPLATES,
} from './store/slices/workflowSlice';
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
import { ITProjectsPage } from './modules/ProjectsPortfolio/ITProjectsPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import { perfMark, perfMeasure } from './utils/performance';
import 'antd/dist/reset.css';
import './styles/global.css';

const AppContent: React.FC = () => {
  const LegacyParamRedirect: React.FC<{
    buildTo: (params: Record<string, string | undefined>) => string;
  }> = ({ buildTo }) => {
    const params = useParams();
    return <Navigate to={buildTo(params)} replace />;
  };

  const dispatch = useAppDispatch();
  const { theme: appTheme, initialized } = useAppSelector(state => state.app);
  const { initState, error: initError } = useAppSelector(state => state.appState);
  const workflowState = useAppSelector(state => state.workflow);

  useEffect(() => {
    const { pathname, hash } = window.location;
    if (pathname.startsWith('/cms') && (!hash || hash === '#' || hash === '#/')) {
      window.location.hash = '#/cms/registry';
    }
  }, []);

  /**
   * Load application data after database initialization succeeds
   */
  const loadApplicationData = useCallback(async () => {
    try {
      // Load extended cards
      perfMark('load:cards:start');
      const cards = await extendedStorageService.getExtendedCards();
      dispatch(setCards(cards));
      perfMark('load:cards:end');
      perfMeasure('load:cards', 'load:cards:start', 'load:cards:end');

      // Load and ensure workflow data
      perfMark('load:workflow:start');
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
      perfMark('load:workflow:end');
      perfMeasure('load:workflow', 'load:workflow:start', 'load:workflow:end');

      // Load inspection data
      try {
        const inspectionService = (await import('./services/InspectionService')).default;
        await inspectionService.initDatabase();
        const inspections = await inspectionService.getInspections();
        if (inspections.length === 0) {
          const { loadInspectionDemoData } = await import('./utils/inspectionDemoData');
          await loadInspectionDemoData();
          console.log('✅ Демо-данные осмотров загружены');
        }
      } catch (err) {
        console.warn('Ошибка при загрузке осмотров:', err);
      }

      // Mark app as initialized after all data is loaded
      dispatch(setInitialized(true));
    } catch (err) {
      console.error('Ошибка при загрузке данных приложения:', err);
    }
  }, [dispatch]);

  /**
   * Main app initialization using state machine
   * Triggers once on mount
   */
  useEffect(() => {
    if (initialized || initState !== AppInitState.Idle) {
      return;
    }

    // Clean up old localStorage data and trigger app initialization
    try {
      localStorage.removeItem('zadachnik_tasks');
      console.log('✅ Очищены старые задачи из localStorage');
    } catch (err) {
      console.warn('Не удалось очистить localStorage:', err);
    }

    // Dispatch state machine initialization
    perfMark('init:start');
    dispatch(initializeApp()).then(() => {
      perfMark('init:end');
      perfMeasure('init:total', 'init:start', 'init:end');
      
      // Load additional application data after DB is ready
      loadApplicationData();
    });
  }, [dispatch, initialized, initState, loadApplicationData]);

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

  /**
   * Handle initialization states
   * - Idle/Loading: Show spinner
   * - Error: Show retry message
   * - CriticalError: Show fatal error message
   * - Ready: Proceed to main UI
   */
  if (!initialized || initState === AppInitState.Loading || initState === AppInitState.Idle) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ fontSize: '16px' }}>Инициализация приложения...</div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          {initState === AppInitState.Loading ? 'Подготовка данных' : 'Ожидание'}
        </div>
      </div>
    );
  }

  // Handle initialization error state
  if (initState === AppInitState.Error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '20px',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: '18px', color: '#d4380d' }}>⚠️ Ошибка инициализации</div>
        <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', maxWidth: '400px' }}>
          {initError || 'Неизвестная ошибка при инициализации приложения'}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 24px',
            fontSize: '14px',
            cursor: 'pointer',
            border: '1px solid #d4380d',
            color: '#d4380d',
            backgroundColor: 'transparent',
            borderRadius: '4px',
          }}
        >
          Перезагрузить
        </button>
      </div>
    );
  }

  // Handle critical error state
  if (initState === AppInitState.CriticalError) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '20px',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: '20px', color: '#d4380d' }}>❌ Критическая ошибка</div>
        <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', maxWidth: '400px' }}>
          {initError || 'Приложение не может быть инициализировано. Пожалуйста, свяжитесь с администратором.'}
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{
            padding: '8px 24px',
            fontSize: '14px',
            cursor: 'pointer',
            border: '1px solid #d4380d',
            color: '#d4380d',
            backgroundColor: 'transparent',
            borderRadius: '4px',
          }}
        >
          Очистить и перезагрузить
        </button>
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
                <Route path="/" element={<ProjectsPortfolioPage />}>
                  <Route index element={<ITProjectsPage />} />
                  <Route path="home" element={<ConsultingHomePage />} />
                  <Route path="services" element={<ServicesPage />} />
                  <Route path="cases" element={<CasesPage />} />
                  <Route path="projects" element={<ITProjectsPage />} />
                  <Route path="about" element={<BrandStoryPage />} />
                  <Route path="offer" element={<CommercialOfferPage />} />
                </Route>
                <Route
                  path="projects-portfolio"
                  element={<Navigate to="/" replace />}
                />
                <Route
                  path="projects-portfolio/services"
                  element={<Navigate to="/services" replace />}
                />
                <Route
                  path="projects-portfolio/cases"
                  element={<Navigate to="/cases" replace />}
                />
                <Route
                  path="projects-portfolio/projects"
                  element={<Navigate to="/projects" replace />}
                />
                <Route
                  path="projects-portfolio/about"
                  element={<Navigate to="/about" replace />}
                />
                <Route
                  path="projects-portfolio/offer"
                  element={<Navigate to="/offer" replace />}
                />
                <Route path="registry" element={<Navigate to="/cms/registry" replace />} />
                <Route path="portfolio" element={<Navigate to="/cms/portfolio" replace />} />
                <Route
                  path="collateral-dossier"
                  element={<Navigate to="/cms/collateral-dossier" replace />}
                />
                <Route
                  path="collateral-conclusions"
                  element={<Navigate to="/cms/collateral-conclusions" replace />}
                />
                <Route path="tasks" element={<Navigate to="/cms/tasks" replace />} />
                <Route path="kpi" element={<Navigate to="/cms/kpi" replace />} />
                <Route path="reports" element={<Navigate to="/cms/reports" replace />} />
                <Route path="insurance" element={<Navigate to="/cms/insurance" replace />} />
                <Route path="fnp" element={<Navigate to="/cms/fnp" replace />} />
                <Route path="analytics" element={<Navigate to="/cms/analytics" replace />} />
                <Route
                  path="credit-risk"
                  element={<Navigate to="/cms/credit-risk" replace />}
                />
                <Route path="appraisal" element={<Navigate to="/cms/appraisal" replace />} />
                <Route
                  path="cms-check"
                  element={<Navigate to="/cms/cms-check" replace />}
                />
                <Route
                  path="cms-check/inspections"
                  element={<Navigate to="/cms/cms-check/inspections" replace />}
                />
                <Route
                  path="inspection/:token"
                  element={
                    <LegacyParamRedirect
                      buildTo={(params) => `/cms/inspection/${params.token ?? ''}`}
                    />
                  }
                />
                <Route path="egrn" element={<Navigate to="/cms/egrn" replace />} />
                <Route path="upload" element={<Navigate to="/cms/upload" replace />} />
                <Route
                  path="monitoring"
                  element={<Navigate to="/cms/monitoring" replace />}
                />
                <Route
                  path="reference"
                  element={<Navigate to="/cms/reference" replace />}
                />
                <Route path="workflow" element={<Navigate to="/cms/workflow" replace />} />
                <Route
                  path="workflow/object/:id"
                  element={
                    <LegacyParamRedirect
                      buildTo={(params) => `/cms/workflow/object/${params.id ?? ''}`}
                    />
                  }
                />
                <Route
                  path="workflow/settings"
                  element={<Navigate to="/cms/settings/workflow" replace />}
                />
                <Route path="settings" element={<Navigate to="/cms/settings" replace />} />
                <Route
                  path="settings/workflow"
                  element={<Navigate to="/cms/settings/workflow" replace />}
                />
                <Route
                  path="settings/employees"
                  element={<Navigate to="/cms/settings/employees" replace />}
                />
                <Route
                  path="settings/reference-data"
                  element={<Navigate to="/cms/settings/reference-data" replace />}
                />
                <Route
                  path="settings/norm-hours"
                  element={<Navigate to="/cms/settings/norm-hours" replace />}
                />
                <Route
                  path="settings/metrics"
                  element={<Navigate to="/cms/settings/metrics" replace />}
                />
                <Route
                  path="settings/appraisal-companies"
                  element={<Navigate to="/cms/settings/appraisal-companies" replace />}
                />
                <Route path="cms" element={<MainLayout />}>
                  <Route index element={<Navigate to="registry" replace />} />
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
                  <Route path="cms-check/*" element={<CMSCheckPage />} />
                  <Route path="inspection/:token" element={<MobileInspectionPage />} />
                  <Route path="egrn" element={<EGRNPage />} />
                  <Route path="upload" element={<UploadPage />} />
                  <Route path="monitoring" element={<MonitoringPage />} />
                  <Route path="reference" element={<ReferencePage />} />
                  <Route path="workflow" element={<WorkflowPage />} />
                  <Route path="workflow/object/:id" element={<WorkflowCasePage />} />
                  <Route
                    path="workflow/settings"
                    element={<Navigate to="/cms/settings/workflow" replace />}
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
