// ============= ЭТАП 4: НАСТРОЙКИ, МОНИТОРИНГ, ОПТИМИЗАЦИЯ =============

// ========== НАСТРОЙКИ ==========

export type UserRole = 'admin' | 'manager' | 'appraiser' | 'auditor' | 'viewer';
export type Language = 'ru' | 'en';
export type DateFormat = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

// Общие настройки системы
export interface GeneralSettings {
  organizationName: string;
  organizationINN: string;
  systemName: string;
  logo?: string;
  language: Language;
  dateFormat: DateFormat;
  timezone: string;
  currency: string;
  decimalSeparator: '.' | ',';
  thousandsSeparator: ',' | '.' | ' ' | '';
}

// Права доступа роли
export interface RolePermissions {
  roleName: UserRole;
  roleLabel: string;
  // Доступ к модулям
  modules: {
    registry: boolean;
    tasks: boolean;
    reports: boolean;
    mobileAppraiser: boolean;
    smartDeal: boolean;
    upload: boolean;
    monitoring: boolean;
    settings: boolean;
  };
  // Права на операции
  operations: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    export: boolean;
    import: boolean;
    backup: boolean;
  };
  // Видимость полей
  visibleFields: string[];
  // Дополнительные права
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewAllCards: boolean;
  canEditOthersCards: boolean;
}

// Настройки доступа
export interface AccessSettings {
  currentUserRole: UserRole;
  roles: RolePermissions[];
  sessionTimeout: number; // минуты
  maxLoginAttempts: number;
  passwordMinLength: number;
  require2FA: boolean;
}

// Настройки видимости полей
export interface FieldVisibilitySettings {
  // Для каждой роли - список видимых полей
  byRole: Record<UserRole, {
    basicInfo: string[];
    characteristics: string[];
    partners: string[];
    documents: string[];
    evaluation: string[];
    insurance: string[];
  }>;
}

// Элемент справочника
export interface DictionaryItem {
  id: string;
  code?: string;
  name: string;
  parentId?: string;
  order: number;
  active: boolean;
  metadata?: Record<string, any>;
}

// Система справочников
export interface DictionarySettings {
  // Типы недвижимости
  realEstateTypes: DictionaryItem[];
  // Типы движимого имущества
  movableTypes: DictionaryItem[];
  // Материалы конструкций
  constructionMaterials: DictionaryItem[];
  // Состояния объектов
  conditions: DictionaryItem[];
  // Типы документов
  documentTypes: DictionaryItem[];
  // Категории документов
  documentCategories: DictionaryItem[];
  // Типы оценки
  evaluationTypes: DictionaryItem[];
  // Типы страхования
  insuranceTypes: DictionaryItem[];
  // Регионы
  regions: DictionaryItem[];
  // Банки
  banks: DictionaryItem[];
  // Пользовательские справочники
  custom: Record<string, DictionaryItem[]>;
}

// Полные настройки модуля
export interface SettingsModule {
  general: GeneralSettings;
  access: AccessSettings;
  fieldVisibility: FieldVisibilitySettings;
  dictionaries: DictionarySettings;
  lastUpdated: Date;
  updatedBy: string;
}

// ========== МОНИТОРИНГ ==========

export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type AppraisalMonitoringStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type IntegrationStatusType = 'online' | 'offline' | 'error' | 'maintenance';

