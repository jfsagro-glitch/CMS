/**
 * Типы данных для модуля оценки
 */

export type AppraisalObjectType = 'collateral' | 'conclusion' | 'portfolio';

export interface AppraisalObject {
  id: string;
  type: AppraisalObjectType;
  name: string;
  reference?: string | number;
  contractNumber?: string;
  collateralType?: string;
  address?: string;
  area?: number;
  characteristics?: Record<string, any>;
}

export interface AppraisalRequest {
  id: string;
  objectId: string;
  objectType: AppraisalObjectType;
  requestedAt: string;
  requestedBy?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface AppraisalResult {
  id: string;
  requestId: string;
  objectId: string;
  objectType: AppraisalObjectType;
  
  // Результаты оценки
  marketValue?: number; // Рыночная стоимость
  collateralValue?: number; // Залоговая стоимость
  fairValue?: number; // Справедливая стоимость
  
  // Методология
  appraisalMethod?: string; // Метод оценки
  comparableObjectsCount?: number; // Количество аналогов
  confidenceLevel?: 'high' | 'medium' | 'low'; // Уровень уверенности
  
  // Аналоги (когда база данных будет готова)
  comparableObjects?: ComparableObject[];
  
  // Детали
  details?: string; // Детальное описание оценки
  notes?: string; // Примечания
  
  // Даты
  appraisedAt: string;
  appraisedBy?: string;
  
  // Статус
  status: 'draft' | 'approved' | 'rejected';
}

export interface ComparableObject {
  id: string;
  address: string;
  area: number;
  price: number;
  pricePerSqm: number;
  characteristics: Record<string, any>;
  similarity: number; // Процент схожести (0-100)
}

export interface AppraisalFilters {
  objectType?: AppraisalObjectType;
  status?: AppraisalResult['status'];
  dateFrom?: string;
  dateTo?: string;
}

