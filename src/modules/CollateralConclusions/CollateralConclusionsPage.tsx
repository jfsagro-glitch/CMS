import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  Descriptions,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
  FolderOpenOutlined,
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { CollateralConclusion } from '@/types/collateralConclusion';
import { useNavigate } from 'react-router-dom';
import CreateConclusionModal from './CreateConclusionModal';
import './CollateralConclusionsPage.css';

type ConclusionRow = CollateralConclusion & { key: string };

const CollateralConclusionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [conclusions, setConclusions] = useState<ConclusionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedConclusion, setSelectedConclusion] = useState<ConclusionRow | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadConclusions = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.BASE_URL ?? '/';
        const resolvedBase = new URL(base, window.location.origin);
        const normalizedPath = resolvedBase.pathname.endsWith('/')
          ? resolvedBase.pathname
          : `${resolvedBase.pathname}/`;
        const url = `${resolvedBase.origin}${normalizedPath}collateralConclusionsData.json?v=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Не удалось загрузить данные заключений (${response.status})`);
        }
        const data = (await response.json()) as CollateralConclusion[];
        if (!mounted) return;
        setConclusions(
          data.map((item, index) => ({
            ...item,
            key: item.id || `conclusion-${index}`,
          }))
        );
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Неизвестная ошибка');
        setConclusions([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadConclusions();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredConclusions = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return conclusions.filter(conclusion => {
      const matchesSearch =
        !search ||
        [
          conclusion.conclusionNumber,
          conclusion.reference,
          conclusion.contractNumber,
          conclusion.pledger,
          conclusion.borrower,
          conclusion.collateralType,
        ]
          .filter(Boolean)
          .some(val => String(val).toLowerCase().includes(search));
      const matchesStatus = !statusFilter || conclusion.status === statusFilter;
      const matchesType = !typeFilter || conclusion.conclusionType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [conclusions, searchValue, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = filteredConclusions.length;
    const draft = filteredConclusions.filter(c => c.status === 'Черновик').length;
    const approved = filteredConclusions.filter(c => c.status === 'Согласовано').length;
    const pending = filteredConclusions.filter(c => c.status === 'На согласовании').length;
    return { total, draft, approved, pending };
  }, [filteredConclusions]);

  const handleViewConclusion = (record: ConclusionRow) => {
    setSelectedConclusion(record);
    setModalVisible(true);
  };

  const handleGoToDossier = (reference: string | null, pledger: string | null) => {
    if (reference) {
      navigate(`/collateral-dossier?ref=${reference}`);
    } else if (pledger) {
      navigate(`/collateral-dossier?q=${encodeURIComponent(pledger)}`);
    } else {
      message.warning('Не указан REFERENCE или Залогодатель для перехода к досье');
    }
  };

  const handleGoToPledger = (pledger: string | null, reference: string | null) => {
    if (reference) {
      navigate(`/portfolio?q=${encodeURIComponent(reference)}`);
    } else if (pledger) {
      navigate(`/portfolio?q=${encodeURIComponent(pledger)}`);
    } else {
      message.warning('Не указан Залогодатель или REFERENCE для перехода к портфелю');
    }
  };

  const columns: ColumnsType<ConclusionRow> = useMemo(
    () => [
      {
        title: '№ заключения',
        dataIndex: 'conclusionNumber',
        key: 'conclusionNumber',
        width: 150,
        render: (text, record) => (
          <Button type="link" onClick={() => handleViewConclusion(record)}>
            {text}
          </Button>
        ),
      },
      {
        title: 'Дата',
        dataIndex: 'conclusionDate',
        key: 'conclusionDate',
        width: 120,
      },
      {
        title: 'REFERENCE',
        dataIndex: 'reference',
        key: 'reference',
        width: 150,
        render: text => (text ? <Typography.Text code>{text}</Typography.Text> : '—'),
      },
      {
        title: 'Залогодатель',
        dataIndex: 'pledger',
        key: 'pledger',
        width: 200,
        render: (text, record) => (
          <Tooltip title="Перейти к портфелю">
            <Button
              type="link"
              icon={<UserOutlined />}
              onClick={() => handleGoToPledger(record.pledger, record.reference)}
            >
              {text || '—'}
            </Button>
          </Tooltip>
        ),
      },
      {
        title: 'Тип залога',
        dataIndex: 'collateralType',
        key: 'collateralType',
        width: 180,
      },
      {
        title: 'Тип заключения',
        dataIndex: 'conclusionType',
        key: 'conclusionType',
        width: 150,
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        width: 150,
        render: (status: string) => {
          const color =
            status === 'Согласовано'
              ? 'green'
              : status === 'На согласовании'
                ? 'blue'
                : status === 'Отклонено' || status === 'Аннулировано'
                  ? 'red'
                  : 'default';
          return <Tag color={color}>{status}</Tag>;
        },
      },
      {
        title: 'Автор',
        dataIndex: 'author',
        key: 'author',
        width: 150,
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Space>
            <Tooltip title="Просмотр">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleViewConclusion(record)}
              />
            </Tooltip>
            <Tooltip title="Залоговое досье">
              <Button
                type="link"
                icon={<FolderOpenOutlined />}
                onClick={() => handleGoToDossier(record.reference, record.pledger)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [navigate]
  );

  const handleCreateSuccess = () => {
    // Перезагружаем данные
    window.location.reload();
  };

  return (
    <div className="collateral-conclusions-page">
      <div className="conclusions-header">
        <div>
          <Typography.Title level={2} className="conclusions-title">
            Залоговые заключения
          </Typography.Title>
          <Typography.Paragraph className="conclusions-subtitle">
            Реестр залоговых заключений по сделкам
          </Typography.Paragraph>
        </div>
        <Space size="middle">
          <Input
            allowClear
            size="large"
            placeholder="Поиск по номеру, REFERENCE, залогодателю..."
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            style={{ width: 400 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setCreateModalVisible(true)}
          >
            Создать заключение
          </Button>
        </Space>
      </div>

      <Card>
        <div className="conclusions-filters">
          <Select
            allowClear
            placeholder="Статус"
            style={{ width: 200 }}
            options={[
              { label: 'Черновик', value: 'Черновик' },
              { label: 'На согласовании', value: 'На согласовании' },
              { label: 'Согласовано', value: 'Согласовано' },
              { label: 'Отклонено', value: 'Отклонено' },
              { label: 'Аннулировано', value: 'Аннулировано' },
            ]}
            value={statusFilter ?? undefined}
            onChange={v => setStatusFilter(v ?? null)}
          />
          <Select
            allowClear
            placeholder="Тип заключения"
            style={{ width: 200 }}
            options={[
              { label: 'Первичное', value: 'Первичное' },
              { label: 'Повторное', value: 'Повторное' },
              { label: 'Дополнительное', value: 'Дополнительное' },
              { label: 'Переоценка', value: 'Переоценка' },
            ]}
            value={typeFilter ?? undefined}
            onChange={v => setTypeFilter(v ?? null)}
          />
        </div>
      </Card>

      <Row gutter={[16, 16]} className="conclusions-stats">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Всего заключений" value={stats.total} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Черновики" value={stats.draft} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="На согласовании" value={stats.pending} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Согласовано" value={stats.approved} />
          </Card>
        </Col>
      </Row>

      <Card className="conclusions-table-card" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredConclusions}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1400 }}
          loading={loading}
          onRow={record => ({
            onDoubleClick: () => handleViewConclusion(record),
          })}
          locale={{
            emptyText: (
              <Empty
                description="Нет заключений, удовлетворяющих фильтрам"
                className="conclusions-empty"
              />
            ),
          }}
        />
      </Card>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить данные заключений"
          description={error}
          action={
            <a onClick={() => window.location.reload()} style={{ fontWeight: 600 }}>
              Повторить
            </a>
          }
        />
      )}

      <Modal
        title="Карточка залогового заключения"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button
            key="dossier"
            icon={<FolderOpenOutlined />}
            onClick={() => {
              if (selectedConclusion) {
                handleGoToDossier(selectedConclusion.reference, selectedConclusion.pledger);
              }
            }}
          >
            Залоговое досье
          </Button>,
          <Button
            key="pledger"
            icon={<UserOutlined />}
            onClick={() => {
              if (selectedConclusion) {
                handleGoToPledger(selectedConclusion.pledger, selectedConclusion.reference);
              }
            }}
          >
            Залогодатель
          </Button>,
          <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
        width="90%"
        style={{ top: 20 }}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {selectedConclusion && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions title="Общие сведения" bordered column={3} size="small">
              <Descriptions.Item label="№ заключения">
                {selectedConclusion.conclusionNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Дата заключения">
                {selectedConclusion.conclusionDate}
              </Descriptions.Item>
              <Descriptions.Item label="Тип заключения">
                {selectedConclusion.conclusionType}
              </Descriptions.Item>
              <Descriptions.Item label="Статус">
                <Tag
                  color={
                    selectedConclusion.status === 'Согласовано'
                      ? 'green'
                      : selectedConclusion.status === 'На согласовании'
                        ? 'blue'
                        : selectedConclusion.status === 'Отклонено' ||
                            selectedConclusion.status === 'Аннулировано'
                          ? 'red'
                          : 'default'
                  }
                >
                  {selectedConclusion.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="REFERENCE">
                {selectedConclusion.reference ? (
                  <Typography.Text code>{selectedConclusion.reference}</Typography.Text>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="№ договора">
                {selectedConclusion.contractNumber || '—'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="Стороны" bordered column={3} size="small">
              <Descriptions.Item label="Залогодатель" span={2}>
                {selectedConclusion.pledger || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="ИНН">{selectedConclusion.pledgerInn || '—'}</Descriptions.Item>
              <Descriptions.Item label="Заемщик" span={3}>
                {selectedConclusion.borrower || '—'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="Залог" bordered column={3} size="small">
              <Descriptions.Item label="Тип залога">
                {selectedConclusion.collateralType || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Местоположение" span={2}>
                {selectedConclusion.collateralLocation || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Оценочная стоимость">
                {selectedConclusion.collateralValue
                  ? new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    }).format(selectedConclusion.collateralValue)
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Рыночная стоимость">
                {selectedConclusion.marketValue
                  ? new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    }).format(selectedConclusion.marketValue)
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Уровень риска">
                {selectedConclusion.riskLevel ? (
                  <Tag
                    color={
                      selectedConclusion.riskLevel === 'Низкий'
                        ? 'green'
                        : selectedConclusion.riskLevel === 'Средний'
                          ? 'blue'
                          : selectedConclusion.riskLevel === 'Высокий'
                            ? 'orange'
                            : 'red'
                    }
                  >
                    {selectedConclusion.riskLevel}
                  </Tag>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="Заключение" bordered column={1} size="small">
              <Descriptions.Item label="Текст заключения">
                <Typography.Paragraph>{selectedConclusion.conclusionText}</Typography.Paragraph>
              </Descriptions.Item>
              {selectedConclusion.recommendations && (
                <Descriptions.Item label="Рекомендации">
                  <Typography.Paragraph>{selectedConclusion.recommendations}</Typography.Paragraph>
                </Descriptions.Item>
              )}
              {selectedConclusion.notes && (
                <Descriptions.Item label="Примечания">
                  <Typography.Paragraph>{selectedConclusion.notes}</Typography.Paragraph>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Descriptions title="Согласование" bordered column={3} size="small">
              <Descriptions.Item label="Автор">{selectedConclusion.author}</Descriptions.Item>
              <Descriptions.Item label="Дата создания">{selectedConclusion.authorDate}</Descriptions.Item>
              {selectedConclusion.approver && (
                <>
                  <Descriptions.Item label="Согласующий">{selectedConclusion.approver}</Descriptions.Item>
                  {selectedConclusion.approvalDate && (
                    <Descriptions.Item label="Дата согласования">
                      {selectedConclusion.approvalDate}
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>
          </Space>
        )}
      </Modal>

      <CreateConclusionModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default CollateralConclusionsPage;

