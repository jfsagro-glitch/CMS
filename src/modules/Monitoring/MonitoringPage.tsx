import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Badge,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CalendarOutlined, ClockCircleOutlined, SearchOutlined, EyeOutlined, DollarOutlined, SettingOutlined } from '@ant-design/icons';
import type { MonitoringPlanEntry, MonitoringTimeframe, RevaluationPlanEntry } from '@/types/monitoring';
import MonitoringCardModal from '@/components/MonitoringCardModal/MonitoringCardModal';
import MonitoringSettings from './MonitoringSettings';
import { extendedStorageService } from '@/services/ExtendedStorageService';
import { generateMonitoringPlan, generateRevaluationPlan } from '@/utils/monitoringPlanGenerator';
import './MonitoringPage.css';

dayjs.extend(relativeTime);

type TableRow = MonitoringPlanEntry & { key: string; daysUntil: number; statusColor: string };
type RevaluationTableRow = RevaluationPlanEntry & { key: string; daysUntil: number; statusColor: string };

const timeframeOptions: { label: string; value: MonitoringTimeframe | 'all' }[] = [
  { label: 'Все', value: 'all' },
  { label: 'Просрочено', value: 'overdue' },
  { label: '7 дней', value: 'week' },
  { label: '30 дней', value: 'month' },
  { label: '90 дней', value: 'quarter' },
];

const MonitoringPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('monitoring');
  
  // Monitoring plan state
  const [plan, setPlan] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timeframeFilter, setTimeframeFilter] = useState<MonitoringTimeframe | 'all'>('week');
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [methodFilter, setMethodFilter] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [guidelinesVisible, setGuidelinesVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TableRow | null>(null);
  const [cardModalVisible, setCardModalVisible] = useState(false);

  // Revaluation plan state
  const [revaluationPlan, setRevaluationPlan] = useState<RevaluationTableRow[]>([]);
  const [revaluationLoading, setRevaluationLoading] = useState(true);
  const [revaluationError, setRevaluationError] = useState<string | null>(null);
  const [revaluationTimeframeFilter, setRevaluationTimeframeFilter] = useState<MonitoringTimeframe | 'all'>('week');
  const [revaluationSearchValue, setRevaluationSearchValue] = useState('');
  const [revaluationTypeFilter, setRevaluationTypeFilter] = useState<string | null>(null);
  const [revaluationMethodFilter, setRevaluationMethodFilter] = useState<string | null>(null);
  const [revaluationOwnerFilter, setRevaluationOwnerFilter] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Загружаем карточки обеспечения из IndexedDB
        const cards = await extendedStorageService.getExtendedCards();
        
        if (!mounted) return;

        // Генерируем план мониторинга на основе карточек
        const monitoringEntries = generateMonitoringPlan(cards);

        const enriched: TableRow[] = monitoringEntries.map((item, index) => {
          const planned = dayjs(item.plannedDate, 'DD.MM.YYYY');
          const daysUntil = planned.diff(dayjs(), 'day');
          let statusColor = '#1677ff';
          if (daysUntil < 0) statusColor = '#f5222d';
          else if (daysUntil <= 7) statusColor = '#fa8c16';
          else if (daysUntil <= 30) statusColor = '#52c41a';

          return {
            ...item,
            key: `${item.reference ?? 'ref'}-${index}`,
            daysUntil,
            statusColor,
          };
        });

        setPlan(enriched);
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

  const typeOptions = useMemo(() => {
    const values = Array.from(new Set(plan.map(item => item.baseType))).filter(Boolean);
    return values.map(value => ({ value, label: value }));
  }, [plan]);

  const methodOptions = useMemo(() => {
    const values = Array.from(new Set(plan.map(item => item.monitoringMethod))).filter(Boolean);
    return values.map(value => ({ value, label: value }));
  }, [plan]);

  const ownerOptions = useMemo(() => {
    const values = Array.from(new Set(plan.map(item => item.owner))).filter(Boolean);
    return values.map(value => ({ value, label: value }));
  }, [plan]);

  const filteredPlan = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    return plan.filter(entry => {
      const matchesSearch =
        !search ||
        [
          entry.reference,
          entry.borrower,
          entry.pledger,
          entry.segment,
          entry.owner,
          entry.monitoringType,
        ]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(search));

      const matchesTimeframe = timeframeFilter === 'all' || entry.timeframe === timeframeFilter;
      const matchesType = !typeFilter || entry.baseType === typeFilter;
      const matchesMethod = !methodFilter || entry.monitoringMethod === methodFilter;
      const matchesOwner = !ownerFilter || entry.owner === ownerFilter;

      return matchesSearch && matchesTimeframe && matchesType && matchesMethod && matchesOwner;
    });
  }, [plan, searchValue, timeframeFilter, typeFilter, methodFilter, ownerFilter]);

  const stats = useMemo(() => {
    const counters = {
      overdue: 0,
      week: 0,
      month: 0,
      quarter: 0,
      total: plan.length,
    };
    plan.forEach(item => {
      if (item.timeframe in counters) {
        counters[item.timeframe as keyof typeof counters] += 1;
      }
    });
    return counters;
  }, [plan]);

  const columns: ColumnsType<TableRow> = useMemo(() => [
    {
      title: 'Сделка',
      dataIndex: 'reference',
      key: 'reference',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.reference ?? '—'}</Typography.Text>
          <div className="monitoring-muted">{record.borrower ?? record.pledger ?? 'Не указан'}</div>
          <div className="monitoring-muted">
            {record.segment ?? '—'} · {record.group ?? '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Обеспечение',
      dataIndex: 'baseType',
      key: 'baseType',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.baseType}</Typography.Text>
          <div className="monitoring-muted">{record.collateralType}</div>
          {record.liquidity && <Tag>{record.liquidity}</Tag>}
        </div>
      ),
    },
    {
      title: 'План мониторинга',
      dataIndex: 'plannedDate',
      key: 'plannedDate',
      width: 220,
      render: (_, record) => (
        <div>
          <Badge color={record.statusColor} />
          <Typography.Text style={{ marginLeft: 8 }}>{record.plannedDate}</Typography.Text>
          <div className="monitoring-muted">
            Последний: {record.lastMonitoringDate} · каждые {record.frequencyMonths} мес.
          </div>
          <div className="monitoring-trend">
            <ClockCircleOutlined />
            {record.daysUntil < 0 ? (
              <span>Просрочен на {Math.abs(record.daysUntil)} дн.</span>
            ) : (
              <span>Через {record.daysUntil} дн.</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Вид/метод мониторинга',
      dataIndex: 'monitoringType',
      key: 'monitoringType',
      width: 240,
      render: (_, record) => (
        <div>
          {record.monitoringType && <Tag color="blue">{record.monitoringType}</Tag>}
          <div className="monitoring-muted">{record.monitoringMethod}</div>
        </div>
      ),
    },
    {
      title: 'Ответственный',
      dataIndex: 'owner',
      key: 'owner',
      width: 180,
      render: value => <Typography.Text>{value}</Typography.Text>,
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 160,
      render: value => <span>{value ?? '—'}</span>,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="Открыть карточку мониторинга">
          <a
            onClick={() => {
              setSelectedEntry(record);
              setCardModalVisible(true);
            }}
          >
            <EyeOutlined /> Открыть
          </a>
        </Tooltip>
      ),
    },
  ], [setSelectedEntry, setCardModalVisible]);

  // Load revaluation plan
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setRevaluationLoading(true);
      setRevaluationError(null);
      try {
        // Загружаем карточки обеспечения из IndexedDB
        const cards = await extendedStorageService.getExtendedCards();
        
        if (!mounted) return;

        // Генерируем план переоценок на основе карточек
        const revaluationEntries = generateRevaluationPlan(cards);

        const enriched: RevaluationTableRow[] = revaluationEntries.map((item, index) => {
          const planned = dayjs(item.plannedDate, 'DD.MM.YYYY');
          const daysUntil = planned.diff(dayjs(), 'day');
          let statusColor = '#1677ff';
          if (daysUntil < 0) statusColor = '#f5222d';
          else if (daysUntil <= 7) statusColor = '#fa8c16';
          else if (daysUntil <= 30) statusColor = '#52c41a';

          return {
            ...item,
            key: `${item.reference ?? 'ref'}-${index}`,
            daysUntil,
            statusColor,
          };
        });

        setRevaluationPlan(enriched);
      } catch (fetchError) {
        setRevaluationError(fetchError instanceof Error ? fetchError.message : 'Неизвестная ошибка');
      } finally {
        if (mounted) {
          setRevaluationLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const revaluationTypeOptions = useMemo(() => {
    const values = Array.from(new Set(revaluationPlan.map(item => item.baseType))).filter(Boolean);
    return values.map(value => ({ value, label: value }));
  }, [revaluationPlan]);

  const revaluationMethodOptions = useMemo(() => {
    const values = Array.from(new Set(revaluationPlan.map(item => item.revaluationMethod))).filter(Boolean);
    return values.map(value => ({ value, label: value }));
  }, [revaluationPlan]);

  const revaluationOwnerOptions = useMemo(() => {
    const values = Array.from(new Set(revaluationPlan.map(item => item.owner))).filter(Boolean);
    return values.map(value => ({ value, label: value }));
  }, [revaluationPlan]);

  const filteredRevaluationPlan = useMemo(() => {
    const search = revaluationSearchValue.trim().toLowerCase();

    return revaluationPlan.filter(entry => {
      const matchesSearch =
        !search ||
        [
          entry.reference,
          entry.borrower,
          entry.pledger,
          entry.segment,
          entry.owner,
          entry.revaluationMethod,
        ]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(search));

      const matchesTimeframe = revaluationTimeframeFilter === 'all' || entry.timeframe === revaluationTimeframeFilter;
      const matchesType = !revaluationTypeFilter || entry.baseType === revaluationTypeFilter;
      const matchesMethod = !revaluationMethodFilter || entry.revaluationMethod === revaluationMethodFilter;
      const matchesOwner = !revaluationOwnerFilter || entry.owner === revaluationOwnerFilter;

      return matchesSearch && matchesTimeframe && matchesType && matchesMethod && matchesOwner;
    });
  }, [revaluationPlan, revaluationSearchValue, revaluationTimeframeFilter, revaluationTypeFilter, revaluationMethodFilter, revaluationOwnerFilter]);

  const revaluationStats = useMemo(() => {
    const counters = {
      overdue: 0,
      week: 0,
      month: 0,
      quarter: 0,
      total: revaluationPlan.length,
    };
    revaluationPlan.forEach(item => {
      if (item.timeframe in counters) {
        counters[item.timeframe as keyof typeof counters] += 1;
      }
    });
    return counters;
  }, [revaluationPlan]);

  const revaluationColumns: ColumnsType<RevaluationTableRow> = useMemo(() => [
    {
      title: 'Сделка',
      dataIndex: 'reference',
      key: 'reference',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.reference ?? '—'}</Typography.Text>
          <div className="monitoring-muted">{record.borrower ?? record.pledger ?? 'Не указан'}</div>
          <div className="monitoring-muted">
            {record.segment ?? '—'} · {record.group ?? '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Обеспечение',
      dataIndex: 'baseType',
      key: 'baseType',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.baseType}</Typography.Text>
          <div className="monitoring-muted">{record.collateralType}</div>
        </div>
      ),
    },
    {
      title: 'План переоценки',
      dataIndex: 'plannedDate',
      key: 'plannedDate',
      width: 220,
      render: (_, record) => (
        <div>
          <Badge color={record.statusColor} />
          <Typography.Text style={{ marginLeft: 8 }}>{record.plannedDate}</Typography.Text>
          <div className="monitoring-muted">
            Последняя: {record.lastRevaluationDate} · каждые {record.frequencyMonths} мес.
          </div>
          <div className="monitoring-trend">
            <ClockCircleOutlined />
            {record.daysUntil < 0 ? (
              <span>Просрочен на {Math.abs(record.daysUntil)} дн.</span>
            ) : (
              <span>Через {record.daysUntil} дн.</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Стоимость',
      dataIndex: 'collateralValue',
      key: 'collateralValue',
      width: 180,
      render: (_, record) => (
        <div>
          {record.collateralValue && (
            <div>
              <Typography.Text>Залог: {record.collateralValue.toLocaleString('ru-RU')} ₽</Typography.Text>
            </div>
          )}
          {record.marketValue && (
            <div className="monitoring-muted">
              Рыночная: {record.marketValue.toLocaleString('ru-RU')} ₽
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Метод переоценки',
      dataIndex: 'revaluationMethod',
      key: 'revaluationMethod',
      width: 200,
      render: value => value ? <Tag color="purple">{value}</Tag> : <span>—</span>,
    },
    {
      title: 'Ответственный',
      dataIndex: 'owner',
      key: 'owner',
      width: 180,
      render: value => <Typography.Text>{value}</Typography.Text>,
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 160,
      render: value => <span>{value ?? '—'}</span>,
    },
  ], []);

  const renderMonitoringPlan = useCallback(() => (
    <>
      <div className="monitoring-page__header">
        <div>
          <Typography.Title level={2} className="monitoring-page__title">
            План мониторинга Обеспечения
          </Typography.Title>
          <Typography.Paragraph className="monitoring-page__subtitle">
            Формирование недельного, месячного и квартального графика выездов и документарных
            проверок по всем видам залогов.
          </Typography.Paragraph>
        </div>
        <Tooltip title="Поиск по сделке, клиенту, ИНН или ответственному">
          <Input
            allowClear
            size="large"
            placeholder="Поиск по сделкам и клиентам"
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
            <Statistic
              title="Просрочено"
              value={stats.overdue}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="7 дней" value={stats.week} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="30 дней" value={stats.month} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="90 дней" value={stats.quarter} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
      </Row>

      <Card className="monitoring-page__filters">
        <Space size="middle" wrap>
          <Radio.Group
            options={timeframeOptions}
            value={timeframeFilter}
            onChange={event => setTimeframeFilter(event.target.value)}
            optionType="button"
            buttonStyle="solid"
          />
          <Select
            allowClear
            placeholder="Тип обеспечения"
            style={{ minWidth: 200 }}
            options={typeOptions}
            value={typeFilter ?? undefined}
            onChange={value => setTypeFilter(value ?? null)}
          />
          <Select
            allowClear
            placeholder="Метод мониторинга"
            style={{ minWidth: 200 }}
            options={methodOptions}
            value={methodFilter ?? undefined}
            onChange={value => setMethodFilter(value ?? null)}
          />
          <Select
            allowClear
            placeholder="Ответственный"
            style={{ minWidth: 200 }}
            options={ownerOptions}
            value={ownerFilter ?? undefined}
            onChange={value => setOwnerFilter(value ?? null)}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card bodyStyle={{ padding: 0 }} className="monitoring-page__table-card">
            <div className="monitoring-page__table-actions">
              <Space>
                <Tooltip title="Рекомендации по периодичности мониторинга">
                  <a onClick={() => setGuidelinesVisible(true)}>Рекомендации</a>
                </Tooltip>
              </Space>
            </div>
            <Table
              columns={columns}
              dataSource={filteredPlan}
              pagination={{ pageSize: 15, showSizeChanger: false }}
              scroll={{ x: 1200 }}
              loading={loading}
              onRow={record => ({
                onDoubleClick: () => {
                  setSelectedEntry(record);
                  setCardModalVisible(true);
                },
                style: { cursor: 'pointer' },
              })}
              locale={{
                emptyText: loading ? (
                  <Empty description="Загрузка..." />
                ) : (
                  <Empty description="Нет задач" />
                ),
              }}
            />
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить план мониторинга"
          description={error}
          action={
            <a onClick={() => window.location.reload()} style={{ fontWeight: 600 }}>
              Повторить
            </a>
          }
        />
      )}

      <Modal
        title="Рекомендации по периодичности мониторинга"
        open={guidelinesVisible}
        onCancel={() => setGuidelinesVisible(false)}
        onOk={() => setGuidelinesVisible(false)}
        okText="Понятно"
        cancelText="Закрыть"
      >
        <ul className="monitoring-guidelines">
          <li>Недвижимость — не реже 1 раза в 12 месяцев.</li>
          <li>Транспорт/оборудование без страхования — каждые 6 месяцев.</li>
          <li>Транспорт/оборудование со страхованием — каждые 12 месяцев.</li>
          <li>Товары и сырье — каждые 3 месяца (формальное обеспечение документарно).</li>
          <li>Имущественные права — каждые 6 месяцев.</li>
          <li>Ценные бумаги и доли — ежегодно, документарно.</li>
        </ul>
        <Typography.Paragraph className="monitoring-muted">
          При наличии решения УО/УЛ используется индивидуальный график. Документарные проверки включают
          ЕГРН, реестры залогов, выписки счетов депо и онлайн-проверку транспортных средств.
        </Typography.Paragraph>
      </Modal>

      <MonitoringCardModal
        visible={cardModalVisible}
        entry={selectedEntry}
        onClose={() => {
          setCardModalVisible(false);
          setSelectedEntry(null);
        }}
      />
    </>
  ), [searchValue, stats, timeframeFilter, typeFilter, methodFilter, ownerFilter, filteredPlan, loading, error, guidelinesVisible, cardModalVisible, selectedEntry, typeOptions, methodOptions, ownerOptions, columns]);

  const renderRevaluationPlan = useCallback(() => (
    <>
      <div className="monitoring-page__header">
        <div>
          <Typography.Title level={2} className="monitoring-page__title">
            План переоценок Обеспечения
          </Typography.Title>
          <Typography.Paragraph className="monitoring-page__subtitle">
            Формирование графика переоценок залогового имущества для актуализации стоимости обеспечения.
          </Typography.Paragraph>
        </div>
        <Tooltip title="Поиск по сделке, клиенту, ИНН или ответственному">
          <Input
            allowClear
            size="large"
            placeholder="Поиск по сделкам и клиентам"
            prefix={<SearchOutlined />}
            value={revaluationSearchValue}
            onChange={event => setRevaluationSearchValue(event.target.value)}
            style={{ width: 360 }}
          />
        </Tooltip>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Просрочено"
              value={revaluationStats.overdue}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="7 дней" value={revaluationStats.week} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="30 дней" value={revaluationStats.month} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="90 дней" value={revaluationStats.quarter} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
      </Row>

      <Card className="monitoring-page__filters">
        <Space size="middle" wrap>
          <Radio.Group
            options={timeframeOptions}
            value={revaluationTimeframeFilter}
            onChange={event => setRevaluationTimeframeFilter(event.target.value)}
            optionType="button"
            buttonStyle="solid"
          />
          <Select
            allowClear
            placeholder="Тип обеспечения"
            style={{ minWidth: 200 }}
            options={revaluationTypeOptions}
            value={revaluationTypeFilter ?? undefined}
            onChange={value => setRevaluationTypeFilter(value ?? null)}
          />
          <Select
            allowClear
            placeholder="Метод переоценки"
            style={{ minWidth: 200 }}
            options={revaluationMethodOptions}
            value={revaluationMethodFilter ?? undefined}
            onChange={value => setRevaluationMethodFilter(value ?? null)}
          />
          <Select
            allowClear
            placeholder="Ответственный"
            style={{ minWidth: 200 }}
            options={revaluationOwnerOptions}
            value={revaluationOwnerFilter ?? undefined}
            onChange={value => setRevaluationOwnerFilter(value ?? null)}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card bodyStyle={{ padding: 0 }} className="monitoring-page__table-card">
            <Table
              columns={revaluationColumns}
              dataSource={filteredRevaluationPlan}
              pagination={{ pageSize: 15, showSizeChanger: false }}
              scroll={{ x: 1200 }}
              loading={revaluationLoading}
              locale={{
                emptyText: revaluationLoading ? (
                  <Empty description="Загрузка..." />
                ) : (
                  <Empty description="Нет задач" />
                ),
              }}
            />
          </Card>
        </Col>
      </Row>

      {revaluationError && (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить план переоценок"
          description={revaluationError}
          action={
            <a onClick={() => window.location.reload()} style={{ fontWeight: 600 }}>
              Повторить
            </a>
          }
        />
      )}
    </>
  ), [revaluationSearchValue, revaluationStats, revaluationTimeframeFilter, revaluationTypeFilter, revaluationMethodFilter, revaluationOwnerFilter, filteredRevaluationPlan, revaluationLoading, revaluationError, revaluationTypeOptions, revaluationMethodOptions, revaluationOwnerOptions, revaluationColumns]);

  return (
    <div className="monitoring-page">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'monitoring',
            label: (
              <span>
                <CalendarOutlined />
                План мониторинга обеспечения
              </span>
            ),
            children: renderMonitoringPlan(),
          },
          {
            key: 'revaluation',
            label: (
              <span>
                <DollarOutlined />
                План переоценок Обеспечения
              </span>
            ),
            children: renderRevaluationPlan(),
          },
          {
            key: 'settings',
            label: (
              <span>
                <SettingOutlined />
                Настройка
              </span>
            ),
            children: <MonitoringSettings />,
          },
        ]}
      />
    </div>
  );
};

export default MonitoringPage;
