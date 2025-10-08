import { Employee, UserRole } from '../types';

// База данных сотрудников (по аналогии с Задачником)
export const employeesDatabase: Employee[] = [
  {
    id: 'emp-001',
    name: 'Александр Петров',
    email: 'a.petrov@company.com',
    phone: '+7 (495) 123-45-67',
    position: 'Руководитель отдела',
    department: 'Управление',
    role: 'manager',
    isActive: true,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'emp-002',
    name: 'Мария Иванова',
    email: 'm.ivanova@company.com',
    phone: '+7 (495) 234-56-78',
    position: 'Специалист по оценке',
    department: 'Оценка имущества',
    role: 'employee',
    isActive: true,
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'emp-003',
    name: 'Дмитрий Сидоров',
    email: 'd.sidorov@company.com',
    phone: '+7 (495) 345-67-89',
    position: 'IT-специалист',
    department: 'Информационные технологии',
    role: 'superuser',
    isActive: true,
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'emp-004',
    name: 'Елена Козлова',
    email: 'e.kozlova@company.com',
    phone: '+7 (495) 456-78-90',
    position: 'Бизнес-аналитик',
    department: 'Бизнес-развитие',
    role: 'business',
    isActive: true,
    createdAt: new Date('2023-04-05'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'emp-005',
    name: 'Сергей Волков',
    email: 's.volkov@company.com',
    phone: '+7 (495) 567-89-01',
    position: 'Оценщик недвижимости',
    department: 'Оценка имущества',
    role: 'employee',
    isActive: true,
    createdAt: new Date('2023-05-12'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'emp-006',
    name: 'Анна Морозова',
    email: 'a.morozova@company.com',
    phone: '+7 (495) 678-90-12',
    position: 'Руководитель проекта',
    department: 'Управление проектами',
    role: 'manager',
    isActive: true,
    createdAt: new Date('2023-06-18'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'emp-007',
    name: 'Игорь Новиков',
    email: 'i.novikov@company.com',
    phone: '+7 (495) 789-01-23',
    position: 'Специалист по залогам',
    department: 'Залоговые операции',
    role: 'employee',
    isActive: true,
    createdAt: new Date('2023-07-25'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'emp-008',
    name: 'Ольга Лебедева',
    email: 'o.lebedeva@company.com',
    phone: '+7 (495) 890-12-34',
    position: 'Администратор системы',
    department: 'Информационные технологии',
    role: 'superuser',
    isActive: true,
    createdAt: new Date('2023-08-30'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'emp-009',
    name: 'Владимир Соколов',
    email: 'v.sokolov@company.com',
    phone: '+7 (495) 901-23-45',
    position: 'Бизнес-консультант',
    department: 'Бизнес-развитие',
    role: 'business',
    isActive: true,
    createdAt: new Date('2023-09-14'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'emp-010',
    name: 'Татьяна Кузнецова',
    email: 't.kuznetsova@company.com',
    phone: '+7 (495) 012-34-56',
    position: 'Оценщик движимого имущества',
    department: 'Оценка имущества',
    role: 'employee',
    isActive: true,
    createdAt: new Date('2023-10-22'),
    updatedAt: new Date('2024-01-15'),
  },
];

class EmployeeService {
  private employees: Employee[] = [...employeesDatabase];

  // Получить всех сотрудников
  getAllEmployees(): Employee[] {
    return this.employees;
  }

  // Получить сотрудника по ID
  getEmployeeById(id: string): Employee | undefined {
    return this.employees.find(emp => emp.id === id);
  }

  // Получить сотрудников по роли
  getEmployeesByRole(role: UserRole): Employee[] {
    return this.employees.filter(emp => emp.role === role);
  }

  // Получить сотрудников по отделу
  getEmployeesByDepartment(department: string): Employee[] {
    return this.employees.filter(emp => emp.department === department);
  }

  // Добавить нового сотрудника
  addEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    const newEmployee: Employee = {
      ...employee,
      id: `emp-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.employees.push(newEmployee);
    return newEmployee;
  }

  // Обновить сотрудника
  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index === -1) return null;

    this.employees[index] = {
      ...this.employees[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.employees[index];
  }

  // Удалить сотрудника
  deleteEmployee(id: string): boolean {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index === -1) return false;

    this.employees.splice(index, 1);
    return true;
  }

  // Получить статистику по ролям
  getRoleStatistics(): Record<UserRole, number> {
    const stats: Record<UserRole, number> = {
      business: 0,
      employee: 0,
      manager: 0,
      superuser: 0,
    };

    this.employees.forEach(emp => {
      if (emp.isActive) {
        stats[emp.role]++;
      }
    });

    return stats;
  }

  // Получить все отделы
  getDepartments(): string[] {
    const departments = new Set(this.employees.map(emp => emp.department));
    return Array.from(departments).sort();
  }

  // Получить все должности
  getPositions(): string[] {
    const positions = new Set(this.employees.map(emp => emp.position));
    return Array.from(positions).sort();
  }
}

export const employeeService = new EmployeeService();
export default employeeService;
