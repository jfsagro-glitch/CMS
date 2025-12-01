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
  if (!response || typeof response !== 'string') {
    console.warn('Ответ ИИ пуст или не является строкой');
    return null;
  }

  // Логируем ответ для отладки (только в development)
  if (import.meta.env.MODE === 'development') {
    console.log('Ответ ИИ для парсинга:', response.substring(0, 500));
  }

  // Стратегия 1: Ищем JSON в markdown код-блоках (```json ... ``` или ``` ... ```)
  const markdownJsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (markdownJsonMatch && markdownJsonMatch[1]) {
    try {
      return JSON.parse(markdownJsonMatch[1]);
    } catch (error) {
      console.warn('Не удалось распарсить JSON из markdown блока:', error);
    }
  }

  // Стратегия 2: Ищем JSON объект с правильным балансом скобок
  let braceCount = 0;
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < response.length; i++) {
    if (response[i] === '{') {
      if (startIndex === -1) {
        startIndex = i;
      }
      braceCount++;
    } else if (response[i] === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        endIndex = i;
        break;
      }
    }
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    try {
      const jsonStr = response.substring(startIndex, endIndex + 1);
      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn('Не удалось распарсить JSON с балансом скобок:', error);
    }
  }

  // Стратегия 3: Простой regex (как было раньше, но с более точным паттерном)
  const simpleJsonMatch = response.match(/\{[\s\S]*\}/);
  if (simpleJsonMatch) {
    try {
      return JSON.parse(simpleJsonMatch[0]);
    } catch (error) {
      console.warn('Не удалось распарсить JSON простым regex:', error);
    }
  }

  // Стратегия 4: Пробуем распарсить весь ответ как JSON (на случай если ИИ вернул чистый JSON)
  try {
    return JSON.parse(response.trim());
  } catch (error) {
    // Игнорируем, это нормально
  }

  console.warn('Не удалось извлечь JSON из ответа ИИ. Ответ:', response.substring(0, 200));
  return null;
};

const normalizeEstimate = (raw: any): AppraisalEstimate => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('ИИ не вернул корректный ответ. Попробуйте повторить запрос.');
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

  // Проверяем, что ИИ вернул валидные значения
  if (marketValue === 0 || collateralValue === 0) {
    throw new Error('ИИ не смог рассчитать стоимость объекта. Убедитесь, что предоставлены все необходимые данные и попробуйте повторить запрос.');
  }

  const result = {
    summary: raw.summary || raw.justification || raw.analysis || 'Проанализируйте объект дополнительными методами.',
    marketValue,
    collateralValue,
    recommendedLtv: Math.min(100, Math.max(0, Math.round(recommendedLtv))),
    confidence: (raw.confidence as AppraisalConfidence) || 'medium',
    methodology: raw.methodology || raw.method || 'Комплексный анализ с использованием доступных методов оценки',
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
    let instruction = `Ты действуешь как главный банковский оценщик. На основе предоставленных данных оцени объект и верни ТОЛЬКО валидный JSON без дополнительного текста, комментариев или markdown разметки.

КРИТИЧЕСКИ ВАЖНО: Верни ТОЛЬКО JSON объект, без markdown блоков, без пояснений до или после JSON. Начни ответ сразу с открывающей фигурной скобки { и закончи закрывающей }.

Структура JSON:
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

    // Делаем несколько попыток получения ответа от ИИ
    let lastError: Error | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await deepSeekService.chat(
          [
            {
              role: 'user',
              content: `Оцени объект "${input.objectName}" и верни ТОЛЬКО валидный JSON без дополнительного текста. ОБЯЗАТЕЛЬНО используй все доступные методы оценки (доходный, сравнительный, затратный подходы) и проведи комплексный анализ. Не используй эвристические расчеты.

Данные:
${contextParts.join('\n')}

Верни ответ в формате чистого JSON, начиная с { и заканчивая }. Без markdown блоков, без пояснений.`,
            },
          ],
          instruction + '\n\nВАЖНО: Всегда используй профессиональные методы оценки (доходный, сравнительный, затратный подходы). Никогда не используй эвристические расчеты. Если данных недостаточно, сделай профессиональные допущения и четко укажи их в assumptions.\n\nКРИТИЧЕСКИ ВАЖНО: Верни ТОЛЬКО JSON объект, без markdown разметки (```json), без пояснений до или после JSON. Начни ответ сразу с { и закончи }.'
        );

        const parsed = parseJsonFromResponse(response);
        if (!parsed) {
          throw new Error('ИИ не вернул JSON в ответе');
        }
        
        const estimate = normalizeEstimate(parsed);
        learningService.addCategoryExperience('appraisal', 4);
        return estimate;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Ошибка генерации оценки через AI (попытка ${attempt}/${maxRetries}):`, error);
        
        // Если это последняя попытка, выбрасываем ошибку
        if (attempt === maxRetries) {
          learningService.addCategoryExperience('appraisal', 1);
          throw new Error(`Не удалось получить оценку от ИИ после ${maxRetries} попыток. ${lastError.message}. Пожалуйста, проверьте данные и попробуйте еще раз.`);
        }
        
        // Ждем перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    // Этот код не должен выполниться, но на всякий случай
    throw lastError || new Error('Неизвестная ошибка при генерации оценки');
  },
};

export default AppraisalAIService;

