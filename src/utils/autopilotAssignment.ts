/**
 * Утилита для автоматического назначения ответственных сотрудников
 * для мониторинга и оценки на основе регионов и загрузки
 */

import type { ExtendedCollateralCard } from '@/types';
import type { Employee } from '@/types/employee';
import employeeService from '@/services/EmployeeService';

/**
 * Назначение ответственных для мониторинга
 */
export interface MonitoringAssignment {
  cardId: string;
  employeeId: string;
  employeeName: string;
  region: string;
}

/**
 * Назначение ответственных для оценки
 */
export interface AppraisalAssignment {
  cardId: string;
  employeeId: string;
  employeeName: string;
  region: string;
}

/**
 * Получить регион из карточки обеспечения
 */
const getCardRegion = (card: ExtendedCollateralCard): string => {
  if (card.address?.region) {
    return card.address.region;
  }
  if (card.address?.city) {
    return card.address.city;
  }
  return 'Не указан';
};

/**
 * Автопилот для мониторинга
 * Распределяет объекты по регионам и загрузке сотрудников
 */
export const autopilotMonitoring = (cards: ExtendedCollateralCard[]): MonitoringAssignment[] => {
  const assignments: MonitoringAssignment[] = [];
  const employees = employeeService.getMonitoringEmployees();
  
  // Группируем карточки по регионам
  const cardsByRegion = new Map<string, ExtendedCollateralCard[]>();
  cards.forEach(card => {
    if (!card.nextMonitoringDate) return; // Пропускаем карточки без даты мониторинга
    
    const region = getCardRegion(card);
    if (!cardsByRegion.has(region)) {
      cardsByRegion.set(region, []);
    }
    cardsByRegion.get(region)!.push(card);
  });
  
  // Для каждого региона распределяем карточки между сотрудниками
  cardsByRegion.forEach((regionCards, region) => {
    const regionEmployees = employeeService.getMonitoringEmployeesByRegion(region);
    
    if (regionEmployees.length === 0) {
      // Если нет сотрудников в регионе, ищем ближайший регион или назначаем любого
      const allEmployees = employees;
      if (allEmployees.length === 0) return;
      
      // Распределяем равномерно между всеми сотрудниками
      regionCards.forEach((card, index) => {
        const employee = allEmployees[index % allEmployees.length];
        assignments.push({
          cardId: card.id,
          employeeId: employee.id,
          employeeName: `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim(),
          region: employee.region,
        });
      });
      return;
    }
    
    // Сортируем сотрудников по загрузке (меньше загрузка = выше приоритет)
    const sortedEmployees = [...regionEmployees].sort((a, b) => {
      const workloadA = a.monitoringWorkload || 0;
      const workloadB = b.monitoringWorkload || 0;
      return workloadA - workloadB;
    });
    
    // Распределяем карточки с учетом загрузки
    regionCards.forEach((card, index) => {
      const employee = sortedEmployees[index % sortedEmployees.length];
      assignments.push({
        cardId: card.id,
        employeeId: employee.id,
        employeeName: `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim(),
        region: employee.region,
      });
      
      // Обновляем загрузку
      employee.monitoringWorkload = (employee.monitoringWorkload || 0) + 1;
    });
  });
  
  // Сохраняем обновленную загрузку
  assignments.forEach(assignment => {
    const employee = employeeService.getEmployeeById(assignment.employeeId);
    if (employee) {
      const currentWorkload = employee.monitoringWorkload || 0;
      employeeService.updateWorkload(assignment.employeeId, currentWorkload, undefined);
    }
  });
  
  return assignments;
};

/**
 * Автопилот для оценки
 * Распределяет объекты по регионам и загрузке сотрудников
 */
export const autopilotAppraisal = (cards: ExtendedCollateralCard[]): AppraisalAssignment[] => {
  const assignments: AppraisalAssignment[] = [];
  const employees = employeeService.getAppraisalEmployees();
  
  // Группируем карточки по регионам
  const cardsByRegion = new Map<string, ExtendedCollateralCard[]>();
  cards.forEach(card => {
    if (!card.nextEvaluationDate) return; // Пропускаем карточки без даты оценки
    
    const region = getCardRegion(card);
    if (!cardsByRegion.has(region)) {
      cardsByRegion.set(region, []);
    }
    cardsByRegion.get(region)!.push(card);
  });
  
  // Для каждого региона распределяем карточки между сотрудниками
  cardsByRegion.forEach((regionCards, region) => {
    const regionEmployees = employeeService.getAppraisalEmployeesByRegion(region);
    
    if (regionEmployees.length === 0) {
      // Если нет сотрудников в регионе, ищем ближайший регион или назначаем любого
      const allEmployees = employees;
      if (allEmployees.length === 0) return;
      
      // Распределяем равномерно между всеми сотрудниками
      regionCards.forEach((card, index) => {
        const employee = allEmployees[index % allEmployees.length];
        assignments.push({
          cardId: card.id,
          employeeId: employee.id,
          employeeName: `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim(),
          region: employee.region,
        });
      });
      return;
    }
    
    // Сортируем сотрудников по загрузке (меньше загрузка = выше приоритет)
    const sortedEmployees = [...regionEmployees].sort((a, b) => {
      const workloadA = a.appraisalWorkload || 0;
      const workloadB = b.appraisalWorkload || 0;
      return workloadA - workloadB;
    });
    
    // Распределяем карточки с учетом загрузки
    regionCards.forEach((card, index) => {
      const employee = sortedEmployees[index % sortedEmployees.length];
      assignments.push({
        cardId: card.id,
        employeeId: employee.id,
        employeeName: `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim(),
        region: employee.region,
      });
      
      // Обновляем загрузку
      employee.appraisalWorkload = (employee.appraisalWorkload || 0) + 1;
    });
  });
  
  // Сохраняем обновленную загрузку
  assignments.forEach(assignment => {
    const employee = employeeService.getEmployeeById(assignment.employeeId);
    if (employee) {
      const currentWorkload = employee.appraisalWorkload || 0;
      employeeService.updateWorkload(assignment.employeeId, undefined, currentWorkload);
    }
  });
  
  return assignments;
};

/**
 * Сохранить назначения для мониторинга
 */
export const saveMonitoringAssignments = (assignments: MonitoringAssignment[]): void => {
  const storageKey = 'cms_monitoring_assignments';
  localStorage.setItem(storageKey, JSON.stringify(assignments));
};

/**
 * Загрузить назначения для мониторинга
 */
export const loadMonitoringAssignments = (): MonitoringAssignment[] => {
  const storageKey = 'cms_monitoring_assignments';
  try {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Сохранить назначения для оценки
 */
export const saveAppraisalAssignments = (assignments: AppraisalAssignment[]): void => {
  const storageKey = 'cms_appraisal_assignments';
  localStorage.setItem(storageKey, JSON.stringify(assignments));
};

/**
 * Загрузить назначения для оценки
 */
export const loadAppraisalAssignments = (): AppraisalAssignment[] => {
  const storageKey = 'cms_appraisal_assignments';
  try {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Получить ответственного для карточки мониторинга
 */
export const getMonitoringEmployeeForCard = (cardId: string): Employee | null => {
  const assignments = loadMonitoringAssignments();
  const assignment = assignments.find(a => a.cardId === cardId);
  if (!assignment) return null;
  
  return employeeService.getEmployeeById(assignment.employeeId) || null;
};

/**
 * Получить ответственного для карточки оценки
 */
export const getAppraisalEmployeeForCard = (cardId: string): Employee | null => {
  const assignments = loadAppraisalAssignments();
  const assignment = assignments.find(a => a.cardId === cardId);
  if (!assignment) return null;
  
  return employeeService.getEmployeeById(assignment.employeeId) || null;
};

