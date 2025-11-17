/**
 * Справочник атрибутов по видам имущества
 * Используется в Залоговых заключениях и Реестре залогов
 */

export interface CollateralAttribute {
  key: string; // Ключ атрибута (для использования в коде)
  label: string; // Название атрибута (для отображения)
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'textarea';
  required?: boolean; // Обязательное поле
  unit?: string; // Единица измерения (кв.м, руб., и т.д.)
  min?: number; // Минимальное значение (для number)
  max?: number; // Максимальное значение (для number)
  options?: string[]; // Варианты выбора (для select)
  placeholder?: string; // Подсказка
  description?: string; // Описание атрибута
  group?: string; // Группа атрибутов (для группировки в форме)
}

export interface CollateralAttributesConfig {
  [key: string]: CollateralAttribute[]; // key = ObjectTypeKey или общий тип залога
}

// Общие атрибуты для всех типов имущества
const commonAttributes: CollateralAttribute[] = [
  {
    key: 'collateralName',
    label: 'Наименование, назначение',
    type: 'text',
    required: true,
    placeholder: 'Наименование имущества',
    group: 'Основная информация',
  },
  {
    key: 'collateralLocation',
    label: 'Адрес местоположения',
    type: 'text',
    required: true,
    placeholder: 'Адрес местоположения',
    group: 'Основная информация',
  },
  {
    key: 'ownershipShare',
    label: 'Оцениваемые права, доля в праве %',
    type: 'number',
    min: 0,
    max: 100,
    unit: '%',
    group: 'Основная информация',
  },
  {
    key: 'marketValue',
    label: 'Рыночная стоимость',
    type: 'number',
    min: 0,
    unit: 'руб.',
    group: 'Оценка',
  },
  {
    key: 'collateralValue',
    label: 'Залоговая стоимость',
    type: 'number',
    min: 0,
    unit: 'руб.',
    group: 'Оценка',
  },
  {
    key: 'fairValue',
    label: 'Справедливая стоимость',
    type: 'number',
    min: 0,
    unit: 'руб.',
    group: 'Оценка',
  },
  {
    key: 'category',
    label: 'Категория обеспечения',
    type: 'select',
    options: ['Формальное', 'Достаточное', 'Недостаточное'],
    group: 'Характеристики',
  },
  {
    key: 'liquidity',
    label: 'Ликвидность',
    type: 'select',
    options: [
      'высокая (срок реализации до 90 дней)',
      'удовлетворительная (срок реализации до 365 дней)',
      'низкая (срок реализации свыше 365 дней)',
      'малоудовлетворительная',
    ],
    group: 'Характеристики',
  },
  {
    key: 'collateralCondition',
    label: 'Состояние имущества',
    type: 'select',
    options: ['хорошее', 'удовлетворительное', 'неудовлетворительное'],
    group: 'Характеристики',
  },
];

