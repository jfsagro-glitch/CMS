/**
 * Утилиты для работы с атрибутами залога из справочника atr1.xlsx
 */

import referenceDataService from '@/services/ReferenceDataService';

export interface CollateralAttributeConfig {
  code: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'directory';
  required: boolean;
  naturalKey: boolean;
  group: string;
  section: string;
}

/**
 * Получить все типы имущества из справочника
 */
export const getPropertyTypes = (): string[] => {
  const dict = referenceDataService.getDictionaryByCode('collateral_attributes_zalog');
  if (!dict) {
    // Фолбэк: базовые типы имущества
    return ['Недвижимость', 'Движимое имущество', 'Имущественные права'];
  }

  const groups = new Set<string>();
  dict.items.forEach(item => {
    if (item.metadata?.group) {
      groups.add(item.metadata.group);
    }
  });

  const result = Array.from(groups).sort();
  if (result.length === 0) {
    // Фолбэк, если группы не определены в справочнике
    return ['Недвижимость', 'Движимое имущество', 'Имущественные права'];
  }
  return result;
};

/**
 * Получить атрибуты для конкретного типа имущества или группы атрибутов
 * Может принимать как тип имущества, так и группу атрибутов из справочника
 */
export const getAttributesForPropertyType = (propertyTypeOrGroup: string): CollateralAttributeConfig[] => {
  const dict = referenceDataService.getDictionaryByCode('collateral_attributes_zalog');
  if (!dict) return getDefaultAttributes(propertyTypeOrGroup);
  
  // Ищем по точному совпадению группы
  let items = dict.items.filter(item => item.metadata?.group === propertyTypeOrGroup);
  
  // Если не нашли, ищем по частичному совпадению
  if (items.length === 0) {
    items = dict.items.filter(item => {
      const group = item.metadata?.group || '';
      return group.toLowerCase().includes(propertyTypeOrGroup.toLowerCase()) ||
             propertyTypeOrGroup.toLowerCase().includes(group.toLowerCase());
    });
  }
  
  // Если все еще не нашли, ищем по коду или названию
  if (items.length === 0) {
    items = dict.items.filter(item => {
      const code = item.code || '';
      const name = item.name || '';
      return code.toLowerCase().includes(propertyTypeOrGroup.toLowerCase()) ||
             name.toLowerCase().includes(propertyTypeOrGroup.toLowerCase());
    });
  }

  // Если пусто — возвращаем фолбэк-набор обязательных атрибутов
  if (items.length === 0) {
    return getDefaultAttributes(propertyTypeOrGroup);
  }

  return items
    .map(item => ({
      code: item.code || '',
      name: item.name,
      type: (item.metadata?.type || 'string').toLowerCase() as CollateralAttributeConfig['type'],
      required: item.metadata?.required === true || item.metadata?.naturalKey === true,
      naturalKey: item.metadata?.naturalKey === true,
      group: item.metadata?.group || '',
      section: item.metadata?.section || '',
    }))
    .sort((a, b) => {
      // Сначала naturalKey, потом по названию
      if (a.naturalKey && !b.naturalKey) return -1;
      if (!a.naturalKey && b.naturalKey) return 1;
      return a.name.localeCompare(b.name);
    });
};

/**
 * Фолбэк-набор необходимых атрибутов, если справочник пуст/не загружен
 */
function getDefaultAttributes(group: string): CollateralAttributeConfig[] {
  const essentials: CollateralAttributeConfig[] = [
    {
      code: 'NAME_OF_PROPERTY',
      name: 'Наименование объекта',
      type: 'string',
      required: true,
      naturalKey: true,
      group,
      section: 'main',
    },
    {
      code: 'OWNER_TIN',
      name: 'ИНН собственника/залогодателя',
      type: 'string',
      required: true,
      naturalKey: false,
      group,
      section: 'main',
    },
    {
      code: 'ADDRESS_BASE',
      name: 'Адрес объекта',
      type: 'string',
      required: true,
      naturalKey: false,
      group,
      section: 'main',
    },
    {
      code: 'TYPE_COLLATERAL',
      name: 'Тип залога',
      type: 'string',
      required: true,
      naturalKey: false,
      group,
      section: 'evaluation',
    },
    {
      code: 'HAVEL_MARKET',
      name: 'Рыночная стоимость',
      type: 'number',
      required: true,
      naturalKey: false,
      group,
      section: 'evaluation',
    },
  ];
  return essentials;
}
/**
 * Распределить атрибуты по вкладкам
 */
export const distributeAttributesByTabs = (attributes: CollateralAttributeConfig[]) => {
  const mainTab: CollateralAttributeConfig[] = [];
  const characteristicsTab: CollateralAttributeConfig[] = [];
  const evaluationTab: CollateralAttributeConfig[] = [];
  const documentsTab: CollateralAttributeConfig[] = [];
  
  // Основные атрибуты для главной вкладки
  const mainAttributes = ['NAME_OF_PROPERTY', 'OWNER_TIN', 'ADDRESS_BASE'];
  
  // Атрибуты для оценки
  const evaluationAttributes = ['TYPE_COLLATERAL', 'HAVEL_MARKET'];
  
  attributes.forEach(attr => {
    if (mainAttributes.includes(attr.code)) {
      mainTab.push(attr);
    } else if (evaluationAttributes.includes(attr.code)) {
      evaluationTab.push(attr);
    } else if (attr.code.includes('DOCUMENT') || attr.code.includes('FILE')) {
      documentsTab.push(attr);
    } else {
      characteristicsTab.push(attr);
    }
  });
  
  return {
    main: mainTab,
    characteristics: characteristicsTab,
    evaluation: evaluationTab,
    documents: documentsTab,
  };
};

