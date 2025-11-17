/**
 * Типы данных для модуля ЕГРН
 */

export type EGRNServiceType = 'mortgage_registration' | 'encumbrance_removal' | 'extract';

export interface EGRNRequest {
  id: string;
  serviceType: EGRNServiceType;
  
  // Связь с объектом
  objectId?: string; // ID объекта из реестра
  reference?: string | number; // REFERENCE сделки
  contractNumber?: string; // Номер договора залога
  
  // Данные объекта
  objectName?: string;
  cadastralNumber?: string;
  address?: string;
  
  // Данные заявителя
  applicantName?: string;
  applicantInn?: string;
  applicantType?: 'individual' | 'legal';
  
  // Данные для регистрации ипотеки
  mortgageContractNumber?: string;
  mortgageContractDate?: string;
  mortgageAmount?: number;
  mortgageTerm?: string;
  
  // Данные для снятия обременений
  encumbranceType?: string;
  encumbranceNumber?: string;
  encumbranceDate?: string;
  removalReason?: string;
  
  // Данные для выписки
  extractType?: 'full' | 'short' | 'about_object' | 'about_rights';
  extractPurpose?: string;
  
  // Статус
  status: 'draft' | 'submitted' | 'in_progress' | 'completed' | 'rejected';
  submittedAt?: string;
  completedAt?: string;
  
  // Результат
  resultDocument?: string; // Ссылка на документ
  resultNumber?: string; // Номер выписки/регистрации
  resultDate?: string;
  
  // Комментарии
  comments?: string;
  rejectionReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface EGRNFilters {
  serviceType?: EGRNServiceType;
  status?: EGRNRequest['status'];
  dateFrom?: string;
  dateTo?: string;
  reference?: string;
}