// Атрибуты для недвижимости (общие)
const realEstateCommonAttributes: CollateralAttribute[] = [
  ...commonAttributes,
  {
    key: 'totalAreaSqm',
    label: 'Общая площадь объекта, кв. м. (или протяженность и т.п. в соответствующих единицах измерения) Только цифры',
    type: 'number',
    required: true,
    min: 0,
    unit: 'кв.м',
    group: 'Параметры объекта',
  },
  {
    key: 'objectCadastralNumber',
    label: 'Кадастровый номер объекта',
    type: 'text',
    placeholder: '23:49:0303008:1915',
    group: 'Параметры объекта',
  },
  {
    key: 'landCadastralNumber',
    label: 'Кадастровый номер земельного участка',
    type: 'text',
    placeholder: '23:49:0303008:1915',
    group: 'Земельный участок',
  },
  {
    key: 'landCategory',
    label: 'Категория земель',
    type: 'select',
    options: [
      'земли населенных пунктов',
      'земли сельскохозяйственного назначения',
      'земли промышленности',
      'земли особо охраняемых территорий',
      'земли лесного фонда',
      'земли водного фонда',
      'земли запаса',
    ],
    group: 'Земельный участок',
  },
  {
    key: 'landPermittedUse',
    label: 'Вид разрешенного использования земельного участка (только по земельным участкам)',
    type: 'text',
    placeholder: 'Вид разрешенного использования земельного участка',
    group: 'Земельный участок',
  },
  {
    key: 'structureType',
    label: 'Тип строения/Категория участка',
    type: 'text',
    placeholder: 'Тип строения или категория участка',
    group: 'Параметры объекта',
  },
  {
    key: 'landAreaSqm',
    label: 'Площадь земельного участка',
    type: 'number',
    min: 0,
    unit: 'кв.м',
    group: 'Земельный участок',
  },
  {
    key: 'cadastralValue',
    label: 'Кадастровая стоимость',
    type: 'number',
    min: 0,
    unit: 'руб.',
    group: 'Оценка',
  },
  {
    key: 'bookValue',
    label: 'Балансовая стоимость на последнюю отчетную дату, руб. без учета НДС',
    type: 'number',
    min: 0,
    unit: 'руб.',
    group: 'Оценка',
  },
  {
    key: 'marketValuePerSqm',
    label: 'Рыночная стоимость за кв.м',
    type: 'number',
    min: 0,
    unit: 'руб./кв.м',
    group: 'Оценка',
  },
  {
    key: 'buildYear',
    label: 'Год строительства',
    type: 'number',
    min: 1800,
    max: new Date().getFullYear(),
    group: 'Параметры объекта',
  },
  {
    key: 'hasReplanning',
    label: 'Наличие перепланировок',
    type: 'boolean',
    group: 'Состояние',
  },
  {
    key: 'hasEncumbrances',
    label: 'Наличие обременений',
    type: 'boolean',
    group: 'Состояние',
  },
  {
    key: 'encumbrancesDescription',
    label: 'Описание обременений',
    type: 'textarea',
    placeholder: 'Описание зарегистрированных обременений',
    group: 'Состояние',
  },
];

// Атрибуты для жилой недвижимости
const residentialRealEstateAttributes: CollateralAttribute[] = [
  ...realEstateCommonAttributes,
  {
    key: 'livingArea',
    label: 'Жилая площадь',
    type: 'number',
    min: 0,
    unit: 'кв.м',
    group: 'Параметры объекта',
  },
  {
    key: 'kitchenArea',
    label: 'Площадь кухни',
    type: 'number',
    min: 0,
    unit: 'кв.м',
    group: 'Параметры объекта',
  },
  {
    key: 'roomsCount',
    label: 'Количество комнат',
    type: 'number',
    min: 1,
    group: 'Параметры объекта',
  },
  {
    key: 'floor',
    label: 'Этаж',
    type: 'number',
    min: 1,
    group: 'Параметры объекта',
  },
  {
    key: 'totalFloors',
    label: 'Этажность дома',
    type: 'number',
    min: 1,
    group: 'Параметры объекта',
  },
  {
    key: 'ceilingHeight',
    label: 'Высота потолков',
    type: 'number',
    min: 2,
    max: 6,
    unit: 'м',
    group: 'Параметры объекта',
  },
  {
    key: 'wallMaterial',
    label: 'Материал стен',
    type: 'select',
    options: ['Кирпич', 'Панель', 'Монолит', 'Блочный', 'Дерево', 'Кирпичный/Сталинский', 'Пенобетонные/Газобетонное блоки'],
    group: 'Параметры объекта',
  },
  {
    key: 'separateBathrooms',
    label: 'Количество санузлов',
    type: 'number',
    min: 0,
    group: 'Параметры объекта',
  },
  {
    key: 'balcony',
    label: 'Наличие балкона/лоджии',
    type: 'boolean',
    group: 'Параметры объекта',
  },
];

