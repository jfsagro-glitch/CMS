import React from 'react';
import { Card, Button, Space, Divider, Switch, Select, Tooltip } from 'antd';
import { CloseOutlined, SettingOutlined, ThemeOutlined, TableOutlined, BellOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';

interface RightToolbarProps {
  onCollapse: () => void;
  totalCards: number;
  approvedCards: number;
  editingCards: number;
}

export const RightToolbar: React.FC<RightToolbarProps> = ({
  onCollapse,
  totalCards,
  approvedCards,
  editingCards,
}) => {
  const { currentTheme, setTheme } = useTheme();

  return (
    <div className="right-toolbar-content">
      <div className="toolbar-header">
        <Space>
          <SettingOutlined />
          <span>Настройки</span>
        </Space>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onCollapse}
          size="small"
        />
      </div>
      
      <Divider />
      
      <div className="toolbar-sections">
        <Card size="small" title="Тема оформления" className="toolbar-section">
          <Select
            value={currentTheme}
            onChange={setTheme}
            style={{ width: '100%' }}
            options={[
              { value: 'light', label: '🟦 Светлая' },
              { value: 'dark', label: '🌙 Темная' },
              { value: 'dark-gray', label: '⚫ Темно-серая' },
              { value: 'windows-xp', label: '🪟 Windows XP' },
            ]}
          />
        </Card>

        <Card size="small" title="Статистика" className="toolbar-section">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              Всего карточек: <strong>{totalCards}</strong>
            </div>
            <div>
              Утверждено: <strong style={{ color: 'var(--ant-color-success)' }}>{approvedCards}</strong>
            </div>
            <div>
              На редактировании: <strong style={{ color: 'var(--ant-color-warning)' }}>{editingCards}</strong>
            </div>
          </Space>
        </Card>

        <Card size="small" title="Отображение таблицы" className="toolbar-section">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Switch size="small" defaultChecked />
              <span style={{ marginLeft: 8 }}>Компактный режим</span>
            </div>
            <div>
              <Switch size="small" defaultChecked />
              <span style={{ marginLeft: 8 }}>Показывать номера строк</span>
            </div>
            <div>
              <Switch size="small" />
              <span style={{ marginLeft: 8 }}>Автосохранение</span>
            </div>
          </Space>
        </Card>

        <Card size="small" title="Уведомления" className="toolbar-section">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Switch size="small" defaultChecked />
              <span style={{ marginLeft: 8 }}>Звуковые уведомления</span>
            </div>
            <div>
              <Switch size="small" defaultChecked />
              <span style={{ marginLeft: 8 }}>Уведомления о сохранении</span>
            </div>
          </Space>
        </Card>

        <Card size="small" title="Быстрые действия" className="toolbar-section">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button size="small" block icon={<TableOutlined />}>
              Экспорт в Excel
            </Button>
            <Button size="small" block icon={<BellOutlined />}>
              Отправить отчет
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default RightToolbar;
