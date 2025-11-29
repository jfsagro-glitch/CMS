/**
 * Генерация задач для сотрудников в формате Задачника
 */

import employeeService from '@/services/EmployeeService';
import extendedStorageService from '@/services/ExtendedStorageService';
import type { TaskDB } from '@/services/ExtendedStorageService';
import dayjs from 'dayjs';
import { REGION_CENTERS } from '@/utils/regionCenters';
import {
  TASK_NORM_HOURS,
  WORK_HOURS_PER_MONTH,
} from '@/utils/workloadCalculator';

// Используем TaskDB из ExtendedStorageService
type Task = TaskDB;

// Бизнес-пользователи (для генерации задач)
const BUSINESS_USERS = [
  { email: 'business1@bank.ru', name: 'Иванов Иван Иванович' },
  { email: 'business2@bank.ru', name: 'Петрова Мария Сергеевна' },
  { email: 'business3@bank.ru', name: 'Сидоров Петр Александрович' },
  { email: 'business4@bank.ru', name: 'Козлова Анна Дмитриевна' },
  { email: 'business5@bank.ru', name: 'Волков Сергей Николаевич' },
];

// Названия задач по типам
const TASK_TITLES_BY_TYPE: Record<string, string[]> = {
  'Оценка': [
    'Провести оценку объекта недвижимости',
    'Выполнить оценку движимого имущества',
    'Организовать переоценку объекта залога',
    'Подготовить отчет об оценке',
    'Провести независимую оценку',
    'Оценить рыночную стоимость объекта',
    'Выполнить оценку для целей залога',
    'Провести оценку коммерческой недвижимости',
    'Оценить земельный участок',
    'Подготовить экспертное заключение по оценке',
  ],
  'Экспертиза': [
    'Провести экспертизу документов',
    'Выполнить техническую экспертизу объекта',
    'Проверить юридическую чистоту',
    'Провести строительно-техническую экспертизу',
    'Организовать экспертизу оценки',
    'Провести судебную экспертизу',
    'Выполнить экологическую экспертизу',
    'Проверить техническое состояние объекта',
    'Провести экспертизу проектной документации',
    'Выполнить финансовую экспертизу',
  ],
  'Рецензия': [
    'Провести рецензию отчета об оценке',
    'Выполнить рецензирование экспертизы',
    'Проверить качество оценки',
    'Подготовить рецензию на заключение',
    'Провести независимую рецензию',
    'Выполнить рецензирование отчета',
    'Проверить соответствие стандартам оценки',
    'Подготовить экспертное заключение по рецензии',
  ],
  'ПРКК': [
    'Провести проверку рисков',
    'Выполнить анализ кредитных рисков',
    'Проверить залоговое обеспечение',
    'Оценить риски по сделке',
    'Провести комплексную проверку рисков',
    'Выполнить анализ залоговых рисков',
    'Оценить рыночные риски',
    'Проверить ликвидность залога',
    'Выполнить стресс-тестирование',
    'Провести анализ концентрации рисков',
  ],
  'Прочее': [
    'Провести мониторинг объекта залога',
    'Проверить комплектность документов',
    'Связаться с клиентом',
    'Обновить данные в реестре',
    'Проверить срок действия страховки',
    'Провести осмотр объекта',
    'Подготовить справку',
    'Оформить документы',
    'Проверить соответствие требованиям',
    'Выполнить консультацию',
  ],
  'Отчетность': [
    'Подготовить аналитический отчет',
    'Сформировать отчет по портфелю',
    'Подготовить отчет для руководства',
    'Обновить отчетность',
    'Подготовить ежемесячный отчет',
    'Сформировать квартальный отчет',
    'Подготовить отчет по региону',
    'Выполнить сводный отчет',
    'Подготовить отчет по рискам',
    'Сформировать статистический отчет',
  ],
  'Подготовка СЗ': [
    'Подготовить залоговое заключение',
    'Оформить документы по залогу',
    'Подготовить пакет документов',
    'Согласовать условия залога',
    'Подготовить заключение по залогу',
    'Оформить залоговое обеспечение',
    'Подготовить документы для регистрации',
    'Согласовать залоговое заключение',
    'Подготовить проект залогового договора',
    'Оформить залоговую документацию',
  ],
  'Мониторинг': [
    'Провести плановый мониторинг объекта',
    'Выполнить внеплановый мониторинг',
    'Проверить состояние объекта залога',
    'Провести мониторинг рыночной стоимости',
    'Выполнить мониторинг документов',
    'Проверить использование объекта',
    'Провести мониторинг страховки',
    'Выполнить контрольный мониторинг',
    'Проверить сохранность залога',
    'Провести комплексный мониторинг',
  ],
  'Осмотр': [
    'Провести первичный осмотр объекта',
    'Выполнить повторный осмотр',
    'Провести внеплановый осмотр',
    'Организовать осмотр объекта залога',
    'Проверить техническое состояние',
    'Провести осмотр с фотофиксацией',
    'Выполнить осмотр с оценщиком',
    'Провести осмотр недвижимости',
    'Организовать осмотр движимого имущества',
    'Проверить соответствие описанию',
  ],
  'Проверка документов': [
    'Проверить комплектность документов',
    'Выполнить проверку подлинности',
    'Проверить соответствие требованиям',
    'Провести правовую проверку',
    'Выполнить проверку регистрации',
    'Проверить срок действия документов',
    'Провести комплексную проверку',
    'Выполнить проверку на обременения',
    'Проверить правоустанавливающие документы',
    'Провести проверку кадастровых документов',
  ],
  'Согласование': [
    'Согласовать условия залога',
    'Провести согласование с клиентом',
    'Согласовать оценку',
    'Выполнить согласование документов',
    'Провести согласование с руководством',
    'Согласовать условия сделки',
    'Выполнить межведомственное согласование',
    'Провести согласование с партнерами',
    'Согласовать залоговое заключение',
    'Провести финальное согласование',
  ],
  'Контроль качества': [
    'Провести контроль качества оценки',
    'Выполнить проверку качества документов',
    'Проверить качество экспертизы',
    'Провести контроль качества работы',
    'Выполнить аудит качества',
    'Проверить соответствие стандартам',
    'Провести внутренний контроль',
    'Выполнить проверку на ошибки',
    'Проверить полноту информации',
    'Провести финальный контроль',
  ],
};

