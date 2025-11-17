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
  collateralCategory?: string; // Категория обеспечения из карточки сделки
  segment: string;
  group: string;
  debtRub: number;
  collateralValue: number;
  status: string;
  createdAt?: string;
  contractDate?: string;
  [key: string]: any;
}

// Функция для определения категории имущества по типу
const getPropertyCategory = (collateralType: string | null | undefined): string => {
  if (!collateralType) return 'Прочее';
  
  const type = String(collateralType).toLowerCase();
  
  // Жилая недвижимость
  if (
    type.includes('квартир') ||
    type.includes('комнат') ||
    type.includes('жилой дом') ||
    type.includes('таунхаус') ||
    type.includes('жилая') ||
    type === 'apartment' ||
    type === 'room' ||
    type === 'house' ||
    type === 'townhouse' ||
    type === 'land_residential'
  ) {
    return 'НЕДВИЖИМОСТЬ ЖИЛАЯ';
  }
  
  // Нежилая недвижимость
  if (
    type.includes('офис') ||
    type.includes('торгов') ||
    type.includes('склад') ||
    type.includes('гостиниц') ||
    type.includes('отель') ||
    type.includes('кафе') ||
    type.includes('ресторан') ||
    type.includes('азс') ||
    type.includes('автосалон') ||
    type.includes('производств') ||
    type.includes('цех') ||
    type.includes('нежилая') ||
    type.includes('коммерческая') ||
    type.includes('промышленная') ||
    type === 'office' ||
    type === 'retail' ||
    type === 'warehouse' ||
    type === 'hotel' ||
    type === 'catering' ||
    type === 'gas_station' ||
    type === 'car_dealership' ||
    type === 'industrial_building' ||
    type === 'workshop'
  ) {
    return 'НЕДВИЖИМОСТЬ НЕЖИЛАЯ';
  }
  
  // Оборудование
  if (
    type.includes('оборудован') ||
    type === 'equipment'
  ) {
    return 'ОБОРУДОВАНИЕ';
  }
  
  // Транспортные средства
  if (
    type.includes('автомобиль') ||
    type.includes('легков') ||
    type.includes('грузов') ||
    type.includes('транспорт') ||
    type === 'car_passenger' ||
    type === 'car_truck'
  ) {
    return 'ТРАНСПОРТНЫЕ СРЕДСТВА';
  }
  
  // Спецтехника
  if (
    type.includes('спецтехник') ||
    type.includes('техник') ||
    type === 'machinery'
  ) {
    return 'СПЕЦТЕХНИКА';
  }
  
  // Товары в обороте
  if (
    type.includes('товар') ||
    type.includes('оборот')
  ) {
    return 'ТОВАРЫ В ОБОРОТЕ';
  }
  
  return 'Прочее';
};

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

  // 1. Структура портфеля по категориям имущества (используем "Категория обеспечения" из карточек сделок)
  const propertyCategoryStructure = useMemo(() => {
    const categoryMap = new Map<string, { count: number; value: number; debt: number }>();
    
    analyticsData.portfolioData.forEach(item => {
      // Используем поле collateralCategory (Категория обеспечения) из карточки сделки
      // Если его нет, используем автоматическое определение по типу имущества
      const category = item.collateralCategory || getPropertyCategory(item.collateralType) || 'Не указана';
      const value = parseFloat(String(item.collateralValue || 0)) || 0;
      const debt = parseFloat(String(item.debtRub || 0)) || 0;
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, value: 0, debt: 0 });
      }
      
      const stats = categoryMap.get(category)!;
      stats.count++;
      stats.value += value;
      stats.debt += debt;
    });

    return Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        value: stats.value,
        debt: stats.debt,
        share: analyticsData.totalValue > 0 ? (stats.value / analyticsData.totalValue) * 100 : 0,
        coverageRatio: stats.debt > 0 ? (stats.value / stats.debt) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsData]);

  // 1.1. Детальная структура по типам залогового имущества
  const collateralTypeStructure = useMemo(() => {
    const typeMap = new Map<string, { count: number; value: number; debt: number; category: string }>();
    
    analyticsData.portfolioData.forEach(item => {
      const type = item.collateralType || 'Не указан';
      const category = getPropertyCategory(item.collateralType);
      const value = parseFloat(String(item.collateralValue || 0)) || 0;
      const debt = parseFloat(String(item.debtRub || 0)) || 0;
      
      if (!typeMap.has(type)) {
        typeMap.set(type, { count: 0, value: 0, debt: 0, category });
      }
      
      const stats = typeMap.get(type)!;
      stats.count++;
      stats.value += value;
      stats.debt += debt;
    });

    return Array.from(typeMap.entries())
      .map(([type, stats]) => ({
        type,
        category: stats.category,
        count: stats.count,
        value: stats.value,
        debt: stats.debt,
        share: analyticsData.totalValue > 0 ? (stats.value / analyticsData.totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsData]);

  // Динамика портфеля за выбранный период
  const portfolioDynamics = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) {
      return null;
    }

    const startDate = dateRange[0].startOf('day');
    const endDate = dateRange[1].endOf('day');

    // Фильтруем данные по периоду (используем contractDate или createdAt)
    const periodData = analyticsData.portfolioData.filter(item => {
      const itemDate = item.contractDate || item.createdAt;
      if (!itemDate) return false;
      const date = dayjs(itemDate);
      return date.isAfter(startDate) && date.isBefore(endDate);
    });

    // Сравниваем с предыдущим периодом такой же длительности
    const periodDuration = endDate.diff(startDate, 'day');
    const previousStartDate = startDate.subtract(periodDuration + 1, 'day');
    const previousEndDate = startDate.subtract(1, 'day');

    const previousPeriodData = analyticsData.portfolioData.filter(item => {
      const itemDate = item.contractDate || item.createdAt;
      if (!itemDate) return false;
      const date = dayjs(itemDate);
      return date.isAfter(previousStartDate) && date.isBefore(previousEndDate);
    });

    // Вычисляем показатели текущего периода
    const currentCount = periodData.length;
    const currentValue = periodData.reduce((sum, item) => sum + (parseFloat(String(item.collateralValue || 0)) || 0), 0);
    const currentDebt = periodData.reduce((sum, item) => sum + (parseFloat(String(item.debtRub || 0)) || 0), 0);

    // Вычисляем показатели предыдущего периода
    const previousCount = previousPeriodData.length;
    const previousValue = previousPeriodData.reduce((sum, item) => sum + (parseFloat(String(item.collateralValue || 0)) || 0), 0);
    const previousDebt = previousPeriodData.reduce((sum, item) => sum + (parseFloat(String(item.debtRub || 0)) || 0), 0);

    // Вычисляем изменения
    const countChange = currentCount - previousCount;
    const countChangePercent = previousCount > 0 ? ((countChange / previousCount) * 100) : (currentCount > 0 ? 100 : 0);
    
    const valueChange = currentValue - previousValue;
    const valueChangePercent = previousValue > 0 ? ((valueChange / previousValue) * 100) : (currentValue > 0 ? 100 : 0);
    
    const debtChange = currentDebt - previousDebt;
    const debtChangePercent = previousDebt > 0 ? ((debtChange / previousDebt) * 100) : (currentDebt > 0 ? 100 : 0);

    return {
      current: {
        count: currentCount,
        value: currentValue,
        debt: currentDebt,
      },
      previous: {
        count: previousCount,
        value: previousValue,
        debt: previousDebt,
      },
      changes: {
        count: countChange,
        countPercent: countChangePercent,
        value: valueChange,
        valuePercent: valueChangePercent,
        debt: debtChange,
        debtPercent: debtChangePercent,
      },
      periodStart: startDate.format('DD.MM.YYYY'),
      periodEnd: endDate.format('DD.MM.YYYY'),
      previousPeriodStart: previousStartDate.format('DD.MM.YYYY'),
      previousPeriodEnd: previousEndDate.format('DD.MM.YYYY'),
    };
  }, [analyticsData, dateRange]);

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

  const propertyCategoryColumns: ColumnsType<any> = [
    {
      title: 'Категория имущества',
      dataIndex: 'category',
      key: 'category',
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

  const collateralTypeColumns: ColumnsType<any> = [
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      filters: Array.from(new Set(collateralTypeStructure.map(item => item.category))).map(cat => ({
        text: cat,
        value: cat,
      })),
      onFilter: (value, record) => record.category === value,
    },
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

      {/* Динамика портфеля за выбранный период */}
      {portfolioDynamics && (
        <Card
          title={
            <Space>
              <LineChartOutlined />
              <span>Динамика портфеля за период {portfolioDynamics.periodStart} - {portfolioDynamics.periodEnd}</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card size="small">
                <Statistic
                  title="Количество договоров"
                  value={portfolioDynamics.current.count}
                  suffix={
                    <div>
                      <Text type={portfolioDynamics.changes.count >= 0 ? 'success' : 'danger'}>
                        {portfolioDynamics.changes.count >= 0 ? '+' : ''}{portfolioDynamics.changes.count}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({portfolioDynamics.changes.countPercent >= 0 ? '+' : ''}{portfolioDynamics.changes.countPercent.toFixed(2)}%)
                      </Text>
                    </div>
                  }
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Предыдущий период: {portfolioDynamics.previous.count}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card size="small">
                <Statistic
                  title="Стоимость залога"
                  value={portfolioDynamics.current.value}
                  formatter={(value) => formatCurrency(Number(value))}
                  suffix={
                    <div>
                      <Text type={portfolioDynamics.changes.value >= 0 ? 'success' : 'danger'}>
                        {portfolioDynamics.changes.value >= 0 ? '+' : ''}{formatCurrency(portfolioDynamics.changes.value)}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({portfolioDynamics.changes.valuePercent >= 0 ? '+' : ''}{portfolioDynamics.changes.valuePercent.toFixed(2)}%)
                      </Text>
                    </div>
                  }
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Предыдущий период: {formatCurrency(portfolioDynamics.previous.value)}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card size="small">
                <Statistic
                  title="Задолженность"
                  value={portfolioDynamics.current.debt}
                  formatter={(value) => formatCurrency(Number(value))}
                  suffix={
                    <div>
                      <Text type={portfolioDynamics.changes.debt >= 0 ? 'danger' : 'success'}>
                        {portfolioDynamics.changes.debt >= 0 ? '+' : ''}{formatCurrency(portfolioDynamics.changes.debt)}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({portfolioDynamics.changes.debtPercent >= 0 ? '+' : ''}{portfolioDynamics.changes.debtPercent.toFixed(2)}%)
                      </Text>
                    </div>
                  }
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Предыдущий период: {formatCurrency(portfolioDynamics.previous.debt)}
                </Text>
              </Card>
            </Col>
          </Row>
          <Divider />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Сравнение с предыдущим периодом: {portfolioDynamics.previousPeriodStart} - {portfolioDynamics.previousPeriodEnd}
          </Text>
        </Card>
      )}

      {/* Структура портфеля по категориям имущества */}
      <Card
        title={
          <Space>
            <PieChartOutlined />
            <span>Структура портфеля по категориям имущества</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={propertyCategoryColumns}
          dataSource={propertyCategoryStructure.map((item, index) => ({ ...item, key: index }))}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Детальная структура портфеля по типам залогового имущества */}
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <span>Детальная структура портфеля по типам залогового имущества</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={collateralTypeColumns}
          dataSource={collateralTypeStructure.map((item, index) => ({ ...item, key: index }))}
          pagination={{ pageSize: 20 }}
          size="small"
        />
      </Card>

      {/* Структура по сегментам бизнеса */}
      <Card
        title={
          <Space>
            <PieChartOutlined />
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
            <BarChartOutlined />
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

