import React, { useMemo } from 'react';
import { Card, Descriptions, Tag, Row, Col, Divider, Typography, Space, Statistic, Tabs, Button, List } from 'antd';
import {
  HomeOutlined,
  CarOutlined,
  DollarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ExtendedCollateralCard } from '../../types';
import { getAttributesForPropertyType, distributeAttributesByTabs } from '@/utils/collateralAttributesFromDict';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './CollateralCardView.css';

const { Title, Text } = Typography;

interface CollateralCardViewProps {
  card: ExtendedCollateralCard;
}

export const CollateralCardView: React.FC<CollateralCardViewProps> = ({ card }) => {
  const navigate = useNavigate();
  
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

  // Получаем атрибуты для типа имущества
  const propertyAttributes = useMemo(() => {
    if (!card.propertyType) return [];
    return getAttributesForPropertyType(card.propertyType);
  }, [card.propertyType]);
  
  const distributedAttributes = useMemo(() => {
    return distributeAttributesByTabs(propertyAttributes);
  }, [propertyAttributes]);

  // Получаем заемщика и залогодателя
  const borrower = useMemo(() => card.partners?.find(p => p.role === 'owner' || (p.role === 'pledgor' && !card.partners?.find(p2 => p2.role === 'owner'))), [card.partners]);
  const pledgor = useMemo(() => card.partners?.find(p => p.role === 'pledgor'), [card.partners]);
  
  // Проверка, нужно ли показывать кнопку заказа выписки ЕГРН
  const shouldShowOrderEgrnButton = useMemo(() => {
    if (!card.egrnStatementDate || card.mainCategory !== 'real_estate') {
      return false;
    }
    const statementDate = dayjs(card.egrnStatementDate);
    const daysSinceStatement = dayjs().diff(statementDate, 'days');
    return daysSinceStatement > 30;
  }, [card.egrnStatementDate, card.mainCategory]);
  
  // Обработчик заказа выписки ЕГРН
  const handleOrderEgrn = () => {
    const cadastralNumber = card.address?.cadastralNumber || card.characteristics?.objectCadastralNumber;
    navigate(`/egrn?objectId=${card.id}&cadastralNumber=${cadastralNumber}&objectName=${encodeURIComponent(card.name || '')}`);
  };
  
  // Переход к договору
  const handleGoToContract = () => {
    if (card.contractId) {
      navigate(`/portfolio?contractId=${card.contractId}`);
    } else if (card.contractNumber) {
      navigate(`/portfolio?contractNumber=${card.contractNumber}`);
    } else if (card.reference) {
      navigate(`/portfolio?reference=${card.reference}`);
    }
  };
  
  // Переход в залоговое досье
  const handleGoToDossier = () => {
    if (card.reference) {
      window.open(`#/portfolio?reference=${card.reference}`, '_blank');
    }
  };

  // Форматирование значения атрибута
  const formatAttributeValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dayjs(value).format('DD.MM.YYYY');
    }
    return String(value);
  };

  const tabItems = [
    {
      key: '1',
      label: 'Главная',
      children: (
        <div>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Наименование (NAME_OF_PROPERTY)" span={2}>
              {card.name || '—'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Адрес" span={2}>
              {card.address?.fullAddress || '—'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Заемщик" span={1}>
              {borrower?.organizationName || `${borrower?.lastName || ''} ${borrower?.firstName || ''} ${borrower?.middleName || ''}`.trim() || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="ИНН заемщика" span={1}>
              {borrower?.inn || '—'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Залогодатель (OWNER_TIN)" span={1}>
              {pledgor?.organizationName || `${pledgor?.lastName || ''} ${pledgor?.firstName || ''} ${pledgor?.middleName || ''}`.trim() || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="ИНН залогодателя (OWNER_TIN)" span={1}>
              {pledgor?.inn || '—'}
            </Descriptions.Item>
            
            {card.propertyType && (
              <Descriptions.Item label="Тип имущества" span={2}>
                {card.propertyType}
              </Descriptions.Item>
            )}
          </Descriptions>
          
          {distributedAttributes.characteristics.length > 0 && (
            <>
              <Divider orientation="left">Характеристики</Divider>
              <Descriptions bordered column={2} size="small">
                {distributedAttributes.characteristics.map((attr) => {
                  const value = card.characteristics?.[attr.code];
                  if (value === null || value === undefined || value === '') return null;
                  return (
                    <Descriptions.Item key={attr.code} label={attr.name} span={attr.code === 'NAME_OF_PROPERTY' ? 2 : 1}>
                      {formatAttributeValue(value)}
                    </Descriptions.Item>
                  );
                })}
              </Descriptions>
            </>
          )}
        </div>
      ),
    },
    {
      key: '2',
      label: 'Характеристики',
      children: (
        <div>
          {distributedAttributes.characteristics.length > 0 ? (
            <Descriptions bordered column={2} size="small">
              {distributedAttributes.characteristics.map((attr) => {
                const value = card.characteristics?.[attr.code];
                if (value === null || value === undefined || value === '') return null;
                return (
                  <Descriptions.Item key={attr.code} label={attr.name}>
                    {formatAttributeValue(value)}
                  </Descriptions.Item>
                );
              })}
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">Характеристики не указаны</Typography.Text>
          )}
        </div>
      ),
    },
    {
      key: '3',
      label: 'Документы',
      children: (
        <div>
          {card.documents && card.documents.length > 0 ? (
            <List
              dataSource={card.documents}
              renderItem={(doc: any) => (
                <List.Item>
                  <Space>
                    <FileTextOutlined />
                    <Text strong>{doc.name}</Text>
                    <Text type="secondary">({doc.type})</Text>
                    {doc.uploadDate && (
                      <Text type="secondary">
                        - {new Date(doc.uploadDate).toLocaleDateString('ru-RU')}
                      </Text>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Typography.Text type="secondary">Документы не загружены</Typography.Text>
          )}
          
          <Divider />
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="link" 
              icon={<LinkOutlined />} 
              onClick={handleGoToDossier}
              style={{ paddingLeft: 0 }}
            >
              Перейти в Залоговое досье
            </Button>
            
            {card.mainCategory === 'real_estate' && (
              <div>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Дата выписки ЕГРН">
                    {card.egrnStatementDate ? dayjs(card.egrnStatementDate).format('DD.MM.YYYY') : '—'}
                  </Descriptions.Item>
                </Descriptions>
                
                {shouldShowOrderEgrnButton && (
                  <Button
                    type="primary"
                    danger
                    icon={<ExclamationCircleOutlined />}
                    onClick={handleOrderEgrn}
                    style={{ marginTop: 16 }}
                  >
                    Заказать выписку ЕГРН (выписка более 30 дней)
                  </Button>
                )}
              </div>
            )}
          </Space>
        </div>
      ),
    },
    {
      key: '4',
      label: 'Заметки',
      children: (
        <div>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Комментарии">
              {card.notes || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Отлагательные условия">
              {card.suspensiveConditions || '—'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
    {
      key: '5',
      label: 'Оценка',
      children: (
        <div>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Рыночная стоимость"
                value={card.marketValue || 0}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Залоговая стоимость"
                value={card.pledgeValue || 0}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>
          
          <Divider />
          
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Наличие ликвидного рынка (HAVEL_MARKET)">
              {card.characteristics?.HAVEL_MARKET ? 'Да' : 'Нет'}
            </Descriptions.Item>
            <Descriptions.Item label="Тип обеспечения (TYPE_COLLATERAL)">
              {card.characteristics?.TYPE_COLLATERAL || '—'}
            </Descriptions.Item>
            {distributedAttributes.evaluation.map((attr) => {
              const value = card.characteristics?.[attr.code];
              if (value === null || value === undefined || value === '') return null;
              return (
                <Descriptions.Item key={attr.code} label={attr.name}>
                  {formatAttributeValue(value)}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        </div>
      ),
    },
    {
      key: '6',
      label: 'Договор',
      children: (
        <div>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="REFERENCE сделки" span={2}>
              {card.reference || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Номер договора" span={2}>
              {card.contractNumber || '—'}
            </Descriptions.Item>
          </Descriptions>
          
          {(card.reference || card.contractNumber) && (
            <Button 
              type="primary" 
              icon={<LinkOutlined />} 
              onClick={handleGoToContract}
              style={{ marginTop: 16 }}
            >
              Перейти к договору в портфеле
            </Button>
          )}
        </div>
      ),
    },
  ];

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
                {card.propertyType && <Tag color="purple">{card.propertyType}</Tag>}
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Вкладки с информацией */}
      <Card style={{ marginTop: 16 }}>
        <Tabs items={tabItems} defaultActiveKey="1" />
      </Card>
    </div>
  );
};

export default CollateralCardView;
