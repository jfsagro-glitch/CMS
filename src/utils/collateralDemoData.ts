/**
 * Генерация демо-данных для карточек обеспечения
 * 50 карточек на каждый тип имущества из справочника атрибутов залога
 */

import type { ExtendedCollateralCard, Partner, Address } from '@/types';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import { generateId } from './helpers';
import { getPropertyTypes, getAttributesForPropertyType } from './collateralAttributesFromDict';
import { generateAllPortfolioDemoContracts, getContractsForPropertyType } from './portfolioDemoData';
import { getAttributeGroupForPropertyType } from './propertyTypeToAttributeGroup';

// Генераторы случайных данных
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Списки для генерации
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
];

const surnames = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Лебедев', 'Козлов', 'Новиков'];
const firstNames = ['Иван', 'Петр', 'Сергей', 'Александр', 'Дмитрий', 'Андрей', 'Михаил', 'Николай', 'Владимир', 'Алексей'];
const middleNames = ['Иванович', 'Петрович', 'Сергеевич', 'Александрович', 'Дмитриевич', 'Андреевич', 'Михайлович', 'Николаевич', 'Владимирович', 'Алексеевич'];

const regions = ['Московская область', 'Ленинградская область', 'Краснодарский край', 'Свердловская область', 'Ростовская область'];
const cities = ['Москва', 'Санкт-Петербург', 'Краснодар', 'Екатеринбург', 'Ростов-на-Дону'];

const generateInn = (isLegal: boolean = true): string => {
  if (isLegal) {
    return `${randomInt(1000000000, 9999999999)}`;
  }
  return `${randomInt(100000000000, 999999999999)}`;
};

const generateAddress = (): Address => {
  const region = randomChoice(regions);
  const city = randomChoice(cities);
  const street = `ул. ${randomChoice(['Ленина', 'Пушкина', 'Гагарина', 'Мира', 'Советская'])}`;
  const house = randomInt(1, 200).toString();
  const building = randomInt(1, 10) > 5 ? randomInt(1, 5).toString() : undefined;
  const apartment = randomInt(1, 200).toString();
  
  return {
    id: generateId(),
    region,
    city,
    street,
    house,
    building,
    apartment,
    postalCode: `${randomInt(100000, 999999)}`,
    fullAddress: `${region}, ${city}, ${street}, д. ${house}${building ? `, к. ${building}` : ''}, кв. ${apartment}`,
  };
};