// Атрибуты для коммерческой недвижимости
const commercialRealEstateAttributes: CollateralAttribute[] = [
  ...realEstateCommonAttributes,
  {
    key: 'floor',
    label: 'Этаж',
    type: 'number',
    min: -2,
    group: 'Параметры объекта',
  },
  {
    key: 'totalFloors',
    label: 'Этажность здания',
    type: 'number',
    min: 1,
    group: 'Параметры объекта',
  },
  {
    key: 'ceilingHeight',
    label: 'Высота потолков',
    type: 'number',
    min: 2.5,
    max: 20,
    unit: 'м',
    group: 'Параметры объекта',
  },
  {
    key: 'buildingClass',
    label: 'Класс здания',
    type: 'select',
    options: ['A+', 'A', 'B+', 'B', 'C'],
    group: 'Параметры объекта',
  },
  {
    key: 'structureClass',
    label: 'Класс сооружения',
    type: 'select',
    options: ['A+', 'A', 'B+', 'B', 'C', 'D'],
    group: 'Параметры объекта',
  },
  {
    key: 'wallMaterial',
    label: 'Материал стен',
    type: 'select',
    options: [
      'Кирпич',
      'Кирпичный',
      'Панель',
      'Монолит',
      'Блочный',
      'Дерево',
      'Металлический',
      'Пенобетонные/Газобетонные блоки',
      'Железобетон',
    ],
    group: 'Параметры объекта',
  },
  {
    key: 'ceilingMaterial',
    label: 'Материал перекрытий',
    type: 'select',
    options: [
      'Железобетонные плиты',
      'Монолитные',
      'Деревянные',
      'Металлические',
      'Смешанные',
    ],
    group: 'Параметры объекта',
  },
  {
    key: 'structuralCondition',
    label: 'Состояние конструктивных элементов здания (Общ. тех. сост. здания)',
    type: 'select',
    options: ['Хорошее', 'Удовлетворительное', 'Неудовлетворительное', 'Требует ремонта'],
    group: 'Состояние',
  },
  {
    key: 'finishLevel',
    label: 'Уровень отделки',
    type: 'select',
    options: [
      'Без отделки',
      'Черновая',
      'Предчистовая',
      'Чистовая',
      'Типовой ремонт',
      'Требуется косметический ремонт',
      'Отделка люкс, дизайнерский ремонт',
    ],
    group: 'Состояние',
  },
  {
    key: 'finishCondition',
    label: 'Состояние отделки',
    type: 'select',
    options: ['Хорошее', 'Удовлетворительное', 'Неудовлетворительное', 'Требуется капремонт'],
    group: 'Состояние',
  },
  {
    key: 'hasElectricity',
    label: 'Электричество',
    type: 'boolean',
    group: 'Коммуникации',
  },
  {
    key: 'hasWaterSupply',
    label: 'Водоснабжение',
    type: 'boolean',
    group: 'Коммуникации',
  },
  {
    key: 'hasSewerage',
    label: 'Канализация',
    type: 'boolean',
    group: 'Коммуникации',
  },
  {
    key: 'hasGasSupply',
    label: 'Газоснабжение',
    type: 'boolean',
    group: 'Коммуникации',
  },
  {
    key: 'hasSecurityAlarm',
    label: 'Охранная сигнализация',
    type: 'boolean',
    group: 'Безопасность',
  },
  {
    key: 'hasFireAlarm',
    label: 'Пожарная сигнализация',
    type: 'boolean',
    group: 'Безопасность',
  },
  {
    key: 'hasVideoSurveillance',
    label: 'Видеонаблюдение',
    type: 'boolean',
    group: 'Безопасность',
  },
  {
    key: 'replanning',
    label: 'Перепланировки',
    type: 'select',
    options: [
      'Перепланировки не выявлены',
      'Не осуществлялись',
      'Выявлены перепланировки',
      'Требуется узаконивание',
    ],
    group: 'Состояние',
  },
  {
    key: 'landPermittedUse',
    label: 'Вид разрешенного использования земельного участка',
    type: 'text',
    placeholder: 'Вид разрешенного использования',
    group: 'Земельный участок',
  },
  {
    key: 'ownershipRight',
    label: 'Право залогодателя на объект недвижимости',
    type: 'select',
    options: [
      'Право собственности',
      'Право аренды',
      'Право постоянного (бессрочного) пользования',
      'Право хозяйственного ведения',
      'Право оперативного управления',
    ],
    group: 'Права',
  },
  {
    key: 'leaseExpirationDate',
    label: 'Дата окончания срока аренды объекта недвижимости',
    type: 'date',
    group: 'Права',
  },
  {
    key: 'ownershipShare',
    label: 'Размер доли в праве',
    type: 'text',
    placeholder: 'Например: 1/1, 1/2, 1/3',
    group: 'Права',
    description: 'Указывается в виде дроби, например: 1/1, 1/2, 1/3',
  },
  {
    key: 'isUnfinishedConstruction',
    label: 'Объект незавершенного строительства',
    type: 'boolean',
    group: 'Права',
  },
  {
    key: 'ownershipBasis',
    label: 'Право, на основании которого объект принадлежит Залогодателю/документы-основания возникновения права',
    type: 'textarea',
    placeholder: 'Например: Право собственности, на основании следующих документов: Договор купли-продажи',
    group: 'Права',
  },
  {
    key: 'technicalDocument',
    label: 'Документ, отражающий технические характеристики объекта',
    type: 'select',
    options: [
      'Выписка из Единого государственного реестра недвижимости об объекте',
      'Технический паспорт',
      'Техническое заключение',
      'Проектная документация',
      'Иной документ',
    ],
    group: 'Документы',
  },
  {
    key: 'hasEncumbrances',
    label: 'Наличие обременений (аренда и т.п.)',
    type: 'boolean',
    group: 'Права',
  },
  {
    key: 'encumbrancesDescription',
    label: 'Описание обременений',
    type: 'textarea',
    placeholder: 'Описание зарегистрированных обременений',
    group: 'Права',
  },
  {
    key: 'bookValue',
    label: 'Балансовая стоимость на последнюю отчетную дату, руб. без учета НДС',
    type: 'number',
    min: 0,
    unit: 'руб.',
    group: 'Оценка',
  },
  {
    key: 'comment',
    label: 'Комментарий',
    type: 'textarea',
    placeholder: 'Дополнительные комментарии',
    group: 'Дополнительно',
  },
  {
    key: 'parking',
    label: 'Наличие парковки',
    type: 'boolean',
    group: 'Инфраструктура',
  },
  {
    key: 'parkingSpaces',
    label: 'Количество машиномест',
    type: 'number',
    min: 0,
    group: 'Инфраструктура',
  },
];

