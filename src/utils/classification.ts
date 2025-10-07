import type { ClassificationOption } from '@/types';

// Иерархическая классификация недвижимости
export const realEstateClassification: ClassificationOption[] = [
  {
    value: 'Коммерческая недвижимость',
    label: 'Коммерческая недвижимость',
    children: [
      {
        value: 'Офис',
        label: 'Офис',
        children: [
          { value: 'Помещение', label: 'Помещение', cbCode: 1010 },
          { value: 'Здание', label: 'Здание', cbCode: 1011 }
        ]
      },
      {
        value: 'Торговое помещение',
        label: 'Торговое помещение',
        children: [
          { value: 'Помещение', label: 'Помещение', cbCode: 1020 },
          { value: 'Здание', label: 'Здание', cbCode: 1021 }
        ]
      },
      {
        value: 'Склад',
        label: 'Склад',
        children: [
          { value: 'Помещение', label: 'Помещение', cbCode: 1030 },
          { value: 'Здание', label: 'Здание', cbCode: 1031 },
          { value: 'Сооружение', label: 'Сооружение', cbCode: 1032 }
        ]
      },
      {
        value: 'Гостиница',
        label: 'Гостиница',
        children: [
          { value: 'Здание', label: 'Здание', cbCode: 1040 }
        ]
      },
      {
        value: 'Общепит',
        label: 'Общепит',
        children: [
          { value: 'Помещение', label: 'Помещение', cbCode: 1050 },
          { value: 'Здание', label: 'Здание', cbCode: 1051 }
        ]
      }
    ]
  },
  {
    value: 'Жилая недвижимость',
    label: 'Жилая недвижимость',
    children: [
      {
        value: 'Квартира',
        label: 'Квартира',
        children: [
          { value: 'Помещение', label: 'Помещение', cbCode: 2010 }
        ]
      },
      {
        value: 'Жилой дом',
        label: 'Жилой дом',
        children: [
          { value: 'Здание', label: 'Здание', cbCode: 2020 }
        ]
      },
      {
        value: 'Комната',
        label: 'Комната',
        children: [
          { value: 'Помещение', label: 'Помещение', cbCode: 2030 }
        ]
      },
      {
        value: 'Таунхаус',
        label: 'Таунхаус',
        children: [
          { value: 'Здание', label: 'Здание', cbCode: 2040 }
        ]
      }
    ]
  },
  {
    value: 'Промышленная недвижимость',
    label: 'Промышленная недвижимость',
    children: [
      {
        value: 'Производственное здание',
        label: 'Производственное здание',
        children: [
          { value: 'Здание', label: 'Здание', cbCode: 3010 },
          { value: 'Сооружение', label: 'Сооружение', cbCode: 3011 }
        ]
      },
      {
        value: 'Цех',
        label: 'Цех',
        children: [
          { value: 'Помещение', label: 'Помещение', cbCode: 3020 },
          { value: 'Здание', label: 'Здание', cbCode: 3021 }
        ]
      }
    ]
  }
];

// Получение кода ЦБ по выбранной классификации
export const getCBCode = (level0: string, level1: string, level2: string): number => {
  const category = realEstateClassification.find(c => c.value === level0);
  if (!category?.children) return 0;

  const type = category.children.find(t => t.value === level1);
  if (!type?.children) return 0;

  const subtype = type.children.find(st => st.value === level2);
  return subtype?.cbCode || 0;
};

// Валидация выбранной комбинации
export const validateClassification = (level0: string, level1: string, level2: string): boolean => {
  return getCBCode(level0, level1, level2) !== 0;
};

// Получение всех возможных значений для уровня 1 на основе уровня 0
export const getLevel1Options = (level0: string): ClassificationOption[] => {
  const category = realEstateClassification.find(c => c.value === level0);
  return category?.children || [];
};

// Получение всех возможных значений для уровня 2 на основе уровней 0 и 1
export const getLevel2Options = (level0: string, level1: string): ClassificationOption[] => {
  const category = realEstateClassification.find(c => c.value === level0);
  if (!category?.children) return [];

  const type = category.children.find(t => t.value === level1);
  return type?.children || [];
};

