import type { CharacteristicField, ObjectTypeKey, CharacteristicsConfig } from '@/types';

// Конфигурация характеристик для квартиры
const apartmentFields: CharacteristicField[] = [
  { name: 'totalArea', type: 'number', label: 'Общая площадь', required: true, unit: 'кв.м', min: 0 },
  { name: 'livingArea', type: 'number', label: 'Жилая площадь', unit: 'кв.м', min: 0 },
  { name: 'kitchenArea', type: 'number', label: 'Площадь кухни', unit: 'кв.м', min: 0 },
  { name: 'floor', type: 'number', label: 'Этаж', required: true, min: 1 },
  { name: 'totalFloors', type: 'number', label: 'Этажность дома', required: true, min: 1 },
  { name: 'roomsCount', type: 'number', label: 'Количество комнат', required: true, min: 1 },
  { name: 'separateBathrooms', type: 'number', label: 'Количество санузлов', min: 0 },
  { name: 'balcony', type: 'boolean', label: 'Наличие балкона/лоджии' },
  { name: 'condition', type: 'select', label: 'Состояние', options: ['Черновая', 'Требует ремонта', 'Удовлетворительное', 'Хорошее', 'Отличное'] },
  { name: 'ceilingHeight', type: 'number', label: 'Высота потолков', unit: 'м', min: 2, max: 6 },
  { name: 'buildYear', type: 'number', label: 'Год постройки', min: 1800, max: new Date().getFullYear() },
  { name: 'wallMaterial', type: 'select', label: 'Материал стен', options: ['Кирпич', 'Панель', 'Монолит', 'Блочный', 'Дерево'] },
];

// Конфигурация для жилого дома
const houseFields: CharacteristicField[] = [
  { name: 'totalArea', type: 'number', label: 'Общая площадь', required: true, unit: 'кв.м', min: 0 },
  { name: 'livingArea', type: 'number', label: 'Жилая площадь', unit: 'кв.м', min: 0 },
  { name: 'landArea', type: 'number', label: 'Площадь земельного участка', unit: 'сот.', min: 0 },
  { name: 'floors', type: 'number', label: 'Количество этажей', required: true, min: 1 },
  { name: 'roomsCount', type: 'number', label: 'Количество комнат', required: true, min: 1 },
  { name: 'separateBathrooms', type: 'number', label: 'Количество санузлов', min: 0 },
  { name: 'buildYear', type: 'number', label: 'Год постройки', min: 1800, max: new Date().getFullYear() },
  { name: 'wallMaterial', type: 'select', label: 'Материал стен', options: ['Кирпич', 'Газобетон', 'Дерево', 'Каркасный', 'Монолит'] },
  { name: 'condition', type: 'select', label: 'Состояние', options: ['Требует ремонта', 'Удовлетворительное', 'Хорошее', 'Отличное'] },
  { name: 'utilities', type: 'select', label: 'Коммуникации', options: ['Все', 'Частично', 'Отсутствуют'] },
  { name: 'heating', type: 'select', label: 'Отопление', options: ['Центральное', 'Газовое', 'Электрическое', 'Печное', 'Отсутствует'] },
];

// Конфигурация для таунхауса
const townhouseFields: CharacteristicField[] = [
  ...houseFields,
  { name: 'section', type: 'text', label: 'Секция/блок' },
];

// Конфигурация для комнаты
const roomFields: CharacteristicField[] = [
  { name: 'area', type: 'number', label: 'Площадь комнаты', required: true, unit: 'кв.м', min: 0 },
  { name: 'floor', type: 'number', label: 'Этаж', required: true, min: 1 },
  { name: 'totalFloors', type: 'number', label: 'Этажность дома', required: true, min: 1 },
  { name: 'neighbors', type: 'number', label: 'Количество комнат в квартире', min: 1 },
  { name: 'condition', type: 'select', label: 'Состояние', options: ['Требует ремонта', 'Удовлетворительное', 'Хорошее', 'Отличное'] },
];

// Конфигурация для земельного участка (жилого)
const landResidentialFields: CharacteristicField[] = [
  { name: 'area', type: 'number', label: 'Площадь участка', required: true, unit: 'сот.', min: 0 },
  { name: 'category', type: 'select', label: 'Категория земель', required: true, 
    options: ['Земли населенных пунктов', 'Земли сельхозназначения', 'Земли промназначения'] },
  { name: 'purpose', type: 'select', label: 'Разрешенное использование', 
    options: ['ИЖС', 'ЛПХ', 'ДНП', 'СНТ', 'Коммерческое'] },
  { name: 'utilities', type: 'select', label: 'Коммуникации', options: ['Все', 'Частично', 'Отсутствуют'] },
  { name: 'access', type: 'select', label: 'Подъезд', options: ['Асфальт', 'Грунт', 'Отсутствует'] },
];

