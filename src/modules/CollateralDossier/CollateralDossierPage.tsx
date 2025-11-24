import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
  Tree,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, FileTextOutlined, FolderOutlined, SearchOutlined } from '@ant-design/icons';
import type { CollateralDocument, CollateralDossierPayload } from '@/types/collateralDossier';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import { generateDossierDemoData } from '@/utils/generateDossierDemoData';
import extendedStorageService from '@/services/ExtendedStorageService';
import './CollateralDossierPage.css';

const CollateralDossierPage: React.FC = () => {
  const [documents, setDocuments] = useState<CollateralDocument[]>([]);
  const [portfolio, setPortfolio] = useState<CollateralPortfolioEntry[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [loanContractFilter, setLoanContractFilter] = useState<string | null>(null);
  const [pledgerFilter, setPledgerFilter] = useState<string | null>(null);
  const [pledgeContractFilter, setPledgeContractFilter] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<CollateralDocument[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  
  // Map для связи ключей узлов договоров залога с документами
  const pledgeContractDocumentsMap = useMemo(() => {
    const map = new Map<string, { docs: CollateralDocument[]; title: string }>();
    
    // Группируем документы по сделкам
    const documentsByReference = new Map<string, CollateralDocument[]>();
    documents.forEach(doc => {
      const ref = String(doc.reference || '');
      if (!documentsByReference.has(ref)) {
        documentsByReference.set(ref, []);
      }
      documentsByReference.get(ref)!.push(doc);
    });

    // Строим карту для быстрого доступа
    portfolio.forEach(deal => {
      const borrower = deal.borrower || 'Не указан';
      const loanContract = deal.contractNumber || `Договор ${deal.reference || 'без номера'}`;
      const pledger = deal.pledger || 'Не указан';
      const pledgeContract = deal.collateralContractNumber || `Договор залога ${deal.reference || 'без номера'}`;
      const ref = String(deal.reference || '');
      const dealDocs = documentsByReference.get(ref) || [];
      
      if (dealDocs.length > 0) {
        const key = `client-${borrower}-loan-${loanContract}-pledger-${pledger}-pledge-${pledgeContract}`;
        map.set(key, {
          docs: dealDocs,
          title: `Документы по договору залога: ${pledgeContract}`,
        });
      }
    });
    
    return map;
  }, [portfolio, documents]);

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
        try {
          const payload = await generateDossierDemoData(portfolioData, cards);

          if (!mounted) return;

          setPortfolio(portfolioData);
          setDocuments(payload.documents);

          // Сохраняем в localStorage для последующего использования
          localStorage.setItem('collateralDossierData', JSON.stringify(payload));
        } catch (genError) {
          console.warn('Ошибка генерации демо-данных, используем сохраненные:', genError);
          // Пытаемся загрузить из localStorage
          const saved = localStorage.getItem('collateralDossierData');
          if (saved) {
            const payload = JSON.parse(saved) as CollateralDossierPayload;
            setPortfolio(portfolioData);
            setDocuments(payload.documents);
          } else {
            // Если нет сохраненных данных, создаем пустую структуру
            setPortfolio(portfolioData);
            setDocuments([]);
          }
        }
      } catch (fetchError) {
        // Пытаемся загрузить из localStorage
        try {
          const saved = localStorage.getItem('collateralDossierData');
          if (saved) {
            const payload = JSON.parse(saved) as CollateralDossierPayload;
            setDocuments(payload.documents);
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

  // Кешируем группировку документов по reference для быстрого доступа
  const documentsByReference = useMemo(() => {
    const map = new Map<string, CollateralDocument[]>();
    documents.forEach(doc => {
      const ref = String(doc.reference || '');
      if (!map.has(ref)) {
        map.set(ref, []);
      }
      map.get(ref)!.push(doc);
    });
    return map;
  }, [documents]);

  // Получаем уникальные значения для фильтров (оптимизировано)
  const filterOptions = useMemo(() => {
    const clients = new Set<string>();
    const loanContracts = new Set<string>();
    const pledgers = new Set<string>();
    const pledgeContracts = new Set<string>();
    const statuses = new Set<string>();

    // Используем Set для быстрого добавления
    for (const deal of portfolio) {
      if (deal.borrower) clients.add(deal.borrower);
      if (deal.contractNumber) loanContracts.add(deal.contractNumber);
      if (deal.pledger) pledgers.add(deal.pledger);
      if (deal.collateralContractNumber) pledgeContracts.add(deal.collateralContractNumber);
    }

    for (const doc of documents) {
      if (doc.status) statuses.add(doc.status);
    }

    return {
      clients: Array.from(clients).sort(),
      loanContracts: Array.from(loanContracts).sort(),
      pledgers: Array.from(pledgers).sort(),
      pledgeContracts: Array.from(pledgeContracts).sort(),
      statuses: Array.from(statuses).sort(),
    };
  }, [portfolio, documents]);

  // Функция для сокращения названия типа документа
  const shortenDocType = useCallback((docType: string): string => {
    // Сокращаем длинные названия
    if (docType.length > 30) {
      return docType.substring(0, 27) + '...';
    }
    return docType;
  }, []);

  // Мемоизируем компоненты документов для оптимизации рендеринга
  const renderDocumentNode = useCallback((doc: CollateralDocument) => ({
    key: doc.id || `${doc.folderId}-${doc.fileName}`,
    title: (
      <Tooltip title={doc.docType}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>{shortenDocType(doc.docType)}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{doc.fileName}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Tag color={doc.statusColor || 'default'} style={{ margin: 0 }}>
                {doc.status}
              </Tag>
              <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                {doc.size} • {doc.lastUpdated}
              </span>
            </div>
          </div>
        </div>
      </Tooltip>
    ),
    isLeaf: true,
    icon: <FileTextOutlined />,
  }), [shortenDocType]);

  // Построение дерева: Клиент -> Кредитный договор -> Залогодатель -> Договор залога -> Документы
  const treeData = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    const hasSearch = search.length > 0;

    // Группируем сделки по клиентам
    const clientsMap = new Map<string, Map<string, Map<string, Map<string, CollateralDocument[]>>>>();
    
    // Оптимизация: ранний выход из циклов
    for (const deal of portfolio) {
      const borrower = deal.borrower || 'Не указан';
      const loanContract = deal.contractNumber || `Договор ${deal.reference || 'без номера'}`;
      const pledger = deal.pledger || 'Не указан';
      const pledgeContract = deal.collateralContractNumber || `Договор залога ${deal.reference || 'без номера'}`;
      const ref = String(deal.reference || '');
      const dealDocs = documentsByReference.get(ref) || [];

      // Быстрая фильтрация по выпадающим спискам (ранний выход)
      if (clientFilter && borrower !== clientFilter) continue;
      if (loanContractFilter && loanContract !== loanContractFilter) continue;
      if (pledgerFilter && pledger !== pledgerFilter) continue;
      if (pledgeContractFilter && pledgeContract !== pledgeContractFilter) continue;

      // Фильтрация по поиску (только если есть поисковый запрос)
      if (hasSearch) {
        const borrowerLower = borrower.toLowerCase();
        const loanContractLower = loanContract.toLowerCase();
        const pledgerLower = pledger.toLowerCase();
        const pledgeContractLower = pledgeContract.toLowerCase();
        
        let matchesSearch = 
          borrowerLower.includes(search) ||
          loanContractLower.includes(search) ||
          pledgerLower.includes(search) ||
          pledgeContractLower.includes(search);
        
        if (!matchesSearch) {
          // Проверяем документы только если не совпало по сделке
          matchesSearch = dealDocs.some(doc => 
            doc.docType.toLowerCase().includes(search) ||
            doc.fileName.toLowerCase().includes(search)
          );
        }
        
        if (!matchesSearch) continue;
      }

      if (!clientsMap.has(borrower)) {
        clientsMap.set(borrower, new Map());
      }
      const loanContractsMap = clientsMap.get(borrower)!;
      
      if (!loanContractsMap.has(loanContract)) {
        loanContractsMap.set(loanContract, new Map());
      }
      const pledgersMap = loanContractsMap.get(loanContract)!;
      
      if (!pledgersMap.has(pledger)) {
        pledgersMap.set(pledger, new Map());
      }
      const pledgeContractsMap = pledgersMap.get(pledger)!;
      
      if (!pledgeContractsMap.has(pledgeContract)) {
        pledgeContractsMap.set(pledgeContract, dealDocs);
      } else {
        // Объединяем документы, если договор залога уже есть
        const existing = pledgeContractsMap.get(pledgeContract)!;
        pledgeContractsMap.set(pledgeContract, [...existing, ...dealDocs]);
      }
    }

    // Строим дерево
    const buildTree = (): DataNode[] => {
      return Array.from(clientsMap.entries()).map(([client, loanContractsMap]) => {
        const clientKey = `client-${client}`;
        
        const loanContractNodes: DataNode[] = Array.from(loanContractsMap.entries()).map(([loanContract, pledgersMap]) => {
          const loanContractKey = `${clientKey}-loan-${loanContract}`;
          
          const pledgerNodes: DataNode[] = Array.from(pledgersMap.entries()).map(([pledger, pledgeContractsMap]) => {
            const pledgerKey = `${loanContractKey}-pledger-${pledger}`;
            
            const pledgeContractNodes: DataNode[] = Array.from(pledgeContractsMap.entries()).map(([pledgeContract, docs]) => {
              const pledgeContractKey = `${pledgerKey}-pledge-${pledgeContract}`;
              
              // Используем мемоизированную функцию для создания узлов документов
              const documentNodes: DataNode[] = docs.map((doc) => renderDocumentNode(doc));

              return {
                key: pledgeContractKey,
                title: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FolderOutlined style={{ color: '#faad14' }} />
                    <span style={{ fontWeight: 500 }}>Договор залога: {pledgeContract}</span>
                    <Tag color="blue" style={{ margin: 0 }}>{docs.length} документов</Tag>
                  </div>
                ),
                children: documentNodes.length > 0 ? documentNodes : undefined,
                icon: <FolderOutlined />,
              };
            });

            return {
              key: pledgerKey,
              title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FolderOutlined style={{ color: '#52c41a' }} />
                  <span style={{ fontWeight: 500 }}>Залогодатель: {pledger}</span>
                </div>
              ),
              children: pledgeContractNodes,
              icon: <FolderOutlined />,
            };
          });

          return {
            key: loanContractKey,
            title: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderOutlined style={{ color: '#722ed1' }} />
                <span style={{ fontWeight: 500 }}>Кредитный договор: {loanContract}</span>
              </div>
            ),
            children: pledgerNodes,
            icon: <FolderOutlined />,
          };
        });

        return {
          key: clientKey,
          title: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderOutlined style={{ color: '#eb2f96' }} />
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Клиент: {client}</span>
            </div>
          ),
          children: loanContractNodes,
          icon: <FolderOutlined />,
        };
      });
    };

        return buildTree();
  }, [portfolio, documentsByReference, searchValue, clientFilter, loanContractFilter, pledgerFilter, pledgeContractFilter, renderDocumentNode]);

  // По умолчанию раскрываем только уровень клиентов
  useEffect(() => {
    if (treeData.length > 0 && expandedKeys.length === 0) {
      // Получаем только ключи клиентов (верхний уровень)
      const clientKeys = treeData.map(node => node.key);
      setExpandedKeys(clientKeys);
    }
  }, [treeData, expandedKeys.length]); // Зависимости: treeData и expandedKeys.length

  // Обработчик раскрытия узлов (мемоизирован)
  const handleExpand = useCallback((keys: React.Key[]) => {
    setExpandedKeys(keys);
  }, []);

  // Обработчик выбора узла в дереве
  const handleSelect = useCallback((selectedKeys: React.Key[]) => {
    const selectedKey = selectedKeys[0];
    if (!selectedKey || typeof selectedKey !== 'string') return;

    // Проверяем, что клик был на папке договора залога (ключ содержит "-pledge-" и не содержит "-doc-")
    if (selectedKey.includes('-pledge-') && !selectedKey.includes('-doc-')) {
      const contractData = pledgeContractDocumentsMap.get(selectedKey);
      
      if (contractData && contractData.docs.length > 0) {
        setModalTitle(contractData.title);
        setSelectedDocuments(contractData.docs);
        setIsModalVisible(true);
      }
    }
  }, [pledgeContractDocumentsMap]);

  // Мемоизируем опции для Select компонентов
  const loanContractOptions = useMemo(() => {
    const contracts = new Set<string>();
    for (const deal of portfolio) {
      if (!clientFilter || deal.borrower === clientFilter) {
        if (deal.contractNumber) contracts.add(deal.contractNumber);
      }
    }
    return Array.from(contracts).sort().map(contract => (
      <Select.Option key={contract} value={contract} label={contract}>
        {contract}
      </Select.Option>
    ));
  }, [portfolio, clientFilter]);

  const pledgerOptions = useMemo(() => {
    const pledgers = new Set<string>();
    for (const deal of portfolio) {
      if (clientFilter && deal.borrower !== clientFilter) continue;
      if (loanContractFilter && deal.contractNumber !== loanContractFilter) continue;
      if (deal.pledger) pledgers.add(deal.pledger);
    }
    return Array.from(pledgers).sort().map(pledger => (
      <Select.Option key={pledger} value={pledger} label={pledger}>
        {pledger}
      </Select.Option>
    ));
  }, [portfolio, clientFilter, loanContractFilter]);

  const pledgeContractOptions = useMemo(() => {
    const contracts = new Set<string>();
    for (const deal of portfolio) {
      if (clientFilter && deal.borrower !== clientFilter) continue;
      if (loanContractFilter && deal.contractNumber !== loanContractFilter) continue;
      if (pledgerFilter && deal.pledger !== pledgerFilter) continue;
      if (deal.collateralContractNumber) contracts.add(deal.collateralContractNumber);
    }
    return Array.from(contracts).sort().map(contract => (
      <Select.Option key={contract} value={contract} label={contract}>
        {contract}
      </Select.Option>
    ));
  }, [portfolio, clientFilter, loanContractFilter, pledgerFilter]);

  // Колонки таблицы документов в модалке
  const documentColumns: ColumnsType<CollateralDocument> = useMemo(() => [
    {
      title: 'Тип документа',
      dataIndex: 'docType',
      key: 'docType',
      width: 200,
      render: (text: string, record: CollateralDocument) => (
        <Tooltip title={record.docType}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <span>{shortenDocType(text)}</span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Имя файла',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string, record: CollateralDocument) => (
        <Tag color={record.statusColor || 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Размер',
      dataIndex: 'size',
      key: 'size',
      width: 100,
    },
    {
      title: 'Обновлен',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 120,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, record: CollateralDocument) => (
        <Tooltip title="Скачать документ">
          <DownloadOutlined
            style={{ fontSize: 16, color: '#1890ff', cursor: 'pointer' }}
            onClick={() => {
              // Здесь можно добавить логику скачивания
              console.log('Download:', record);
            }}
          />
        </Tooltip>
      ),
    },
  ], [shortenDocType]);

  // Оптимизированная статистика (однократный проход)
  const stats = useMemo(() => {
    let completed = 0;
    let pending = 0;
    
    for (const doc of documents) {
      if (doc.status === 'Загружен') completed++;
      else if (doc.status === 'На согласовании') pending++;
    }
    
    const totalDocs = documents.length;
    return {
      totalDocs,
      completed,
      pending,
      completionRate: totalDocs ? Math.round((completed / totalDocs) * 100) : 0,
    };
  }, [documents]);

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
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap style={{ width: '100%' }}>
          <Tooltip title="Поиск по клиенту, договору, залогодателю или документу">
            <Input
              allowClear
              placeholder="Поиск..."
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={event => setSearchValue(event.target.value)}
              style={{ minWidth: 250 }}
            />
          </Tooltip>
          <Select
            allowClear
            placeholder="Клиент"
            style={{ minWidth: 200 }}
            value={clientFilter}
            onChange={value => {
              setClientFilter(value);
              // Сбрасываем зависимые фильтры
              if (!value) {
                setLoanContractFilter(null);
                setPledgerFilter(null);
                setPledgeContractFilter(null);
              }
            }}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {filterOptions.clients.map(client => (
              <Select.Option key={client} value={client} label={client}>
                {client}
              </Select.Option>
            ))}
          </Select>
          <Select
            allowClear
            placeholder="Кредитный договор"
            style={{ minWidth: 200 }}
            value={loanContractFilter}
            onChange={value => {
              setLoanContractFilter(value);
              // Сбрасываем зависимые фильтры
              if (!value) {
                setPledgerFilter(null);
                setPledgeContractFilter(null);
              }
            }}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            disabled={!clientFilter}
            loading={loading}
          >
            {loanContractOptions}
          </Select>
          <Select
            allowClear
            placeholder="Залогодатель"
            style={{ minWidth: 200 }}
            value={pledgerFilter}
            onChange={value => {
              setPledgerFilter(value);
              // Сбрасываем зависимые фильтры
              if (!value) {
                setPledgeContractFilter(null);
              }
            }}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            disabled={!loanContractFilter}
            loading={loading}
          >
            {pledgerOptions}
          </Select>
          <Select
            allowClear
            placeholder="Договор залога"
            style={{ minWidth: 200 }}
            value={pledgeContractFilter}
            onChange={setPledgeContractFilter}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            disabled={!pledgerFilter}
            loading={loading}
          >
            {pledgeContractOptions}
          </Select>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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

      <Card>
        {error ? (
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
        ) : loading ? (
          <Empty description="Загрузка..." />
        ) : treeData.length === 0 ? (
          <Empty description="Нет документов" />
        ) : (
          <Tree
            showLine={{ showLeafIcon: false }}
            showIcon
            expandedKeys={expandedKeys}
            onExpand={handleExpand}
            onSelect={handleSelect}
            treeData={treeData}
            style={{ fontSize: '14px' }}
            virtual={false}
            blockNode
          />
        )}
      </Card>

      <Modal
        title={modalTitle}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <Table
          columns={documentColumns}
          dataSource={selectedDocuments}
          rowKey={(record) => record.id || `${record.folderId}-${record.fileName}`}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Всего документов: ${total}`,
          }}
          size="middle"
        />
      </Modal>
    </div>
  );
};

export default CollateralDossierPage;
