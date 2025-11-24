import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  Tree,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { FileTextOutlined, FolderOutlined, SearchOutlined } from '@ant-design/icons';
import type { CollateralDocument, CollateralDossierPayload } from '@/types/collateralDossier';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import { generateDossierDemoData } from '@/utils/generateDossierDemoData';
import extendedStorageService from '@/services/ExtendedStorageService';
import './CollateralDossierPage.css';

const CollateralDossierPage: React.FC = () => {
  const [documents, setDocuments] = useState<CollateralDocument[]>([]);
  const [portfolio, setPortfolio] = useState<CollateralPortfolioEntry[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setDocuments(payload.documents);

        // Сохраняем в localStorage для последующего использования
        localStorage.setItem('collateralDossierData', JSON.stringify(payload));
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

  // Построение дерева: Клиент -> Кредитный договор -> Залогодатель -> Договор залога -> Документы
  const treeData = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    
    // Группируем документы по сделкам
    const documentsByReference = new Map<string, CollateralDocument[]>();
    documents.forEach(doc => {
      const ref = String(doc.reference || '');
      if (!documentsByReference.has(ref)) {
        documentsByReference.set(ref, []);
      }
      documentsByReference.get(ref)!.push(doc);
    });

    // Группируем сделки по клиентам
    const clientsMap = new Map<string, Map<string, Map<string, Map<string, CollateralDocument[]>>>>();
    
    portfolio.forEach(deal => {
      const borrower = deal.borrower || 'Не указан';
      const loanContract = deal.contractNumber || `Договор ${deal.reference || 'без номера'}`;
      const pledger = deal.pledger || 'Не указан';
      const pledgeContract = deal.collateralContractNumber || `Договор залога ${deal.reference || 'без номера'}`;
      const ref = String(deal.reference || '');
      const dealDocs = documentsByReference.get(ref) || [];

      // Фильтрация по поиску
      if (search) {
        const matchesSearch = 
          borrower.toLowerCase().includes(search) ||
          loanContract.toLowerCase().includes(search) ||
          pledger.toLowerCase().includes(search) ||
          pledgeContract.toLowerCase().includes(search) ||
          dealDocs.some(doc => 
            doc.docType.toLowerCase().includes(search) ||
            doc.fileName.toLowerCase().includes(search)
          );
        if (!matchesSearch) return;
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
    });

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
              
              const documentNodes: DataNode[] = docs.map((doc, index) => ({
                key: `${pledgeContractKey}-doc-${index}`,
                title: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{doc.docType}</div>
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
                ),
                isLeaf: true,
                icon: <FileTextOutlined />,
              }));

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
  }, [portfolio, documents, searchValue]);

  // Автоматически раскрываем все узлы при загрузке
  useEffect(() => {
    if (treeData.length > 0 && expandedKeys.length === 0) {
      const getAllKeys = (nodes: DataNode[]): React.Key[] => {
        const keys: React.Key[] = [];
        nodes.forEach(node => {
          keys.push(node.key);
          if (node.children) {
            keys.push(...getAllKeys(node.children));
          }
        });
        return keys;
      };
      setExpandedKeys(getAllKeys(treeData));
    }
  }, [treeData, expandedKeys.length]);

  const stats = useMemo(() => {
    const totalDocs = documents.length;
    const completed = documents.filter(doc => doc.status === 'Загружен').length;
    const pending = documents.filter(doc => doc.status === 'На согласовании').length;

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
        <Tooltip title="Поиск по клиенту, договору, залогодателю или документу">
          <Input
            allowClear
            size="large"
            placeholder="Поиск..."
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={event => setSearchValue(event.target.value)}
            style={{ width: 360 }}
          />
        </Tooltip>
      </div>

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
            defaultExpandAll
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            treeData={treeData}
            style={{ fontSize: '14px' }}
          />
        )}
      </Card>
    </div>
  );
};

export default CollateralDossierPage;
