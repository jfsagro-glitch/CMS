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
  TrophyOutlined,
  StarOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import employeeService from '@/services/EmployeeService';
import extendedStorageService from '@/services/ExtendedStorageService';
import type { Employee, EmployeeTaskStats } from '@/types/employee';
import type { TaskDB } from '@/services/ExtendedStorageService';
import { REGION_CENTERS } from '@/utils/regionCenters';
import {
  calculateWorkloadForPeriod,
  calculateRegionCenterWorkload,
  calculateWorkloadPercent,
  WORK_HOURS_PER_MONTH,
  TASK_NORM_HOURS,
} from '@/utils/workloadCalculator';
import { generateMonitoringPlan, generateRevaluationPlan } from '@/utils/monitoringPlanGenerator';
import type { MonitoringPlanEntry, RevaluationPlanEntry } from '@/types/monitoring';
import './KPIPage.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AwardInfo {
  title: string;
  employeeName: string;
  region: string;
  workload: number;
  slaSuccess: number;
}

type AwardSet = Record<'month' | 'quarter' | 'year', AwardInfo | null>;

const AWARD_PERIODS: Array<{ key: 'month' | 'quarter' | 'year'; label: string; days: number; icon: React.ReactNode; color: string }> = [
  { key: 'month', label: 'Работник месяца', days: 30, icon: <StarOutlined style={{ color: '#faad14' }} />, color: '#faad14' },
  { key: 'quarter', label: 'Работник квартала', days: 90, icon: <TrophyOutlined style={{ color: '#1677ff' }} />, color: '#1677ff' },
  { key: 'year', label: 'Работник года', days: 365, icon: <CrownOutlined style={{ color: '#722ed1' }} />, color: '#722ed1' },
];

