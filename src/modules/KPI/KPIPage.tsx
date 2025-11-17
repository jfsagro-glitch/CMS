import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Space, Typography, DatePicker, Select, Spin } from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import './KPIPage.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface KPIData {
  totalPortfolioValue: number;
  totalContracts: number;
  activeContracts: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalConclusions: number;
  approvedConclusions: number;
  pendingConclusions: number;
  totalObjects: number;
  totalInsurance: number;
  activeInsurance: number;
}

interface TaskStatistic {
  key: string;
  category: string;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

const KPIPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalPortfolioValue: 0,
    totalContracts: 0,
    activeContracts: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalConclusions: 0,
    approvedConclusions: 0,
    pendingConclusions: 0,
    totalObjects: 0,
    totalInsurance: 0,
    activeInsurance: 0,
  });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [period, setPeriod] = useState<string>('30days');

  useEffect(() => {
    loadKPIData();
  }, [dateRange, period]);

  const loadKPIData = async () => {
    setLoading(true);
    try {
      // Загружаем данные из различных модулей
      const [portfolioData, conclusionsData, registryData, insuranceData] = await Promise.all([
        fetch('/portfolioData.json').then((res) => res.json()).catch(() => []),
        fetch('/collateralConclusionsData.json').then((res) => res.json()).catch(() => []),
        fetch('/registryObjectsData.json').then((res) => res.json()).catch(() => []),
        fetch('/insuranceData.json').then((res) => res.json()).catch(() => []),
      ]);

      // Загружаем задачи из localStorage (Zadachnik)
      const tasksData = JSON.parse(localStorage.getItem('zadachnik_tasks') || '[]');

      // Вычисляем KPI
      const totalPortfolioValue = portfolioData.reduce(
        (sum: number, deal: any) => sum + (parseFloat(deal.collateralValue) || 0),
        0
      );

      const totalContracts = portfolioData.length;
      const activeContracts = portfolioData.filter(
        (deal: any) => deal.status === 'active' || deal.status === 'Активный'
      ).length;

      const completedTasks = tasksData.filter((task: any) => task.status === 'completed' || task.status === 'Выполнено').length;
      const pendingTasks = tasksData.filter((task: any) => task.status === 'pending' || task.status === 'В работе').length;
      const overdueTasks = tasksData.filter((task: any) => {
        if (!task.dueDate) return false;
        const dueDate = dayjs(task.dueDate);
        return dueDate.isBefore(dayjs()) && (task.status !== 'completed' && task.status !== 'Выполнено');
      }).length;

      const totalConclusions = conclusionsData.length;
      const approvedConclusions = conclusionsData.filter(
        (c: any) => c.status === 'Согласовано'
      ).length;
      const pendingConclusions = conclusionsData.filter(
        (c: any) => c.status === 'На согласовании' || c.status === 'Черновик'
      ).length;

      const totalObjects = registryData.length;
      const totalInsurance = insuranceData.length;
      const activeInsurance = insuranceData.filter(
        (i: any) => i.status === 'active' || i.status === 'Активный'
      ).length;

      setKpiData({
        totalPortfolioValue,
        totalContracts,
        activeContracts,
        completedTasks,
        pendingTasks,
        overdueTasks,
        totalConclusions,
        approvedConclusions,
        pendingConclusions,
        totalObjects,
        totalInsurance,
        activeInsurance,
      });
    } catch (error) {
      console.error('Ошибка загрузки KPI данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const taskStatistics: TaskStatistic[] = React.useMemo(() => {
    try {
      const tasksData = JSON.parse(localStorage.getItem('zadachnik_tasks') || '[]');
      
      // Группируем задачи по категориям
      const categoryMap = new Map<string, { total: number; completed: number; pending: number; overdue: number }>();
      
      tasksData.forEach((task: any) => {
        const category = task.category || 'Без категории';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { total: 0, completed: 0, pending: 0, overdue: 0 });
        }
        
        const stats = categoryMap.get(category)!;
        stats.total++;
        
        if (task.status === 'completed' || task.status === 'Выполнено') {
          stats.completed++;
        } else if (task.status === 'pending' || task.status === 'В работе') {
          stats.pending++;
        }
        
        if (task.dueDate) {
          const dueDate = dayjs(task.dueDate);
          if (dueDate.isBefore(dayjs()) && (task.status !== 'completed' && task.status !== 'Выполнено')) {
            stats.overdue++;
          }
        }
      });
      
      return Array.from(categoryMap.entries()).map(([category, stats]) => ({
        key: category,
        category,
        ...stats,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      }));
    } catch {
      return [];
    }
  }, [kpiData]);

  const taskColumns: ColumnsType<TaskStatistic> = [
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Всего',
      dataIndex: 'total',
      key: 'total',
      align: 'center',
    },
    {
      title: 'Выполнено',
      dataIndex: 'completed',
      key: 'completed',
      align: 'center',
      render: (value) => <Text type="success">{value}</Text>,
    },
    {
      title: 'В работе',
      dataIndex: 'pending',
      key: 'pending',
      align: 'center',
      render: (value) => <Text type="warning">{value}</Text>,
    },
    {
      title: 'Просрочено',
      dataIndex: 'overdue',
      key: 'overdue',
      align: 'center',
      render: (value) => <Text type="danger">{value}</Text>,
    },
    {
      title: '% выполнения',
      dataIndex: 'completionRate',
      key: 'completionRate',
      align: 'center',
      render: (value) => `${value}%`,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Загрузка аналитики..." />
      </div>
    );
  }

  return (
    <div className="kpi-page">
      <div className="kpi-header">
        <Title level={2}>KPI и Аналитика</Title>
        <Space>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 150 }}
            options={[
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

      {/* Основные KPI */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Общая стоимость портфеля"
              value={kpiData.totalPortfolioValue}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Активных договоров"
              value={kpiData.activeContracts}
              prefix={<FileTextOutlined />}
              suffix={`/ ${kpiData.totalContracts}`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Выполнено задач"
              value={kpiData.completedTasks}
              prefix={<CheckCircleOutlined />}
              suffix={`/ ${kpiData.completedTasks + kpiData.pendingTasks}`}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Просрочено задач"
              value={kpiData.overdueTasks}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Дополнительная статистика */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Залоговых заключений"
              value={kpiData.totalConclusions}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="success">Согласовано: {kpiData.approvedConclusions}</Text>
              <br />
              <Text type="warning">На согласовании: {kpiData.pendingConclusions}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Объектов в реестре"
              value={kpiData.totalObjects}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Активных страховок"
              value={kpiData.activeInsurance}
              prefix={<CheckCircleOutlined />}
              suffix={`/ ${kpiData.totalInsurance}`}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Задач в работе"
              value={kpiData.pendingTasks}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Статистика по задачам */}
      <Card
        title={
          <Space>
            <PieChartOutlined />
            <span>Статистика по задачам по категориям</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={taskColumns}
          dataSource={taskStatistics}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Графики и дополнительная аналитика */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <LineChartOutlined />
                <span>Динамика выполнения задач</span>
              </Space>
            }
          >
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
              График динамики выполнения задач
              <br />
              <Text type="secondary">(Интеграция с графиками в разработке)</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BarChartOutlined />
                <span>Распределение по статусам</span>
              </Space>
            }
          >
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
              График распределения по статусам
              <br />
              <Text type="secondary">(Интеграция с графиками в разработке)</Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KPIPage;

