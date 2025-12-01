import { deepSeekService } from './DeepSeekService';
import { learningService } from './LearningService';
import type { ExtendedCollateralCard } from '@/types';

export type AppraisalConfidence = 'high' | 'medium' | 'low';

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

const errorEstimate = (input: AppraisalRequestInput, reason: string): AppraisalEstimate => {
  return {
    summary: `Не удалось выполнить корректную оценку объекта "${input.objectName}" на основе ответа ИИ: ${reason}.`,
    marketValue: 0,
    collateralValue: 0,
    recommendedLtv: 0,
    confidence: 'low',
    methodology: 'Оценка не выполнена: требуется повторный запрос к ИИ или экспертная/классическая оценка.',
    riskFactors: [
      'Сбой или некорректный ответ сервиса ИИ',
      'Рекомендуется получить заключение независимого оценщика',
    ],
    recommendedActions: [
      'Повторить запрос к ИИ после проверки исходных данных',
      'При необходимости привлечь независимого оценщика',
    ],
    assumptions: ['Числовые значения оценки не сформированы, так как ответ ИИ не был корректно разобран.'],
  };
};

const normalizeEstimate = (raw: any, input: AppraisalRequestInput): AppraisalEstimate => {
  if (!raw || typeof raw !== 'object') {
    return errorEstimate(input, 'пустой или некорректный формат ответа');
  }

  const toNumber = (value: any, defaultValue: number) => {
    const num = Number(
      typeof value === 'string' ? value.replace(/[^0-9.-]+/g, '') : value
    );
    return Number.isFinite(num) && num > 0 ? num : defaultValue;
  };

  const marketValue = toNumber(raw.marketValue ?? raw.market_price, 0);
  const collateralValue = toNumber(raw.collateralValue ?? raw.secured_value, 0);
  const recommendedLtv = toNumber(
    raw.recommendedLtv ?? raw.ltv ?? (marketValue > 0 ? (collateralValue / marketValue) * 100 : 0),
    0
  );

  const result: AppraisalEstimate = {
    summary: raw.summary || raw.justification || raw.analysis || 'Проанализируйте объект дополнительными методами.',
    marketValue,
    collateralValue,
    recommendedLtv: Math.min(100, Math.max(0, Math.round(recommendedLtv))),
    confidence: (raw.confidence as AppraisalConfidence) || 'medium',
    methodology: raw.methodology || raw.method || 'Методология не указана явно в ответе ИИ.',
    riskFactors: Array.isArray(raw.riskFactors) ? raw.riskFactors : [],
    recommendedActions: Array.isArray(raw.recommendations) ? raw.recommendations : [],
    assumptions: Array.isArray(raw.assumptions) ? raw.assumptions : [],
    comparables: Array.isArray(raw.comparables) ? raw.comparables : undefined,
  };

  // Если ИИ не вернул адекватные числовые значения, считаем, что оценка не выполнена
  if (!result.marketValue && !result.collateralValue) {
    return errorEstimate(input, 'отсутствуют числовые значения стоимости в ответе ИИ');
  }

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

    const instruction = `Ты действуешь как главный банковский оценщик. На основе предоставленных данных оцени объект и верни JSON со следующей структурой:
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
      const estimate = errorEstimate(input, 'ошибка сервиса ИИ при генерации ответа');
      learningService.addCategoryExperience('appraisal', 1);
      return estimate;
    }
  },
};

export default AppraisalAIService;

