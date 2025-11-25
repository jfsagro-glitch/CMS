/**
 * Сервис для улучшения вопросов и генерации уточняющих вопросов
 */

interface QuestionAnalysis {
  needsClarification: boolean;
  clarificationQuestions: string[];
  detectedTopic: string;
  detectedAssetType?: string;
  detectedRiskType?: string;
  detectedRegistrationType?: string;
}

class QuestionEnhancementService {
  /**
   * Анализирует вопрос и определяет, нужны ли уточнения
   */
  analyzeQuestion(question: string): QuestionAnalysis {
    const lowerQuestion = question.toLowerCase();
    
    // Определяем тему вопроса
    const topic = this.detectTopic(lowerQuestion);
    
    // Определяем тип актива (если есть)
    const assetType = this.detectAssetType(lowerQuestion);
    
    // Определяем тип риска (если есть)
    const riskType = this.detectRiskType(lowerQuestion);
    
    // Определяем тип регистрации (если есть)
    const registrationType = this.detectRegistrationType(lowerQuestion);
    
    // Генерируем уточняющие вопросы
    const clarificationQuestions = this.generateClarificationQuestions(
      lowerQuestion,
      topic,
      assetType,
      riskType,
      registrationType
    );
    
    return {
      needsClarification: clarificationQuestions.length > 0,
      clarificationQuestions,
      detectedTopic: topic,
      detectedAssetType: assetType,
      detectedRiskType: riskType,
      detectedRegistrationType: registrationType,
    };
  }

  /**
   * Определяет тему вопроса
   */
  private detectTopic(question: string): string {
    if (question.includes('оценк') || question.includes('стоимость') || question.includes('ltv')) {
      return 'valuation';
    }
    if (question.includes('риск') || question.includes('опасн') || question.includes('проблем')) {
      return 'risk';
    }
    if (question.includes('регистрац') || question.includes('обременен') || question.includes('росреестр') || question.includes('егрн')) {
      return 'registration';
    }
    if (question.includes('документ') || question.includes('оформлен')) {
      return 'documentation';
    }
    if (question.includes('осмотр') || question.includes('проверк') || question.includes('мониторинг')) {
      return 'inspection';
    }
    return 'general';
  }

  /**
   * Определяет тип актива
   */
  private detectAssetType(question: string): string | undefined {
    const assetTypes = [
      { keywords: ['недвижимость', 'квартир', 'дом', 'здание', 'помещен', 'участок', 'земл'], type: 'real_estate' },
      { keywords: ['автомобил', 'машин', 'транспорт', 'грузовик'], type: 'vehicle' },
      { keywords: ['оборудован', 'техник', 'станок', 'машин'], type: 'equipment' },
      { keywords: ['бизнес', 'предприяти', 'компани', 'дол'], type: 'business' },
      { keywords: ['интеллектуальн', 'патент', 'товарный знак', 'ноу-хау'], type: 'intellectual' },
      { keywords: ['азс', 'автозаправк'], type: 'gas_station' },
      { keywords: ['торгов', 'магазин', 'тц', 'торговый центр'], type: 'retail' },
    ];

    for (const assetType of assetTypes) {
      if (assetType.keywords.some(keyword => question.includes(keyword))) {
        return assetType.type;
      }
    }

    return undefined;
  }

  /**
   * Определяет тип риска
   */
  private detectRiskType(question: string): string | undefined {
    const riskTypes = [
      { keywords: ['кредитн', 'дефолт', 'неплатеж'], type: 'credit' },
      { keywords: ['рыночн', 'ликвидн', 'стоимость'], type: 'market' },
      { keywords: ['юридическ', 'право', 'собственн', 'обременен'], type: 'legal' },
      { keywords: ['операционн', 'сохранн', 'поврежден', 'уничтожен'], type: 'operational' },
      { keywords: ['нетипов', 'специфическ', 'особ'], type: 'atypical' },
    ];

    for (const riskType of riskTypes) {
      if (riskType.keywords.some(keyword => question.includes(keyword))) {
        return riskType.type;
      }
    }

    return undefined;
  }

  /**
   * Определяет тип регистрации
   */
  private detectRegistrationType(question: string): string | undefined {
    if (question.includes('ипотек') || question.includes('недвижимость')) {
      return 'mortgage';
    }
    if (question.includes('движим') || question.includes('автомобил') || question.includes('оборудован')) {
      return 'movable';
    }
    if (question.includes('бизнес') || question.includes('дол')) {
      return 'business';
    }
    return undefined;
  }

  /**
   * Генерирует уточняющие вопросы на основе анализа
   */
  private generateClarificationQuestions(
    question: string,
    topic: string,
    assetType?: string,
    riskType?: string,
    registrationType?: string
  ): string[] {
    const questions: string[] = [];

    // Общие уточнения для оценки
    if (topic === 'valuation' && !assetType) {
      questions.push('Какой тип актива вы хотите оценить? (недвижимость, движимое имущество, бизнес и т.д.)');
    }

    if (topic === 'valuation' && assetType === 'real_estate' && !question.includes('метод')) {
      questions.push('Какой метод оценки вас интересует? (сравнительный, доходный, затратный)');
    }

    if (topic === 'valuation' && !question.includes('стоимость') && !question.includes('ltv')) {
      questions.push('Какая стоимость вас интересует? (рыночная, залоговая, кадастровая)');
    }

    // Уточнения для рисков
    if (topic === 'risk' && !riskType) {
      questions.push('Какой тип риска вас интересует? (кредитный, рыночный, юридический, операционный)');
    }

    if (topic === 'risk' && !assetType) {
      questions.push('Для какого типа актива вы хотите проанализировать риски?');
    }

    // Уточнения для регистрации
    if (topic === 'registration' && !registrationType) {
      questions.push('Какой тип залога вы хотите зарегистрировать? (ипотека, залог движимого имущества, залог прав)');
    }

    if (topic === 'registration' && !question.includes('документ') && !question.includes('процедур')) {
      questions.push('Вас интересует процедура регистрации или необходимые документы?');
    }

    // Уточнения для конкретных типов активов
    if (assetType === 'real_estate' && !question.includes('расположен') && !question.includes('адрес')) {
      questions.push('Где расположен объект недвижимости? (регион, город, район)');
    }

    if (assetType === 'gas_station' && !question.includes('характеристик')) {
      questions.push('Какие характеристики АЗС важны? (количество колонок, площадь, местоположение)');
    }

    if (assetType === 'retail' && !question.includes('площад')) {
      questions.push('Какая площадь торгового помещения? Есть ли арендаторы?');
    }

    // Уточнения для LTV
    if (question.includes('ltv') && !question.includes('сумм') && !question.includes('кредит')) {
      questions.push('Какая сумма кредита и рыночная стоимость залога?');
    }

    // Если вопрос слишком общий
    if (question.length < 20 && !questions.length) {
      questions.push('Можете уточнить ваш вопрос? Что именно вас интересует?');
    }

    // Ограничиваем количество вопросов (максимум 3)
    return questions.slice(0, 3);
  }

  /**
   * Форматирует уточняющие вопросы для включения в ответ
   */
  formatClarificationQuestions(questions: string[]): string {
    if (questions.length === 0) {
      return '';
    }

    return `\n\n**Для более точного ответа, уточните, пожалуйста:**\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  }
}

export const questionEnhancementService = new QuestionEnhancementService();
export default questionEnhancementService;

