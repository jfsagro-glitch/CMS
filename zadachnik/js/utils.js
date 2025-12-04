/**
 * Утилиты для ЗАДАЧНИК
 */

class Utils {
    // Форматирование дат
    static formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `Просрочено на ${Math.abs(diffDays)} дн.`;
        } else if (diffDays === 0) {
            return 'Сегодня';
        } else if (diffDays === 1) {
            return 'Завтра';
        } else if (diffDays <= 7) {
            return `Через ${diffDays} дн.`;
        } else {
            return date.toLocaleDateString('ru-RU');
        }
    }
    
    static formatDateShort(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ru-RU');
    }
    
    static getDeadlineClass(deadline) {
        if (!deadline) return '';
        
        const date = new Date(deadline);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'deadline-danger';
        if (diffDays <= 1) return 'deadline-warning';
        return 'deadline-ok';
    }
    
    // Форматирование приоритетов
    static getPriorityText(priority) {
        const priorities = {
            low: 'Низкий',
            medium: 'Средний',
            high: 'Высокий',
            critical: 'Критический'
        };
        return priorities[priority] || priority;
    }
    
    static getPriorityClass(priority) {
        return `priority-${priority}`;
    }
    
    // Форматирование ролей
    static getRoleText(role) {
        const roles = {
            executor: 'Исполнитель',
            supervisor: 'Супервайзер',
            manager: 'Руководитель',
            business: 'Бизнес-пользователь'
        };
        return roles[role] || role;
    }
    
    static getRoleIcon(role) {
        const icons = {
            executor: '👷',
            supervisor: '👩‍💼',
            manager: '👨‍💼',
            business: '💼'
        };
        return icons[role] || '👤';
    }
    
    // Работа с темами
    static setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('zadachnik_theme', theme);
    }
    
    static getTheme() {
        return localStorage.getItem('zadachnik_theme') || 'light';
    }
    
    static setCompactMode(isCompact) {
        if (isCompact) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
        localStorage.setItem('zadachnik_compact_mode', isCompact);
    }
    
    static getCompactMode() {
        return localStorage.getItem('zadachnik_compact_mode') === 'true';
    }
    
    static setViewMode(mode) {
        localStorage.setItem('zadachnik_view_mode', mode);
        this.updateViewMode(mode);
    }
    
    static getViewMode() {
        return localStorage.getItem('zadachnik_view_mode') || 'kanban';
    }
    
    static updateViewMode(mode) {
        // Скрыть все виды
        document.getElementById('kanban-view').style.display = 'none';
        document.getElementById('table-view').style.display = 'none';
        document.getElementById('list-view').style.display = 'none';
        document.getElementById('info-view').style.display = 'none';
        
        // Показать выбранный вид
        switch(mode) {
            case 'kanban':
                document.getElementById('kanban-view').style.display = 'block';
                break;
            case 'table':
                document.getElementById('table-view').style.display = 'block';
                break;
            case 'list':
                document.getElementById('list-view').style.display = 'block';
                break;
            case 'info':
                document.getElementById('info-view').style.display = 'block';
                break;
        }
    }
    
    static initTheme() {
        const savedTheme = this.getTheme();
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const theme = savedTheme === 'auto' ? systemTheme : savedTheme;
        this.setTheme(theme);
    }
    
    static initCompactMode() {
        const isCompact = this.getCompactMode();
        this.setCompactMode(isCompact);
    }
    
    static initViewMode() {
        const viewMode = this.getViewMode();
        this.updateViewMode(viewMode);
    }
    
    // Уведомления
    static showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notifications');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <button class="notification-close">&times;</button>
            <div>${message}</div>
        `;
        
        container.appendChild(notification);
        
        // Автоматическое удаление
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
        
        // Удаление по клику
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
    
    // Валидация
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static validateRequired(value) {
        return value && value.toString().trim().length > 0;
    }
    
    // Работа с DOM
    static $(selector) {
        return document.querySelector(selector);
    }
    
    static $$(selector) {
        return document.querySelectorAll(selector);
    }
    
    static createElement(tag, className = '', content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.innerHTML = content;
        return element;
    }
    
    // Анимации
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = performance.now();
        
        function animate(time) {
            let progress = (time - start) / duration;
            if (progress > 1) progress = 1;
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    static fadeOut(element, duration = 300) {
        let start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity);
        
        function animate(time) {
            let progress = (time - start) / duration;
            if (progress > 1) progress = 1;
            
            element.style.opacity = startOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Drag and Drop
    static makeDraggable(element, onDragStart, onDragEnd, onDrop) {
        element.draggable = true;
        
        element.addEventListener('dragstart', (e) => {
            element.classList.add('dragging');
            if (onDragStart) onDragStart(e);
        });
        
        element.addEventListener('dragend', (e) => {
            element.classList.remove('dragging');
            if (onDragEnd) onDragEnd(e);
        });
        
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            if (onDrop) onDrop(e);
        });
    }
    
    static makeDropZone(element, onDragOver, onDrop) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('drag-over');
            if (onDragOver) onDragOver(e);
        });
        
        element.addEventListener('dragleave', () => {
            element.classList.remove('drag-over');
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            if (onDrop) onDrop(e);
        });
    }
    
    // Работа с файлами
    static downloadFile(content, filename, type = 'application/json') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    // Статистика и аналитика
    static calculateTaskStats(tasks) {
        const stats = {
            total: tasks.length,
            new: 0,
            inProgress: 0,
            review: 0,
            done: 0,
            overdue: 0,
            completionRate: 0
        };
        
        const now = new Date();
        
        tasks.forEach(task => {
            switch (task.status) {
                case 'new':
                    stats.new++;
                    break;
                case 'in-progress':
                    stats.inProgress++;
                    break;
                case 'review':
                    stats.review++;
                    break;
                case 'done':
                    stats.done++;
                    break;
            }
            
            // Проверка просроченных задач
            if (task.deadline && task.status !== 'done') {
                const deadline = new Date(task.deadline);
                if (deadline < now) {
                    stats.overdue++;
                }
            }
        });
        
        stats.completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
        
        return stats;
    }
    
    static calculateUserStats(users, tasks) {
        return users.map(user => {
            const userTasks = tasks.filter(task => task.assignee === user.name);
            const completedTasks = userTasks.filter(task => task.status === 'done');
            const activeTasks = userTasks.filter(task => task.status === 'in-progress');
            
            return {
                ...user,
                totalTasks: userTasks.length,
                completedTasks: completedTasks.length,
                activeTasks: activeTasks.length,
                completionRate: userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0
            };
        });
    }
    
    // Поиск и фильтрация
    static searchTasks(tasks, query) {
        if (!query) return tasks;
        
        const searchTerm = query.toLowerCase();
        return tasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            task.assignee.toLowerCase().includes(searchTerm) ||
            (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    
    static filterTasks(tasks, filters) {
        return tasks.filter(task => {
            if (filters.status && task.status !== filters.status) return false;
            if (filters.priority && task.priority !== filters.priority) return false;
            if (filters.assignee && task.assignee !== filters.assignee) return false;
            if (filters.department) {
                const user = storage.getUsers().find(u => u.name === task.assignee);
                if (!user || user.department !== filters.department) return false;
            }
            return true;
        });
    }
    
    // Таймер сессии
    static startSessionTimer() {
        const sessionStart = storage.getSession().startTime;
        const sessionDuration = 6 * 60 * 60 * 1000; // 6 часов
        
        const updateTimer = () => {
            const elapsed = Date.now() - sessionStart;
            const remaining = sessionDuration - elapsed;
            
            if (remaining <= 0) {
                Utils.showNotification('Сессия истекла. Данные будут сохранены.', 'warning', 10000);
                return;
            }
            
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            
            const timerElement = document.getElementById('session-time');
            if (timerElement) {
                timerElement.textContent = `Сессия: ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Предупреждение за 30 минут до окончания
            if (remaining <= 30 * 60 * 1000 && remaining > 29 * 60 * 1000) {
                Utils.showNotification('Сессия истекает через 30 минут. Экспортируйте данные!', 'warning', 10000);
            }
        };
        
        updateTimer();
        setInterval(updateTimer, 1000);
    }
    
    // Инициализация
    static init() {
        this.initTheme();
        this.initCompactMode();
        this.initViewMode();
        this.startSessionTimer();
        
        // Обработка изменения темы системы
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const savedTheme = this.getTheme();
            if (savedTheme === 'auto') {
                this.initTheme();
            }
        });
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    Utils.init();
});
