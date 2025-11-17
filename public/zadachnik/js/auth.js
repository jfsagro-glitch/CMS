/**
 * Система аутентификации и управления ролями для ЗАДАЧНИК
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.roles = {
            business: 'Бизнес',
            manager: 'Руководитель',
            employee: 'Сотрудник',
            superuser: 'Суперпользователь'
        };
        
        this.permissions = {
            business: {
                createTask: true,
                viewOwnTasks: true,
                editOwnTasks: true,
                addDocuments: true,
                returnToWork: true,
                changePriority: true,
                changeDeadline: true,
                viewAllTasks: false,
                assignTasks: false,
                approveTask: false,
                viewAnalytics: false
            },
            manager: {
                createTask: true,
                viewOwnTasks: true,
                viewRegionTasks: true,
                editOwnTasks: true,
                assignTasks: true,
                approveTask: true,
                returnTask: true,
                manageEmployees: true,
                viewAnalytics: true,
                splitTask: true,
                changePriority: true,
                changeDeadline: true,
                addComments: true,
                viewAllTasks: false
            },
            employee: {
                createTask: false,
                viewAssignedTasks: true,
                acceptTask: true,
                pauseTask: true,
                sendToRework: true,
                attachFiles: true,
                sendToApproval: true,
                viewOwnTasks: true,
                addComments: true,
                viewAllTasks: false
            },
            superuser: {
                createTask: true,
                viewAllTasks: true,
                viewAllAnalytics: true,
                manageUsers: true,
                manageRegions: true,
                exportData: true,
                viewKPI: true,
                assignTasks: true,
                approveTask: true
            }
        };
        
        this.regions = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург'];
        
        this.init();
    }
    
    init() {
        const savedUser = localStorage.getItem('zadachnik_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        } else {
            // Демо-режим: роль Бизнес по умолчанию
            this.setDemoUser('business', 'Москва', 'demo.business@company.com');
        }
    }
    
    setDemoUser(role, region = null, email = null) {
        this.currentUser = {
            id: `user_${role}_${Date.now()}`,
            email: email || `demo.${role}@company.com`,
            name: this.getDemoName(role),
            role: role,
            region: region,
            permissions: this.permissions[role]
        };
        this.saveCurrentUser();
    }
    
    getDemoName(role) {
        const names = {
            business: 'Иван Бизнесов',
            manager: 'Анна Руководитель',
            employee: 'Петр Сотрудников',
            superuser: 'Администратор Системы'
        };
        return names[role] || 'Пользователь';
    }
    
    switchRole(role, region = null) {
        if (!this.roles[role]) {
            console.error('Неизвестная роль:', role);
            return false;
        }
        
        this.setDemoUser(role, region);
        return true;
    }
    
    saveCurrentUser() {
        localStorage.setItem('zadachnik_current_user', JSON.stringify(this.currentUser));
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    getCurrentRole() {
        return this.currentUser ? this.currentUser.role : null;
    }
    
    getCurrentRegion() {
        return this.currentUser ? this.currentUser.region : null;
    }
    
    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.permissions) {
            return false;
        }
        return this.currentUser.permissions[permission] === true;
    }
    
    canViewTask(task) {
        if (!this.currentUser) return false;
        
        const role = this.currentUser.role;
        const userEmail = this.currentUser.email;
        const userRegion = this.currentUser.region;
        
        // Суперпользователь видит все
        if (role === 'superuser') return true;
        
        // Бизнес видит только свои заявки
        if (role === 'business') {
            return task.businessUser === userEmail;
        }
        
        // Руководитель видит заявки своего региона
        if (role === 'manager') {
            return task.region === userRegion;
        }
        
        // Сотрудник видит назначенные ему задачи
        if (role === 'employee') {
            // Проверяем по email сотрудника (если выбран конкретный)
            const employeeEmail = this.currentUser.employeeEmail || userEmail;
            return task.assignedTo && task.assignedTo.includes(employeeEmail);
        }
        
        return false;
    }
    
    canEditTask(task) {
        if (!this.currentUser) return false;
        
        const role = this.currentUser.role;
        const userEmail = this.currentUser.email;
        
        // Бизнес может редактировать свои заявки
        if (role === 'business' && task.businessUser === userEmail) {
            return this.hasPermission('editOwnTasks');
        }
        
        // Руководитель может редактировать заявки своего региона
        if (role === 'manager' && task.region === this.currentUser.region) {
            return this.hasPermission('editOwnTasks');
        }
        
        // Суперпользователь может редактировать все
        if (role === 'superuser') {
            return true;
        }
        
        return false;
    }
    
    getAvailableActions(task) {
        const actions = [];
        const role = this.currentUser.role;
        const status = task.status;
        
        if (role === 'business') {
            if (task.businessUser === this.currentUser.email) {
                actions.push({ id: 'edit', label: '✏️ Редактировать', icon: '✏️' });
                actions.push({ id: 'addDocument', label: '📎 Прикрепить документ', icon: '📎' });
                
                if (status === 'rework') {
                    actions.push({ id: 'returnToWork', label: '🔄 Вернуть в работу', icon: '🔄' });
                }
            }
        }
        
        if (role === 'manager') {
            if (status === 'created') {
                actions.push({ id: 'assign', label: '👥 Распределить', icon: '👥' });
            }
            if (status === 'approval') {
                actions.push({ id: 'approve', label: '✅ Согласовать', icon: '✅' });
                actions.push({ id: 'return', label: '↩️ Вернуть', icon: '↩️' });
            }
            actions.push({ id: 'edit', label: '✏️ Редактировать', icon: '✏️' });
            actions.push({ id: 'split', label: '✂️ Разделить', icon: '✂️' });
        }
        
        if (role === 'employee') {
            if (task.assignedTo && task.assignedTo.includes(this.currentUser.email)) {
                if (status === 'assigned') {
                    actions.push({ id: 'accept', label: '✅ Принять в работу', icon: '✅' });
                }
                if (status === 'in-progress') {
                    actions.push({ id: 'pause', label: '⏸️ На паузу', icon: '⏸️' });
                    actions.push({ id: 'rework', label: '↩️ На доработку', icon: '↩️' });
                    actions.push({ id: 'approval', label: '📤 На утверждение', icon: '📤' });
                }
                if (status === 'paused') {
                    actions.push({ id: 'resume', label: '▶️ Продолжить', icon: '▶️' });
                }
                actions.push({ id: 'attachFile', label: '📎 Прикрепить файл', icon: '📎' });
            }
        }
        
        if (role === 'superuser') {
            actions.push({ id: 'edit', label: '✏️ Редактировать', icon: '✏️' });
            actions.push({ id: 'delete', label: '🗑️ Удалить', icon: '🗑️' });
        }
        
        return actions;
    }
    
    getAllRegions() {
        return this.regions;
    }
    
    getRoleName(role) {
        return this.roles[role] || role;
    }
}

// Экспорт
window.AuthManager = AuthManager;