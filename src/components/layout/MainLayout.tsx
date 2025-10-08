import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import Header from './Header';
import { useAppSelector } from '@/store/hooks';

const { Content } = Layout;

const MainLayout: React.FC = () => {
  const sidebarCollapsed = useAppSelector((state: any) => state.app.sidebarCollapsed);
  const cards = useAppSelector((state: any) => state.extendedCards?.filteredItems || []);
  const [searchText, setSearchText] = useState('');
  const [searchAttribute, setSearchAttribute] = useState('name');

  const totalCards = cards.length;
  const approvedCards = cards.filter((c: any) => c.status === 'approved').length;
  const editingCards = cards.filter((c: any) => c.status === 'editing').length;

  const handleCreateCard = () => {
    // Логика создания карточки будет передана через контекст
  };

  const handleExport = () => {
    // Логика экспорта будет передана через контекст
  };

  const handleImport = () => {
    // Логика импорта будет передана через контекст
  };

  return (
    <Layout className="main-layout">
      <SidebarMenu 
        collapsed={sidebarCollapsed} 
        totalCards={totalCards}
        approvedCards={approvedCards}
        editingCards={editingCards}
      />
      <Layout style={{ marginLeft: 0 }}>
        <Header 
          onCreateCard={handleCreateCard}
          onExport={handleExport}
          onImport={handleImport}
          onSearch={setSearchText}
          onSearchAttributeChange={setSearchAttribute}
          searchText={searchText}
          searchAttribute={searchAttribute}
        />
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

