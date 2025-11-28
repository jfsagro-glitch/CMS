/**
 * Утилита для расчета нормочасов и загрузки сотрудников
 */

import type { TaskDB } from '@/services/ExtendedStorageService';
import dayjs from 'dayjs';

// Нормочасы по типам задач (в рабочих часах)
export const TASK_NORM_HOURS: Record<string, number> = {
  'Подготовка СЗ': 6, // Подготовка одного заключения с одним объектом: 6 часов
  'Подготовка СЗ (2 объекта)': 7, // Два объекта: 7 часов
  'Подготовка СЗ (АЗС)': 24, // АЗС заключение: 24 часа
  'Оценка': 8,
  'Экспертиза': 6,
  'Рецензия': 4,
  'ПРКК': 4,
  'Мониторинг': 2,
  'Осмотр': 3,
  'Проверка документов': 2,
  'Согласование': 2,
  'Контроль качества': 3,
  'Отчетность': 4,
  'Прочее': 2,
};

// Рабочих часов в день
export const WORK_HOURS_PER_DAY = 8;

// Рабочих дней в месяце (среднее)
export const WORK_DAYS_PER_MONTH = 22;

// Рабочих часов в месяц
export const WORK_HOURS_PER_MONTH = WORK_HOURS_PER_DAY * WORK_DAYS_PER_MONTH; // 176 часов

/**
 * Получить нормочасы для задачи
 */
