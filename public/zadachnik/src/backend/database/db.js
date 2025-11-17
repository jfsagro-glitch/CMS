const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Определяем путь к базе данных
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/demo_sessions.db'  // Glitch использует /tmp для сохранения данных
    : path.join(__dirname, '../../demo_sessions.db');

console.log('Database path:', dbPath);

// Создаем подключение к базе данных
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
    } else {
        console.log('✅ Подключение к SQLite базе данных установлено');
        initializeDatabase();
    }
});

// Инициализация базы данных
function initializeDatabase() {
    // Создаем таблицу демо-сессий
    db.run(`
        CREATE TABLE IF NOT EXISTS demo_sessions (
            id TEXT PRIMARY KEY,
            user_data TEXT NOT NULL,
            task_data TEXT NOT NULL,
            user_data_json TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы demo_sessions:', err);
        } else {
            console.log('✅ Таблица demo_sessions создана/проверена');
        }
    });

    // Создаем индекс для быстрого поиска по времени истечения
    db.run(`
        CREATE INDEX IF NOT EXISTS idx_expires_at ON demo_sessions(expires_at)
    `, (err) => {
        if (err) {
            console.error('Ошибка создания индекса:', err);
        } else {
            console.log('✅ Индекс по expires_at создан/проверен');
        }
    });

    // Запускаем очистку старых сессий
    cleanupExpiredSessions();
}

// Очистка истекших сессий
function cleanupExpiredSessions() {
    const now = new Date().toISOString();
    
    db.run(`
        DELETE FROM demo_sessions 
        WHERE expires_at < ?
    `, [now], function(err) {
        if (err) {
            console.error('Ошибка очистки истекших сессий:', err);
        } else {
            if (this.changes > 0) {
                console.log(`🧹 Очищено ${this.changes} истекших сессий`);
            }
        }
    });
}

// Автоматическая очистка каждые 6 часов
setInterval(cleanupExpiredSessions, 6 * 60 * 60 * 1000);

// Обработка ошибок базы данных
db.on('error', (err) => {
    console.error('Database error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Закрытие подключения к базе данных...');
    db.close((err) => {
        if (err) {
            console.error('Ошибка при закрытии базы данных:', err);
        } else {
            console.log('✅ Подключение к базе данных закрыто');
        }
        process.exit(0);
    });
});

// Промисифицированные методы для удобной работы
db.run = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.constructor.prototype.run.call(this, sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

db.get = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.constructor.prototype.get.call(this, sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

db.all = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.constructor.prototype.all.call(this, sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

module.exports = db;

