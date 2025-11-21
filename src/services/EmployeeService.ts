/**
 * Сервис для управления сотрудниками
 */

import type { Employee } from '@/types/employee';
import { REGION_CENTERS } from '@/utils/regionCenters';

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
      const employees = JSON.parse(data);
      
      // Проверяем, что сотрудников достаточно (должно быть ~180 для 6 региональных центров по 30)
      // Если меньше 100, пересоздаем базу
      if (!Array.isArray(employees) || employees.length < 100) {
        console.warn('Обнаружено недостаточное количество сотрудников, пересоздаем базу...');
        return this.getDefaultEmployees();
      }
      
      return employees;
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
      return this.getDefaultEmployees();
    }
  }

  /**
   * Принудительно пересоздать базу сотрудников
   */
  regenerateEmployees(): Employee[] {
    console.log('Принудительная регенерация базы сотрудников...');
    return this.getDefaultEmployees();
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
   * По региональным центрам: 20-35 сотрудников на регион
   * 15% для мониторинга, 30% для оценки
   */
  private getDefaultEmployees(): Employee[] {
    const defaultEmployees: Employee[] = [];
    
    const surnames = [
      'Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Лебедев', 'Козлов', 'Новиков',
      'Морозов', 'Волков', 'Соловьев', 'Васильев', 'Зайцев', 'Павлов', 'Семенов', 'Голубев', 'Виноградов', 'Богданов',
      'Воробьев', 'Федоров', 'Михайлов', 'Белов', 'Тарасов', 'Беляев', 'Комаров', 'Орлов', 'Киселев', 'Макаров',
      'Андреев', 'Ковалев', 'Ильин', 'Гусев', 'Титов', 'Кузьмин', 'Кудрявцев', 'Баранов', 'Куликов', 'Алексеев',
    ];
    const firstNames = [
      'Иван', 'Петр', 'Сергей', 'Александр', 'Дмитрий', 'Андрей', 'Михаил', 'Николай', 'Владимир', 'Алексей',
      'Мария', 'Елена', 'Анна', 'Ольга', 'Татьяна', 'Наталья', 'Ирина', 'Светлана', 'Екатерина', 'Юлия',
      'Анастасия', 'Дарья', 'Виктория', 'Евгения', 'Кристина', 'Ангелина', 'Валентина', 'Галина', 'Людмила', 'Надежда',
    ];
    const middleNames = [
      'Иванович', 'Петрович', 'Сергеевич', 'Александрович', 'Дмитриевич', 'Андреевич', 'Михайлович', 'Николаевич', 'Владимирович', 'Алексеевич',
      'Ивановна', 'Петровна', 'Сергеевна', 'Александровна', 'Дмитриевна', 'Андреевна', 'Михайловна', 'Николаевна', 'Владимировна', 'Алексеевна',
    ];
    
    const positions = [
      'Менеджер по работе с залогами',
      'Специалист по мониторингу',
      'Специалист по оценке',
      'Руководитель отдела',
      'Ведущий специалист',
      'Главный специалист',
      'Эксперт',
      'Аналитик',
    ];
    
    const departments = [
      'Отдел залогового обеспечения',
      'Отдел мониторинга',
      'Отдел оценки',
      'Отдел рисков',
      'Отдел кредитования',
    ];
    
    let globalIndex = 1;
    
    // Генерируем сотрудников по каждому региональному центру
    REGION_CENTERS.forEach((center, centerIndex) => {
      // 30 сотрудников на каждый региональный центр
      const employeesPerRegion = 30;
      
      // Определяем, какой город будет иметь руководителя (первый город региона)
      const managerCityIndex = 0;
      let managerAssigned = false; // Флаг, чтобы назначить только одного руководителя на регион
      
      center.cities.forEach((city, cityIndex) => {
        // Распределяем сотрудников по городам региона равномерно
        const baseEmployeesPerCity = Math.floor(employeesPerRegion / center.cities.length);
        const remainder = employeesPerRegion % center.cities.length;
        const employeesPerCity = baseEmployeesPerCity + (cityIndex < remainder ? 1 : 0);
        
        for (let i = 0; i < employeesPerCity; i++) {
          // Первый сотрудник в первом городе региона становится руководителем (только один на регион)
          const isManager = !managerAssigned && cityIndex === managerCityIndex && i === 0;
          if (isManager) {
            managerAssigned = true;
          }
          const nameIndex = (globalIndex - 1) % surnames.length;
          const lastName = surnames[nameIndex];
          const firstName = firstNames[(globalIndex - 1) % firstNames.length];
          const middleName = middleNames[(globalIndex - 1) % middleNames.length];
          
          // Определяем роли: 15% мониторинг, 30% оценка
          const roleRandom = Math.random();
          const isMonitoring = roleRandom < 0.15;
          const isAppraisal = roleRandom >= 0.15 && roleRandom < 0.45;
          
          // Если руководитель - назначаем соответствующую должность
          let positionIndex = isMonitoring ? 1 : isAppraisal ? 2 : 0;
          let departmentIndex = isMonitoring ? 1 : isAppraisal ? 2 : 0;
          
          if (isManager) {
            positionIndex = 3; // 'Руководитель отдела'
            departmentIndex = 0; // 'Отдел залогового обеспечения'
          }
          
          const position = positions[positionIndex];
          const department = departments[departmentIndex];
          
          // Генерируем email и телефон
          const emailBase = `${lastName.toLowerCase()}.${firstName.toLowerCase()}`;
          const email = `${emailBase}${globalIndex}@bank.ru`;
          const phoneCode = 495 + (centerIndex * 10) + cityIndex;
          const phone = `+7 (${phoneCode}) ${String(100 + (globalIndex % 900)).padStart(3, '0')}-${String(10 + (globalIndex % 90)).padStart(2, '0')}-${String(10 + (globalIndex % 90)).padStart(2, '0')}`;
          
          // Генерируем дату рождения (возраст 25-55 лет)
          const birthYear = 1970 + (globalIndex % 30);
          const birthMonth = (globalIndex % 12) + 1;
          const birthDay = (globalIndex % 28) + 1;
          const birthDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
          
          // Табельный номер (6 цифр)
          const employeeNumber = String(100000 + globalIndex).padStart(6, '0');
          
          // Статус (большинство на работе)
          const statusRandom = Math.random();
          const status = statusRandom < 0.85 ? 'working' : 
                        statusRandom < 0.90 ? 'sick_leave' :
                        statusRandom < 0.95 ? 'vacation' : 'business_trip';
          
          defaultEmployees.push({
            id: `emp-${globalIndex}`,
            lastName,
            firstName,
            middleName,
            position,
            region: city,
            email,
            phone,
            department,
            permissions: isManager 
              ? ['registry_view', 'registry_edit', 'portfolio_view', 'portfolio_edit', 'tasks_view', 'tasks_edit', 'reports_view', 'reports_export', 'settings_view']
              : ['registry_view', 'portfolio_view', 'tasks_view'],
            isActive: true,
            canMonitor: isMonitoring,
            canAppraise: isAppraisal,
            monitoringWorkload: 0,
            appraisalWorkload: 0,
            isManager,
            birthDate,
            employeeNumber,
            status: status as 'working' | 'sick_leave' | 'vacation' | 'business_trip',
            hireDate: `202${Math.floor(globalIndex / 100)}-${String((globalIndex % 12) + 1).padStart(2, '0')}-${String((globalIndex % 28) + 1).padStart(2, '0')}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          globalIndex++;
        }
      });
    });

    // Сохраняем демо-данные при первом запуске
    this.saveEmployees(defaultEmployees);
    return defaultEmployees;
  }
}

const employeeService = new EmployeeService();
export default employeeService;
