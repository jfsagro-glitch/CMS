import React from 'react';
import { Layout, Menu, Space, Select } from 'antd';
import {
  DatabaseOutlined,
  BarChartOutlined,
  MobileOutlined,
  ThunderboltOutlined,
  CloudUploadOutlined,
  MonitorOutlined,
  SettingOutlined,
  LinkOutlined,
  SafetyOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import type { MenuItem } from '@/types';

const { Sider } = Layout;

interface SidebarMenuProps {
  collapsed: boolean;
  totalCards?: number;
  approvedCards?: number;
  editingCards?: number;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme, setTheme } = useTheme();

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
      icon: <LinkOutlined />,
      path: 'https://jfsagro-glitch.github.io/zadachnik/',
      external: true,
    },
    {
      key: 'reports',
      label: 'Отчеты',
      icon: <BarChartOutlined />,
      path: '/reports',
    },
    {
      key: 'insurance',
      label: 'Страхование',
      icon: <SafetyOutlined />,
      path: '/insurance',
    },
    {
      key: 'analytics',
      label: 'Аналитика',
      icon: <LineChartOutlined />,
      path: '/analytics',
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

  // Обработчик клика по пункту меню
  const handleMenuClick = (key: string) => {
    const item = menuItems.find(i => i.key === key);
    if (!item) return;

    if (item.external && item.path) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // Преобразуем MenuItem[] в формат, нужный для Ant Design Menu
  const antdMenuItems = menuItems.map(item => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
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
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? '16px' : '20px',
          fontWeight: 'bold',
          transition: 'all 0.2s',
          gap: '8px',
        }}
      >
        <DatabaseOutlined style={{ fontSize: collapsed ? '20px' : '28px' }} />
        {!collapsed && <span>CMS</span>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={antdMenuItems}
        onClick={({ key }) => handleMenuClick(key)}
        style={{ 
          flex: 1,
          borderRight: 0
        }}
      />
      
      {!collapsed && (
        <div style={{ 
          padding: '16px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
              Настройки
            </div>
            
            <div style={{ color: '#fff', fontSize: '12px' }}>
              Тема:
              <Select
                value={currentTheme}
                onChange={setTheme}
                size="small"
                style={{ width: '100%', marginTop: '4px' }}
                options={[
                  { value: 'light', label: 'Светлая' },
                  { value: 'dark', label: 'Темная' },
                  { value: 'dark-gray', label: 'Темно-серая' },
                  { value: 'windows-xp', label: 'Windows XP' },
                ]}
              />
            </div>
          </Space>
        </div>
      )}
    </Sider>
  );
};

export default SidebarMenu;