// Атрибуты для складов
const warehouseAttributes: CollateralAttribute[] = [
  ...commercialRealEstateAttributes,
  {
    key: 'storageArea',
    label: 'Площадь хранения',
    type: 'number',
    min: 0,
    unit: 'кв.м',
    group: 'Параметры объекта',
  },
  {
    key: 'warehouseClass',
    label: 'Класс склада',
    type: 'select',
    options: ['A', 'A+', 'B', 'B+', 'C', 'D'],
    group: 'Параметры объекта',
  },
  {
    key: 'gates',
    label: 'Тип ворот',
    type: 'select',
    options: ['Докового типа', 'На нулевой отметке', 'Смешанные'],
    group: 'Параметры объекта',
  },
  {
    key: 'gatesCount',
    label: 'Количество ворот',
    type: 'number',
    min: 0,
    group: 'Параметры объекта',
  },
  {
    key: 'flooring',
    label: 'Покрытие пола',
    type: 'select',
    options: ['Бетон', 'Асфальт', 'Полимер', 'Плитка'],
    group: 'Параметры объекта',
  },
  {
    key: 'loadCapacity',
    label: 'Нагрузка на пол',
    type: 'number',
    min: 0,
    unit: 'тонн/кв.м',
    group: 'Параметры объекта',
  },
  {
    key: 'heating',
    label: 'Отопление',
    type: 'boolean',
    group: 'Инфраструктура',
  },
  {
    key: 'ramp',
    label: 'Наличие рампы',
    type: 'boolean',
    group: 'Инфраструктура',
  },
];

