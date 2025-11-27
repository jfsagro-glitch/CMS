/**
 * Генерация задач для сотрудников в формате Задачника
 */

import employeeService from '@/services/EmployeeService';
import dayjs from 'dayjs';

interface Task {
  id: string;
  region: string;
  type: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  status: 'created' | 'pending' | 'in_progress' | 'completed' | 'Выполнено' | 'В работе';
  businessUser: string;
  businessUserName: string;
  assignedTo: string[];
  currentAssignee: string | null;
  currentAssigneeName: string | null;
  employeeId?: string;
  documents: any[];
  comments: any[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  history: Array<{
    date: string;
    user: string;
    userRole: string;
    action: string;
    comment?: string;
    status: string;
  }>;
}

// Типы задач из Задачника
const TASK_TYPES = [
  'Оценка',
  'Экспертиза',
  'Рецензия',
  'ПРКК',
  'Прочее',
  'Отчетность',
  'Подготовка СЗ',
  'Мониторинг',
  'Осмотр',
  'Проверка документов',
  'Согласование',
  'Контроль качества',
];

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
 */
export const generateTasksForEmployees = (): void => {
  try {
    const employees = employeeService.getEmployees().filter(emp => emp.isActive);
    const tasks: Task[] = [];
    const now = dayjs();
    
    employees.forEach(employee => {
      // Генерируем 60-80 задач на сотрудника для полной статистики
      const tasksCount = 60 + Math.floor(Math.random() * 21); // 60-80 задач
      
      // Распределение: большая часть выполнена, 2-3% просрочена, остальные в работе
      // Для более реалистичной статистики
      const completedCount = Math.floor(tasksCount * 0.82); // 82% выполнено
      const overdueCount = Math.max(1, Math.floor(tasksCount * 0.02)); // 2% просрочено (минимум 1)
      const pendingCount = tasksCount - completedCount - overdueCount; // остальные в работе (16%)
      
      // Определяем регион сотрудника
      const employeeRegion = employee.region;
      
      // Выбираем случайного бизнес-пользователя
      const businessUser = BUSINESS_USERS[Math.floor(Math.random() * BUSINESS_USERS.length)];
      
      // Полное имя сотрудника
      const employeeFullName = `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim();
      
      // Счетчик для циклического использования всех типов задач
      let typeIndexCounter = 0;
      
      // Генерируем выполненные задачи
      for (let i = 0; i < completedCount; i++) {
        const daysAgo = Math.floor(Math.random() * 90); // выполнены в последние 90 дней
        const createdAt = now.subtract(daysAgo + 30, 'day');
        const completedAt = createdAt.add(Math.floor(Math.random() * 20), 'day');
        const dueDate = completedAt.add(Math.floor(Math.random() * 10), 'day');
        
        // Циклически используем все типы задач для равномерного распределения
        const taskType = TASK_TYPES[typeIndexCounter % TASK_TYPES.length];
        typeIndexCounter++;
        const titles = TASK_TITLES_BY_TYPE[taskType] || TASK_TITLES_BY_TYPE['Прочее'];
        const title = titles[Math.floor(Math.random() * titles.length)];
        const description = getTaskDescription(taskType, title, employeeRegion);
        
        const taskId = `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const createdAtISO = createdAt.toISOString();
        const completedAtISO = completedAt.toISOString();
        
        tasks.push({
          id: taskId,
          region: employeeRegion,
          type: taskType,
          title,
          description,
          priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
          dueDate: dueDate.format('YYYY-MM-DD'),
          status: 'completed',
          businessUser: businessUser.email,
          businessUserName: businessUser.name,
          assignedTo: employee.email ? [employee.email] : [],
          currentAssignee: employee.email || null,
          currentAssigneeName: employeeFullName,
          employeeId: employee.id,
          documents: [],
          comments: [],
          createdAt: createdAtISO,
          updatedAt: completedAtISO,
          completedAt: completedAtISO,
          history: [
            {
              date: createdAtISO,
              user: businessUser.name,
              userRole: 'business',
              action: 'Создана',
              comment: `Задача создана для сотрудника ${employeeFullName}`,
              status: 'created',
            },
            {
              date: completedAtISO,
              user: employeeFullName,
              userRole: employee.isManager ? 'manager' : 'employee',
              action: 'Выполнена',
              comment: 'Задача выполнена',
              status: 'completed',
            },
          ],
        });
      }
      
      // Генерируем просроченные задачи
      for (let i = 0; i < overdueCount; i++) {
        const daysOverdue = 1 + Math.floor(Math.random() * 30); // просрочены на 1-30 дней
        const createdAt = now.subtract(60 + daysOverdue, 'day');
        const dueDate = now.subtract(daysOverdue, 'day');
        
        // Используем разные типы задач для просроченных
        const taskType = TASK_TYPES[typeIndexCounter % TASK_TYPES.length];
        typeIndexCounter++;
        const titles = TASK_TITLES_BY_TYPE[taskType] || TASK_TITLES_BY_TYPE['Прочее'];
        const title = titles[Math.floor(Math.random() * titles.length)];
        const description = getTaskDescription(taskType, title, employeeRegion);
        
        const taskId = `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const createdAtISO = createdAt.toISOString();
        
        tasks.push({
          id: taskId,
          region: employeeRegion,
          type: taskType,
          title,
          description,
          priority: Math.random() > 0.5 ? 'high' : 'medium',
          dueDate: dueDate.format('YYYY-MM-DD'),
          status: 'in_progress',
          businessUser: businessUser.email,
          businessUserName: businessUser.name,
          assignedTo: employee.email ? [employee.email] : [],
          currentAssignee: employee.email || null,
          currentAssigneeName: employeeFullName,
          employeeId: employee.id,
          documents: [],
          comments: [],
          createdAt: createdAtISO,
          updatedAt: now.toISOString(),
          history: [
            {
              date: createdAtISO,
              user: businessUser.name,
              userRole: 'business',
              action: 'Создана',
              comment: `Задача создана для сотрудника ${employeeFullName}`,
              status: 'created',
            },
            {
              date: createdAt.toISOString(),
              user: employeeFullName,
              userRole: employee.isManager ? 'manager' : 'employee',
              action: 'Взята в работу',
              comment: 'Задача взята в работу',
              status: 'in_progress',
            },
          ],
        });
      }
      
      // Генерируем задачи в работе
      for (let i = 0; i < pendingCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30); // созданы в последние 30 дней
        const createdAt = now.subtract(daysAgo, 'day');
        const daysUntilDue = Math.floor(Math.random() * 30) + 1; // срок выполнения через 1-30 дней
        const dueDate = now.add(daysUntilDue, 'day');
        
        // Используем разные типы задач для задач в работе
        const taskType = TASK_TYPES[typeIndexCounter % TASK_TYPES.length];
        typeIndexCounter++;
        const titles = TASK_TITLES_BY_TYPE[taskType] || TASK_TITLES_BY_TYPE['Прочее'];
        const title = titles[Math.floor(Math.random() * titles.length)];
        const description = getTaskDescription(taskType, title, employeeRegion);
        
        const taskId = `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const createdAtISO = createdAt.toISOString();
        const status = daysAgo < 7 ? 'created' : 'in_progress';
        
        tasks.push({
          id: taskId,
          region: employeeRegion,
          type: taskType,
          title,
          description,
          priority: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
          dueDate: dueDate.format('YYYY-MM-DD'),
          status,
          businessUser: businessUser.email,
          businessUserName: businessUser.name,
          assignedTo: employee.email ? [employee.email] : [],
          currentAssignee: employee.email || null,
          currentAssigneeName: employeeFullName,
          employeeId: employee.id,
          documents: [],
          comments: [],
          createdAt: createdAtISO,
          updatedAt: now.toISOString(),
          history: [
            {
              date: createdAtISO,
              user: businessUser.name,
              userRole: 'business',
              action: 'Создана',
              comment: `Задача создана для сотрудника ${employeeFullName}`,
              status: 'created',
            },
            ...(status === 'in_progress' ? [{
              date: createdAt.add(1, 'day').toISOString(),
              user: employeeFullName,
              userRole: employee.isManager ? 'manager' : 'employee',
              action: 'Взята в работу',
              comment: 'Задача взята в работу',
              status: 'in_progress',
            }] : []),
          ],
        });
      }
    });
    
    // Сохраняем задачи в localStorage (формат zadachnik)
    localStorage.setItem('zadachnik_tasks', JSON.stringify(tasks));
    
    console.log(`✅ Сгенерировано ${tasks.length} задач для ${employees.length} сотрудников`);
    console.log(`   - Выполнено: ${tasks.filter(t => t.status === 'completed').length}`);
    console.log(`   - В работе: ${tasks.filter(t => t.status === 'in_progress' || t.status === 'created').length}`);
    console.log(`   - Просрочено: ${tasks.filter(t => dayjs(t.dueDate).isBefore(dayjs(), 'day') && t.status !== 'completed').length}`);
  } catch (error) {
    console.error('Ошибка генерации задач:', error);
    throw error;
  }
};

