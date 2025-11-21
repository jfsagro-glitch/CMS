/**
 * Генерация задач для сотрудников
 */

import employeeService from '@/services/EmployeeService';
import dayjs from 'dayjs';

interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: 'pending' | 'completed' | 'Выполнено' | 'В работе';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  employeeId?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const TASK_CATEGORIES = [
  'Мониторинг залогов',
  'Оценка объектов',
  'Проверка документов',
  'Взаимодействие с клиентами',
  'Аналитика и отчеты',
  'Работа с реестром',
  'Проверка страховок',
  'Обновление данных',
];

const TASK_TITLES = [
  'Провести мониторинг объекта залога',
  'Выполнить оценку недвижимости',
  'Проверить комплектность документов',
  'Связаться с клиентом по вопросу залога',
  'Подготовить аналитический отчет',
  'Обновить данные в реестре',
  'Проверить срок действия страховки',
  'Провести осмотр объекта',
  'Согласовать условия залога',
  'Проверить соответствие объекта требованиям',
  'Подготовить заключение по объекту',
  'Организовать переоценку',
  'Проверить юридическую чистоту',
  'Обновить информацию о заемщике',
  'Провести анализ рисков',
];

const TASK_DESCRIPTIONS = [
  'Необходимо провести полный мониторинг объекта залога согласно установленным процедурам',
  'Требуется выполнить оценку объекта недвижимости с выездом на место',
  'Проверить наличие всех необходимых документов и их актуальность',
  'Связаться с клиентом для уточнения деталей по залоговому обеспечению',
  'Подготовить аналитический отчет по портфелю залогов',
  'Обновить актуальную информацию об объекте в реестре',
  'Проверить срок действия страхового полиса и его соответствие требованиям',
  'Провести осмотр объекта с составлением акта',
  'Согласовать условия залога с заемщиком',
  'Проверить соответствие объекта установленным требованиям',
  'Подготовить заключение по результатам оценки объекта',
  'Организовать переоценку объекта в установленные сроки',
  'Проверить юридическую чистоту объекта и документов',
  'Обновить информацию о заемщике в базе данных',
  'Провести анализ рисков по объекту залога',
];

/**
 * Генерация задач для всех сотрудников
 */
export const generateTasksForEmployees = (): void => {
  try {
    const employees = employeeService.getEmployees().filter(emp => emp.isActive);
    const tasks: Task[] = [];
    
    employees.forEach(employee => {
      // Генерируем 30-50 задач на сотрудника
      const tasksCount = 30 + Math.floor(Math.random() * 21); // 30-50 задач
      
      // Распределение: большая часть выполнена, 1% просрочена, остальные в работе
      const completedCount = Math.floor(tasksCount * 0.85); // 85% выполнено
      const overdueCount = Math.max(1, Math.floor(tasksCount * 0.01)); // 1% просрочено (минимум 1)
      const pendingCount = tasksCount - completedCount - overdueCount; // остальные в работе
      
      const now = dayjs();
      
      // Генерируем выполненные задачи
      for (let i = 0; i < completedCount; i++) {
        const daysAgo = Math.floor(Math.random() * 90); // выполнены в последние 90 дней
        const createdAt = now.subtract(daysAgo + 30, 'day');
        const completedAt = createdAt.add(Math.floor(Math.random() * 20), 'day');
        const dueDate = completedAt.add(Math.floor(Math.random() * 10), 'day');
        
        const categoryIndex = Math.floor(Math.random() * TASK_CATEGORIES.length);
        const titleIndex = Math.floor(Math.random() * TASK_TITLES.length);
        
        tasks.push({
          id: `task-${employee.id}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: TASK_TITLES[titleIndex],
          description: TASK_DESCRIPTIONS[titleIndex],
          category: TASK_CATEGORIES[categoryIndex],
          status: 'completed',
          priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
          assignee: `${employee.lastName} ${employee.firstName}`,
          employeeId: employee.id,
          dueDate: dueDate.format('YYYY-MM-DD'),
          createdAt: createdAt.format('YYYY-MM-DD'),
          updatedAt: completedAt.format('YYYY-MM-DD'),
          completedAt: completedAt.format('YYYY-MM-DD'),
        });
      }
      
      // Генерируем просроченные задачи
      for (let i = 0; i < overdueCount; i++) {
        const daysOverdue = 1 + Math.floor(Math.random() * 30); // просрочены на 1-30 дней
        const createdAt = now.subtract(60 + daysOverdue, 'day');
        const dueDate = now.subtract(daysOverdue, 'day');
        
        const categoryIndex = Math.floor(Math.random() * TASK_CATEGORIES.length);
        const titleIndex = Math.floor(Math.random() * TASK_TITLES.length);
        
        tasks.push({
          id: `task-${employee.id}-overdue-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: TASK_TITLES[titleIndex],
          description: TASK_DESCRIPTIONS[titleIndex],
          category: TASK_CATEGORIES[categoryIndex],
          status: 'pending',
          priority: Math.random() > 0.5 ? 'high' : 'medium',
          assignee: `${employee.lastName} ${employee.firstName}`,
          employeeId: employee.id,
          dueDate: dueDate.format('YYYY-MM-DD'),
          createdAt: createdAt.format('YYYY-MM-DD'),
          updatedAt: now.format('YYYY-MM-DD'),
        });
      }
      
      // Генерируем задачи в работе
      for (let i = 0; i < pendingCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30); // созданы в последние 30 дней
        const createdAt = now.subtract(daysAgo, 'day');
        const daysUntilDue = Math.floor(Math.random() * 30) + 1; // срок выполнения через 1-30 дней
        const dueDate = now.add(daysUntilDue, 'day');
        
        const categoryIndex = Math.floor(Math.random() * TASK_CATEGORIES.length);
        const titleIndex = Math.floor(Math.random() * TASK_TITLES.length);
        
        tasks.push({
          id: `task-${employee.id}-pending-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: TASK_TITLES[titleIndex],
          description: TASK_DESCRIPTIONS[titleIndex],
          category: TASK_CATEGORIES[categoryIndex],
          status: 'pending',
          priority: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
          assignee: `${employee.lastName} ${employee.firstName}`,
          employeeId: employee.id,
          dueDate: dueDate.format('YYYY-MM-DD'),
          createdAt: createdAt.format('YYYY-MM-DD'),
          updatedAt: now.format('YYYY-MM-DD'),
        });
      }
    });
    
    // Сохраняем задачи в localStorage (формат zadachnik)
    localStorage.setItem('zadachnik_tasks', JSON.stringify(tasks));
    
    console.log(`✅ Сгенерировано ${tasks.length} задач для ${employees.length} сотрудников`);
    console.log(`   - Выполнено: ${tasks.filter(t => t.status === 'completed').length}`);
    console.log(`   - В работе: ${tasks.filter(t => t.status === 'pending' && dayjs(t.dueDate).isAfter(dayjs())).length}`);
    console.log(`   - Просрочено: ${tasks.filter(t => t.status === 'pending' && dayjs(t.dueDate).isBefore(dayjs())).length}`);
  } catch (error) {
    console.error('Ошибка генерации задач:', error);
    throw error;
  }
};

