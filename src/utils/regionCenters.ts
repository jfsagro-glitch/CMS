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
    cities: ['Москва', 'Московская область', 'Ярославль', 'Воронеж'],
  },
  {
    code: 'СЗРЦ',
    name: 'Северозападный Региональный центр',
    cities: ['Санкт-Петербург', 'Ленинградская область', 'Мурманск'],
  },
  {
    code: 'ЮРЦ',
    name: 'Южный региональный центр',
    cities: ['Краснодар', 'Ростов-на-Дону', 'Майкоп', 'Ставрополь', 'Анапа', 'Волгоград'],
  },
  {
    code: 'СРЦ',
    name: 'Сибирский региональный центр',
    cities: ['Новосибирск'],
  },
  {
    code: 'ЕКЦ',
    name: 'Екатеринбург',
    cities: ['Екатеринбург'],
  },
  {
    code: 'ДВЦ',
    name: 'Дальневосточный центр',
    cities: ['Владивосток'],
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

