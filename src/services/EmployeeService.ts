/**
 * Сервис для управления сотрудниками
 */

import type { Employee } from '@/types/employee';

const STORAGE_KEY = 'cms_employees';

class EmployeeService {
  /**
   * Получить всех сотрудников
   */
  getEmployees(): Employee[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Возвращаем демо-данные при первом запуске
        return this.getDefaultEmployees();
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
      return this.getDefaultEmployees();
    }
  }

  /**
   * Сохранить сотрудников
   */
  saveEmployees(employees: Employee[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    } catch (error) {
      console.error('Ошибка сохранения сотрудников:', error);
    }
  }

  /**
   * Получить сотрудника по ID
   */
  getEmployeeById(id: string): Employee | undefined {
    const employees = this.getEmployees();
    return employees.find(emp => emp.id === id);
  }

  /**
   * Добавить сотрудника
   */
  addEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    const employees = this.getEmployees();
    const newEmployee: Employee = {
      ...employee,
      id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    employees.push(newEmployee);
    this.saveEmployees(employees);
    return newEmployee;
  }

  /**
   * Обновить сотрудника
   */
  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const employees = this.getEmployees();
    const index = employees.findIndex(emp => emp.id === id);
    if (index === -1) return null;

    employees[index] = {
      ...employees[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveEmployees(employees);
    return employees[index];
  }

  /**
   * Удалить сотрудника
   */
  deleteEmployee(id: string): boolean {
    const employees = this.getEmployees();
    const filtered = employees.filter(emp => emp.id !== id);
    if (filtered.length === employees.length) return false;
    this.saveEmployees(filtered);
    return true;
  }

  /**
   * Получить сотрудников по региону
   */
  getEmployeesByRegion(region: string): Employee[] {
    const employees = this.getEmployees();
    return employees.filter(emp => emp.region === region && emp.isActive);
  }

  /**
   * Получить все регионы
   */
  getRegions(): string[] {
    const employees = this.getEmployees();
    const regions = new Set(employees.map(emp => emp.region));
    return Array.from(regions).sort();
  }

  /**
   * Получить сотрудников для мониторинга
   */
  getMonitoringEmployees(): Employee[] {
    const employees = this.getEmployees();
    return employees.filter(emp => emp.isActive && emp.canMonitor === true);
  }

  /**
   * Получить сотрудников для оценки
   */
  getAppraisalEmployees(): Employee[] {
    const employees = this.getEmployees();
    return employees.filter(emp => emp.isActive && emp.canAppraise === true);
  }

  /**
   * Получить сотрудников для мониторинга по региону
   */
  getMonitoringEmployeesByRegion(region: string): Employee[] {
    return this.getMonitoringEmployees().filter(emp => emp.region === region);
  }

  /**
   * Получить сотрудников для оценки по региону
   */
  getAppraisalEmployeesByRegion(region: string): Employee[] {
    return this.getAppraisalEmployees().filter(emp => emp.region === region);
  }

  /**
   * Обновить загрузку сотрудника
   */
  updateWorkload(employeeId: string, monitoringWorkload?: number, appraisalWorkload?: number): void {
    const employees = this.getEmployees();
    const index = employees.findIndex(emp => emp.id === employeeId);
    if (index === -1) return;

    if (monitoringWorkload !== undefined) {
      employees[index].monitoringWorkload = monitoringWorkload;
    }
    if (appraisalWorkload !== undefined) {
      employees[index].appraisalWorkload = appraisalWorkload;
    }
    this.saveEmployees(employees);
  }

  /**
   * Демо-данные сотрудников
   * 15% для мониторинга, 30% для оценки
   */
  private getDefaultEmployees(): Employee[] {
    const regions = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Краснодар', 'Ростов-на-Дону', 'Казань', 'Нижний Новгород'];
    const defaultEmployees: Employee[] = [];
    
    // Генерируем ~33 сотрудника (для 15% мониторинга = 5, для 30% оценки = 10)
    const totalEmployees = 33;
    let monitoringCount = 0;
    let appraisalCount = 0;
    
    for (let i = 1; i <= totalEmployees; i++) {
      const region = regions[i % regions.length];
      const isMonitoring = i <= 5; // Первые 5 для мониторинга (15%)
      const isAppraisal = i > 5 && i <= 15; // Следующие 10 для оценки (30%)
      
      if (isMonitoring) monitoringCount++;
      if (isAppraisal) appraisalCount++;
      
      const surnames = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Лебедев', 'Козлов', 'Новиков', 'Морозов', 'Волков', 'Соловьев', 'Васильев', 'Зайцев'];
      const firstNames = ['Иван', 'Петр', 'Сергей', 'Александр', 'Дмитрий', 'Андрей', 'Михаил', 'Николай', 'Владимир', 'Алексей', 'Мария', 'Елена', 'Анна', 'Ольга', 'Татьяна'];
      const middleNames = ['Иванович', 'Петрович', 'Сергеевич', 'Александрович', 'Дмитриевич', 'Андреевич', 'Михайлович', 'Николаевич', 'Владимирович', 'Алексеевич', 'Ивановна', 'Петровна', 'Сергеевна', 'Александровна', 'Дмитриевна'];
      
      const lastName = surnames[i % surnames.length];
      const firstName = firstNames[i % firstNames.length];
      const middleName = middleNames[i % middleNames.length];
      
      let position = 'Менеджер по работе с залогами';
      let department = 'Отдел залогового обеспечения';
      
      if (isMonitoring) {
        position = 'Специалист по мониторингу';
        department = 'Отдел мониторинга';
      } else if (isAppraisal) {
        position = 'Специалист по оценке';
        department = 'Отдел оценки';
      }
      
      defaultEmployees.push({
        id: `emp-${i}`,
        lastName,
        firstName,
        middleName,
        position,
        region,
        email: `${lastName.toLowerCase()}${i}@bank.ru`,
        phone: `+7 (${String(495 + i).padStart(3, '0')}) ${String(123 + i).padStart(3, '0')}-${String(45 + i).padStart(2, '0')}-${String(67 + i).padStart(2, '0')}`,
        department,
        permissions: ['registry_view', 'portfolio_view', 'tasks_view'],
        isActive: true,
        canMonitor: isMonitoring,
        canAppraise: isAppraisal,
        monitoringWorkload: 0,
        appraisalWorkload: 0,
        hireDate: `202${Math.floor(i / 10)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Сохраняем демо-данные при первом запуске
    this.saveEmployees(defaultEmployees);
    return defaultEmployees;
  }
}

const employeeService = new EmployeeService();
export default employeeService;
