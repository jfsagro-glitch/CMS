import React from 'react';
import { Layout, Input, Space, Button, Avatar, Dropdown, Select, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  DatabaseOutlined,
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/appSlice';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const getSearchPlaceholder = (attribute: string): string => {
  switch (attribute) {
    case 'owner': return 'залогодателю (название, ИНН)';
    case 'identifier': return 'идентификатору (кадастровый номер, VIN, серийный номер, ID)';
    case 'name': return 'наименованию';
    case 'type': return 'типу объекта';
    case 'kind': return 'виду объекта';
    default: return 'наименованию';
  }
};

interface HeaderProps {
  onCreateCard?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onSearch?: (value: string) => void;
  onSearchAttributeChange?: (attribute: string) => void;
  searchText?: string;
  searchAttribute?: string;
}

const Header: React.FC<HeaderProps> = ({
  onCreateCard,
  onExport,
  onImport,
  onSearch,
  onSearchAttributeChange,
  searchText = '',
  searchAttribute = 'name'
}) => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector(state => state.app);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
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
        position: 'fixed',
        top: 0,
        left: sidebarCollapsed ? '80px' : '250px',
        right: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'left 0.2s',
      }}
    >
      <Space size="middle">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggleSidebar}
          style={{ fontSize: '16px', width: 40, height: 40 }}
        />
        
        <Space size="small">
          <DatabaseOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Text strong style={{ fontSize: 18 }}>CMS</Text>
        </Space>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreateCard}
        >
          Создать карточку
        </Button>
        
        <Button
          icon={<ExportOutlined />}
          onClick={onExport}
        >
          Экспорт в Excel
        </Button>
        
        <Button
          icon={<ImportOutlined />}
          onClick={onImport}
        >
          Импорт
        </Button>
      </Space>

      <Space size="middle">
        <Select
          value={searchAttribute}
          onChange={onSearchAttributeChange}
          style={{ width: 150 }}
          options={[
            { value: 'owner', label: 'Залогодатель' },
            { value: 'identifier', label: 'Идентификатор' },
            { value: 'name', label: 'Наименование' },
            { value: 'type', label: 'Тип' },
            { value: 'kind', label: 'Вид' },
          ]}
        />
        
        <Input
          placeholder={`Поиск по ${getSearchPlaceholder(searchAttribute)}...`}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => onSearch?.(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        
        
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

