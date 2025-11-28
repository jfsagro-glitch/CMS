/**
 * Утилита для определения требований к типам объектов залога
 * На основе таблицы: осмотр и выписка ЕГРН
 */

export interface ObjectTypeRequirement {
  typeName: string;
  requiresInspection: boolean;
  requiresEgrn: boolean;
}

/**
 * Маппинг типов объектов на требования
 * Ключ - название типа объекта (level2 из классификации)
 */
export const OBJECT_TYPE_REQUIREMENTS: Record<string, ObjectTypeRequirement> = {
  // Недвижимость - требует осмотр и ЕГРН
  'Здание': { typeName: 'Здание', requiresInspection: true, requiresEgrn: true },
  'Земельный участок': { typeName: 'Земельный участок', requiresInspection: true, requiresEgrn: true },
  'Помещение': { typeName: 'Помещение', requiresInspection: true, requiresEgrn: true },
  'Сооружение': { typeName: 'Сооружение', requiresInspection: true, requiresEgrn: true },
  'Машино-место': { typeName: 'Машино-место', requiresInspection: true, requiresEgrn: true },
  'Единый недвижимый комплекс': { typeName: 'Единый недвижимый комплекс', requiresInspection: true, requiresEgrn: true },
  'Имущественный комплекс': { typeName: 'Имущественный комплекс', requiresInspection: true, requiresEgrn: true },
  'Объект незавершенного строительства': { typeName: 'Объект незавершенного строительства', requiresInspection: true, requiresEgrn: true },
  'Недвижимое имущество и права аренды недвижимого имущества': { typeName: 'Недвижимое имущество и права аренды недвижимого имущества', requiresInspection: true, requiresEgrn: true },
  
  // Движимое имущество - требует осмотр, но не ЕГРН
  'Воздушные суда': { typeName: 'Воздушные суда', requiresInspection: true, requiresEgrn: false },
  'Все имущество залогодателя': { typeName: 'Все имущество залогодателя', requiresInspection: true, requiresEgrn: false },
  'Железнодорожный подвижной состав': { typeName: 'Железнодорожный подвижной состав', requiresInspection: true, requiresEgrn: false },
  'Космические объекты': { typeName: 'Космические объекты', requiresInspection: true, requiresEgrn: false },
  'Машины и оборудование': { typeName: 'Машины и оборудование', requiresInspection: true, requiresEgrn: false },
  'Наземные безрельсовые механические транспортные средства, прицепы': { typeName: 'Наземные безрельсовые механические транспортные средства, прицепы', requiresInspection: true, requiresEgrn: false },
  'Плавучие сооружения': { typeName: 'Плавучие сооружения', requiresInspection: true, requiresEgrn: false },
  'Плавучие сооружения, не являющиеся судами': { typeName: 'Плавучие сооружения, не являющиеся судами', requiresInspection: true, requiresEgrn: false },
  'Прочие движимые вещи': { typeName: 'Прочие движимые вещи', requiresInspection: true, requiresEgrn: false },
  'Суда, используемые для иных целей': { typeName: 'Суда, используемые для иных целей', requiresInspection: true, requiresEgrn: false },
  'Суда, используемые для перевозки грузов, и (или) буксировки, а также хранения грузов': { typeName: 'Суда, используемые для перевозки грузов, и (или) буксировки, а также хранения грузов', requiresInspection: true, requiresEgrn: false },
  'Суда, используемые для перевозки пассажиров и их багажа': { typeName: 'Суда, используемые для перевозки пассажиров и их багажа', requiresInspection: true, requiresEgrn: false },
  'Суда, используемые для рыболовства': { typeName: 'Суда, используемые для рыболовства', requiresInspection: true, requiresEgrn: false },
  'Товары в обороте': { typeName: 'Товары в обороте', requiresInspection: true, requiresEgrn: false },
  
  // Имущественные права - не требуют осмотр и ЕГРН
  'Аффинированные драгоценные металлы в слитках': { typeName: 'Аффинированные драгоценные металлы в слитках', requiresInspection: false, requiresEgrn: false },
  'Будущий урожай': { typeName: 'Будущий урожай', requiresInspection: false, requiresEgrn: false },
  'Векселя': { typeName: 'Векселя', requiresInspection: false, requiresEgrn: false },
  'Доли в уставных капиталах обществ с ограниченной ответственностью': { typeName: 'Доли в уставных капиталах обществ с ограниченной ответственностью', requiresInspection: false, requiresEgrn: false },
  'Инвестиционные паи (паи инвестиционных фондов)': { typeName: 'Инвестиционные паи (паи инвестиционных фондов)', requiresInspection: false, requiresEgrn: false },
  'Ипотечные сертификаты участия': { typeName: 'Ипотечные сертификаты участия', requiresInspection: false, requiresEgrn: false },
  'Исключительные права на интеллектуальную собственность': { typeName: 'Исключительные права на интеллектуальную собственность', requiresInspection: false, requiresEgrn: false },
  'Права по договору банковского счета': { typeName: 'Права по договору банковского счета', requiresInspection: false, requiresEgrn: false },
  'Прочие имущественные Права требования': { typeName: 'Прочие имущественные Права требования', requiresInspection: false, requiresEgrn: false },
  'Прочие ценные бумаги': { typeName: 'Прочие ценные бумаги', requiresInspection: false, requiresEgrn: false },
  'Эмиссионные ценные бумаги': { typeName: 'Эмиссионные ценные бумаги', requiresInspection: false, requiresEgrn: false },
};

