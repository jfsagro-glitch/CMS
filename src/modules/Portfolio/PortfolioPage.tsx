import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Empty, Input, Modal, Row, Select, Space, Spin, Statistic, Table, Tag, Tooltip, Typography, List } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EnvironmentOutlined, LineChartOutlined, SearchOutlined } from '@ant-design/icons';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import type { CollateralDocument, CollateralDossierPayload } from '@/types/collateralDossier';
import './PortfolioPage.css';

type PortfolioRow = CollateralPortfolioEntry & { key: string };

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const liquidityColor: Record<string, string> = {
  Высокая: 'green',
  Средняя: 'blue',
  Низкая: 'orange',
  Малоудовлетворительная: 'volcano',
};

const PortfolioPage: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [liquidityFilter, setLiquidityFilter] = useState<string | null>(null);
  const [monitoringFilter, setMonitoringFilter] = useState<string | null>(null);
  const [portfolioRows, setPortfolioRows] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<PortfolioRow | null>(null);
  const [dealModalVisible, setDealModalVisible] = useState(false);
  const [dossierModalVisible, setDossierModalVisible] = useState(false);
  const [dossierDocuments, setDossierDocuments] = useState<CollateralDocument[]>([]);
  const [dossierData, setDossierData] = useState<CollateralDocument[]>([]);
  const [dossierLoading, setDossierLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadPortfolio = async () => {
      setLoading(true);
      setError(null);
      try {
        const dataUrl = (() => {
          const base = import.meta.env.BASE_URL ?? '/';
          const resolvedBase = new URL(base, window.location.origin);
          const normalizedPath = resolvedBase.pathname.endsWith('/')
            ? resolvedBase.pathname
            : `${resolvedBase.pathname}/`;
          return `${resolvedBase.origin}${normalizedPath}portfolioData.json`;
        })();

        const response = await fetch(`${dataUrl}?v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Не удалось загрузить данные (${response.status})`);
        }
        const data = (await response.json()) as CollateralPortfolioEntry[];
        if (!mounted) return;
        const normalized: PortfolioRow[] = data.map((item, index) => ({
          ...item,
          key: `portfolio-${index}`,
          reference: item.reference != null ? String(item.reference) : null,
          inn: item.inn != null ? String(item.inn) : null,
          account9131: item.account9131 != null ? String(item.account9131) : null,
        }));
        setPortfolioRows(normalized);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Неизвестная ошибка');
        setPortfolioRows([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const loadDossier = async () => {
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
        setDossierData(payload.documents);
      } catch (fetchError) {
        console.warn('Не удалось загрузить залоговое досье', fetchError);
      } finally {
        setDossierLoading(false);
      }
    };

    loadPortfolio();
    loadDossier();

    return () => {
      mounted = false;
    };
  }, []);

  const filterOptions = useMemo(() => {
    const unique = <T extends keyof CollateralPortfolioEntry>(key: T) => {
      const values = portfolioRows
        .map(item => item[key])
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
      return Array.from(new Set(values)).sort();
    };

    return {
      segments: unique('segment'),
      groups: unique('group'),
      liquidity: unique('liquidity'),
      monitoring: unique('monitoringType'),
    };
  }, [portfolioRows]);

  const filteredData = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return portfolioRows.filter(item => {
      const matchesSearch =
        !search ||
        [
          item.reference,
          item.pledger,
          item.borrower,
          item.collateralInfo,
          item.collateralLocation,
          item.contractNumber,
          item.account9131,
        ]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(search));

      const matchesSegment = !segmentFilter || item.segment === segmentFilter;
      const matchesGroup = !groupFilter || item.group === groupFilter;
      const matchesLiquidity = !liquidityFilter || item.liquidity === liquidityFilter;
      const matchesMonitoring = !monitoringFilter || item.monitoringType === monitoringFilter;

      return matchesSearch && matchesSegment && matchesGroup && matchesLiquidity && matchesMonitoring;
    });
  }, [portfolioRows, searchValue, segmentFilter, groupFilter, liquidityFilter, monitoringFilter]);

  const handleOpenDeal = (record: PortfolioRow) => {
    setSelectedDeal(record);
    setDealModalVisible(true);
  };

  const closeDealModal = () => {
    setSelectedDeal(null);
    setDealModalVisible(false);
  };

  const openDossierModal = () => {
    if (!selectedDeal) return;
    const reference = String(selectedDeal.reference ?? selectedDeal.contractNumber ?? '');
    const docs = dossierData.filter(doc => String(doc.reference) === reference);
    setDossierDocuments(docs);
    setDossierModalVisible(true);
  };

  const stats = useMemo(() => {
    const totals = filteredData.reduce(
      (acc, item) => {
        const debt = parseNumber(item.debtRub) ?? 0;
        const marketValue = parseNumber(item.marketValue) ?? 0;
        const collateralValue = parseNumber(item.collateralValue) ?? 0;
        const overdue =
          (parseNumber(item.overduePrincipal) ?? 0) + (parseNumber(item.overdueInterest) ?? 0);

        acc.debt += debt;
        acc.market += marketValue;
        acc.collateral += collateralValue;
        acc.overdue += overdue;

        if (marketValue > 0) {
          acc.ltvSamples += 1;
          acc.ltvSum += Math.min(debt / marketValue, 5); // ограничим выбросы
        }

        return acc;
      },
      { debt: 0, market: 0, collateral: 0, overdue: 0, ltvSum: 0, ltvSamples: 0 },
    );

    const averageLtv = totals.ltvSamples > 0 ? totals.ltvSum / totals.ltvSamples : 0;
    const overdueShare = totals.debt > 0 ? totals.overdue / totals.debt : 0;

    return {
      totalRows: filteredData.length,
      totalDebt: totals.debt,
      totalMarket: totals.market,
      averageLtv,
      overdueShare,
    };
  }, [filteredData]);

  const columns: ColumnsType<PortfolioRow> = useMemo(
    () => [
      {
        title: 'Сделка',
        dataIndex: 'reference',
        key: 'reference',
        width: 220,
        render: (_, record) => (
          <div>
            <div className="portfolio-page__ref">{record.reference ?? '—'}</div>
            <div className="portfolio-page__muted">{record.contractNumber ?? '—'}</div>
            <div className="portfolio-page__tags">
              {record.segment && <Tag>{record.segment}</Tag>}
              {record.group && (
                <Tag color="geekblue" bordered={false}>
                  {record.group}
                </Tag>
              )}
            </div>
          </div>
        ),
      },
      {
        title: 'Компании',
        key: 'company',
        width: 260,
        render: (_, record) => (
          <div>
            <Typography.Text strong>{record.pledger ?? '—'}</Typography.Text>
            <div className="portfolio-page__muted">Заемщик: {record.borrower ?? '—'}</div>
            {record.inn && (
              <div className="portfolio-page__muted">
                ИНН: <Typography.Text code>{record.inn}</Typography.Text>
              </div>
            )}
          </div>
        ),
      },
      {
        title: 'Показатели',
        key: 'metrics',
        width: 240,
        render: (_, record) => {
          const debt = parseNumber(record.debtRub);
          const limit = parseNumber(record.limitRub);
          const collateralValue = parseNumber(record.collateralValue);
          const ltv = debt && collateralValue ? Math.min(debt / collateralValue, 5) : null;

          return (
            <div className="portfolio-page__metrics">
              <div className="portfolio-page__metrics-row">
                <span>Задолженность</span>
                <strong>{debt ? currencyFormatter.format(debt) : '—'}</strong>
              </div>
              <div className="portfolio-page__metrics-row">
                <span>Лимит</span>
                <strong>{limit ? currencyFormatter.format(limit) : '—'}</strong>
              </div>
              <div className="portfolio-page__metrics-row">
                <span>LTV</span>
                <strong>{ltv ? percentFormatter.format(ltv) : '—'}</strong>
              </div>
            </div>
          );
        },
      },
      {
        title: 'Обеспечение',
        key: 'collateral',
        width: 300,
        render: (_, record) => (
          <div>
            <Typography.Text strong>{record.collateralType ?? record.collateralCategory ?? '—'}</Typography.Text>
            {record.collateralPurpose && (
              <div className="portfolio-page__muted">{record.collateralPurpose}</div>
            )}
            <div className="portfolio-page__divider" />
            <div className="portfolio-page__metrics">
              <div className="portfolio-page__metrics-row">
                <span>Рыночная стоимость</span>
                <strong>
                  {parseNumber(record.marketValue) ? currencyFormatter.format(parseNumber(record.marketValue)!) : '—'}
                </strong>
              </div>
              <div className="portfolio-page__metrics-row">
                <span>Залоговая стоимость</span>
                <strong>
                  {parseNumber(record.collateralValue)
                    ? currencyFormatter.format(parseNumber(record.collateralValue)!)
                    : '—'}
                </strong>
              </div>
            </div>
            {record.collateralLocation && (
              <div style={{ marginTop: 6 }}>
                <EnvironmentOutlined style={{ color: '#8c8c8c', marginRight: 4 }} />
                <Typography.Text>{record.collateralLocation}</Typography.Text>
              </div>
            )}
          </div>
        ),
      },
      {
        title: 'Мониторинг',
        key: 'monitoring',
        width: 220,
        render: (_, record) => (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <div>
              {record.liquidity && (
                <Tag color={liquidityColor[record.liquidity] || 'default'}>{record.liquidity}</Tag>
              )}
              {record.qualityCategory && <Tag>{record.qualityCategory}</Tag>}
            </div>
            <div className="portfolio-page__muted">
              Вид мониторинга: <strong>{record.monitoringType ?? '—'}</strong>
            </div>
            <div className="portfolio-page__muted">Последний: {record.lastMonitoringDate ?? '—'}</div>
            <div className="portfolio-page__muted">План: {record.nextMonitoringDate ?? '—'}</div>
          </Space>
        ),
      },
      {
        title: 'Ответственный',
        key: 'owner',
        width: 180,
        render: (_, record) => (
          <div>
            <Typography.Text strong>{record.owner ?? 'Не назначен'}</Typography.Text>
            {record.account9131 && (
              <div className="portfolio-page__muted">
                9131: <Typography.Text code>{record.account9131}</Typography.Text>
              </div>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="portfolio-page">
      <div className="portfolio-page__header">
        <div>
          <Typography.Title level={2} className="portfolio-page__title">
            Залоговый портфель
          </Typography.Title>
          <Typography.Paragraph className="portfolio-page__subtitle">
            Актуальные данные из реестра и дополнительно 100 демо-записей для моделирования сценариев
          </Typography.Paragraph>
        </div>

        <Space size="middle" direction="vertical">
          <Tooltip title="Быстрый поиск по залогам, компаниям и договорам">
            <Input
              allowClear
              size="large"
              placeholder="Поиск по залогам, контрагентам или счету 9131"
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={event => setSearchValue(event.target.value)}
              style={{ width: 360 }}
            />
          </Tooltip>
        </Space>
      </div>

      <Card>
        <div className="portfolio-page__filters">
          <Select
            allowClear
            placeholder="Сегмент"
            style={{ width: 180 }}
            options={filterOptions.segments.map(value => ({ label: value, value }))}
            value={segmentFilter ?? undefined}
            onChange={value => setSegmentFilter(value ?? null)}
          />
          <Select
            allowClear
            placeholder="Группа"
            style={{ width: 180 }}
            options={filterOptions.groups.map(value => ({ label: value, value }))}
            value={groupFilter ?? undefined}
            onChange={value => setGroupFilter(value ?? null)}
          />
          <Select
            allowClear
            placeholder="Ликвидность"
            style={{ width: 180 }}
            options={filterOptions.liquidity.map(value => ({ label: value, value }))}
            value={liquidityFilter ?? undefined}
            onChange={value => setLiquidityFilter(value ?? null)}
          />
          <Select
            allowClear
            placeholder="Вид мониторинга"
            style={{ width: 220 }}
            options={filterOptions.monitoring.map(value => ({ label: value, value }))}
            value={monitoringFilter ?? undefined}
            onChange={value => setMonitoringFilter(value ?? null)}
          />
        </div>
      </Card>

      <Row gutter={[16, 16]} className="portfolio-page__stats">
        <Col xs={24} sm={12} md={6}>
          <Card className="portfolio-page__card">
            <Statistic
              title="Объекты в выдаче"
              value={stats.totalRows}
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#1d39c4' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="portfolio-page__card">
            <Statistic title="Совокупная задолженность" value={currencyFormatter.format(stats.totalDebt)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="portfolio-page__card">
            <Statistic
              title="Рыночная стоимость"
              value={currencyFormatter.format(stats.totalMarket)}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="portfolio-page__card">
            <Statistic
              title="Средний LTV / Просрочка"
              valueRender={() => (
                <div>
                  <div>{percentFormatter.format(stats.averageLtv || 0)}</div>
                  <div className="portfolio-page__muted">
                    просрочка {percentFormatter.format(stats.overdueShare || 0)}
                  </div>
                </div>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card className="portfolio-page__table-card" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          loading={loading}
          onRow={record => ({
            onDoubleClick: () => handleOpenDeal(record),
          })}
          locale={{
            emptyText: <Empty description="Нет записей, удовлетворяющих фильтрам" className="portfolio-page__empty" />,
          }}
        />
      </Card>
      {error && (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить данные залогов"
          description={error}
          action={
            <a onClick={() => window.location.reload()} style={{ fontWeight: 600 }}>
              Повторить
            </a>
          }
        />
      )}
      {loading && (
        <div style={{ textAlign: 'center' }}>
          <Spin tip="Загружаем данные залогов..." />
        </div>
      )}

      <Modal
        title="Карточка сделки"
        open={dealModalVisible}
        onCancel={closeDealModal}
        footer={[
          <Button key="dossier" type="primary" onClick={openDossierModal} disabled={!selectedDeal}>
            Залоговое досье
          </Button>,
          <Button key="close" onClick={closeDealModal}>
            Закрыть
          </Button>,
        ]}
        width="90%"
        style={{ top: 20 }}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {selectedDeal && (
          <div className="portfolio-modal">
            <Typography.Title level={4}>{selectedDeal.borrower ?? selectedDeal.pledger ?? 'Сделка'}</Typography.Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Typography.Text strong>Номер договора:</Typography.Text> {selectedDeal.contractNumber ?? '—'}
              </div>
              <div>
                <Typography.Text strong>Задолженность:</Typography.Text>{' '}
                {selectedDeal.debtRub ? currencyFormatter.format(parseNumber(selectedDeal.debtRub) || 0) : '—'}
              </div>
              <div>
                <Typography.Text strong>Лимит:</Typography.Text>{' '}
                {selectedDeal.limitRub ? currencyFormatter.format(parseNumber(selectedDeal.limitRub) || 0) : '—'}
              </div>
              <div>
                <Typography.Text strong>Обеспечение:</Typography.Text>{' '}
                {selectedDeal.collateralType ?? selectedDeal.collateralCategory ?? '—'}
              </div>
              <div>
                <Typography.Text strong>Местоположение:</Typography.Text>{' '}
                {selectedDeal.collateralLocation ?? '—'}
              </div>
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title="Залоговое досье"
        open={dossierModalVisible}
        onCancel={() => setDossierModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDossierModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
        width={720}
      >
        {dossierLoading ? (
          <Empty description="Загрузка документов..." />
        ) : dossierDocuments.length === 0 ? (
          <Empty description="Документы по сделке не найдены" />
        ) : (
          <List
            dataSource={dossierDocuments}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={item.statusColor || 'blue'}>{item.status}</Tag>
                      <span>{item.docType}</span>
                    </Space>
                  }
                  description={
                    <Typography.Text type="secondary">
                      {item.folderPath.join(' / ')} · {item.lastUpdated}
                    </Typography.Text>
                  }
                />
                <div>
                  <div>{item.fileName}</div>
                  <Typography.Text type="secondary">{item.responsible}</Typography.Text>
                </div>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default PortfolioPage;

