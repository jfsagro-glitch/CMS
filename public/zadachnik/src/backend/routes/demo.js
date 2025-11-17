const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { generateDemoData } = require('../database/demo-data');

const router = express.Router();

// Создание новой демо-сессии
router.post('/sessions', async (req, res) => {
    try {
        const { role = 'supervisor' } = req.body;
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 часов
        
        // Создаем временного пользователя
        const demoUser = {
            id: uuidv4(),
            name: 'Демо Пользователь',
            email: `demo-${sessionId}@cursor-pipeline.ru`,
            role: role,
            department: 'IT отдел',
            position: 'Супервайзер',
            isTemporary: true,
            createdAt: new Date().toISOString()
        };
        
        // Генерируем демо-данные
        const demoData = generateDemoData(sessionId);
        
        // Сохраняем сессию в БД
        await db.run(`
            INSERT INTO demo_sessions (id, user_data, task_data, user_data_json, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            sessionId,
            JSON.stringify(demoUser),
            JSON.stringify(demoData.tasks),
            JSON.stringify(demoData.users),
            expiresAt.toISOString(),
            new Date().toISOString()
        ]);
        
        res.json({
            sessionId,
            user: demoUser,
            expiresAt: expiresAt.toISOString(),
            message: 'Демо-сессия создана успешно'
        });
        
    } catch (error) {
        console.error('Ошибка создания демо-сессии:', error);
        res.status(500).json({ error: 'Не удалось создать демо-сессию' });
    }
});

// Получение данных сессии
router.get('/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const session = await db.get(`
            SELECT * FROM demo_sessions WHERE id = ?
        `, [id]);
        
        if (!session) {
            return res.status(404).json({ error: 'Сессия не найдена' });
        }
        
        // Проверяем, не истекла ли сессия
        if (new Date(session.expires_at) < new Date()) {
            return res.status(410).json({ error: 'Сессия истекла' });
        }
        
        const user = JSON.parse(session.user_data);
        const tasks = JSON.parse(session.task_data);
        const users = JSON.parse(session.user_data_json);
        
        res.json({
            sessionId: id,
            user,
            tasks,
            users,
            expiresAt: session.expires_at
        });
        
    } catch (error) {
        console.error('Ошибка получения сессии:', error);
        res.status(500).json({ error: 'Не удалось получить данные сессии' });
    }
});

// Сброс демо-данных к исходному состоянию
router.post('/sessions/:id/reset', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Получаем текущую сессию
        const session = await db.get(`
            SELECT * FROM demo_sessions WHERE id = ?
        `, [id]);
        
        if (!session) {
            return res.status(404).json({ error: 'Сессия не найдена' });
        }
        
        // Генерируем новые демо-данные
        const demoData = generateDemoData(id);
        
        // Обновляем данные в БД
        await db.run(`
            UPDATE demo_sessions 
            SET task_data = ?, user_data_json = ?, updated_at = ?
            WHERE id = ?
        `, [
            JSON.stringify(demoData.tasks),
            JSON.stringify(demoData.users),
            new Date().toISOString(),
            id
        ]);
        
        res.json({
            message: 'Демо-данные сброшены к исходному состоянию',
            tasks: demoData.tasks,
            users: demoData.users
        });
        
    } catch (error) {
        console.error('Ошибка сброса демо-данных:', error);
        res.status(500).json({ error: 'Не удалось сбросить демо-данные' });
    }
});

// Продление сессии
router.post('/sessions/:id/extend', async (req, res) => {
    try {
        const { id } = req.params;
        const newExpiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // +6 часов
        
        await db.run(`
            UPDATE demo_sessions 
            SET expires_at = ?, updated_at = ?
            WHERE id = ?
        `, [newExpiresAt.toISOString(), new Date().toISOString(), id]);
        
        res.json({
            message: 'Сессия продлена',
            expiresAt: newExpiresAt.toISOString()
        });
        
    } catch (error) {
        console.error('Ошибка продления сессии:', error);
        res.status(500).json({ error: 'Не удалось продлить сессию' });
    }
});

// Быстрое создание тестовых задач
router.post('/quick-tasks', async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID required' });
        }
        
        // Получаем текущую сессию
        const session = await db.get(`
            SELECT * FROM demo_sessions WHERE id = ?
        `, [sessionId]);
        
        if (!session) {
            return res.status(404).json({ error: 'Сессия не найдена' });
        }
        
        const currentTasks = JSON.parse(session.task_data);
        const newTasks = generateDemoData(sessionId).tasks.slice(0, 5); // Добавляем 5 новых задач
        
        const updatedTasks = [...currentTasks, ...newTasks];
        
        await db.run(`
            UPDATE demo_sessions 
            SET task_data = ?, updated_at = ?
            WHERE id = ?
        `, [JSON.stringify(updatedTasks), new Date().toISOString(), sessionId]);
        
        res.json({
            message: 'Тестовые задачи созданы',
            newTasks: newTasks.length,
            totalTasks: updatedTasks.length
        });
        
    } catch (error) {
        console.error('Ошибка создания тестовых задач:', error);
        res.status(500).json({ error: 'Не удалось создать тестовые задачи' });
    }
});

// Симуляция загрузки
router.post('/simulate-workload', async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID required' });
        }
        
        // Получаем текущую сессию
        const session = await db.get(`
            SELECT * FROM demo_sessions WHERE id = ?
        `, [sessionId]);
        
        if (!session) {
            return res.status(404).json({ error: 'Сессия не найдена' });
        }
        
        const users = JSON.parse(session.user_data_json);
        
        // Симулируем изменение загрузки
        const updatedUsers = users.map(user => ({
            ...user,
            workload: Math.floor(Math.random() * 100) // Случайная загрузка 0-100%
        }));
        
        await db.run(`
            UPDATE demo_sessions 
            SET user_data_json = ?, updated_at = ?
            WHERE id = ?
        `, [JSON.stringify(updatedUsers), new Date().toISOString(), sessionId]);
        
        res.json({
            message: 'Загрузка симулирована',
            users: updatedUsers
        });
        
    } catch (error) {
        console.error('Ошибка симуляции загрузки:', error);
        res.status(500).json({ error: 'Не удалось симулировать загрузку' });
    }
});

// Загрузка сценария
router.post('/load-scenario', async (req, res) => {
    try {
        const { scenario } = req.body;
        const sessionId = req.headers['x-session-id'];
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID required' });
        }
        
        // Здесь можно реализовать разные сценарии
        const scenarios = {
            'high-load': () => generateDemoData(sessionId, { taskCount: 20, highWorkload: true }),
            'low-load': () => generateDemoData(sessionId, { taskCount: 5, highWorkload: false }),
            'default': () => generateDemoData(sessionId)
        };
        
        const demoData = scenarios[scenario] ? scenarios[scenario]() : scenarios.default();
        
        await db.run(`
            UPDATE demo_sessions 
            SET task_data = ?, user_data_json = ?, updated_at = ?
            WHERE id = ?
        `, [
            JSON.stringify(demoData.tasks),
            JSON.stringify(demoData.users),
            new Date().toISOString(),
            sessionId
        ]);
        
        res.json({
            message: `Сценарий '${scenario}' загружен`,
            tasks: demoData.tasks,
            users: demoData.users
        });
        
    } catch (error) {
        console.error('Ошибка загрузки сценария:', error);
        res.status(500).json({ error: 'Не удалось загрузить сценарий' });
    }
});

module.exports = router;