// Конфигурация для офиса
const officeFields: CharacteristicField[] = [
  { name: 'totalArea', type: 'number', label: 'Общая площадь', required: true, unit: 'кв.м', min: 0 },
  { name: 'floor', type: 'number', label: 'Этаж', required: true, min: -2 },
  { name: 'totalFloors', type: 'number', label: 'Этажность здания', required: true, min: 1 },
  { name: 'buildingClass', type: 'select', label: 'Класс здания', required: true,
    options: ['A+', 'A', 'B+', 'B', 'C'] },
  { name: 'planning', type: 'select', label: 'Планировка', 
    options: ['Открытая', 'Кабинетная', 'Смешанная', 'Свободная'] },
  { name: 'finishing', type: 'select', label: 'Отделка',
    options: ['Без отделки', 'Черновая', 'Предчистовая', 'Чистовая'] },
  { name: 'ceilingHeight', type: 'number', label: 'Высота потолков', unit: 'м', min: 2.5, max: 10 },
  { name: 'parking', type: 'boolean', label: 'Наличие парковки' },
  { name: 'parkingSpaces', type: 'number', label: 'Количество машиномест', min: 0 },
  { name: 'buildYear', type: 'number', label: 'Год постройки', min: 1900, max: new Date().getFullYear() },
];

// Конфигурация для торгового помещения
const retailFields: CharacteristicField[] = [
  { name: 'totalArea', type: 'number', label: 'Общая площадь', required: true, unit: 'кв.м', min: 0 },
  { name: 'tradingArea', type: 'number', label: 'Торговая площадь', unit: 'кв.м', min: 0 },
  { name: 'floor', type: 'number', label: 'Этаж', required: true, min: -2 },
  { name: 'totalFloors', type: 'number', label: 'Этажность здания', min: 1 },
  { name: 'entrance', type: 'select', label: 'Вход', options: ['Отдельный', 'Общий'] },
  { name: 'showcaseLength', type: 'number', label: 'Длина витрины', unit: 'м', min: 0 },
  { name: 'ceilingHeight', type: 'number', label: 'Высота потолков', unit: 'м', min: 2, max: 10 },
  { name: 'ventilation', type: 'select', label: 'Вентиляция', options: ['Естественная', 'Приточная', 'Приточно-вытяжная'] },
  { name: 'parking', type: 'boolean', label: 'Наличие парковки' },
];

// Конфигурация для склада
const warehouseFields: CharacteristicField[] = [
  { name: 'totalArea', type: 'number', label: 'Общая площадь', required: true, unit: 'кв.м', min: 0 },
  { name: 'storageArea', type: 'number', label: 'Площадь хранения', unit: 'кв.м', min: 0 },
  { name: 'ceilingHeight', type: 'number', label: 'Высота потолков', unit: 'м', min: 3, max: 20, required: true },
  { name: 'floors', type: 'number', label: 'Количество этажей', min: 1 },
  { name: 'warehouseClass', type: 'select', label: 'Класс склада', 
    options: ['A', 'A+', 'B', 'B+', 'C', 'D'] },
  { name: 'gates', type: 'select', label: 'Тип ворот', options: ['Докового типа', 'На нулевой отметке', 'Смешанные'] },
  { name: 'gatesCount', type: 'number', label: 'Количество ворот', min: 0 },
  { name: 'flooring', type: 'select', label: 'Покрытие пола', 
    options: ['Бетон', 'Асфальт', 'Полимер', 'Плитка'] },
  { name: 'loadCapacity', type: 'number', label: 'Нагрузка на пол', unit: 'тонн/кв.м', min: 0 },
  { name: 'heating', type: 'boolean', label: 'Отопление' },
  { name: 'ramp', type: 'boolean', label: 'Наличие рампы' },
];

// Конфигурация для гостиницы
const hotelFields: CharacteristicField[] = [
  { name: 'totalArea', type: 'number', label: 'Общая площадь', required: true, unit: 'кв.м', min: 0 },
  { name: 'floors', type: 'number', label: 'Количество этажей', required: true, min: 1 },
  { name: 'roomsCount', type: 'number', label: 'Количество номеров', required: true, min: 1 },
  { name: 'category', type: 'select', label: 'Категория', options: ['Без категории', '1 звезда', '2 звезды', '3 звезды', '4 звезды', '5 звезд'] },
  { name: 'buildYear', type: 'number', label: 'Год постройки', min: 1900, max: new Date().getFullYear() },
  { name: 'parking', type: 'boolean', label: 'Наличие парковки' },
  { name: 'restaurant', type: 'boolean', label: 'Наличие ресторана' },
];