const getEmployeeFullName = (employee: Employee): string =>
  `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim();

const normalizeCity = (city?: string | null, fallback?: string | null): string => {
  return (city || fallback || 'Москва').trim();
};

const calculateWorkingDays = (startDate: Dayjs, endDate: Dayjs): number => {
  if (!startDate.isValid() || !endDate.isValid()) return 0;
  let workingDays = 0;
  let currentDate = startDate.clone();

  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    const dayOfWeek = currentDate.day();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    currentDate = currentDate.add(1, 'day');
  }

  return workingDays;
};

const isTaskCompletedStatus = (status: string): boolean => {
  const normalized = (status || '').toString();
  return (
    normalized === 'completed' ||
    normalized === 'Выполнено' ||
    normalized === 'done' ||
    normalized === 'approved'
  );
};

const isTaskInProgressStatus = (status: string): boolean => {
  const normalized = (status || '').toString();
  return [
    'pending',
    'created',
    'assigned',
    'in_progress',
    'in-progress',
    'review',
    'approval',
    'rework',
    'paused',
  ].includes(normalized);
};

const isTaskPending = (task: TaskDB): boolean => {
  const status = (task.status || '').toString();
  if (!isTaskInProgressStatus(status)) return false;
  if (!task.dueDate) return true;
  const dueDate = dayjs(task.dueDate);
  return dueDate.isAfter(dayjs(), 'day') || dueDate.isSame(dayjs(), 'day');
};

const isTaskOverdue = (task: TaskDB): boolean => {
  const status = (task.status || '').toString();
  if (isTaskCompletedStatus(status)) return false;
  if (!task.dueDate) return false;
  return dayjs(task.dueDate).isBefore(dayjs(), 'day');
};

const clampLoad = (value: number): number => {
  if (!Number.isFinite(value)) return 85;
  return Math.max(85, Math.min(125, Math.round(value * 10) / 10));
};

const randomLoadAround = (base: number): number => {
  const variation = Math.random() * 10 - 5;
  return clampLoad(base + variation);
};

const parsePlanDate = (value?: string): dayjs.Dayjs => {
  if (!value) return dayjs();
  const parsed = dayjs(value, ['DD.MM.YYYY', 'YYYY-MM-DD'], true);
  return parsed.isValid() ? parsed : dayjs(value);
};

const mapPlanEntriesToTasks = (
  entries: Array<MonitoringPlanEntry | RevaluationPlanEntry>,
  type: 'monitoring' | 'revaluation',
  employees: Employee[]
): TaskDB[] => {
  return entries.map((entry, index) => {
    const parsedDue = parsePlanDate(entry.plannedDate);
    const dueDate = parsedDue.isValid() ? parsedDue : dayjs().add(7, 'day');
    const createdAt = parsePlanDate(
      'lastMonitoringDate' in entry ? entry.lastMonitoringDate : entry.lastRevaluationDate
    ).subtract(5, 'day');
    const isOverdue = entry.timeframe === 'overdue';
    const status =
      isOverdue ? 'in_progress' : entry.timeframe === 'week' ? 'assigned' : entry.timeframe === 'month' ? 'approval' : 'assigned';
    const priority: 'low' | 'medium' | 'high' =
      entry.timeframe === 'overdue' || entry.timeframe === 'week'
        ? 'high'
        : entry.timeframe === 'month'
        ? 'medium'
        : 'low';

    const owner = entry.owner?.trim();
    const employee = owner
      ? employees.find((emp) => getEmployeeFullName(emp).toLowerCase() === owner.toLowerCase())
      : undefined;

    const assignedTo = employee?.email ? [employee.email] : [];
    const businessUser = type === 'monitoring' ? 'monitoring@cmsauto.ru' : 'revaluation@cmsauto.ru';
    const businessUserName = type === 'monitoring' ? 'План мониторинга' : 'План переоценок';
    const typeLabel = type === 'monitoring' ? 'Мониторинг' : 'Оценка';
    const category = type === 'monitoring' ? 'План мониторинга' : 'План переоценок';
    const regionCity = normalizeCity(entry.city, entry.regionCenterName || entry.regionCenterCode || undefined);

    return {
      id: `PLAN-${type}-${entry.reference || 'ref'}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      region: regionCity,
      type: typeLabel,
      title: `${type === 'monitoring' ? 'Мониторинг' : 'Переоценка'} ${entry.reference || ''}`.trim(),
      description:
        type === 'monitoring'
          ? `Плановый мониторинг обеспечения (${entry.baseType})`
          : `Плановая переоценка обеспечения (${entry.baseType})`,
      priority,
      dueDate: dueDate.format('YYYY-MM-DD'),
      status,
      businessUser,
      businessUserName,
      assignedTo,
      currentAssignee: employee?.email || null,
      currentAssigneeName: employee ? getEmployeeFullName(employee) : entry.owner || null,
      employeeId: employee?.id,
      documents: [],
      comments: [],
      createdAt: createdAt.format('YYYY-MM-DD'),
      updatedAt: dayjs().toISOString(),
      history: [
        {
          date: createdAt.toISOString(),
          user: businessUserName,
          userRole: 'system',
          action: 'Создана плановая задача',
          status: 'created',
        },
        {
          date: dueDate.toISOString(),
          user: employee ? getEmployeeFullName(employee) : entry.owner || businessUserName,
          userRole: 'employee',
          action: 'Назначена в план работ',
          status,
        },
      ],
      category,
    } as TaskDB;
  });
};

