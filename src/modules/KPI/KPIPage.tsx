import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Space, Typography, DatePicker, Select, Spin, Modal, Progress, Button } from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import employeeService from '@/services/EmployeeService';
import extendedStorageService from '@/services/ExtendedStorageService';
import type { RegionStats } from '@/types/employee';
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
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  useEffect(() => {
    loadKPIData();
  }, [dateRange, period]);

  useEffect(() => {
    loadRegionStats();
  }, []); // loadRegionStats не зависит от dateRange и period

  const loadRegionStats = () => {
    try {
      const tasksData = JSON.parse(localStorage.getItem('zadachnik_tasks') || '[]');
      const employees = employeeService.getEmployees();
      // Получаем актуальные регионы из EmployeeService (использует REGION_CENTERS)
      const regions = employeeService.getRegions();

      const stats: RegionStats[] = regions.map(region => {
        const regionEmployees = employees.filter(emp => emp.region === region && emp.isActive);
        const employeeStats = regionEmployees.map(emp => {
          // Ищем задачи по employeeId (приоритет) или по assignee (ФИО)
          const employeeTasks = tasksData.filter((task: any) => 
            task.employeeId === emp.id || 
            task.assignee === emp.id || 
            task.assignee === `${emp.lastName} ${emp.firstName}` ||
            task.assignee === `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim()
          );

          // Выполнено задач
          const completed = employeeTasks.filter((t: any) => 
            t.status === 'completed' || t.status === 'Выполнено'
          ).length;
          
          // Задач в работе - задачи со статусом pending, in_progress или В работе, у которых срок еще не наступил
          const inProgress = employeeTasks.filter((t: any) => {
            const isInProgress = t.status === 'pending' || 
                                t.status === 'in_progress' || 
                                t.status === 'В работе' ||
                                t.status === 'created';
            
            if (!isInProgress) return false;
            
            if (!t.dueDate) return true;
            
            const dueDate = dayjs(t.dueDate);
            return dueDate.isAfter(dayjs(), 'day') || dueDate.isSame(dayjs(), 'day');
          }).length;
          
          // Просрочено - задачи не completed, у которых срок прошел
          const overdue = employeeTasks.filter((t: any) => {
            if (t.status === 'completed' || t.status === 'Выполнено') return false;
            if (!t.dueDate) return false;
            return dayjs(t.dueDate).isBefore(dayjs(), 'day');
          }).length;
          
          const total = employeeTasks.length;
          const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            employeeId: emp.id,
            totalTasks: total,
            completedTasks: completed,
            inProgressTasks: inProgress,
            overdueTasks: overdue,
            completionRate,
          };
        });

        const totalTasks = employeeStats.reduce((sum, stat) => sum + stat.totalTasks, 0);
        const completedTasks = employeeStats.reduce((sum, stat) => sum + stat.completedTasks, 0);
        const inProgressTasks = employeeStats.reduce((sum, stat) => sum + stat.inProgressTasks, 0);
        const overdueTasks = employeeStats.reduce((sum, stat) => sum + stat.overdueTasks, 0);
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          region,
          totalTasks,
          completedTasks,
          inProgressTasks,
          overdueTasks,
          completionRate,
          employees: employeeStats,
        };
      });

      setRegionStats(stats);
    } catch (error) {
      console.error('Ошибка загрузки статистики по регионам:', error);
    }
  };

  const loadKPIData = async () => {
    setLoading(true);
    try {
      // Загружаем данные из различных модулей
      const [portfolioData, conclusionsData, insuranceData] = await Promise.all([
        fetch('/portfolioData.json').then((res) => res.json()).catch(() => []),
        fetch('/collateralConclusionsData.json').then((res) => res.json()).catch(() => []),
        fetch('/insuranceData.json').then((res) => res.json()).catch(() => []),
      ]);

      // Загружаем объекты реестра из IndexedDB
      const registryData = await extendedStorageService.getExtendedCards();

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

      // Выполнено задач - задачи со статусом completed или Выполнено
      const completedTasks = tasksData.filter((task: any) => 
        task.status === 'completed' || task.status === 'Выполнено'
      ).length;
      
      // Задач в работе - задачи со статусом pending, in_progress или В работе, у которых срок еще не наступил
      const pendingTasks = tasksData.filter((task: any) => {
        // Проверяем статус
        const isInProgress = task.status === 'pending' || 
                            task.status === 'in_progress' || 
                            task.status === 'В работе' ||
                            task.status === 'created';
        
        if (!isInProgress) return false;
        
        // Если нет срока, считаем задачей в работе
        if (!task.dueDate) return true;
        
        // Если срок еще не наступил или сегодня - задача в работе
        const dueDate = dayjs(task.dueDate);
        return dueDate.isAfter(dayjs(), 'day') || dueDate.isSame(dayjs(), 'day');
      }).length;
      
      // Просрочено - задачи не completed, у которых срок прошел
      const overdueTasks = tasksData.filter((task: any) => {
        // Исключаем выполненные задачи
        if (task.status === 'completed' || task.status === 'Выполнено') return false;
        
        // Если нет срока, не считаем просроченной
        if (!task.dueDate) return false;
        
        // Если срок прошел - просрочено
        return dayjs(task.dueDate).isBefore(dayjs(), 'day');
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
        
        // Выполнено задач
        if (task.status === 'completed' || task.status === 'Выполнено') {
          stats.completed++;
        } 
        
        // Задач в работе - задачи со статусом pending, in_progress или В работе, у которых срок еще не наступил
        const isInProgress = task.status === 'pending' || 
                            task.status === 'in_progress' || 
                            task.status === 'В работе' ||
                            task.status === 'created';
        
        if (isInProgress) {
          if (!task.dueDate || dayjs(task.dueDate).isAfter(dayjs()) || dayjs(task.dueDate).isSame(dayjs(), 'day')) {
            stats.pending++;
          }
        }
        
        // Просрочено - задачи не completed, у которых срок прошел
        if (task.dueDate && task.status !== 'completed' && task.status !== 'Выполнено') {
          const dueDate = dayjs(task.dueDate);
          if (dueDate.isBefore(dayjs(), 'day')) {
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
  }, []);

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

      {/* Аналитика по регионам */}
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <span>Аналитика по регионам</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Кликните на регион для детальной статистики по сотрудникам
        </Text>
        <Row gutter={[16, 16]}>
          {regionStats.map((stat) => (
            <Col xs={24} sm={12} lg={6} key={stat.region}>
              <Card
                hoverable
                onClick={() => {
                  setSelectedRegion(stat.region);
                  setRegionModalVisible(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <Typography.Title level={4} style={{ marginTop: 0 }}>
                  {stat.region}
                </Typography.Title>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ color: '#3f8600', fontSize: 18 }}>
                    {stat.completionRate}%
                  </Text>
                </div>
                <Progress
                  percent={stat.completionRate}
                  strokeColor="#3f8600"
                  showInfo={false}
                  style={{ marginBottom: 12 }}
                />
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">Всего задач:</Text> <Text strong>{stat.totalTasks}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Завершено:</Text> <Text strong type="success">{stat.completedTasks}</Text>
                  </div>
                  <div>
                    <Text type="secondary">В работе:</Text> <Text strong type="warning">{stat.inProgressTasks}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Просрочено:</Text> <Text strong type="danger">{stat.overdueTasks}</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

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

      {/* Модальное окно с детальной статистикой по сотрудникам региона */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>Аналитика по сотрудникам: {selectedRegion}</span>
          </Space>
        }
        open={regionModalVisible}
        onCancel={() => setRegionModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setRegionModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
        width={800}
      >
        {selectedRegion && (() => {
          const regionStat = regionStats.find(s => s.region === selectedRegion);
          if (!regionStat) return null;

          const employees = employeeService.getEmployeesByRegion(selectedRegion);
          const employeeColumns: ColumnsType<any> = [
            {
              title: 'Сотрудник',
              dataIndex: 'employee',
              key: 'employee',
              render: (_, record) => {
                const emp = employees.find(e => e.id === record.employeeId);
                return emp ? `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim() : 'Неизвестно';
              },
            },
            {
              title: 'Должность',
              dataIndex: 'position',
              key: 'position',
              render: (_, record) => {
                const emp = employees.find(e => e.id === record.employeeId);
                return emp?.position || '—';
              },
            },
            {
              title: 'Всего задач',
              dataIndex: 'totalTasks',
              key: 'totalTasks',
              align: 'center',
            },
            {
              title: 'Завершено',
              dataIndex: 'completedTasks',
              key: 'completedTasks',
              align: 'center',
              render: (value) => <Text type="success">{value}</Text>,
            },
            {
              title: 'В работе',
              dataIndex: 'inProgressTasks',
              key: 'inProgressTasks',
              align: 'center',
              render: (value) => <Text type="warning">{value}</Text>,
            },
            {
              title: 'Просрочено',
              dataIndex: 'overdueTasks',
              key: 'overdueTasks',
              align: 'center',
              render: (value) => <Text type="danger">{value}</Text>,
            },
            {
              title: '% выполнения',
              dataIndex: 'completionRate',
              key: 'completionRate',
              align: 'center',
              render: (value) => (
                <div>
                  <Text strong style={{ color: value >= 80 ? '#3f8600' : value >= 50 ? '#faad14' : '#cf1322' }}>
                    {value}%
                  </Text>
                  <Progress
                    percent={value}
                    strokeColor={value >= 80 ? '#3f8600' : value >= 50 ? '#faad14' : '#cf1322'}
                    showInfo={false}
                    size="small"
                    style={{ marginTop: 4 }}
                  />
                </div>
              ),
            },
          ];

          return (
            <Table
              columns={employeeColumns}
              dataSource={regionStat.employees.map(stat => ({ ...stat, key: stat.employeeId }))}
              pagination={false}
              size="small"
            />
          );
        })()}
      </Modal>
    </div>
  );
};

export default KPIPage;

