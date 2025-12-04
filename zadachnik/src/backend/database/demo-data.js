const { v4: uuidv4 } = require('uuid');

// Генерация демо-данных для новой сессии
function generateDemoData(sessionId, options = {}) {
    const { taskCount = 15, highWorkload = false } = options;
    
    // Демо-пользователи
    const users = [
        {
            id: uuidv4(),
            name: 'Иван Петров',
            email: 'i.petrov@demo-cursor.ru',
            role: 'executor',
            department: 'IT отдел',
            position: 'Frontend разработчик',
            workload: highWorkload ? 95 : Math.floor(Math.random() * 40) + 30,
            available: true,
            createdAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            name: 'Елена Коваль',
            email: 'e.koval@demo-cursor.ru',
            role: 'executor',
            department: 'IT отдел',
            position: 'Backend разработчик',
            workload: highWorkload ? 90 : Math.floor(Math.random() * 40) + 40,
            available: true,
            createdAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            name: 'Анна Сидорова',
            email: 'a.sidorova@demo-cursor.ru',
            role: 'executor',
            department: 'HR отдел',
            position: 'HR менеджер',
            workload: highWorkload ? 85 : Math.floor(Math.random() * 30) + 20,
            available: true,
            createdAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            name: 'Дмитрий Козлов',
            email: 'd.kozlov@demo-cursor.ru',
            role: 'supervisor',
            department: 'IT отдел',
            position: 'Руководитель IT отдела',
            workload: highWorkload ? 80 : Math.floor(Math.random() * 20) + 10,
            available: true,
            createdAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            name: 'Ольга Новикова',
            email: 'o.novikova@demo-cursor.ru',
            role: 'business_user',
            department: 'Маркетинг',
            position: 'Менеджер по маркетингу',
            workload: highWorkload ? 75 : Math.floor(Math.random() * 30) + 25,
            available: true,
            createdAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            name: 'Сергей Волков',
            email: 's.volkov@demo-cursor.ru',
            role: 'executor',
            department: 'HR отдел',
            position: 'Рекрутер',
            workload: highWorkload ? 88 : Math.floor(Math.random() * 35) + 35,
            available: true,
            createdAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            name: 'Мария Федорова',
            email: 'm.fedorova@demo-cursor.ru',
            role: 'executor',
            department: 'Маркетинг',
            position: 'SMM специалист',
            workload: highWorkload ? 92 : Math.floor(Math.random() * 40) + 30,
            available: true,
            createdAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            name: 'Алексей Морозов',
            email: 'a.morozov@demo-cursor.ru',
            role: 'manager',
            department: 'IT отдел',
            position: 'Технический директор',
            workload: highWorkload ? 70 : Math.floor(Math.random() * 15) + 5,
            available: true,
            createdAt: new Date().toISOString()
        }
    ];

    // Демо-задачи
    const taskTemplates = [
        {
            title: 'Разработка нового модуля аутентификации',
            description: 'Создание системы двухфакторной аутентификации для повышения безопасности',
            priority: 'high',
            department: 'IT отдел'
        },
        {
            title: 'Подбор Senior Frontend разработчика',
            description: 'Поиск и отбор кандидатов на позицию Senior Frontend с опытом React 3+ лет',
            priority: 'high',
            department: 'HR отдел'
        },
        {
            title: 'Проведение собеседования с кандидатом',
            description: 'Техническое интервью с кандидатом на позицию Backend разработчика',
            priority: 'medium',
            department: 'HR отдел'
        },
        {
            title: 'Подготовка отчета по анализу рынка',
            description: 'Исследование конкурентов и анализ трендов в IT-сфере',
            priority: 'medium',
            department: 'Маркетинг'
        },
        {
            title: 'Исправление ошибки в модуле отчетности',
            description: 'Критическая ошибка в расчете KPI сотрудников требует немедленного исправления',
            priority: 'critical',
            department: 'IT отдел'
        },
        {
            title: 'Разработка плана обучения для новых сотрудников',
            description: 'Создание программы адаптации и обучения для новых сотрудников',
            priority: 'medium',
            department: 'HR отдел'
        },
        {
            title: 'Создание контент-плана на месяц',
            description: 'Планирование публикаций в социальных сетях на следующий месяц',
            priority: 'low',
            department: 'Маркетинг'
        },
        {
            title: 'Оптимизация производительности API',
            description: 'Анализ и улучшение скорости работы REST API',
            priority: 'high',
            department: 'IT отдел'
        },
        {
            title: 'Проведение ретроспективы спринта',
            description: 'Анализ результатов спринта и планирование следующего',
            priority: 'medium',
            department: 'IT отдел'
        },
        {
            title: 'Обновление дизайн-системы',
            description: 'Приведение всех компонентов к единому стилю',
            priority: 'low',
            department: 'IT отдел'
        },
        {
            title: 'Анализ эффективности рекламных кампаний',
            description: 'Подготовка отчета по ROI рекламных кампаний за квартал',
            priority: 'medium',
            department: 'Маркетинг'
        },
        {
            title: 'Оформление документов для нового сотрудника',
            description: 'Подготовка трудового договора и документов для трудоустройства',
            priority: 'high',
            department: 'HR отдел'
        },
        {
            title: 'Настройка CI/CD пайплайна',
            description: 'Автоматизация процесса развертывания приложения',
            priority: 'high',
            department: 'IT отдел'
        },
        {
            title: 'Проведение воркшопа по Agile',
            description: 'Обучение команды методологии Agile разработки',
            priority: 'medium',
            department: 'HR отдел'
        },
        {
            title: 'Создание презентации для клиента',
            description: 'Подготовка презентации продукта для потенциального клиента',
            priority: 'high',
            department: 'Маркетинг'
        }
    ];

    const statuses = ['new', 'in_progress', 'review', 'done'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    
    const tasks = [];
    const executorUsers = users.filter(u => u.role === 'executor');
    
    for (let i = 0; i < taskCount; i++) {
        const template = taskTemplates[i % taskTemplates.length];
        const assignee = executorUsers[Math.floor(Math.random() * executorUsers.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = template.priority || priorities[Math.floor(Math.random() * priorities.length)];
        
        // Генерируем дату выполнения
        const dueDate = new Date();
        const daysOffset = Math.floor(Math.random() * 30) - 5; // от -5 до +25 дней
        dueDate.setDate(dueDate.getDate() + daysOffset);
        
        const task = {
            id: uuidv4(),
            title: template.title,
            description: template.description,
            assignee: assignee.id,
            priority: priority,
            dueDate: dueDate.toISOString().split('T')[0],
            status: status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tasks.push(task);
    }

    return {
        users,
        tasks
    };
}

// Генерация аналитических данных
function generateAnalytics(tasks, users) {
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const overdueTasks = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate < new Date() && task.status !== 'done';
    }).length;
    
    const completionRate = tasks.length > 0 ? 
        Math.round((completedTasks / tasks.length) * 100) : 0;
    
    const averageWorkload = users.length > 0 ? 
        Math.round(users.reduce((sum, user) => sum + (user.workload || 0), 0) / users.length) : 0;
    
    const overloadedUsers = users.filter(user => (user.workload || 0) > 90).length;
    
    return {
        tasksCompleted: completedTasks,
        tasksOverdue: overdueTasks,
        completionRate,
        averageWorkload,
        overloadedUsers,
        totalTasks: tasks.length,
        totalUsers: users.length
    };
}

// Генерация данных для графиков
function generateChartData(tasks, users) {
    // Статусы задач
    const statusData = {
        'new': tasks.filter(t => t.status === 'new').length,
        'in_progress': tasks.filter(t => t.status === 'in_progress').length,
        'review': tasks.filter(t => t.status === 'review').length,
        'done': tasks.filter(t => t.status === 'done').length
    };
    
    // Загрузка пользователей
    const workloadData = users.map(user => ({
        name: user.name,
        workload: user.workload || 0,
        department: user.department
    }));
    
    // Приоритеты задач
    const priorityData = {
        'low': tasks.filter(t => t.priority === 'low').length,
        'medium': tasks.filter(t => t.priority === 'medium').length,
        'high': tasks.filter(t => t.priority === 'high').length,
        'critical': tasks.filter(t => t.priority === 'critical').length
    };
    
    return {
        statusData,
        workloadData,
        priorityData
    };
}

module.exports = {
    generateDemoData,
    generateAnalytics,
    generateChartData
};

