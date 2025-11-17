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
  creditContractNumber?: string | null; // Номер Кредитного договора
  
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
  landAreaHectares?: number | null; // Площадь земельного участка, га
  
  // Оценка
  marketValue?: number | null; // Рыночная стоимость
  collateralValue?: number | null; // Залоговая стоимость
  fairValue?: number | null; // Справедливая стоимость
  cadastralValue?: number | null; // Кадастровая ст-ть, руб.
  marketValuePerSqm?: number | null; // Рыночная стоимость, руб./кв.м.
  marketValuePerHectare?: number | null; // Рыночная стоимость, руб./сот.
  
  // Характеристики
  category?: string | null; // Категория обеспечения
  liquidity?: string | null; // Ликвидность
  liquidityFairValue?: string | null; // Ликвидность при справедливой стоимости
  liquidityMovable?: string | null; // Ликвидность движимого имущества
  
  // Описание
  collateralDescription?: string | null; // Состояние и краткое описание имущества
  collateralCondition?: string | null; // Состояние (хорошее/удовлетворительное/неудовлетворительное)
  hasReplanning?: boolean | null; // Наличие перепланировок
  replanningDescription?: string | null; // Выявленные перепланировки
  landFunctionalProvision?: string | null; // Земельный участок функционально обеспечивает/не обеспечивает
  
  // Обременения
  hasEncumbrances?: boolean | null;
  encumbrancesDescription?: string | null; // Наличие зарегистрированных обременений
  encumbrancesDetails?: string | null; // Выявленные обременения
  
  // Права на объект
  ownershipBasis?: string | null; // Право, на основании которого объект принадлежит Залогодателю
  ownershipDocuments?: string | null; // Документы-основания возникновения права собственности
  registrationRecord?: string | null; // Запись регистрации в ЕГРН (дата, №)
  registrationDocument?: string | null; // Правоподтверждающий документ
  
  // Проверка
  inspectionDate?: string | null; // Дата осмотра / Дата проведения проверки
  inspectorName?: string | null; // Сотрудник ПР, проводивший проверку
  bankruptcyCheckDate?: string | null; // Дата проверки на банкротство
  bankruptcyCheckResult?: string | null; // Результат проверки на банкротство
  
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
  
  // Дополнительные данные (для хранения всех остальных полей из ZZ)
  additionalData?: Record<string, any>; // Все остальные поля, которые могут быть в файлах ZZ
  
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
  // Основные поля из вкладки "Описание"
  objectNumber?: number; // № объекта
  objectName?: string; // Наименование объекта
  objectType?: string; // Тип объекта
  cadastralNumber?: string; // Кадастровый номер объекта
  address?: string; // адрес
  areaSqm?: number; // Площадь, кв.м.
  areaHectares?: number; // Площадь, сот.
  floor?: string; // Номер, тип этажа
  floorsCount?: number; // Количество этажей
  undergroundFloors?: number; // в том числе подземных этажей
  purpose?: string; // Назначение
  condition?: string; // Состояние
  material?: string; // Материал стен
  yearBuilt?: number; // Год постройки
  yearCommissioned?: number; // Год ввода в эксплуатацию
  marketValue?: number; // Рыночная стоимость, руб.
  collateralValue?: number; // Залоговая стоимость, руб.
  ownershipShare?: number; // Размер доли в праве / доля в праве %
  ownershipBasis?: string; // Право, на основании которого объект принадлежит Залогодателю
  registrationRecord?: string; // Запись регистрации в ЕГРН
  encumbrances?: string; // Наличие обременений
  replanning?: string; // Перепланировки
  description?: string; // Описание
  // Дополнительные поля (для хранения всех остальных полей из вкладки "Описание")
  [key: string]: any;
}

export interface Photo {
  id: string;
  url: string;
  description?: string;
  isMain?: boolean; // Основные фотографии (фасадные)
  photoNumber?: number; // Номер фото (Фото 1, Фото 3, и т.д.)
}

export interface Review {
  id: string;
  reviewer?: string | null; // Сотрудник составляющий рецензию
  reviewerPosition?: string | null; // Должность рецензента
  reviewDate?: string | null; // Дата составления рецензии
  reviewText?: string | null; // Текст рецензии
  conclusion?: string | null; // Заключение
  compliance?: string | null; // Соответствие требованиям
  reportCompliance?: string | null; // Отчет об оценке соответствует требованиям
}

export interface Calculation {
  id: string;
  type: string; // Тип расчета (например, "Расчет ком.пом.", "Расчет АЗС", "Расчет судно" и т.д.)
  data: Record<string, any>; // Данные расчета (все поля из соответствующей вкладки)
  // Для разных типов расчетов могут быть разные поля:
  // - Расчет ком.пом.: исходные данные, корректировки, скорректированная стоимость и т.д.
  // - Расчет АЗС: объемы реализации, закупочная цена, расходы и т.д.
  // - Расчет судно: дедвейт, возраст судна, порт приписки и т.д.
  // - Расчеты ЗУ: площадь, категория, разрешенное использование и т.д.
}

// Дополнительные интерфейсы для специфических типов расчетов
export interface CommercialPremisesCalculation extends Calculation {
  type: 'Расчет ком.пом.' | 'Расчет ком.пом. (ДП)';
  baseData?: Record<string, any>; // Исходные данные
  adjustments?: Record<string, any>; // Корректировки
  adjustedValue?: number; // Скорректированная стоимость
  marketValue?: number; // Рыночная стоимость
}

export interface AZSCalculation extends Calculation {
  type: 'Расчет АЗС' | ' ССП для АЗС-Расчет АЗС (ДП)';
  salesVolume?: number; // Объемы реализации за последние 36 месяцев, литры
  purchasePrice?: number; // Закупочная цена, руб./тонна с НДС
  expenses?: number; // Расходы на содержание АЗС, руб. с НДС
  grossIncome?: number; // Валовый доход от деятельности АЗС
  averageDailyThroughput?: number; // Среднесуточный пролив, л
  dailyTraffic?: number; // Средняя проходимость в день
}

export interface VesselCalculation extends Calculation {
  type: 'Расчет судно';
  deadweight?: number; // Дедвейт, т
  vesselAge?: number; // Возраст судна, лет
  portOfRegistry?: string; // Порт приписки, флаг
  navigationArea?: string; // Район плавания
  vesselType?: string; // Тип судна
}

export interface LandPlotCalculation extends Calculation {
  type: 'Расчеты ЗУ св.';
  areaSqm?: number; // Площадь земельного участка, кв.м
  areaHectares?: number; // Площадь земельного участка, га
  category?: string; // Категория земель
  permittedUse?: string; // Разрешенное использование
  cadastralNumber?: string; // Кадастровый номер
  marketValue?: number; // Рыночная стоимость, руб.
  marketValuePerHectare?: number; // Рыночная стоимость, руб./сот.
}

export interface MovablePropertyCalculation extends Calculation {
  type: 'расчет движимое (ЗП)';
  propertyType?: string; // Тип движимого имущества
  quantity?: number; // Количество
  unit?: string; // Единица измерения
  bookValue?: number; // Балансовая стоимость
  residualValue?: number; // Остаточная балансовая стоимость
  wear?: number; // Накопленный износ, %
  marketValue?: number; // Рыночная стоимость
}
