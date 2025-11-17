import React from 'react';
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

  // Рендер характеристик в зависимости от типа
  const renderCharacteristics = (): DescriptionsProps['items'] => {
    if (!card.characteristics) return [];

    const items: DescriptionsProps['items'] = [];

    if (card.mainCategory === 'real_estate') {
      if (card.characteristics.area) {
        items.push({ label: 'Площадь', children: `${card.characteristics.area} м²` });
      }
      if (card.characteristics.floor) {
        items.push({ label: 'Этаж', children: `${card.characteristics.floor}/${card.characteristics.totalFloors}` });
      }
      if (card.characteristics.roomsCount) {
        items.push({ label: 'Количество комнат', children: card.characteristics.roomsCount });
      }
      if (card.characteristics.cadastralNumber) {
        items.push({ label: 'Кадастровый номер', children: card.characteristics.cadastralNumber });
      }
      if (card.characteristics.buildYear) {
        items.push({ label: 'Год постройки', children: card.characteristics.buildYear });
      }
      if (card.characteristics.renovation) {
        items.push({ label: 'Ремонт', children: card.characteristics.renovation });
      }
      if (card.characteristics.landArea) {
        items.push({ label: 'Площадь участка', children: `${card.characteristics.landArea} сот.` });
      }
    } else if (card.mainCategory === 'movable') {
      if (card.characteristics.brand) {
        items.push({ label: 'Марка', children: card.characteristics.brand });
      }
      if (card.characteristics.model) {
        items.push({ label: 'Модель', children: card.characteristics.model });
      }
      if (card.characteristics.year) {
        items.push({ label: 'Год выпуска', children: card.characteristics.year });
      }
      if (card.characteristics.vin) {
        items.push({ label: 'VIN', children: card.characteristics.vin });
      }
      if (card.characteristics.mileage) {
        items.push({ label: 'Пробег', children: `${card.characteristics.mileage.toLocaleString('ru-RU')} км` });
      }
      if (card.characteristics.color) {
        items.push({ label: 'Цвет', children: card.characteristics.color });
      }
      if (card.characteristics.manufacturer) {
        items.push({ label: 'Производитель', children: card.characteristics.manufacturer });
      }
      if (card.characteristics.serialNumber) {
        items.push({ label: 'Серийный номер', children: card.characteristics.serialNumber });
      }
      if (card.characteristics.condition) {
        items.push({ label: 'Состояние', children: card.characteristics.condition });
      }
    } else if (card.mainCategory === 'property_rights') {
      if (card.characteristics.nominalValue) {
        items.push({ label: 'Номинальная стоимость', children: formatCurrency(card.characteristics.nominalValue) });
      }
      if (card.characteristics.quantity) {
        items.push({ label: 'Количество', children: card.characteristics.quantity });
      }
      if (card.characteristics.issuer) {
        items.push({ label: 'Эмитент', children: card.characteristics.issuer });
      }
    }

    return items;
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
      {card.characteristics && (
        <Card title={<Space><FileTextOutlined /> Характеристики</Space>} className="info-card">
          <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small" items={renderCharacteristics()} />
        </Card>
      )}

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