// Описания задач
const getTaskDescription = (type: string, title: string, region: string): string => {
  const baseDescriptions: Record<string, string> = {
    'Оценка': `Требуется выполнить оценку объекта в регионе ${region}. ${title}`,
    'Экспертиза': `Необходимо провести экспертизу в регионе ${region}. ${title}`,
    'Рецензия': `Требуется рецензирование в регионе ${region}. ${title}`,
    'ПРКК': `Провести проверку рисков в регионе ${region}. ${title}`,
    'Прочее': `Задача в регионе ${region}. ${title}`,
    'Отчетность': `Подготовить отчетность по региону ${region}. ${title}`,
    'Подготовка СЗ': `Подготовить залоговое заключение в регионе ${region}. ${title}`,
    'Мониторинг': `Провести мониторинг в регионе ${region}. ${title}`,
    'Осмотр': `Провести осмотр объекта в регионе ${region}. ${title}`,
    'Проверка документов': `Проверить документы в регионе ${region}. ${title}`,
    'Согласование': `Провести согласование в регионе ${region}. ${title}`,
    'Контроль качества': `Провести контроль качества в регионе ${region}. ${title}`,
  };
  return baseDescriptions[type] || `${title} в регионе ${region}`;
};

/**
 * Генерация задач для всех сотрудников в формате Задачника
 * С учетом нормочасов и целевой загрузки 85-125% по региональным центрам
 */
