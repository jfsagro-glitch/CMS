// Основные категории объектов
export type MainCategory = 'real_estate' | 'movable' | 'property_rights';

// Статусы карточек
export type CardStatus = 'editing' | 'approved' | 'archived';

// Роли пользователей
export type UserRole = 'business' | 'employee' | 'manager' | 'superuser';

// Сотрудник
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
  attributeLevels?: {
    level1?: string; // Вид обеспечения
    level2?: string; // Тип обеспечения
    level3?: string; // Подтип обеспечения
    level4?: string; // Функциональная группа обеспечения
    level5?: string; // Функциональная подгруппа обеспечения
  };
  characteristics?: Record<string, any>; // Динамические характеристики
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
  external?: boolean;
  tooltip?: string;
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
  shortName?: string; // Сокращенное наименование
  // Общие поля
  inn?: string;
  share?: number; // Доля права (%)
  showInRegistry: boolean; // Показывать в реестре
  createdAt: Date;
  updatedAt: Date;
  // Поля для отчета 0409310
  subjectId?: string; // Идентификационный код субъекта
  countryCode?: string; // Код страны по ОКСМ (643 для РФ)
  // Для юридических лиц
  ogrn?: string; // ОГРН
  kio?: string; // КИО (для нерезидентов)
  tin?: string; // TIN (Tax Identification Number для нерезидентов)
  lei?: string; // LEI (Legal Entity Identifier для нерезидентов)
  registrationNumber?: string; // Регистрационный номер в стране регистрации (NUM)
  // Для физических лиц
  personType?: 'individual' | 'entrepreneur' | 'private_practice'; // Тип физического лица
  ogrnip?: string; // ОГРНИП (для ИП)
  // Паспортные данные
  passportType?: string; // Код документа (21 - паспорт РФ, 31 - паспорт иностранца, 00 - иное)
  passportSeries?: string; // Серия документа
  passportNumber?: string; // Номер документа
  // Для кредитных организаций
  registrationNumberCBR?: string; // Регистрационный номер кредитной организации, присвоенный Банком России
  bik?: string; // БИК
  swift?: string; // СВИФТ
}

// Адрес
export interface Address {
  id?: string;
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
  coordinates?: {
    lat: number;
    lon: number;
  };
  // Поля для отчета 0409310
  countryCode?: string; // Код страны по ОКСМ (643 для РФ)
  okato?: string; // Код территории по ОКАТО (11 разрядов)
  letter?: string; // Литера (при наличии)
  otherInfo?: string; // Иные сведения о местоположении
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
  partners?: Partner[];

  // Адрес
  address?: Address;

  // Характеристики (динамические)
  characteristics?: CharacteristicsValues;

  // Документы
  documents?: Document[] | any[];

  // Стоимость
  marketValue?: number;
  pledgeValue?: number;
  evaluationDate?: string; // Дата оценки
  lastEvaluationDate?: string; // Дата последней оценки
  nextEvaluationDate?: string; // Дата следующей оценки
  // Поля для отчета 0409310 - стоимости
  fairValue?: number; // Справедливая стоимость
  fairValueDate?: string; // Дата определения справедливой стоимости
  marketValueDate?: string; // Дата определения рыночной стоимости
  cadastralValue?: number; // Кадастровая стоимость (для недвижимости)
  cadastralValueDate?: string; // Дата определения кадастровой стоимости
  liquidationValue?: number; // Ликвидационная стоимость
  liquidationValueDate?: string; // Дата определения ликвидационной стоимости
  investmentValue?: number; // Инвестиционная стоимость
  investmentValueDate?: string; // Дата определения инвестиционной стоимости
  contractValue?: number; // Стоимость, указанная в договоре залога
  contractValueDate?: string; // Дата определения стоимости по договору
  reserveAmount?: number; // Сумма обеспечения для резерва на возможные потери по ссуде
  reserveAmountInterest?: number; // Сумма обеспечения для резерва по процентным доходам
  reserveAmountContingent?: number; // Сумма обеспечения для резерва по условным обязательствам

  // Мониторинг
  monitoringDate?: string; // Дата последнего мониторинга
  nextMonitoringDate?: string; // Дата следующего мониторинга
  monitoringFrequencyMonths?: number; // Периодичность мониторинга в месяцах

  // Собственник
  owner?: {
    name: string;
    inn: string;
    type: 'legal' | 'individual';
  };

  // Фото
  photos?: any[];

  // Дополнительная информация
  description?: string;
  notes?: string;

  // Связь с портфелем (для сквозных ссылок)
  reference?: string | number; // REFERENCE сделки из портфеля
  contractNumber?: string; // Номер договора залога
  contractId?: string; // ID договора для навигации
  // Поля для отчета 0409310
  collateralId?: string; // Идентификационный код принятого обеспечения
  loanContractId?: string; // Идентификационный код договора о предоставлении ссуды
  pledgeContractId?: string; // Идентификационный код договора залога
  accountNumber?: string; // Лицевой счет, на котором учитывается принятое обеспечение
  qualityCategory?: string; // Категория качества обеспечения (1-5)

  // Тип имущества из справочника атрибутов залога
  propertyType?: string; // Например: "Будущий урожай", "Аффинированные драгоценные металлы в слитках"

  // Выписка ЕГРН (для недвижимости)
  egrnStatementDate?: string; // Дата выписки ЕГРН
  egrnStatementId?: string; // ID выписки ЕГРН в модуле ЕГРН

  // Отлагательные условия
  suspensiveConditions?: string; // Отлагательные условия по данному имуществу
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
