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
   * Демо-данные сотрудников
   */
  private getDefaultEmployees(): Employee[] {
    const defaultEmployees: Employee[] = [
      {
        id: 'emp-1',
        lastName: 'Иванов',
        firstName: 'Иван',
        middleName: 'Иванович',
        position: 'Менеджер по работе с залогами',
        region: 'Москва',
        email: 'ivanov@bank.ru',
        phone: '+7 (495) 123-45-67',
        department: 'Отдел залогового обеспечения',
        permissions: ['registry_view', 'registry_edit', 'portfolio_view', 'tasks_view', 'tasks_edit'],
        isActive: true,
        hireDate: '2020-01-15',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'emp-2',
        lastName: 'Петрова',
        firstName: 'Мария',
        middleName: 'Сергеевна',
        position: 'Специалист по оценке',
        region: 'Москва',
        email: 'petrova@bank.ru',
        phone: '+7 (495) 123-45-68',
        department: 'Отдел оценки',
        permissions: ['registry_view', 'conclusions_view', 'conclusions_edit', 'tasks_view'],
        isActive: true,
        hireDate: '2021-03-20',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'emp-3',
        lastName: 'Сидоров',
        firstName: 'Алексей',
        middleName: 'Владимирович',
        position: 'Менеджер по работе с залогами',
        region: 'Санкт-Петербург',
        email: 'sidorov@bank.ru',
        phone: '+7 (812) 234-56-78',
        department: 'Отдел залогового обеспечения',
        permissions: ['registry_view', 'registry_edit', 'portfolio_view', 'tasks_view', 'tasks_edit'],
        isActive: true,
        hireDate: '2019-06-10',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'emp-4',
        lastName: 'Козлова',
        firstName: 'Елена',
        middleName: 'Александровна',
        position: 'Специалист по мониторингу',
        region: 'Новосибирск',
        email: 'kozlova@bank.ru',
        phone: '+7 (383) 345-67-89',
        department: 'Отдел мониторинга',
        permissions: ['registry_view', 'portfolio_view', 'tasks_view', 'reports_view'],
        isActive: true,
        hireDate: '2022-02-14',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'emp-5',
        lastName: 'Новиков',
        firstName: 'Дмитрий',
        middleName: 'Петрович',
        position: 'Менеджер по работе с залогами',
        region: 'Екатеринбург',
        email: 'novikov@bank.ru',
        phone: '+7 (343) 456-78-90',
        department: 'Отдел залогового обеспечения',
        permissions: ['registry_view', 'registry_edit', 'portfolio_view', 'tasks_view', 'tasks_edit'],
        isActive: true,
        hireDate: '2021-09-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Сохраняем демо-данные при первом запуске
    this.saveEmployees(defaultEmployees);
    return defaultEmployees;
  }
}

const employeeService = new EmployeeService();
export default employeeService;
