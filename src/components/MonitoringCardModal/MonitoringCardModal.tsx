/**
 * Модалка карточки мониторинга договора
 * Отображает характеристики имущества и акт осмотра
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  Tabs,
  Descriptions,
  Tag,
  Typography,
  Space,
  Image,
  DatePicker,
  Input,
  Button,
  Empty,
  Spin,
  Divider,
  Row,
  Col,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  FileTextOutlined,
  CameraOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { MonitoringPlanEntry } from '@/types/monitoring';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import { getCollateralAttributes, getGroupedCollateralAttributes } from '@/utils/collateralAttributesConfig';
import dayjs from 'dayjs';
import './MonitoringCardModal.css';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

interface MonitoringCardModalProps {
  visible: boolean;
  entry: MonitoringPlanEntry | null;
  onClose: () => void;
}

interface InspectionAct {
  id?: string;
  inspectionDate?: string;
  address?: string;
  conditionDescription?: string;
  photos?: string[];
  inspector?: string;
  notes?: string;
}

const MonitoringCardModal: React.FC<MonitoringCardModalProps> = ({ visible, entry, onClose }) => {
  const [portfolioData, setPortfolioData] = useState<CollateralPortfolioEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [inspectionAct, setInspectionAct] = useState<InspectionAct>({
    inspectionDate: dayjs().format('YYYY-MM-DD'),
  });

  // Загрузка данных портфеля по REFERENCE
  useEffect(() => {
    if (!visible || !entry?.reference) {
      setPortfolioData(null);
      return;
    }

    const loadPortfolioData = async () => {
      setLoading(true);
      try {
        const base = import.meta.env.BASE_URL ?? '/';
        const resolvedBase = new URL(base, window.location.origin);
        const normalizedPath = resolvedBase.pathname.endsWith('/')
          ? resolvedBase.pathname
          : `${resolvedBase.pathname}/`;
        const url = `${resolvedBase.origin}${normalizedPath}portfolioData.json?v=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) {
          const data = (await response.json()) as CollateralPortfolioEntry[];
          const deal = data.find(
            d => String(d.reference) === String(entry.reference)
          );
          if (deal) {
            setPortfolioData(deal);
            // Автозаполнение данных акта осмотра из портфеля
            setInspectionAct(prev => ({
              ...prev,
              address: deal.collateralLocation || undefined,
              inspectionDate: dayjs().format('YYYY-MM-DD'),
            }));
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки данных портфеля:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolioData();
  }, [visible, entry]);

  // Получение атрибутов по типу имущества
  const collateralAttributes = useMemo(() => {
    if (!portfolioData?.collateralType) return [];
    return getCollateralAttributes(portfolioData.collateralType);
  }, [portfolioData?.collateralType]);

  const groupedAttributes = useMemo(() => {
    if (!portfolioData?.collateralType) return {};
    return getGroupedCollateralAttributes(portfolioData.collateralType);
  }, [portfolioData?.collateralType]);

  // Форматирование значения для отображения
  const formatValue = (key: string, value: any): string => {
    if (value === null || value === undefined || value === '') return '—';
    
    const attr = collateralAttributes.find(a => a.key === key);
    if (attr?.type === 'number' && typeof value === 'number') {
      return `${value.toLocaleString('ru-RU')}${attr.unit ? ` ${attr.unit}` : ''}`;
    }
    if (attr?.type === 'boolean') {
      return value ? 'Да' : 'Нет';
    }
    if (attr?.type === 'date' && value) {
      return dayjs(value).format('DD.MM.YYYY');
    }
    return String(value);
  };

  // Получение значения из портфеля по ключу атрибута
  const getPortfolioValue = (key: string): any => {
    if (!portfolioData) return null;
    return (portfolioData as any)[key] ?? null;
  };

  // Путь к CMS Check
  const base = import.meta.env.BASE_URL ?? '/';
  const cmsCheckPath = `${base}cms-check/index.html#/inspections`;

  // Вкладки модалки
  const tabItems: TabsProps['items'] = useMemo(() => {
    const items: TabsProps['items'] = [];

    // 1. Основная информация
    items.push({
      key: 'main',
      label: 'Основная информация',
      icon: <FileTextOutlined />,
      children: (
        <div className="monitoring-card-content">
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="REFERENCE" span={2}>
              <Text strong>{entry?.reference ?? '—'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Заемщик">{entry?.borrower ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Залогодатель">{entry?.pledger ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Сегмент">{entry?.segment ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Группа">{entry?.group ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Тип обеспечения">{entry?.baseType ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Детальный тип">{entry?.collateralType ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Вид мониторинга">{entry?.monitoringType ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Метод мониторинга">{entry?.monitoringMethod ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Периодичность">
              {entry?.frequencyMonths ? `Каждые ${entry.frequencyMonths} мес.` : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Последний мониторинг">{entry?.lastMonitoringDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Планируемая дата">{entry?.plannedDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ответственный">{entry?.owner ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Приоритет">{entry?.priority ?? '—'}</Descriptions.Item>
            {portfolioData?.collateralValue && (
              <Descriptions.Item label="Залоговая стоимость">
                {Number(portfolioData.collateralValue).toLocaleString('ru-RU')} руб.
              </Descriptions.Item>
            )}
            {portfolioData?.liquidity && (
              <Descriptions.Item label="Ликвидность">
                <Tag>{portfolioData.liquidity}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      ),
    });

    // 2. Характеристики имущества
    if (collateralAttributes.length > 0) {
      const characteristicsContent = Object.keys(groupedAttributes).length > 0 ? (
        <div className="monitoring-card-content">
          {Object.entries(groupedAttributes).map(([groupName, attrs]) => (
            <div key={groupName} style={{ marginBottom: '24px' }}>
              <Title level={5} style={{ marginBottom: '16px' }}>
                {groupName}
              </Title>
              <Descriptions bordered column={2} size="small">
                {attrs.map(attr => {
                  const value = getPortfolioValue(attr.key);
                  return (
                    <Descriptions.Item key={attr.key} label={attr.label}>
                      {formatValue(attr.key, value)}
                    </Descriptions.Item>
                  );
                })}
              </Descriptions>
            </div>
          ))}
        </div>
      ) : (
        <div className="monitoring-card-content">
          <Descriptions bordered column={2} size="small">
            {collateralAttributes.map(attr => {
              const value = getPortfolioValue(attr.key);
              return (
                <Descriptions.Item key={attr.key} label={attr.label}>
                  {formatValue(attr.key, value)}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        </div>
      );

      items.push({
        key: 'characteristics',
        label: 'Характеристики имущества',
        icon: <FileTextOutlined />,
        children: loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" tip="Загрузка характеристик..." />
          </div>
        ) : characteristicsContent,
      });
    }

    // 3. Акт осмотра
    items.push({
      key: 'inspection',
      label: 'Акт осмотра',
      icon: <CameraOutlined />,
      children: (
        <div className="monitoring-card-content">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Интеграция с CMS Check */}
            <div>
              <Title level={5}>Система дистанционных осмотров</Title>
              <Paragraph type="secondary">
                Используйте CMS Check для проведения осмотра и загрузки фотографий
              </Paragraph>
              <Button
                type="primary"
                icon={<CameraOutlined />}
                onClick={() => {
                  window.open(cmsCheckPath, '_blank');
                }}
              >
                Открыть CMS Check
              </Button>
            </div>

            <Divider />

            {/* Данные акта осмотра */}
            <div>
              <Title level={5}>Данные акта осмотра</Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Text strong>Дата проверки:</Text>
                  <br />
                  <DatePicker
                    style={{ width: '100%', marginTop: '8px' }}
                    value={inspectionAct.inspectionDate ? dayjs(inspectionAct.inspectionDate) : null}
                    onChange={date => {
                      setInspectionAct(prev => ({
                        ...prev,
                        inspectionDate: date ? date.format('YYYY-MM-DD') : undefined,
                      }));
                    }}
                    format="DD.MM.YYYY"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text strong>Инспектор:</Text>
                  <br />
                  <Input
                    style={{ marginTop: '8px' }}
                    placeholder="ФИО инспектора"
                    value={inspectionAct.inspector}
                    onChange={e => {
                      setInspectionAct(prev => ({
                        ...prev,
                        inspector: e.target.value,
                      }));
                    }}
                  />
                </Col>
                <Col xs={24}>
                  <Text strong>
                    <EnvironmentOutlined /> Адрес:
                  </Text>
                  <br />
                  <Input
                    style={{ marginTop: '8px' }}
                    placeholder="Адрес местоположения имущества"
                    value={inspectionAct.address}
                    onChange={e => {
                      setInspectionAct(prev => ({
                        ...prev,
                        address: e.target.value,
                      }));
                    }}
                  />
                </Col>
                <Col xs={24}>
                  <Text strong>Описание состояния имущества:</Text>
                  <br />
                  <TextArea
                    rows={4}
                    style={{ marginTop: '8px' }}
                    placeholder="Опишите состояние имущества, выявленные недостатки, повреждения и т.д."
                    value={inspectionAct.conditionDescription}
                    onChange={e => {
                      setInspectionAct(prev => ({
                        ...prev,
                        conditionDescription: e.target.value,
                      }));
                    }}
                  />
                </Col>
                <Col xs={24}>
                  <Text strong>Примечания:</Text>
                  <br />
                  <TextArea
                    rows={3}
                    style={{ marginTop: '8px' }}
                    placeholder="Дополнительные примечания по результатам осмотра"
                    value={inspectionAct.notes}
                    onChange={e => {
                      setInspectionAct(prev => ({
                        ...prev,
                        notes: e.target.value,
                      }));
                    }}
                  />
                </Col>
              </Row>
            </div>

            <Divider />

            {/* Фотографии */}
            <div>
              <Title level={5}>
                <CameraOutlined /> Фотографии имущества
              </Title>
              {inspectionAct.photos && inspectionAct.photos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                  {inspectionAct.photos.map((photo, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <Image
                        src={photo}
                        alt={`Фото ${index + 1}`}
                        width="100%"
                        style={{ borderRadius: '4px' }}
                        fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  description="Фотографии не загружены"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: '20px 0' }}
                >
                  <Button
                    type="dashed"
                    icon={<CameraOutlined />}
                    onClick={() => {
                      window.open(cmsCheckPath, '_blank');
                    }}
                  >
                    Загрузить фотографии через CMS Check
                  </Button>
                </Empty>
              )}
            </div>
          </Space>
        </div>
      ),
    });

    return items;
  }, [entry, portfolioData, collateralAttributes, groupedAttributes, loading, inspectionAct]);

  if (!entry) return null;

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>Карточка мониторинга договора {entry.reference}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Закрыть
        </Button>,
      ]}
      width="90%"
      style={{ top: 20 }}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      {loading && !portfolioData ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" tip="Загрузка данных..." />
        </div>
      ) : (
        <Tabs items={tabItems} defaultActiveKey="main" size="small" type="card" />
      )}
    </Modal>
  );
};

export default MonitoringCardModal;