// Атрибуты для АЗС
const gasStationAttributes: CollateralAttribute[] = [
  ...realEstateCommonAttributes,
  {
    key: 'landArea',
    label: 'Площадь участка',
    type: 'number',
    required: true,
    min: 0,
    unit: 'кв.м',
    group: 'Параметры объекта',
  },
  {
    key: 'buildingArea',
    label: 'Площадь здания',
    type: 'number',
    min: 0,
    unit: 'кв.м',
    group: 'Параметры объекта',
  },
  {
    key: 'dispensersCount',
    label: 'Количество ТРК',
    type: 'number',
    required: true,
    min: 1,
    group: 'Параметры объекта',
  },
  {
    key: 'tanksVolume',
    label: 'Объем резервуаров',
    type: 'number',
    min: 0,
    unit: 'куб.м',
    group: 'Параметры объекта',
  },
  {
    key: 'fuelTypes',
    label: 'Количество видов топлива',
    type: 'number',
    min: 1,
    group: 'Параметры объекта',
  },
  {
    key: 'carWash',
    label: 'Наличие автомойки',
    type: 'boolean',
    group: 'Инфраструктура',
  },
  {
    key: 'shop',
    label: 'Наличие магазина',
    type: 'boolean',
    group: 'Инфраструктура',
  },
  {
    key: 'cafe',
    label: 'Наличие кафе',
    type: 'boolean',
    group: 'Инфраструктура',
  },
];

// Атрибуты для транспортных средств
const vehicleAttributes: CollateralAttribute[] = [
  ...commonAttributes,
  {
    key: 'brand',
    label: 'Марка ТС',
    type: 'text',
    required: true,
    placeholder: 'Марка транспортного средства',
    group: 'Основная информация',
  },
  {
    key: 'model',
    label: 'Модель',
    type: 'text',
    required: true,
    placeholder: 'Модель транспортного средства',
    group: 'Основная информация',
  },
  {
    key: 'year',
    label: 'Год выпуска',
    type: 'number',
    required: true,
    min: 1900,
    max: new Date().getFullYear(),
    group: 'Основная информация',
  },
  {
    key: 'vin',
    label: 'Идентификационный номер (VIN)',
    type: 'text',
    placeholder: 'VIN номер',
    group: 'Основная информация',
  },
  {
    key: 'registrationNumber',
    label: 'Государственный регистрационный номер',
    type: 'text',
    placeholder: 'A777AA92',
    group: 'Основная информация',
  },
  {
    key: 'engineVolume',
    label: 'Объем двигателя',
    type: 'number',
    min: 0,
    unit: 'куб.см',
    group: 'Технические характеристики',
  },
  {
    key: 'enginePower',
    label: 'Мощность двигателя',
    type: 'number',
    min: 0,
    unit: 'л.с.',
    group: 'Технические характеристики',
  },
  {
    key: 'enginePowerKw',
    label: 'Мощность двигателя',
    type: 'number',
    min: 0,
    unit: 'кВт',
    group: 'Технические характеристики',
  },
  {
    key: 'fuelType',
    label: 'Тип топлива',
    type: 'select',
    options: ['Бензин', 'Дизель', 'Гибрид', 'Электро', 'Газ'],
    group: 'Технические характеристики',
  },
  {
    key: 'transmission',
    label: 'Коробка передач',
    type: 'select',
    options: ['Механическая', 'Автоматическая', 'Робот', 'Вариатор'],
    group: 'Технические характеристики',
  },
  {
    key: 'mileage',
    label: 'Показания одометра',
    type: 'number',
    min: 0,
    unit: 'км',
    group: 'Технические характеристики',
  },
  {
    key: 'color',
    label: 'Цвет',
    type: 'text',
    group: 'Технические характеристики',
  },
  {
    key: 'bodyNumber',
    label: 'Номер кузова',
    type: 'text',
    group: 'Технические характеристики',
  },
  {
    key: 'chassisNumber',
    label: 'Номер шасси',
    type: 'text',
    group: 'Технические характеристики',
  },
  {
    key: 'frameNumber',
    label: 'Заводской номер машины (рамы)',
    type: 'text',
    group: 'Технические характеристики',
  },
];

