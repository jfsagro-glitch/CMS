import { deepSeekService } from './DeepSeekService';
import { learningService } from './LearningService';
import type { ExtendedCollateralCard } from '@/types';

export type AppraisalConfidence = 'high' | 'medium' | 'low';

export interface AppraisalSkills {
  incomeApproach: number;
  incomeMethods: {
    dcf: number;
    directCapitalization: number;
    grossRentMultiplier: number;
  };
  comparativeApproach: number;
  comparativeMethods: {
    salesComparison: number;
    marketExtraction: number;
  };
  costApproach: number;
  costMethods: {
    replacementCost: number;
    reproductionCost: number;
    depreciation: number;
  };
}

export interface AppraisalRequestInput {
  objectName: string;
  assetGroup: string;
  assetType: string;
  location?: string;
  area?: number;
  areaUnit?: string;
  condition?: string;
  incomePerYear?: number;
  occupancy?: string;
  purpose?: string;
  additionalFactors?: string;
  card?: ExtendedCollateralCard | null;
  skills?: AppraisalSkills;
}

export interface AppraisalEstimate {
  summary: string;
  marketValue: number;
  collateralValue: number;
  recommendedLtv: number;
  confidence: AppraisalConfidence;
  methodology: string;
  riskFactors: string[];
  recommendedActions: string[];
  assumptions: string[];
  comparables?: string[];
}

const parseJsonFromResponse = (response: string): any | null => {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.warn('Не удалось разобрать JSON из ответа AI:', error);
    return null;
  }
};

const fallbackEstimate = (input: AppraisalRequestInput): AppraisalEstimate => {
  const baseArea = input.area && input.area > 0 ? input.area : 100;
  const multipliers: Record<string, number> = {
    real_estate: 120000,
    land: 60000,
    movable: 80000,
    metals_goods: 50000,
    equity: 100000,
    rights: 70000,
  };
  const basePrice = multipliers[input.assetGroup as keyof typeof multipliers] || 90000;
  const marketValue = Math.round(baseArea * basePrice);
  const collateralValue = Math.round(marketValue * 0.7);

  return {
    summary: `Оценка выполнена эвристически на основе базовых параметров для группы "${input.assetGroup}".`,
    marketValue,
    collateralValue,
    recommendedLtv: 70,
    confidence: 'medium',
    methodology: 'Эвристический расчет (замена при отсутствии ответа ИИ)',
    riskFactors: ['Необходима проверка данных объекта', 'Эвристический расчет без данных аналогов'],
    recommendedActions: ['Запросить отчёт от независимого оценщика', 'Уточнить рыночные показатели по региону'],
    assumptions: ['Использованы средние рыночные показатели', 'Состояние объекта принято удовлетворительным'],
  };
};

const normalizeEstimate = (raw: any, input: AppraisalRequestInput): AppraisalEstimate => {
  if (!raw || typeof raw !== 'object') {
    return fallbackEstimate(input);
  }

  const toNumber = (value: any, defaultValue: number) => {
    const num = Number(
      typeof value === 'string' ? value.replace(/[^0-9.-]+/g, '') : value
    );
    return Number.isFinite(num) && num > 0 ? num : defaultValue;
  };

  const marketValue = toNumber(raw.marketValue ?? raw.market_price, 0);
  const collateralValue = toNumber(raw.collateralValue ?? raw.secured_value, marketValue * 0.7);
  const recommendedLtv = toNumber(raw.recommendedLtv ?? raw.ltv ?? (collateralValue / (marketValue || 1)) * 100, 70);

  const result = {
    summary: raw.summary || raw.justification || raw.analysis || 'Проанализируйте объект дополнительными методами.',
    marketValue: marketValue || fallbackEstimate(input).marketValue,
    collateralValue: collateralValue || fallbackEstimate(input).collateralValue,
    recommendedLtv: Math.min(100, Math.max(0, Math.round(recommendedLtv))),
    confidence: (raw.confidence as AppraisalConfidence) || 'medium',
    methodology: raw.methodology || raw.method || 'Сравнительный подход',
    riskFactors: Array.isArray(raw.riskFactors) ? raw.riskFactors : [],
    recommendedActions: Array.isArray(raw.recommendations) ? raw.recommendations : [],
    assumptions: Array.isArray(raw.assumptions) ? raw.assumptions : [],
    comparables: Array.isArray(raw.comparables) ? raw.comparables : undefined,
  };

  return result;
};

