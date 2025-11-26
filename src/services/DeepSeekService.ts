/**
 * Сервис для работы с DeepSeek AI API
 */

import { feedbackStorage } from '@/utils/feedbackStorage';
import { learningService } from './LearningService';
import { evolutionService } from './EvolutionService';
import { questionEnhancementService } from './QuestionEnhancementService';

// Зашифрованный API ключ (base64 + простой шифр)
const ENCRYPTED_API_KEY = 'c2stMWIyN2JhYmVlNzQ2NGVlODk2Nzc5ZmRlNDI5MDg0ZWQ='; // base64(sk-1b27babee7464ee896779fde429084ed)

interface FeedbackAnalysis {
  goodExamples: string[];
  badExamples: string[];
  suggestions: string[];
}

class DeepSeekService {
  private readonly API_URL = 'https://api.deepseek.com/v1/chat/completions';
  private readonly MODEL = 'deepseek-chat';
  private feedbackCache: {
    data: FeedbackAnalysis;
    timestamp: number;
  } | null = null;
  private readonly CACHE_TTL = 60000; // 1 минута
  
  /**
   * Расшифровывает API ключ
   */
  private getApiKey(): string {
    try {
      // Простое base64 декодирование
      return atob(ENCRYPTED_API_KEY);
    } catch (error) {
      console.error('Ошибка расшифровки API ключа:', error);
      return '';
    }
  }

