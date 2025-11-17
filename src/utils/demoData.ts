import type { ExtendedCollateralCard, Partner } from '@/types';
import { generateId } from './helpers';

// Демо-данные для быстрого тестирования

export const demoPartners: Partner[] = [
  {
    id: generateId(),
    type: 'individual',
    role: 'owner',
    lastName: 'Иванов',
    firstName: 'Иван',
    middleName: 'Иванович',
    inn: '771234567890',
    share: 100,
    showInRegistry: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    type: 'legal',
    role: 'pledgor',
    organizationName: 'ООО "Рога и Копыта"',
    inn: '7712345678',
    share: 100,
    showInRegistry: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const demoExtendedCards: ExtendedCollateralCard[] = [
  // 1. Квартира
  {
    id: generateId(),
    number: 'КО-2024-001',
    name: '3-комнатная квартира на ул. Ленина',
    mainCategory: 'real_estate',
    classification: {
      level0: 'Жилая недвижимость',
      level1: 'Квартира',
      level2: 'Помещение',
    },
    cbCode: 2010,
    status: 'approved',
    partners: [
      {
        id: generateId(),
        type: 'individual',
        role: 'owner',
        lastName: 'Петров',
        firstName: 'Петр',
        middleName: 'Петрович',
        inn: '771234567891',
        share: 100,
        showInRegistry: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    address: {
      id: generateId(),
      region: 'Московская область',
      city: 'Москва',
      street: 'ул. Ленина',
      house: '15',
      building: '2',
      apartment: '45',
      postalCode: '123456',
      fullAddress: 'Московская область, Москва, ул. Ленина, д. 15, к. 2, кв. 45',
      cadastralNumber: '77:01:0001001:1234',
    },
    characteristics: {
      totalAreaSqm: 75.5,
      livingArea: 50.2,
      kitchenArea: 12.3,
      floor: 5,
      totalFloors: 9,
      roomsCount: 3,
      separateBathrooms: 1,
      balcony: true,
      collateralCondition: 'хорошее',
      ceilingHeight: 2.7,
      buildYear: 2015,
      wallMaterial: 'Монолит/Монолит-кирпич',
      marketValue: 8500000,
      collateralValue: 6800000,
      fairValue: 7650000,
    },
    documents: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },

  // 2. Офисное помещение
  {
    id: generateId(),
    number: 'КО-2024-002',
    name: 'Офис в бизнес-центре "Москва-Сити"',
    mainCategory: 'real_estate',
    classification: {
      level0: 'Коммерческая недвижимость',
      level1: 'Офисные помещения',
      level2: 'Помещение',
    },
    cbCode: 1010,
    status: 'editing',
    partners: [
      {
        id: generateId(),
        type: 'legal',
        role: 'owner',
        organizationName: 'ООО "Бизнес Групп"',
        inn: '7712345679',
        share: 100,
        showInRegistry: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    address: {
      id: generateId(),
      region: 'г. Москва',
      city: 'Москва',
      street: 'Пресненская наб.',
      house: '12',
      apartment: '2001',
      postalCode: '123100',
      fullAddress: 'г. Москва, Москва, Пресненская наб., д. 12, кв. 2001',
      cadastralNumber: '77:01:0002001:5678',
    },
    characteristics: {
      totalAreaSqm: 120.5,
      floor: 20,
      totalFloors: 30,
      buildingClass: 'A',
      planning: 'Открытая',
      finishing: 'Чистовая',
      ceilingHeight: 3.2,
      parking: true,
      parkingSpaces: 5,
      buildYear: 2018,
      wallMaterial: 'Монолит',
      ceilingMaterial: 'Железобетонные плиты',
      structuralCondition: 'Хорошее',
      finishLevel: 'Чистовая',
      finishCondition: 'Хорошее',
      hasElectricity: true,
      hasWaterSupply: true,
      hasSewerage: true,
      hasGasSupply: true,
      hasSecurityAlarm: true,
      hasFireAlarm: true,
      hasVideoSurveillance: true,
      replanning: 'Перепланировки не выявлены',
      ownershipRight: 'Право собственности',
      ownershipShare: '1/1',
      isUnfinishedConstruction: false,
      ownershipBasis: 'Право собственности, на основании следующих документов: Договор купли-продажи',
      technicalDocument: 'Выписка из Единого государственного реестра недвижимости об объекте',
      hasEncumbrances: false,
      bookValue: 15000000,
    },
    documents: [],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-15'),
  },

  // 3. Складское помещение
  {
    id: generateId(),
    number: 'КО-2024-003',
    name: 'Складской комплекс класса А',
    mainCategory: 'real_estate',
    classification: {
      level0: 'Коммерческая недвижимость',
      level1: 'Склады',
      level2: 'Здание',
    },
    cbCode: 1031,
    status: 'approved',
    partners: [
      {
        id: generateId(),
        type: 'legal',
        role: 'owner',
        organizationName: 'ООО "Логистика+"',
        inn: '7712345680',
        share: 100,
        showInRegistry: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    address: {
      id: generateId(),
      region: 'Московская область',
      district: 'Подольский район',
      settlement: 'пос. Индустриальный',
      street: 'ул. Складская',
      house: '5',
      postalCode: '142100',
      fullAddress: 'Московская область, Подольский район, пос. Индустриальный, ул. Складская, д. 5',
      cadastralNumber: '50:21:0030001:9876',
    },
    characteristics: {
      totalAreaSqm: 5000,
      storageArea: 4500,
      ceilingHeight: 12,
      totalFloors: 1,
      warehouseClass: 'A',
      gates: 'Докового типа',
      gatesCount: 10,
      flooring: 'Полимер',
      loadCapacity: 5,
      heating: true,
      ramp: true,
      buildYear: 2015,
      wallMaterial: 'Железобетон',
      ceilingMaterial: 'Железобетонные плиты',
      structuralCondition: 'Хорошее',
      finishLevel: 'Без отделки',
      finishCondition: 'Удовлетворительное',
      hasElectricity: true,
      hasWaterSupply: true,
      hasSewerage: true,
      hasGasSupply: false,
      hasSecurityAlarm: true,
      hasFireAlarm: true,
      hasVideoSurveillance: true,
      replanning: 'Перепланировки не выявлены',
      ownershipRight: 'Право собственности',
      ownershipShare: '1/1',
      isUnfinishedConstruction: false,
      ownershipBasis: 'Право собственности, на основании следующих документов: Договор купли-продажи',
      technicalDocument: 'Выписка из Единого государственного реестра недвижимости об объекте',
      hasEncumbrances: false,
      bookValue: 75000000,
    },
    documents: [],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },

  // 4. Легковой автомобиль
  {
    id: generateId(),
    number: 'КО-2024-004',
    name: 'Toyota Camry XV70',
    mainCategory: 'movable',
    classification: {
      level0: 'Движимое имущество',
      level1: 'Легковые автомобили',
      level2: 'Автомобиль',
    },
    cbCode: 4010,
    status: 'approved',
    partners: [
      {
        id: generateId(),
        type: 'individual',
        role: 'owner',
        lastName: 'Сидоров',
        firstName: 'Сидор',
        middleName: 'Сидорович',
        inn: '771234567892',
        share: 100,
        showInRegistry: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    address: undefined,
    characteristics: {
      brand: 'Toyota',
      model: 'Camry XV70',
      year: 2020,
      vin: 'JTMAB3FV20D123456',
      engineVolume: 2.5,
      enginePower: 181,
      fuelType: 'Бензин',
      transmission: 'Автоматическая',
      mileage: 45000,
      color: 'Серебристый',
      condition: 'Отличное',
      marketValue: 2500000,
      collateralValue: 2000000,
      fairValue: 2250000,
    },
    documents: [],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
  },

  // 5. Жилой дом
  {
    id: generateId(),
    number: 'КО-2024-005',
    name: 'Жилой дом с участком в пос. Зеленый',
    mainCategory: 'real_estate',
    classification: {
      level0: 'Жилая недвижимость',
      level1: 'Жилой дом',
      level2: 'Здание',
    },
    cbCode: 2020,
    status: 'editing',
    partners: [
      {
        id: generateId(),
        type: 'individual',
        role: 'owner',
        lastName: 'Федоров',
        firstName: 'Федор',
        middleName: 'Федорович',
        inn: '771234567893',
        share: 50,
        showInRegistry: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: generateId(),
        type: 'individual',
        role: 'owner',
        lastName: 'Федорова',
        firstName: 'Мария',
        middleName: 'Ивановна',
        inn: '771234567894',
        share: 50,
        showInRegistry: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    address: {
      id: generateId(),
      region: 'Московская область',
      district: 'Истринский район',
      settlement: 'пос. Зеленый',
      street: 'ул. Цветочная',
      house: '7',
      postalCode: '143500',
      fullAddress: 'Московская область, Истринский район, пос. Зеленый, ул. Цветочная, д. 7',
      cadastralNumber: '50:10:0040001:2468',
    },
    characteristics: {
      totalAreaSqm: 250,
      livingArea: 180,
      landAreaHectares: 0.15,
      floors: 2,
      roomsCount: 5,
      separateBathrooms: 2,
      buildYear: 2019,
      wallMaterial: 'Пенобетонные/Газобетонное блоки',
      collateralCondition: 'хорошее',
      utilities: 'Все',
      heating: 'Газовое',
      landCadastralNumber: '50:10:0040001:2468',
      landCategory: 'Земли населенных пунктов',
      marketValue: 25000000,
      collateralValue: 20000000,
      fairValue: 22500000,
    },
    documents: [],
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-25'),
  },
];

// Функция загрузки демо-данных
export const loadDemoData = async (storageService: any): Promise<void> => {
  try {
    console.log('Loading demo data...');
    
    // Загружаем базовые демо-карточки
    for (const card of demoExtendedCards) {
      await storageService.saveExtendedCard(card);
    }
    
    // Загружаем дополнительные объекты из registryObjects.json
    try {
      const base = import.meta.env.BASE_URL ?? '/';
      const resolvedBase = new URL(base, window.location.origin);
      const normalizedPath = resolvedBase.pathname.endsWith('/')
        ? resolvedBase.pathname
        : `${resolvedBase.pathname}/`;
      const url = `${resolvedBase.origin}${normalizedPath}registryObjects.json?v=${Date.now()}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        const additionalObjects = await response.json();
        for (const obj of additionalObjects) {
          // Преобразуем даты из строк в Date объекты
          if (typeof obj.createdAt === 'string') {
            obj.createdAt = new Date(obj.createdAt);
          }
          if (typeof obj.updatedAt === 'string') {
            obj.updatedAt = new Date(obj.updatedAt);
          }
          // Преобразуем даты в партнерах
          if (obj.partners) {
            obj.partners = obj.partners.map((p: any) => ({
              ...p,
              createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
              updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            }));
          }
          await storageService.saveExtendedCard(obj);
        }
        console.log(`Loaded ${additionalObjects.length} additional objects from registryObjects.json`);
      }
    } catch (error) {
      console.warn('Failed to load additional registry objects:', error);
    }
    
    console.log(`Loaded ${demoExtendedCards.length} demo cards successfully`);
  } catch (error) {
    console.error('Failed to load demo data:', error);
    throw error;
  }
};

// Проверка наличия демо-данных
export const hasDemoData = async (storageService: any): Promise<boolean> => {
  try {
    const cards = await storageService.getExtendedCards();
    return cards.length > 0;
  } catch (error) {
    return false;
  }
};

