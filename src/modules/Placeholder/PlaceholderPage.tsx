import React from 'react';
import { Result, Button, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Если это страница настроек, показываем ссылку на сотрудников
  const isSettingsPage = location.pathname === '/settings' || location.pathname === '#/settings';

  return (
    <Result
      status="info"
      title={title}
      subTitle={subtitle || 'Этот раздел находится в разработке'}
      extra={
        <Space>
          {isSettingsPage && (
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => navigate('/settings/employees')}
            >
              Управление сотрудниками
            </Button>
          )}
          <Button onClick={() => navigate('/registry')}>
            Вернуться к реестру
          </Button>
        </Space>
      }
    />
  );
};

export default PlaceholderPage;

