/**
 * Типы для системы осмотров CMS Check
 */

export type InspectionType =
  | 'primary' // Первичный осмотр
  | 'periodic' // Периодический осмотр
  | 'unscheduled' // Внеплановый осмотр
  | 'after_repair' // Осмотр после ремонта
  | 'before_loan' // Осмотр перед выдачей кредита
  | 'revaluation' // Осмотр при переоценке
  | 'transfer' // Осмотр при передаче
  | 'write_off' // Осмотр при списании
  | 'sale' // Осмотр при продаже
  | 'accident' // Осмотр при аварии
  | 'complaint' // Осмотр при жалобе
  | 'inventory' // Осмотр при инвентаризации
  | 'audit' // Осмотр при проверке
  | 'monitoring' // Осмотр при мониторинге
  | 'appraisal'; // Осмотр при оценке

export type InspectionStatus = 
  | 'scheduled' // Запланирован
  | 'sent_to_client' // Отправлен клиенту
  | 'in_progress' // В процессе (клиент выполняет)
  | 'submitted_for_review' // Отправлен на проверку
  | 'needs_revision' // Требует доработки
  | 'approved' // Согласован
  | 'completed' // Завершен
  | 'cancelled'; // Отменен

export type InspectorType = 'employee' | 'client'; // Сотрудник банка или клиент

export interface InspectionHistoryItem {
  id: string;
  date: Date;
  action: string; // 'created', 'sent_to_client', 'submitted', 'reviewed', 'approved', 'revision_requested'
  user: string; // Имя пользователя
  userRole: 'creator' | 'inspector' | 'reviewer' | 'approver' | 'client';
  comment?: string;
  status: InspectionStatus;
}

export type ConditionRating = 'excellent' | 'good' | 'satisfactory' | 'poor' | 'critical';

export interface InspectionPhoto {
  id: string;
  url: string; // Base64 или URL
  thumbnailUrl?: string;
  description?: string;
  takenAt: Date;
  location?: string; // Место съемки (например, "Фасад", "Внутри", "Кухня")
  step?: string; // Шаг осмотра (например, "Фасад", "Внутри", "Документы")
  latitude?: number; // Геолокация при съемке
  longitude?: number;
  accuracy?: number; // Точность геолокации в метрах
}

export interface InspectionDefect {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  photos?: string[]; // IDs фотографий
  fixed?: boolean;
  fixedDate?: Date;
  estimatedCost?: number;
}

export interface InspectionRecommendation {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  deadline?: Date;
  completed?: boolean;
  completedDate?: Date;
}

export interface Inspection {
  id: string;
  // Основная информация
  inspectionType: InspectionType;
  status: InspectionStatus;
  inspectionDate: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  
  // Объект осмотра
  collateralCardId: string;
  collateralName: string;
  collateralNumber?: string;
  address?: string;
  
  // Инспектор
  inspectorType: InspectorType; // 'employee' | 'client'
  inspectorId?: string; // ID сотрудника или клиента
  inspectorName: string;
  inspectorPosition?: string;
  inspectorPhone?: string;
  inspectorEmail?: string;
  
  // Для клиента
  clientPhone?: string;
  clientEmail?: string;
  clientLink?: string; // Ссылка для доступа к осмотру
  clientLinkExpiresAt?: Date; // Срок действия ссылки
  geolocationConsent?: boolean; // Согласие на геолокацию
  
  // Результаты осмотра
  condition: ConditionRating;
  overallCondition?: string; // Текстовое описание общего состояния
  
  // Фотографии
  photos: InspectionPhoto[];
  
  // Дефекты
  defects: InspectionDefect[];
  
  // Рекомендации
  recommendations: InspectionRecommendation[];
  
  // Дополнительная информация
  notes?: string;
  weatherConditions?: string; // Погодные условия
  temperature?: number; // Температура
  visibility?: 'excellent' | 'good' | 'poor'; // Видимость
  
  // Технические характеристики (для недвижимости)
  area?: number; // Площадь
  rooms?: number; // Количество комнат
  floor?: number; // Этаж
  totalFloors?: number; // Всего этажей
  
  // Для транспортных средств
  mileage?: number; // Пробег
  vin?: string; // VIN номер
  licensePlate?: string; // Гос. номер
  
  // Документы
  documents?: string[]; // IDs документов
  
  // Метаданные
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  
  // Workflow
  history: InspectionHistoryItem[]; // Хронология действий
  createdByUser?: string; // Кто создал осмотр
  reviewedBy?: string; // Кто проверил
  reviewedAt?: Date;
  approvedBy?: string; // Кто согласовал
  approvedAt?: Date;
  revisionRequestedBy?: string; // Кто запросил доработку
  revisionRequestedAt?: Date;
  revisionComment?: string; // Комментарий к доработке
  
  // Связанные осмотры
  relatedInspectionIds?: string[];
  
  // Приоритет
  priority?: 'low' | 'medium' | 'high';
  
  // Стоимость осмотра
  inspectionCost?: number;
  
  // Время осмотра
  duration?: number; // В минутах
  
  // Координаты места осмотра
  latitude?: number;
  longitude?: number;
  
  // Подпись инспектора
  inspectorSignature?: string; // Base64 изображение подписи
  
  // Согласие собственника
  ownerConsent?: boolean;
  ownerName?: string;
  ownerSignature?: string;
}

