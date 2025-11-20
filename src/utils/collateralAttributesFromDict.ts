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
  if (!dict) return [];
  
  const groups = new Set<string>();
  dict.items.forEach(item => {
    if (item.metadata?.group) {
      groups.add(item.metadata.group);
    }
  });
  
  return Array.from(groups).sort();
};

/**
 * Получить атрибуты для конкретного типа имущества или группы атрибутов
 * Может принимать как тип имущества, так и группу атрибутов из справочника
 */
export const getAttributesForPropertyType = (propertyTypeOrGroup: string): CollateralAttributeConfig[] => {
  const dict = referenceDataService.getDictionaryByCode('collateral_attributes_zalog');
  if (!dict) return [];
  
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

