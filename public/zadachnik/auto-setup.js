#!/usr/bin/env node

/**
 * CURSOR Pipeline Demo - Автоматическая установка и запуск
 * Полностью автоматизированный процесс развертывания
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('🚀 CURSOR Pipeline Demo - АВТОМАТИЧЕСКАЯ УСТАНОВКА');
console.log('='.repeat(60));

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Проверка Node.js
function checkNodeVersion() {
  return new Promise((resolve) => {
    log('\n1️⃣  Проверка Node.js...', 'blue');
    
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      log(`   ✅ Node.js ${version} - OK`, 'green');
      resolve(true);
    } else {
      log(`   ❌ Node.js ${version} - требуется версия 18+`, 'red');
      resolve(false);
    }
  });
}

// Установка зависимостей
function installDependencies() {
  return new Promise((resolve) => {
    log('\n2️⃣  Установка зависимостей...', 'blue');
    
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    
    if (fs.existsSync(nodeModulesPath)) {
      log('   ✅ Зависимости уже установлены', 'green');
      resolve(true);
      return;
    }
    
    log('   📦 Устанавливаем npm пакеты...', 'yellow');
    
    const install = spawn('npm', ['install', '--production'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    
    install.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write('.');
    });
    
    install.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    install.on('close', (code) => {
      console.log(); // Новая строка после точек
      
      if (code === 0) {
        log('   ✅ Зависимости установлены успешно', 'green');
        resolve(true);
      } else {
        log(`   ❌ Ошибка установки (код ${code})`, 'red');
        log('   Попробуйте: npm install', 'yellow');
        resolve(false);
      }
    });
  });
}

// Проверка файловой структуры
function checkFileStructure() {
  return new Promise((resolve) => {
    log('\n3️⃣  Проверка файловой структуры...', 'blue');
    
    const requiredFiles = [
      'server.js',
      'package.json',
      'public/index.html',
      'public/css/style.css',
      'public/js/app.js',
      'src/backend/routes/demo.js',
      'src/backend/database/db.js'
    ];
    
    let missingFiles = [];
    
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        log(`   ✅ ${file}`, 'green');
      } else {
        log(`   ❌ ${file} - ОТСУТСТВУЕТ`, 'red');
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length === 0) {
      log('   ✅ Все файлы на месте', 'green');
      resolve(true);
    } else {
      log(`   ❌ Отсутствует ${missingFiles.length} файлов`, 'red');
      resolve(false);
    }
  });
}

// Инициализация базы данных
function initializeDatabase() {
  return new Promise((resolve) => {
    log('\n4️⃣  Инициализация базы данных...', 'blue');
    
    // Проверяем, есть ли уже база данных
    const dbFiles = ['demo_sessions.db', 'database.db'];
    const existingDb = dbFiles.find(db => fs.existsSync(db));
    
    if (existingDb) {
      log(`   ✅ База данных ${existingDb} уже существует`, 'green');
      resolve(true);
      return;
    }
    
    // Создаем простую проверку базы данных
    log('   💾 Создаем базу данных...', 'yellow');
    
    try {
      const db = require('./src/backend/database/db');
      log('   ✅ База данных инициализирована', 'green');
      resolve(true);
    } catch (error) {
      log(`   ❌ Ошибка инициализации БД: ${error.message}`, 'red');
      resolve(false);
    }
  });
}

// Запуск сервера
function startServer() {
  return new Promise((resolve) => {
    log('\n5️⃣  Запуск сервера...', 'blue');
    
    const PORT = process.env.PORT || 3000;
    
    log(`   🚀 Запускаем на порту ${PORT}...`, 'yellow');
    
    const server = spawn('node', ['server.js'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    let serverStarted = false;
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('CURSOR Pipeline Demo запущен успешно') && !serverStarted) {
        serverStarted = true;
        log('\n🎉 СЕРВЕР ЗАПУЩЕН УСПЕШНО!', 'green');
        log('\n📱 Приложение доступно по адресам:', 'cyan');
        
        if (process.env.CODESPACE_NAME) {
          const codespaceUrl = `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`;
          log(`   🌐 GitHub Codespaces: ${codespaceUrl}`, 'bright');
        }
        
        log(`   🏠 Локально: http://localhost:${PORT}`, 'bright');
        log(`   🌍 Внешний доступ: http://0.0.0.0:${PORT}`, 'bright');
        
        log('\n✨ Добро пожаловать в CURSOR Pipeline Demo!', 'magenta');
        log('🎮 Нажмите "Демо-режим" для начала тестирования', 'yellow');
        
        resolve(true);
      }
    });
    
    server.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    server.on('close', (code) => {
      if (code !== 0) {
        log(`\n❌ Сервер остановлен с ошибкой (код ${code})`, 'red');
        resolve(false);
      }
    });
    
    // Обработка Ctrl+C
    process.on('SIGINT', () => {
      log('\n🛑 Остановка сервера...', 'yellow');
      server.kill('SIGINT');
      process.exit(0);
    });
    
    // Таймаут на случай, если сервер не запустился
    setTimeout(() => {
      if (!serverStarted) {
        log('\n⏰ Таймаут запуска сервера', 'yellow');
        log('   Попробуйте запустить вручную: npm start', 'cyan');
        resolve(false);
      }
    }, 30000);
  });
}

// Основная функция
async function main() {
  try {
    // Проверяем Node.js
    const nodeOk = await checkNodeVersion();
    if (!nodeOk) {
      log('\n❌ Обновите Node.js до версии 18 или выше', 'red');
      process.exit(1);
    }
    
    // Устанавливаем зависимости
    const depsOk = await installDependencies();
    if (!depsOk) {
      log('\n❌ Не удалось установить зависимости', 'red');
      process.exit(1);
    }
    
    // Проверяем файлы
    const filesOk = await checkFileStructure();
    if (!filesOk) {
      log('\n❌ Неполная файловая структура', 'red');
      process.exit(1);
    }
    
    // Инициализируем БД
    const dbOk = await initializeDatabase();
    if (!dbOk) {
      log('\n⚠️  Проблемы с базой данных, но продолжаем...', 'yellow');
    }
    
    // Запускаем сервер
    const serverOk = await startServer();
    if (!serverOk) {
      log('\n❌ Не удалось запустить сервер', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n❌ Критическая ошибка: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Запуск
main();
