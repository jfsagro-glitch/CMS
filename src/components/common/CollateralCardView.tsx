import React, { useMemo } from 'react';
import { Card, Descriptions, Tag, Row, Col, Divider, Typography, Space, Statistic } from 'antd';
import type { DescriptionsProps } from 'antd';
import {
  HomeOutlined,
  CarOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { ExtendedCollateralCard } from '../../types';
import { getGroupedCollateralAttributes, getAttributeValue } from '@/utils/collateralAttributesConfig';
import { getObjectTypeKey } from '@/utils/extendedClassification';
import './CollateralCardView.css';

const { Title, Text, Paragraph } = Typography;

interface CollateralCardViewProps {
  card: ExtendedCollateralCard;
}

export const CollateralCardView: React.FC<CollateralCardViewProps> = ({ card }) => {
  // Функции для определения цвета статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'editing':
        return 'orange';
      case 'approved':
        return 'green';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'editing':
        return 'Редактирование';
      case 'approved':
        return 'Согласовано';
      default:
        return status;
    }
  };

  const getCategoryIcon = () => {
    switch (card.mainCategory) {
      case 'real_estate':
        return <HomeOutlined />;
      case 'movable':
        return <CarOutlined />;
      case 'property_rights':
        return <DollarOutlined />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getCategoryName = () => {
    switch (card.mainCategory) {
      case 'real_estate':
        return 'Недвижимость';
      case 'movable':
        return 'Движимое имущество';
      case 'property_rights':
        return 'Имущественные права';
      default:
        return 'Неизвестно';
    }
  };

  // Форматирование стоимости
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Определяем тип объекта для получения правильных атрибутов
  const objectTypeKey = useMemo(() => {
    if (card.classification) {
      return getObjectTypeKey(card.classification.level1, card.classification.level2);
    }
    return null;
  }, [card.classification]);

  // Получаем сгруппированные атрибуты
  const groupedAttributes = useMemo(() => {
    return getGroupedCollateralAttributes(objectTypeKey || undefined);
  }, [objectTypeKey]);

  // Форматирование значения атрибута
  const formatAttributeValue = (attr: any, value: any): string => {
    if (value === null || value === undefined || value === '') return '—';
    
    if (attr.type === 'boolean') {
      return value ? 'Да' : 'Нет';
    }
    
    if (attr.type === 'number' && attr.unit) {
      return `${value} ${attr.unit}`;
    }
    
    if (attr.type === 'number') {
      return String(value);
    }
    
    return String(value);
  };

  // Рендер характеристик в зависимости от типа
  const renderCharacteristics = (): React.ReactNode => {
    if (!card.characteristics || Object.keys(card.characteristics).length === 0) {
      return <Text type="secondary">Характеристики не указаны</Text>;
    }

    const groups = Object.keys(groupedAttributes);
    
    if (groups.length === 0) {
      // Fallback: отображаем все характеристики без группировки
      const items: DescriptionsProps['items'] = [];
      Object.entries(card.characteristics).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          items.push({ 
            label: key, 
            children: typeof value === 'boolean' ? (value ? 'Да' : 'Нет') : String(value) 
          });
        }
      });
      return <Descriptions bordered column={2} size="small" items={items} />;
    }

    // Отображаем характеристики по группам
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {groups.map(group => {
          const attributes = groupedAttributes[group];
          const items: DescriptionsProps['items'] = [];
          
          attributes.forEach(attr => {
            const value = getAttributeValue(card.characteristics, attr.key);
            if (value !== null && value !== undefined && value !== '') {
              items.push({
                label: attr.label,
                children: formatAttributeValue(attr, value),
              });
            }
          });
          
          if (items.length === 0) return null;
          
          return (
            <div key={group}>
              <Divider orientation="left" style={{ margin: '8px 0' }}>{group}</Divider>
              <Descriptions bordered column={2} size="small" items={items} />
            </div>
          );
        })}
      </Space>
    );
  };

  return (
    <div className="collateral-card-view">
      {/* Заголовок карточки */}
      <Card className="card-header-section">
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space direction="vertical" size="small">
              <Space>
                {getCategoryIcon()}
                <Title level={3} style={{ margin: 0 }}>
                  {card.name}
                </Title>
              </Space>
              <Space>
                <Tag color="blue">{card.number}</Tag>
                <Tag color={getStatusColor(card.status)}>{getStatusText(card.status)}</Tag>
                <Tag>{getCategoryName()}</Tag>
              </Space>
              {(card.reference || card.contractNumber) && (
                <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
                  {card.reference && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      REFERENCE: {card.reference}
                    </Text>
                  )}
                  {card.contractNumber && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Договор залога: {card.contractNumber}
                    </Text>
                  )}
                </Space>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Основная информация */}
      <Row gutter={[16, 16]}>
        {/* Стоимость */}
        <Col xs={24} lg={12}>
          <Card title={<Space><DollarOutlined /> Оценка стоимости</Space>} className="info-card">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Рыночная стоимость"
                  value={card.marketValue}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Залоговая стоимость"
                  value={card.pledgeValue}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>
            {card.evaluationDate && (
              <Divider style={{ margin: '16px 0' }} />
            )}
            {card.evaluationDate && (
              <Text type="secondary">
                <CalendarOutlined /> Дата оценки: {new Date(card.evaluationDate).toLocaleDateString('ru-RU')}
              </Text>
            )}
          </Card>
        </Col>

        {/* Адрес */}
        <Col xs={24} lg={12}>
          <Card title={<Space><EnvironmentOutlined /> Местоположение</Space>} className="info-card">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Адрес">{card.address?.fullAddress || 'Не указан'}</Descriptions.Item>
              {card.address?.postalCode && (
                <Descriptions.Item label="Индекс">{card.address.postalCode}</Descriptions.Item>
              )}
              {card.address?.coordinates && (
                <Descriptions.Item label="Координаты">
                  {card.address.coordinates.lat.toFixed(4)}, {card.address.coordinates.lon.toFixed(4)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Классификация */}
      <Card title={<Space><InfoCircleOutlined /> Классификация</Space>} className="info-card">
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
          <Descriptions.Item label="Основная категория">{getCategoryName()}</Descriptions.Item>
          <Descriptions.Item label="Уровень 0">{card.classification.level0}</Descriptions.Item>
          <Descriptions.Item label="Уровень 1">{card.classification.level1}</Descriptions.Item>
          <Descriptions.Item label="Уровень 2">{card.classification.level2}</Descriptions.Item>
          <Descriptions.Item label="Код ЦБ">{card.cbCode}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Характеристики */}
      <Card title={<Space><FileTextOutlined /> Характеристики</Space>} className="info-card">
        {renderCharacteristics()}
      </Card>

      {/* Собственник */}
      {card.owner && (
        <Card title={<Space><UserOutlined /> Собственник</Space>} className="info-card">
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="Наименование">{card.owner.name}</Descriptions.Item>
            <Descriptions.Item label="ИНН">{card.owner.inn}</Descriptions.Item>
            <Descriptions.Item label="Тип">
              {card.owner.type === 'legal' ? 'Юридическое лицо' : 'Физическое лицо'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* Документы */}
      {card.documents && card.documents.length > 0 && (
        <Card title={<Space><FileTextOutlined /> Документы</Space>} className="info-card">
          <Space direction="vertical" style={{ width: '100%' }}>
            {card.documents.map((doc: any) => (
              <Card key={doc.id} size="small" type="inner">
                <Space>
                  <FileTextOutlined />
                  <Text strong>{doc.name}</Text>
                  <Text type="secondary">({doc.type})</Text>
                  {doc.uploadDate && <Text type="secondary">- {doc.uploadDate}</Text>}
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      {/* Заметки */}
      {card.notes && (
        <Card title="Заметки" className="info-card">
          <Paragraph>{card.notes}</Paragraph>
        </Card>
      )}

      {/* Даты */}
      <Card className="info-card">
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Дата создания">
            {new Date(card.createdAt).toLocaleString('ru-RU')}
          </Descriptions.Item>
          <Descriptions.Item label="Дата изменения">
            {new Date(card.updatedAt).toLocaleString('ru-RU')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default CollateralCardView;

