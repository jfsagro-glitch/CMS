// Основное приложение CURSOR Pipeline Demo

class CursorPipelineApp {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.users = [];
        this.sessionTimer = null;
        this.sessionDuration = 6 * 60 * 60 * 1000; // 6 часов в миллисекундах
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.checkExistingSession();
    }

    bindEvents() {
        // Главная страница
        document.getElementById('start-demo')?.addEventListener('click', () => this.startDemo());
        document.getElementById('register-btn')?.addEventListener('click', () => this.showRegister());

        // Дашборд
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
        document.getElementById('add-task-btn')?.addEventListener('click', () => this.showTaskModal());
        document.getElementById('reset-demo')?.addEventListener('click', () => this.resetDemo());

        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchPage(e.target.dataset.page));
        });

        // Модальные окна
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Форма задачи
        document.getElementById('task-form')?.addEventListener('submit', (e) => this.createTask(e));

        // Быстрые действия
        document.getElementById('generate-tasks')?.addEventListener('click', () => this.generateTestTasks());
        document.getElementById('simulate-workload')?.addEventListener('click', () => this.simulateWorkload());
        document.getElementById('reset-session')?.addEventListener('click', () => this.resetSession());

        // Закрытие модальных окон по клику вне
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    async checkExistingSession() {
        const sessionId = localStorage.getItem('demo_session_id');
        if (sessionId) {
            try {
                const session = await api.getDemoSession();
                if (session && !this.isSessionExpired(session)) {
                    this.currentUser = session.user;
                    this.showDashboard();
                    this.startSessionTimer(session.expiresAt);
                    await this.loadData();
                } else {
                    this.clearSession();
                }
            } catch (error) {
                console.error('Ошибка проверки сессии:', error);
                this.clearSession();
            }
        }
    }

    isSessionExpired(session) {
        return new Date(session.expiresAt) < new Date();
    }

    async startDemo() {
        this.showLoadingScreen();
        
        try {
            const session = await api.createDemoSession('supervisor');
            this.currentUser = session.user;
            this.showDashboard();
            this.startSessionTimer(session.expiresAt);
            await this.loadData();
        } catch (error) {
            console.error('Ошибка создания демо-сессии:', error);
            this.showError('Не удалось создать демо-сессию. Попробуйте еще раз.');
        }
    }

    showLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'flex';
    }

    hideLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('landing-page').classList.remove('active');
        document.getElementById('dashboard-page').classList.add('active');
        document.getElementById('demo-banner').style.display = 'block';
        this.hideLoadingScreen();
    }

    showLanding() {
        document.getElementById('dashboard-page').classList.remove('active');
        document.getElementById('landing-page').classList.add('active');
        document.getElementById('demo-banner').style.display = 'none';
    }

    startSessionTimer(expiresAt) {
        const endTime = new Date(expiresAt).getTime();
        
        this.sessionTimer = setInterval(() => {
            const now = new Date().getTime();
            const timeLeft = endTime - now;
            
            if (timeLeft <= 0) {
                this.sessionExpired();
                return;
            }
            
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            document.getElementById('session-timer').textContent = 
                `Время сессии: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    sessionExpired() {
        clearInterval(this.sessionTimer);
        alert('Демо-сессия истекла. Создайте новую сессию для продолжения.');
        this.logout();
    }

    async loadData() {
        try {
            const [tasks, users] = await Promise.all([
                api.getTasks(),
                api.getUsers()
            ]);
            
            this.tasks = tasks;
            this.users = users;
            
            this.renderTasks();
            this.renderUsers();
            this.updateAnalytics();
            this.populateAssigneeSelect();
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    }

    renderTasks() {
        const statusColumns = {
            'new': document.getElementById('new-tasks'),
            'in_progress': document.getElementById('in-progress-tasks'),
            'review': document.getElementById('review-tasks'),
            'done': document.getElementById('done-tasks')
        };

        // Очищаем все колонки
        Object.values(statusColumns).forEach(column => {
            column.innerHTML = '';
        });

        // Обновляем счетчики
        Object.keys(statusColumns).forEach(status => {
            const count = this.tasks.filter(task => task.status === status).length;
            const column = document.querySelector(`[data-status="${status}"]`);
            const counter = column.querySelector('.task-count');
            counter.textContent = count;
        });

        // Рендерим задачи
        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            statusColumns[task.status].appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-card';
        div.draggable = true;
        div.dataset.taskId = task.id;
        
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        
        let dueDateClass = '';
        if (daysLeft < 0) dueDateClass = 'overdue';
        else if (daysLeft <= 1) dueDateClass = 'due-soon';
        
        div.innerHTML = `
            <div class="task-title">${task.title}</div>
            <div class="task-description">${task.description || ''}</div>
            <div class="task-meta">
                <span class="task-priority priority-${task.priority}">${this.getPriorityText(task.priority)}</span>
                <span class="task-due-date ${dueDateClass}">${this.formatDate(dueDate)}</span>
            </div>
        `;
        
        // Добавляем обработчик перетаскивания
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
        });
        
        // Добавляем обработчик двойного клика для редактирования
        div.addEventListener('dblclick', () => {
            this.editTask(task);
        });
        
        return div;
    }

    getPriorityText(priority) {
        const priorities = {
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий',
            'critical': 'Критический'
        };
        return priorities[priority] || priority;
    }

    formatDate(date) {
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    renderUsers() {
        const usersGrid = document.getElementById('users-grid');
        usersGrid.innerHTML = '';
        
        this.users.forEach(user => {
            const userCard = this.createUserCard(user);
            usersGrid.appendChild(userCard);
        });
    }

    createUserCard(user) {
        const div = document.createElement('div');
        div.className = 'user-card';
        
        const initials = user.name.split(' ').map(n => n[0]).join('');
        const workloadPercent = Math.round(user.workload || 0);
        
        div.innerHTML = `
            <div class="user-avatar">${initials}</div>
            <div class="user-info-card">
                <h4>${user.name}</h4>
                <p>${user.position}</p>
                <p>${user.department}</p>
            </div>
            <div class="user-workload">
                <div class="workload-bar">
                    <div class="workload-fill" style="width: ${workloadPercent}%"></div>
                </div>
                <div class="workload-text">${workloadPercent}%</div>
            </div>
        `;
        
        return div;
    }

    updateAnalytics() {
        const completedTasks = this.tasks.filter(task => task.status === 'done').length;
        const overdueTasks = this.tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            return dueDate < new Date() && task.status !== 'done';
        }).length;
        
        const completionRate = this.tasks.length > 0 ? 
            Math.round((completedTasks / this.tasks.length) * 100) : 0;
        
        document.getElementById('tasks-completed').textContent = completedTasks;
        document.getElementById('tasks-overdue').textContent = overdueTasks;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        document.getElementById('avg-time').textContent = '2.3 дня'; // Заглушка
    }

    populateAssigneeSelect() {
        const select = document.getElementById('task-assignee');
        select.innerHTML = '<option value="">Выберите исполнителя</option>';
        
        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });
    }

    switchPage(pageName) {
        // Обновляем навигацию
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
        
        // Показываем нужную страницу
        document.querySelectorAll('.dashboard-page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(`${pageName}-page`).classList.add('active');
        
        // Обновляем данные при необходимости
        if (pageName === 'analytics') {
            this.updateAnalytics();
        }
    }

    showTaskModal() {
        document.getElementById('task-modal').classList.add('active');
        document.getElementById('task-due-date').value = this.getNextWeekDate();
    }

    closeModal(modal) {
        modal.classList.remove('active');
    }

    getNextWeekDate() {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
    }

    async createTask(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            assignee: document.getElementById('task-assignee').value,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value,
            status: 'new'
        };
        
        try {
            const newTask = await api.createTask(taskData);
            this.tasks.push(newTask);
            this.renderTasks();
            this.closeModal(document.getElementById('task-modal'));
            e.target.reset();
        } catch (error) {
            console.error('Ошибка создания задачи:', error);
            this.showError('Не удалось создать задачу');
        }
    }

    editTask(task) {
        // Простая реализация редактирования
        const newTitle = prompt('Новое название задачи:', task.title);
        if (newTitle && newTitle !== task.title) {
            this.updateTask(task.id, { title: newTitle });
        }
    }

    async updateTask(taskId, updates) {
        try {
            const updatedTask = await api.updateTask(taskId, updates);
            const index = this.tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                this.tasks[index] = updatedTask;
                this.renderTasks();
            }
        } catch (error) {
            console.error('Ошибка обновления задачи:', error);
        }
    }

    async generateTestTasks() {
        try {
            await api.generateTestTasks();
            await this.loadData();
            this.showSuccess('Тестовые задачи созданы');
        } catch (error) {
            console.error('Ошибка генерации задач:', error);
            this.showError('Не удалось создать тестовые задачи');
        }
    }

    async simulateWorkload() {
        try {
            await api.simulateWorkload();
            await this.loadData();
            this.showSuccess('Загрузка симулирована');
        } catch (error) {
            console.error('Ошибка симуляции:', error);
            this.showError('Не удалось симулировать загрузку');
        }
    }

    async resetSession() {
        if (confirm('Вы уверены, что хотите сбросить демо-сессию? Все данные будут потеряны.')) {
            try {
                await api.resetDemoSession();
                await this.loadData();
                this.showSuccess('Демо-сессия сброшена');
            } catch (error) {
                console.error('Ошибка сброса сессии:', error);
                this.showError('Не удалось сбросить сессию');
            }
        }
    }

    async resetDemo() {
        await this.resetSession();
    }

    logout() {
        this.clearSession();
        this.showLanding();
    }

    clearSession() {
        localStorage.removeItem('demo_session_id');
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        this.currentUser = null;
        this.tasks = [];
        this.users = [];
    }

    showRegister() {
        alert('В демо-режиме регистрация недоступна. Используйте кнопку "Демо-режим" для тестирования системы.');
    }

    showError(message) {
        alert(`Ошибка: ${message}`);
    }

    showSuccess(message) {
        // Простое уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 1000;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CursorPipelineApp();
});

// Обработка перетаскивания задач
document.addEventListener('DOMContentLoaded', () => {
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = column.dataset.status;
            
            try {
                await api.updateTaskStatus(taskId, newStatus);
                // Перезагружаем данные
                if (window.app) {
                    await window.app.loadData();
                }
            } catch (error) {
                console.error('Ошибка обновления статуса:', error);
            }
        });
    });
});

