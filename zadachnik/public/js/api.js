// API клиент для CURSOR Pipeline Demo

class APIClient {
    constructor() {
        this.baseURL = '/api';
        this.sessionId = localStorage.getItem('demo_session_id');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.sessionId) {
            config.headers['X-Session-ID'] = this.sessionId;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Демо-сессии
    async createDemoSession(role = 'supervisor') {
        const response = await this.request('/demo/sessions', {
            method: 'POST',
            body: JSON.stringify({ role })
        });
        
        if (response.sessionId) {
            this.sessionId = response.sessionId;
            localStorage.setItem('demo_session_id', this.sessionId);
        }
        
        return response;
    }

    async getDemoSession() {
        if (!this.sessionId) return null;
        return await this.request(`/demo/sessions/${this.sessionId}`);
    }

    async resetDemoSession() {
        if (!this.sessionId) return null;
        return await this.request(`/demo/sessions/${this.sessionId}/reset`, {
            method: 'POST'
        });
    }

    async extendDemoSession() {
        if (!this.sessionId) return null;
        return await this.request(`/demo/sessions/${this.sessionId}/extend`, {
            method: 'POST'
        });
    }

    // Задачи
    async getTasks() {
        return await this.request('/tasks');
    }

    async createTask(taskData) {
        return await this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    async updateTaskStatus(taskId, status) {
        return await this.request(`/tasks/${taskId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    async updateTask(taskId, taskData) {
        return await this.request(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    }

    async deleteTask(taskId) {
        return await this.request(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
    }

    // Пользователи
    async getUsers() {
        return await this.request('/users');
    }

    async getUser(userId) {
        return await this.request(`/users/${userId}`);
    }

    async updateUserAvailability(userId, available) {
        return await this.request(`/users/${userId}/availability`, {
            method: 'POST',
            body: JSON.stringify({ available })
        });
    }

    // Аналитика
    async getAnalytics() {
        return await this.request('/analytics');
    }

    async getMetrics() {
        return await this.request('/analytics/metrics');
    }

    // Быстрые действия
    async generateTestTasks() {
        return await this.request('/demo/quick-tasks', {
            method: 'POST'
        });
    }

    async simulateWorkload() {
        return await this.request('/demo/simulate-workload', {
            method: 'POST'
        });
    }

    async loadScenario(scenarioName) {
        return await this.request('/demo/load-scenario', {
            method: 'POST',
            body: JSON.stringify({ scenario: scenarioName })
        });
    }
}

// Глобальный экземпляр API клиента
window.api = new APIClient();

