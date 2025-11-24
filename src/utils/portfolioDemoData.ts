/**
 * Генерация демо-договоров для портфеля
 * Создает договоры для всех типов имущества из справочника атрибутов залога
 */

import type { CollateralPortfolioEntry } from '@/types/portfolio';
import { getPropertyTypes } from './collateralAttributesFromDict';

// Генераторы случайных данных
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Списки для генерации
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

const generateInn = (): number => {
  return randomInt(1000000000, 9999999999);
};

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

/**
 * Определить категорию залога на основе типа имущества
 */
const getCollateralCategory = (propertyType: string): string => {
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

/**
 * Генерация договора для типа имущества
 */
const generateContractForPropertyType = (
  propertyType: string,
  index: number,
  borrower: string,
  _borrowerInn: number,
  pledger: string,
  pledgerInn: number
): CollateralPortfolioEntry => {
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
  
  // LTV должен быть >= 70%, значит: debt / marketValue >= 0.7
  // marketValue <= debt / 0.7
  // Устанавливаем рыночную стоимость так, чтобы LTV был в диапазоне 70-80%
  const minMarketValueForLTV = Math.ceil(debtRub / 0.8); // Минимальная для LTV = 80% (максимум)
  const maxMarketValueForLTV = Math.ceil(debtRub / 0.7); // Максимальная для LTV = 70% (минимум)
  const marketValue = randomInt(
    Math.max(minMarketValueForLTV, 500000), 
    Math.max(maxMarketValueForLTV, limitRub)
  );
  
  // Залоговая стоимость рассчитывается от рыночной с дисконтом 75%
  const collateralValue = Math.floor(marketValue * 0.75);
  
  const valuationDate = new Date(contractDate);
  valuationDate.setDate(valuationDate.getDate() + randomInt(1, 30));
  
  const lastMonitoringDate = new Date();
  lastMonitoringDate.setDate(lastMonitoringDate.getDate() - randomInt(0, 180));
  
  const nextMonitoringDate = new Date(lastMonitoringDate);
  nextMonitoringDate.setMonth(nextMonitoringDate.getMonth() + randomInt(3, 12));
  
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
    collateralLocation: `г. ${randomChoice(['Москва', 'Санкт-Петербург', 'Краснодар', 'Екатеринбург', 'Ростов-на-Дону'])}, ул. ${randomChoice(['Ленина', 'Пушкина', 'Гагарина', 'Мира', 'Советская'])}, ${randomInt(1, 200)}`,
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

/**
 * Генерация всех демо-договоров для всех типов имущества
 */
export const generateAllPortfolioDemoContracts = (): CollateralPortfolioEntry[] => {
  const propertyTypes = getPropertyTypes();
  const allContracts: CollateralPortfolioEntry[] = [];
  let globalIndex = 1;
  
  // Создаем пул организаций для обеспечения согласованности
  const usedOrganizations = new Map<string, { borrower: string; borrowerInn: number; pledger: string; pledgerInn: number }>();
  
  propertyTypes.forEach(propertyType => {
    // Для каждого типа имущества создаем несколько договоров (по 5-10 на тип)
    const contractsPerType = randomInt(5, 10);
    
    for (let i = 0; i < contractsPerType; i++) {
      // Используем одну и ту же пару заемщик/залогодатель для нескольких карточек одного типа
      const orgKey = `${propertyType}-${Math.floor(i / 5)}`;
      
      let borrower: string;
      let borrowerInn: number;
      let pledger: string;
      let pledgerInn: number;
      
      if (usedOrganizations.has(orgKey)) {
        const org = usedOrganizations.get(orgKey)!;
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
      
      const contract = generateContractForPropertyType(
        propertyType,
        globalIndex,
        borrower,
        borrowerInn,
        pledger,
        pledgerInn
      );
      
      allContracts.push(contract);
      globalIndex++;
    }
  });
  
  return allContracts;
};

/**
 * Получить договоры для конкретного типа имущества
 */
export const getContractsForPropertyType = (
  contracts: CollateralPortfolioEntry[],
  propertyType: string
): CollateralPortfolioEntry[] => {
  const category = getCollateralCategory(propertyType);
  return contracts.filter(contract => 
    contract.collateralCategory === category ||
    contract.collateralPurpose?.toLowerCase().includes(propertyType.toLowerCase())
  );
};

/**
 * Найти договор по заемщику и залогодателю
 */
export const findContractByParties = (
  contracts: CollateralPortfolioEntry[],
  borrowerName: string,
  pledgerName: string,
  inn?: string | number
): CollateralPortfolioEntry | undefined => {
  return contracts.find(contract => {
    const borrowerMatch = contract.borrower?.toLowerCase() === borrowerName.toLowerCase();
    const pledgerMatch = contract.pledger?.toLowerCase() === pledgerName.toLowerCase();
    const innMatch = inn ? contract.inn?.toString() === inn.toString() : true;
    
    return borrowerMatch && pledgerMatch && innMatch;
  });
};

