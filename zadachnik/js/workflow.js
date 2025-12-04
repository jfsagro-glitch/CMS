/**
 * Управление workflow и бизнес-процессами для ЗАДАЧНИК
 */

class WorkflowManager {
    constructor(authManager) {
        this.auth = authManager;
        
        this.statuses = {
            created: { label: 'Создана', color: '#2196F3', next: ['assigned'] },
            assigned: { label: 'Распределена', color: '#00BCD4', next: ['in-progress'] },
            'in-progress': { label: 'В работе', color: '#FF9800', next: ['paused', 'rework', 'approval'] },
            paused: { label: 'На паузе', color: '#9E9E9E', next: ['in-progress'] },
            rework: { label: 'На доработке', color: '#F44336', next: ['in-progress'] },
            approval: { label: 'На утверждении', color: '#9C27B0', next: ['approved', 'in-progress'] },
            approved: { label: 'Согласовано', color: '#4CAF50', next: [] }
        };
        
        this.taskTypes = [
            'Оценка',
            'Экспертиза',
            'Рецензия',
            'ПРКК',
            'Прочее',
            'Отчетность',
            'Подготовка СЗ'
        ];
    }
    
    // Создание новой задачи
    createTask(taskData) {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('createTask')) {
            throw new Error('Нет прав на создание задачи');
        }
        
        const task = {
            id: this.generateTaskId(),
            region: taskData.region || user.region,
            type: taskData.type || 'Прочее',
            title: taskData.title,
            description: taskData.description || '',
            priority: taskData.priority || 'medium',
            dueDate: taskData.dueDate,
            documents: [],
            comments: [],
            status: 'created',
            businessUser: user.email,
            businessUserName: user.name,
            assignedTo: [],
            currentAssignee: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            history: [
                {
                    date: new Date().toISOString(),
                    user: user.name,
                    userRole: user.role,
                    action: 'Создана',
                    comment: 'Задача создана',
                    status: 'created'
                }
            ]
        };
        