// Атрибуты для грузового транспорта
const truckAttributes: CollateralAttribute[] = [
  ...vehicleAttributes,
  {
    key: 'loadCapacity',
    label: 'Грузоподъемность',
    type: 'number',
    required: true,
    min: 0,
    unit: 'т',
    group: 'Технические характеристики',
  },
  {
    key: 'bodyType',
    label: 'Тип кузова',
    type: 'select',
    options: ['Бортовой', 'Тентованный', 'Рефрижератор', 'Самосвал', 'Фургон', 'Прицепы/полуприцепы'],
    group: 'Технические характеристики',
  },
];

// Атрибуты для оборудования и техники
const equipmentAttributes: CollateralAttribute[] = [
  ...commonAttributes,
  {
    key: 'name',
    label: 'Наименование',
    type: 'text',
    required: true,
    placeholder: 'Наименование оборудования',
    group: 'Основная информация',
  },
  {
    key: 'manufacturer',
    label: 'Предприятие - изготовитель',
    type: 'text',
    placeholder: 'Производитель',
    group: 'Основная информация',
  },
  {
    key: 'model',
    label: 'Модель',
    type: 'text',
    placeholder: 'Модель оборудования',
    group: 'Основная информация',
  },
  {
    key: 'year',
    label: 'Год выпуска',
    type: 'number',
    min: 1900,
    max: new Date().getFullYear(),
    group: 'Основная информация',
  },
  {
    key: 'serialNumber',
    label: 'Заводской номер',
    type: 'text',
    placeholder: 'Серийный номер',
    group: 'Основная информация',
  },
  {
    key: 'inventoryNumber',
    label: 'Инвентарный номер',
    type: 'text',
    group: 'Основная информация',
  },
  {
    key: 'type',
    label: 'Тип техники',
    type: 'text',
    placeholder: 'Тип техники',
    group: 'Основная информация',
  },
  {
    key: 'power',
    label: 'Мощность',
    type: 'number',
    min: 0,
    unit: 'кВт',
    group: 'Технические характеристики',
  },
  {
    key: 'operatingHours',
    label: 'Наработка (при наличии)',
    type: 'number',
    min: 0,
    unit: 'моточасов',
    group: 'Технические характеристики',
  },
  {
    key: 'country',
    label: 'Страна - изготовитель',
    type: 'text',
    group: 'Основная информация',
  },
  {
    key: 'balanceValue',
    label: 'Остаточная балансовая стоимость',
    type: 'number',
    min: 0,
    unit: 'руб.',
    group: 'Оценка',
  },
];

