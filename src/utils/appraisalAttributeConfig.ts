export type AppraisalAssetGroup =
  | 'real_estate'
  | 'land'
  | 'movable'
  | 'metals_goods'
  | 'equity'
  | 'rights';

export interface AppraisalAttributeField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  placeholder?: string;
  options?: string[];
  suffix?: string;
}

export interface AppraisalTypeConfig {
  assetGroup: AppraisalAssetGroup;
  fields: AppraisalAttributeField[];
}

const REAL_ESTATE_FIELDS: AppraisalAttributeField[] = [
  { key: 'location', label: 'Адрес/локация', placeholder: 'Регион, город, улица' },
  { key: 'areaSqm', label: 'Площадь, м²', type: 'number', placeholder: 'Общая площадь' },
  { key: 'floors', label: 'Этажность/уровни', type: 'number', placeholder: 'Количество этажей' },
  { key: 'condition', label: 'Состояние', placeholder: 'Например, требует ремонта/хорошее' },
];

const LAND_FIELDS: AppraisalAttributeField[] = [
  { key: 'location', label: 'Местоположение', placeholder: 'Регион, населённый пункт' },
  { key: 'areaHa', label: 'Площадь, га', type: 'number', placeholder: 'Общая площадь' },
  { key: 'landUse', label: 'Назначение', placeholder: 'С/х, коммерческое, ИЖС и т.д.' },
  { key: 'ownershipType', label: 'Тип права', placeholder: 'Собственность / аренда' },
];

const MOVABLE_FIELDS: AppraisalAttributeField[] = [
  { key: 'baseLocation', label: 'Место базирования', placeholder: 'Город, склад, порт' },
  { key: 'year', label: 'Год выпуска', type: 'number', placeholder: 'Например, 2018' },
  { key: 'condition', label: 'Состояние', placeholder: 'Отличное / рабочее / требует ремонта' },
  { key: 'usageHours', label: 'Наработка/пробег', placeholder: 'км или моточасы' },
];

const EQUITY_FIELDS: AppraisalAttributeField[] = [
  { key: 'companyName', label: 'Компания/эмитент', placeholder: 'Наименование юрлица' },
  { key: 'sharePercent', label: 'Доля, %', type: 'number', placeholder: 'Размер доли' },
  { key: 'financialSnapshot', label: 'Финансовые показатели', placeholder: 'Выручка, EBITDA, прибыль' },
  { key: 'corporateRights', label: 'Особенности прав', placeholder: 'Преимущественные права, ограничения' },
];

const RIGHTS_FIELDS: AppraisalAttributeField[] = [
  { key: 'debtor', label: 'Должник / контрагент', placeholder: 'Компания / физлицо' },
  { key: 'claimAmount', label: 'Сумма требования (₽)', type: 'number', placeholder: 'Номинал требования' },
  { key: 'maturity', label: 'Срок погашения', placeholder: 'Дата или период' },
  { key: 'claimType', label: 'Тип права', placeholder: 'Договор, уступка, ИС и т.д.' },
];

const GOODS_FIELDS: AppraisalAttributeField[] = [
  { key: 'storageLocation', label: 'Место хранения', placeholder: 'Склад, регион' },
  { key: 'quantity', label: 'Количество / объём', placeholder: 'шт., т, м³ и т.д.' },
  { key: 'quality', label: 'Качество/сорт', placeholder: 'ГОСТ, сорт, бренд' },
  { key: 'turnoverRate', label: 'Оборачиваемость', placeholder: 'Срок реализации / оборота' },
];

const DEFAULT_FIELDS_BY_GROUP: Record<AppraisalAssetGroup, AppraisalAttributeField[]> = {
  real_estate: REAL_ESTATE_FIELDS,
  land: LAND_FIELDS,
  movable: MOVABLE_FIELDS,
  metals_goods: GOODS_FIELDS,
  equity: EQUITY_FIELDS,
  rights: RIGHTS_FIELDS,
};

const TYPE_CATEGORY_MAP: Record<string, AppraisalAssetGroup> = {
  'воздушные суда': 'real_estate',
  'все имущество залогодателя': 'real_estate',
  'доли в уставных капиталах обществ с ограниченной ответственностью': 'equity',
  'единый недвижимый комплекс': 'real_estate',
  'железнодорожный подвижной состав': 'movable',
  'здание': 'real_estate',
  'земельный участок': 'land',
  'имущественный комплекс': 'real_estate',
  'космические объекты': 'real_estate',
  'машино-место': 'real_estate',
  'машины и оборудование': 'movable',
  'наземные безрельсовые механические транспортные средства, прицепы': 'movable',
  'недвижимое имущество и права аренды недвижимого имущества': 'real_estate',
  'объект незавершенного строительства': 'real_estate',
  'плавучие сооружения': 'movable',
  'плавучие сооружения, не являющиеся судами': 'movable',
  'помещение': 'real_estate',
  'прочие движимые вещи': 'movable',
  'прочие имущественные права требования': 'rights',
  'прочие ценные бумаги': 'equity',
  'сооружение': 'real_estate',
  'суда, используемые для иных целей': 'real_estate',
  'суда, используемые для перевозки грузов, и (или) буксировки, а также хранения грузов': 'real_estate',
  'суда, используемые для перевозки пассажиров и их багажа': 'real_estate',
  'суда, используемые для рыболовства': 'real_estate',
  'товары в обороте': 'movable',
  'эмиссионные ценные бумаги': 'equity',
};

const NORMALIZE = (value?: string) =>
  (value || '').trim().toLowerCase().replace(/\s+/g, ' ');

export const getAppraisalConfigForType = (typeName?: string | null): AppraisalTypeConfig | null => {
  if (!typeName) {
    return null;
  }
  const normalized = NORMALIZE(typeName);
  const assetGroup =
    TYPE_CATEGORY_MAP[normalized] ||
    (normalized.includes('земел') ? 'land' :
      normalized.includes('ценн') || normalized.includes('акц') || normalized.includes('дол') ? 'equity' :
      normalized.includes('прав') ? 'rights' :
      normalized.includes('товар') ? 'metals_goods' :
      normalized.includes('оборуд') || normalized.includes('транспорт') ? 'movable' :
      'real_estate');

  return {
    assetGroup,
    fields: DEFAULT_FIELDS_BY_GROUP[assetGroup],
  };
};

export const formatAppraisalAttributes = (
  attributes?: Record<string, any>,
  fields: AppraisalAttributeField[] = []
): string => {
  if (!attributes) return '';
  const labelByKey = fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = field.label;
    return acc;
  }, {});

  const parts = Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${labelByKey[key] || key}: ${value}`);
  return parts.join('; ');
};

