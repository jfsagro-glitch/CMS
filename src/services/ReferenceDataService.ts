/**
 * Сервис для управления справочниками системы
 */

const STORAGE_KEY = 'cms_reference_data';

export interface ReferenceItem {
  id: string;
  code?: string; // Код (опционально)
  name: string; // Наименование
  description?: string; // Описание
  isActive: boolean; // Активен ли элемент
  sortOrder?: number; // Порядок сортировки
  metadata?: Record<string, any>; // Дополнительные данные
}

export interface ReferenceDictionary {
  id: string; // ID справочника
  name: string; // Название справочника
  code: string; // Код справочника (для использования в коде)
  description?: string; // Описание справочника
  items: ReferenceItem[]; // Элементы справочника
  createdAt: string;
  updatedAt: string;
}

class ReferenceDataService {
  /**
   * Получить все справочники
   */
  getDictionaries(): ReferenceDictionary[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Возвращаем справочники по умолчанию
        return this.getDefaultDictionaries();
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Ошибка загрузки справочников:', error);
      return this.getDefaultDictionaries();
    }
  }

  /**
   * Сохранить справочники
   */
  saveDictionaries(dictionaries: ReferenceDictionary[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dictionaries));
    } catch (error) {
      console.error('Ошибка сохранения справочников:', error);
    }
  }

  /**
   * Получить справочник по ID
   */
  getDictionaryById(id: string): ReferenceDictionary | undefined {
    const dictionaries = this.getDictionaries();
    return dictionaries.find(dict => dict.id === id);
  }

  /**
   * Получить справочник по коду
   */
  getDictionaryByCode(code: string): ReferenceDictionary | undefined {
    const dictionaries = this.getDictionaries();
    return dictionaries.find(dict => dict.code === code);
  }

  /**
   * Обновить справочник
   */
  updateDictionary(id: string, updates: Partial<ReferenceDictionary>): ReferenceDictionary | null {
    const dictionaries = this.getDictionaries();
    const index = dictionaries.findIndex(dict => dict.id === id);
    if (index === -1) return null;

    dictionaries[index] = {
      ...dictionaries[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveDictionaries(dictionaries);
    return dictionaries[index];
  }

  /**
   * Добавить элемент в справочник
   */
  addItemToDictionary(dictionaryId: string, item: Omit<ReferenceItem, 'id'>): ReferenceItem | null {
    const dictionaries = this.getDictionaries();
    const dictIndex = dictionaries.findIndex(dict => dict.id === dictionaryId);
    if (dictIndex === -1) return null;

    const newItem: ReferenceItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    dictionaries[dictIndex].items.push(newItem);
    dictionaries[dictIndex].updatedAt = new Date().toISOString();
    this.saveDictionaries(dictionaries);
    return newItem;
  }

  /**
   * Обновить элемент справочника
   */
  updateItemInDictionary(
    dictionaryId: string,
    itemId: string,
    updates: Partial<ReferenceItem>
  ): ReferenceItem | null {
    const dictionaries = this.getDictionaries();
    const dictIndex = dictionaries.findIndex(dict => dict.id === dictionaryId);
    if (dictIndex === -1) return null;

    const itemIndex = dictionaries[dictIndex].items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;

    dictionaries[dictIndex].items[itemIndex] = {
      ...dictionaries[dictIndex].items[itemIndex],
      ...updates,
    };
    dictionaries[dictIndex].updatedAt = new Date().toISOString();
    this.saveDictionaries(dictionaries);
    return dictionaries[dictIndex].items[itemIndex];
  }

  /**
   * Удалить элемент из справочника
   */
  deleteItemFromDictionary(dictionaryId: string, itemId: string): boolean {
    const dictionaries = this.getDictionaries();
    const dictIndex = dictionaries.findIndex(dict => dict.id === dictionaryId);
    if (dictIndex === -1) return false;

    const initialLength = dictionaries[dictIndex].items.length;
    dictionaries[dictIndex].items = dictionaries[dictIndex].items.filter(item => item.id !== itemId);
    
    if (dictionaries[dictIndex].items.length === initialLength) return false;
    
    dictionaries[dictIndex].updatedAt = new Date().toISOString();
    this.saveDictionaries(dictionaries);
    return true;
  }

  /**
   * Получить активные элементы справочника по коду
   */
  getActiveItemsByCode(code: string): ReferenceItem[] {
    const dictionary = this.getDictionaryByCode(code);
    if (!dictionary) return [];
    return dictionary.items.filter(item => item.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  /**
   * Справочники по умолчанию
   */
  private getDefaultDictionaries(): ReferenceDictionary[] {
    const now = new Date().toISOString();
    
    const defaultDictionaries: ReferenceDictionary[] = [
      {
        id: 'dict-regions',
        name: 'Регионы',
        code: 'regions',
        description: 'Справочник регионов',
        items: [
          { id: 'reg-1', name: 'Москва', isActive: true, sortOrder: 1 },
          { id: 'reg-2', name: 'Санкт-Петербург', isActive: true, sortOrder: 2 },
          { id: 'reg-3', name: 'Новосибирск', isActive: true, sortOrder: 3 },
          { id: 'reg-4', name: 'Екатеринбург', isActive: true, sortOrder: 4 },
          { id: 'reg-5', name: 'Казань', isActive: true, sortOrder: 5 },
          { id: 'reg-6', name: 'Нижний Новгород', isActive: true, sortOrder: 6 },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'dict-segments',
        name: 'Сегменты бизнеса',
        code: 'segments',
        description: 'Сегменты бизнеса для портфеля',
        items: [
          { id: 'seg-1', name: 'Корпоративный', isActive: true, sortOrder: 1 },
          { id: 'seg-2', name: 'Малый бизнес', isActive: true, sortOrder: 2 },
          { id: 'seg-3', name: 'Средний бизнес', isActive: true, sortOrder: 3 },
          { id: 'seg-4', name: 'Розничный', isActive: true, sortOrder: 4 },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'dict-groups',
        name: 'Группы',
        code: 'groups',
        description: 'Группы портфеля',
        items: [
          { id: 'grp-1', name: 'Группа 1', isActive: true, sortOrder: 1 },
          { id: 'grp-2', name: 'Группа 2', isActive: true, sortOrder: 2 },
          { id: 'grp-3', name: 'Группа 3', isActive: true, sortOrder: 3 },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'dict-liquidity',
        name: 'Ликвидность',
        code: 'liquidity',
        description: 'Уровни ликвидности обеспечения',
        items: [
          { id: 'liq-1', name: 'высокая (срок реализации до 90 дней)', isActive: true, sortOrder: 1 },
          { id: 'liq-2', name: 'удовлетворительная (срок реализации до 365 дней)', isActive: true, sortOrder: 2 },
          { id: 'liq-3', name: 'низкая (срок реализации свыше 365 дней)', isActive: true, sortOrder: 3 },
          { id: 'liq-4', name: 'малоудовлетворительная', isActive: true, sortOrder: 4 },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'dict-collateral-categories',
        name: 'Категории обеспечения',
        code: 'collateral_categories',
        description: 'Категории обеспечения из карточек сделок',
        items: [
          { id: 'cat-1', name: 'договор залога движимого имущества/оборудования', isActive: true, sortOrder: 1 },
          { id: 'cat-2', name: 'договор залога недвижимого имущества', isActive: true, sortOrder: 2 },
          { id: 'cat-3', name: 'договор ипотеки', isActive: true, sortOrder: 3 },
          { id: 'cat-4', name: 'договор залога транспортных средств', isActive: true, sortOrder: 4 },
          { id: 'cat-5', name: 'договор залога товаров в обороте', isActive: true, sortOrder: 5 },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'dict-monitoring-types',
        name: 'Типы мониторинга',
        code: 'monitoring_types',
        description: 'Типы мониторинга обеспечения',
        items: [
          { id: 'mon-1', name: 'Плановый', isActive: true, sortOrder: 1 },
          { id: 'mon-2', name: 'Внеплановый', isActive: true, sortOrder: 2 },
          { id: 'mon-3', name: 'Внеочередной', isActive: true, sortOrder: 3 },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'dict-quality-categories',
        name: 'Категории качества обеспечения',
        code: 'quality_categories',
        description: 'Категории качества обеспечения',
        items: [
          { id: 'qual-1', name: 'I категория', isActive: true, sortOrder: 1 },
          { id: 'qual-2', name: 'II категория', isActive: true, sortOrder: 2 },
          { id: 'qual-3', name: 'III категория', isActive: true, sortOrder: 3 },
          { id: 'qual-4', name: 'IV категория', isActive: true, sortOrder: 4 },
          { id: 'qual-5', name: 'V категория', isActive: true, sortOrder: 5 },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Сохраняем справочники по умолчанию при первом запуске
    this.saveDictionaries(defaultDictionaries);
    return defaultDictionaries;
  }
}

const referenceDataService = new ReferenceDataService();
export default referenceDataService;

