const fs = require('fs');
const path = require('path');

// Функция для расчета рабочих дней между двумя датами
function calculateWorkingDays(startDate, endDate) {
  let workingDays = 0;
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay(); // 0 = воскресенье, 6 = суббота
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
}

// Функция для добавления рабочих дней к дате
function addWorkingDays(date, days) {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

// Форматирование даты в YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Чтение файла
const filePath = path.join(__dirname, '../public/collateralConclusionsData.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`📊 Всего заключений: ${data.length}`);

// Обновляем только согласованные заключения
const approvedConclusions = data.filter(c => c.status === 'Согласовано');
console.log(`✅ Согласованных заключений: ${approvedConclusions.length}`);

let updatedCount = 0;
const workingDaysList = [];

approvedConclusions.forEach((conclusion, index) => {
  if (!conclusion.authorDate) {
    return; // Пропускаем, если нет даты создания
  }
  
  const authorDate = new Date(conclusion.authorDate);
  if (isNaN(authorDate.getTime())) {
    return; // Пропускаем невалидные даты
  }
  
  // Определяем целевую дату согласования (1-7 рабочих дней от даты создания)
  // Распределяем: 60% - 3-5 дней, 30% - 1-2 дня, 10% - 6-7 дней
  let targetWorkingDays;
  const random = Math.random();
  if (random < 0.3) {
    targetWorkingDays = 1 + Math.floor(Math.random() * 2); // 1-2 дня
  } else if (random < 0.9) {
    targetWorkingDays = 3 + Math.floor(Math.random() * 3); // 3-5 дней
  } else {
    targetWorkingDays = 6 + Math.floor(Math.random() * 2); // 6-7 дней
  }
  
  const approvalDate = addWorkingDays(authorDate, targetWorkingDays);
  
  // Обновляем approvalDate или conclusionDate
  if (!conclusion.approvalDate) {
    conclusion.approvalDate = formatDate(approvalDate);
  } else {
    conclusion.approvalDate = formatDate(approvalDate);
  }
  
  // Обновляем conclusionDate, если он раньше approvalDate
  if (conclusion.conclusionDate) {
    const conclusionDate = new Date(conclusion.conclusionDate);
    if (conclusionDate < approvalDate) {
      conclusion.conclusionDate = formatDate(approvalDate);
    }
  } else {
    conclusion.conclusionDate = formatDate(approvalDate);
  }
  
  // Добавляем согласующего, если его нет
  if (!conclusion.approver) {
    const approvers = ['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.', 'Козлова К.К.', 'Волков В.В.'];
    conclusion.approver = approvers[index % approvers.length];
  }
  
  workingDaysList.push(targetWorkingDays);
  updatedCount++;
});

// Сохранение обновленных данных
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

// Расчет статистики
const avgWorkingDays = workingDaysList.length > 0
  ? (workingDaysList.reduce((sum, days) => sum + days, 0) / workingDaysList.length).toFixed(2)
  : 0;

const maxWorkingDays = workingDaysList.length > 0
  ? Math.max(...workingDaysList)
  : 0;

const minWorkingDays = workingDaysList.length > 0
  ? Math.min(...workingDaysList)
  : 0;

const compliantCount = workingDaysList.filter(days => days <= 7).length;
const complianceRate = workingDaysList.length > 0
  ? ((compliantCount / workingDaysList.length) * 100).toFixed(1)
  : 0;

console.log(`\n✅ Обновлено заключений: ${updatedCount}`);
console.log(`\n📈 Статистика по рабочим дням:`);
console.log(`   Средний срок: ${avgWorkingDays} дней`);
console.log(`   Минимальный: ${minWorkingDays} дней`);
console.log(`   Максимальный: ${maxWorkingDays} дней`);
console.log(`   Соответствие SLA (≤7 дней): ${complianceRate}% (${compliantCount}/${workingDaysList.length})`);

console.log(`\n💾 Файл обновлен: ${filePath}`);

