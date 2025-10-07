import React from 'react';
import { Layout, Input, Space, Button, Avatar, Dropdown, Select } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  BulbOutlined,
  BulbFilled,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar, setTheme } from '@/store/slices/appSlice';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, theme } = useAppSelector(state => state.app);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleThemeChange = (value: 'light' | 'dark' | 'compact') => {
    dispatch(setTheme(value));
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <BulbFilled style={{ color: '#fff' }} />;
      case 'compact':
        return <ThunderboltOutlined style={{ color: '#1890ff' }} />;
      default:
        return <BulbOutlined />;
    }
  };

  // Меню пользователя
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Профиль',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выход',
      danger: true,
    },
  ];

  return (
    <AntHeader
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginLeft: sidebarCollapsed ? '80px' : '250px',
        transition: 'margin-left 0.2s',
      }}
    >
      <Space size="middle">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggleSidebar}
          style={{ fontSize: '16px', width: 40, height: 40 }}
        />
        <Input
          placeholder="Поиск по реестру..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          allowClear
        />
      </Space>

      <Space size="middle">
        <Space>
          {getThemeIcon()}
          <Select
            value={theme}
            onChange={handleThemeChange}
            style={{ width: 150 }}
            options={[
              { value: 'light', label: 'Светлая' },
              { value: 'dark', label: 'Темная' },
              { value: 'compact', label: 'Компактная' },
            ]}
          />
        </Space>
        
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Avatar
            icon={<UserOutlined />}
            style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
          />
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;