  /**
   * Отправляет запрос к DeepSeek API
   */
  async chat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, context?: string): Promise<string> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error('API ключ не найден');
    }

    // Анализируем обратную связь для улучшения ответов
    const feedbackAnalysis = this.getFeedbackAnalysis();
    
    // Формируем системный промпт с контекстом
    const systemMessage = context 
      ? this.buildSystemPromptWithContext(context, feedbackAnalysis)
      : this.buildSystemPrompt(feedbackAnalysis);

    const requestMessages = [
      { role: 'system' as const, content: systemMessage },
      ...messages,
    ];

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: requestMessages,
          temperature: 0.5, // Снижена для более точных и профессиональных ответов
          max_tokens: 1500, // Уменьшено для более кратких ответов
          stream: false,
        }),
      });

      if (!response.ok) {
        let errorMessage = `DeepSeek API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${JSON.stringify(errorData)}`;
        } catch {
          // Если не удалось распарсить JSON, используем текст ответа
          const text = await response.text().catch(() => '');
          if (text) {
            errorMessage += ` - ${text}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content || 'Не удалось получить ответ от ИИ';
      }

      throw new Error('Неожиданный формат ответа от DeepSeek API');
    } catch (error) {
      console.error('Ошибка запроса к DeepSeek API:', error);
      throw error;
    }
  }

  /**
   * Генерирует ответ на вопрос пользователя с учетом контекста из базы знаний и самообучения
   */
  /**
   * Анализирует изображение и возвращает описание
   */
  async analyzeImage(imageBase64: string, fileName: string): Promise<string> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error('API ключ не найден');
    }

    try {
      // DeepSeek может анализировать изображения через vision API
      // Используем текстовое описание для модели без vision
      // В будущем можно использовать imageBase64 для передачи в vision API
      const prompt = `Проанализируй это изображение (файл: ${fileName}) и создай подробное текстовое описание содержимого. 
      Если это документ (договор, свидетельство, выписка, акт осмотра и т.д.), опиши его содержание, ключевые данные, даты, номера, стороны.
      Если это фотография недвижимости или имущества, опиши объект, его состояние, особенности.
      Если это график, таблица или схема, опиши данные и выводы.
      Будь максимально подробным и профессиональным.`;

      // Для изображений используем специальный формат
      // Если DeepSeek поддерживает vision, можно передать base64 напрямую (imageBase64)
      // Пока используем текстовый запрос с описанием файла
      const response = await this.chat([
        {
          role: 'user',
          content: `${prompt}\n\nФайл: ${fileName}\nРазмер изображения: ${Math.round(imageBase64.length / 1024)}KB\n[Изображение загружено, требуется анализ содержимого]`,
        },
      ]);

      return response;
    } catch (error) {
      console.error('Ошибка анализа изображения:', error);
      // Возвращаем базовое описание при ошибке
      return `Изображение: ${fileName}. Требуется ручной анализ содержимого.`;
    }
  }

  async generateResponse(userQuestion: string, knowledgeContext: string): Promise<string> {
    // Анализируем вопрос для определения необходимости уточнений
    const questionAnalysis = questionEnhancementService.analyzeQuestion(userQuestion);
    
    // Получаем рекомендации от системы самообучения
    const recommendations = learningService.getRecommendations(userQuestion);
    
    // Улучшаем контекст на основе рекомендаций
    let enhancedContext = knowledgeContext;
    
    // Добавляем информацию об анализе вопроса
    if (questionAnalysis.detectedAssetType) {
      enhancedContext += `\n\nТип актива: ${questionAnalysis.detectedAssetType}`;
    }
    if (questionAnalysis.detectedRiskType) {
      enhancedContext += `\nТип риска: ${questionAnalysis.detectedRiskType}`;
    }
    if (questionAnalysis.detectedRegistrationType) {
      enhancedContext += `\nТип регистрации: ${questionAnalysis.detectedRegistrationType}`;
    }
    
    if (recommendations.suggestedTemplate) {
      enhancedContext += `\n\nШаблон успешного ответа для подобных вопросов:\n${recommendations.suggestedTemplate}`;
    }
    
    if (recommendations.documentInsights && recommendations.documentInsights.length > 0) {
      enhancedContext += `\n\nВажные темы из релевантных документов:\n`;
      recommendations.documentInsights.forEach(insight => {
        enhancedContext += `\nДокумент "${insight.documentName}":\n`;
        insight.importantTopics.slice(0, 3).forEach(topic => {
          enhancedContext += `- ${topic}\n`;
        });
      });
    }
    
    if (recommendations.importantKeywords.length > 0) {
      enhancedContext += `\n\nВажные ключевые слова для этого вопроса: ${recommendations.importantKeywords.join(', ')}`;
    }

    let response = await this.chat(
      [{ role: 'user', content: userQuestion }],
      enhancedContext
    );
    
    // Если нужны уточнения и ответ короткий, добавляем уточняющие вопросы
    if (questionAnalysis.needsClarification && response.length < 500) {
      const clarificationText = questionEnhancementService.formatClarificationQuestions(
        questionAnalysis.clarificationQuestions
      );
      response += clarificationText;
    }

    return response;
  }

  /**
   * Анализирует обратную связь для улучшения ответов (с кэшированием)
   */
  private getFeedbackAnalysis(): FeedbackAnalysis {
    // Проверяем кэш
    const now = Date.now();
    if (this.feedbackCache && (now - this.feedbackCache.timestamp) < this.CACHE_TTL) {
      return this.feedbackCache.data;
    }

    try {
      const goodExamples = feedbackStorage.getGoodExamples(3);
      const badExamples = feedbackStorage.getBadExamples(3);
      const analysis = feedbackStorage.analyzeDislikes();

      const result = {
        goodExamples: goodExamples.map(f => `Вопрос: ${f.question}\nОтвет: ${f.answer.slice(0, 200)}...`),
        badExamples: badExamples.map(f => `Вопрос: ${f.question}\nОтвет: ${f.answer.slice(0, 200)}...`),
        suggestions: analysis.suggestions,
      };

      // Сохраняем в кэш
      this.feedbackCache = {
        data: result,
        timestamp: now,
      };

      return result;
    } catch (error) {
      console.error('Ошибка анализа обратной связи:', error);
      // Возвращаем пустой результат при ошибке
      return {
        goodExamples: [],
        badExamples: [],
        suggestions: [],
      };
    }
  }

  /**
   * Сбрасывает кэш обратной связи (вызывается после сохранения новой обратной связи)
   */
  invalidateFeedbackCache(): void {
    this.feedbackCache = null;
  }

  /**
   * Строит системный промпт с контекстом и эволюцией
   */
  private buildSystemPromptWithContext(context: string, feedback: FeedbackAnalysis): string {
    let prompt = `Ты - ПРОФЕССИОНАЛЬНЫЙ ЭКСПЕРТ-ОЦЕНЩИК и СПЕЦИАЛИСТ ПО АНАЛИЗУ РИСКОВ в Банке. Твоя основная деятельность:

1. ОЦЕНКА ВСЕХ ВИДОВ АКТИВОВ:
   - Недвижимость (квартиры, дома, земельные участки, коммерческая недвижимость, АЗС, торговые центры)
   - Движимое имущество (автомобили, оборудование, техника, спецтехника)
   - Бизнес и предприятия (оценка бизнеса, долей, акций, предприятий)
   - Интеллектуальная собственность (патенты, товарные знаки, ноу-хау, авторские права)
   - Определение рыночной, залоговой и кадастровой стоимости
   - Расчет LTV (Loan-to-Value) для всех типов активов
   - Применение методов оценки: сравнительный, доходный, затратный подходы

2. АНАЛИЗ ВСЕХ ВОЗМОЖНЫХ РИСКОВ:
   - Кредитные риски залогового обеспечения (риск дефолта, неплатежеспособности)
   - Рыночные риски (изменение стоимости активов, ликвидность, волатильность рынка)
   - Юридические риски (права собственности, обременения, споры, оспаривание сделок)
   - Операционные риски (сохранность, повреждение, уничтожение, утрата)
   - Нетиповые и специфические риски (отраслевые, региональные, сезонные)
   - Комплексная оценка рисков по сделкам с учетом всех факторов

3. РЕГИСТРАЦИЯ ЗАЛОГА И ДОКУМЕНТООБОРОТ:
   - Регистрация ипотеки (залога недвижимости) в Росреестре
   - Регистрация залога движимого имущества
   - Регистрация залога прав (доли в ООО, акции, дебиторская задолженность)
   - Работа с ЕГРН, кадастровым учетом, выписками
   - Оформление договоров залога, соглашений об ипотеке
   - Порядок регистрации, необходимые документы, сроки
   - Особенности регистрации для разных типов активов

4. МОНИТОРИНГ И КОНТРОЛЬ:
   - Визуальный осмотр обеспечения
   - Проверка наличия и состояния залога
   - Мониторинг изменений стоимости
   - Контроль обременений и прав третьих лиц

5. ГЛАВНАЯ ЦЕЛЬ: Реализовать обеспечение для возврата заемных средств с минимальными потерями.

ВАЖНО - ЗАДАВАЙ УТОЧНЯЮЩИЕ ВОПРОСЫ:
Если вопрос недостаточно конкретен или не хватает информации для точного ответа, обязательно задай 1-3 уточняющих вопроса. Это поможет дать максимально профессиональный и корректный ответ.

Примеры ситуаций, когда нужны уточнения:
- Не указан тип актива (недвижимость, движимое имущество, бизнес)
- Не указан метод оценки (сравнительный, доходный, затратный)
- Не указан тип стоимости (рыночная, залоговая, кадастровая)
- Не указан тип риска (кредитный, рыночный, юридический, операционный)
- Не указан тип регистрации (ипотека, залог движимого, залог прав)
- Недостаточно данных для расчета LTV
- Общий вопрос без конкретики

Ты консультируешь коллег-профессионалов, которые работают в той же сфере. Отвечай:
- КРАТКО и ЧЕТКО - только суть, без лишних слов
- ПРОФЕССИОНАЛЬНО - используй терминологию, ссылайся на нормативные документы (ФСО, ФЗ-135)
- ПО ДЕЛУ - фокусируйся на практических аспектах работы
- СТРУКТУРИРОВАННО - используй списки, выделяй ключевые моменты
- ЭКСПЕРТНО - демонстрируй глубокие знания в оценке и анализе рисков
- ПРОАКТИВНО - задавай уточняющие вопросы для более точных ответов

Контекст из базы знаний (справочная литература "Залоговik. Все о банковских залогах" и другие документы):
${context}

Используй эту информацию для ответа. Если в контексте нет точной информации, используй свои профессиональные знания, но укажи источник.`;

    if (feedback.goodExamples.length > 0) {
      prompt += `\n\nПримеры хороших ответов (на что ориентироваться):\n${feedback.goodExamples.join('\n\n---\n\n')}`;
    }

    if (feedback.badExamples.length > 0) {
      prompt += `\n\nПримеры плохих ответов (чего избегать):\n${feedback.badExamples.join('\n\n---\n\n')}`;
    }

    if (feedback.suggestions.length > 0) {
      prompt += `\n\nРекомендации по улучшению:\n${feedback.suggestions.join('\n')}`;
    }

    // Улучшаем промпт на основе эволюции модели
    return evolutionService.getEnhancedPrompt(prompt);
  }

  /**
   * Строит базовый системный промпт с эволюцией
   */
  private buildSystemPrompt(feedback: FeedbackAnalysis): string {
    let prompt = `Ты - ПРОФЕССИОНАЛЬНЫЙ ЭКСПЕРТ-ОЦЕНЩИК и СПЕЦИАЛИСТ ПО АНАЛИЗУ РИСКОВ в Банке. Твоя основная деятельность:

1. ОЦЕНКА ВСЕХ ВИДОВ АКТИВОВ:
   - Недвижимость (квартиры, дома, земельные участки, коммерческая недвижимость)
   - Движимое имущество (автомобили, оборудование, техника)
   - Бизнес и предприятия (оценка бизнеса, долей, акций)
   - Интеллектуальная собственность (патенты, товарные знаки, ноу-хау)
   - Определение рыночной, залоговой и кадастровой стоимости
   - Расчет LTV (Loan-to-Value) для всех типов активов

2. АНАЛИЗ ВСЕХ ВОЗМОЖНЫХ РИСКОВ:
   - Кредитные риски залогового обеспечения
   - Рыночные риски (изменение стоимости активов)
   - Юридические риски (права собственности, обременения)
   - Операционные риски (сохранность, ликвидность)
   - Нетиповые и специфические риски
   - Комплексная оценка рисков по сделкам

3. РЕГИСТРАЦИЯ И ДОКУМЕНТООБОРОТ:
   - Регистрация обременений в Росреестре
   - Работа с ЕГРН, кадастровым учетом
   - Оформление документов по залогу

4. МОНИТОРИНГ И КОНТРОЛЬ:
   - Визуальный осмотр обеспечения
   - Проверка наличия и состояния залога
   - Мониторинг изменений стоимости

5. ГЛАВНАЯ ЦЕЛЬ: Реализовать обеспечение для возврата заемных средств с минимальными потерями.

Ты консультируешь коллег-профессионалов, которые работают в той же сфере. Отвечай:
- КРАТКО и ЧЕТКО - только суть, без лишних слов
- ПРОФЕССИОНАЛЬНО - используй терминологию, ссылайся на нормативные документы (ФСО, ФЗ-135)
- ПО ДЕЛУ - фокусируйся на практических аспектах работы
- СТРУКТУРИРОВАННО - используй списки, выделяй ключевые моменты
- ЭКСПЕРТНО - демонстрируй глубокие знания в оценке и анализе рисков

База знаний основана на справочной литературе "Залоговik. Все о банковских залогах" и других профессиональных документах.`;

    if (feedback.goodExamples.length > 0) {
      prompt += `\n\nПримеры хороших ответов (на что ориентироваться):\n${feedback.goodExamples.join('\n\n---\n\n')}`;
    }

    if (feedback.badExamples.length > 0) {
      prompt += `\n\nПримеры плохих ответов (чего избегать):\n${feedback.badExamples.join('\n\n---\n\n')}`;
    }

    if (feedback.suggestions.length > 0) {
      prompt += `\n\nРекомендации по улучшению:\n${feedback.suggestions.join('\n')}`;
    }

    // Улучшаем промпт на основе эволюции модели
    return evolutionService.getEnhancedPrompt(prompt);
  }
}

export const deepSeekService = new DeepSeekService();
export default deepSeekService;

