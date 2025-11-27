/**
 * Региональные центры и их города
 */

export interface RegionCenter {
  code: string;
  name: string;
  cities: string[];
}

export const REGION_CENTERS: RegionCenter[] = [
  {
    code: 'ЦО',
    name: 'Центральный округ',
    cities: ['Москва', 'Московская область', 'Ярославль', 'Воронеж', 'Тула', 'Калуга', 'Рязань', 'Тверь'],
  },
  {
    code: 'СЗРЦ',
    name: 'Северозападный Региональный центр',
    cities: ['Санкт-Петербург', 'Ленинградская область', 'Мурманск', 'Архангельск', 'Псков', 'Великий Новгород'],
  },
  {
    code: 'ЮРЦ',
    name: 'Южный региональный центр',
    cities: ['Краснодар', 'Ростов-на-Дону', 'Майкоп', 'Ставрополь', 'Анапа', 'Волгоград', 'Сочи', 'Новороссийск', 'Таганрог'],
  },
  {
    code: 'СРЦ',
    name: 'Сибирский региональный центр',
    cities: ['Новосибирск', 'Омск', 'Красноярск', 'Иркутск', 'Барнаул', 'Томск'],
  },
  {
    code: 'ЕКЦ',
    name: 'Уральский региональный центр',
    cities: ['Екатеринбург', 'Челябинск', 'Пермь', 'Уфа', 'Тюмень', 'Курган'],
  },
  {
    code: 'ДВЦ',
    name: 'Дальневосточный центр',
    cities: ['Владивосток', 'Хабаровск', 'Южно-Сахалинск', 'Благовещенск', 'Петропавловск-Камчатский'],
  },
  {
    code: 'ПРЦ',
    name: 'Приволжский региональный центр',
    cities: ['Казань', 'Нижний Новгород', 'Самара', 'Саратов', 'Ульяновск', 'Пенза'],
  },
  {
    code: 'СЗРЦ2',
    name: 'Северо-Кавказский региональный центр',
    cities: ['Махачкала', 'Грозный', 'Нальчик', 'Владикавказ', 'Элиста'],
  },
];

/**
 * Получить региональный центр по городу
 */
export const getRegionCenterByCity = (city: string): RegionCenter | null => {
  return REGION_CENTERS.find(center => 
    center.cities.some(c => c.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(c.toLowerCase()))
  ) || null;
};

/**
 * Получить все города всех региональных центров
 */
export const getAllCities = (): string[] => {
  return REGION_CENTERS.flatMap(center => center.cities);
};

/**
 * Получить региональный центр по коду
 */
export const getRegionCenterByCode = (code: string): RegionCenter | null => {
  return REGION_CENTERS.find(center => center.code === code) || null;
};