export function getTaskNormHours(task: TaskDB): number {
  // Определяем тип задачи
  const taskType = task.type || 'Прочее';
  
  // Загружаем сохраненные настройки нормочасов из localStorage
  let savedNormHours: Record<string, number> | null = null;
  try {
    const saved = localStorage.getItem('normHoursSettings');
    if (saved) {
      savedNormHours = JSON.parse(saved);
    }
  } catch (e) {
    // Игнорируем ошибки парсинга
  }
  
  // Специальная логика для "Подготовка СЗ"
  if (taskType === 'Подготовка СЗ') {
    // Проверяем описание или название на наличие упоминаний АЗС
    const title = (task.title || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    
    if (title.includes('азс') || description.includes('азс')) {
      return savedNormHours?.['Подготовка СЗ (АЗС)'] || TASK_NORM_HOURS['Подготовка СЗ (АЗС)'] || 24;
    }
    
    // Проверяем количество объектов (можно добавить в метаданные задачи)
    // Пока используем базовое значение для одного объекта
    return savedNormHours?.['Подготовка СЗ'] || TASK_NORM_HOURS['Подготовка СЗ'] || 6;
  }
  
  // Используем сохраненные значения или значения по умолчанию
  return savedNormHours?.[taskType] || TASK_NORM_HOURS[taskType] || TASK_NORM_HOURS['Прочее'] || 2;
}

/**
 * Рассчитать нормочасы для списка задач
 */
export function calculateTotalNormHours(tasks: TaskDB[]): number {
  return tasks.reduce((total, task) => {
    return total + getTaskNormHours(task);
  }, 0);
}

/**
 * Рассчитать загрузку сотрудника в процентах
 * @param tasksInProgress - задачи в работе
 * @param workHoursPerMonth - рабочих часов в месяц (по умолчанию 176)
 * @returns процент загрузки (0-150, максимум 150%)
 */
export function calculateWorkloadPercent(
  tasksInProgress: TaskDB[],
  workHoursPerMonth: number = WORK_HOURS_PER_MONTH
): number {
  const totalNormHours = calculateTotalNormHours(tasksInProgress);
  const workloadPercent = (totalNormHours / workHoursPerMonth) * 100;
  
  // Ограничиваем максимум 150%
  return Math.min(Math.round(workloadPercent * 10) / 10, 150);
}

/**
 * Рассчитать загрузку за период
 */
export function calculateWorkloadForPeriod(
  tasks: TaskDB[],
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  workHoursPerMonth: number = WORK_HOURS_PER_MONTH
): {
  totalNormHours: number;
  workloadPercent: number;
  tasksCount: number;
} {
  // Фильтруем задачи по периоду и статусу (только задачи в работе)
  const periodTasks = tasks.filter(task => {
    const status = (task.status || '').toString();
    
    // Исключаем завершенные задачи
    const isCompleted =
      status === 'completed' ||
      status === 'Выполнено' ||
      status === 'done' ||
      status === 'approved';
    
    if (isCompleted) return false;
    
    // Исключаем задачи со статусом 'created' - они еще не распределены
    if (status === 'created') return false;
    
    // Включаем только задачи в работе
    const isInWorkStatus = [
      'assigned',
      'in_progress',
      'in-progress',
      'review',
      'rework',
      'paused',
      'approval',
    ].includes(status);
    
    if (!isInWorkStatus) return false;
    
    // Фильтруем по периоду (задачи, которые были в работе в этот период)
    const taskDate = dayjs(task.createdAt || task.updatedAt);
    return taskDate.isAfter(startDate.subtract(1, 'day')) && taskDate.isBefore(endDate.add(1, 'day'));
  });
  
  const totalNormHours = calculateTotalNormHours(periodTasks);
  const workloadPercent = calculateWorkloadPercent(periodTasks, workHoursPerMonth);
  
  return {
    totalNormHours,
    workloadPercent,
    tasksCount: periodTasks.length,
  };
}

/**
 * Получить задачи в работе для сотрудника
 */
export function getTasksInProgress(tasks: TaskDB[], employeeId?: string, employeeEmail?: string): TaskDB[] {
  return tasks.filter(task => {
    // Проверяем статус задачи
    const status = (task.status || '').toString();
    const isCompleted =
      status === 'completed' ||
      status === 'Выполнено' ||
      status === 'done' ||
      status === 'approved';
    
    if (isCompleted) return false;
    
    const isInWorkStatus = [
      'pending',
      'created',
      'assigned',
      'in_progress',
      'in-progress',
      'review',
      'approval',
      'rework',
      'paused',
    ].includes(status);
    
    if (!isInWorkStatus) return false;
    
    // Проверяем привязку к сотруднику
    if (employeeId && task.employeeId === employeeId) return true;
    if (employeeEmail) {
      if (task.currentAssignee === employeeEmail) return true;
      if (Array.isArray(task.assignedTo) && task.assignedTo.includes(employeeEmail)) return true;
      if (task.assignee === employeeEmail) return true;
    }
    
    return false;
  });
}

/**
 * Рассчитать загрузку для регионального центра
 */
export function calculateRegionCenterWorkload(
  tasks: TaskDB[],
  employees: Array<{ id: string; email?: string; isActive: boolean; status?: string }>,
  regionCenterCode: string,
  regionCities: string[]
): {
  totalNormHours: number;
  workloadPercent: number;
  tasksCount: number;
  workingEmployeesCount: number;
} {
  // Фильтруем активных работающих сотрудников региона
  const workingEmployees = employees.filter(
    emp => emp.isActive && (!emp.status || emp.status === 'working')
  );
  
  // Получаем задачи региона
  const regionTasks = tasks.filter(task => {
    const taskRegion = (task.region || '').toString();
    return regionCities.includes(taskRegion) || taskRegion === regionCenterCode;
  });
  
  // Получаем задачи в работе (исключаем 'created' - они еще не распределены)
  // И учитываем только задачи, назначенные на сотрудников региона
  const employeeEmails = new Set(workingEmployees.map(emp => emp.email).filter(Boolean));
  
  const tasksInProgress = regionTasks.filter(task => {
    const status = (task.status || '').toString();
    
    // Исключаем завершенные задачи
    const isCompleted =
      status === 'completed' ||
      status === 'Выполнено' ||
      status === 'done' ||
      status === 'approved';
    
    if (isCompleted) return false;
    
    // Исключаем задачи со статусом 'created' - они еще не распределены руководителем
    if (status === 'created') return false;
    
    // Проверяем, что задача назначена на сотрудника региона
    const isAssignedToEmployee = 
      (task.currentAssignee && employeeEmails.has(task.currentAssignee)) ||
      (Array.isArray(task.assignedTo) && task.assignedTo.some(email => employeeEmails.has(email))) ||
      (task.employeeId && workingEmployees.some(emp => emp.id === task.employeeId));
    
    if (!isAssignedToEmployee) return false;
    
    // Включаем только задачи, которые реально в работе у сотрудников
    return [
      'assigned',
      'in_progress',
      'in-progress',
      'review',
      'rework',
      'paused',
      // 'approval' - задачи на согласовании тоже считаем в загрузке
      'approval',
    ].includes(status);
  });
  
  const totalNormHours = calculateTotalNormHours(tasksInProgress);
  
  // Рассчитываем загрузку на одного работающего сотрудника
  const workingEmployeesCount = workingEmployees.length;
  
  if (workingEmployeesCount === 0) {
    return {
      totalNormHours: 0,
      workloadPercent: 0,
      tasksCount: 0,
      workingEmployeesCount: 0,
    };
  }
  
  const avgNormHoursPerEmployee = totalNormHours / workingEmployeesCount;
  const workloadPercent = (avgNormHoursPerEmployee / WORK_HOURS_PER_MONTH) * 100;
  
  // Ограничиваем максимум 150%
  const cappedWorkloadPercent = Math.min(Math.round(workloadPercent * 10) / 10, 150);
  
  return {
    totalNormHours,
    workloadPercent: cappedWorkloadPercent,
    tasksCount: tasksInProgress.length,
    workingEmployeesCount,
  };
}