// Справочник атрибутов по видам имущества
export const COLLATERAL_ATTRIBUTES_CONFIG: CollateralAttributesConfig = {
  // Жилая недвижимость
  apartment: residentialRealEstateAttributes,
  room: residentialRealEstateAttributes,
  house: residentialRealEstateAttributes,
  townhouse: residentialRealEstateAttributes,
  land_residential: [
    ...commonAttributes,
    {
      key: 'totalAreaHectares',
      label: 'Общая площадь',
      type: 'number',
      required: true,
      min: 0,
      unit: 'сот.',
      group: 'Параметры объекта',
    },
    {
      key: 'landCadastralNumber',
      label: 'Кадастровый номер',
      type: 'text',
      required: true,
      placeholder: '23:49:0303008:1915',
      group: 'Основная информация',
    },
    {
      key: 'landCategory',
      label: 'Категория земель',
      type: 'select',
      required: true,
      options: [
        'земли населенных пунктов',
        'земли сельскохозяйственного назначения',
        'земли промышленности',
        'земли особо охраняемых территорий',
      ],
      group: 'Основная информация',
    },
    {
      key: 'landPermittedUse',
      label: 'Разрешенный вид использования',
      type: 'text',
      required: true,
      placeholder: 'Вид разрешенного использования',
      group: 'Основная информация',
    },
    {
      key: 'utilities',
      label: 'Коммуникации',
      type: 'select',
      options: ['Все', 'Частично', 'Отсутствуют'],
      group: 'Инфраструктура',
    },
  ],

  // Коммерческая недвижимость
  office: commercialRealEstateAttributes,
  retail: [
    ...commercialRealEstateAttributes,
    {
      key: 'tradingArea',
      label: 'Торговая площадь',
      type: 'number',
      min: 0,
      unit: 'кв.м',
      group: 'Параметры объекта',
    },
    {
      key: 'showcaseLength',
      label: 'Длина витрины',
      type: 'number',
      min: 0,
      unit: 'м',
      group: 'Параметры объекта',
    },
    {
      key: 'entrance',
      label: 'Вход',
      type: 'select',
      options: ['Отдельный', 'Общий'],
      group: 'Параметры объекта',
    },
  ],
  warehouse: warehouseAttributes,
  hotel: [
    ...commercialRealEstateAttributes,
    {
      key: 'roomsCount',
      label: 'Количество номеров',
      type: 'number',
      required: true,
      min: 1,
      group: 'Параметры объекта',
    },
    {
      key: 'category',
      label: 'Категория',
      type: 'select',
      options: ['Без категории', '1 звезда', '2 звезды', '3 звезды', '4 звезды', '5 звезд'],
      group: 'Параметры объекта',
    },
    {
      key: 'restaurant',
      label: 'Наличие ресторана',
      type: 'boolean',
      group: 'Инфраструктура',
    },
  ],
  catering: [
    ...commercialRealEstateAttributes,
    {
      key: 'hallArea',
      label: 'Площадь зала',
      type: 'number',
      min: 0,
      unit: 'кв.м',
      group: 'Параметры объекта',
    },
    {
      key: 'seatingCapacity',
      label: 'Количество посадочных мест',
      type: 'number',
      min: 0,
      group: 'Параметры объекта',
    },
    {
      key: 'kitchen',
      label: 'Наличие кухни',
      type: 'boolean',
      group: 'Параметры объекта',
    },
  ],
  gas_station: gasStationAttributes,
  car_dealership: [
    ...commercialRealEstateAttributes,
    {
      key: 'showroomArea',
      label: 'Площадь шоурума',
      type: 'number',
      min: 0,
      unit: 'кв.м',
      group: 'Параметры объекта',
    },
    {
      key: 'serviceArea',
      label: 'Площадь СТО',
      type: 'number',
      min: 0,
      unit: 'кв.м',
      group: 'Параметры объекта',
    },
    {
      key: 'liftCapacity',
      label: 'Количество подъемников',
      type: 'number',
      min: 0,
      group: 'Параметры объекта',
    },
  ],

  // Промышленная недвижимость
  industrial_building: [
    ...commercialRealEstateAttributes,
    {
      key: 'productionArea',
      label: 'Производственная площадь',
      type: 'number',
      min: 0,
      unit: 'кв.м',
      group: 'Параметры объекта',
    },
    {
      key: 'craneway',
      label: 'Наличие кран-балки',
      type: 'boolean',
      group: 'Параметры объекта',
    },
    {
      key: 'craneCapacity',
      label: 'Грузоподъемность кран-балки',
      type: 'number',
      min: 0,
      unit: 'т',
      group: 'Параметры объекта',
    },
    {
      key: 'power',
      label: 'Электрическая мощность',
      type: 'number',
      min: 0,
      unit: 'кВт',
      group: 'Инфраструктура',
    },
  ],
  workshop: [
    ...commercialRealEstateAttributes,
    {
      key: 'productionArea',
      label: 'Производственная площадь',
      type: 'number',
      min: 0,
      unit: 'кв.м',
      group: 'Параметры объекта',
    },
    {
      key: 'specialization',
      label: 'Специализация цеха',
      type: 'text',
      group: 'Параметры объекта',
    },
  ],

  // Движимое имущество
  car_passenger: vehicleAttributes,
  car_truck: truckAttributes,
  equipment: equipmentAttributes,
  machinery: equipmentAttributes,

  // Общие типы (для использования в залоговых заключениях)
  'Недвижимость': realEstateCommonAttributes,
  'Транспортные средства': vehicleAttributes,
  'Оборудование': equipmentAttributes,
  'Товары в обороте': [
    ...commonAttributes,
    {
      key: 'quantity',
      label: 'Количество',
      type: 'number',
      min: 0,
      group: 'Параметры объекта',
    },
    {
      key: 'unit',
      label: 'Единица измерения',
      type: 'text',
      group: 'Параметры объекта',
    },
  ],
  'Ценные бумаги': [
    ...commonAttributes,
    {
      key: 'securityType',
      label: 'Тип ценных бумаг',
      type: 'select',
      options: ['Акции', 'Облигации', 'Векселя', 'Депозитарные расписки'],
      group: 'Основная информация',
    },
    {
      key: 'issuer',
      label: 'Эмитент',
      type: 'text',
      group: 'Основная информация',
    },
    {
      key: 'quantity',
      label: 'Количество',
      type: 'number',
      min: 0,
      group: 'Параметры объекта',
    },
  ],
  'Права требования': [
    ...commonAttributes,
    {
      key: 'debtor',
      label: 'Должник',
      type: 'text',
      group: 'Основная информация',
    },
    {
      key: 'debtAmount',
      label: 'Сумма долга',
      type: 'number',
      min: 0,
      unit: 'руб.',
      group: 'Параметры объекта',
    },
  ],
};

