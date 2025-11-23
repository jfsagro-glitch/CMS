import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Card,
  Col,
  Empty,
  Input,
  List,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  Cascader,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileTextOutlined, FolderOpenOutlined, SearchOutlined } from '@ant-design/icons';
import type { CollateralDocument, CollateralFolder, CollateralDossierPayload } from '@/types/collateralDossier';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import { generateDossierDemoData } from '@/utils/generateDossierDemoData';
import extendedStorageService from '@/services/ExtendedStorageService';
import './CollateralDossierPage.css';

interface TableRow extends CollateralDocument {
  key: string;
}

const CollateralDossierPage: React.FC = () => {
  const [documents, setDocuments] = useState<TableRow[]>([]);
  const [folders, setFolders] = useState<CollateralFolder[]>([]);
  const [portfolio, setPortfolio] = useState<CollateralPortfolioEntry[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [pledgerSearch, setPledgerSearch] = useState('');
  const [hierarchyFilter, setHierarchyFilter] = useState<string[]>([]);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [foldersVisible, setFoldersVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Загружаем портфель
        const portfolioUrl = (() => {
          const base = import.meta.env.BASE_URL ?? '/';
          const resolvedBase = new URL(base, window.location.origin);
          const normalizedPath = resolvedBase.pathname.endsWith('/')
            ? resolvedBase.pathname
            : `${resolvedBase.pathname}/`;
          return `${resolvedBase.origin}${normalizedPath}portfolioData.json`;
        })();

        const portfolioResponse = await fetch(`${portfolioUrl}?v=${Date.now()}`, { cache: 'no-store' });
        let portfolioData: CollateralPortfolioEntry[] = [];
        if (portfolioResponse.ok) {
          portfolioData = (await portfolioResponse.json()) as CollateralPortfolioEntry[];
        }

        // Загружаем карточки залога
        const cards = await extendedStorageService.getExtendedCards();

        // Генерируем демо-данные на основе портфеля
        const payload = await generateDossierDemoData(portfolioData, cards);

        if (!mounted) return;

        setPortfolio(portfolioData);
        setFolders(payload.folders);
        setDocuments(
          payload.documents.map(doc => ({
            ...doc,
            key: doc.id,
          })),
        );

        // Сохраняем в localStorage для последующего использования
        localStorage.setItem('collateralDossierData', JSON.stringify(payload));
      } catch (fetchError) {
        // Пытаемся загрузить из localStorage
        try {
          const saved = localStorage.getItem('collateralDossierData');
          if (saved) {
            const payload = JSON.parse(saved) as CollateralDossierPayload;
            setFolders(payload.folders);
            setDocuments(
              payload.documents.map(doc => ({
                ...doc,
                key: doc.id,
              })),
            );
          } else {
            throw fetchError;
          }
        } catch {
          setError(fetchError instanceof Error ? fetchError.message : 'Неизвестная ошибка');
        }
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

  // Иерархия для Cascader: Клиент -> Залогодатель -> Договор
  const hierarchyOptions = useMemo(() => {
    const clientsMap = new Map<string, Map<string, Set<string>>>();
    
    portfolio.forEach(deal => {
      const borrower = deal.borrower || 'Не указан';
      const pledger = deal.pledger || 'Не указан';
      const contract = `Договор ${deal.contractNumber || deal.reference}`;
      
      if (!clientsMap.has(borrower)) {
        clientsMap.set(borrower, new Map());
      }
      
      const pledgersMap = clientsMap.get(borrower)!;
      if (!pledgersMap.has(pledger)) {
        pledgersMap.set(pledger, new Set());
      }
      
      pledgersMap.get(pledger)!.add(contract);
    });
    
    return Array.from(clientsMap.entries()).map(([client, pledgersMap]) => ({
      value: client,
      label: client,
      children: Array.from(pledgersMap.entries()).map(([pledger, contracts]) => ({
        value: pledger,
        label: pledger,
        children: Array.from(contracts).map(contract => ({
          value: contract,
          label: contract,
        })),
      })),
    }));
  }, [portfolio]);

  const filteredDocuments = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    const clientTerm = clientSearch.trim().toLowerCase();
    const pledgerTerm = pledgerSearch.trim().toLowerCase();

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

      const matchesClient =
        !clientTerm ||
        (doc.borrower && String(doc.borrower).toLowerCase().includes(clientTerm)) ||
        (doc.pledger && String(doc.pledger).toLowerCase().includes(clientTerm));

      const matchesPledger =
        !pledgerTerm || (doc.pledger && String(doc.pledger).toLowerCase().includes(pledgerTerm));

      // Фильтр по иерархии
      const matchesHierarchy = hierarchyFilter.length === 0 || (
        hierarchyFilter[0] && doc.borrower === hierarchyFilter[0] &&
        (hierarchyFilter.length < 2 || doc.pledger === hierarchyFilter[1]) &&
        (hierarchyFilter.length < 3 || doc.folderPath[2] === hierarchyFilter[2])
      );

      const matchesFolder = !folderFilter || doc.folderId === folderFilter;
      const matchesStatus = !statusFilter || doc.status === statusFilter;

      return matchesSearch && matchesClient && matchesPledger && matchesHierarchy && matchesFolder && matchesStatus;
    });
  }, [documents, searchValue, clientSearch, pledgerSearch, hierarchyFilter, folderFilter, statusFilter]);

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
          <Cascader
            allowClear
            placeholder="Клиент → Залогодатель → Договор"
            style={{ minWidth: 300 }}
            options={hierarchyOptions}
            value={hierarchyFilter}
            onChange={(value) => setHierarchyFilter(value as string[])}
            showSearch={{
              filter: (inputValue, path) =>
                path.some(option => {
                  const label = String(option.label || '');
                  return label.toLowerCase().includes(inputValue.toLowerCase());
                }),
            }}
            changeOnSelect
          />
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
          <Input
            allowClear
            placeholder="Поиск по клиенту"
            prefix={<SearchOutlined />}
            value={clientSearch}
            onChange={event => setClientSearch(event.target.value)}
            style={{ minWidth: 220 }}
          />
          <Input
            allowClear
            placeholder="Поиск по залогодателю"
            prefix={<SearchOutlined />}
            value={pledgerSearch}
            onChange={event => setPledgerSearch(event.target.value)}
            style={{ minWidth: 220 }}
          />
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }} className="collateral-dossier__table-card">
        <div className="collateral-dossier__table-actions">
          <Space>
            <Tooltip title="Открыть иерархию хранения документов">
              <a onClick={() => setFoldersVisible(true)}>Структура папок</a>
            </Tooltip>
          </Space>
        </div>
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

      <Modal
        title="Структура папок залогового досье"
        open={foldersVisible}
        onCancel={() => setFoldersVisible(false)}
        onOk={() => setFoldersVisible(false)}
        okText="Закрыть"
        cancelButtonProps={{ style: { display: 'none' } }}
        width={720}
      >
        <List
          dataSource={folders}
          renderItem={item => (
            <List.Item
              className={item.id === folderFilter ? 'collateral-dossier__folder--active' : ''}
              onClick={() => setFolderFilter(prev => (prev === item.id ? null : item.id))}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                avatar={<Badge status="processing" />}
                title={<span>{item.path.join(' / ')}</span>}
                description={item.description ? <span className="dossier-muted">{item.description}</span> : null}
              />
            </List.Item>
          )}
          locale={{ emptyText: 'Структура папок не найдена' }}
        />
      </Modal>
    </div>
  );
};

export default CollateralDossierPage;

