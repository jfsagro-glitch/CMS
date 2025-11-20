/**
 * Скрипт для генерации демо-договоров портфеля
 * Генерирует portfolioData.json с договорами для всех типов имущества
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Импортируем функции генерации (нужно будет адаптировать для Node.js)
// Пока создадим упрощенную версию генерации

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const segments = ['КБ', 'СРБ', 'МСБ', 'КК'];
const groups = ['СВХ', 'КК', 'МСБ', 'КБ'];
const contractTypes = [
  'Кредитная линия. Единый продукт.',
  'Кредит на пополнение оборотных средств',
  'Инвестиционный кредит',
  'Овердрафт',
];

const organizations = [
  'ООО "Рога и Копыта"',
  'ООО "Вектор"',
  'ООО "Альфа"',
  'ООО "Бета"',
  'ООО "Гамма"',
  'ООО "Дельта"',
  'ООО "Омега"',
  'ООО "Сигма"',
  'ООО "Тета"',
  'ООО "Фи"',
  'ООО "ЭНЕРГИЯ-Плюс"',
  'ООО "Ромашка"',
  'ООО "Протуберанец"',
  'ООО "Сибирь-Холод"',
];

const collateralCategories = [
  'договор залога недвижимого имущества',
  'договор залога движимого имущества/оборудования',
  'договор залога транспортных средств',
  'договор залога товаров в обороте',
  'договор залога ценных бумаг',
  'договор залога имущественных прав',
];

const collateralTypes = ['Основное', 'Дополнительное', 'Формальное'];
const priorities = ['Первичный', 'последующий'];
const liquidityLevels = ['Высокая', 'Средняя', 'Малоудовлетворительная', 'Низкая'];
const monitoringTypes = ['физический', 'документарный', 'комбинированный'];

const generateInn = () => randomInt(1000000000, 9999999999);

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const getCollateralCategory = (propertyType) => {
  const lowerType = propertyType.toLowerCase();
  if (lowerType.includes('недвижимость') || lowerType.includes('здание') || lowerType.includes('помещение') || lowerType.includes('квартира')) {
    return 'договор залога недвижимого имущества';
  }
  if (lowerType.includes('транспорт') || lowerType.includes('автомобиль') || lowerType.includes('машина')) {
    return 'договор залога транспортных средств';
  }
  if (lowerType.includes('оборудование') || lowerType.includes('машина') || lowerType.includes('станок')) {
    return 'договор залога движимого имущества/оборудования';
  }
  if (lowerType.includes('товар') || lowerType.includes('продукт')) {
    return 'договор залога товаров в обороте';
  }
  if (lowerType.includes('ценная бумага') || lowerType.includes('акция') || lowerType.includes('облигация')) {
    return 'договор залога ценных бумаг';
  }
  if (lowerType.includes('право') || lowerType.includes('требование')) {
    return 'договор залога имущественных прав';
  }
  return randomChoice(collateralCategories);
};

// Типы имущества (примерный список, в реальности берется из справочника)
const propertyTypes = [
  'Будущий урожай',
  'Недвижимое имущество',
  'Транспортные средства',
  'Оборудование',
  'Товары в обороте',
  'Ценные бумаги',
  'Имущественные права',
  'Права требования',
  'Денежные средства',
  'Драгоценные металлы',
];

const generateContract = (propertyType, index, borrower, borrowerInn, pledger, pledgerInn) => {
  const baseReference = 20000000 + index;
  const contractYear = 2023 + (index % 2);
  const contractMonth = randomInt(1, 12);
  const contractDay = randomInt(1, 28);
  
  const contractDate = new Date(contractYear, contractMonth - 1, contractDay);
  const openDate = contractDate;
  const closeDate = new Date(contractDate);
  closeDate.setFullYear(closeDate.getFullYear() + randomInt(1, 3));
  
  const contractNumber = `${randomInt(100, 999)}.${randomInt(100, 999)}/${contractYear % 100}-${randomInt(1, 9)}`;
  const collateralContractNumber = `${contractNumber}-З`;
  
  const limitRub = randomInt(1000000, 50000000);
  const debtRub = Math.floor(limitRub * (0.3 + Math.random() * 0.5));
  const marketValue = randomInt(500000, limitRub);
  const collateralValue = Math.floor(marketValue * 0.7);
  
  const valuationDate = new Date(contractDate);
  valuationDate.setDate(valuationDate.getDate() + randomInt(1, 30));
  
  const lastMonitoringDate = new Date();
  lastMonitoringDate.setDate(lastMonitoringDate.getDate() - randomInt(0, 180));
  
  const nextMonitoringDate = new Date(lastMonitoringDate);
  nextMonitoringDate.setMonth(nextMonitoringDate.getMonth() + randomInt(3, 12));
  
  const cities = ['Москва', 'Санкт-Петербург', 'Краснодар', 'Екатеринбург', 'Ростов-на-Дону'];
  const streets = ['Ленина', 'Пушкина', 'Гагарина', 'Мира', 'Советская'];
  
  return {
    segment: randomChoice(segments),
    group: randomChoice(groups),
    reference: baseReference,
    pledger,
    inn: pledgerInn,
    borrower,
    contractNumber,
    contractDate: formatDate(contractDate),
    type: randomChoice(contractTypes),
    openDate: formatDate(openDate),
    closeDate: formatDate(closeDate),
    debtRub,
    limitRub,
    overduePrincipal: Math.random() > 0.8 ? randomInt(0, Math.floor(debtRub * 0.1)) : 0,
    overdueInterest: Math.random() > 0.9 ? randomInt(0, Math.floor(debtRub * 0.05)) : 0,
    collateralReference: 500000000 + index,
    collateralContractNumber,
    collateralContractDate: formatDate(valuationDate),
    collateralCategory: getCollateralCategory(propertyType),
    collateralValue,
    marketValue,
    initialValuationDate: formatDate(valuationDate),
    currentMarketValue: marketValue + randomInt(-100000, 100000),
    currentValuationDate: formatDate(new Date(valuationDate.getTime() + randomInt(30, 365) * 24 * 60 * 60 * 1000)),
    fairValue: Math.random() > 0.5 ? String(marketValue + randomInt(-50000, 50000)) : '-',
    collateralType: randomChoice(collateralTypes),
    collateralPurpose: `залог ${propertyType.toLowerCase()}`,
    collateralInfo: `${propertyType} (${randomInt(1, 10)} ед.)`,
    collateralLocation: `г. ${randomChoice(cities)}, ул. ${randomChoice(streets)}, ${randomInt(1, 200)}`,
    liquidity: randomChoice(liquidityLevels),
    qualityCategory: Math.random() > 0.7 ? randomChoice(['I', 'II', 'III']) : '-',
    registrationDate: Math.random() > 0.5 ? formatDate(new Date(contractDate.getTime() + randomInt(1, 30) * 24 * 60 * 60 * 1000)) : '-',
    priority: randomChoice(priorities),
    monitoringType: randomChoice(monitoringTypes),
    lastMonitoringDate: formatDate(lastMonitoringDate),
    nextMonitoringDate: formatDate(nextMonitoringDate),
    owner: null,
    account9131: `9131281${String(randomInt(1000000000, 9999999999)).padStart(10, '0')}`,
  };
};

const generateAllContracts = () => {
  const allContracts = [];
  let globalIndex = 1;
  const usedOrganizations = new Map();
  
  propertyTypes.forEach(propertyType => {
    const contractsPerType = randomInt(5, 10);
    
    for (let i = 0; i < contractsPerType; i++) {
      const orgKey = `${propertyType}-${Math.floor(i / 5)}`;
      
      let borrower, borrowerInn, pledger, pledgerInn;
      
      if (usedOrganizations.has(orgKey)) {
        const org = usedOrganizations.get(orgKey);
        borrower = org.borrower;
        borrowerInn = org.borrowerInn;
        pledger = org.pledger;
        pledgerInn = org.pledgerInn;
      } else {
        borrower = randomChoice(organizations);
        borrowerInn = generateInn();
        pledger = randomChoice(organizations.filter(org => org !== borrower));
        pledgerInn = generateInn();
        usedOrganizations.set(orgKey, { borrower, borrowerInn, pledger, pledgerInn });
      }
      
      const contract = generateContract(propertyType, globalIndex, borrower, borrowerInn, pledger, pledgerInn);
      allContracts.push(contract);
      globalIndex++;
    }
  });
  
  return allContracts;
};

// Генерация и сохранение
const contracts = generateAllContracts();
const outputPath = path.join(__dirname, '..', 'public', 'portfolioData.json');

// Сохраняем существующие договоры, если они есть, и добавляем новые
let existingContracts = [];
if (fs.existsSync(outputPath)) {
  try {
    const existingData = fs.readFileSync(outputPath, 'utf8');
    existingContracts = JSON.parse(existingData);
    if (!Array.isArray(existingContracts)) {
      existingContracts = [];
    }
  } catch (error) {
    console.warn('Не удалось прочитать существующий portfolioData.json, создаем новый');
  }
}

// Объединяем существующие и новые договоры, избегая дубликатов по reference
const existingReferences = new Set(existingContracts.map(c => c.reference));
const newContracts = contracts.filter(c => !existingReferences.has(c.reference));
const allContracts = [...existingContracts, ...newContracts];

fs.writeFileSync(outputPath, JSON.stringify(allContracts, null, 2), 'utf8');
console.log(`✅ Сгенерировано ${newContracts.length} новых договоров`);
console.log(`📊 Всего договоров в portfolioData.json: ${allContracts.length}`);
console.log(`📁 Файл сохранен: ${outputPath}`);

