// Основные категории объектов
export type MainCategory = 'real_estate' | 'movable' | 'property_rights';

// Статусы карточек
export type CardStatus = 'editing' | 'approved';

// Иерархия недвижимости
export interface RealEstateHierarchy {
  level0: string; // 'Коммерческая недвижимость' | 'Жилая недвижимость' | 'Промышленная недвижимость'
  level1: string; // Основные виды (Квартира, Офис и т.д.)
  level2: string; // 'Здание' | 'Сооружение' | 'Помещение' | 'Земельный участок'
}

// Классификация объекта
export interface ObjectClassification {
  mainCategory: MainCategory;
  hierarchy: RealEstateHierarchy;
  cbCode: number; // Код ЦБ
}

// Базовая карточка залогового объекта
export interface CollateralCard {
  id: string;
  mainCategory: MainCategory;
  classification: RealEstateHierarchy;
  cbCode: number;
  status: CardStatus;
  number: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Параметры фильтрации
export interface FilterParams {
  mainCategory?: MainCategory;
  status?: CardStatus;
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Параметры сортировки
export interface SortParams {
  field: keyof CollateralCard;
  order: 'asc' | 'desc';
}

// Настройки темы
export type ThemeMode = 'light' | 'dark' | 'compact';

export interface AppSettings {
  theme: ThemeMode;
  language: 'ru' | 'en';
  sidebarCollapsed: boolean;
}

// Пункт меню
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  path?: string;
}

// Хлебные крошки
export interface BreadcrumbItem {
  title: string;
  path?: string;
}

// Классификаторы для селектора
export interface ClassificationOption {
  value: string;
  label: string;
  cbCode?: number;
  children?: ClassificationOption[];
}

// Структура базы данных IndexedDB
export interface DatabaseSchema {
  collateralCards: CollateralCard;
  settings: AppSettings & { id: string };
}

// Результат экспорта
export interface ExportResult {
  success: boolean;
  message: string;
  filename?: string;
}

// Результат импорта
export interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}

// ============= ЭТАП 2: РАСШИРЕННЫЕ ТИПЫ =============

// Типы партнеров
export type PartnerType = 'individual' | 'legal'; // Физлицо или Юрлицо
export type PartnerRole = 'owner' | 'pledgor' | 'appraiser' | 'other'; // Роль партнера

// Партнер
export interface Partner {
  id: string;
  type: PartnerType;
  role: PartnerRole;
  // Для физлица
  lastName?: string;
  firstName?: string;
  middleName?: string;
  // Для юрлица
  organizationName?: string;
  // Общие поля
  inn?: string;
  share?: number; // Доля права (%)
  showInRegistry: boolean; // Показывать в реестре
  createdAt: Date;
  updatedAt: Date;
}

// Адрес
export interface Address {
  id: string;
  region?: string;
  district?: string;
  city?: string;
  settlement?: string;
  street?: string;
  house?: string;
  building?: string;
  apartment?: string;
  postalCode?: string;
  fullAddress?: string; // Полный адрес строкой
  cadastralNumber?: string;
  fias?: string; // ФИАС код
}

// Документ
export interface Document {
  id: string;
  name: string;
  type: string; // Тип документа
  size: number; // Размер в байтах
  mimeType: string;
  uploadDate: Date;
  category?: string; // Категория документа
  description?: string;
  fileData?: string; // Base64 для хранения в IndexedDB
}

// Конфигурация поля характеристики
export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'date' | 'textarea';

export interface CharacteristicField {
  name: string;
  type: FieldType;
  label: string;
  required?: boolean;
  options?: string[]; // Для type: 'select'
  min?: number; // Для type: 'number'
  max?: number;
  placeholder?: string;
  unit?: string; // Единица измерения (кв.м, шт и т.д.)
}

// Значения характеристик (динамические)
export type CharacteristicsValues = Record<string, any>;

// Расширенная карточка объекта (полная версия)
export interface ExtendedCollateralCard extends CollateralCard {
  // Партнеры
  partners: Partner[];
  
  // Адрес
  address?: Address;
  
  // Характеристики (динамические)
  characteristics: CharacteristicsValues;
  
  // Документы
  documents: Document[];
  
  // Дополнительная информация
  description?: string;
  notes?: string;
}

// Тип объекта для определения набора характеристик
export type ObjectTypeKey = 
  // Жилая недвижимость
  | 'apartment'
  | 'house'
  | 'townhouse'
  | 'room'
  | 'land_residential'
  
  // Коммерческая недвижимость
  | 'office'
  | 'retail'
  | 'warehouse'
  | 'hotel'
  | 'catering'
  | 'gas_station'
  | 'car_dealership'
  
  // Промышленная
  | 'industrial_building'
  | 'workshop'
  
  // Движимое имущество
  | 'car_passenger'
  | 'car_truck'
  | 'equipment'
  | 'machinery';

// Конфигурация характеристик для типа объекта
export interface ObjectTypeConfig {
  key: ObjectTypeKey;
  name: string;
  fields: CharacteristicField[];
}

// Конфигурация для всех типов объектов
export type CharacteristicsConfig = Record<ObjectTypeKey, CharacteristicField[]>;

// Группировка в таблице
export interface GroupConfig {
  field: string;
  label: string;
}

// Расширенные параметры фильтрации
export interface ExtendedFilterParams extends FilterParams {
  partners?: string[]; // Фильтр по партнерам
  region?: string; // Фильтр по региону
  objectType?: ObjectTypeKey; // Фильтр по типу объекта
  hasDocuments?: boolean; // Есть документы
  areaFrom?: number; // Площадь от
  areaTo?: number; // Площадь до
}

// Структура базы данных (расширенная)
export interface ExtendedDatabaseSchema {
  collateralCards: ExtendedCollateralCard;
  partners: Partner;
  documents: Document;
  settings: AppSettings & { id: string };
}

