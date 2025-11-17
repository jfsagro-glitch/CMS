/**
 * Управление хранилищем данных для ЗАДАЧНИК
 */

class StorageManager {
    constructor() {
        this.KEYS = {
            TASKS: 'zadachnik_tasks',
            USERS: 'zadachnik_users',
            CURRENT_USER: 'zadachnik_current_user',
            SETTINGS: 'zadachnik_settings'
        };
    }
    
    // Задачи
    getTasks() {
        const data = localStorage.getItem(this.KEYS.TASKS);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Ошибка загрузки задач:', e);
                return [];
            }
        }
        return [];
    }
    
    saveTasks(tasks) {
        try {
            localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
            return true;
        } catch (e) {
            console.error('Ошибка сохранения задач:', e);
            return false;
        }
    }
    
    addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        return this.saveTasks(tasks);
    }
    
    updateTask(taskId, updatedTask) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = updatedTask;
            return this.saveTasks(tasks);
        }
        return false;
    }
    
    deleteTask(taskId) {
        const tasks = this.getTasks();
        const filtered = tasks.filter(t => t.id !== taskId);
        return this.saveTasks(filtered);
    }
    
    getTaskById(taskId) {
        const tasks = this.getTasks();
        return tasks.find(t => t.id === taskId);
    }
    
    // Пользователи
    getUsers() {
        const data = localStorage.getItem(this.KEYS.USERS);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Ошибка загрузки пользователей:', e);
                return null;
            }
        }
        return null;
    }
    
    saveUsers(users) {
        try {
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
            return true;
        } catch (e) {
            console.error('Ошибка сохранения пользователей:', e);
            return false;
        }
    }
    
    // Текущий пользователь
    getCurrentUser() {
        const data = localStorage.getItem(this.KEYS.CURRENT_USER);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Ошибка загрузки текущего пользователя:', e);
                return null;
            }
        }
        return null;
    }
    
    saveCurrentUser(user) {
        try {
            localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
            return true;
        } catch (e) {
            console.error('Ошибка сохранения текущего пользователя:', e);
            return false;
        }
    }
    
    // Настройки
    getSettings() {
        const data = localStorage.getItem(this.KEYS.SETTINGS);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Ошибка загрузки настроек:', e);
                return {};
            }
        }
        return {};
    }
    
    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Ошибка сохранения настроек:', e);
            return false;
        }
    }
    
    // Инициализация демо-данных
    initDemoData() {
        // Загружаем задачи из DemoData
        if (this.getTasks().length === 0 && window.DemoData) {
            this.saveTasks(DemoData.tasks);
        }
        
        // Загружаем пользователей
        if (!this.getUsers() && window.DemoData) {
            this.saveUsers(DemoData.users);
        }
    }
    
    // Очистка данных
    clearAll() {
        localStorage.removeItem(this.KEYS.TASKS);
        localStorage.removeItem(this.KEYS.USERS);
        localStorage.removeItem(this.KEYS.SETTINGS);
        // Не удаляем текущего пользователя
    }
    
    // Экспорт данных
    exportData() {
        return {
            tasks: this.getTasks(),
            users: this.getUsers(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString()
        };
    }
    
    // Импорт данных
    importData(data) {
        try {
            if (data.tasks) {
                this.saveTasks(data.tasks);
            }
            if (data.users) {
                this.saveUsers(data.users);
            }
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            return true;
        } catch (e) {
            console.error('Ошибка импорта данных:', e);
            return false;
        }
    }
    
    // Резервное копирование
    backup() {
        const data = this.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zadachnik_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Восстановление из резервной копии
    restore(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (this.importData(data)) {
                        resolve(true);
                    } else {
                        reject(new Error('Ошибка импорта данных'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsText(file);
        });
    }
}

// Экспорт
window.StorageManager = StorageManager;