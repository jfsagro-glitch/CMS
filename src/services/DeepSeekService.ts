/**
 * Сервис для работы с DeepSeek AI API
 */

import { feedbackStorage } from '@/utils/feedbackStorage';
import { learningService } from './LearningService';

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
  async generateResponse(userQuestion: string, knowledgeContext: string): Promise<string> {
    // Получаем рекомендации от системы самообучения
    const recommendations = learningService.getRecommendations(userQuestion);
    
    // Улучшаем контекст на основе рекомендаций
    let enhancedContext = knowledgeContext;
    
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

    return await this.chat(
      [{ role: 'user', content: userQuestion }],
      enhancedContext
    );
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
   * Строит системный промпт с контекстом
   */
  private buildSystemPromptWithContext(context: string, feedback: FeedbackAnalysis): string {
    let prompt = `Ты - профессиональный сотрудник Банка, специализирующийся на работе с залоговым имуществом. Твоя основная деятельность:

1. Оценка залогового имущества - определение рыночной и залоговой стоимости
2. Анализ рисков при залоге обеспечения по сделкам - выявление и оценка всех возможных рисков
3. Регистрация обременений - работа с Росреестром, ЕГРН, оформление документов
4. Визуальный осмотр обеспечения - проверка наличия, состояния, условий хранения
5. Главная цель - реализовать обеспечение для возврата заемных средств

Ты консультируешь коллег-профессионалов, которые работают в той же сфере. Отвечай:
- КРАТКО и ЧЕТКО - только суть, без лишних слов
- ПРОФЕССИОНАЛЬНО - используй терминологию, ссылайся на нормативные документы
- ПО ДЕЛУ - фокусируйся на практических аспектах работы
- СТРУКТУРИРОВАННО - используй списки, выделяй ключевые моменты

Контекст из базы знаний (справочная литература "Залоговik. Все о банковских залогах"):
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

    return prompt;
  }

  /**
   * Строит базовый системный промпт
   */
  private buildSystemPrompt(feedback: FeedbackAnalysis): string {
    let prompt = `Ты - профессиональный сотрудник Банка, специализирующийся на работе с залоговым имуществом. Твоя основная деятельность:

1. Оценка залогового имущества - определение рыночной и залоговой стоимости
2. Анализ рисков при залоге обеспечения по сделкам - выявление и оценка всех возможных рисков
3. Регистрация обременений - работа с Росреестром, ЕГРН, оформление документов
4. Визуальный осмотр обеспечения - проверка наличия, состояния, условий хранения
5. Главная цель - реализовать обеспечение для возврата заемных средств

Ты консультируешь коллег-профессионалов, которые работают в той же сфере. Отвечай:
- КРАТКО и ЧЕТКО - только суть, без лишних слов
- ПРОФЕССИОНАЛЬНО - используй терминологию, ссылайся на нормативные документы
- ПО ДЕЛУ - фокусируйся на практических аспектах работы
- СТРУКТУРИРОВАННО - используй списки, выделяй ключевые моменты

База знаний основана на справочной литературе "Залоговik. Все о банковских залогах".`;

    if (feedback.goodExamples.length > 0) {
      prompt += `\n\nПримеры хороших ответов (на что ориентироваться):\n${feedback.goodExamples.join('\n\n---\n\n')}`;
    }

    if (feedback.badExamples.length > 0) {
      prompt += `\n\nПримеры плохих ответов (чего избегать):\n${feedback.badExamples.join('\n\n---\n\n')}`;
    }

    if (feedback.suggestions.length > 0) {
      prompt += `\n\nРекомендации по улучшению:\n${feedback.suggestions.join('\n')}`;
    }

    return prompt;
  }
}

export const deepSeekService = new DeepSeekService();
export default deepSeekService;

