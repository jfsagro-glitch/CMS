import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Button,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  message,
  Table,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  LineChartOutlined,
  TrophyOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { KPIData } from '@/types/kpi';
import { REGION_CENTERS } from '@/utils/regionCenters';
import {
  applyKpiOverrides,
  clearCenterMboOverrides,
  clearKpiOverrides,
  cloneKpiData,
  getStoredKpiOverrides,
  loadCenterMboOverrides,
  loadLatestKpiMetrics,
  saveCenterMboOverrides,
  saveKpiOverrides,
} from '@/utils/kpiMetricsStorage';
import './MetricsPage.css';

const { Title, Text } = Typography;

interface CenterMboRecord {
  key: string;
  code: string;
  name: string;
}

const METRIC_FIELDS: Array<{
  name: keyof KPIData;
  label: string;
  min?: number;
  step?: number;
  formatter?: (value: number) => number;
}> = [
  { name: 'totalPortfolioValue', label: 'Общая стоимость портфеля, ₽', min: 0, step: 1000000 },
  { name: 'totalContracts', label: 'Всего договоров', min: 0, step: 1 },
  { name: 'activeContracts', label: 'Активных договоров', min: 0, step: 1 },
  { name: 'completedTasks', label: 'Выполнено задач', min: 0, step: 1 },
  { name: 'pendingTasks', label: 'В работе задач', min: 0, step: 1 },
  { name: 'overdueTasks', label: 'Просрочено задач', min: 0, step: 1 },
  { name: 'totalConclusions', label: 'Залоговых заключений', min: 0, step: 1 },
  { name: 'approvedConclusions', label: 'Согласовано заключений', min: 0, step: 1 },
  { name: 'pendingConclusions', label: 'На согласовании', min: 0, step: 1 },
  { name: 'totalObjects', label: 'Объектов в реестре', min: 0, step: 1 },
  { name: 'totalInsurance', label: 'Всего страховок', min: 0, step: 1 },
  { name: 'activeInsurance', label: 'Активных страховок', min: 0, step: 1 },
];

const SLA_FIELDS = [
  { name: 'averageConclusionDays', label: 'Средний срок подготовки СЗ, дней', min: 0, step: 0.1 },
  { name: 'slaCompliance', label: 'Выполнение SLA, %', min: 0, max: 150, step: 1 },
  { name: 'currentWorkload', label: 'Текущая загрузка, %', min: 0, max: 200, step: 1 },
  { name: 'mboCompletionOverall', label: 'MBO департамента, %', min: 0, max: 200, step: 1 },
];

const MetricsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState<KPIData>(() => cloneKpiData());
  const [centerMbo, setCenterMbo] = useState<Record<string, number>>({});

  useEffect(() => {
    const initialData = loadLatestKpiMetrics() ?? cloneKpiData();
    const overrides = getStoredKpiOverrides();
    const combined = applyKpiOverrides(initialData, overrides || undefined);
    setBaseline(initialData);
    form.setFieldsValue({
      ...combined,
      workloadByPeriod: {
        ...initialData.workloadByPeriod,
        ...(overrides?.workloadByPeriod || {}),
      },
    });
    setCenterMbo(loadCenterMboOverrides());
    setLoading(false);
  }, [form]);

  const centerTableData: CenterMboRecord[] = useMemo(
    () =>
      REGION_CENTERS.map((center) => ({
        key: center.code,
        code: center.code,
        name: center.name,
      })),
    []
  );

  const handleCenterMboChange = (code: string, value: number | null) => {
    setCenterMbo((prev) => {
      const next = { ...prev };
      if (value === null || Number.isNaN(value)) {
        delete next[code];
      } else {
        next[code] = value;
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const overrides = {
        ...values,
        workloadByPeriod: {
          ...baseline.workloadByPeriod,
          ...(values.workloadByPeriod || {}),
        },
      };
      saveKpiOverrides(overrides);
      saveCenterMboOverrides(centerMbo);
      message.success('Метрики KPI и MBO сохранены');
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    form.setFieldsValue({
      ...baseline,
      workloadByPeriod: { ...baseline.workloadByPeriod },
    });
    setCenterMbo({});
    clearKpiOverrides();
    clearCenterMboOverrides();
    message.success('Корректировки сброшены');
  };

  const centerColumns: ColumnsType<CenterMboRecord> = [
    {
      title: 'Региональный центр',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Целевой MBO, %',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      render: (code: string) => (
        <InputNumber
          min={0}
          max={200}
          value={centerMbo[code]}
          onChange={(value) => handleCenterMboChange(code, value)}
          style={{ width: '100%' }}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="metrics-page__loading">
        Загрузка метрик...
      </div>
    );
  }

  return (
    <div className="metrics-page">
      <div className="metrics-page__header">
        <div>
          <Title level={3} style={{ marginBottom: 0 }}>
            Настройка KPI и MBO
          </Title>
          <Text type="secondary">Корректируйте значения, которые отображаются на странице KPI</Text>
        </div>
        <Space>
          <Button icon={<UndoOutlined />} onClick={handleReset}>
            Сбросить
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            Сохранить
          </Button>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Внесенные значения применяются как корректировки поверх фактических данных KPI."
      />

      <Form layout="vertical" form={form}>
        <Card
          title={
            <Space>
              <LineChartOutlined />
              <span>Основные метрики</span>
            </Space>
          }
          size="small"
          className="metrics-card"
        >
          <Row gutter={[16, 16]}>
            {METRIC_FIELDS.map((field) => (
              <Col xs={24} sm={12} lg={8} key={field.name}>
                <Form.Item
                  name={field.name}
                  label={field.label}
                  rules={[{ required: true, message: 'Укажите значение' }]}
                >
                  <InputNumber
                    min={field.min ?? 0}
                    step={field.step ?? 1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>

        <Card
          title={
            <Space>
              <SettingOutlined />
              <span>Показатели SLA и загрузки</span>
            </Space>
          }
          size="small"
          className="metrics-card"
        >
          <Row gutter={[16, 16]}>
            {SLA_FIELDS.map((field) => (
              <Col xs={24} sm={12} lg={6} key={field.name}>
                <Form.Item
                  name={field.name}
                  label={field.label}
                  rules={[{ required: true, message: 'Укажите значение' }]}
                >
                  <InputNumber
                    min={field.min ?? 0}
                    max={field.max}
                    step={field.step ?? 1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            ))}
            <Col xs={24} sm={8}>
              <Form.Item
                name={['workloadByPeriod', 'last7Days']}
                label="Загрузка за 7 дней, %"
                rules={[{ required: true, message: 'Укажите значение' }]}
              >
                <InputNumber min={0} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name={['workloadByPeriod', 'last30Days']}
                label="Загрузка за 30 дней, %"
                rules={[{ required: true, message: 'Укажите значение' }]}
              >
                <InputNumber min={0} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name={['workloadByPeriod', 'last90Days']}
                label="Загрузка за 90 дней, %"
                rules={[{ required: true, message: 'Укажите значение' }]}
              >
                <InputNumber min={0} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <Space>
              <TrophyOutlined />
              <span>Настройка MBO</span>
            </Space>
          }
          size="small"
          className="metrics-card"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="mboCompletionOverall"
                label="MBO департамента, %"
                rules={[{ required: true, message: 'Укажите значение' }]}
              >
                <InputNumber min={0} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Table
            columns={centerColumns}
            dataSource={centerTableData}
            pagination={false}
            size="small"
          />
        </Card>
      </Form>
    </div>
  );
};

export default MetricsPage;

