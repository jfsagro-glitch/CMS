const express = require('express');
const { v4: uuidv4 } = require('uuid');
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

// Получение всех задач
router.get('/', async (req, res) => {
    try {
        const tasks = JSON.parse(req.session.task_data);
        res.json(tasks);
    } catch (error) {
        console.error('Ошибка получения задач:', error);
        res.status(500).json({ error: 'Не удалось получить задачи' });
    }
});

// Создание новой задачи
router.post('/', async (req, res) => {
    try {
        const { title, description, assignee, priority, dueDate, status = 'new' } = req.body;
        
        if (!title || !assignee || !dueDate) {
            return res.status(400).json({ error: 'Обязательные поля: title, assignee, dueDate' });
        }
        
        const newTask = {
            id: uuidv4(),
            title,
            description: description || '',
            assignee,
            priority: priority || 'medium',
            dueDate,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const currentTasks = JSON.parse(req.session.task_data);
        const updatedTasks = [...currentTasks, newTask];
        
        await db.run(`
            UPDATE demo_sessions 
            SET task_data = ?, updated_at = ?
            WHERE id = ?
        `, [JSON.stringify(updatedTasks), new Date().toISOString(), req.session.id]);
        
        res.json(newTask);
        
    } catch (error) {
        console.error('Ошибка создания задачи:', error);
        res.status(500).json({ error: 'Не удалось создать задачу' });
    }
});

// Обновление задачи
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const currentTasks = JSON.parse(req.session.task_data);
        const taskIndex = currentTasks.findIndex(task => task.id === id);
        
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Задача не найдена' });
        }
        
        const updatedTask = {
            ...currentTasks[taskIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        currentTasks[taskIndex] = updatedTask;
        
        await db.run(`
            UPDATE demo_sessions 
            SET task_data = ?, updated_at = ?
            WHERE id = ?
        `, [JSON.stringify(currentTasks), new Date().toISOString(), req.session.id]);
        
        res.json(updatedTask);
        
    } catch (error) {
        console.error('Ошибка обновления задачи:', error);
        res.status(500).json({ error: 'Не удалось обновить задачу' });
    }
});

// Обновление статуса задачи
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const validStatuses = ['new', 'in_progress', 'review', 'done'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const currentTasks = JSON.parse(req.session.task_data);
        const taskIndex = currentTasks.findIndex(task => task.id === id);
        
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Задача не найдена' });
        }
        
        const updatedTask = {
            ...currentTasks[taskIndex],
            status,
            updatedAt: new Date().toISOString()
        };
        
        currentTasks[taskIndex] = updatedTask;
        
        await db.run(`
            UPDATE demo_sessions 
            SET task_data = ?, updated_at = ?
            WHERE id = ?
        `, [JSON.stringify(currentTasks), new Date().toISOString(), req.session.id]);
        
        res.json(updatedTask);
        
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
        res.status(500).json({ error: 'Не удалось обновить статус задачи' });
    }
});

// Удаление задачи
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const currentTasks = JSON.parse(req.session.task_data);
        const taskIndex = currentTasks.findIndex(task => task.id === id);
        
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Задача не найдена' });
        }
        
        const deletedTask = currentTasks[taskIndex];
        currentTasks.splice(taskIndex, 1);
        
        await db.run(`
            UPDATE demo_sessions 
            SET task_data = ?, updated_at = ?
            WHERE id = ?
        `, [JSON.stringify(currentTasks), new Date().toISOString(), req.session.id]);
        
        res.json({ message: 'Задача удалена', task: deletedTask });
        
    } catch (error) {
        console.error('Ошибка удаления задачи:', error);
        res.status(500).json({ error: 'Не удалось удалить задачу' });
    }
});

// Получение задач по статусу
router.get('/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        const tasks = JSON.parse(req.session.task_data);
        const filteredTasks = tasks.filter(task => task.status === status);
        
        res.json(filteredTasks);
        
    } catch (error) {
        console.error('Ошибка получения задач по статусу:', error);
        res.status(500).json({ error: 'Не удалось получить задачи' });
    }
});

// Получение задач пользователя
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const tasks = JSON.parse(req.session.task_data);
        const userTasks = tasks.filter(task => task.assignee === userId);
        
        res.json(userTasks);
        
    } catch (error) {
        console.error('Ошибка получения задач пользователя:', error);
        res.status(500).json({ error: 'Не удалось получить задачи пользователя' });
    }
});

// Поиск задач
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        
        const tasks = JSON.parse(req.session.task_data);
        const searchResults = tasks.filter(task => 
            task.title.toLowerCase().includes(q.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(q.toLowerCase()))
        );
        
        res.json(searchResults);
        
    } catch (error) {
        console.error('Ошибка поиска задач:', error);
        res.status(500).json({ error: 'Не удалось выполнить поиск' });
    }
});

module.exports = router;