export const generateTasksForEmployees = async (): Promise<void> => {
  try {
    const employees = employeeService.getEmployees().filter(emp => emp.isActive);
    const tasks: Task[] = [];
    const now = dayjs();
    
    // Группируем сотрудников по региональным центрам
    const employeesByCenter: Record<string, typeof employees> = {};
    REGION_CENTERS.forEach(center => {
      employeesByCenter[center.code] = employees.filter(emp => 
        center.cities.includes(emp.region) || emp.region === center.code
      );
    });
    
    // Генерируем задачи для каждого регионального центра
    REGION_CENTERS.forEach(center => {
      const centerEmployees = employeesByCenter[center.code] || [];
      // Исключаем менеджеров и сотрудников в отпуске, больничном и командировке
      const workingEmployees = centerEmployees.filter(
        emp => emp.isActive && 
               !emp.isManager &&
               emp.status !== 'sick_leave' &&
               emp.status !== 'vacation' &&
               emp.status !== 'business_trip' &&
               (!emp.status || emp.status === 'working')
      );
      const managers = centerEmployees.filter(emp => emp.isActive && emp.isManager);
      
      if (workingEmployees.length === 0 || managers.length === 0) return;
      
      // Распределяем нормочасы между сотрудниками
      workingEmployees.forEach((employee) => {
        // Для каждого сотрудника генерируем загрузку в диапазоне 85-125% по задачам в работе
        const employeeWorkloadPercent = 85 + Math.random() * 40; // 85-125%
        const employeeTargetNormHoursInWork = (employeeWorkloadPercent / 100) * WORK_HOURS_PER_MONTH;
        
        // Распределение задач в работе: assigned (10), in_progress (5), approval (4) частей
        const assignedNormHours = employeeTargetNormHoursInWork * (10 / 19);
        const inProgressNormHours = employeeTargetNormHoursInWork * (5 / 19);
        const approvalNormHours = Math.max(
          2,
          employeeTargetNormHoursInWork - assignedNormHours - inProgressNormHours
        );
        
        // Для истории генерируем выполненные/согласованные задачи (примерно в 3.2 раза больше, чем задачи в работе)
        const completedNormHours = employeeTargetNormHoursInWork * 3.2;
        // Немного просроченных задач (5% от задач в работе, но минимум 2 нормочаса)
        const overdueNormHours = Math.max(employeeTargetNormHoursInWork * 0.05, 2);
        
        const employeeRegion = employee.region;
        const businessUser = BUSINESS_USERS[Math.floor(Math.random() * BUSINESS_USERS.length)];
        const employeeFullName = `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim();
        
        // Находим руководителя для этого региона
        const manager = managers[0]; // Берем первого руководителя центра
        const managerFullName = manager ? `${manager.lastName} ${manager.firstName} ${manager.middleName || ''}`.trim() : '';
        
        // Генерируем задачи для каждого статуса
        const generateTasksForStatus = (
          targetNormHours: number,
          status: 'completed' | 'in_progress' | 'assigned' | 'approval' | 'approved',
          isOverdue: boolean = false
        ) => {
          const generatedTasks: Task[] = [];
          let currentNormHours = 0;
          
          // Создаем список типов задач с их нормочасами, отсортированный по убыванию
          const taskTypesWithHours = Object.entries(TASK_NORM_HOURS)
            .map(([type, hours]) => ({ type, hours }))
            .sort((a, b) => b.hours - a.hours);
          
          while (currentNormHours < targetNormHours) {
            // Выбираем тип задачи, который впишется в оставшиеся нормочасы
            const remainingHours = targetNormHours - currentNormHours;
            const availableTypes = taskTypesWithHours.filter(t => t.hours <= remainingHours);
            
            if (availableTypes.length === 0) break;
            
            // Предпочитаем задачи с большими нормочасами, но иногда выбираем случайно
            const selectedType = Math.random() > 0.3 
              ? availableTypes[0] 
              : availableTypes[Math.floor(Math.random() * Math.min(3, availableTypes.length))];
            
            let taskType = selectedType.type;
            let normHours = selectedType.hours;
            
            // Специальная обработка для "Подготовка СЗ"
            if (taskType === 'Подготовка СЗ') {
              // 10% задач - АЗС (24 часа), остальные - обычные (6 часов)
              if (Math.random() < 0.1 && remainingHours >= 24) {
                taskType = 'Подготовка СЗ (АЗС)';
                normHours = 24;
              } else {
                normHours = 6;
              }
            }
            
            if (normHours > remainingHours) break;
            
            const daysAgo = Math.floor(Math.random() * 90);
            const createdAt = now.subtract(daysAgo + (status === 'completed' ? 30 : 0), 'day');
            const completedAt = status === 'completed' 
              ? createdAt.add(Math.floor(Math.random() * 20), 'day')
              : null;
            const dueDate = isOverdue
              ? now.subtract(1 + Math.floor(Math.random() * 30), 'day')
              : status === 'completed' && completedAt
              ? completedAt.add(Math.floor(Math.random() * 10), 'day')
              : now.add(Math.floor(Math.random() * 30) + 1, 'day');
            
            const titles = TASK_TITLES_BY_TYPE[taskType] || TASK_TITLES_BY_TYPE['Прочее'] || ['Задача'];
            const title = titles[Math.floor(Math.random() * titles.length)];
            const description = getTaskDescription(taskType, title, employeeRegion);
            
            const taskId = `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const createdAtISO = createdAt.toISOString();
            
            // Определяем статус и историю в зависимости от типа задачи
            let taskStatus = status;
            let assignedToEmails: string[] = [];
            let currentAssigneeEmail: string | null = null;
            let currentAssigneeName: string | null = null;
            const historyItems: any[] = [
              {
                date: createdAtISO,
                user: businessUser.name,
                userRole: 'business',
                action: 'Создана',
                comment: 'Задача создана бизнесом',
                status: 'created',
              },
            ];
            
            if (status === 'completed' || status === 'approved') {
              // Завершенные задачи: прошли полный цикл
              const assignedDate = createdAt.add(1, 'day');
              const inProgressDate = assignedDate.add(1, 'day');
              const approvalDate = inProgressDate.add(Math.floor(Math.random() * 10), 'day');
              const completedDate = status === 'approved' && completedAt ? completedAt : approvalDate.add(1, 'day');
              
              assignedToEmails = employee.email ? [employee.email] : [];
              currentAssigneeEmail = employee.email || null;
              currentAssigneeName = employeeFullName;
              
              historyItems.push(
                {
                  date: assignedDate.toISOString(),
                  user: managerFullName || 'Руководитель',
                  userRole: 'manager',
                  action: 'Распределена',
                  comment: `Назначена на: ${employeeFullName}`,
                  status: 'assigned',
                  assignedTo: assignedToEmails,
                },
                {
                  date: inProgressDate.toISOString(),
                  user: employeeFullName,
                  userRole: 'employee',
                  action: 'Принята в работу',
                  comment: 'Задача принята в работу',
                  status: 'in_progress',
                },
                {
                  date: approvalDate.toISOString(),
                  user: employeeFullName,
                  userRole: 'employee',
                  action: 'Отправлена на утверждение',
                  comment: 'Задача отправлена на согласование руководителю',
                  status: 'approval',
                },
                {
                  date: completedDate.toISOString(),
                  user: managerFullName || 'Руководитель',
                  userRole: 'manager',
                  action: status === 'approved' ? 'Согласовано' : 'Выполнена',
                  comment: status === 'approved' ? 'Задача согласована руководителем' : 'Задача выполнена',
                  status: status === 'approved' ? 'approved' : 'completed',
                }
              );
              
              taskStatus = status === 'approved' ? 'approved' : 'completed';
            } else if (status === 'in_progress') {
              // Задачи в работе: распределены и приняты сотрудником
              const assignedDate = createdAt.add(1, 'day');
              const inProgressDate = assignedDate.add(1, 'day');
              
              assignedToEmails = employee.email ? [employee.email] : [];
              currentAssigneeEmail = employee.email || null;
              currentAssigneeName = employeeFullName;
              
              historyItems.push(
                {
                  date: assignedDate.toISOString(),
                  user: managerFullName || 'Руководитель',
                  userRole: 'manager',
                  action: 'Распределена',
                  comment: `Назначена на: ${employeeFullName}`,
                  status: 'assigned',
                  assignedTo: assignedToEmails,
                },
                {
                  date: inProgressDate.toISOString(),
                  user: employeeFullName,
                  userRole: 'employee',
                  action: 'Принята в работу',
                  comment: 'Задача принята в работу',
                  status: 'in_progress',
                }
              );
              
              taskStatus = 'in_progress';
            } else if (status === 'assigned') {
              // Задачи распределены руководителем, но еще не приняты сотрудником
              const assignedDate = createdAt.add(1, 'day');
              
              assignedToEmails = employee.email ? [employee.email] : [];
              currentAssigneeEmail = employee.email || null;
              currentAssigneeName = employeeFullName;
              
              historyItems.push({
                date: assignedDate.toISOString(),
                user: managerFullName || 'Руководитель',
                userRole: 'manager',
                action: 'Распределена',
                comment: `Назначена на: ${employeeFullName}`,
                status: 'assigned',
                assignedTo: assignedToEmails,
              });
              
              taskStatus = 'assigned';
            } else if (status === 'approval') {
              // Задачи на согласовании у руководителя
              const assignedDate = createdAt.add(1, 'day');
              const inProgressDate = assignedDate.add(1, 'day');
              const approvalDate = inProgressDate.add(Math.floor(Math.random() * 10), 'day');
              
              assignedToEmails = employee.email ? [employee.email] : [];
              currentAssigneeEmail = manager?.email || null;
              currentAssigneeName = managerFullName;
              
              historyItems.push(
                {
                  date: assignedDate.toISOString(),
                  user: managerFullName || 'Руководитель',
                  userRole: 'manager',
                  action: 'Распределена',
                  comment: `Назначена на: ${employeeFullName}`,
                  status: 'assigned',
                  assignedTo: assignedToEmails,
                },
                {
                  date: inProgressDate.toISOString(),
                  user: employeeFullName,
                  userRole: 'employee',
                  action: 'Принята в работу',
                  comment: 'Задача принята в работу',
                  status: 'in_progress',
                },
                {
                  date: approvalDate.toISOString(),
                  user: employeeFullName,
                  userRole: 'employee',
                  action: 'Отправлена на утверждение',
                  comment: 'Задача отправлена на согласование руководителю',
                  status: 'approval',
                }
              );
              
              taskStatus = 'approval';
            }
            
            generatedTasks.push({
              id: taskId,
              region: employeeRegion,
              type: taskType,
              category: taskType,
              title,
              description,
              priority: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
              dueDate: dueDate.format('YYYY-MM-DD'),
              status: taskStatus,
              businessUser: businessUser.email,
              businessUserName: businessUser.name,
              assignedTo: assignedToEmails,
              currentAssignee: currentAssigneeEmail,
              currentAssigneeName: currentAssigneeName,
              employeeId: employee.id,
              documents: [],
              comments: [],
              createdAt: createdAtISO,
              updatedAt: status === 'completed' && completedAt ? completedAt.toISOString() : now.toISOString(),
              completedAt: status === 'completed' && completedAt ? completedAt.toISOString() : undefined,
              history: historyItems,
            });
            
            currentNormHours += normHours;
          }
          
          return generatedTasks;
        };
        
        // Генерируем задачи по статусам
        // Важно: в загрузку идут только задачи со статусами assigned, in_progress, approval
        const completedTasks = generateTasksForStatus(completedNormHours * 0.8, 'completed');
        const approvedTasks = generateTasksForStatus(completedNormHours * 0.2, 'approved');
        const overdueTasks = generateTasksForStatus(overdueNormHours, 'in_progress', true);
        const assignedTasks = generateTasksForStatus(assignedNormHours, 'assigned');
        const inProgressTasks = generateTasksForStatus(inProgressNormHours, 'in_progress');
        const approvalTasks = generateTasksForStatus(approvalNormHours, 'approval');
        
        tasks.push(...completedTasks, ...approvedTasks, ...overdueTasks, ...assignedTasks, ...inProgressTasks, ...approvalTasks);
      });
    });
    
    // Сохраняем задачи в IndexedDB (не в localStorage, так как данные слишком большие)
    try {
      await extendedStorageService.saveTasks(tasks);
      console.log(`✅ Задачи сохранены в IndexedDB (${tasks.length} задач)`);
      
      // Пытаемся очистить старые данные из localStorage, если они есть
      try {
        localStorage.removeItem('zadachnik_tasks');
      } catch (e) {
        // Игнорируем ошибку, если не удалось удалить (не критично)
      }
    } catch (error) {
      console.error('Ошибка сохранения задач в IndexedDB:', error);
      throw error;
    }
    
    // НЕ сохраняем в localStorage, так как данные слишком большие
    // Все данные теперь хранятся в IndexedDB, а чтение из localStorage используется только как fallback
    
    // Статистика по типам задач
    const tasksByType = tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const activeEmployees = employees.filter(emp => emp.isActive);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'created').length;
    const overdueTasks = tasks.filter(t => dayjs(t.dueDate).isBefore(dayjs(), 'day') && t.status !== 'completed').length;
    
    console.log(`✅ Сгенерировано ${tasks.length} задач для ${activeEmployees.length} активных сотрудников`);
    console.log(`   - Среднее количество задач на сотрудника: ${(tasks.length / activeEmployees.length).toFixed(1)}`);
    console.log(`   - Выполнено: ${completedTasks} (${((completedTasks / tasks.length) * 100).toFixed(1)}%)`);
    console.log(`   - В работе: ${inProgressTasks} (${((inProgressTasks / tasks.length) * 100).toFixed(1)}%)`);
    console.log(`   - Просрочено: ${overdueTasks} (${((overdueTasks / tasks.length) * 100).toFixed(1)}%)`);
    console.log(`   - Распределение по типам задач:`, Object.entries(tasksByType).map(([type, count]) => `${type}: ${count}`).join(', '));
  } catch (error) {
    console.error('Ошибка генерации задач:', error);
    throw error;
  }
};

