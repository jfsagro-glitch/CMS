import type { ExtendedCollateralCard } from '../types';

// Генератор уникальных ID
const generateId = () => `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Генератор случайных дат
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Генератор адресов
const generateAddress = (region: string) => {
  const streets = ['Ленина', 'Пушкина', 'Гагарина', 'Мира', 'Советская', 'Кирова', 'Первомайская'];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const building = Math.floor(Math.random() * 200) + 1;
  const apartment = Math.floor(Math.random() * 100) + 1;
  
  return {
    fullAddress: `г. ${region}, ул. ${street}, д. ${building}, кв. ${apartment}`,
    postalCode: `${100000 + Math.floor(Math.random() * 99999)}`,
    region,
    city: region,
    street: `ул. ${street}`,
    house: building.toString(),
    apartment: apartment.toString(),
    coordinates: {
      lat: 55.7558 + (Math.random() - 0.5) * 0.1,
      lon: 37.6173 + (Math.random() - 0.5) * 0.1,
    },
  };
};

// Типы недвижимости
const realEstateTypes = [
  { level0: 'Коммерческая недвижимость', level1: 'Офис', level2: 'Помещение' },
  { level0: 'Коммерческая недвижимость', level1: 'Торговое помещение', level2: 'Помещение' },
  { level0: 'Коммерческая недвижимость', level1: 'Склад', level2: 'Помещение' },
  { level0: 'Коммерческая недвижимость', level1: 'Производственное помещение', level2: 'Помещение' },
  { level0: 'Жилая недвижимость', level1: 'Квартира', level2: 'Помещение' },
  { level0: 'Жилая недвижимость', level1: 'Комната', level2: 'Помещение' },
  { level0: 'Жилая недвижимость', level1: 'Дом', level2: 'Здание' },
  { level0: 'Жилая недвижимость', level1: 'Дача', level2: 'Здание' },
  { level0: 'Промышленная недвижимость', level1: 'Цех', level2: 'Помещение' },
  { level0: 'Промышленная недвижимость', level1: 'Ангар', level2: 'Сооружение' },
  { level0: 'Коммерческая недвижимость', level1: 'Парковочное место', level2: 'Помещение' },
];

// Типы движимого имущества
const movableTypes = [
  { level0: 'Транспорт', level1: 'Легковой автомобиль', level2: 'Транспортное средство' },
  { level0: 'Транспорт', level1: 'Грузовой автомобиль', level2: 'Транспортное средство' },
  { level0: 'Транспорт', level1: 'Спецтехника', level2: 'Транспортное средство' },
  { level0: 'Оборудование', level1: 'Производственное оборудование', level2: 'Станок' },
  { level0: 'Оборудование', level1: 'Офисное оборудование', level2: 'Техника' },
  { level0: 'Оборудование', level1: 'Компьютерная техника', level2: 'Техника' },
];

// Типы имущественных прав
const propertyRightsTypes = [
  { level0: 'Ценные бумаги', level1: 'Акции', level2: 'Долевые' },
  { level0: 'Ценные бумаги', level1: 'Облигации', level2: 'Долговые' },
  { level0: 'Права требования', level1: 'Дебиторская задолженность', level2: 'Требование' },
  { level0: 'Интеллектуальная собственность', level1: 'Патент', level2: 'Право' },
  { level0: 'Интеллектуальная собственность', level1: 'Товарный знак', level2: 'Право' },
];

// Генератор характеристик для недвижимости
const generateRealEstateCharacteristics = (type: string) => {
  const area = Math.floor(Math.random() * 500) + 20;
  const characteristics: any = {
    area: area.toString(),
    floor: Math.floor(Math.random() * 20) + 1,
    totalFloors: Math.floor(Math.random() * 25) + 1,
    roomsCount: Math.floor(Math.random() * 5) + 1,
    cadastralNumber: `77:${Math.floor(Math.random() * 99)}:${Math.floor(Math.random() * 999999)}:${Math.floor(Math.random() * 9999)}`,
    buildYear: Math.floor(Math.random() * 50) + 1970,
  };

  if (type === 'Квартира' || type === 'Комната') {
    characteristics.hasBalcony = Math.random() > 0.5;
    characteristics.renovation = ['Без ремонта', 'Косметический', 'Евроремонт', 'Дизайнерский'][Math.floor(Math.random() * 4)];
  }

  if (type === 'Дом' || type === 'Дача') {
    characteristics.landArea = Math.floor(Math.random() * 1000) + 100;
    characteristics.hasGarage = Math.random() > 0.5;
  }

  return characteristics;
};

// Генератор характеристик для транспорта
const generateVehicleCharacteristics = (type: string) => {
  const brands = ['Toyota', 'Mercedes-Benz', 'BMW', 'Volkswagen', 'Ford', 'Hyundai', 'KIA'];
  const brand = brands[Math.floor(Math.random() * brands.length)];
  
  return {
    brand,
    model: `Model-${Math.floor(Math.random() * 100)}`,
    year: Math.floor(Math.random() * 10) + 2014,
    vin: `VIN${Math.random().toString(36).substr(2, 14).toUpperCase()}`,
    mileage: Math.floor(Math.random() * 200000) + 10000,
    color: ['Черный', 'Белый', 'Серебристый', 'Синий', 'Красный'][Math.floor(Math.random() * 5)],
    engineVolume: (Math.random() * 3 + 1).toFixed(1),
    fuelType: ['Бензин', 'Дизель', 'Электро', 'Гибрид'][Math.floor(Math.random() * 4)],
  };
};

// Генератор характеристик для оборудования
const generateEquipmentCharacteristics = (type: string) => {
  return {
    manufacturer: ['Siemens', 'ABB', 'Schneider', 'GE', 'Mitsubishi'][Math.floor(Math.random() * 5)],
    model: `EQ-${Math.floor(Math.random() * 10000)}`,
    serialNumber: `SN${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
    productionYear: Math.floor(Math.random() * 15) + 2009,
    condition: ['Новое', 'Хорошее', 'Удовлетворительное', 'Требует ремонта'][Math.floor(Math.random() * 4)],
    power: `${Math.floor(Math.random() * 100) + 10} кВт`,
  };
};

