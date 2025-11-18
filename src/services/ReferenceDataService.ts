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
          { id: 'seg-1', code: 'МБ', name: 'МБ (Малый бизнес)', isActive: true, sortOrder: 1 },
          { id: 'seg-2', code: 'СРБ', name: 'СРБ (Средний бизнес)', isActive: true, sortOrder: 2 },
          { id: 'seg-3', code: 'КБ', name: 'КБ (Крупный бизнес)', isActive: true, sortOrder: 3 },
          { id: 'seg-4', name: 'Корпоративный', isActive: true, sortOrder: 4 },
          { id: 'seg-5', name: 'Розничный', isActive: true, sortOrder: 5 },
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
      {
        id: 'dict-collateral-attributes',
        name: 'Атрибуты залогового имущества',
        code: 'collateral_attributes',
        description: 'Справочник атрибутов для различных типов залогового имущества',
        items: [
          // Общие атрибуты
          { id: 'attr-1', code: 'collateralName', name: 'Наименование, назначение', description: 'Тип: text, Группа: Основная информация', isActive: true, sortOrder: 1, metadata: { type: 'text', group: 'Основная информация', required: true } },
          { id: 'attr-2', code: 'collateralLocation', name: 'Адрес местоположения', description: 'Тип: text, Группа: Основная информация', isActive: true, sortOrder: 2, metadata: { type: 'text', group: 'Основная информация', required: true } },
          { id: 'attr-3', code: 'ownershipShare', name: 'Оцениваемые права, доля в праве %', description: 'Тип: number, Группа: Основная информация, Единица: %', isActive: true, sortOrder: 3, metadata: { type: 'number', group: 'Основная информация', unit: '%', min: 0, max: 100 } },
          { id: 'attr-4', code: 'marketValue', name: 'Рыночная стоимость', description: 'Тип: number, Группа: Оценка, Единица: руб.', isActive: true, sortOrder: 4, metadata: { type: 'number', group: 'Оценка', unit: 'руб.', min: 0 } },
          { id: 'attr-5', code: 'collateralValue', name: 'Залоговая стоимость', description: 'Тип: number, Группа: Оценка, Единица: руб.', isActive: true, sortOrder: 5, metadata: { type: 'number', group: 'Оценка', unit: 'руб.', min: 0 } },
          { id: 'attr-6', code: 'fairValue', name: 'Справедливая стоимость', description: 'Тип: number, Группа: Оценка, Единица: руб.', isActive: true, sortOrder: 6, metadata: { type: 'number', group: 'Оценка', unit: 'руб.', min: 0 } },
          { id: 'attr-7', code: 'liquidity', name: 'Ликвидность', description: 'Тип: select, Группа: Характеристики', isActive: true, sortOrder: 7, metadata: { type: 'select', group: 'Характеристики', options: ['высокая (срок реализации до 90 дней)', 'удовлетворительная (срок реализации до 365 дней)', 'низкая (срок реализации свыше 365 дней)', 'малоудовлетворительная'] } },
          { id: 'attr-8', code: 'collateralCondition', name: 'Состояние имущества', description: 'Тип: select, Группа: Характеристики', isActive: true, sortOrder: 8, metadata: { type: 'select', group: 'Характеристики', options: ['хорошее', 'удовлетворительное', 'неудовлетворительное'] } },
          
          // Атрибуты недвижимости
          { id: 'attr-9', code: 'totalAreaSqm', name: 'Общая площадь объекта, кв. м.', description: 'Тип: number, Группа: Параметры объекта, Единица: кв.м', isActive: true, sortOrder: 10, metadata: { type: 'number', group: 'Параметры объекта', unit: 'кв.м', min: 0, required: true } },
          { id: 'attr-10', code: 'objectCadastralNumber', name: 'Кадастровый номер объекта', description: 'Тип: text, Группа: Параметры объекта', isActive: true, sortOrder: 11, metadata: { type: 'text', group: 'Параметры объекта' } },
          { id: 'attr-11', code: 'landCadastralNumber', name: 'Кадастровый номер земельного участка', description: 'Тип: text, Группа: Земельный участок', isActive: true, sortOrder: 12, metadata: { type: 'text', group: 'Земельный участок' } },
          { id: 'attr-12', code: 'landCategory', name: 'Категория земель', description: 'Тип: select, Группа: Земельный участок', isActive: true, sortOrder: 13, metadata: { type: 'select', group: 'Земельный участок', options: ['Земли водного фонда', 'Земли запаса', 'Земли лесного фонда', 'Земли населенных пунктов', 'Земли особоохраняемых территорий', 'Земли промышленности, энергетики, тр', 'Земли сельскохозяйственного назначен', 'Категория не установлена'] } },
          { id: 'attr-13', code: 'landAreaSqm', name: 'Площадь земельного участка', description: 'Тип: number, Группа: Земельный участок, Единица: кв.м', isActive: true, sortOrder: 14, metadata: { type: 'number', group: 'Земельный участок', unit: 'кв.м', min: 0 } },
          { id: 'attr-14', code: 'buildYear', name: 'Год строительства', description: 'Тип: number, Группа: Параметры объекта', isActive: true, sortOrder: 15, metadata: { type: 'number', group: 'Параметры объекта', min: 1800 } },
          { id: 'attr-15', code: 'wallMaterial', name: 'Материал стен', description: 'Тип: select, Группа: Параметры объекта', isActive: true, sortOrder: 16, metadata: { type: 'select', group: 'Параметры объекта', options: ['Кирпич', 'Панель', 'Монолит', 'Блочный', 'Дерево', 'Кирпичный/Сталинский', 'Пенобетонные/Газобетонное блоки', 'Деревянные', 'Металлические без утепления', 'Монолит/Монолит-кирпич', 'Панельный/блочный', 'Сэндвич панели'] } },
          { id: 'attr-16', code: 'ceilingMaterial', name: 'Материал перекрытий', description: 'Тип: select, Группа: Параметры объекта', isActive: true, sortOrder: 17, metadata: { type: 'select', group: 'Параметры объекта', options: ['Деревянные балки', 'Металлические балки', 'ж/б'] } },
          { id: 'attr-17', code: 'finishLevel', name: 'Тип отделки', description: 'Тип: select, Группа: Состояние', isActive: true, sortOrder: 18, metadata: { type: 'select', group: 'Состояние', options: ['Евроремонт', 'Неизвестно', 'Простая', 'Среднее', 'Требуется кап. ремонт/Без отделки', 'Улучшенная'] } },
          { id: 'attr-18', code: 'finishCondition', name: 'Состояние отделки', description: 'Тип: select, Группа: Состояние', isActive: true, sortOrder: 19, metadata: { type: 'select', group: 'Состояние', options: ['Без отделки', 'Требуется кап.ремонт', 'Требуется косметический ремонт', 'Удовлетворительное', 'Хорошее'] } },
          { id: 'attr-19', code: 'replanning', name: 'Тип перепланировки', description: 'Тип: select, Группа: Состояние', isActive: true, sortOrder: 20, metadata: { type: 'select', group: 'Состояние', options: ['Несущественные', 'Перепланировки отсутствуют', 'Существенные'] } },
          { id: 'attr-20', code: 'ownershipRight', name: 'Вид права', description: 'Тип: select, Группа: Права', isActive: true, sortOrder: 21, metadata: { type: 'select', group: 'Права', options: ['Иное', 'Право аренды', 'Право собственности'] } },
          
          // Атрибуты транспортных средств
          { id: 'attr-21', code: 'brand', name: 'Марка ТС', description: 'Тип: text, Группа: Основная информация', isActive: true, sortOrder: 30, metadata: { type: 'text', group: 'Основная информация', required: true } },
          { id: 'attr-22', code: 'model', name: 'Модель', description: 'Тип: text, Группа: Основная информация', isActive: true, sortOrder: 31, metadata: { type: 'text', group: 'Основная информация', required: true } },
          { id: 'attr-23', code: 'year', name: 'Год выпуска', description: 'Тип: number, Группа: Основная информация', isActive: true, sortOrder: 32, metadata: { type: 'number', group: 'Основная информация', required: true, min: 1900 } },
          { id: 'attr-24', code: 'vin', name: 'Идентификационный номер (VIN)', description: 'Тип: text, Группа: Основная информация', isActive: true, sortOrder: 33, metadata: { type: 'text', group: 'Основная информация' } },
          { id: 'attr-25', code: 'registrationNumber', name: 'Государственный регистрационный номер', description: 'Тип: text, Группа: Основная информация', isActive: true, sortOrder: 34, metadata: { type: 'text', group: 'Основная информация' } },
          { id: 'attr-26', code: 'engineVolume', name: 'Объем двигателя', description: 'Тип: number, Группа: Технические характеристики, Единица: куб.см', isActive: true, sortOrder: 35, metadata: { type: 'number', group: 'Технические характеристики', unit: 'куб.см', min: 0 } },
          { id: 'attr-27', code: 'enginePower', name: 'Мощность двигателя (л.с.)', description: 'Тип: number, Группа: Технические характеристики, Единица: л.с.', isActive: true, sortOrder: 36, metadata: { type: 'number', group: 'Технические характеристики', unit: 'л.с.', min: 0 } },
          { id: 'attr-28', code: 'fuelType', name: 'Тип топлива', description: 'Тип: select, Группа: Технические характеристики', isActive: true, sortOrder: 37, metadata: { type: 'select', group: 'Технические характеристики', options: ['Бензин', 'Дизель', 'Гибрид', 'Электро', 'Газ'] } },
          { id: 'attr-29', code: 'transmission', name: 'Коробка передач', description: 'Тип: select, Группа: Технические характеристики', isActive: true, sortOrder: 38, metadata: { type: 'select', group: 'Технические характеристики', options: ['Механическая', 'Автоматическая', 'Робот', 'Вариатор'] } },
          { id: 'attr-30', code: 'mileage', name: 'Показания одометра', description: 'Тип: number, Группа: Технические характеристики, Единица: км', isActive: true, sortOrder: 39, metadata: { type: 'number', group: 'Технические характеристики', unit: 'км', min: 0 } },
          
          // Атрибуты оборудования
          { id: 'attr-31', code: 'manufacturer', name: 'Предприятие - изготовитель', description: 'Тип: text, Группа: Основная информация', isActive: true, sortOrder: 50, metadata: { type: 'text', group: 'Основная информация' } },
          { id: 'attr-32', code: 'serialNumber', name: 'Заводской номер', description: 'Тип: text, Группа: Основная информация', isActive: true, sortOrder: 51, metadata: { type: 'text', group: 'Основная информация' } },
          { id: 'attr-33', code: 'inventoryNumber', name: 'Инвентарный номер', description: 'Тип: text, Группа: Основная информация', isActive: true, sortOrder: 52, metadata: { type: 'text', group: 'Основная информация' } },
          { id: 'attr-34', code: 'power', name: 'Мощность', description: 'Тип: number, Группа: Технические характеристики, Единица: кВт', isActive: true, sortOrder: 53, metadata: { type: 'number', group: 'Технические характеристики', unit: 'кВт', min: 0 } },
          { id: 'attr-35', code: 'operatingHours', name: 'Наработка (при наличии)', description: 'Тип: number, Группа: Технические характеристики, Единица: моточасов', isActive: true, sortOrder: 54, metadata: { type: 'number', group: 'Технические характеристики', unit: 'моточасов', min: 0 } },
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

