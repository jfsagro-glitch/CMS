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

export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type ConditionRating = 'excellent' | 'good' | 'satisfactory' | 'poor' | 'critical';

export interface InspectionPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  takenAt: Date;
  location?: string; // Место съемки (например, "Фасад", "Внутри", "Кухня")
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
  inspectorId: string;
  inspectorName: string;
  inspectorPosition?: string;
  inspectorPhone?: string;
  inspectorEmail?: string;
  
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

