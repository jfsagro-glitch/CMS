const express = require('express');
const db = require('../database/db');

const router = express.Router();

// Middleware для проверки сессии
const checkSession = async (req, res, next) => {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) {
        return res.status(401).json({ error: 'Session ID required' });
    }
    
    try {
        const session = await db.get(`
            SELECT * FROM demo_sessions WHERE id = ?
        `, [sessionId]);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        if (new Date(session.expires_at) < new Date()) {
            return res.status(410).json({ error: 'Session expired' });
        }
        
        req.session = session;
        next();
    } catch (error) {
        console.error('Session check error:', error);
        res.status(500).json({ error: 'Session validation failed' });
    }
};

// Применяем middleware ко всем маршрутам
router.use(checkSession);

// Получение всех пользователей
router.get('/', async (req, res) => {
    try {
        const users = JSON.parse(req.session.user_data_json);
        res.json(users);
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Не удалось получить пользователей' });
    }
});

// Получение пользователя по ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const users = JSON.parse(req.session.user_data_json);
        const user = users.find(u => u.id === id);
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        res.status(500).json({ error: 'Не удалось получить пользователя' });
    }
});

// Обновление доступности пользователя (кнопка "Свободные руки")
router.post('/:id/availability', async (req, res) => {
    try {
        const { id } = req.params;
        const { available } = req.body;
        
        const users = JSON.parse(req.session.user_data_json);
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Обновляем статус доступности
        users[userIndex].available = available;
        users[userIndex].lastActivity = new Date().toISOString();
        
        await db.run(`
            UPDATE demo_sessions 
            SET user_data_json = ?, updated_at = ?
            WHERE id = ?
        `, [JSON.stringify(users), new Date().toISOString(), req.session.id]);
        
        res.json({
            message: available ? 'Пользователь доступен' : 'Пользователь недоступен',
            user: users[userIndex]
        });
        
    } catch (error) {
        console.error('Ошибка обновления доступности:', error);
        res.status(500).json({ error: 'Не удалось обновить доступность' });
    }
});

// Получение пользователей по роли
router.get('/role/:role', async (req, res) => {
    try {
        const { role } = req.params;
        const users = JSON.parse(req.session.user_data_json);
        const filteredUsers = users.filter(user => user.role === role);
        
        res.json(filteredUsers);
        
    } catch (error) {
        console.error('Ошибка получения пользователей по роли:', error);
        res.status(500).json({ error: 'Не удалось получить пользователей' });
    }
});

// Получение пользователей по отделу
router.get('/department/:department', async (req, res) => {
    try {
        const { department } = req.params;
        const users = JSON.parse(req.session.user_data_json);
        const filteredUsers = users.filter(user => user.department === department);
        
        res.json(filteredUsers);
        
    } catch (error) {
        console.error('Ошибка получения пользователей по отделу:', error);
        res.status(500).json({ error: 'Не удалось получить пользователей' });
    }
});

// Получение статистики пользователей
router.get('/stats/overview', async (req, res) => {
    try {
        const users = JSON.parse(req.session.user_data_json);
        const tasks = JSON.parse(req.session.task_data);
        
        const stats = {
            totalUsers: users.length,
            availableUsers: users.filter(u => u.available !== false).length,
            usersByRole: {},
            usersByDepartment: {},
            averageWorkload: 0,
            overloadedUsers: 0
        };
        
        // Статистика по ролям
        users.forEach(user => {
            stats.usersByRole[user.role] = (stats.usersByRole[user.role] || 0) + 1;
        });
        
        // Статистика по отделам
        users.forEach(user => {
            stats.usersByDepartment[user.department] = (stats.usersByDepartment[user.department] || 0) + 1;
        });
        
        // Средняя загрузка
        const totalWorkload = users.reduce((sum, user) => sum + (user.workload || 0), 0);
        stats.averageWorkload = Math.round(totalWorkload / users.length);
        
        // Перегруженные пользователи (загрузка > 90%)
        stats.overloadedUsers = users.filter(user => (user.workload || 0) > 90).length;
        
        res.json(stats);
        
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ error: 'Не удалось получить статистику' });
    }
});

// Обновление загрузки пользователя
router.put('/:id/workload', async (req, res) => {
    try {
        const { id } = req.params;
        const { workload } = req.body;
        
        if (workload < 0 || workload > 100) {
            return res.status(400).json({ error: 'Workload must be between 0 and 100' });
        }
        
        const users = JSON.parse(req.session.user_data_json);
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        users[userIndex].workload = workload;
        users[userIndex].updatedAt = new Date().toISOString();
        
        await db.run(`
            UPDATE demo_sessions 
            SET user_data_json = ?, updated_at = ?
            WHERE id = ?
        `, [JSON.stringify(users), new Date().toISOString(), req.session.id]);
        
        res.json({
            message: 'Загрузка обновлена',
            user: users[userIndex]
        });
        
    } catch (error) {
        console.error('Ошибка обновления загрузки:', error);
        res.status(500).json({ error: 'Не удалось обновить загрузку' });
    }
});

// Получение пользователей с высокой загрузкой
router.get('/workload/high', async (req, res) => {
    try {
        const { threshold = 80 } = req.query;
        const users = JSON.parse(req.session.user_data_json);
        const highWorkloadUsers = users.filter(user => (user.workload || 0) >= threshold);
        
        res.json(highWorkloadUsers);
        
    } catch (error) {
        console.error('Ошибка получения пользователей с высокой загрузкой:', error);
        res.status(500).json({ error: 'Не удалось получить пользователей' });
    }
});

// Получение свободных пользователей
router.get('/workload/low', async (req, res) => {
    try {
        const { threshold = 30 } = req.query;
        const users = JSON.parse(req.session.user_data_json);
        const lowWorkloadUsers = users.filter(user => (user.workload || 0) <= threshold);
        
        res.json(lowWorkloadUsers);
        
    } catch (error) {
        console.error('Ошибка получения свободных пользователей:', error);
        res.status(500).json({ error: 'Не удалось получить пользователей' });
    }
});

module.exports = router;

