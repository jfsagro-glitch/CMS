/**
 * Синхронизация сотрудников из EmployeeService в формат zadachnik
 */

import employeeService from '@/services/EmployeeService';
import type { Employee } from '@/types/employee';

/**
 * Преобразовать сотрудника из EmployeeService в формат zadachnik
 */
const convertEmployeeToZadachnikFormat = (employee: Employee) => {
  const fullName = `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim();
  
  return {
    id: employee.id,
    email: employee.email,
    name: fullName,
    role: 'employee' as const,
    region: employee.region,
  };
};

/**
 * Синхронизировать сотрудников из EmployeeService в zadachnik
 */
export const syncEmployeesToZadachnik = (): void => {
  try {
    const employees = employeeService.getEmployees();
    
    // Преобразуем сотрудников в формат zadachnik
    const zadachnikEmployees = employees
      .filter(emp => emp.isActive)
      .map(convertEmployeeToZadachnikFormat);
    
    // Получаем текущие данные zadachnik из localStorage
    const zadachnikUsersKey = 'zadachnik_users';
    const existingUsersData = localStorage.getItem(zadachnikUsersKey);
    
    let usersData: any = {};
    if (existingUsersData) {
      try {
        usersData = JSON.parse(existingUsersData);
      } catch (e) {
        console.warn('Не удалось распарсить существующие данные zadachnik, создаем новые');
      }
    }
    
    // Обновляем сотрудников
    usersData.employee = zadachnikEmployees;
    
    // Сохраняем обновленные данные
    localStorage.setItem(zadachnikUsersKey, JSON.stringify(usersData));
    
    console.log(`✅ Синхронизировано ${zadachnikEmployees.length} сотрудников в zadachnik`);
  } catch (error) {
    console.error('Ошибка синхронизации сотрудников с zadachnik:', error);
  }
};

