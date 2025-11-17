/**
 * Типы данных для модуля ФКР (Финансовый контроль рисков)
 */

// Справочник рисковых событий
export const RISK_EVENTS = [
  {
    id: 'risk_001',
    code: '001',
    name: 'Внезапное изменение состава, структуры и количества предмета залога',
    category: 'collateral',
  },
  {
    id: 'risk_002',
    code: '002',
    name: 'Нарушение условий хранения, эксплуатации или содержания имущества, угрожающее утратой или повреждением имущества',
    category: 'collateral',
  },
  {
    id: 'risk_003',
    code: '003',
    name: 'Ухудшение качества или повреждение заложенного имущества, а также по другим причинам, повлекшим изменение его ликвидности',
    category: 'collateral',
  },
  {
    id: 'risk_004',
    code: '004',
    name: 'Перемещение залогового обеспечения по адресу (адресам), не указанным в договоре залога, за исключениям имущества, перемещение которого является типичным условием его эксплуатации',
    category: 'collateral',
  },
  {
    id: 'risk_005',
    code: '005',
    name: 'Появление любой существенной негативной информации о Заемщике/Залогодателе',
    category: 'borrower',
  },
  {
    id: 'risk_006',
    code: '006',
    name: 'Отклонение фактических показателей деятельности Залогодателя (либо выручки, либо EBITDA, либо чистой прибыли, либо объема поступивших денежных средств по договорам аренды) в одном квартальном периоде более чем на 20% от запланированных',
    category: 'financial',
  },
  {
    id: 'risk_007',
    code: '007',
    name: 'Выбытие основного(ых) контрагента(ов) Залогодателя, генерирующего(их) более 25% от общего потока арендных платежей',
    category: 'financial',
  },
  {
    id: 'risk_008',
    code: '008',
    name: 'Изменение в составе собственников и / или руководстве Залогодателя, которые могут негативно повлиять на бизнес Залогодателя',
    category: 'borrower',
  },
  {
    id: 'risk_009',
    code: '009',
    name: 'Наличие серьезных разногласий и конфронтации между акционерами / участниками Залогодателя',
    category: 'borrower',
  },
  {
    id: 'risk_010',
    code: '010',
    name: 'Снижение в течение квартала пассажиропотока/ погрузки и/или пассажирооборота/ грузооборота Залогодателя более чем на 20% по сравнению с прошлым сопоставимым периодом',
    category: 'transport',
  },
  {
    id: 'risk_011',
    code: '011',
    name: 'Введение ограничений на эксплуатацию транспортных средств, используемых Залогодателем, которые могут повлечь за собой снижение пассажиропотока / погрузки более чем на 20%',
    category: 'transport',
  },
  {
    id: 'risk_012',
    code: '012',
    name: 'Снижение рейтинга Заемщика более чем на 3 пункта с момента его предыдущего пересмотра, в случае если новый рейтинг Заемщика 20 и ниже',
    category: 'rating',
  },
  {
    id: 'risk_013',
    code: '013',
    name: 'Любое снижение рейтинга Заемщика с момента его предыдущего пересмотра, в случае если новый рейтинг Заемщика 23-26',
    category: 'rating',
  },
  {
    id: 'risk_014',
    code: '014',
    name: 'Наличие негативных тенденций отрасли Заемщика/Залогодателя, отраженных в рейтинговой модели/отраслевых стратегиях Банка',
    category: 'industry',
  },
  {
    id: 'risk_015',
    code: '015',
    name: 'Снижение поступления объемов выручки Заемщика более чем на 20% по сравнению с предшествующим месяцем',
    category: 'financial',
  },
  {
    id: 'risk_016',
    code: '016',
    name: 'Снижение величины основных средств в представленной Залогодателем бухгалтерской (финансовой) отчетности более чем на 20% по сравнению с предшествующим кварталом',
    category: 'financial',
  },
  {
    id: 'risk_017',
    code: '017',
    name: 'Проведение в отношении Заемщика/Залогодателя процедур, предусмотренных законодательством о несостоятельности (банкротстве)',
    category: 'legal',
  },
] as const;

export type RiskEventCode = typeof RISK_EVENTS[number]['code'];
export type RiskEventCategory = 'collateral' | 'borrower' | 'financial' | 'transport' | 'rating' | 'industry' | 'legal';

export interface RiskEvent {
  id: string;
  code: RiskEventCode;
  name: string;
  category: RiskEventCategory;
}

// Запись в реестре ФКР
export interface CreditRiskRecord {
  id: string;
  
  // Связь с договором залога
  reference: string | number; // REFERENCE сделки из портфеля
  contractNumber?: string; // Номер договора залога
  
  // Информация о залоге
  pledger: string; // Залогодатель
  pledgerInn?: string; // ИНН залогодателя
  borrower?: string; // Заемщик
  borrowerInn?: string; // ИНН заемщика
  
  // Тип рискового события
  riskEvent: RiskEvent; // Рисковое событие из справочника
  
  // Отлагательное условие (если добавлено из заключения)
  suspensiveConditionId?: string; // ID отлагательного условия из заключения
  suspensiveConditionDescription?: string; // Описание отлагательного условия
  
  // Условия по страхованию
  insuranceRelated?: boolean; // Связано со страхованием
  insurancePolicyNumber?: string; // Номер полиса страхования
  
  // Статус и даты
  status: 'active' | 'resolved' | 'archived'; // Статус риска
  eventDate: string; // Дата наступления события
  detectionDate: string; // Дата обнаружения
  resolutionDate?: string; // Дата разрешения
  
  // Описание и комментарии
  description?: string; // Дополнительное описание
  comments?: string; // Комментарии
  resolution?: string; // Способ разрешения
  
  // Ответственные
  detectedBy?: string; // Обнаружил
  responsible?: string; // Ответственный за решение
  reviewer?: string; // Проверил
  
  // Приоритет
  priority: 'low' | 'medium' | 'high' | 'critical'; // Приоритет риска
  
  // Документы
  documents?: string[]; // Ссылки на документы
  
  createdAt: string;
  updatedAt: string;
}

// Фильтры для реестра ФКР
export interface CreditRiskFilters {
  reference?: string;
  contractNumber?: string;
  pledger?: string;
  riskEventCode?: RiskEventCode;
  category?: RiskEventCategory;
  status?: CreditRiskRecord['status'];
  priority?: CreditRiskRecord['priority'];
  dateFrom?: string;
  dateTo?: string;
  insuranceRelated?: boolean;
}