// Конфигурация для кафе/ресторана
const cateringFields: CharacteristicField[] = [
  { name: 'totalArea', type: 'number', label: 'Общая площадь', required: true, unit: 'кв.м', min: 0 },
  { name: 'hallArea', type: 'number', label: 'Площадь зала', unit: 'кв.м', min: 0 },
  { name: 'floor', type: 'number', label: 'Этаж', min: -1 },
  { name: 'seatingCapacity', type: 'number', label: 'Количество посадочных мест', min: 0 },
  { name: 'kitchen', type: 'boolean', label: 'Наличие кухни' },
  { name: 'ventilation', type: 'select', label: 'Вентиляция', options: ['Естественная', 'Приточная', 'Приточно-вытяжная'] },
  { name: 'entrance', type: 'select', label: 'Вход', options: ['Отдельный', 'Общий'] },
];

// Конфигурация для АЗС
const gasStationFields: CharacteristicField[] = [
  { name: 'landArea', type: 'number', label: 'Площадь участка', required: true, unit: 'кв.м', min: 0 },
  { name: 'buildingArea', type: 'number', label: 'Площадь здания', unit: 'кв.м', min: 0 },
  { name: 'dispensersCount', type: 'number', label: 'Количество ТРК', required: true, min: 1 },
  { name: 'tanksVolume', type: 'number', label: 'Объем резервуаров', unit: 'куб.м', min: 0 },
  { name: 'fuelTypes', type: 'number', label: 'Количество видов топлива', min: 1 },
  { name: 'carWash', type: 'boolean', label: 'Наличие автомойки' },
  { name: 'shop', type: 'boolean', label: 'Наличие магазина' },
  { name: 'cafe', type: 'boolean', label: 'Наличие кафе' },
];

// Конфигурация для автосалона
const carDealershipFields: CharacteristicField[] = [
  { name: 'totalArea', type: 'number', label: 'Общая площадь', required: true, unit: 'кв.м', min: 0 },
  { name: 'showroomArea', type: 'number', label: 'Площадь шоурума', unit: 'кв.м', min: 0 },
  { name: 'serviceArea', type: 'number', label: 'Площадь СТО', unit: 'кв.м', min: 0 },
  { name: 'floors', type: 'number', label: 'Количество этажей', min: 1 },
  { name: 'liftCapacity', type: 'number', label: 'Количество подъемников', min: 0 },
  { name: 'ceilingHeight', type: 'number', label: 'Высота потолков', unit: 'м', min: 3 },
  { name: 'parking', type: 'boolean', label: 'Наличие парковки' },
];

// Конфигурация для промышленного здания
const industrialBuildingFields: CharacteristicField[] = [
  { name: 'totalArea', type: 'number', label: 'Общая площадь', required: true, unit: 'кв.м', min: 0 },
  { name: 'productionArea', type: 'number', label: 'Производственная площадь', unit: 'кв.м', min: 0 },
  { name: 'ceilingHeight', type: 'number', label: 'Высота потолков', unit: 'м', min: 3, required: true },
  { name: 'floors', type: 'number', label: 'Количество этажей', min: 1 },
  { name: 'craneway', type: 'boolean', label: 'Наличие кран-балки' },
  { name: 'craneCapacity', type: 'number', label: 'Грузоподъемность кран-балки', unit: 'т', min: 0 },
  { name: 'power', type: 'number', label: 'Электрическая мощность', unit: 'кВт', min: 0 },
  { name: 'buildYear', type: 'number', label: 'Год постройки', min: 1900, max: new Date().getFullYear() },
];

// Конфигурация для цеха
const workshopFields: CharacteristicField[] = [
  ...industrialBuildingFields,
  { name: 'specialization', type: 'text', label: 'Специализация цеха' },
];

// Конфигурация для легкового автомобиля
const carPassengerFields: CharacteristicField[] = [
  { name: 'brand', type: 'text', label: 'Марка', required: true },
  { name: 'model', type: 'text', label: 'Модель', required: true },
  { name: 'year', type: 'number', label: 'Год выпуска', required: true, min: 1900, max: new Date().getFullYear() },
  { name: 'vin', type: 'text', label: 'VIN номер' },
  { name: 'engineVolume', type: 'number', label: 'Объем двигателя', unit: 'л', min: 0 },
  { name: 'enginePower', type: 'number', label: 'Мощность', unit: 'л.с.', min: 0 },
  { name: 'fuelType', type: 'select', label: 'Тип топлива', options: ['Бензин', 'Дизель', 'Гибрид', 'Электро', 'Газ'] },
  { name: 'transmission', type: 'select', label: 'Коробка передач', options: ['Механическая', 'Автоматическая', 'Робот', 'Вариатор'] },
  { name: 'mileage', type: 'number', label: 'Пробег', unit: 'км', min: 0 },
  { name: 'color', type: 'text', label: 'Цвет' },
  { name: 'condition', type: 'select', label: 'Состояние', options: ['Новый', 'Отличное', 'Хорошее', 'Удовлетворительное', 'Требует ремонта'] },
];

