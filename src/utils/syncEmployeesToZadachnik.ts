/**
 * Синхронизация сотрудников из EmployeeService в формат zadachnik
 */

import employeeService from '@/services/EmployeeService';
import type { Employee } from '@/types/employee';
import { REGION_CENTERS } from '@/utils/regionCenters';
import type { RegionCenter } from '@/utils/regionCenters';

/**
 * Преобразовать сотрудника из EmployeeService в формат zadachnik
 */
const convertEmployeeToZadachnikFormat = (employee: Employee) => {
  const fullName = `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim();
  
  // Определяем роль: руководитель -> 'manager', остальные -> 'employee'
  // В системе могут быть также роли 'business' (Бизнес) и 'superuser' (Суперпользователь)
  // но они назначаются отдельно, не из EmployeeService
  let role: 'employee' | 'manager' | 'business' | 'superuser' = 'employee';
  if (employee.isManager) {
    role = 'manager';
  }
  
  return {
    id: employee.id,
    email: employee.email,
    name: fullName,
    role: role,
    region: employee.region,
    position: employee.position,
    department: employee.department,
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
    
    // Получаем регионы из REGION_CENTERS
    const regions = REGION_CENTERS.map((center: RegionCenter) => ({
      code: center.code,
      name: center.name,
      cities: center.cities,
    }));
    
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
    
    // Обновляем регионы
    usersData.regions = regions;
    
    // Сохраняем обновленные данные
    localStorage.setItem(zadachnikUsersKey, JSON.stringify(usersData));
    
    const managersCount = zadachnikEmployees.filter(emp => emp.role === 'manager').length;
    console.log(`✅ Синхронизировано ${zadachnikEmployees.length} сотрудников в zadachnik (${managersCount} руководителей)`);
    console.log(`✅ Синхронизировано ${regions.length} региональных центров`);
  } catch (error) {
    console.error('Ошибка синхронизации сотрудников с zadachnik:', error);
  }
};

