import type { ClassificationOption, ObjectTypeKey } from '@/types';

// Полная иерархическая классификация недвижимости
export const EXTENDED_REAL_ESTATE_HIERARCHY: Record<string, Record<string, string[]>> = {
  'Коммерческая недвижимость': {
    'АЗС': ['Здание', 'Помещение', 'Сооружение'],
    'Автосалоны': ['Здание', 'Помещение'],
    'Апартаменты': ['Помещение'],
    'Гаражи': ['Здание', 'Помещение'],
    'Гостиницы': ['Здание', 'Помещение'],
    'Кафе/рестораны': ['Здание', 'Помещение'],
    'Медицинские центры': ['Здание', 'Помещение'],
    'Офисные здания': ['Здание'],
    'Офисные помещения': ['Помещение'],
    'Производственные помещения': ['Помещение'],
    'Склады': ['Здание', 'Помещение', 'Сооружение'],
    'Торговые центры': ['Здание'],
    'Торговые помещения': ['Помещение'],
    'Торгово-развлекательные центры': ['Здание'],
    'Здания свободного назначения': ['Здание'],
    'Помещения свободного назначения': ['Помещение'],
  },
  'Жилая недвижимость': {
    'Квартира': ['Помещение'],
    'Комната': ['Помещение'],
    'Жилой дом': ['Здание'],
    'Таунхаус': ['Здание'],
    'Дача': ['Здание'],
    'Земельный участок': ['Земельный участок'],
  },
  'Промышленная недвижимость': {
    'Производственные здания': ['Здание'],
    'Производственные сооружения': ['Сооружение'],
    'Цеха': ['Здание', 'Помещение'],
    'Ангары': ['Здание', 'Сооружение'],
    'Элеваторы': ['Сооружение'],
    'Резервуары': ['Сооружение'],
  },
};

// Маппинг типа объекта к ObjectTypeKey
export const TYPE_TO_KEY_MAP: Record<string, ObjectTypeKey> = {
  // Жилая недвижимость
  'Квартира_Помещение': 'apartment',
  'Комната_Помещение': 'room',
  'Жилой дом_Здание': 'house',
  'Таунхаус_Здание': 'townhouse',
  'Дача_Здание': 'house',
  'Земельный участок_Земельный участок': 'land_residential',

  // Коммерческая недвижимость
  'Офисные помещения_Помещение': 'office',
  'Офисные здания_Здание': 'office',
  'Торговые помещения_Помещение': 'retail',
  'Торговые центры_Здание': 'retail',
  'Склады_Здание': 'warehouse',
  'Склады_Помещение': 'warehouse',
  'Склады_Сооружение': 'warehouse',
  'Гостиницы_Здание': 'hotel',
  'Гостиницы_Помещение': 'hotel',
  'Кафе/рестораны_Здание': 'catering',
  'Кафе/рестораны_Помещение': 'catering',
  'АЗС_Здание': 'gas_station',
  'АЗС_Помещение': 'gas_station',
  'АЗС_Сооружение': 'gas_station',
  'Автосалоны_Здание': 'car_dealership',
  'Автосалоны_Помещение': 'car_dealership',

  // Промышленная
  'Производственные здания_Здание': 'industrial_building',
  'Производственные сооружения_Сооружение': 'industrial_building',
  'Цеха_Здание': 'workshop',
  'Цеха_Помещение': 'workshop',
};

// Коды ЦБ для расширенной классификации
export const EXTENDED_CB_CODES: Record<string, number> = {
  // Жилая недвижимость
  'Квартира_Помещение': 2010,
  'Комната_Помещение': 2030,
  'Жилой дом_Здание': 2020,
  'Таунхаус_Здание': 2040,
  'Дача_Здание': 2050,
  'Земельный участок_Земельный участок': 2060,

  // Коммерческая недвижимость
  'Офисные помещения_Помещение': 1010,
  'Офисные здания_Здание': 1011,
  'Торговые помещения_Помещение': 1020,
  'Торговые центры_Здание': 1021,
  'Склады_Здание': 1031,
  'Склады_Помещение': 1030,
  'Склады_Сооружение': 1032,
  'Гостиницы_Здание': 1040,
  'Гостиницы_Помещение': 1041,
  'Кафе/рестораны_Здание': 1051,
  'Кафе/рестораны_Помещение': 1050,
  'АЗС_Здание': 1060,
  'АЗС_Помещение': 1061,
  'АЗС_Сооружение': 1062,
  'Автосалоны_Здание': 1070,
  'Автосалоны_Помещение': 1071,
  'Апартаменты_Помещение': 1080,
  'Гаражи_Здание': 1090,
  'Гаражи_Помещение': 1091,
  'Медицинские центры_Здание': 1100,
  'Медицинские центры_Помещение': 1101,
  'Здания свободного назначения_Здание': 1110,
  'Помещения свободного назначения_Помещение': 1111,
  'Производственные помещения_Помещение': 1120,
  'Торгово-развлекательные центры_Здание': 1130,

  // Промышленная
  'Производственные здания_Здание': 3010,
  'Производственные сооружения_Сооружение': 3011,
  'Цеха_Здание': 3021,
  'Цеха_Помещение': 3020,
  'Ангары_Здание': 3030,
  'Ангары_Сооружение': 3031,
  'Элеваторы_Сооружение': 3040,
  'Резервуары_Сооружение': 3050,
};

// Преобразование в формат для ClassificationOption
export const extendedRealEstateClassification: ClassificationOption[] = 
  Object.entries(EXTENDED_REAL_ESTATE_HIERARCHY).map(([level0, level1Items]) => ({
    value: level0,
    label: level0,
    children: Object.entries(level1Items).map(([level1, level2Items]) => ({
      value: level1,
      label: level1,
      children: level2Items.map(level2 => {
        const key = `${level1}_${level2}`;
        const cbCode = EXTENDED_CB_CODES[key] || 0;
        return {
          value: level2,
          label: level2,
          cbCode,
        };
      }),
    })),
  }));

// Получение расширенного кода ЦБ
export const getExtendedCBCode = (level0: string, level1: string, level2: string): number => {
  const key = `${level1}_${level2}`;
  return EXTENDED_CB_CODES[key] || 0;
};

// Получение ObjectTypeKey по классификации
export const getObjectTypeKey = (level1: string, level2: string): ObjectTypeKey | null => {
  const key = `${level1}_${level2}`;
  return TYPE_TO_KEY_MAP[key] || null;
};

// Получение всех возможных значений для уровня 1
export const getExtendedLevel1Options = (level0: string): ClassificationOption[] => {
  const level1Items = EXTENDED_REAL_ESTATE_HIERARCHY[level0];
  if (!level1Items) return [];

  return Object.keys(level1Items).map(level1 => ({
    value: level1,
    label: level1,
  }));
};

// Получение всех возможных значений для уровня 2
export const getExtendedLevel2Options = (level0: string, level1: string): ClassificationOption[] => {
  const level1Items = EXTENDED_REAL_ESTATE_HIERARCHY[level0];
  if (!level1Items) return [];

  const level2Items = level1Items[level1];
  if (!level2Items) return [];

  return level2Items.map(level2 => {
    const key = `${level1}_${level2}`;
    const cbCode = EXTENDED_CB_CODES[key] || 0;
    return {
      value: level2,
      label: level2,
      cbCode,
    };
  });
};

// Валидация расширенной классификации
export const validateExtendedClassification = (
  level0: string,
  level1: string,
  level2: string
): boolean => {
  return getExtendedCBCode(level0, level1, level2) !== 0;
};

