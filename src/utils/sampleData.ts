import type { CollateralCard } from '@/types';
import { generateId } from './helpers';

// Примеры данных для тестирования
export const sampleCards: CollateralCard[] = [
  {
    id: generateId(),
    number: 'КО-2024-001',
    name: 'Офисное помещение, ул. Ленина, д. 15, пом. 201',
    mainCategory: 'real_estate',
    classification: {
      level0: 'Коммерческая недвижимость',
      level1: 'Офис',
      level2: 'Помещение',
    },
    cbCode: 1010,
    status: 'approved',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: generateId(),
    number: 'КО-2024-002',
    name: 'Торговый центр "Галерея", ул. Пушкина, д. 23',
    mainCategory: 'real_estate',
    classification: {
      level0: 'Коммерческая недвижимость',
      level1: 'Торговое помещение',
      level2: 'Здание',
    },
    cbCode: 1021,
    status: 'editing',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: generateId(),
    number: 'КО-2024-003',
    name: 'Складской комплекс, Промзона, участок 14',
    mainCategory: 'real_estate',
    classification: {
      level0: 'Коммерческая недвижимость',
      level1: 'Склад',
      level2: 'Здание',
    },
    cbCode: 1031,
    status: 'approved',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: generateId(),
    number: 'КО-2024-004',
    name: 'Квартира 3-комн., ул. Советская, д. 45, кв. 12',
    mainCategory: 'real_estate',
    classification: {
      level0: 'Жилая недвижимость',
      level1: 'Квартира',
      level2: 'Помещение',
    },
    cbCode: 2010,
    status: 'approved',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    id: generateId(),
    number: 'КО-2024-005',
    name: 'Жилой дом с участком, пос. Зеленый, ул. Цветочная, д. 7',
    mainCategory: 'real_estate',
    classification: {
      level0: 'Жилая недвижимость',
      level1: 'Жилой дом',
      level2: 'Здание',
    },
    cbCode: 2020,
    status: 'editing',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: generateId(),
    number: 'КО-2024-006',
    name: 'Производственный цех, Индустриальная зона, корп. 5',
    mainCategory: 'real_estate',
    classification: {
      level0: 'Промышленная недвижимость',
      level1: 'Производственное здание',
      level2: 'Здание',
    },
    cbCode: 3010,
    status: 'approved',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
];

// Функция для загрузки примеров данных в IndexedDB
export const loadSampleData = async (storageService: any): Promise<void> => {
  try {
    for (const card of sampleCards) {
      await storageService.saveCollateralCard(card);
    }
    console.log('Sample data loaded successfully');
  } catch (error) {
    console.error('Failed to load sample data:', error);
    throw error;
  }
};

