export interface CollateralConclusion {
  id: string;
  conclusionNumber: string;
  conclusionDate: string;
  
  // Основная информация
  reference: string | null;
  contractNumber: string | null;
  borrower: string | null;
  borrowerInn?: string | null;
  pledger: string | null;
  pledgerInn: string | null;
  
  // Кредитный продукт
  creditProduct?: string | null;
  creditAmount?: number | null;
  creditTermMonths?: number | null;
  
  // Имущество
  collateralType: string | null;
  collateralName?: string | null; // Наименование, назначение
  collateralPurpose?: string | null;
  totalAreaSqm?: number | null; // общая площадь, кв.м.
  totalAreaHectares?: number | null; // общая площадь, сот.
  collateralLocation: string | null;
  objectsCount?: number | null; // кол-во объектов
  ownershipShare?: number | null; // оцениваемые права, доля в праве %
  
  // Земельный участок (для недвижимости)
  landCategory?: string | null; // Наименование, категория земель
  landPermittedUse?: string | null; // разрешенный вид использования
  landCadastralNumber?: string | null;
  landAreaSqm?: number | null;
  
  // Оценка
  marketValue?: number | null; // Рыночная стоимость
  collateralValue?: number | null; // Залоговая стоимость
  fairValue?: number | null; // Справедливая стоимость
  
  // Характеристики
  category?: string | null; // Категория обеспечения
  liquidity?: string | null; // Ликвидность
  liquidityFairValue?: string | null; // Ликвидность при справедливой стоимости
  
  // Описание
  collateralDescription?: string | null; // Состояние и краткое описание имущества
  collateralCondition?: string | null; // Состояние (хорошее/удовлетворительное/неудовлетворительное)
  hasReplanning?: boolean | null; // Наличие перепланировок
  landFunctionalProvision?: string | null; // Земельный участок функционально обеспечивает/не обеспечивает
  
  // Обременения
  hasEncumbrances?: boolean | null;
  encumbrancesDescription?: string | null; // Наличие зарегистрированных обременений
  
  // Проверка
  inspectionDate?: string | null; // Дата осмотра / Дата проведения проверки
  inspectorName?: string | null; // Сотрудник ПР, проводивший проверку
  
  // Особое мнение
  specialOpinion?: string | null; // Особое мнение
  
  // Отлагательные условия
  suspensiveConditions?: SuspensiveCondition[]; // отлагательные условия
  
  // Детальное описание объектов
  detailedDescriptions?: DetailedDescription[]; // Вкладка "Описание"
  
  // Фото
  photos?: Photo[]; // Вкладка "Фото"
  
  // Рецензия
  review?: Review | null; // Вкладка "Рецензия"
  
  // Расчеты
  calculations?: Calculation[]; // Различные расчеты
  
  // Статус и согласование
  conclusionType: 'Первичное' | 'Повторное' | 'Дополнительное' | 'Переоценка';
  status: 'Черновик' | 'На согласовании' | 'Согласовано' | 'Отклонено' | 'Аннулировано';
  statusColor?: string;
  author: string;
  authorDate: string;
  approver?: string | null;
  approvalDate?: string | null;
  conclusionText?: string; // Текст заключения (если есть отдельное поле)
  recommendations?: string;
  notes?: string;
  riskLevel?: 'Низкий' | 'Средний' | 'Высокий' | 'Критический';
}

export interface SuspensiveCondition {
  id: string;
  number: number;
  description: string; // Перечень отлагательных и дополнительных условий
  suspensiveCondition?: string; // Отлагательные условия
  additionalCondition?: string; // Доп. условия
}

export interface DetailedDescription {
  id: string;
  // Поля из вкладки "Описание" - зависят от типа имущества
  [key: string]: any;
}

export interface Photo {
  id: string;
  url: string;
  description?: string;
  isMain?: boolean; // Основные фотографии (фасадные)
}

export interface Review {
  id: string;
  reviewer?: string | null;
  reviewDate?: string | null;
  reviewText?: string | null;
  conclusion?: string | null;
}

export interface Calculation {
  id: string;
  type: string; // Тип расчета (например, "Расчет ком.пом.", "Расчет АЗС" и т.д.)
  data: Record<string, any>; // Данные расчета
}