const generatePartner = (role: 'owner' | 'pledgor', isIndividual: boolean = false): Partner => {
  if (isIndividual) {
    const lastName = randomChoice(surnames);
    const firstName = randomChoice(firstNames);
    const middleName = randomChoice(middleNames);
    return {
      id: generateId(),
      type: 'individual',
      role,
      lastName,
      firstName,
      middleName,
      inn: generateInn(false),
      share: 100,
      showInRegistry: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } else {
    return {
      id: generateId(),
      type: 'legal',
      role,
      organizationName: randomChoice(organizations),
      inn: generateInn(true),
      share: 100,
      showInRegistry: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};

/**
 * Генерация значения атрибута по его типу
 */
const generateAttributeValue = (attr: any, index: number): any => {
  switch (attr.type) {
    case 'number':
      if (attr.code === 'QUANTITY' || attr.code.includes('COUNT')) {
        return randomInt(1, 100);
      }
      if (attr.code === 'WEIGHT') {
        return randomInt(100, 10000);
      }
      if (attr.code.includes('SUM') || attr.code.includes('VALUE') || attr.code.includes('AMOUNT')) {
        return randomInt(100000, 10000000);
      }
      return randomInt(1, 1000);
    case 'boolean':
      return Math.random() > 0.5;
    case 'date': {
      const date = new Date();
      date.setDate(date.getDate() - randomInt(0, 365));
      return date.toISOString().split('T')[0];
    }
    case 'string':
    default:
      if (attr.code === 'OWNER_TIN') {
        return generateInn(Math.random() > 0.5);
      }
      if (attr.code === 'NAME_OF_PROPERTY') {
        return `Объект ${attr.group} #${index + 1}`;
      }
      if (attr.code === 'ADDRESS_BASE') {
        const addr = generateAddress();
        return addr.fullAddress;
      }
      if (attr.code.includes('NUMBER') || attr.code.includes('CODE')) {
        return `${randomInt(100000, 999999)}`;
      }
      return `Значение ${attr.name} #${index + 1}`;
  }
};

/**
 * Генерация характеристик для типа имущества
 * Использует маппинг типов имущества к группам атрибутов из справочника
 */
const generateCharacteristics = (
  propertyType: string, 
  index: number,
  contract?: CollateralPortfolioEntry
): Record<string, any> => {
  // Получаем группу атрибутов для типа имущества
  const attributeGroup = getAttributeGroupForPropertyType(propertyType);
  
  // Получаем атрибуты для этой группы
  const attributes = attributeGroup ? getAttributesForPropertyType(attributeGroup) : [];
  
  // Если не нашли по группе, пробуем по самому типу имущества
  const fallbackAttributes = attributes.length === 0 ? getAttributesForPropertyType(propertyType) : [];
  const allAttributes = attributes.length > 0 ? attributes : fallbackAttributes;
  
  const characteristics: Record<string, any> = {};
  
  // Генерируем значения для всех атрибутов
  allAttributes.forEach(attr => {
    characteristics[attr.code] = generateAttributeValue(attr, index);
  });
  
  // Добавляем данные из договора в характеристики
  if (contract) {
    // Данные о договоре
    if (contract.reference) {
      characteristics.CONTRACT_REFERENCE = String(contract.reference);
    }
    if (contract.contractNumber) {
      characteristics.CONTRACT_NUMBER = contract.contractNumber;
    }
    if (contract.contractDate) {
      characteristics.CONTRACT_DATE = contract.contractDate;
    }
    if (contract.collateralContractNumber) {
      characteristics.COLLATERAL_CONTRACT_NUMBER = contract.collateralContractNumber;
    }
    if (contract.collateralContractDate) {
      characteristics.COLLATERAL_CONTRACT_DATE = contract.collateralContractDate;
    }
    
    // Финансовые данные
    if (contract.limitRub) {
      characteristics.CREDIT_LIMIT = typeof contract.limitRub === 'number' ? contract.limitRub : parseFloat(String(contract.limitRub));
    }
    if (contract.debtRub) {
      characteristics.CURRENT_DEBT = typeof contract.debtRub === 'number' ? contract.debtRub : parseFloat(String(contract.debtRub));
    }
    if (contract.currentMarketValue) {
      characteristics.MARKET_VALUE = typeof contract.currentMarketValue === 'number' ? contract.currentMarketValue : parseFloat(String(contract.currentMarketValue));
    }
    if (contract.collateralValue) {
      characteristics.COLLATERAL_VALUE = typeof contract.collateralValue === 'number' ? contract.collateralValue : parseFloat(String(contract.collateralValue));
    }
    
    // Данные о залоге
    if (contract.collateralCategory) {
      characteristics.COLLATERAL_CATEGORY = contract.collateralCategory;
    }
    if (contract.collateralType) {
      characteristics.COLLATERAL_TYPE = contract.collateralType;
    }
    if (contract.collateralPurpose) {
      characteristics.COLLATERAL_PURPOSE = contract.collateralPurpose;
    }
    if (contract.collateralInfo) {
      characteristics.COLLATERAL_INFO = contract.collateralInfo;
    }
    if (contract.collateralLocation) {
      characteristics.COLLATERAL_LOCATION = contract.collateralLocation;
    }
    if (contract.liquidity) {
      characteristics.LIQUIDITY = contract.liquidity;
    }
    if (contract.priority) {
      characteristics.PRIORITY = contract.priority;
    }
    if (contract.monitoringType) {
      characteristics.MONITORING_TYPE = contract.monitoringType;
    }
    if (contract.lastMonitoringDate) {
      characteristics.LAST_MONITORING_DATE = contract.lastMonitoringDate;
    }
    if (contract.nextMonitoringDate) {
      characteristics.NEXT_MONITORING_DATE = contract.nextMonitoringDate;
    }
    if (contract.initialValuationDate) {
      characteristics.INITIAL_VALUATION_DATE = contract.initialValuationDate;
    }
    if (contract.currentValuationDate) {
      characteristics.CURRENT_VALUATION_DATE = contract.currentValuationDate;
    }
    
    // Данные о заемщике и залогодателе
    if (contract.borrower) {
      characteristics.BORROWER_NAME = contract.borrower;
    }
    if (contract.pledger) {
      characteristics.PLEDGER_NAME = contract.pledger;
    }
    if (contract.inn) {
      characteristics.BORROWER_INN = String(contract.inn);
      characteristics.PLEDGER_INN = String(contract.inn);
    }
  }
  
  return characteristics;
};

/**
 * Генерация карточек для типа имущества с привязкой к договорам
 */
const generateCardsForPropertyType = (
  propertyType: string,
  count: number = 50,
  contracts: CollateralPortfolioEntry[]
): ExtendedCollateralCard[] => {
  const cards: ExtendedCollateralCard[] = [];
  
  // Получаем договоры для этого типа имущества
  const availableContracts = getContractsForPropertyType(contracts, propertyType);
  
  // Определяем основную категорию на основе типа имущества
  let mainCategory: 'real_estate' | 'movable' | 'property_rights' = 'property_rights';
  if (propertyType.includes('недвижимость') || propertyType.includes('здание') || propertyType.includes('помещение')) {
    mainCategory = 'real_estate';
  } else if (propertyType.includes('транспорт') || propertyType.includes('автомобиль') || propertyType.includes('оборудование')) {
    mainCategory = 'movable';
  }
  
  // Определяем классификацию для недвижимости
  const getClassification = () => {
    if (mainCategory === 'real_estate') {
      return {
        level0: 'Жилая недвижимость',
        level1: 'Квартира',
        level2: 'Помещение',
      };
    } else if (mainCategory === 'movable') {
      return {
        level0: 'Движимое имущество',
        level1: 'Легковой автомобиль',
        level2: 'Помещение',
      };
    }
    return {
      level0: 'Имущественные права',
      level1: 'Права требования',
      level2: 'Помещение',
    };
  };
  
  for (let i = 0; i < count; i++) {
    // Выбираем договор (распределяем карточки по договорам)
    let contract: CollateralPortfolioEntry | undefined;
    if (availableContracts.length > 0) {
      const contractIdx = i % availableContracts.length;
      contract = availableContracts[contractIdx];
    }
    
    // Если есть договор, используем его данные для заемщика и залогодателя
    let borrower: Partner;
    let pledgor: Partner;
    
    if (contract) {
      // Создаем заемщика из договора
      borrower = {
        id: generateId(),
        type: 'legal',
        role: 'owner',
        organizationName: contract.borrower || 'ООО "Заемщик"',
        inn: String(contract.inn || generateInn(true)),
        share: 100,
        showInRegistry: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Создаем залогодателя из договора
      pledgor = {
        id: generateId(),
        type: 'legal',
        role: 'pledgor',
        organizationName: contract.pledger || 'ООО "Залогодатель"',
        inn: String(contract.inn || generateInn(true)),
        share: 100,
        showInRegistry: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      // Если договора нет, генерируем случайных партнеров
      borrower = generatePartner('owner', Math.random() > 0.5);
      pledgor = generatePartner('pledgor', Math.random() > 0.5);
    }
    
    const address = generateAddress();
    const characteristics = generateCharacteristics(propertyType, i, contract);
    
    // Добавляем обязательные поля
    if (!characteristics.NAME_OF_PROPERTY) {
      characteristics.NAME_OF_PROPERTY = `${propertyType} #${i + 1}`;
    }
    if (!characteristics.OWNER_TIN) {
      characteristics.OWNER_TIN = pledgor.inn;
    }
    
    // Обновляем данные из договора, если они есть в характеристиках
    if (contract && characteristics.BORROWER_NAME) {
      borrower.organizationName = characteristics.BORROWER_NAME;
    }
    if (contract && characteristics.PLEDGER_NAME) {
      pledgor.organizationName = characteristics.PLEDGER_NAME;
    }
    if (contract && characteristics.BORROWER_INN) {
      borrower.inn = characteristics.BORROWER_INN;
    }
    if (contract && characteristics.PLEDGER_INN) {
      pledgor.inn = characteristics.PLEDGER_INN;
    }
    
    // Используем данные из договора, если он есть
    const marketValue = contract?.currentMarketValue 
      ? (typeof contract.currentMarketValue === 'number' ? contract.currentMarketValue : parseInt(String(contract.currentMarketValue)))
      : (characteristics.marketValue || randomInt(1000000, 10000000));
    
    const pledgeValue = contract?.collateralValue
      ? (typeof contract.collateralValue === 'number' ? contract.collateralValue : parseInt(String(contract.collateralValue)))
      : (characteristics.pledgeValue || randomInt(800000, 8000000));
    
    // Генерация дат оценки (актуальные относительно текущей даты)
    const now = new Date();
    const lastEvaluationDate = new Date(now);
    lastEvaluationDate.setDate(lastEvaluationDate.getDate() - randomInt(30, 365)); // От 30 дней до года назад
    
    // Периодичность переоценки зависит от типа имущества (обычно 12 месяцев)
    const evaluationFrequencyMonths = mainCategory === 'real_estate' ? 12 : 6;
    const nextEvaluationDate = new Date(lastEvaluationDate);
    nextEvaluationDate.setMonth(nextEvaluationDate.getMonth() + evaluationFrequencyMonths);
    // Делаем дату не намного позднее установленных сроков (в пределах 1-2 месяцев от текущей даты)
    const daysUntilNextEvaluation = Math.floor((nextEvaluationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilNextEvaluation > 60) {
      // Если дата слишком далеко, сдвигаем её ближе (но не в прошлое)
      nextEvaluationDate.setDate(now.getDate() + randomInt(1, 60));
    }
    
    // Генерация дат мониторинга (актуальные относительно текущей даты)
    const lastMonitoringDate = new Date(now);
    lastMonitoringDate.setDate(lastMonitoringDate.getDate() - randomInt(0, 180)); // От сегодня до 6 месяцев назад
    
    // Периодичность мониторинга зависит от типа имущества
    // Недвижимость - 12 месяцев, транспорт без страхования - 6 месяцев, товары - 3 месяца
    let monitoringFrequencyMonths = 12;
    if (mainCategory === 'movable') {
      monitoringFrequencyMonths = 6;
    } else if (propertyType.includes('товар') || propertyType.includes('сырье')) {
      monitoringFrequencyMonths = 3;
    }
    
    const nextMonitoringDate = new Date(lastMonitoringDate);
    nextMonitoringDate.setMonth(nextMonitoringDate.getMonth() + monitoringFrequencyMonths);
    // Делаем дату не намного позднее установленных сроков (в пределах 1-2 месяцев от текущей даты)
    const daysUntilNextMonitoring = Math.floor((nextMonitoringDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilNextMonitoring > 60) {
      // Если дата слишком далеко, сдвигаем её ближе (но не в прошлое)
      nextMonitoringDate.setDate(now.getDate() + randomInt(1, 60));
    }
    
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };
    
    const card: ExtendedCollateralCard = {
      id: generateId(),
      number: `КО-2024-${String(i + 1).padStart(4, '0')}`, // Будет перезаписано в generateAllCollateralDemoCards
      name: characteristics.NAME_OF_PROPERTY || `${propertyType} #${i + 1}`,
      mainCategory,
      classification: getClassification(),
      cbCode: mainCategory === 'real_estate' ? 2010 : mainCategory === 'movable' ? 3010 : 4010,
      status: randomChoice(['editing', 'approved']),
      partners: [borrower, pledgor],
      address,
      characteristics,
      documents: [],
      propertyType,
      marketValue,
      pledgeValue,
      evaluationDate: formatDate(lastEvaluationDate),
      lastEvaluationDate: formatDate(lastEvaluationDate),
      nextEvaluationDate: formatDate(nextEvaluationDate),
      monitoringDate: formatDate(lastMonitoringDate),
      nextMonitoringDate: formatDate(nextMonitoringDate),
      monitoringFrequencyMonths,
      reference: contract?.reference ? String(contract.reference) : `REF-${randomInt(10000, 99999)}`,
      contractNumber: contract?.contractNumber || `ДОГ-${randomInt(1000, 9999)}/${randomInt(2020, 2024)}`,
      contractId: contract?.contractNumber || undefined,
      createdAt: new Date(2024, 0, 1 + i),
      updatedAt: new Date(2024, 0, 1 + i),
    };
    
    cards.push(card);
  }
  
  return cards;
};

/**
 * Генерация всех демо-карточек с привязкой к договорам
 */
export const generateAllCollateralDemoCards = async (): Promise<ExtendedCollateralCard[]> => {
  const propertyTypes = getPropertyTypes();
  const allCards: ExtendedCollateralCard[] = [];
  let globalIndex = 1;
  
  // Пытаемся загрузить договоры из portfolioData.json
  let contracts: CollateralPortfolioEntry[] = [];
  try {
    const base = import.meta.env.BASE_URL ?? '/';
    const resolvedBase = new URL(base, window.location.origin);
    const normalizedPath = resolvedBase.pathname.endsWith('/')
      ? resolvedBase.pathname
      : `${resolvedBase.pathname}/`;
    const url = `${resolvedBase.origin}${normalizedPath}portfolioData.json?v=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok) {
      contracts = await response.json() as CollateralPortfolioEntry[];
    }
  } catch (error) {
    console.warn('Не удалось загрузить договоры из portfolioData.json, используем сгенерированные', error);
  }
  
  // Если не удалось загрузить, генерируем договоры
  if (contracts.length === 0) {
    contracts = generateAllPortfolioDemoContracts();
  }
  
  propertyTypes.forEach(propertyType => {
    const cards = generateCardsForPropertyType(propertyType, 50, contracts);
    // Обновляем номера карточек, чтобы они были уникальными
    cards.forEach((card) => {
      card.number = `КО-2024-${String(globalIndex).padStart(4, '0')}`;
      globalIndex++;
    });
    allCards.push(...cards);
  });
  
  return allCards;
};

/**
 * Получить сгенерированные договоры для сохранения в portfolioData.json
 */
export const getGeneratedContracts = (): CollateralPortfolioEntry[] => {
  return generateAllPortfolioDemoContracts();
};

/**
 * Загрузка демо-карточек в базу данных
 */
export const loadCollateralDemoCards = async (storageService: any): Promise<void> => {
  const cards = await generateAllCollateralDemoCards();
  
  for (const card of cards) {
    try {
      await storageService.saveExtendedCard(card);
    } catch (error) {
      console.error(`Ошибка сохранения карточки ${card.number}:`, error);
    }
  }
  
  console.log(`Загружено ${cards.length} демо-карточек`);
};

