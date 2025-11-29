import referenceDataService from '@/services/ReferenceDataService';
import type { ReferenceDictionary } from '@/services/ReferenceDataService';

export interface AppraisalTypeOption {
  key: string;
  label: string;
  sourceGroup: string;
}

export interface AppraisalGroupOption {
  key: string;
  label: string;
  description?: string;
  types: AppraisalTypeOption[];
}

const GROUP_RULES: Array<{
  key: string;
  label: string;
  description?: string;
  keywords: string[];
}> = [
  {
    key: 'real_estate',
    label: 'Недвижимое имущество',
    description: 'Здания, помещения, коммерческие объекты, АЗС, склады',
    keywords: ['недвиж', 'здан', 'помещ', 'офис', 'торгов', 'склад', 'азс', 'сооруж', 'комплекс', 'жил', 'нежил', 'центр'],
  },
  {
    key: 'land',
    label: 'Земельные участки',
    description: 'Земля в собственности или аренде',
    keywords: ['земель', 'участ', 'аграр', 'сельск', 'пастбищ', 'кадастр'],
  },
  {
    key: 'movable',
    label: 'Движимое имущество',
    description: 'Оборудование, транспорт, спецтехника, ЖД состав',
    keywords: ['движим', 'оборуд', 'машин', 'транспорт', 'спецтех', 'подвиж', 'состав', 'вагон', 'автотранспорт', 'техника', 'суда', 'кораб', 'флот'],
  },
  {
    key: 'metals_goods',
    label: 'Товары и материалы',
    description: 'Будущий урожай, товары в обороте, металлы, сырьё',
    keywords: ['урожай', 'товар', 'сырь', 'металл', 'драгоцен', 'материал', 'запас'],
  },
  {
    key: 'equity',
    label: 'Доли, акции и ценные бумаги',
    description: 'Доли в УК, акции, паи, ценные бумаги',
    keywords: ['дол', 'уставн', 'акци', 'ценн', 'па', 'вексел', 'облигац', 'ипотечн', 'сертификат'],
  },
  {
    key: 'rights',
    label: 'Права и требования',
    description: 'Права требования, интеллектуальная собственность, договоры',
    keywords: ['прав', 'требован', 'интеллект', 'собствен', 'договор', 'депозит', 'банк', 'ип'],
  },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');

const resolveDictionary = (): ReferenceDictionary | null => {
  try {
    return referenceDataService.getDictionaryByCode('collateral_attributes') || null;
  } catch (error) {
    console.warn('Не удалось загрузить справочник атрибутов залога для таксономии:', error);
    return null;
  }
};

export const getAppraisalGroups = (): AppraisalGroupOption[] => {
  const dictionary = resolveDictionary();
  if (!dictionary) {
    return GROUP_RULES.map(rule => ({
      key: rule.key,
      label: rule.label,
      description: rule.description,
      types: [],
    }));
  }

  const groups = new Map<string, AppraisalTypeOption>();
  dictionary.items.forEach(item => {
    const groupName = item.metadata?.group as string | undefined;
    if (!groupName) return;
    const trimmed = groupName.trim();
    if (!trimmed) return;
    const key = slugify(trimmed);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: trimmed,
        sourceGroup: trimmed,
      });
    }
  });

  const unclassified: AppraisalTypeOption[] = [];
  const result = GROUP_RULES.map(rule => ({
    key: rule.key,
    label: rule.label,
    description: rule.description,
    types: [] as AppraisalTypeOption[],
  }));

  groups.forEach(group => {
    const lower = group.sourceGroup.toLowerCase();
    const matchedRule = result.find(rule =>
      rule && rule.key
        ? GROUP_RULES.find(gr => gr.key === rule.key)?.keywords.some(keyword => lower.includes(keyword))
        : false
    );

    if (matchedRule) {
      matchedRule.types.push(group);
    } else {
      unclassified.push(group);
    }
  });

  // Добавляем "Прочие" если остались группы без правил
  if (unclassified.length > 0) {
    result.push({
      key: 'other',
      label: 'Прочие активы и требования',
      description: 'Категории активов из справочников, не вошедшие в основные группы',
      types: unclassified,
    });
  }

  // Сортируем типы внутри групп по алфавиту
  result.forEach(group => {
    group.types.sort((a, b) => a.label.localeCompare(b.label, 'ru'));
  });

  return result;
};

