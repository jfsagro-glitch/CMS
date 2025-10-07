// ============= ЭТАП 3: ТИПЫ ДЛЯ РАСШИРЕННЫХ МОДУЛЕЙ =============

// ========== МОБИЛЬНЫЙ ОЦЕНЩИК ==========

export type AppraiserUserRole = 'admin' | 'appraiser' | 'verifier';
export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'revision_required';

// Пользователь оценщика
export interface AppraiserUser {
  id: string;
  email: string;
  fullName: string;
  role: AppraiserUserRole;
  phone?: string;
  active: boolean;
  createdAt: Date;
}

// Оценщик
export interface Appraiser {
  id: string;
  companyName: string;
  inn: string;
  license: string;
  licenseValidUntil: Date;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  monthlyLimit: number; // Лимит заказов в месяц
  currentMonthOrders: number;
  rating: number; // 0-5
  active: boolean;
  createdAt: Date;
}

// Заказ на оценку
export interface AppraisalOrder {
  id: string;
  collateralCardId: string;
  appraiserId?: string;
  status: OrderStatus;
  orderDate: Date;
  requiredDate: Date;
  completionDate?: Date;
  estimatedValue?: number;
  marketValue?: number;
  liquidationValue?: number;
  reportDocumentId?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Запрос на верификацию
export interface VerificationRequest {
  id: string;
  appraisalOrderId: string;
  verifierId?: string;
  status: VerificationStatus;
  requestDate: Date;
  verificationDate?: Date;
  comments?: string;
  correctionRequired?: string;
  approvedValue?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ========== SMARTDEAL ==========

export type MortgageType = 'property' | 'movable';
export type MortgageStatus = 'draft' | 'prepared' | 'signed' | 'registered' | 'cancelled';
export type SignatureStatus = 'pending' | 'signed' | 'rejected';
export type EGRNRequestStatus = 'pending' | 'processing' | 'completed' | 'error';
export type AppealStatus = 'draft' | 'sent' | 'in_progress' | 'completed' | 'rejected';

// Закладная
export interface Mortgage {
  id: string;
  collateralCardId: string;
  mortgageType: MortgageType;
  status: MortgageStatus;
  number?: string;
  createDate: Date;
  registrationDate?: Date;
  amount: number;
  creditor: string;
  debtor: string;
  documentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Электронная подпись
export interface ElectronicSignature {
  id: string;
  documentId: string;
  signerName: string;
  signerPosition: string;
  certificateSerial: string;
  certificateValidUntil: Date;
  status: SignatureStatus;
  signDate?: Date;
  signatureData?: string; // Base64
  createdAt: Date;
}

// Выписка ЕГРН
export interface EGRNStatement {
  id: string;
  collateralCardId: string;
  requestNumber: string;
  status: EGRNRequestStatus;
  requestDate: Date;
  receiveDate?: Date;
  cadastralNumber?: string;
  documentId?: string;
  cost?: number;
  createdAt: Date;
}

// Обращение в Росреестр
export interface Appeal {
  id: string;
  collateralCardId: string;
  appealType: string;
  status: AppealStatus;
  requestDate: Date;
  responseDate?: Date;
  requestText: string;
  responseText?: string;
  documentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ========== ОТЧЕТЫ ==========

export type ReportType = 'cb_0409310' | 'analytical' | 'summary' | 'detailed';
export type ReportFormat = 'xml' | 'excel' | 'pdf';
export type ReportPeriod = 'day' | 'month' | 'quarter' | 'year';

// Параметры отчета ЦБ
export interface CBReportParams {
  reportDate: Date;
  organizationName: string;
  organizationINN: string;
  periodStart: Date;
  periodEnd: Date;
}

// Данные отчета
export interface ReportData {
  id: string;
  type: ReportType;
  format: ReportFormat;
  generatedDate: Date;
  parameters: any;
  data: any;
  fileData?: string; // Base64
}

// История отчетов
export interface ReportHistoryItem {
  id: string;
  reportType: ReportType;
  generatedBy: string;
  generatedAt: Date;
  parameters: string;
  fileId?: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

// ========== РАСШИРЕННЫЕ ДОКУМЕНТЫ ==========

export interface DocumentVersion {
  version: number;
  uploadDate: Date;
  uploadedBy: string;
  fileData: string;
  comment?: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

// Расширенный документ
export interface ExtendedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  category?: string;
  folderId?: string;
  description?: string;
  tags?: string[];
  versions: DocumentVersion[];
  currentVersion: number;
  signed: boolean;
  signatureId?: string;
  uploadDate: Date;
  updatedAt: Date;
}

// ========== ДОПОЛНИТЕЛЬНЫЕ БЛОКИ КАРТОЧКИ ==========

// Оценка
export interface Evaluation {
  id: string;
  orderId?: string;
  evaluationType: 'market' | 'liquidation' | 'cadastral';
  value: number;
  date: Date;
  appraiser: string;
  reportNumber?: string;
  validUntil?: Date;
  documentId?: string;
  notes?: string;
}

// Страхование
export interface Insurance {
  id: string;
  policyNumber: string;
  insurer: string;
  insuranceType: string;
  insuredAmount: number;
  premium: number;
  startDate: Date;
  endDate: Date;
  documentId?: string;
  active: boolean;
}

// Договор обеспечения
export interface CollateralContract {
  id: string;
  contractNumber: string;
  contractType: 'pledge' | 'mortgage' | 'guarantee';
  contractDate: Date;
  amount: number;
  creditor: string;
  debtor: string;
  documentId?: string;
  active: boolean;
}

// Осмотр
export interface Inspection {
  id: string;
  inspectionDate: Date;
  inspector: string;
  condition: 'excellent' | 'good' | 'satisfactory' | 'poor';
  photos: string[]; // Document IDs
  notes?: string;
  defects?: string[];
  recommendations?: string;
}

// Экспертное заключение
export interface ExpertConclusion {
  id: string;
  conclusionType: string;
  expert: string;
  conclusionDate: Date;
  summary: string;
  documentId?: string;
}

// Полная расширенная карточка (Этап 3)
export interface FullCollateralCard {
  // Базовые поля из Этапа 2
  id: string;
  number: string;
  name: string;
  mainCategory: string;
  classification: any;
  cbCode: number;
  status: string;
  partners: any[];
  address?: any;
  characteristics: any;
  documents: ExtendedDocument[];
  