const buildCenterStats = (tasks: TaskDB[], employees: Employee[]): CenterStats[] => {
  return REGION_CENTERS.map((center) => {
    const centerTasks = tasks.filter(
      (task) => center.cities.includes(task.region) || task.region === center.code || center.name.includes(task.region)
    );

    const cities: CityStats[] = center.cities.map((city) => {
      const cityTasks = centerTasks.filter((task) => task.region === city);
      const cityEmployees = employees.filter((emp) => emp.region === city);

      const employeeStats: EmployeeTaskStats[] = cityEmployees.map((emp) => {
        const employeeTasks = cityTasks.filter(
          (task) => task.employeeId === emp.id || task.currentAssigneeName === getEmployeeFullName(emp)
        );
        const completed = employeeTasks.filter((task) => isTaskCompletedStatus(task.status)).length;
        const inProgress = employeeTasks.filter((task) => isTaskPending(task)).length;
        const overdue = employeeTasks.filter((task) => isTaskOverdue(task)).length;
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

      const totalTasks = cityTasks.length;
      const completedTasks = cityTasks.filter((task) => isTaskCompletedStatus(task.status)).length;
      const inProgressTasks = cityTasks.filter((task) => isTaskPending(task)).length;
      const overdueTasks = cityTasks.filter((task) => isTaskOverdue(task)).length;
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

    const centerTotalTasks = centerTasks.length;
    const centerCompletedTasks = centerTasks.filter((task) => isTaskCompletedStatus(task.status)).length;
    const centerInProgressTasks = centerTasks.filter((task) => isTaskPending(task)).length;
    const centerOverdueTasks = centerTasks.filter((task) => isTaskOverdue(task)).length;
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
};

const computeEmployeeAwards = (tasks: TaskDB[], employees: Employee[]): AwardSet => {
  const awards: AwardSet = {
    month: null,
    quarter: null,
    year: null,
  };

  const now = dayjs();

  AWARD_PERIODS.forEach((period) => {
    const startDate = now.subtract(period.days, 'day');
    const periodTasks = tasks.filter((task) => dayjs(task.createdAt || task.updatedAt).isAfter(startDate));

    const stats = employees
      .filter((emp) => emp.isActive && (!emp.status || emp.status === 'working'))
      .map((emp) => {
        const fullName = getEmployeeFullName(emp);
        const employeeTasks = periodTasks.filter(
          (task) => task.employeeId === emp.id || task.currentAssigneeName === fullName
        );
        if (employeeTasks.length === 0) return null;

        const tasksInWork = employeeTasks.filter((task) => isTaskInProgressStatus(task.status));
        const workload = calculateWorkloadPercent(tasksInWork);
        const completed = employeeTasks.filter(
          (task) => isTaskCompletedStatus(task.status) && task.completedAt && task.createdAt
        );
        if (completed.length === 0) return null;

        const workingDaysList = completed.map((task) =>
          calculateWorkingDays(dayjs(task.createdAt), dayjs(task.completedAt!))
        );
        const slaSuccess =
          workingDaysList.length > 0
            ? Math.round((workingDaysList.filter((days) => days <= 7).length / workingDaysList.length) * 100)
            : 0;

        return {
          employee: emp,
          name: fullName,
          region: emp.region,
          workload: clampLoad(workload),
          slaSuccess: Math.min(slaSuccess, 100),
          completedCount: completed.length,
        };
      })
      .filter(Boolean) as Array<{
      employee: Employee;
      name: string;
      region: string;
      workload: number;
      slaSuccess: number;
      completedCount: number;
    }>;

    if (stats.length === 0) {
      awards[period.key] = null;
      return;
    }

    stats.sort((a, b) => {
      if (b.workload !== a.workload) return b.workload - a.workload;
      if (b.slaSuccess !== a.slaSuccess) return b.slaSuccess - a.slaSuccess;
      return b.completedCount - a.completedCount;
    });

    const winner = stats[0];
    awards[period.key] = {
      title: period.label,
      employeeName: winner.name,
      region: winner.region,
      workload: winner.workload,
      slaSuccess: winner.slaSuccess,
    };
  });

  return awards;
};

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
  const [allTasks, setAllTasks] = useState<TaskDB[]>([]);
  const [employeeAwards, setEmployeeAwards] = useState<AwardSet>({
    month: null,
    quarter: null,
    year: null,
  });

  useEffect(() => {
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
        const monitoringPlan = generateMonitoringPlan(registryData);
        const revaluationPlan = generateRevaluationPlan(registryData);

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

        // Загружаем сотрудников
        let employees = employeeService.getEmployees();
        if (!employees || employees.length === 0) {
          employees = employeeService.getEmployees();
        }

        const activeEmployees = employees.filter(emp => emp.isActive);
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

        const monitoringTasks = mapPlanEntriesToTasks(monitoringPlan, 'monitoring', employees);
        const revaluationTasks = mapPlanEntriesToTasks(revaluationPlan, 'revaluation', employees);
        const combinedTasks = [...tasksData, ...monitoringTasks, ...revaluationTasks];
        setAllTasks(combinedTasks);

        // Вычисляем KPI
        const totalPortfolioValue = portfolioData.reduce(
          (sum: number, deal: any) => sum + (parseFloat(deal.collateralValue) || 0),
          0
        );

        const totalContracts = portfolioData.length;
        const activeContracts = portfolioData.filter(
          (deal: any) => deal.status === 'active' || deal.status === 'Активный'
        ).length;

        // Статусы задач с учетом планов мониторинга/переоценки
        const completedTasks = combinedTasks.filter((task) => isTaskCompletedStatus(task.status)).length;
        const pendingTasks = combinedTasks.filter((task) => isTaskPending(task)).length;
        const overdueTasks = combinedTasks.filter((task) => isTaskOverdue(task)).length;

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

        // Расчет текущей загрузки по регионам
        const regionWorkloads = REGION_CENTERS.map((center) =>
          calculateRegionCenterWorkload(combinedTasks, employees, center.code, center.cities)
        );
        const averageRegionLoad =
          regionWorkloads.length > 0
            ? regionWorkloads.reduce((sum, workload) => sum + workload.workloadPercent, 0) / regionWorkloads.length
            : 85;
        const currentWorkload = clampLoad(averageRegionLoad || 85);

        // Расчет загрузки за периоды
        const nowPoint = dayjs();
        const last7DaysRaw = calculateWorkloadForPeriod(combinedTasks, nowPoint.subtract(7, 'day'), nowPoint, WORK_HOURS_PER_MONTH);
        const last30DaysRaw = calculateWorkloadForPeriod(combinedTasks, nowPoint.subtract(30, 'day'), nowPoint, WORK_HOURS_PER_MONTH);
        const last90DaysRaw = calculateWorkloadForPeriod(combinedTasks, nowPoint.subtract(90, 'day'), nowPoint, WORK_HOURS_PER_MONTH);

        const last7Days = last7DaysRaw.tasksCount === 0 ? randomLoadAround(currentWorkload) : clampLoad(last7DaysRaw.workloadPercent);
        const last30Days = last30DaysRaw.tasksCount === 0 ? randomLoadAround(currentWorkload) : clampLoad(last30DaysRaw.workloadPercent);
        const last90Days = last90DaysRaw.tasksCount === 0 ? randomLoadAround(currentWorkload) : clampLoad(last90DaysRaw.workloadPercent);

        setCenterStats(buildCenterStats(combinedTasks, employees));
        setEmployeeAwards(computeEmployeeAwards(combinedTasks, employees));

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
            last7Days,
            last30Days,
            last90Days,
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

  const taskStatistics: TaskStatistic[] = React.useMemo(() => {
    if (!allTasks || allTasks.length === 0) return [];

    const categoryMap = new Map<string, { total: number; completed: number; pending: number; overdue: number }>();

    allTasks.forEach((task) => {
      const category = task.category || 'Без категории';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, completed: 0, pending: 0, overdue: 0 });
      }

      const stats = categoryMap.get(category)!;
      stats.total += 1;

      if (isTaskCompletedStatus(task.status)) {
        stats.completed += 1;
      } else if (isTaskPending(task)) {
        stats.pending += 1;
      }

      if (isTaskOverdue(task)) {
        stats.overdue += 1;
      }
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      key: category,
      category,
      ...stats,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }));
  }, [allTasks]);

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

      <Card
        title={
          <Space>
            <TrophyOutlined />
            <span>Лучшие сотрудники</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          {AWARD_PERIODS.map((period) => {
            const award = employeeAwards[period.key];
            return (
              <Col xs={24} md={8} key={period.key}>
                <Card size="small" bordered>
                  {award ? (
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <Space size={6} align="center">
                        {period.icon}
                        <Text strong>{award.title}</Text>
                      </Space>
                      <Title level={5} style={{ margin: 0 }}>
                        {award.employeeName}
                      </Title>
                      <Text type="secondary">{award.region}</Text>
                      <div style={{ fontSize: 12 }}>
                        <Text>Загрузка: {award.workload}%</Text>
                        <br />
                        <Text>SLA ≤ 7 дней: {award.slaSuccess}%</Text>
                      </div>
                    </Space>
                  ) : (
                    <Text type="secondary">Данные обновляются...</Text>
                  )}
                </Card>
              </Col>
            );
          })}
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