/**
 * Проверяет, требуется ли осмотр для типа объекта
 * @param objectType - тип объекта (level2 из классификации)
 * @returns true, если требуется осмотр
 */
export function requiresInspection(objectType: string | undefined | null): boolean {
  if (!objectType) return false;
  
  // Ищем точное совпадение
  const requirement = OBJECT_TYPE_REQUIREMENTS[objectType];
  if (requirement) {
    return requirement.requiresInspection;
  }
  
  // Если точного совпадения нет, проверяем частичное совпадение
  const normalizedType = objectType.trim();
  for (const [key, value] of Object.entries(OBJECT_TYPE_REQUIREMENTS)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return value.requiresInspection;
    }
  }
  
  // По умолчанию для недвижимости - требуется осмотр
  if (normalizedType.toLowerCase().includes('здание') || 
      normalizedType.toLowerCase().includes('помещение') ||
      normalizedType.toLowerCase().includes('участок') ||
      normalizedType.toLowerCase().includes('сооружение')) {
    return true;
  }
  
  return false;
}

/**
 * Проверяет, требуется ли выписка ЕГРН для типа объекта
 * @param objectType - тип объекта (level2 из классификации)
 * @returns true, если требуется выписка ЕГРН
 */
export function requiresEgrn(objectType: string | undefined | null): boolean {
  if (!objectType) return false;
  
  // Ищем точное совпадение
  const requirement = OBJECT_TYPE_REQUIREMENTS[objectType];
  if (requirement) {
    return requirement.requiresEgrn;
  }
  
  // Если точного совпадения нет, проверяем частичное совпадение
  const normalizedType = objectType.trim();
  for (const [key, value] of Object.entries(OBJECT_TYPE_REQUIREMENTS)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return value.requiresEgrn;
    }
  }
  
  // По умолчанию для недвижимости - требуется ЕГРН
  if (normalizedType.toLowerCase().includes('здание') || 
      normalizedType.toLowerCase().includes('помещение') ||
      normalizedType.toLowerCase().includes('участок') ||
      normalizedType.toLowerCase().includes('сооружение') ||
      normalizedType.toLowerCase().includes('машино-место')) {
    return true;
  }
  
  return false;
}

/**
 * Получает требования для типа объекта
 * @param objectType - тип объекта (level2 из классификации)
 * @returns требования или null, если тип не найден
 */
export function getObjectTypeRequirement(objectType: string | undefined | null): ObjectTypeRequirement | null {
  if (!objectType) return null;
  
  const requirement = OBJECT_TYPE_REQUIREMENTS[objectType];
  if (requirement) {
    return requirement;
  }
  
  // Поиск по частичному совпадению
  const normalizedType = objectType.trim();
  for (const [key, value] of Object.entries(OBJECT_TYPE_REQUIREMENTS)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return value;
    }
  }
  
  return null;
}