// Конфигурация для грузового автомобиля
const carTruckFields: CharacteristicField[] = [
  { name: 'brand', type: 'text', label: 'Марка', required: true },
  { name: 'model', type: 'text', label: 'Модель', required: true },
  { name: 'year', type: 'number', label: 'Год выпуска', required: true, min: 1900, max: new Date().getFullYear() },
  { name: 'vin', type: 'text', label: 'VIN номер' },
  { name: 'loadCapacity', type: 'number', label: 'Грузоподъемность', unit: 'т', min: 0, required: true },
  { name: 'bodyType', type: 'select', label: 'Тип кузова', options: ['Бортовой', 'Тентованный', 'Рефрижератор', 'Самосвал', 'Фургон'] },
  { name: 'mileage', type: 'number', label: 'Пробег', unit: 'км', min: 0 },
  { name: 'condition', type: 'select', label: 'Состояние', options: ['Новый', 'Отличное', 'Хорошее', 'Удовлетворительное', 'Требует ремонта'] },
];

// Конфигурация для оборудования
const equipmentFields: CharacteristicField[] = [
  { name: 'name', type: 'text', label: 'Наименование', required: true },
  { name: 'manufacturer', type: 'text', label: 'Производитель' },
  { name: 'model', type: 'text', label: 'Модель' },
  { name: 'year', type: 'number', label: 'Год выпуска', min: 1900, max: new Date().getFullYear() },
  { name: 'serialNumber', type: 'text', label: 'Серийный номер' },
  { name: 'power', type: 'number', label: 'Мощность', unit: 'кВт', min: 0 },
  { name: 'condition', type: 'select', label: 'Состояние', options: ['Новое', 'Отличное', 'Хорошее', 'Удовлетворительное', 'Требует ремонта'] },
  { name: 'operatingHours', type: 'number', label: 'Наработка', unit: 'моточасов', min: 0 },
];

// Конфигурация для техники/машин
const machineryFields: CharacteristicField[] = [
  { name: 'type', type: 'text', label: 'Тип техники', required: true },
  { name: 'manufacturer', type: 'text', label: 'Производитель' },
  { name: 'model', type: 'text', label: 'Модель' },
  { name: 'year', type: 'number', label: 'Год выпуска', min: 1900, max: new Date().getFullYear() },
  { name: 'serialNumber', type: 'text', label: 'Серийный номер' },
  { name: 'operatingHours', type: 'number', label: 'Моточасы', unit: 'ч', min: 0 },
  { name: 'condition', type: 'select', label: 'Состояние', options: ['Новая', 'Отличное', 'Хорошее', 'Удовлетворительное', 'Требует ремонта'] },
];

// Полная конфигурация всех типов
export const CHARACTERISTICS_CONFIG: CharacteristicsConfig = {
  // Жилая недвижимость
  apartment: apartmentFields,
  room: roomFields,
  house: houseFields,
  townhouse: townhouseFields,
  land_residential: landResidentialFields,

  // Коммерческая недвижимость
  office: officeFields,
  retail: retailFields,
  warehouse: warehouseFields,
  hotel: hotelFields,
  catering: cateringFields,
  gas_station: gasStationFields,
  car_dealership: carDealershipFields,

  // Промышленная
  industrial_building: industrialBuildingFields,
  workshop: workshopFields,

  // Движимое имущество
  car_passenger: carPassengerFields,
  car_truck: carTruckFields,
  equipment: equipmentFields,
  machinery: machineryFields,
};

// Получение конфигурации для типа объекта
export const getCharacteristicsConfig = (objectType: ObjectTypeKey | null): CharacteristicField[] => {
  if (!objectType) return [];
  return CHARACTERISTICS_CONFIG[objectType] || [];
};

// Имена типов объектов для отображения
export const OBJECT_TYPE_NAMES: Record<ObjectTypeKey, string> = {
  apartment: 'Квартира',
  room: 'Комната',
  house: 'Жилой дом',
  townhouse: 'Таунхаус',
  land_residential: 'Земельный участок (жилой)',
  office: 'Офис',
  retail: 'Торговое помещение',
  warehouse: 'Склад',
  hotel: 'Гостиница',
  catering: 'Кафе/ресторан',
  gas_station: 'АЗС',
  car_dealership: 'Автосалон',
  industrial_building: 'Промышленное здание',
  workshop: 'Цех',
  car_passenger: 'Легковой автомобиль',
  car_truck: 'Грузовой автомобиль',
  equipment: 'Оборудование',
  machinery: 'Техника',
};

