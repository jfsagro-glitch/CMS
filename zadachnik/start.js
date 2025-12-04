#!/usr/bin/env node

/**
 * CURSOR Pipeline Demo - Запускающий скрипт
 * Автоматически устанавливает зависимости и запускает сервер
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CURSOR Pipeline Demo - Запуск...\n');

// Проверяем наличие node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
const packageLockPath = path.join(__dirname, 'package-lock.json');

function checkDependencies() {
  return new Promise((resolve) => {
    if (!fs.existsSync(nodeModulesPath) || !fs.existsSync(packageLockPath)) {
      console.log('📦 Установка зависимостей...');
      const install = spawn('npm', ['install'], { 
        stdio: 'inherit',
        shell: true 
      });
      
      install.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Зависимости установлены\n');
          resolve();
        } else {
          console.error('❌ Ошибка установки зависимостей');
          process.exit(1);
        }
      });
    } else {
      console.log('✅ Зависимости уже установлены\n');
      resolve();
    }
  });
}

function startServer() {
  console.log('🔥 Запуск сервера...\n');
  
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('close', (code) => {
    console.log(`\n🛑 Сервер остановлен с кодом ${code}`);
  });
  
  // Обработка Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Остановка сервера...');
    server.kill('SIGINT');
  });
}

// Основная функция
async function main() {
  try {
    await checkDependencies();
    startServer();
  } catch (error) {
    console.error('❌ Ошибка запуска:', error.message);
    process.exit(1);
  }
}

// Запуск
main();
