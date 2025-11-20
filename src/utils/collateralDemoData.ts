/**
 * Генерация демо-данных для карточек обеспечения
 * 50 карточек на каждый тип имущества из справочника атрибутов залога
 */

import type { ExtendedCollateralCard, Partner, Address } from '@/types';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import { generateId } from './helpers';
import { getPropertyTypes, getAttributesForPropertyType } from './collateralAttributesFromDict';
import { generateAllPortfolioDemoContracts, getContractsForPropertyType } from './portfolioDemoData';

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
    case 'date':
      const date = new Date();
      date.setDate(date.getDate() - randomInt(0, 365));
      return date.toISOString().split('T')[0];
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
 */
const generateCharacteristics = (propertyType: string, index: number): Record<string, any> => {
  const attributes = getAttributesForPropertyType(propertyType);
  const characteristics: Record<string, any> = {};
  
  attributes.forEach(attr => {
    characteristics[attr.code] = generateAttributeValue(attr, index);
  });
  
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
    const characteristics = generateCharacteristics(propertyType, i);
    
    // Добавляем обязательные поля
    if (!characteristics.NAME_OF_PROPERTY) {
      characteristics.NAME_OF_PROPERTY = `${propertyType} #${i + 1}`;
    }
    if (!characteristics.OWNER_TIN) {
      characteristics.OWNER_TIN = pledgor.inn;
    }
    
    // Используем данные из договора, если он есть
    const marketValue = contract?.currentMarketValue 
      ? (typeof contract.currentMarketValue === 'number' ? contract.currentMarketValue : parseInt(String(contract.currentMarketValue)))
      : (characteristics.marketValue || randomInt(1000000, 10000000));
    
    const pledgeValue = contract?.collateralValue
      ? (typeof contract.collateralValue === 'number' ? contract.collateralValue : parseInt(String(contract.collateralValue)))
      : (characteristics.pledgeValue || randomInt(800000, 8000000));
    
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

