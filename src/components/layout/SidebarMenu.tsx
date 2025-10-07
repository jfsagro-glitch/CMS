import React from 'react';
import { Layout, Menu } from 'antd';
import Logo from '@/components/common/Logo';
import {
  DatabaseOutlined,
  CheckSquareOutlined,
  BarChartOutlined,
  MobileOutlined,
  ThunderboltOutlined,
  CloudUploadOutlined,
  MonitorOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuItem } from '@/types';

const { Sider } = Layout;

interface SidebarMenuProps {
  collapsed: boolean;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Определяем структуру меню
  const menuItems: MenuItem[] = [
    {
      key: 'registry',
      label: 'Реестры',
      icon: <DatabaseOutlined />,
      path: '/registry',
    },
    {
      key: 'tasks',
      label: 'Задачи',
      icon: <CheckSquareOutlined />,
      path: '/tasks',
    },
    {
      key: 'reports',
      label: 'Отчеты',
      icon: <BarChartOutlined />,
      path: '/reports',
    },
    {
      key: 'mobile-appraiser',
      label: 'Мобильный оценщик',
      icon: <MobileOutlined />,
      path: '/mobile-appraiser',
    },
    {
      key: 'smartdeal',
      label: 'SmartDeal',
      icon: <ThunderboltOutlined />,
      path: '/smartdeal',
    },
    {
      key: 'upload',
      label: 'Загрузка',
      icon: <CloudUploadOutlined />,
      path: '/upload',
    },
    {
      key: 'monitoring',
      label: 'Мониторинг',
      icon: <MonitorOutlined />,
      path: '/monitoring',
    },
    {
      key: 'settings',
      label: 'Настройки',
      icon: <SettingOutlined />,
      path: '/settings',
    },
  ];

  // Преобразуем MenuItem[] в формат, нужный для Ant Design Menu
  const antdMenuItems = menuItems.map(item => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    onClick: () => item.path && navigate(item.path),
  }));

  // Определяем активный пункт меню на основе текущего пути
  const getSelectedKey = (): string => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) return 'registry'; // По умолчанию
    return pathParts[0];
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={250}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? 0 : 24,
          transition: 'all 0.2s',
        }}
      >
        <Logo collapsed={collapsed} />
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={antdMenuItems}
      />
    </Sider>
  );
};

export default SidebarMenu;

