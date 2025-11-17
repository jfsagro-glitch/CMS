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

  // Вспомогательная функция для безопасного парсинга чисел
  const parseNumber = React.useCallback((value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  const loadAnalyticsData = React.useCallback(async () => {
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

      // Оптимизированный расчет с одним проходом
      let totalValue = 0;
      let totalDebt = 0;
      for (const item of data) {
        totalValue += parseNumber(item.collateralValue);
        totalDebt += parseNumber(item.debtRub);
      }

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
  }, [parseNumber]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // 1. Структура портфеля по категориям имущества (используем "Категория обеспечения" из карточек сделок)
  // ВАЖНО: Используем ТОЛЬКО collateralCategory, НЕ сегменты бизнеса
  const propertyCategoryStructure = useMemo(() => {
    const categoryMap = new Map<string, { count: number; value: number; debt: number }>();
    
    // Список известных сегментов бизнеса, которые не должны попадать в категории имущества
    // Реальные сегменты из залогового портфеля: МБ (Малый бизнес), СРБ (Средний бизнес), КБ (Крупный бизнес)
    const businessSegments = new Set([
      'МБ', 'СРБ', 'КБ', 'Малый бизнес', 'Средний бизнес', 'Крупный бизнес',
      'Сегмент ВЭД', 'ВЭД', 'МСБ', 'Корпоративный', 'Розничный'
    ]);
    
    for (const item of analyticsData.portfolioData) {
      // Используем поле collateralCategory (Категория обеспечения) из карточки сделки
      // Если его нет, используем автоматическое определение по типу имущества
      let category = item.collateralCategory || getPropertyCategory(item.collateralType) || 'Не указана';
      
      // Пропускаем, если это сегмент бизнеса (чтобы не смешивать с категориями имущества)
      if (businessSegments.has(category) || item.segment === category) {
        continue;
      }
      
      const value = parseNumber(item.collateralValue);
      const debt = parseNumber(item.debtRub);
      
      const stats = categoryMap.get(category) || { count: 0, value: 0, debt: 0 };
      stats.count++;
      stats.value += value;
      stats.debt += debt;
      categoryMap.set(category, stats);
    }

    const totalValue = analyticsData.totalValue;
    return Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        value: stats.value,
        debt: stats.debt,
        share: totalValue > 0 ? (stats.value / totalValue) * 100 : 0,
        coverageRatio: stats.debt > 0 ? (stats.value / stats.debt) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsData, parseNumber]);

  // 1.1. Детальная структура по типам залогового имущества
  const collateralTypeStructure = useMemo(() => {
    const typeMap = new Map<string, { count: number; value: number; debt: number; category: string }>();
    
    for (const item of analyticsData.portfolioData) {
      const type = item.collateralType || 'Не указан';
      const category = getPropertyCategory(item.collateralType);
      const value = parseNumber(item.collateralValue);
      const debt = parseNumber(item.debtRub);
      
      const stats = typeMap.get(type) || { count: 0, value: 0, debt: 0, category };
      stats.count++;
      stats.value += value;
      stats.debt += debt;
      typeMap.set(type, stats);
    }

    const totalValue = analyticsData.totalValue;
    return Array.from(typeMap.entries())
      .map(([type, stats]) => ({
        type,
        category: stats.category,
        count: stats.count,
        value: stats.value,
        debt: stats.debt,
        share: totalValue > 0 ? (stats.value / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsData, parseNumber]);

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

    // Вычисляем показатели текущего периода (оптимизировано)
    let currentValue = 0;
    let currentDebt = 0;
    for (const item of periodData) {
      currentValue += parseNumber(item.collateralValue);
      currentDebt += parseNumber(item.debtRub);
    }
    const currentCount = periodData.length;

    // Вычисляем показатели предыдущего периода (оптимизировано)
    let previousValue = 0;
    let previousDebt = 0;
    for (const item of previousPeriodData) {
      previousValue += parseNumber(item.collateralValue);
      previousDebt += parseNumber(item.debtRub);
    }
    const previousCount = previousPeriodData.length;

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
  }, [analyticsData, dateRange, parseNumber]);

  // 2. Структура по сегментам бизнеса
  const segmentStructure = useMemo(() => {
    const segmentMap = new Map<string, { count: number; value: number; debt: number }>();
    
    for (const item of analyticsData.portfolioData) {
      const segment = item.segment || 'Не указан';
      const value = parseNumber(item.collateralValue);
      const debt = parseNumber(item.debtRub);
      
      const stats = segmentMap.get(segment) || { count: 0, value: 0, debt: 0 };
      stats.count++;
      stats.value += value;
      stats.debt += debt;
      segmentMap.set(segment, stats);
    }

    const totalValue = analyticsData.totalValue;
    return Array.from(segmentMap.entries())
      .map(([segment, stats]) => ({
        segment,
        count: stats.count,
        value: stats.value,
        debt: stats.debt,
        share: totalValue > 0 ? (stats.value / totalValue) * 100 : 0,
        coverageRatio: stats.debt > 0 ? (stats.value / stats.debt) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsData, parseNumber]);

  // 3. Анализ просроченной задолженности
  const overdueAnalysis = useMemo(() => {
    const overdueItems: PortfolioEntry[] = [];
    let overdueValue = 0;
    let overdueDebt = 0;

    for (const item of analyticsData.portfolioData) {
      // Предполагаем, что просроченные имеют определенный статус или дату
      const status = String(item.status || '').toLowerCase();
      if (status.includes('просроч') || status.includes('overdue') || status.includes('проблем')) {
        overdueItems.push(item);
        overdueValue += parseNumber(item.collateralValue);
        overdueDebt += parseNumber(item.debtRub);
      }
    }

    const totalValue = analyticsData.totalValue;
    const totalDebt = analyticsData.totalDebt;
    return {
      count: overdueItems.length,
      totalCount: analyticsData.portfolioData.length,
      value: overdueValue,
      debt: overdueDebt,
      share: totalValue > 0 ? (overdueValue / totalValue) * 100 : 0,
      debtShare: totalDebt > 0 ? (overdueDebt / totalDebt) * 100 : 0,
    };
  }, [analyticsData, parseNumber]);

  // 4. Структура по группам
  const groupStructure = useMemo(() => {
    const groupMap = new Map<string, { count: number; value: number; debt: number }>();
    
    for (const item of analyticsData.portfolioData) {
      const group = item.group || 'Не указана';
      const value = parseNumber(item.collateralValue);
      const debt = parseNumber(item.debtRub);
      
      const stats = groupMap.get(group) || { count: 0, value: 0, debt: 0 };
      stats.count++;
      stats.value += value;
      stats.debt += debt;
      groupMap.set(group, stats);
    }

    const totalValue = analyticsData.totalValue;
    return Array.from(groupMap.entries())
      .map(([group, stats]) => ({
        group,
        count: stats.count,
        value: stats.value,
        debt: stats.debt,
        share: totalValue > 0 ? (stats.value / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsData, parseNumber]);

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

          {/* Структура портфеля по сегментам бизнеса */}
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

