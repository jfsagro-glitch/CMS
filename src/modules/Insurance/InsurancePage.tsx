import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, Empty, Input, Modal, Row, Select, Space, Spin, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, SafetyCertificateOutlined, FundOutlined } from '@ant-design/icons';
import type { InsuranceRecord } from '@/types/insurance';
import './InsurancePage.css';

type InsuranceRow = InsuranceRecord & { key: string };

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const InsurancePage: React.FC = () => {
  const [rows, setRows] = useState<InsuranceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [insurerFilter, setInsurerFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<InsuranceRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Prefill search from query (?ref=... or ?q=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || params.get('ref') || '';
      if (q) setSearch(q);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.BASE_URL ?? '/';
        const resolvedBase = new URL(base, window.location.origin);
        const path = resolvedBase.pathname.endsWith('/') ? resolvedBase.pathname : `${resolvedBase.pathname}/`;
        const url = `${resolvedBase.origin}${path}insuranceData.json?v=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Не удалось загрузить страхование (${res.status})`);
        const data = (await res.json()) as InsuranceRecord[];
        if (!mounted) return;
        setRows(
          data.map((r, i) => ({
            ...r,
            key: `ins-${i}`,
            reference: r.reference != null ? String(r.reference) : null,
          })),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filterOptions = useMemo(() => {
    const unique = <K extends keyof InsuranceRecord>(k: K) =>
      Array.from(
        new Set(
          rows
            .map(r => r[k])
            .filter((v): v is string => typeof v === 'string' && v.trim().length > 0),
        ),
      ).sort();
    return {
      types: unique('insuranceType'),
      statuses: unique('status'),
      insurers: unique('insurer'),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter(r => {
      const matchesSearch =
        !needle ||
        [r.policyNumber, r.insured, r.contractNumber, r.reference, r.insurer, r.insuranceType]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(needle));
      const matchesType = !typeFilter || r.insuranceType === typeFilter;
      const matchesStatus = !statusFilter || r.status === statusFilter;
      const matchesInsurer = !insurerFilter || r.insurer === insurerFilter;
      return matchesSearch && matchesType && matchesStatus && matchesInsurer;
    });
  }, [rows, search, typeFilter, statusFilter, insurerFilter]);

  const stats = useMemo(() => {
    const totalPolicies = filtered.length;
    const totalInsured = filtered.reduce((sum, r) => {
      const n = typeof r.insuredAmount === 'number' ? r.insuredAmount : Number(String(r.insuredAmount ?? '').replace(/\s/g, '').replace(',', '.'));
      return sum + (Number.isFinite(n) ? (n as number) : 0);
    }, 0);
    const totalPremium = filtered.reduce((sum, r) => {
      const n = typeof r.premium === 'number' ? r.premium : Number(String(r.premium ?? '').replace(/\s/g, '').replace(',', '.'));
      return sum + (Number.isFinite(n) ? (n as number) : 0);
    }, 0);
    return { totalPolicies, totalInsured, totalPremium };
  }, [filtered]);

  const columns: ColumnsType<InsuranceRow> = useMemo(
    () => [
      {
        title: 'Полис',
        dataIndex: 'policyNumber',
        key: 'policy',
        width: 200,
        render: (_, r) => (
          <div>
            <div style={{ fontWeight: 600 }}>{r.policyNumber}</div>
            <div className="insurance-muted">{r.insuranceType}</div>
          </div>
        ),
      },
      {
        title: 'Сделка',
        key: 'deal',
        width: 220,
        render: (_, r) => (
          <div>
            <div className="insurance-muted">REFERENCE: {r.reference ?? '—'}</div>
            <div className="insurance-muted">Договор: {r.contractNumber ?? '—'}</div>
          </div>
        ),
      },
      {
        title: 'Страхователь',
        key: 'insured',
        width: 260,
        render: (_, r) => (
          <div>
            <Typography.Text strong>{r.insured ?? '—'}</Typography.Text>
            <div className="insurance-muted">{r.insurer}</div>
          </div>
        ),
      },
      {
        title: 'Суммы',
        key: 'amounts',
        width: 260,
        render: (_, r) => (
          <div className="insurance-metrics">
            <div className="insurance-metrics-row">
              <span>Страховая сумма</span>
              <strong>
                {r.insuredAmount ? currencyFormatter.format(Number(String(r.insuredAmount).replace(/\s/g, '').replace(',', '.'))) : '—'}
              </strong>
            </div>
            <div className="insurance-metrics-row">
              <span>Премия</span>
              <strong>
                {r.premium ? currencyFormatter.format(Number(String(r.premium).replace(/\s/g, '').replace(',', '.'))) : '—'}
              </strong>
            </div>
          </div>
        ),
      },
      {
        title: 'Срок',
        key: 'term',
        width: 220,
        render: (_, r) => (
          <div>
            <div className="insurance-muted">Начало: {r.startDate ?? '—'}</div>
            <div className="insurance-muted">Окончание: {r.endDate ?? '—'}</div>
          </div>
        ),
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        width: 160,
        render: (v: string) => {
          const color =
            v === 'Активен' ? 'green' : v === 'Требует продления' ? 'orange' : v === 'Истек' ? 'volcano' : 'default';
          return <Tag color={color}>{v}</Tag>;
        },
      },
    ],
    [],
  );

  return (
    <div className="insurance-page">
      <div className="insurance-header">
        <div>
          <Typography.Title level={2} className="insurance-title">
            Страхование
          </Typography.Title>
          <Typography.Paragraph className="insurance-subtitle">
            Полисы страхования, связанные с договорами залогового портфеля
          </Typography.Paragraph>
        </div>
        <Space size="middle" direction="vertical">
          <Tooltip title="Поиск по полисам, клиентам, договорам">
            <Input
              allowClear
              size="large"
              placeholder="Поиск по полисам, клиентам, REFERENCE"
              prefix={<SearchOutlined />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 360 }}
            />
          </Tooltip>
        </Space>
      </div>

      <Card>
        <div className="insurance-filters">
          <Select
            allowClear
            placeholder="Вид страхования"
            style={{ width: 200 }}
            options={filterOptions.types.map(v => ({ label: v, value: v }))}
            value={typeFilter ?? undefined}
            onChange={v => setTypeFilter(v ?? null)}
          />
          <Select
            allowClear
            placeholder="Статус"
            style={{ width: 200 }}
            options={filterOptions.statuses.map(v => ({ label: v, value: v }))}
            value={statusFilter ?? undefined}
            onChange={v => setStatusFilter(v ?? null)}
          />
          <Select
            allowClear
            placeholder="Страховщик"
            style={{ width: 200 }}
            options={filterOptions.insurers.map(v => ({ label: v, value: v }))}
            value={insurerFilter ?? undefined}
            onChange={v => setInsurerFilter(v ?? null)}
          />
        </div>
      </Card>

      <Row gutter={[16, 16]} className="insurance-stats">
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Количество полисов" value={stats.totalPolicies} prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Совокупная страховая сумма" value={currencyFormatter.format(stats.totalInsured)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Совокупная премия" value={currencyFormatter.format(stats.totalPremium)} prefix={<FundOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card className="insurance-table-card" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          loading={loading}
          onRow={record => ({
            onDoubleClick: () => {
              setSelected(record);
              setModalOpen(true);
            },
          })}
          locale={{
            emptyText: <Empty description="Нет записей, удовлетворяющих фильтрам" className="insurance-empty" />,
          }}
        />
      </Card>
      {error && (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить страховые данные"
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
          <Spin tip="Загружаем страховые данные..." />
        </div>
      )}

      <Modal
        title="Карточка полиса"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={720}
      >
        {selected && (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Typography.Text strong>Полис:</Typography.Text> {selected.policyNumber}
            <div className="insurance-muted">Тип: {selected.insuranceType}</div>
            <div className="insurance-muted">Страхователь: {selected.insured ?? '—'}</div>
            <div className="insurance-muted">REFERENCE сделки: {selected.reference ?? '—'}</div>
            <div className="insurance-muted">Договор: {selected.contractNumber ?? '—'}</div>
            <div className="insurance-muted">
              Страховая сумма: {typeof selected.insuredAmount === 'number' ? currencyFormatter.format(selected.insuredAmount) : '—'}
            </div>
            <div className="insurance-muted">
              Премия: {typeof selected.premium === 'number' ? currencyFormatter.format(selected.premium) : '—'}
            </div>
            <div className="insurance-muted">Срок: {selected.startDate ?? '—'} — {selected.endDate ?? '—'}</div>
            <div className="insurance-muted">Страховщик: {selected.insurer}</div>
            <div>
              <Tag>{selected.status}</Tag>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default InsurancePage;


