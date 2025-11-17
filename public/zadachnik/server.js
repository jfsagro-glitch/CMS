const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Для демо-режима отключаем CSP
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы
app.use(express.static('public'));

// API Routes с обработкой ошибок
try {
  const demoRoutes = require('./src/backend/routes/demo');
  const taskRoutes = require('./src/backend/routes/tasks');
  const userRoutes = require('./src/backend/routes/users');
  
  app.use('/api/demo', demoRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/users', userRoutes);
  
  console.log('✅ API маршруты загружены успешно');
} catch (error) {
  console.error('❌ Ошибка загрузки маршрутов:', error.message);
  console.log('⚠️  Сервер запустится без API маршрутов');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// SPA fallback - все остальные маршруты ведут на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 CURSOR Pipeline Demo запущен успешно!');
  console.log('='.repeat(60));
  console.log(`📊 Приложение доступно по адресам:`);
  console.log(`   - Локально: http://localhost:${PORT}`);
  
  // Информация о Codespaces
  if (process.env.CODESPACE_NAME) {
    const codespaceUrl = `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`;
    console.log(`   - GitHub Codespaces: ${codespaceUrl}`);
    console.log(`\n🎉 GitHub Codespaces обнаружен!`);
    console.log(`📱 Откройте приложение: ${codespaceUrl}`);
  } else {
    console.log(`   - Внешний доступ: http://0.0.0.0:${PORT}`);
  }
  
  console.log(`\n⚙️  Настройки системы:`);
  console.log(`   - Порт: ${PORT}`);
  console.log(`   - Таймаут сессий: 6 часов`);
  console.log(`   - Макс. сессий: 10`);
  console.log(`   - База данных: SQLite (demo_sessions.db)`);
  console.log(`   - Режим: ${process.env.NODE_ENV || 'production'}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Готов к работе! Добро пожаловать в CURSOR Pipeline!');
  console.log('='.repeat(60) + '\n');
});

