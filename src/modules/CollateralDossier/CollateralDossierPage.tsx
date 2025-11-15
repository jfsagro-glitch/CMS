import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Card,
  Col,
  Empty,
  Input,
  List,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileTextOutlined, FolderOpenOutlined, SearchOutlined } from '@ant-design/icons';
import type { CollateralDocument, CollateralFolder, CollateralDossierPayload } from '@/types/collateralDossier';
import './CollateralDossierPage.css';

interface TableRow extends CollateralDocument {
  key: string;
}

const CollateralDossierPage: React.FC = () => {
  const [documents, setDocuments] = useState<TableRow[]>([]);
  const [folders, setFolders] = useState<CollateralFolder[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.BASE_URL ?? '/';
        const resolvedBase = new URL(base, window.location.origin);
        const normalizedPath = resolvedBase.pathname.endsWith('/')
          ? resolvedBase.pathname
          : `${resolvedBase.pathname}/`;
        const url = `${resolvedBase.origin}${normalizedPath}collateralDossier.json?v=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Не удалось загрузить досье (${response.status})`);
        }
        const payload = (await response.json()) as CollateralDossierPayload;
        if (!mounted) return;

        setFolders(payload.folders);
        setDocuments(
          payload.documents.map(doc => ({
            ...doc,
            key: doc.id,
          })),
        );
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Неизвестная ошибка');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const folderOptions = useMemo(
    () =>
      folders.map(folder => ({
        value: folder.id,
        label: folder.path.join(' / '),
      })),
    [folders],
  );

  const statusOptions = useMemo(() => {
    const statusSet = Array.from(new Set(documents.map(doc => doc.status)));
    return statusSet.map(status => ({ value: status, label: status }));
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return documents.filter(doc => {
      const matchesSearch =
        !search ||
        [
          doc.reference,
          doc.borrower,
          doc.pledger,
          doc.inn,
          doc.docType,
          doc.fileName,
          doc.responsible,
        ]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(search));

      const matchesFolder = !folderFilter || doc.folderId === folderFilter;
      const matchesStatus = !statusFilter || doc.status === statusFilter;

      return matchesSearch && matchesFolder && matchesStatus;
    });
  }, [documents, searchValue, folderFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalDocs = documents.length;
    const completed = documents.filter(doc => doc.status === 'Загружен').length;
    const pending = documents.filter(doc => doc.status === 'На согласовании').length;
    const outdated = documents.filter(doc => doc.status === 'Требует обновления').length;

    return {
      totalDocs,
      completed,
      pending,
      outdated,
      completionRate: totalDocs ? Math.round((completed / totalDocs) * 100) : 0,
    };
  }, [documents]);

  const columns: ColumnsType<TableRow> = [
    {
      title: 'Документ',
      dataIndex: 'docType',
      key: 'docType',
      width: 220,
      render: (_, record) => (
        <div className="dossier-doc-cell">
          <FileTextOutlined className="dossier-doc-icon" />
          <div>
            <Typography.Text strong>{record.docType}</Typography.Text>
            <div className="dossier-muted">{record.fileName}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Сделка',
      dataIndex: 'reference',
      key: 'reference',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.reference}</Typography.Text>
          <div className="dossier-muted">{record.borrower ?? record.pledger ?? 'Не указан'}</div>
          {record.inn && (
            <div className="dossier-muted">
              ИНН: <Typography.Text code>{record.inn}</Typography.Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Папка',
      dataIndex: 'folderPath',
      key: 'folderPath',
      width: 260,
      render: (_, record) => (
        <div>
          <FolderOpenOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
          {record.folderPath.join(' / ')}
          {record.description && <div className="dossier-muted">{record.description}</div>}
        </div>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (_, record) => (
        <Tag color={record.statusColor || 'default'}>{record.status}</Tag>
      ),
    },
    {
      title: 'Ответственный',
      dataIndex: 'responsible',
      key: 'responsible',
      width: 160,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.responsible}</Typography.Text>
          <div className="dossier-muted">Обновлен: {record.lastUpdated}</div>
        </div>
      ),
    },
    {
      title: 'Размер',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: value => <span>{value}</span>,
    },
  ];

  return (
    <div className="collateral-dossier">
      <div className="collateral-dossier__header">
        <div>
          <Typography.Title level={2} className="collateral-dossier__title">
            Залоговое досье
          </Typography.Title>
          <Typography.Paragraph className="collateral-dossier__subtitle">
            Документооборот по сделкам залогового портфеля: заключения, отчеты об оценке, мониторинги,
            фотофиксация и регистраторы.
          </Typography.Paragraph>
        </div>
        <Tooltip title="Поиск по номеру сделки, ИНН или типу документа">
          <Input
            allowClear
            size="large"
            placeholder="Поиск по сделке или документу"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={event => setSearchValue(event.target.value)}
            style={{ width: 360 }}
          />
        </Tooltip>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Всего документов" value={stats.totalDocs} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Загружено" value={stats.completed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="На согласовании" value={stats.pending} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Готовность досье"
              value={`${stats.completionRate}%`}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="collateral-dossier__filters">
        <Space size="middle" wrap>
          <Select
            allowClear
            placeholder="Все папки"
            style={{ minWidth: 220 }}
            options={folderOptions}
            value={folderFilter ?? undefined}
            onChange={value => setFolderFilter(value ?? null)}
          />
          <Select
            allowClear
            placeholder="Статус"
            style={{ minWidth: 180 }}
            options={statusOptions}
            value={statusFilter ?? undefined}
            onChange={value => setStatusFilter(value ?? null)}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={7}>
          <Card title="Структура папок">
            <List
              dataSource={folders}
              renderItem={item => (
                <List.Item
                  className={item.id === folderFilter ? 'collateral-dossier__folder--active' : ''}
                  onClick={() => setFolderFilter(prev => (prev === item.id ? null : item.id))}
                >
                  <List.Item.Meta
                    avatar={<Badge status="processing" />}
                    title={<span>{item.path.join(' / ')}</span>}
                    description={
                      item.description ? <span className="dossier-muted">{item.description}</span> : null
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'Структура папок не найдена' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={17}>
          <Card bodyStyle={{ padding: 0 }} className="collateral-dossier__table-card">
            <Table
              columns={columns}
              dataSource={filteredDocuments}
              pagination={{ pageSize: 15, showSizeChanger: false }}
              scroll={{ x: 1200 }}
              loading={loading}
              locale={{
                emptyText: loading ? <Empty description="Загрузка..." /> : <Empty description="Нет документов" />,
              }}
            />
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить досье"
          description={error}
          action={
            <a onClick={() => window.location.reload()} style={{ fontWeight: 600 }}>
              Повторить
            </a>
          }
        />
      )}
    </div>
  );
};

export default CollateralDossierPage;

