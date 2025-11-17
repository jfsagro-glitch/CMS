import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  Radio,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CalculatorOutlined,
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { AppraisalObject, AppraisalResult, AppraisalObjectType } from '@/types/appraisal';
import dayjs from 'dayjs';
import extendedStorageService from '@/services/ExtendedStorageService';
import type { CollateralConclusion } from '@/types/collateralConclusion';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import './AppraisalPage.css';

const { Title, Text } = Typography;

type AppraisalResultRow = AppraisalResult & { key: string };

const AppraisalPage: React.FC = () => {
  const [objectType, setObjectType] = useState<AppraisalObjectType>('collateral');
  const [selectedObject, setSelectedObject] = useState<AppraisalObject | null>(null);
  const [objects, setObjects] = useState<AppraisalObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [appraising, setAppraising] = useState(false);
  const [results, setResults] = useState<AppraisalResultRow[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedResult, setSelectedResult] = useState<AppraisalResultRow | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectModalVisible, setSelectModalVisible] = useState(false);

  // Загрузка объектов в зависимости от типа
  useEffect(() => {
    const loadObjects = async () => {
      setLoading(true);
      try {
        if (objectType === 'collateral') {
          // Загружаем объекты из реестра
          const cards = await extendedStorageService.getExtendedCards();
          const mapped: AppraisalObject[] = cards.map(card => ({
            id: card.id,
            type: 'collateral',
            name: card.name,
            reference: card.reference,
            contractNumber: card.contractNumber,
            collateralType: card.classification?.level1,
            address: card.address?.fullAddress,
            area: card.characteristics?.totalAreaSqm || card.characteristics?.totalArea,
            characteristics: card.characteristics || {},
          }));
          setObjects(mapped);
        } else if (objectType === 'conclusion') {
          // Загружаем заключения
          try {
            const base = import.meta.env.BASE_URL ?? '/';
            const resolvedBase = new URL(base, window.location.origin);
            const normalizedPath = resolvedBase.pathname.endsWith('/')
              ? resolvedBase.pathname
              : `${resolvedBase.pathname}/`;
            const url = `${resolvedBase.origin}${normalizedPath}collateralConclusionsData.json?v=${Date.now()}`;
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) {
              const conclusions = (await response.json()) as CollateralConclusion[];
              const mapped: AppraisalObject[] = conclusions.map(conclusion => ({
                id: conclusion.id,
                type: 'conclusion',
                name: conclusion.collateralName || conclusion.collateralType || 'Залоговое заключение',
                reference: conclusion.reference || undefined,
                contractNumber: conclusion.contractNumber || undefined,
                collateralType: conclusion.collateralType || undefined,
                address: conclusion.collateralLocation || undefined,
                area: conclusion.totalAreaSqm || conclusion.totalAreaHectares || undefined,
                characteristics: {
                  marketValue: conclusion.marketValue,
                  collateralValue: conclusion.collateralValue,
                  fairValue: conclusion.fairValue,
                },
              }));
              setObjects(mapped);
            }
          } catch (error) {
            console.error('Ошибка загрузки заключений:', error);
            setObjects([]);
          }
        } else if (objectType === 'portfolio') {
          // Загружаем договоры из портфеля
          try {
            const base = import.meta.env.BASE_URL ?? '/';
            const resolvedBase = new URL(base, window.location.origin);
            const normalizedPath = resolvedBase.pathname.endsWith('/')
              ? resolvedBase.pathname
              : `${resolvedBase.pathname}/`;
            const url = `${resolvedBase.origin}${normalizedPath}portfolioData.json?v=${Date.now()}`;
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) {
              const portfolio = (await response.json()) as CollateralPortfolioEntry[];
              const mapped: AppraisalObject[] = portfolio.map(deal => ({
                id: String(deal.reference || `portfolio-${deal.contractNumber}`),
                type: 'portfolio',
                name: `${deal.borrower || deal.pledger || 'Договор'} - ${deal.collateralType || 'Обеспечение'}`,
                reference: deal.reference || undefined,
                contractNumber: deal.contractNumber || undefined,
                collateralType: deal.collateralType || undefined,
                address: deal.collateralLocation || undefined,
                characteristics: {
                  marketValue: deal.marketValue,
                  collateralValue: deal.collateralValue,
                  fairValue: deal.fairValue,
                },
              }));
              setObjects(mapped);
            }
          } catch (error) {
            console.error('Ошибка загрузки портфеля:', error);
            setObjects([]);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки объектов:', error);
        message.error('Ошибка загрузки объектов');
        setObjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadObjects();
  }, [objectType]);

  // Загрузка сохраненных результатов оценки
  useEffect(() => {
    const loadResults = () => {
      try {
        const stored = localStorage.getItem('appraisalResults');
        if (stored) {
          const data = JSON.parse(stored) as AppraisalResult[];
          setResults(
            data.map((item, index) => ({
              ...item,
              key: item.id || `result-${index}`,
            }))
          );
        }
      } catch (error) {
        console.error('Ошибка загрузки результатов оценки:', error);
      }
    };
    loadResults();
  }, []);

  const filteredObjects = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return objects.filter(obj => {
      return (
        !search ||
        obj.name.toLowerCase().includes(search) ||
        String(obj.reference || '').toLowerCase().includes(search) ||
        obj.contractNumber?.toLowerCase().includes(search) ||
        obj.address?.toLowerCase().includes(search)
      );
    });
  }, [objects, searchValue]);

  const handleSelectObject = () => {
    setSelectModalVisible(true);
  };

  const handleObjectSelect = (object: AppraisalObject) => {
    setSelectedObject(object);
    setSelectModalVisible(false);
  };

  const handleAppraise = async () => {
    if (!selectedObject) {
      message.warning('Выберите объект для оценки');
      return;
    }

    setAppraising(true);
    try {
      // Имитация процесса оценки (заглушка, пока база данных в разработке)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Генерируем результат оценки на основе характеристик объекта
      const result = generateAppraisalResult(selectedObject);

      // Сохраняем результат
      const stored = localStorage.getItem('appraisalResults');
      const existingResults: AppraisalResult[] = stored ? JSON.parse(stored) : [];
      existingResults.push(result);
      localStorage.setItem('appraisalResults', JSON.stringify(existingResults));

      setResults(prev => [...prev, { ...result, key: result.id }]);
      message.success('Оценка выполнена успешно');
      setSelectedObject(null);
    } catch (error) {
      console.error('Ошибка оценки:', error);
      message.error('Ошибка выполнения оценки');
    } finally {
      setAppraising(false);
    }
  };

  const generateAppraisalResult = (object: AppraisalObject): AppraisalResult => {
    // Базовая логика оценки (заглушка)
    // В будущем здесь будет запрос к базе данных аналогичных объектов
    
    const area = object.area || 100;
    const basePricePerSqm = 100000; // Базовая цена за кв.м (заглушка)
    
    // Корректировки в зависимости от типа
    let multiplier = 1;
    if (object.collateralType?.includes('Офис')) multiplier = 1.2;
    if (object.collateralType?.includes('Склад')) multiplier = 0.8;
    if (object.collateralType?.includes('Торгов')) multiplier = 1.5;
    
    const marketValue = Math.round(area * basePricePerSqm * multiplier);
    const collateralValue = Math.round(marketValue * 0.7); // 70% от рыночной
    const fairValue = Math.round(marketValue * 0.85); // 85% от рыночной

    return {
      id: `appraisal-${Date.now()}`,
      requestId: `request-${Date.now()}`,
      objectId: object.id,
      objectType: object.type,
      marketValue,
      collateralValue,
      fairValue,
      appraisalMethod: 'Сравнительный подход (база данных аналогов в разработке)',
      comparableObjectsCount: 0, // Пока база данных в разработке
      confidenceLevel: 'medium',
      details: `Автоматическая оценка выполнена на основе характеристик объекта. База данных аналогичных объектов находится в разработке.`,
      notes: 'Оценка выполнена автоматически. Требуется проверка оценщиком.',
      appraisedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: 'draft',
    };
  };

  const handleViewResult = (result: AppraisalResultRow) => {
    setSelectedResult(result);
    setModalVisible(true);
  };

  const getStatusColor = (status: AppraisalResult['status']) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'draft':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: AppraisalResult['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircleOutlined />;
      case 'rejected':
        return <CloseCircleOutlined />;
      case 'draft':
        return <ClockCircleOutlined />;
      default:
        return null;
    }
  };

  const getObjectTypeLabel = (type: AppraisalObjectType) => {
    switch (type) {
      case 'collateral':
        return 'Объект залога';
      case 'conclusion':
        return 'Залоговое заключение';
      case 'portfolio':
        return 'Договор из портфеля';
      default:
        return type;
    }
  };

  const columns: ColumnsType<AppraisalResultRow> = [
    {
      title: 'Объект',
      key: 'object',
      width: 200,
      render: (_, record) => {
        const obj = objects.find(o => o.id === record.objectId);
        return (
          <Space direction="vertical" size="small">
            <Text strong>{obj?.name || 'Неизвестный объект'}</Text>
            <Tag>{getObjectTypeLabel(record.objectType)}</Tag>
          </Space>
        );
      },
    },
    {
      title: 'REFERENCE',
      dataIndex: 'objectId',
      key: 'reference',
      width: 120,
      render: (_, record) => {
        const obj = objects.find(o => o.id === record.objectId);
        return obj?.reference ? String(obj.reference) : '—';
      },
    },
    {
      title: 'Рыночная стоимость',
      dataIndex: 'marketValue',
      key: 'marketValue',
      width: 150,
      render: (value: number) =>
        value
          ? new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              maximumFractionDigits: 0,
            }).format(value)
          : '—',
    },
    {
      title: 'Залоговая стоимость',
      dataIndex: 'collateralValue',
      key: 'collateralValue',
      width: 150,
      render: (value: number) =>
        value
          ? new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              maximumFractionDigits: 0,
            }).format(value)
          : '—',
    },
    {
      title: 'Метод',
      dataIndex: 'appraisalMethod',
      key: 'appraisalMethod',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Уверенность',
      dataIndex: 'confidenceLevel',
      key: 'confidenceLevel',
      width: 120,
      render: (level: string) => {
        const colors = { high: 'green', medium: 'orange', low: 'red' };
        const labels = { high: 'Высокая', medium: 'Средняя', low: 'Низкая' };
        return <Tag color={colors[level as keyof typeof colors]}>{labels[level as keyof typeof labels]}</Tag>;
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AppraisalResult['status']) => {
        const labels = { draft: 'Черновик', approved: 'Утверждено', rejected: 'Отклонено' };
        return (
          <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
            {labels[status]}
          </Tag>
        );
      },
    },
    {
      title: 'Дата оценки',
      dataIndex: 'appraisedAt',
      key: 'appraisedAt',
      width: 150,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="Просмотр">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewResult(record)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="appraisal-page">
      <div className="appraisal-page__header">
        <div>
          <Title level={2} className="appraisal-page__title">
            Модуль оценки
          </Title>
          <Typography.Paragraph className="appraisal-page__subtitle">
            Автоматическая оценка объектов залога на основе базы данных аналогичных объектов
          </Typography.Paragraph>
        </div>
      </div>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ marginRight: 16 }}>
              Выберите тип объекта:
            </Text>
            <Radio.Group
              value={objectType}
              onChange={e => {
                setObjectType(e.target.value);
                setSelectedObject(null);
              }}
            >
              <Radio.Button value="collateral">
                <DatabaseOutlined /> Объекты залога
              </Radio.Button>
              <Radio.Button value="conclusion">
                <FileTextOutlined /> Залоговые заключения
              </Radio.Button>
              <Radio.Button value="portfolio">
                <WalletOutlined /> Договоры из портфеля
              </Radio.Button>
            </Radio.Group>
          </div>

          <Space style={{ width: '100%' }} direction="vertical">
            <Text strong>Выбранный объект:</Text>
            {selectedObject ? (
              <Card size="small" style={{ backgroundColor: '#f0f9ff' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>{selectedObject.name}</Text>
                  <Space>
                    <Tag>{getObjectTypeLabel(selectedObject.type)}</Tag>
                    {selectedObject.reference && <Tag>REF: {selectedObject.reference}</Tag>}
                    {selectedObject.contractNumber && <Tag>Договор: {selectedObject.contractNumber}</Tag>}
                  </Space>
                  {selectedObject.address && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {selectedObject.address}
                    </Text>
                  )}
                  {selectedObject.area && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Площадь: {selectedObject.area} {objectType === 'portfolio' ? 'кв.м' : 'кв.м'}
                    </Text>
                  )}
                </Space>
              </Card>
            ) : (
              <Empty description="Объект не выбран" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            <Space>
              <Button type="primary" onClick={handleSelectObject} icon={<SearchOutlined />}>
                Выбрать объект
              </Button>
              <Button
                type="primary"
                onClick={handleAppraise}
                icon={<CalculatorOutlined />}
                loading={appraising}
                disabled={!selectedObject}
              >
                Выполнить оценку
              </Button>
            </Space>
          </Space>
        </Space>
      </Card>

      <Alert
        message="База данных аналогичных объектов"
        description="База данных аналогичных объектов находится в разработке. В настоящее время оценка выполняется на основе базовых алгоритмов. После внедрения базы данных оценка будет выполняться на основе реальных данных об аналогичных объектах."
        type="info"
        showIcon
        style={{ marginTop: 16, marginBottom: 16 }}
      />

      <Card>
        <Title level={4}>История оценок</Title>
        <Table
          columns={columns}
          dataSource={results}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          loading={loading}
          locale={{
            emptyText: <Empty description="Нет выполненных оценок" />,
          }}
        />
      </Card>

      {/* Модалка выбора объекта */}
      <Modal
        title={`Выбор объекта: ${getObjectTypeLabel(objectType)}`}
        open={selectModalVisible}
        onCancel={() => setSelectModalVisible(false)}
        footer={null}
        width={800}
      >
        <Input
          placeholder="Поиск по названию, REFERENCE, договору, адресу"
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Table
          dataSource={filteredObjects}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
          onRow={record => ({
            onClick: () => handleObjectSelect(record),
            style: { cursor: 'pointer' },
          })}
          columns={[
            {
              title: 'Название',
              dataIndex: 'name',
              key: 'name',
              ellipsis: true,
            },
            {
              title: 'REFERENCE',
              dataIndex: 'reference',
              key: 'reference',
              width: 120,
              render: (ref) => ref || '—',
            },
            {
              title: 'Тип',
              dataIndex: 'collateralType',
              key: 'collateralType',
              width: 150,
              ellipsis: true,
            },
            {
              title: 'Адрес',
              dataIndex: 'address',
              key: 'address',
              ellipsis: true,
            },
          ]}
        />
      </Modal>

      {/* Модалка просмотра результата */}
      <Modal
        title="Результат оценки"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
        width={700}
      >
        {selectedResult && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Объект" span={2}>
                {objects.find(o => o.id === selectedResult.objectId)?.name || 'Неизвестный объект'}
              </Descriptions.Item>
              <Descriptions.Item label="Тип объекта">
                {getObjectTypeLabel(selectedResult.objectType)}
              </Descriptions.Item>
              <Descriptions.Item label="Статус">
                <Tag color={getStatusColor(selectedResult.status)} icon={getStatusIcon(selectedResult.status)}>
                  {selectedResult.status === 'draft'
                    ? 'Черновик'
                    : selectedResult.status === 'approved'
                      ? 'Утверждено'
                      : 'Отклонено'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Рыночная стоимость" span={1}>
                {selectedResult.marketValue
                  ? new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    }).format(selectedResult.marketValue)
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Залоговая стоимость" span={1}>
                {selectedResult.collateralValue
                  ? new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    }).format(selectedResult.collateralValue)
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Справедливая стоимость" span={1}>
                {selectedResult.fairValue
                  ? new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    }).format(selectedResult.fairValue)
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Уверенность" span={1}>
                <Tag
                  color={
                    selectedResult.confidenceLevel === 'high'
                      ? 'green'
                      : selectedResult.confidenceLevel === 'medium'
                        ? 'orange'
                        : 'red'
                  }
                >
                  {selectedResult.confidenceLevel === 'high'
                    ? 'Высокая'
                    : selectedResult.confidenceLevel === 'medium'
                      ? 'Средняя'
                      : 'Низкая'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Метод оценки" span={2}>
                {selectedResult.appraisalMethod || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Количество аналогов" span={1}>
                {selectedResult.comparableObjectsCount ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="Дата оценки" span={1}>
                {dayjs(selectedResult.appraisedAt).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
              {selectedResult.details && (
                <Descriptions.Item label="Детали" span={2}>
                  {selectedResult.details}
                </Descriptions.Item>
              )}
              {selectedResult.notes && (
                <Descriptions.Item label="Примечания" span={2}>
                  {selectedResult.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default AppraisalPage;

