import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import Header from './Header';
import { useAppSelector } from '@/store/hooks';

const { Content } = Layout;

const MainLayout: React.FC = () => {
  const sidebarCollapsed = useAppSelector(state => state.app.sidebarCollapsed);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SidebarMenu collapsed={sidebarCollapsed} />
      <Layout>
        <Header />
        <Content
          style={{
            margin: '16px',
            padding: '24px',
            minHeight: 280,
            background: '#fff',
            borderRadius: '8px'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

