import React from 'react';
import { Layout, Menu, Space, Select, Button, Tooltip } from 'antd';
import {
  DatabaseOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  MonitorOutlined,
  SettingOutlined,
  LinkOutlined,
  SafetyOutlined,
  LineChartOutlined,
  WalletOutlined,
  DeleteOutlined,
  AlertOutlined,
  FolderOpenOutlined,
  CameraOutlined,
  FileTextOutlined,
  BankOutlined,
  DollarOutlined,
  DashboardOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import type { MenuItem } from '@/types';
import './SidebarMenu.css';

const { Sider } = Layout;

interface SidebarMenuProps {
  collapsed: boolean;
  totalCards?: number;
  approvedCards?: number;
  editingCards?: number;
  onLoadDemoData?: () => void;
  onClearDemoData?: () => void;
  hasCards?: boolean;
  isMobile?: boolean;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({
  collapsed,
  onLoadDemoData,
  onClearDemoData,
  hasCards = false,
  isMobile = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme, setTheme } = useTheme();
  const basePath = '/cms';

  // Определяем структуру меню
  const menuItems: MenuItem[] = [
    {
      key: 'registry',
      label: 'Реестр объектов',
      icon: <DatabaseOutlined />,
      path: `${basePath}/registry`,
    },
    {
      key: 'portfolio',
      label: 'Залоговый портфель',
      icon: <WalletOutlined />,
      path: `${basePath}/portfolio`,
    },
    {
      key: 'tasks',
      label: 'Задачи',
      icon: <LinkOutlined />,
      path: `${basePath}/tasks`,
    },
    {
      key: 'kpi',
      label: 'KPI',
      icon: <DashboardOutlined />,
      path: `${basePath}/kpi`,
      tooltip: 'KPI и аналитика',
    },
    {
      key: 'reports',
      label: 'Отчеты',
      icon: <BarChartOutlined />,
      path: `${basePath}/reports`,
      tooltip: 'Агрегирование отчетности',
    },
    {
      key: 'collateral-dossier',
      label: 'Залоговое досье',
      icon: <FolderOpenOutlined />,
      path: `${basePath}/collateral-dossier`,
    },
    {
      key: 'collateral-conclusions',
      label: 'Залоговые заключения',
      icon: <FileTextOutlined />,
      path: `${basePath}/collateral-conclusions`,
    },
    {
      key: 'insurance',
      label: 'Страхование',
      icon: <SafetyOutlined />,
      path: `${basePath}/insurance`,
    },
    {
      key: 'fnp',
      label: 'ФНП',
      icon: <BankOutlined />,
      path: `${basePath}/fnp`,
      tooltip: 'Регистрация залога движимого имущества ФНП',
    },
    {
      key: 'analytics',
      label: 'Аналитика',
      icon: <LineChartOutlined />,
      path: `${basePath}/analytics`,
    },
    {
      key: 'credit-risk',
      label: 'Модуль мониторинга',
      icon: <AlertOutlined />,
      path: `${basePath}/credit-risk`,
      tooltip: 'Модуль мониторинга',
    },
    {
      key: 'appraisal',
      label: 'Модуль оценки',
      icon: <DollarOutlined />,
      path: `${basePath}/appraisal`,
      tooltip: 'Автоматическая оценка объектов залога',
    },
    {
      key: 'cms-check',
      label: 'CMS Check',
      icon: <CameraOutlined />,
      path: `${basePath}/cms-check`,
      tooltip: 'Система дистанционных осмотров',
    },
    {
      key: 'egrn',
      label: 'ЕГРН',
      icon: <FileTextOutlined />,
      path: `${basePath}/egrn`,
      tooltip: 'Регистрация ипотеки, снятие обременений, выписки ЕГРН',
    },
    {
      key: 'upload',
      label: 'Загрузка',
      icon: <CloudUploadOutlined />,
      path: `${basePath}/upload`,
    },
    {
      key: 'monitoring',
      label: 'Мониторинг',
      icon: <MonitorOutlined />,
      path: `${basePath}/monitoring`,
    },
    {
      key: 'reference',
      label: 'Справочная с ИИ',
      icon: <RobotOutlined />,
      path: `${basePath}/reference`,
      tooltip: 'Консультации по нормативным документам, оценке и рабочим вопросам',
    },
    {
      key: 'workflow',
      label: 'Внесудебная реализация',
      icon: <FileTextOutlined />,
      path: `${basePath}/workflow`,
      tooltip: 'Workflow внесудебной реализации залога',
    },
    {
      key: 'settings',
      label: 'Настройки',
      icon: <SettingOutlined />,
      path: `${basePath}/settings`,
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
    label: item.tooltip ? (
      <Tooltip title={item.tooltip} placement="right">
        <span>{item.label}</span>
      </Tooltip>
    ) : (
      item.label
    ),
  }));

  // Определяем активный пункт меню на основе текущего пути
  const getSelectedKey = (): string => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) return 'registry'; // По умолчанию
    const baseIndex = pathParts[0] === 'cms' ? 1 : 0;
    return pathParts[baseIndex] || 'registry';
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
        zIndex: 1000,
        transform: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.2s',
      }}
    >
      <div
        className="sidebar-logo"
        onClick={() => navigate('/cms')}
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
          padding: collapsed ? '8px' : '12px',
          cursor: 'pointer',
        }}
      >
        <img
          src="/logo.png"
          alt="CMS Logo"
          style={{
            height: collapsed ? '32px' : '40px',
            width: 'auto',
            objectFit: 'contain',
            transition: 'all 0.2s',
          }}
        />
        {!collapsed && <span style={{ marginLeft: '8px' }}>CMS</span>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={antdMenuItems}
        onClick={({ key }) => handleMenuClick(key)}
        style={{
          flex: 1,
          borderRight: 0,
        }}
      />

      {!collapsed && (
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>Настройки</div>

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
                  { value: 'ios', label: 'iOS' },
                  { value: 'windows-xp', label: 'Windows XP' },
                  { value: 'windows-97', label: 'Windows 97' },
                  { value: 'matrix', label: 'Матрица' },
                ]}
              />
            </div>

            {onLoadDemoData && (
              <div style={{ marginTop: '8px' }}>
                <Tooltip
                  title={hasCards ? 'Перезагрузить демо-данные (44)' : 'Загрузить демо-данные (44)'}
                >
                  <Button
                    icon={<DatabaseOutlined />}
                    onClick={onLoadDemoData}
                    type={hasCards ? 'dashed' : 'primary'}
                    danger={hasCards}
                    size="small"
                    style={{ width: '100%' }}
                  />
                </Tooltip>
              </div>
            )}

            {onClearDemoData && hasCards && (
              <div style={{ marginTop: '8px' }}>
                <Tooltip title="Удалить все демо-данные">
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={onClearDemoData}
                    type="dashed"
                    danger
                    size="small"
                    style={{ width: '100%' }}
                  />
                </Tooltip>
              </div>
            )}

            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ color: '#fff', fontSize: '12px', marginBottom: '8px', opacity: 0.7 }}>
                Техническая поддержка:
              </div>
              <a
                href="mailto:cmsauto@bk.ru"
                style={{
                  color: '#1890ff',
                  fontSize: '12px',
                  textDecoration: 'none',
                  display: 'block',
                  wordBreak: 'break-all',
                }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                cmsauto@bk.ru
              </a>
            </div>
          </Space>
        </div>
      )}
    </Sider>
  );
};

export default SidebarMenu;
