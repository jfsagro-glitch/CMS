import React, { useState } from 'react';
import { Layout, Button, Tooltip } from 'antd';
import { Outlet } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';
import SidebarMenu from './SidebarMenu';
import Header from './Header';
import RightToolbar from './RightToolbar';
import { useAppSelector } from '@/store/hooks';

const { Content, Sider } = Layout;

const MainLayout: React.FC = () => {
  const sidebarCollapsed = useAppSelector((state: any) => state.app.sidebarCollapsed);
  const [rightToolbarCollapsed, setRightToolbarCollapsed] = useState(false);
  const cards = useAppSelector((state: any) => state.cards.cards);

  const totalCards = cards.length;
  const approvedCards = cards.filter((c: any) => c.status === 'approved').length;
  const editingCards = cards.filter((c: any) => c.status === 'editing').length;

  return (
    <Layout className="main-layout">
      <SidebarMenu collapsed={sidebarCollapsed} />
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 250 }}>
        <Header />
        <Layout
          className="content-layout"
          style={{
            marginRight: rightToolbarCollapsed ? 0 : 300,
            transition: 'margin-right 0.2s'
          }}
        >
          <Content className="main-content">
            <Outlet />
          </Content>
        </Layout>
        <Sider
          className="right-toolbar"
          width={300}
          collapsedWidth={0}
          collapsed={rightToolbarCollapsed}
          trigger={null}
          style={{ 
            position: 'fixed', 
            right: 0, 
            top: 64, 
            bottom: 0, 
            overflow: 'auto', 
            zIndex: 999 
          }}
        >
          <RightToolbar
            onCollapse={() => setRightToolbarCollapsed(!rightToolbarCollapsed)}
            totalCards={totalCards}
            approvedCards={approvedCards}
            editingCards={editingCards}
          />
        </Sider>
        {rightToolbarCollapsed && (
          <Tooltip title="Показать настройки" placement="left">
            <Button
              className="toolbar-toggle-btn"
              icon={<SettingOutlined />}
              onClick={() => setRightToolbarCollapsed(false)}
              type="primary"
            />
          </Tooltip>
        )}
      </Layout>
    </Layout>
  );
};

export default MainLayout;

