/**
 * Типы для модуля "Отчеты" (Форма 310 ЦБ РФ)
 */

export interface Form310Report {
  id: string;
  guid: string; // Уникальный идентификатор отчета
  reportDate: string; // Дата отчета
  reportNumber: string; // Номер отчета
  reportType: 'form310' | 'error'; // Тип отчета
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  
  // Информация о кредитной организации
  creditOrg: {
    name: string;
    code: string;
    inn?: string;
    ogrn?: string;
  };
  
  // Раздел 1: Общие сведения
  section1?: {
    items: Array<{
      id: string;
      reference: string; // REFERENCE сделки
      collateralType?: string; // Тип обеспечения
      collateralInfo?: string; // Информация об обеспечении
      registrationDate?: string; // Дата регистрации
    }>;
  };
  
  // Раздел 2: Финансовые показатели
  section2?: {
    items: Array<{
      id: string;
      reference: string;
      principalAmount?: number; // Основной долг
      principalDate?: string;
      interestAmount?: number; // Проценты
      interestDate?: string;
      overduePrincipal?: number; // Просроченный основной долг
      overduePrincipalDate?: string;
      overdueInterest?: number; // Просроченные проценты
      overdueInterestDate?: string;
    }>;
  };
  
  // Раздел 3: Оценка обеспечения
  section3?: {
    items: Array<{
      id: string;
      reference: string;
      collateralLocation?: string; // Местоположение
      collateralDescription?: string; // Описание
      collateralValue?: number; // Залоговая стоимость
      marketValue?: number; // Рыночная стоимость
      valuationDate?: string; // Дата оценки
    }>;
  };
  
  // Раздел 4: Детализация по типам обеспечения
  section4?: {
    items: Array<{
      id: string;
      reference: string;
      collateralCategory: string; // Категория (4.1-4.22)
      details: Record<string, any>; // Детали в зависимости от категории
    }>;
  };
  
  // Раздел 5: Информация о залогодателях
  section5?: {
    items: Array<{
      id: string;
      reference: string;
      pledgerName?: string;
      pledgerType?: string;
      inn?: string;
      ogrn?: string;
      lei?: string;
    }>;
  };
  
  // Раздел 6: Дополнительная информация
  section6?: {
    items: Array<{
      id: string;
      reference: string;
      additionalInfo?: string;
    }>;
  };
  
  // Ошибки при обработке
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ReportsPayload {
  reports: Form310Report[];
  metadata: {
    totalReports: number;
    lastUpdated: string;
    sourceFiles: string[];
  };
}

