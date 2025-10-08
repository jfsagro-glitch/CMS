import React, { useState } from 'react';
import { Layout, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { Outlet } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import Header from './Header';
import { useAppSelector } from '@/store/hooks';
import { useDemoData } from '@/contexts/DemoDataContext';

const { Content } = Layout;

const MainLayout: React.FC = () => {
  const sidebarCollapsed = useAppSelector((state: any) => state.app.sidebarCollapsed);
  const cards = useAppSelector((state: any) => state.extendedCards?.filteredItems || []);
  const { loadDemoData } = useDemoData();
  const [searchText, setSearchText] = useState('');
  const [searchAttribute, setSearchAttribute] = useState('name');
  const [headerVisible, setHeaderVisible] = useState(true);

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
        hasCards={cards.length > 0}
      />
      <Layout>
        {headerVisible && (
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
        <Content className="main-content" style={{ marginTop: headerVisible ? 64 : 0 }}>
          {!headerVisible && (
            <div style={{ 
              position: 'fixed', 
              top: 16, 
              left: sidebarCollapsed ? 96 : 266, 
              zIndex: 1001,
              transition: 'left 0.2s'
            }}>
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
                  justifyContent: 'center'
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