/**
 * Получение атрибутов для типа имущества
 * @param collateralType - Тип имущества (ObjectTypeKey или общий тип залога)
 * @returns Массив атрибутов
 */
export const getCollateralAttributes = (collateralType: string | null | undefined): CollateralAttribute[] => {
  if (!collateralType) return commonAttributes;
  return COLLATERAL_ATTRIBUTES_CONFIG[collateralType] || commonAttributes;
};

/**
 * Получение атрибутов, сгруппированных по группам
 * @param collateralType - Тип имущества
 * @returns Объект с группами атрибутов
 */
export const getGroupedCollateralAttributes = (
  collateralType: string | null | undefined
): Record<string, CollateralAttribute[]> => {
  const attributes = getCollateralAttributes(collateralType);
  const grouped: Record<string, CollateralAttribute[]> = {};

  attributes.forEach(attr => {
    const group = attr.group || 'Прочее';
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(attr);
  });

  return grouped;
};

/**
 * Получение значения атрибута из объекта данных
 * @param data - Объект данных
 * @param attributeKey - Ключ атрибута
 * @returns Значение атрибута
 */
export const getAttributeValue = (data: any, attributeKey: string): any => {
  return data?.[attributeKey] ?? null;
};

/**
 * Установка значения атрибута в объект данных
 * @param data - Объект данных
 * @param attributeKey - Ключ атрибута
 * @param value - Значение
 */
export const setAttributeValue = (data: any, attributeKey: string, value: any): void => {
  if (data) {
    data[attributeKey] = value;
  }
};

