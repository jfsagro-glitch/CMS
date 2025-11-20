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
 * Получить атрибуты для конкретного типа имущества
 */
export const getAttributesForPropertyType = (propertyType: string): CollateralAttributeConfig[] => {
  const dict = referenceDataService.getDictionaryByCode('collateral_attributes_zalog');
  if (!dict) return [];
  
  return dict.items
    .filter(item => item.metadata?.group === propertyType)
    .map(item => ({
      code: item.code || '',
      name: item.name,
      type: (item.metadata?.type || 'string').toLowerCase() as CollateralAttributeConfig['type'],
      required: item.metadata?.required === true || item.metadata?.naturalKey === true,
      naturalKey: item.metadata?.naturalKey === true,
      group: item.metadata?.group || '',
      section: item.metadata?.section || '',
    }))
    .sort((a, b) => (a.naturalKey ? -1 : 0) - (b.naturalKey ? -1 : 0));
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

