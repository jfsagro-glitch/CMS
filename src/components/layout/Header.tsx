import React, { useEffect, useState } from 'react';
import {
  Layout,
  Input,
  Space,
  Button,
  Avatar,
  Dropdown,
  Select,
  Typography,
  Tooltip,
  Badge,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
  UpOutlined,
  DownOutlined,
  BellOutlined,
  ClockCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/appSlice';
import type { MenuProps } from 'antd';
import extendedStorageService from '@/services/ExtendedStorageService';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const getSearchPlaceholder = (attribute: string): string => {
  switch (attribute) {
    case 'owner':
      return 'залогодателю (название, ИНН)';
    case 'identifier':
      return 'идентификатору (кадастровый номер, VIN, серийный номер, ID)';
    case 'name':
      return 'наименованию';
    case 'type':
      return 'типу объекта';
    case 'kind':
      return 'виду объекта';
    default:
      return 'наименованию';
  }
};

interface HeaderProps {
  onCreateCard?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onSearch?: (value: string) => void;
  onSearchAttributeChange?: (attribute: string) => void;
  onToggleHeader?: () => void;
  searchText?: string;
  searchAttribute?: string;
  headerVisible?: boolean;
  contextTitle?: string;
  isRegistry?: boolean;
  isMobile?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onCreateCard,
  onExport,
  onImport,
  onSearch,
  onSearchAttributeChange,
  onToggleHeader,
  searchText = '',
  searchAttribute = 'name',
  headerVisible = true,
  contextTitle,
  isRegistry = false,
  isMobile = false,
}) => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector(state => state.app);
  const [tasksSummary, setTasksSummary] = useState<{
    total: number;
    overdue: number;
    nearestDeadline?: string;
    newCount: number;
    completed: number;
  }>({
    total: 0,
    overdue: 0,
    nearestDeadline: undefined,
    newCount: 0,
    completed: 0,
  });

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const all = await extendedStorageService.getTasks();
        const now = Date.now();
        const active = all.filter(t => t.status !== 'completed');
        const overdue = active.filter(t => new Date(t.dueDate).getTime() < now);
        const upcoming = active
          .filter(t => new Date(t.dueDate).getTime() >= now)
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
        const newCount = active.filter(t => t.status === 'new').length;
        const completed = all.filter(t => t.status === 'completed').length;

        setTasksSummary({
          total: active.length,
          overdue: overdue.length,
          nearestDeadline: upcoming
            ? new Date(upcoming.dueDate).toLocaleDateString('ru-RU')
            : undefined,
          newCount,
          completed,
        });
      } catch (error) {
        console.warn('Не удалось загрузить задачи для хедера:', error);
      }
    };

    loadTasks();
  }, []);

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

        <Button
          type="text"
          icon={headerVisible ? <UpOutlined /> : <DownOutlined />}
          onClick={onToggleHeader}
          style={{ fontSize: '16px', width: 40, height: 40 }}
          title={headerVisible ? 'Скрыть шапку' : 'Показать шапку'}
        />

        {contextTitle && <span style={{ fontWeight: 600, fontSize: 16 }}>{contextTitle}</span>}

        {isRegistry && (
          <>
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreateCard}>
              Создать карточку
            </Button>

            <Button icon={<ExportOutlined />} onClick={onExport}>
              Экспорт в Excel
            </Button>

            <Button icon={<ImportOutlined />} onClick={onImport}>
              Импорт
            </Button>
          </>
        )}
      </Space>

      <Space size="middle">
        {isRegistry && (
          <>
            <Select
              value={searchAttribute}
              onChange={onSearchAttributeChange}
              style={{ width: isMobile ? 120 : 150 }}
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
              onChange={e => onSearch?.(e.target.value)}
              style={{ width: isMobile ? 180 : 280 }}
              allowClear
            />
          </>
        )}

        {!isRegistry && (
          <Space size="small" align="center">
            <Tooltip title={`Активные задачи: ${tasksSummary.total}`}>
              <Badge count={tasksSummary.total} size="small">
                <UnorderedListOutlined style={{ fontSize: 16 }} />
              </Badge>
            </Tooltip>
            <Tooltip title={`Просроченные задачи: ${tasksSummary.overdue}`}>
              <Badge
                count={tasksSummary.overdue}
                size="small"
                style={{ backgroundColor: tasksSummary.overdue > 0 ? '#ff4d4f' : undefined }}
              >
                <ClockCircleOutlined style={{ fontSize: 16, color: '#ff4d4f' }} />
              </Badge>
            </Tooltip>
            {tasksSummary.nearestDeadline && (
              <Tooltip title={`Ближайший дедлайн: ${tasksSummary.nearestDeadline}`}>
                <ClockCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
              </Tooltip>
            )}
          </Space>
        )}

        <Tooltip title={`Новые уведомления: ${tasksSummary.newCount}`}>
          <Badge count={tasksSummary.newCount} size="small">
            <BellOutlined style={{ fontSize: 18, color: '#52c41a' }} />
          </Badge>
        </Tooltip>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space>
            <Avatar
              icon={<UserOutlined />}
              style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
            />
            <Text>Администратор</Text>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
