/**
 * Генерация реестров мониторинга и переоценок на основе карточек обеспечения
 */

import type { ExtendedCollateralCard } from '@/types';
import type { MonitoringPlanEntry, RevaluationPlanEntry, MonitoringTimeframe } from '@/types/monitoring';
import dayjs from 'dayjs';

/**
 * Определение временного интервала на основе количества дней до даты
 */
const getTimeframe = (daysUntil: number): MonitoringTimeframe => {
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 7) return 'week';
  if (daysUntil <= 30) return 'month';
  if (daysUntil <= 90) return 'quarter';
  return 'later';
};

/**
 * Преобразование даты из формата DD.MM.YYYY в Date
 */
const parseDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

/**
 * Форматирование даты в формат DD.MM.YYYY
 */
const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

/**
 * Получение базового типа обеспечения на основе типа имущества
 */
const getBaseType = (propertyType: string | undefined, mainCategory: string): string => {
  if (propertyType) {
    // Упрощаем название типа имущества для базового типа
    if (propertyType.includes('недвижимость') || propertyType.includes('здание') || propertyType.includes('помещение')) {
      return 'Недвижимость';
    }
    if (propertyType.includes('автомобиль') || propertyType.includes('транспорт')) {
      return 'Транспорт';
    }
    if (propertyType.includes('оборудование') || propertyType.includes('техника')) {
      return 'Оборудование';
    }
    if (propertyType.includes('товар') || propertyType.includes('сырье')) {
      return 'Товары и сырье';
    }
    if (propertyType.includes('право') || propertyType.includes('доля')) {
      return 'Имущественные права';
    }
    return propertyType;
  }
  
  // Fallback на основную категорию
  switch (mainCategory) {
    case 'real_estate':
      return 'Недвижимость';
    case 'movable':
      return 'Движимое имущество';
    case 'property_rights':
      return 'Имущественные права';
    default:
      return 'Прочее';
  }
};

/**
 * Получение метода мониторинга на основе типа имущества
 */
const getMonitoringMethod = (propertyType: string | undefined, mainCategory: string): string => {
  if (mainCategory === 'real_estate') {
    return 'Выездной осмотр';
  }
  if (mainCategory === 'movable') {
    if (propertyType?.includes('автомобиль') || propertyType?.includes('транспорт')) {
      return 'Документарная проверка + онлайн-проверка';
    }
    return 'Выездной осмотр';
  }
  return 'Документарная проверка';
};

/**
 * Получение метода переоценки на основе типа имущества
 */
const getRevaluationMethod = (propertyType: string | undefined, mainCategory: string): string => {
  if (mainCategory === 'real_estate') {
    return 'Оценка недвижимости';
  }
  if (mainCategory === 'movable') {
    if (propertyType?.includes('автомобиль') || propertyType?.includes('транспорт')) {
      return 'Оценка транспортных средств';
    }
    return 'Оценка оборудования';
  }
  return 'Оценка имущественных прав';
};

/**
 * Получение ответственного сотрудника (заглушка, можно расширить)
 */
const getOwner = (): string => {
  const owners = [
    'Иванов И.И.',
    'Петров П.П.',
    'Сидоров С.С.',
    'Смирнов А.А.',
    'Кузнецов Д.Д.',
  ];
  return owners[Math.floor(Math.random() * owners.length)];
};

/**
 * Генерация реестра мониторинга на основе карточек обеспечения
 */
