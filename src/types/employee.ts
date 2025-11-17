/**
 * Типы для модуля управления сотрудниками
 */

export interface Employee {
  id: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  position: string; // Должность
  region: string; // Регион
  email?: string;
  phone?: string;
  department?: string; // Отдел
  permissions: EmployeePermission[]; // Права доступа
  isActive: boolean; // Активен ли сотрудник
  hireDate?: string; // Дата приема на работу
  notes?: string; // Примечания
  createdAt: string;
  updatedAt: string;
}

export type EmployeePermission =
  | 'registry_view'
  | 'registry_edit'
  | 'portfolio_view'
  | 'portfolio_edit'
  | 'conclusions_view'
  | 'conclusions_edit'
  | 'tasks_view'
  | 'tasks_edit'
  | 'reports_view'
  | 'reports_export'
  | 'settings_view'
  | 'settings_edit'
  | 'admin';

export interface EmployeeTaskStats {
  employeeId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface RegionStats {
  region: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  employees: EmployeeTaskStats[];
}

