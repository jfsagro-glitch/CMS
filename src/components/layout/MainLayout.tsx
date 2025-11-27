import React, { useState } from 'react';
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
  
  // Список страниц, где нужно скрывать Header
  const pagesWithoutHeader = [
    '/reference',
    '/monitoring',
    '/settings',
    '/upload',
    '/egrn',
    '/cms-check',
    '/appraisal',
    '/credit-risk',
    '/analytics',
    '/fnp',
    '/insurance',
    '/collateral-conclusions',
    '/collateral-dossier',
    '/reports',
    '/kpi',
    '/tasks',
    '/portfolio',
  ];
  
  // Проверяем, нужно ли скрывать Header для текущей страницы
  const currentPath = location.pathname || location.hash.replace('#', '');
  const shouldHideHeader = pagesWithoutHeader.some(page => 
    currentPath === page || currentPath === `#${page}` || location.hash === `#${page}`
  );
  
  const shouldShowHeader = headerVisible && !shouldHideHeader;

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

  return (
    <Layout className="main-layout">
      <SidebarMenu
        collapsed={sidebarCollapsed}
        onLoadDemoData={loadDemoData}
        onClearDemoData={clearDemoData}
        hasCards={cards.length > 0}
      />
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
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
          />
        )}
        <Content className="main-content" style={{ marginTop: shouldShowHeader ? 64 : 0 }}>
          {!shouldShowHeader && !shouldHideHeader && (
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