// Генератор стоимости
const generateValue = (mainCategory: string, type: string) => {
  let baseValue = 1000000;
  
  if (mainCategory === 'real_estate') {
    baseValue = Math.floor(Math.random() * 50000000) + 5000000;
  } else if (mainCategory === 'movable') {
    if (type.includes('автомобиль')) {
      baseValue = Math.floor(Math.random() * 5000000) + 500000;
    } else {
      baseValue = Math.floor(Math.random() * 2000000) + 100000;
    }
  } else {
    baseValue = Math.floor(Math.random() * 10000000) + 1000000;
  }

  return {
    marketValue: baseValue,
    pledgeValue: Math.floor(baseValue * (0.6 + Math.random() * 0.3)),
    evaluationDate: randomDate(new Date(2023, 0, 1), new Date()).toISOString().split('T')[0],
  };
};

// Основная функция генерации демо-данных
export const generateDemoCards = (): ExtendedCollateralCard[] => {
  const cards: ExtendedCollateralCard[] = [];
  const regions = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург'];
  const statuses: ('editing' | 'approved')[] = ['editing', 'approved'];
  let cardNumber = 1;

  // Генерируем карточки недвижимости (22 карточки)
  realEstateTypes.forEach((type, index) => {
    const region = regions[index % regions.length];
    const status = statuses[index % statuses.length];
    const createdAt = randomDate(new Date(2023, 0, 1), new Date());
    
    cards.push({
      id: generateId(),
      number: `RE-${cardNumber.toString().padStart(4, '0')}`,
      name: `${type.level1} в ${region}`,
      mainCategory: 'real_estate',
      classification: type,
      cbCode: 100 + index,
      status,
      address: generateAddress(region),
      characteristics: generateRealEstateCharacteristics(type.level1),
      ...generateValue('real_estate', type.level1),
      createdAt,
      updatedAt: randomDate(createdAt, new Date()),
      owner: {
        name: `ООО "Компания ${cardNumber}"`,
        inn: `${7700000000 + cardNumber}`,
        type: 'legal',
      },
      documents: [
        { id: '1', name: 'Свидетельство о собственности', type: 'ownership', uploadDate: createdAt.toISOString().split('T')[0] },
        { id: '2', name: 'Кадастровый паспорт', type: 'cadastral', uploadDate: createdAt.toISOString().split('T')[0] },
      ],
      photos: [],
      notes: `Демо-карточка недвижимости для тестирования системы`,
    });
    cardNumber++;
  });

  // Генерируем карточки движимого имущества (12 карточек)
  movableTypes.forEach((type, index) => {
    const region = regions[index % regions.length];
    const status = statuses[index % statuses.length];
    const createdAt = randomDate(new Date(2023, 0, 1), new Date());
    
    let characteristics;
    if (type.level0 === 'Транспорт') {
      characteristics = generateVehicleCharacteristics(type.level1);
    } else {
      characteristics = generateEquipmentCharacteristics(type.level1);
    }
    
    cards.push({
      id: generateId(),
      number: `MV-${cardNumber.toString().padStart(4, '0')}`,
      name: `${type.level1} - ${characteristics.brand || characteristics.manufacturer}`,
      mainCategory: 'movable',
      classification: type,
      cbCode: 200 + index,
      status,
      address: generateAddress(region),
      characteristics,
      ...generateValue('movable', type.level1),
      createdAt,
      updatedAt: randomDate(createdAt, new Date()),
      owner: {
        name: `ООО "Транспорт ${cardNumber}"`,
        inn: `${7700000000 + cardNumber}`,
        type: 'legal',
      },
      documents: [
        { id: '1', name: 'ПТС', type: 'pts', uploadDate: createdAt.toISOString().split('T')[0] },
      ],
      photos: [],
      notes: `Демо-карточка движимого имущества для тестирования системы`,
    });
    cardNumber++;
  });

  // Генерируем карточки имущественных прав (10 карточек)
  propertyRightsTypes.forEach((type, index) => {
    const region = regions[index % regions.length];
    const status = statuses[index % statuses.length];
    const createdAt = randomDate(new Date(2023, 0, 1), new Date());
    
    cards.push({
      id: generateId(),
      number: `PR-${cardNumber.toString().padStart(4, '0')}`,
      name: `${type.level1} - ${region}`,
      mainCategory: 'property_rights',
      classification: type,
      cbCode: 300 + index,
      status,
      address: generateAddress(region),
      characteristics: {
        nominalValue: Math.floor(Math.random() * 10000000) + 100000,
        quantity: Math.floor(Math.random() * 1000) + 1,
        issuer: `ПАО "Эмитент ${index + 1}"`,
      },
      ...generateValue('property_rights', type.level1),
      createdAt,
      updatedAt: randomDate(createdAt, new Date()),
      owner: {
        name: `ООО "Инвестор ${cardNumber}"`,
        inn: `${7700000000 + cardNumber}`,
        type: 'legal',
      },
      documents: [],
      photos: [],
      notes: `Демо-карточка имущественных прав для тестирования системы`,
    });
    cardNumber++;
  });

  return cards;
};

export default { generateDemoCards };

