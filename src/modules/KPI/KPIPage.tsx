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
import type { EmployeeTaskStats } from '@/types/employee';
import type { TaskDB } from '@/services/ExtendedStorageService';
import { REGION_CENTERS } from '@/utils/regionCenters';
import {
  calculateWorkloadForPeriod,
  WORK_HOURS_PER_MONTH,
  TASK_NORM_HOURS,
} from '@/utils/workloadCalculator';
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
  averageConclusionDays: number; // Средний срок подготовки залогового заключения в рабочих днях
  slaCompliance: number; // Процент соответствия SLA (<= 7 рабочих дней)
  currentWorkload: number; // Текущая загрузка (%)
  workloadByPeriod: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
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

interface CityStats {
  city: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  employees: EmployeeTaskStats[];
}

interface CenterStats {
  code: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  cities: CityStats[];
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
          averageConclusionDays: 0,
          slaCompliance: 0,
          currentWorkload: 0,
          workloadByPeriod: {
            last7Days: 0,
            last30Days: 0,
            last90Days: 0,
          },
        });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [period, setPeriod] = useState<string>('30days');
  const [centerStats, setCenterStats] = useState<CenterStats[]>([]);
  const [selectedCenterCode, setSelectedCenterCode] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [centerModalVisible, setCenterModalVisible] = useState(false);

  useEffect(() => {
    // Функция для расчета рабочих дней между двумя датами (исключая выходные)
    const calculateWorkingDays = (startDate: Dayjs, endDate: Dayjs): number => {
      let workingDays = 0;
      let currentDate = startDate.clone();

      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        const dayOfWeek = currentDate.day(); // 0 = воскресенье, 6 = суббота
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDays++;
        }
        currentDate = currentDate.add(1, 'day');
      }

      return workingDays;
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

        // Загружаем задачи из IndexedDB (с fallback на localStorage)
        let tasksData: TaskDB[] = [];
        try {
          tasksData = await extendedStorageService.getTasks();
        } catch (error) {
          // Fallback на localStorage
          try {
            const tasksJson = localStorage.getItem('zadachnik_tasks');
            if (tasksJson) {
              tasksData = JSON.parse(tasksJson);
            }
          } catch (e) {
            console.warn('Не удалось загрузить задачи:', e);
          }
        }

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

        // Расчет среднего срока подготовки залогового заключения и SLA
        const approvedConclusionsList = conclusionsData.filter(
          (c: any) => c.status === 'Согласовано' && c.authorDate && (c.approvalDate || c.conclusionDate)
        );

        let averageConclusionDays = 0;
        let slaCompliance = 0;

        if (approvedConclusionsList.length > 0) {
          const workingDaysList: number[] = [];

          approvedConclusionsList.forEach((c: any) => {
            const startDate = dayjs(c.authorDate);
            const endDate = dayjs(c.approvalDate || c.conclusionDate);

            if (startDate.isValid() && endDate.isValid() && endDate.isAfter(startDate)) {
              const workingDays = calculateWorkingDays(startDate, endDate);
              workingDaysList.push(workingDays);
            }
          });

          if (workingDaysList.length > 0) {
            averageConclusionDays = Math.round(
              (workingDaysList.reduce((sum, days) => sum + days, 0) / workingDaysList.length) * 10
            ) / 10; // Округляем до 1 знака после запятой

            // Процент соответствия SLA (<= 7 рабочих дней)
            const compliantCount = workingDaysList.filter(days => days <= 7).length;
            slaCompliance = Math.round((compliantCount / workingDaysList.length) * 100);
          }
        }

        // Расчет текущей загрузки
        const employees = employeeService.getEmployees();
        // Исключаем менеджеров и сотрудников в отпуске, больничном и командировке
        const activeEmployees = employees.filter(
          emp => emp.isActive && 
                 !emp.isManager &&
                 (!emp.status || emp.status === 'working') &&
                 emp.status !== 'sick_leave' &&
                 emp.status !== 'vacation' &&
                 emp.status !== 'business_trip'
        );
        
        // Получаем все задачи в работе для всех сотрудников (исключаем 'created')
        const allTasksInProgress: TaskDB[] = tasksData.filter(task => {
          const status = (task.status || '').toString();
          const isCompleted = status === 'completed' || status === 'Выполнено' || status === 'done' || status === 'approved';
          if (isCompleted || status === 'created') return false;
          
          const isInWorkStatus = ['assigned', 'in_progress', 'in-progress', 'review', 'rework', 'paused', 'approval'].includes(status);
          if (!isInWorkStatus) return false;
          
          // Проверяем, что задача назначена на активного сотрудника
          return activeEmployees.some(emp => 
            (emp.id && task.employeeId === emp.id) ||
            (emp.email && (task.currentAssignee === emp.email || (Array.isArray(task.assignedTo) && task.assignedTo.includes(emp.email))))
          );
        });
        
        // Убираем дубликаты задач
        const uniqueTasksInProgress = Array.from(
          new Map(allTasksInProgress.map(task => [task.id, task])).values()
        );
        
        // Рассчитываем среднюю загрузку на одного сотрудника
        const totalNormHours = uniqueTasksInProgress.reduce((sum, task) => {
          const taskType = task.type || 'Прочее';
          const storedNormHours = JSON.parse(localStorage.getItem('normHoursSettings') || '{}');
          let normHours = storedNormHours[taskType] || TASK_NORM_HOURS[taskType] || 2;
          
          if (taskType === 'Подготовка СЗ') {
            const title = (task.title || '').toLowerCase();
            const description = (task.description || '').toLowerCase();
            if (title.includes('азс') || description.includes('азс')) {
              normHours = storedNormHours['Подготовка СЗ (АЗС)'] || 24;
            } else if (title.includes('2 объекта') || description.includes('2 объекта')) {
              normHours = storedNormHours['Подготовка СЗ (2 объекта)'] || 7;
            }
          }
          
          return sum + normHours;
        }, 0);
        
        const avgNormHoursPerEmployee = activeEmployees.length > 0 ? totalNormHours / activeEmployees.length : 0;
        const currentWorkload = Math.min(Math.round((avgNormHoursPerEmployee / WORK_HOURS_PER_MONTH) * 100 * 10) / 10, 150);
        
        // Расчет загрузки за периоды
        const now = dayjs();
        const last7Days = calculateWorkloadForPeriod(tasksData, now.subtract(7, 'day'), now, WORK_HOURS_PER_MONTH);
        const last30Days = calculateWorkloadForPeriod(tasksData, now.subtract(30, 'day'), now, WORK_HOURS_PER_MONTH);
        const last90Days = calculateWorkloadForPeriod(tasksData, now.subtract(90, 'day'), now, WORK_HOURS_PER_MONTH);

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
          averageConclusionDays,
          slaCompliance,
          currentWorkload,
          workloadByPeriod: {
            last7Days: last7Days.workloadPercent,
            last30Days: last30Days.workloadPercent,
            last90Days: last90Days.workloadPercent,
          },
        });
      } catch (error) {
        console.error('Ошибка загрузки KPI данных:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadKPIData();
  }, [dateRange, period]);

  // Нам нужно вызвать загрузку статистики по региональным центрам один раз при монтировании
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadRegionStats();
  }, []); // loadRegionStats не зависит от dateRange и period

  const loadRegionStats = async () => {
    try {
      // Проверяем наличие сотрудников и задач, если нет - генерируем
      let employees = employeeService.getEmployees();
      if (!employees || employees.length === 0) {
        // Сотрудники будут созданы автоматически при первом вызове getEmployees()
        employees = employeeService.getEmployees();
      }

      // Загружаем задачи из IndexedDB (с fallback на localStorage)
      let tasksData: TaskDB[] = [];
      try {
        tasksData = await extendedStorageService.getTasks();
      } catch (error) {
        // Fallback на localStorage
        try {
          const tasksJson = localStorage.getItem('zadachnik_tasks');
          if (tasksJson) {
            tasksData = JSON.parse(tasksJson);
          }
        } catch (e) {
          console.warn('Не удалось загрузить задачи:', e);
        }
      }

      const activeEmployees = employees.filter(emp => emp.isActive);
      
      // Проверяем, достаточно ли задач (минимум 60 задач на активного сотрудника)
      const minTasksPerEmployee = 60;
      const expectedMinTasks = activeEmployees.length * minTasksPerEmployee;
      
      if (!tasksData || tasksData.length === 0 || tasksData.length < expectedMinTasks) {
        try {
          const { generateTasksForEmployees } = await import('@/utils/generateTasksForEmployees');
          await generateTasksForEmployees();
          tasksData = await extendedStorageService.getTasks();
          console.log(`✅ Сгенерировано ${tasksData.length} задач для ${activeEmployees.length} активных сотрудников`);
        } catch (error) {
          console.warn('Не удалось сгенерировать задачи:', error);
        }
      }

      // Строим иерархическую статистику по региональным центрам → городам → сотрудникам
      const centersStats: CenterStats[] = REGION_CENTERS.map((center) => {
        const centerCities = center.cities;

        const centerEmployees = employees.filter(
          (emp) => emp.isActive && centerCities.includes(emp.region)
        );

        const cities: CityStats[] = centerCities.map((city) => {
          const cityEmployees = centerEmployees.filter((emp) => emp.region === city);

          const employeeStats: EmployeeTaskStats[] = cityEmployees.map((emp) => {
            const employeeTasks = tasksData.filter((task: TaskDB) => task.employeeId === emp.id);

            const completed = employeeTasks.filter(
              (t) => t.status === 'completed' || t.status === 'Выполнено'
            ).length;

            const inProgress = employeeTasks.filter((t) => {
              const status = t.status;
              const isInProgress =
                status === 'pending' ||
                status === 'in_progress' ||
                status === 'В работе' ||
                status === 'created' ||
                status === 'in-progress' ||
                status === 'approval' ||
                status === 'rework' ||
                status === 'paused';

              if (!isInProgress) return false;
              if (!t.dueDate) return true;

              const dueDate = dayjs(t.dueDate);
              return (
                dueDate.isAfter(dayjs(), 'day') || dueDate.isSame(dayjs(), 'day')
              );
            }).length;

            const overdue = employeeTasks.filter((t) => {
              const status = t.status;
              if (status === 'completed' || status === 'Выполнено' || status === 'approved') {
                return false;
              }
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
          const completedTasks = employeeStats.reduce(
            (sum, stat) => sum + stat.completedTasks,
            0
          );
          const inProgressTasks = employeeStats.reduce(
            (sum, stat) => sum + stat.inProgressTasks,
            0
          );
          const overdueTasks = employeeStats.reduce(
            (sum, stat) => sum + stat.overdueTasks,
            0
          );
          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return {
            city,
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            completionRate,
            employees: employeeStats,
          };
        });

        const centerTotalTasks = cities.reduce((sum, c) => sum + c.totalTasks, 0);
        const centerCompletedTasks = cities.reduce((sum, c) => sum + c.completedTasks, 0);
        const centerInProgressTasks = cities.reduce((sum, c) => sum + c.inProgressTasks, 0);
        const centerOverdueTasks = cities.reduce((sum, c) => sum + c.overdueTasks, 0);
        const centerCompletionRate =
          centerTotalTasks > 0 ? Math.round((centerCompletedTasks / centerTotalTasks) * 100) : 0;

        return {
          code: center.code,
          name: center.name,
          totalTasks: centerTotalTasks,
          completedTasks: centerCompletedTasks,
          inProgressTasks: centerInProgressTasks,
          overdueTasks: centerOverdueTasks,
          completionRate: centerCompletionRate,
          cities,
        };
      });

      setCenterStats(centersStats);
    } catch (error) {
      console.error('Ошибка загрузки статистики по регионам:', error);
    }
  };

  const taskStatistics: TaskStatistic[] = React.useMemo(() => {
    try {
      // Используем синхронную загрузку из localStorage для useMemo
      // (IndexedDB асинхронный, поэтому используем fallback)
      let tasksData: TaskDB[] = [];
      try {
        const tasksJson = localStorage.getItem('zadachnik_tasks');
        if (tasksJson) {
          tasksData = JSON.parse(tasksJson);
        }
      } catch (e) {
        console.warn('Не удалось загрузить задачи из localStorage:', e);
      }
      
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
              title="Средний срок подготовки СЗ"
              value={kpiData.averageConclusionDays}
              suffix="раб. дней"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ 
                color: kpiData.averageConclusionDays <= 7 ? '#3f8600' : '#cf1322' 
              }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                SLA: не более 7 рабочих дней
              </Text>
              <br />
              <Progress
                percent={kpiData.averageConclusionDays > 0 ? Math.min((7 / kpiData.averageConclusionDays) * 100, 100) : 0}
                strokeColor={kpiData.averageConclusionDays <= 7 ? '#3f8600' : '#faad14'}
                size="small"
                format={() => `${kpiData.averageConclusionDays.toFixed(1)} дн.`}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Выполнение SLA"
              value={kpiData.slaCompliance}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ 
                color: kpiData.slaCompliance >= 90 ? '#3f8600' : 
                       kpiData.slaCompliance >= 70 ? '#faad14' : '#cf1322' 
              }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={kpiData.slaCompliance}
                strokeColor={kpiData.slaCompliance >= 90 ? '#3f8600' : 
                            kpiData.slaCompliance >= 70 ? '#faad14' : '#cf1322'}
                size="small"
              />
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                {kpiData.slaCompliance >= 90 ? '✅ Отлично' : 
                 kpiData.slaCompliance >= 70 ? '⚠️ Требует внимания' : '❌ Не соответствует'}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Текущая загрузка"
              value={kpiData.currentWorkload}
              suffix="%"
              prefix={<UserOutlined />}
              valueStyle={{ 
                color: kpiData.currentWorkload <= 100 ? '#3f8600' : 
                       kpiData.currentWorkload <= 125 ? '#faad14' : '#cf1322' 
              }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={Math.min(kpiData.currentWorkload, 150)}
                strokeColor={kpiData.currentWorkload <= 100 ? '#3f8600' : 
                            kpiData.currentWorkload <= 125 ? '#faad14' : '#cf1322'}
                size="small"
              />
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                {kpiData.currentWorkload <= 100 ? '✅ Нормальная' : 
                 kpiData.currentWorkload <= 125 ? '⚠️ Повышенная' : '❌ Перегрузка'}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
      
      {/* Загрузка за периоды */}
      <Card
        title={
          <Space>
            <LineChartOutlined />
            <span>Загрузка сотрудников по периодам</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="За последние 7 дней"
                value={kpiData.workloadByPeriod.last7Days}
                suffix="%"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ 
                  color: kpiData.workloadByPeriod.last7Days <= 100 ? '#3f8600' : 
                         kpiData.workloadByPeriod.last7Days <= 125 ? '#faad14' : '#cf1322' 
                }}
              />
              <Progress
                percent={Math.min(kpiData.workloadByPeriod.last7Days, 150)}
                strokeColor={kpiData.workloadByPeriod.last7Days <= 100 ? '#3f8600' : 
                            kpiData.workloadByPeriod.last7Days <= 125 ? '#faad14' : '#cf1322'}
                size="small"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="За последние 30 дней"
                value={kpiData.workloadByPeriod.last30Days}
                suffix="%"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ 
                  color: kpiData.workloadByPeriod.last30Days <= 100 ? '#3f8600' : 
                         kpiData.workloadByPeriod.last30Days <= 125 ? '#faad14' : '#cf1322' 
                }}
              />
              <Progress
                percent={Math.min(kpiData.workloadByPeriod.last30Days, 150)}
                strokeColor={kpiData.workloadByPeriod.last30Days <= 100 ? '#3f8600' : 
                            kpiData.workloadByPeriod.last30Days <= 125 ? '#faad14' : '#cf1322'}
                size="small"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="За последние 90 дней"
                value={kpiData.workloadByPeriod.last90Days}
                suffix="%"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ 
                  color: kpiData.workloadByPeriod.last90Days <= 100 ? '#3f8600' : 
                         kpiData.workloadByPeriod.last90Days <= 125 ? '#faad14' : '#cf1322' 
                }}
              />
              <Progress
                percent={Math.min(kpiData.workloadByPeriod.last90Days, 150)}
                strokeColor={kpiData.workloadByPeriod.last90Days <= 100 ? '#3f8600' : 
                            kpiData.workloadByPeriod.last90Days <= 125 ? '#faad14' : '#cf1322'}
                size="small"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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

      {/* SLA по залоговым заключениям */}
      <Card
        title={
          <Space>
            <CheckCircleOutlined />
            <span>Выполнение SLA по залоговым заключениям</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Title level={3} style={{ marginBottom: 8 }}>
                Средний срок подготовки
              </Title>
              <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 8, 
                           color: kpiData.averageConclusionDays <= 7 ? '#3f8600' : '#cf1322' }}>
                {kpiData.averageConclusionDays.toFixed(1)}
              </div>
              <Text type="secondary" style={{ fontSize: 18 }}>
                рабочих дней
              </Text>
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ fontSize: 16 }}>
                  Требование SLA: не более 7 рабочих дней
                </Text>
                <br />
                <Text type={kpiData.averageConclusionDays <= 7 ? 'success' : 'danger'} style={{ fontSize: 14 }}>
                  {kpiData.averageConclusionDays <= 7 ? '✅ Соответствует SLA' : 
                   '❌ Превышение на ' + (kpiData.averageConclusionDays - 7).toFixed(1) + ' дней'}
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Title level={3} style={{ marginBottom: 8 }}>
                Процент соответствия SLA
              </Title>
              <Progress
                type="circle"
                percent={kpiData.slaCompliance}
                strokeColor={kpiData.slaCompliance >= 90 ? '#3f8600' : 
                            kpiData.slaCompliance >= 70 ? '#faad14' : '#cf1322'}
                size={200}
                format={(percent) => `${percent}%`}
              />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Заключений, подготовленных в срок ≤ 7 дней
                </Text>
                <br />
                <Text strong style={{ fontSize: 16, 
                                     color: kpiData.slaCompliance >= 90 ? '#3f8600' : 
                                            kpiData.slaCompliance >= 70 ? '#faad14' : '#cf1322' }}>
                  {kpiData.slaCompliance >= 90 ? '✅ Отличный показатель' : 
                   kpiData.slaCompliance >= 70 ? '⚠️ Требует улучшения' : 
                   '❌ Критический уровень'}
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Аналитика по региональным центрам */}
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <span>Аналитика по региональным центрам</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Кликните на региональный центр для детальной статистики по городам и сотрудникам
        </Text>
        <Row gutter={[16, 16]}>
          {centerStats.map((stat) => (
            <Col xs={24} sm={12} lg={6} key={stat.code}>
              <Card
                hoverable
                onClick={() => {
                  setSelectedCenterCode(stat.code);
                  setSelectedCity(null);
                  setCenterModalVisible(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <Typography.Title level={4} style={{ marginTop: 0 }}>
                  {stat.name}
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

      {/* Модальное окно с детальной статистикой по региональному центру, городам и сотрудникам */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>
              Аналитика по региональному центру:{' '}
              {selectedCenterCode
                ? centerStats.find(c => c.code === selectedCenterCode)?.name
                : ''}
            </span>
          </Space>
        }
        open={centerModalVisible}
        onCancel={() => {
          setCenterModalVisible(false);
          setSelectedCenterCode(null);
          setSelectedCity(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setCenterModalVisible(false);
              setSelectedCenterCode(null);
              setSelectedCity(null);
            }}
          >
            Закрыть
          </Button>,
        ]}
        width={900}
      >
        {selectedCenterCode && (() => {
          const center = centerStats.find(c => c.code === selectedCenterCode);
          if (!center) return null;

          const cityColumns: ColumnsType<CityStats & { key: string }> = [
            {
              title: 'Город',
              dataIndex: 'city',
              key: 'city',
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
              render: (value: number) => <Text type="success">{value}</Text>,
            },
            {
              title: 'В работе',
              dataIndex: 'inProgressTasks',
              key: 'inProgressTasks',
              align: 'center',
              render: (value: number) => <Text type="warning">{value}</Text>,
            },
            {
              title: 'Просрочено',
              dataIndex: 'overdueTasks',
              key: 'overdueTasks',
              align: 'center',
              render: (value: number) => <Text type="danger">{value}</Text>,
            },
            {
              title: '% выполнения',
              dataIndex: 'completionRate',
              key: 'completionRate',
              align: 'center',
              render: (value: number) => `${value}%`,
            },
          ];

          const cityData = center.cities.map(c => ({ key: c.city, ...c }));

          const allEmployees = employeeService.getEmployees();

          const selectedCityStats = selectedCity
            ? center.cities.find(c => c.city === selectedCity)
            : undefined;

          const employeeColumns: ColumnsType<EmployeeTaskStats & { key: string }> = [
            {
              title: 'Сотрудник',
              dataIndex: 'employee',
              key: 'employee',
              render: (_: unknown, record) => {
                const emp = allEmployees.find(e => e.id === record.employeeId);
                return emp
                  ? `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim()
                  : 'Неизвестно';
              },
            },
            {
              title: 'Должность',
              dataIndex: 'position',
              key: 'position',
              render: (_: unknown, record) => {
                const emp = allEmployees.find(e => e.id === record.employeeId);
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
              render: (value: number) => <Text type="success">{value}</Text>,
            },
            {
              title: 'В работе',
              dataIndex: 'inProgressTasks',
              key: 'inProgressTasks',
              align: 'center',
              render: (value: number) => <Text type="warning">{value}</Text>,
            },
            {
              title: 'Просрочено',
              dataIndex: 'overdueTasks',
              key: 'overdueTasks',
              align: 'center',
              render: (value: number) => <Text type="danger">{value}</Text>,
            },
            {
              title: '% выполнения',
              dataIndex: 'completionRate',
              key: 'completionRate',
              align: 'center',
              render: (value: number) => `${value}%`,
            },
          ];

          const employeeData =
            selectedCityStats?.employees.map(e => ({
              key: e.employeeId,
              ...e,
            })) ?? [];

          return (
            <>
              <Title level={5} style={{ marginBottom: 12 }}>
                Города регионального центра
              </Title>
              <Table
                columns={cityColumns}
                dataSource={cityData}
                size="small"
                pagination={false}
                onRow={record => ({
                  onClick: () => setSelectedCity(record.city),
                  style: {
                    cursor: 'pointer',
                    backgroundColor:
                      selectedCity === record.city ? 'rgba(24,144,255,0.06)' : undefined,
                  },
                })}
              />

              {selectedCity && selectedCityStats && (
                <>
                  <div style={{ marginTop: 24, marginBottom: 8 }}>
                    <Title level={5}>
                      Сотрудники города: {selectedCity} ({selectedCityStats.totalTasks} задач)
                    </Title>
                  </div>
                  <Table
                    columns={employeeColumns}
                    dataSource={employeeData}
                    size="small"
                    pagination={false}
                  />
                </>
              )}
            </>
          );
        })()}
      </Modal>
    </div>
  );
};

export default KPIPage;