// Мониторинг осмотров
export interface InspectionMonitoring {
  id: string;
  collateralCardId: string;
  collateralName: string;
  inspectionType: string;
  scheduledDate: Date;
  actualDate?: Date;
  inspector: string;
  status: InspectionStatus;
  daysUntilDue: number;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

// Мониторинг оценок
export interface AppraisalMonitoring {
  id: string;
  collateralCardId: string;
  collateralName: string;
  appraiserId: string;
  appraiserName: string;
  orderId: string;
  orderDate: Date;
  dueDate: Date;
  completionDate?: Date;
  status: AppraisalMonitoringStatus;
  daysOverdue: number;
  currentValue?: number;
}

// Статус объекта
export interface ObjectStatus {
  collateralCardId: string;
  collateralName: string;
  category: string;
  status: string;
  lastInspection?: Date;
  lastEvaluation?: Date;
  nextInspectionDue?: Date;
  nextEvaluationDue?: Date;
  alerts: string[];
  warnings: string[];
}

// Статус интеграции
export interface IntegrationStatus {
  name: string;
  type: 'EGRN' | 'Rosreestr' | 'Bank' | 'Appraiser' | 'Other';
  status: IntegrationStatusType;
  lastCheck: Date;
  responseTime?: number; // мс
  errorMessage?: string;
  requestsToday: number;
  requestsThisMonth: number;
  quota?: {
    daily: number;
    monthly: number;
  };
}

// Модуль мониторинга
export interface MonitoringModule {
  inspections: InspectionMonitoring[];
  appraisals: AppraisalMonitoring[];
  objectStatuses: ObjectStatus[];
  integrations: IntegrationStatus[];
  lastUpdated: Date;
}

// Статистика дашборда
export interface DashboardStatistics {
  // Общая статистика
  totalCards: number;
  activeCards: number;
  archivedCards: number;
  // По категориям
  byCategory: Record<string, number>;
  // По статусам
  byStatus: Record<string, number>;
  // Оценки
  totalEvaluations: number;
  overdueEvaluations: number;
  averageEvaluationTime: number; // дни
  // Осмотры
  totalInspections: number;
  overdueInspections: number;
  inspectionsDueThisWeek: number;
  // Документы
  totalDocuments: number;
  documentsAddedThisMonth: number;
  // Активность
  cardsCreatedThisMonth: number;
  cardsUpdatedToday: number;
  activeUsers: number;
}

// ========== ОБРАБОТКА ОШИБОК ==========

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'validation' | 'network' | 'storage' | 'permission' | 'unknown';

// Информация об ошибке
export interface ErrorInfo {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  details?: string;
  stackTrace?: string;
  component?: string;
  userId?: string;
  action?: string;
  resolved: boolean;
}

// Лог ошибки
export interface ErrorLog {
  errors: ErrorInfo[];
  lastCleared: Date;
}

// ========== ПРОИЗВОДИТЕЛЬНОСТЬ ==========

// Метрики производительности
export interface PerformanceMetrics {
  // Время загрузки
  loadTime: number;
  // Время рендера
  renderTime: number;
  // Использование памяти (если доступно)
  memoryUsage?: number;
  // Количество элементов
  itemsCount: number;
  // FPS (если отслеживается)
  fps?: number;
  // Дата измерения
  measuredAt: Date;
}

// Настройки оптимизации
export interface OptimizationSettings {
  // Включить виртуализацию для больших списков
  enableVirtualization: boolean;
  // Порог для виртуализации
  virtualizationThreshold: number;
  // Включить мемоизацию
  enableMemoization: boolean;
  // Включить lazy loading
  enableLazyLoading: boolean;
  // Размер кэша
  cacheSize: number;
  // Время жизни кэша (минуты)
  cacheTTL: number;
}

// ========== УВЕДОМЛЕНИЯ ==========

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'normal' | 'high';

// Уведомление
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// Настройки уведомлений
export interface NotificationSettings {
  enabled: boolean;
  showDesktopNotifications: boolean;
  playSound: boolean;
  // Типы уведомлений для отображения
  types: {
    inspectionDue: boolean;
    evaluationDue: boolean;
    documentExpiring: boolean;
    systemError: boolean;
    newAssignment: boolean;
  };
}

// ========== АУДИТ ==========

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'export' 
  | 'import' 
  | 'approve' 
  | 'reject'
  | 'login'
  | 'logout';

// Запись аудита
export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  entityType: string; // 'collateral_card', 'document', 'user', etc.
  entityId: string;
  entityName?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress?: string;
  userAgent?: string;
}

// Журнал аудита
export interface AuditLog {
  entries: AuditEntry[];
  retentionDays: number;
  autoCleanup: boolean;
}

// ========== ДЕМО-ДАННЫЕ ==========

// Настройки демо-режима
export interface DemoSettings {
  enabled: boolean;
  autoGenerateData: boolean;
  dataSize: 'small' | 'medium' | 'large';
  includeDocuments: boolean;
  includePartners: boolean;
  resetOnReload: boolean;
}

// ========== ЭКСПОРТ КОНФИГУРАЦИИ ==========

// Полная конфигурация системы для экспорта
export interface SystemConfiguration {
  version: string;
  exportDate: Date;
  settings: SettingsModule;
  optimizations: OptimizationSettings;
  notifications: NotificationSettings;
  demo: DemoSettings;
}