export const generateMonitoringPlan = (cards: ExtendedCollateralCard[]): MonitoringPlanEntry[] => {
  const entries: MonitoringPlanEntry[] = [];
  const now = dayjs();

  cards.forEach(card => {
    if (!card.nextMonitoringDate) return;

    const nextMonitoringDate = parseDate(card.nextMonitoringDate);
    if (!nextMonitoringDate) return;

    const lastMonitoringDate = parseDate(card.monitoringDate || card.nextMonitoringDate);
    const daysUntil = dayjs(nextMonitoringDate).diff(now, 'day');
    const timeframe = getTimeframe(daysUntil);

    const borrower = card.partners?.find(p => p.role === 'owner');
    const pledger = card.partners?.find(p => p.role === 'pledgor');

    const entry: MonitoringPlanEntry = {
      reference: card.reference || null,
      borrower: borrower
        ? borrower.type === 'legal'
          ? borrower.organizationName
          : `${borrower.lastName} ${borrower.firstName} ${borrower.middleName || ''}`.trim()
        : null,
      pledger: pledger
        ? pledger.type === 'legal'
          ? pledger.organizationName
          : `${pledger.lastName} ${pledger.firstName} ${pledger.middleName || ''}`.trim()
        : null,
      segment: null,
      group: null,
      collateralType: card.propertyType || null,
      baseType: getBaseType(card.propertyType, card.mainCategory),
      frequencyMonths: card.monitoringFrequencyMonths || 12,
      monitoringType: card.characteristics?.MONITORING_TYPE as string || null,
      monitoringMethod: getMonitoringMethod(card.propertyType, card.mainCategory),
      lastMonitoringDate: lastMonitoringDate ? formatDate(lastMonitoringDate) : formatDate(nextMonitoringDate),
      plannedDate: formatDate(nextMonitoringDate),
      timeframe,
      owner: getOwner(),
      priority: card.characteristics?.PRIORITY as string || null,
      liquidity: card.characteristics?.LIQUIDITY as string || null,
      collateralValue: card.pledgeValue || null,
    };

    entries.push(entry);
  });

  return entries;
};

/**
 * Генерация реестра переоценок на основе карточек обеспечения
 */
export const generateRevaluationPlan = (cards: ExtendedCollateralCard[]): RevaluationPlanEntry[] => {
  const entries: RevaluationPlanEntry[] = [];
  const now = dayjs();

  cards.forEach(card => {
    if (!card.nextEvaluationDate) return;

    const nextEvaluationDate = parseDate(card.nextEvaluationDate);
    if (!nextEvaluationDate) return;

    const lastEvaluationDate = parseDate(card.lastEvaluationDate || card.evaluationDate || card.nextEvaluationDate);
    const daysUntil = dayjs(nextEvaluationDate).diff(now, 'day');
    const timeframe = getTimeframe(daysUntil);

    const borrower = card.partners?.find(p => p.role === 'owner');
    const pledger = card.partners?.find(p => p.role === 'pledgor');

    // Определяем периодичность переоценки (обычно 12 месяцев для недвижимости, 6 для движимого)
    const evaluationFrequencyMonths = card.mainCategory === 'real_estate' ? 12 : 6;

    const entry: RevaluationPlanEntry = {
      reference: card.reference || null,
      borrower: borrower
        ? borrower.type === 'legal'
          ? borrower.organizationName
          : `${borrower.lastName} ${borrower.firstName} ${borrower.middleName || ''}`.trim()
        : null,
      pledger: pledger
        ? pledger.type === 'legal'
          ? pledger.organizationName
          : `${pledger.lastName} ${pledger.firstName} ${pledger.middleName || ''}`.trim()
        : null,
      segment: null,
      group: null,
      collateralType: card.propertyType || null,
      baseType: getBaseType(card.propertyType, card.mainCategory),
      frequencyMonths: evaluationFrequencyMonths,
      lastRevaluationDate: lastEvaluationDate ? formatDate(lastEvaluationDate) : formatDate(nextEvaluationDate),
      plannedDate: formatDate(nextEvaluationDate),
      timeframe,
      owner: getOwner(),
      priority: card.characteristics?.PRIORITY as string || null,
      collateralValue: card.pledgeValue || null,
      marketValue: card.marketValue || null,
      revaluationMethod: getRevaluationMethod(card.propertyType, card.mainCategory),
    };

    entries.push(entry);
  });

  return entries;
};