        return task;
    }
    
    // Распределение задачи (Руководитель)
    assignTask(task, employees, comment = '') {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('assignTasks')) {
            throw new Error('Нет прав на распределение задач');
        }
        
        if (task.region !== user.region && user.role !== 'superuser') {
            throw new Error('Можно распределять только задачи своего региона');
        }
        
        task.assignedTo = employees;
        task.currentAssignee = employees[0];
        task.status = 'assigned';
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Распределена',
            comment: comment || `Назначена на: ${employees.join(', ')}`,
            status: 'assigned',
            assignedTo: employees
        });
        
        return task;
    }
    
    // Принятие задачи в работу (Сотрудник)
    acceptTask(task, comment = '') {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('acceptTask')) {
            throw new Error('Нет прав на принятие задачи');
        }
        
        if (!task.assignedTo.includes(user.email)) {
            throw new Error('Задача не назначена на вас');
        }
        
        task.status = 'in-progress';
        task.currentAssignee = user.email;
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Принята в работу',
            comment: comment || 'Задача принята в работу',
            status: 'in-progress'
        });
        
        return task;
    }
    
    // Постановка на паузу (Сотрудник)
    pauseTask(task, comment) {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('pauseTask')) {
            throw new Error('Нет прав на постановку задачи на паузу');
        }
        
        if (!task.assignedTo.includes(user.email)) {
            throw new Error('Задача не назначена на вас');
        }
        
        if (!comment) {
            throw new Error('Требуется комментарий для постановки на паузу');
        }
        
        task.status = 'paused';
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Поставлена на паузу',
            comment: comment,
            status: 'paused'
        });
        
        return task;
    }
    
    // Возобновление работы (Сотрудник)
    resumeTask(task, comment = '') {
        const user = this.auth.getCurrentUser();
        
        if (!task.assignedTo.includes(user.email)) {
            throw new Error('Задача не назначена на вас');
        }
        
        task.status = 'in-progress';
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Работа возобновлена',
            comment: comment || 'Работа над задачей возобновлена',
            status: 'in-progress'
        });
        
        return task;
    }
    
    // Отправка на доработку Бизнесу (Сотрудник)
    sendToRework(task, comment) {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('sendToRework')) {
            throw new Error('Нет прав на отправку задачи на доработку');
        }
        
        if (!task.assignedTo.includes(user.email)) {
            throw new Error('Задача не назначена на вас');
        }
        
        if (!comment) {
            throw new Error('Требуется комментарий для отправки на доработку');
        }
        
        task.status = 'rework';
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Отправлена на доработку',
            comment: comment,
            status: 'rework'
        });
        
        return task;
    }
    
    // Возврат в работу после доработки (Бизнес)
    returnToWork(task, comment = '') {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('returnToWork')) {
            throw new Error('Нет прав на возврат задачи в работу');
        }
        
        if (task.businessUser !== user.email) {
            throw new Error('Можно возвращать только свои задачи');
        }
        
        task.status = 'in-progress';
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Возвращена в работу',
            comment: comment || 'Доработка выполнена, задача возвращена в работу',
            status: 'in-progress'
        });
        
        return task;
    }
    
    // Отправка на утверждение (Сотрудник)
    sendToApproval(task, comment = '') {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('sendToApproval')) {
            throw new Error('Нет прав на отправку задачи на утверждение');
        }
        
        if (!task.assignedTo.includes(user.email)) {
            throw new Error('Задача не назначена на вас');
        }
        
        task.status = 'approval';
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Отправлена на утверждение',
            comment: comment || 'Задача выполнена и отправлена на утверждение',
            status: 'approval'
        });
        
        return task;
    }
    
    // Согласование задачи (Руководитель)
    approveTask(task, comment = '') {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('approveTask')) {
            throw new Error('Нет прав на согласование задач');
        }
        
        if (task.region !== user.region && user.role !== 'superuser') {
            throw new Error('Можно согласовывать только задачи своего региона');
        }
        
        task.status = 'approved';
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Согласовано',
            comment: comment || 'Задача согласована',
            status: 'approved'
        });
        
        return task;
    }
    
    // Возврат задачи сотруднику (Руководитель)
    returnToEmployee(task, comment) {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('returnTask')) {
            throw new Error('Нет прав на возврат задач');
        }
        
        if (!comment) {
            throw new Error('Требуется комментарий для возврата задачи');
        }
        
        task.status = 'in-progress';
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Возвращена сотруднику',
            comment: comment,
            status: 'in-progress'
        });
        
        return task;
    }
    
    // Прикрепление документа
    attachDocument(task, document) {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('addDocuments') && !this.auth.hasPermission('attachFiles')) {
            throw new Error('Нет прав на прикрепление документов');
        }
        
        const doc = {
            id: `doc_${Date.now()}`,
            name: document.name,
            size: document.size,
            type: document.type,
            uploadedBy: user.email,
            uploadedByName: user.name,
            uploadedAt: new Date().toISOString(),
            url: document.url || '#'
        };
        
        task.documents.push(doc);
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Прикреплен документ',
            comment: `Документ: ${document.name}`,
            status: task.status
        });
        
        return task;
    }
    
    // Добавление комментария
    addComment(task, commentText) {
        const user = this.auth.getCurrentUser();
        
        const comment = {
            id: `comment_${Date.now()}`,
            text: commentText,
            author: user.name,
            authorEmail: user.email,
            authorRole: user.role,
            createdAt: new Date().toISOString()
        };
        
        task.comments.push(comment);
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Добавлен комментарий',
            comment: commentText,
            status: task.status
        });
        
        return task;
    }
    
    // Изменение приоритета
    changePriority(task, newPriority, comment = '') {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('changePriority')) {
            throw new Error('Нет прав на изменение приоритета');
        }
        
        const oldPriority = task.priority;
        task.priority = newPriority;
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Изменен приоритет',
            comment: comment || `Приоритет изменен с "${oldPriority}" на "${newPriority}"`,
            status: task.status
        });
        
        return task;
    }
    
    // Изменение срока
    changeDeadline(task, newDeadline, comment = '') {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('changeDeadline')) {
            throw new Error('Нет прав на изменение срока');
        }
        
        const oldDeadline = task.dueDate;
        task.dueDate = newDeadline;
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Изменен срок',
            comment: comment || `Срок изменен с ${oldDeadline} на ${newDeadline}`,
            status: task.status
        });
        
        return task;
    }
    
    // Разделение задачи на нескольких сотрудников (Руководитель)
    splitTask(task, employees, comment = '') {
        const user = this.auth.getCurrentUser();
        
        if (!this.auth.hasPermission('splitTask')) {
            throw new Error('Нет прав на разделение задач');
        }
        
        task.assignedTo = employees;
        task.updatedAt = new Date().toISOString();
        
        task.history.push({
            date: new Date().toISOString(),
            user: user.name,
            userRole: user.role,
            action: 'Задача разделена',
            comment: comment || `Задача разделена между: ${employees.join(', ')}`,
            status: task.status,
            assignedTo: employees
        });
        
        return task;
    }
    
    // Генерация ID задачи
    generateTaskId() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `T-${timestamp}${random}`;
    }
    
    // Получение доступных статусов для перехода
    getNextStatuses(currentStatus) {
        return this.statuses[currentStatus]?.next || [];
    }
    
    // Получение информации о статусе
    getStatusInfo(status) {
        return this.statuses[status] || { label: status, color: '#999' };
    }
    
    // Получение списка типов задач
    getTaskTypes() {
        return this.taskTypes;
    }
    
    // Валидация перехода статуса
    canTransitionTo(currentStatus, nextStatus) {
        const allowedStatuses = this.getNextStatuses(currentStatus);
        return allowedStatuses.includes(nextStatus);
    }
}

// Экспорт
window.WorkflowManager = WorkflowManager;
