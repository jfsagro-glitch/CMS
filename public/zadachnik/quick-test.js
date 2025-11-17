#!/usr/bin/env node

/**
 * CURSOR Pipeline Demo - Быстрая проверка
 * Проверяет основные компоненты системы
 */

console.log('🔍 CURSOR Pipeline Demo - Быстрая проверка\n');

// Проверка зависимостей
console.log('1️⃣  Проверка зависимостей...');
const requiredModules = ['express', 'sqlite3', 'cors', 'helmet', 'compression', 'uuid'];

for (const module of requiredModules) {
  try {
    require(module);
    console.log(`   ✅ ${module}: OK`);
  } catch (error) {
    console.log(`   ❌ ${module}: MISSING`);
    console.log(`      Установите: npm install ${module}`);
  }
}

// Проверка файловой структуры
console.log('\n2️⃣  Проверка файловой структуры...');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'server.js',
  'package.json',
  'public/index.html',
  'public/css/style.css',
  'public/js/app.js',
  'public/js/api.js',
  'src/backend/routes/demo.js',
  'src/backend/routes/tasks.js',
  'src/backend/routes/users.js',
  'src/backend/database/db.js',
  'src/backend/database/demo-data.js'
];

let filesOk = 0;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}: EXISTS`);
    filesOk++;
  } else {
    console.log(`   ❌ ${file}: MISSING`);
  }
}

// Проверка package.json
console.log('\n3️⃣  Проверка package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  console.log(`   ✅ Название: ${packageJson.name}`);
  console.log(`   ✅ Версия: ${packageJson.version}`);
  console.log(`   ✅ Node.js: ${packageJson.engines?.node || 'не указано'}`);
  
  const scripts = Object.keys(packageJson.scripts || {});
  console.log(`   ✅ Скрипты: ${scripts.join(', ')}`);
  
  const deps = Object.keys(packageJson.dependencies || {});
  console.log(`   ✅ Зависимости: ${deps.length} пакетов`);
  
} catch (error) {
  console.log(`   ❌ Ошибка чтения package.json: ${error.message}`);
}

// Проверка порта
console.log('\n4️⃣  Проверка конфигурации...');
const PORT = process.env.PORT || 3000;
console.log(`   ✅ Порт: ${PORT}`);
console.log(`   ✅ Режим: ${process.env.NODE_ENV || 'production'}`);

// Проверка Codespaces
if (process.env.CODESPACE_NAME) {
  console.log(`   ✅ Codespaces: ${process.env.CODESPACE_NAME}`);
} else {
  console.log(`   ℹ️  Codespaces: не обнаружен`);
}

// Итоговый результат
console.log('\n' + '='.repeat(50));
console.log(`📊 Результат: ${filesOk}/${requiredFiles.length} файлов найдено`);

if (filesOk === requiredFiles.length) {
  console.log('🎉 Все проверки пройдены!');
  console.log('✅ Система готова к запуску');
  console.log('\n🚀 Для запуска выполните:');
  console.log('   npm start');
  console.log('\n📱 Откройте в браузере:');
  console.log('   http://localhost:3000');
  
  if (process.env.CODESPACE_NAME) {
    console.log(`   https://${process.env.CODESPACE_NAME}-3000.app.github.dev`);
  }
  
  process.exit(0);
} else {
  console.log('⚠️  Обнаружены проблемы');
  console.log('❌ Требуется дополнительная настройка');
  process.exit(1);
}
