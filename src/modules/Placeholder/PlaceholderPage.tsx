import React, { useEffect, useState } from 'react';
import { Result, Button, Card, Row, Col } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, DatabaseOutlined, FileTextOutlined } from '@ant-design/icons';
import referenceDataService from '@/services/ReferenceDataService';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [attributesDictId, setAttributesDictId] = useState<string | null>(null);
  const [zalogAttributesDictId, setZalogAttributesDictId] = useState<string | null>(null);

  // Если это страница настроек, показываем ссылки на подразделы
  const isSettingsPage = location.pathname === '/settings' || location.pathname === '#/settings' || location.hash === '#/settings';

  useEffect(() => {
    if (isSettingsPage) {
      try {
        const dictionaries = referenceDataService.getDictionaries();
        console.log('Загружено справочников:', dictionaries.length);
        const attributesDict = dictionaries.find(d => d.code === 'collateral_attributes');
        if (attributesDict) {
          setAttributesDictId(attributesDict.id);
          console.log('Найден справочник collateral_attributes:', attributesDict.id);
        }
        const zalogAttributesDict = dictionaries.find(d => d.code === 'collateral_attributes_zalog');
        if (zalogAttributesDict) {
          setZalogAttributesDictId(zalogAttributesDict.id);
          console.log('Найден справочник collateral_attributes_zalog:', zalogAttributesDict.id);
        } else {
          console.warn('Справочник collateral_attributes_zalog не найден! Доступные коды:', dictionaries.map(d => d.code));
        }
      } catch (error) {
        console.error('Ошибка загрузки справочников атрибутов:', error);
      }
    }
  }, [isSettingsPage]);

  if (isSettingsPage) {
    return (
      <div style={{ padding: '24px' }}>
        <h1 style={{ marginBottom: '24px' }}>Настройки</h1>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/settings/employees')}
            >
              <div style={{ textAlign: 'center' }}>
                <UserOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <h3>Управление сотрудниками</h3>
                <p style={{ color: '#8c8c8c' }}>Добавление и редактирование сотрудников, их ролей и прав доступа</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/settings/reference-data')}
            >
              <div style={{ textAlign: 'center' }}>
                <DatabaseOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                <h3>Справочники</h3>
                <p style={{ color: '#8c8c8c' }}>Управление всеми справочниками системы</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => {
                if (attributesDictId) {
                  navigate(`/settings/reference-data?dict=${attributesDictId}`);
                } else {
                  navigate('/settings/reference-data');
                }
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: '16px' }} />
                <h3>Атрибуты залогового имущества</h3>
                <p style={{ color: '#8c8c8c' }}>Справочник атрибутов для различных типов залогового имущества</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => {
                console.log('Клик по кнопке "Атрибуты залога", zalogAttributesDictId:', zalogAttributesDictId);
                if (zalogAttributesDictId) {
                  const url = `/settings/reference-data?dict=${zalogAttributesDictId}`;
                  console.log('Переход на:', url);
                  navigate(url);
                } else {
                  console.warn('zalogAttributesDictId не установлен, переход на общую страницу справочников');
                  navigate('/settings/reference-data');
                }
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '16px' }} />
                <h3>Атрибуты залога</h3>
                <p style={{ color: '#8c8c8c' }}>Справочник атрибутов залога из файла atr1.xlsx</p>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <Result
      status="info"
      title={title}
      subTitle={subtitle || 'Этот раздел находится в разработке'}
      extra={
        <Button onClick={() => navigate('/registry')}>
          Вернуться к реестру
        </Button>
      }
    />
  );
};

export default PlaceholderPage;

