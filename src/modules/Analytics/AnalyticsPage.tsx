import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Select,
  DatePicker,
  Table,
  Tag,
  Statistic,
  Progress,
  Divider,
  Spin,
} from 'antd';
import {
  PieChartOutlined,
  BarChartOutlined,
  LineChartOutlined,
  DollarOutlined,
  DatabaseOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import './AnalyticsPage.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface PortfolioEntry {
  reference: string;
  collateralType: string;
  segment: string;
  group: string;
  debtRub: number;
  collateralValue: number;
  status: string;
  [key: string]: any;
}

interface AnalyticsData {
  portfolioData: PortfolioEntry[];
  totalValue: number;
  totalDebt: number;
}

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    portfolioData: [],
    totalValue: 0,
    totalDebt: 0,
  });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(365, 'day'),
    dayjs(),
  ]);
  const [period, setPeriod] = useState<string>('all');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, period]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const base = import.meta.env.BASE_URL ?? '/';
      const resolvedBase = new URL(base, window.location.origin);
      const normalizedPath = resolvedBase.pathname.endsWith('/')
        ? resolvedBase.pathname
        : `${resolvedBase.pathname}/`;
      const url = `${resolvedBase.origin}${normalizedPath}portfolioData.json?v=${Date.now()}`;
      
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as PortfolioEntry[];

      const totalValue = data.reduce((sum, item) => sum + (parseFloat(String(item.collateralValue || 0)) || 0), 0);
      const totalDebt = data.reduce((sum, item) => sum + (parseFloat(String(item.debtRub || 0)) || 0), 0);

      setAnalyticsData({
        portfolioData: data,
        totalValue,
        totalDebt,
      });
    } catch (error) {
      console.error('Ошибка загрузки данных для аналитики:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Структура портфеля по типам залогового имущества
  const collateralTypeStructure = useMemo(() => {
    const typeMap = new Map<string, { count: number; value: number; debt: number }>();
    
    analyticsData.portfolioData.forEach(item => {
      const type = item.collateralType || 'Не указан';
      const value = parseFloat(String(item.collateralValue || 0)) || 0;
      const debt = parseFloat(String(item.debtRub || 0)) || 0;
      
      if (!typeMap.has(type)) {
        typeMap.set(type, { count: 0, value: 0, debt: 0 });
      }
      
      const stats = typeMap.get(type)!;
      stats.count++;
      stats.value += value;
      stats.debt += debt;
    });

    return Array.from(typeMap.entries())
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        value: stats.value,
        debt: stats.debt,
        share: analyticsData.totalValue > 0 ? (stats.value / analyticsData.totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsData]);

  // 2. Структура по сегментам бизнеса
  const segmentStructure = useMemo(() => {
    const segmentMap = new Map<string, { count: number; value: number; debt: number }>();
    
    analyticsData.portfolioData.forEach(item => {
      const segment = item.segment || 'Не указан';
      const value = parseFloat(String(item.collateralValue || 0)) || 0;
      const debt = parseFloat(String(item.debtRub || 0)) || 0;
      
      if (!segmentMap.has(segment)) {
        segmentMap.set(segment, { count: 0, value: 0, debt: 0 });
      }
      
      const stats = segmentMap.get(segment)!;
      stats.count++;
      stats.value += value;
      stats.debt += debt;
    });

    return Array.from(segmentMap.entries())
      .map(([segment, stats]) => ({
        segment,
        count: stats.count,
        value: stats.value,
        debt: stats.debt,
        share: analyticsData.totalValue > 0 ? (stats.value / analyticsData.totalValue) * 100 : 0,
        coverageRatio: stats.debt > 0 ? (stats.value / stats.debt) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsData]);

  // 3. Анализ просроченной задолженности
  const overdueAnalysis = useMemo(() => {
    const overdueItems = analyticsData.portfolioData.filter(item => {
      // Предполагаем, что просроченные имеют определенный статус или дату
      const status = String(item.status || '').toLowerCase();
      return status.includes('просроч') || status.includes('overdue') || status.includes('проблем');
    });

    const overdueValue = overdueItems.reduce((sum, item) => sum + (parseFloat(String(item.collateralValue || 0)) || 0), 0);
    const overdueDebt = overdueItems.reduce((sum, item) => sum + (parseFloat(String(item.debtRub || 0)) || 0), 0);

    return {
      count: overdueItems.length,
      totalCount: analyticsData.portfolioData.length,
      value: overdueValue,
      debt: overdueDebt,
      share: analyticsData.totalValue > 0 ? (overdueValue / analyticsData.totalValue) * 100 : 0,
      debtShare: analyticsData.totalDebt > 0 ? (overdueDebt / analyticsData.totalDebt) * 100 : 0,
    };
  }, [analyticsData]);

  // 4. Структура по группам
  const groupStructure = useMemo(() => {
    const groupMap = new Map<string, { count: number; value: number; debt: number }>();
    
    analyticsData.portfolioData.forEach(item => {
      const group = item.group || 'Не указана';
      const value = parseFloat(String(item.collateralValue || 0)) || 0;
      const debt = parseFloat(String(item.debtRub || 0)) || 0;
      
      if (!groupMap.has(group)) {
        groupMap.set(group, { count: 0, value: 0, debt: 0 });
      }
      
      const stats = groupMap.get(group)!;
      stats.count++;
      stats.value += value;
      stats.debt += debt;
    });

    return Array.from(groupMap.entries())
      .map(([group, stats]) => ({
        group,
        count: stats.count,
        value: stats.value,
        debt: stats.debt,
        share: analyticsData.totalValue > 0 ? (stats.value / analyticsData.totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const collateralTypeColumns: ColumnsType<any> = [
    {
      title: 'Тип залогового имущества',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Количество',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
    },
    {
      title: 'Стоимость залога',
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Задолженность',
      dataIndex: 'debt',
      key: 'debt',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Доля в портфеле',
      dataIndex: 'share',
      key: 'share',
      align: 'center',
      render: (share) => (
        <div>
          <Text strong>{share.toFixed(2)}%</Text>
          <Progress percent={share} showInfo={false} size="small" style={{ marginTop: 4 }} />
        </div>
      ),
    },
  ];

  const segmentColumns: ColumnsType<any> = [
    {
      title: 'Сегмент бизнеса',
      dataIndex: 'segment',
      key: 'segment',
    },
    {
      title: 'Количество',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
    },
    {
      title: 'Стоимость залога',
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Задолженность',
      dataIndex: 'debt',
      key: 'debt',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Доля в портфеле',
      dataIndex: 'share',
      key: 'share',
      align: 'center',
      render: (share) => `${share.toFixed(2)}%`,
    },
    {
      title: 'Коэффициент покрытия',
      dataIndex: 'coverageRatio',
      key: 'coverageRatio',
      align: 'center',
      render: (ratio) => (
        <Tag color={ratio >= 100 ? 'green' : ratio >= 70 ? 'orange' : 'red'}>
          {ratio.toFixed(1)}%
        </Tag>
      ),
    },
  ];

  const groupColumns: ColumnsType<any> = [
    {
      title: 'Группа',
      dataIndex: 'group',
      key: 'group',
    },
    {
      title: 'Количество',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
    },
    {
      title: 'Стоимость залога',
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Задолженность',
      dataIndex: 'debt',
      key: 'debt',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Доля в портфеле',
      dataIndex: 'share',
      key: 'share',
      align: 'center',
      render: (share) => `${share.toFixed(2)}%`,
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Загрузка аналитики..." />
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <Title level={2}>Аналитика залогового портфеля</Title>
        <Space>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 150 }}
            options={[
              { label: 'Весь период', value: 'all' },
              { label: 'За 7 дней', value: '7days' },
              { label: 'За 30 дней', value: '30days' },
              { label: 'За 90 дней', value: '90days' },
              { label: 'За год', value: '1year' },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null])}
            format="DD.MM.YYYY"
          />
        </Space>
      </div>

      {/* Общие показатели */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Общая стоимость портфеля"
              value={analyticsData.totalValue}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Общая задолженность"
              value={analyticsData.totalDebt}
              prefix={<DatabaseOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Всего договоров"
              value={analyticsData.portfolioData.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Просроченных"
              value={overdueAnalysis.count}
              prefix={<WarningOutlined />}
              suffix={`/ ${overdueAnalysis.totalCount}`}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Анализ просроченной задолженности */}
      <Card
        title={
          <Space>
            <WarningOutlined />
            <span>Анализ просроченной задолженности</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Количество просроченных договоров"
              value={overdueAnalysis.count}
              suffix={`из ${overdueAnalysis.totalCount}`}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Стоимость залога по просроченным"
              value={overdueAnalysis.value}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Просроченная задолженность"
              value={overdueAnalysis.debt}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Доля просроченной задолженности"
              value={overdueAnalysis.debtShare}
              suffix="%"
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
        </Row>
        <Divider />
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Progress
              type="dashboard"
              percent={overdueAnalysis.share}
              format={(percent) => `${percent?.toFixed(1)}%`}
              strokeColor="#cf1322"
            />
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
              Доля просроченных в общей стоимости портфеля
            </Text>
          </Col>
          <Col xs={24} sm={12}>
            <Progress
              type="dashboard"
              percent={overdueAnalysis.debtShare}
              format={(percent) => `${percent?.toFixed(1)}%`}
              strokeColor="#ff4d4f"
            />
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
              Доля просроченной задолженности в общей задолженности
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Структура портфеля по типам залогового имущества */}
      <Card
        title={
          <Space>
            <PieChartOutlined />
            <span>Структура портфеля по типам залогового имущества</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={collateralTypeColumns}
          dataSource={collateralTypeStructure.map((item, index) => ({ ...item, key: index }))}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Структура по сегментам бизнеса */}
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <span>Структура портфеля по сегментам бизнеса</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={segmentColumns}
          dataSource={segmentStructure.map((item, index) => ({ ...item, key: index }))}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Структура по группам */}
      <Card
        title={
          <Space>
            <LineChartOutlined />
            <span>Структура портфеля по группам</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={groupColumns}
          dataSource={groupStructure.map((item, index) => ({ ...item, key: index }))}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default AnalyticsPage;

