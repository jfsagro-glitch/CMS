#!/usr/bin/env node

/**
 * CURSOR Pipeline Demo - Проверка работоспособности
 * Проверяет все API endpoints и базу данных
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

console.log('🔍 Проверка работоспособности CURSOR Pipeline Demo...\n');

// Функция для HTTP запросов
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Проверки
async function runHealthChecks() {
  const checks = [];
  
  // 1. Health endpoint
  console.log('1️⃣  Проверка health endpoint...');
  try {
    const health = await makeRequest('/health');
    if (health.status === 200) {
      console.log('   ✅ Health check: OK');
      checks.push(true);
    } else {
      console.log('   ❌ Health check: FAILED');
      checks.push(false);
    }
  } catch (error) {
    console.log('   ❌ Health check: ERROR -', error.message);
    checks.push(false);
  }

  // 2. Demo API
  console.log('2️⃣  Проверка demo API...');
  try {
    const demo = await makeRequest('/api/demo/status');
    if (demo.status === 200) {
      console.log('   ✅ Demo API: OK');
      checks.push(true);
    } else {
      console.log('   ❌ Demo API: FAILED');
      checks.push(false);
    }
  } catch (error) {
    console.log('   ❌ Demo API: ERROR -', error.message);
    checks.push(false);
  }

  // 3. Tasks API
  console.log('3️⃣  Проверка tasks API...');
  try {
    const tasks = await makeRequest('/api/tasks');
    if (tasks.status === 200) {
      console.log('   ✅ Tasks API: OK');
      checks.push(true);
    } else {
      console.log('   ❌ Tasks API: FAILED');
      checks.push(false);
    }
  } catch (error) {
    console.log('   ❌ Tasks API: ERROR -', error.message);
    checks.push(false);
  }

  // 4. Users API
  console.log('4️⃣  Проверка users API...');
  try {
    const users = await makeRequest('/api/users');
    if (users.status === 200) {
      console.log('   ✅ Users API: OK');
      checks.push(true);
    } else {
      console.log('   ❌ Users API: FAILED');
      checks.push(false);
    }
  } catch (error) {
    console.log('   ❌ Users API: ERROR -', error.message);
    checks.push(false);
  }

  // 5. Static files
  console.log('5️⃣  Проверка статических файлов...');
  const staticFiles = ['public/index.html', 'public/css/style.css', 'public/js/app.js'];
  let staticOk = true;
  
  for (const file of staticFiles) {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}: EXISTS`);
    } else {
      console.log(`   ❌ ${file}: MISSING`);
      staticOk = false;
    }
  }
  checks.push(staticOk);

  // Результат
  const passed = checks.filter(Boolean).length;
  const total = checks.length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Результат проверки: ${passed}/${total} тестов пройдено`);
  
  if (passed === total) {
    console.log('🎉 Все проверки пройдены успешно!');
    console.log('✅ CURSOR Pipeline Demo готов к работе!');
    process.exit(0);
  } else {
    console.log('⚠️  Некоторые проверки не пройдены');
    console.log('❌ Требуется дополнительная настройка');
    process.exit(1);
  }
}

// Запуск проверок
runHealthChecks().catch(error => {
  console.error('❌ Ошибка при выполнении проверок:', error.message);
  process.exit(1);
});