  // Новые блоки Этапа 3
  evaluations: Evaluation[];
  insurance: Insurance[];
  contracts: CollateralContract[];
  inspections: Inspection[];
  expertConclusions: ExpertConclusion[];
  
  // Связи с другими модулями
  appraisalOrders: string[]; // IDs заказов на оценку
  mortgages: string[]; // IDs закладных
  egrnStatements: string[]; // IDs выписок ЕГРН
  
  createdAt: Date;
  updatedAt: Date;
}

// ========== ДВИЖИМОЕ ИМУЩЕСТВО (ПОЛНАЯ КЛАССИФИКАЦИЯ) ==========

export type VehicleCategory = 
  | 'passenger_car' 
  | 'truck' 
  | 'bus' 
  | 'motorcycle' 
  | 'trailer' 
  | 'special_vehicle'
  | 'agricultural_machinery'
  | 'construction_machinery'
  | 'aircraft'
  | 'watercraft';

export interface VehicleCharacteristics {
  brand: string;
  model: string;
  year: number;
  vin?: string;
  registrationNumber?: string;
  engineVolume?: number;
  enginePower?: number;
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  color?: string;
  condition?: string;
  // Специфичные для категории
  [key: string]: any;
}

export interface EquipmentCharacteristics {
  name: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  year?: number;
  power?: number;
  condition?: string;
  operatingHours?: number;
  // Дополнительные поля
  [key: string]: any;
}

