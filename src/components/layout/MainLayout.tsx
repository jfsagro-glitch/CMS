import React, { useEffect, useState } from 'react';
import { Layout, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import Header from './Header';
import { useAppSelector } from '@/store/hooks';
import { useDemoData } from '@/hooks/useDemoData';

const { Content } = Layout;

const MainLayout: React.FC = () => {
  const location = useLocation();
  const sidebarCollapsed = useAppSelector((state: any) => state.app.sidebarCollapsed);
  const cards = useAppSelector((state: any) => state.extendedCards?.filteredItems || []);
  const { loadDemoData, clearDemoData } = useDemoData();
  const [searchText, setSearchText] = useState('');
  const [searchAttribute, setSearchAttribute] = useState('name');
  const [headerVisible, setHeaderVisible] = useState(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentPath = location.pathname || location.hash.replace('#', '');
  const pathParts = currentPath.split('/').filter(Boolean);
  const mainSection = pathParts[0] || 'registry';

  const getHeaderContextTitle = () => {
    switch (mainSection) {
      case 'registry':
        return 'Реестр объектов';
      case 'portfolio':
        return 'Залоговый портфель';
      case 'tasks':
        return 'Задачи';
      case 'kpi':
        return 'KPI и аналитика';
      case 'reports':
        return 'Отчеты';
      case 'collateral-dossier':
        return 'Залоговое досье';
      case 'collateral-conclusions':
        return 'Залоговые заключения';
      case 'insurance':
        return 'Страхование';
      case 'fnp':
        return 'ФНП';
      case 'analytics':
        return 'Аналитика';
      case 'credit-risk':
        return 'Модуль мониторинга';
      case 'appraisal':
        return 'Модуль оценки';
      case 'cms-check':
        return 'CMS Check';
      case 'egrn':
        return 'ЕГРН';
      case 'upload':
        return 'Загрузка и миграция';
      case 'monitoring':
        return 'Мониторинг';
      case 'reference':
        return 'Справочная с ИИ';
      case 'workflow':
        return 'Внесудебная реализация (Workflow)';
      case 'settings':
        return 'Настройки';
      default:
        return 'Система управления залоговым имуществом';
    }
  };

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
    setHeaderVisible(!headerVisible);
  };

  const isRegistrySection = mainSection === 'registry';
  const isProjectsPortfolio = mainSection === 'projects-portfolio';
  const shouldShowHeader = headerVisible && !isProjectsPortfolio;
  const shouldShowSidebar = !isProjectsPortfolio;
  const contentMarginLeft = isProjectsPortfolio ? 0 : isMobile ? 0 : sidebarCollapsed ? 80 : 250;

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
      <Layout style={{ marginLeft: contentMarginLeft, transition: 'margin-left 0.2s' }}>
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
            contextTitle={getHeaderContextTitle()}
            isRegistry={isRegistrySection}
            isMobile={isMobile}
          />
        )}
        <Content className="main-content" style={{ marginTop: shouldShowHeader ? 64 : 0 }}>
          {!shouldShowHeader && !isProjectsPortfolio && (
            <div
              style={{
                position: 'fixed',
                top: 16,
                left: sidebarCollapsed ? 96 : 266,
                zIndex: 1001,
                transition: 'left 0.2s',
              }}
            >
              <Button
                type="primary"
                icon={<DownOutlined />}
                onClick={handleToggleHeader}
                style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
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