export const AppraisalAIService = {
  async generateEstimate(input: AppraisalRequestInput): Promise<AppraisalEstimate> {
    const contextParts: string[] = [
      `Категория: ${input.assetGroup}`,
      `Тип: ${input.assetType}`,
    ];

    if (input.location) contextParts.push(`Локация: ${input.location}`);
    if (input.area) contextParts.push(`Площадь/объём: ${input.area}${input.areaUnit || 'м²'}`);
    if (input.condition) contextParts.push(`Состояние: ${input.condition}`);
    if (input.incomePerYear) contextParts.push(`Чистый доход в год: ${input.incomePerYear} ₽`);
    if (input.occupancy) contextParts.push(`Заполняемость/использование: ${input.occupancy}`);
    if (input.purpose) contextParts.push(`Цель оценки: ${input.purpose}`);
    if (input.additionalFactors) contextParts.push(`Особенности: ${input.additionalFactors}`);

    if (input.card) {
      const card = input.card;
      contextParts.push(
        `Данные карточки: статус ${card.status}, категория ${card.mainCategory}, оценка ${card.marketValue || '—'}, залоговая ${card.pledgeValue || '—'}`
      );
      if (card.address?.fullAddress) {
        contextParts.push(`Адрес из карточки: ${card.address.fullAddress}`);
      }
      if (card.characteristics) {
        const keyChars = ['totalArea', 'totalAreaSqm', 'yearBuilt', 'objectCadastralNumber']
          .map(key => (card.characteristics as any)[key])
          .filter(Boolean);
        if (keyChars.length > 0) {
          contextParts.push(`Характеристики из карточки: ${keyChars.join(', ')}`);
        }
      }
    }

    // Формируем инструкцию с учетом настроек эквалайзера
    let instruction = `Ты действуешь как главный банковский оценщик. На основе предоставленных данных оцени объект и верни JSON со следующей структурой:
{
  "summary": "краткое обоснование оценки",
  "marketValue": 0,
  "collateralValue": 0,
  "recommendedLtv": 0,
  "confidence": "high|medium|low",
  "methodology": "описание применённых подходов",
  "riskFactors": ["..."],
  "recommendedActions": ["..."],
  "assumptions": ["..."],
  "comparables": ["описание аналогов..."]
}
Указывай значения в рублях. Если данных недостаточно, делай профессиональные допущения и фиксируй их в assumptions.`;

    // Добавляем настройки эквалайзера в инструкцию, если они предоставлены
    if (input.skills) {
      const skills = input.skills;
      const approachParts: string[] = [];
      
      if (skills.incomeApproach > 0) {
        approachParts.push(`Доходный подход (приоритет: ${skills.incomeApproach}%):`);
        if (skills.incomeMethods.dcf > 50) approachParts.push(`- Дисконтирование денежных потоков (DCF) - приоритет ${skills.incomeMethods.dcf}%`);
        if (skills.incomeMethods.directCapitalization > 50) approachParts.push(`- Прямая капитализация - приоритет ${skills.incomeMethods.directCapitalization}%`);
        if (skills.incomeMethods.grossRentMultiplier > 50) approachParts.push(`- Множитель валового дохода - приоритет ${skills.incomeMethods.grossRentMultiplier}%`);
      }
      
      if (skills.comparativeApproach > 0) {
        approachParts.push(`Сравнительный подход (приоритет: ${skills.comparativeApproach}%):`);
        if (skills.comparativeMethods.salesComparison > 50) approachParts.push(`- Сравнение продаж - приоритет ${skills.comparativeMethods.salesComparison}%`);
        if (skills.comparativeMethods.marketExtraction > 50) approachParts.push(`- Извлечение из рынка - приоритет ${skills.comparativeMethods.marketExtraction}%`);
      }
      
      if (skills.costApproach > 0) {
        approachParts.push(`Затратный подход (приоритет: ${skills.costApproach}%):`);
        if (skills.costMethods.replacementCost > 50) approachParts.push(`- Стоимость замещения - приоритет ${skills.costMethods.replacementCost}%`);
        if (skills.costMethods.reproductionCost > 50) approachParts.push(`- Стоимость воспроизводства - приоритет ${skills.costMethods.reproductionCost}%`);
        if (skills.costMethods.depreciation > 50) approachParts.push(`- Учет износа - приоритет ${skills.costMethods.depreciation}%`);
      }
      
      if (approachParts.length > 0) {
        instruction += `\n\nНастройки приоритетов методов оценки:\n${approachParts.join('\n')}\n\nИспользуй указанные методы и приоритеты при расчете оценки.`;
      }
    }

    try {
      const response = await deepSeekService.chat(
        [
          {
            role: 'user',
            content: `Оцени объект "${input.objectName}" и верни JSON в соответствии с инструкцией.\n\nДанные:\n${contextParts.join('\n')}`,
          },
        ],
        instruction
      );

      const parsed = parseJsonFromResponse(response);
      const estimate = normalizeEstimate(parsed, input);
      learningService.addCategoryExperience('appraisal', 4);
      return estimate;
    } catch (error) {
      console.error('Ошибка генерации оценки через AI:', error);
      const estimate = fallbackEstimate(input);
      learningService.addCategoryExperience('appraisal', 1);
      return estimate;
    }
  },
};

export default AppraisalAIService;

