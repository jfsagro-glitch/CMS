import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import Header from './Header';
import { useAppSelector } from '@/store/hooks';
import { useDemoData } from '@/hooks/useDemoData';
import type { RootState } from '@/store';

const { Content } = Layout;

const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

const SECTION_TITLES: Record<string, string> = {
  registry: 'Реестр объектов',
  portfolio: 'Залоговый портфель',
  tasks: 'Задачи',
  kpi: 'KPI и аналитика',
  reports: 'Отчеты',
  'collateral-dossier': 'Залоговое досье',
  'collateral-conclusions': 'Залоговые заключения',
  insurance: 'Страхование',
  fnp: 'ФНП',
  analytics: 'Аналитика',
  'credit-risk': 'Модуль мониторинга',
  appraisal: 'Модуль оценки',
  'cms-check': 'CMS Check',
  egrn: 'ЕГРН',
  upload: 'Загрузка и миграция',
  monitoring: 'Мониторинг',
  reference: 'Справочная с ИИ',
  workflow: 'Внесудебная реализация (Workflow)',
  settings: 'Настройки',
};

const PROJECTS_PORTFOLIO_SECTIONS = new Set([
  'projects-portfolio',
  'projects',
  'services',
  'cases',
  'about',
  'offer',
  'home',
]);

const MainLayout: React.FC = () => {
  const location = useLocation();
  const sidebarCollapsed = useAppSelector((state: RootState) => state.app.sidebarCollapsed);
  const cards = useAppSelector((state: RootState) => state.extendedCards?.filteredItems || []);
  const { loadDemoData, clearDemoData } = useDemoData();
  const [searchText, setSearchText] = useState('');
  const [searchAttribute, setSearchAttribute] = useState('name');
  const [headerVisible, setHeaderVisible] = useState(true);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MEDIA_QUERY).matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    let frameId: number | null = null;

    const syncMobileState = (matches: boolean) => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        setIsMobile(prev => (prev === matches ? prev : matches));
        frameId = null;
      });
    };

    const handleMediaChange = (event: MediaQueryListEvent) => {
      syncMobileState(event.matches);
    };

    syncMobileState(mediaQuery.matches);

    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (callback: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (callback: (event: MediaQueryListEvent) => void) => void;
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      legacyMediaQuery.addListener?.(handleMediaChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        legacyMediaQuery.removeListener?.(handleMediaChange);
      }

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const { isCmsRoute, mainSection } = useMemo(() => {
    const currentPath = location.pathname || location.hash.replace('#', '');
    const pathParts = currentPath.split('/').filter(Boolean);
    const cmsRoute = pathParts[0] === 'cms';

    return {
      isCmsRoute: cmsRoute,
      mainSection: (cmsRoute ? pathParts[1] : pathParts[0]) || 'registry',
    };
  }, [location.hash, location.pathname]);

  const contextTitle = SECTION_TITLES[mainSection] || 'Система управления залоговым имуществом';

  const handleCreateCard = () => {
    // Логика создания карточки будет передана через контекст
  };

  const handleExport = () => {
    // Логика экспорта будет передана через контекст
  };

  const handleImport = () => {
    // Логика импорта будет передана через контекст
  };

  const handleToggleHeader = () => {
    setHeaderVisible(prev => !prev);
  };

  const isRegistrySection = mainSection === 'registry';
  const isProjectsPortfolio = !isCmsRoute && PROJECTS_PORTFOLIO_SECTIONS.has(mainSection);
  const shouldShowHeader = headerVisible && !isProjectsPortfolio;
  const shouldShowSidebar = !isProjectsPortfolio;
  const contentMarginLeft = isProjectsPortfolio || isMobile ? 0 : sidebarCollapsed ? 80 : 250;
  const hiddenHeaderButtonLeft = isMobile ? 12 : sidebarCollapsed ? 96 : 266;
  const hiddenHeaderButtonTop = isMobile ? 'calc(env(safe-area-inset-top, 0px) + 12px)' : 16;
  const layoutStyle = useMemo(
    () => ({ marginLeft: contentMarginLeft, transition: 'margin-left 0.2s' }),
    [contentMarginLeft]
  );
  const showHeaderButtonStyle = useMemo(
    () => ({ left: hiddenHeaderButtonLeft, top: hiddenHeaderButtonTop }),
    [hiddenHeaderButtonLeft, hiddenHeaderButtonTop]
  );

  return (
    <Layout className="main-layout">
      {shouldShowSidebar && (
        <SidebarMenu
          collapsed={sidebarCollapsed}
          isMobile={isMobile}
          onLoadDemoData={loadDemoData}
          onClearDemoData={clearDemoData}
          hasCards={cards.length > 0}
        />
      )}
      <Layout style={layoutStyle}>
        {shouldShowHeader && (
          <Header
            onCreateCard={handleCreateCard}
            onExport={handleExport}
            onImport={handleImport}
            onSearch={setSearchText}
            onSearchAttributeChange={setSearchAttribute}
            onToggleHeader={handleToggleHeader}
            searchText={searchText}
            searchAttribute={searchAttribute}
            headerVisible={headerVisible}
            contextTitle={contextTitle}
            isRegistry={isRegistrySection}
            isMobile={isMobile}
          />
        )}
        <Content className="main-content" style={{ marginTop: shouldShowHeader ? 64 : 0 }}>
          {!shouldShowHeader && !isProjectsPortfolio && (
            <div
              className="main-layout__show-header-button-wrapper"
              style={showHeaderButtonStyle}
            >
              <Button
                type="primary"
                icon={<DownOutlined />}
                onClick={handleToggleHeader}
                className="main-layout__show-header-button"
                title="Показать шапку"
              />
            </div>
          )}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
