/**
 * Сервис для работы с DeepSeek AI API
 */

// Зашифрованный API ключ (base64 + простой шифр)
const ENCRYPTED_API_KEY = 'c2stMWIyN2JhYmVlNzQ2NGVlODk2Nzc5ZmRlNDI5MDg0ZWQ='; // base64(sk-1b27babee7464ee896779fde429084ed)

class DeepSeekService {
  private readonly API_URL = 'https://api.deepseek.com/v1/chat/completions';
  private readonly MODEL = 'deepseek-chat';
  
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

    // Формируем системный промпт с контекстом
    const systemMessage = context 
      ? `Ты - эксперт по банковским залогам и ипотечному кредитованию. Твоя задача - консультировать пользователей на основе предоставленного контекста из справочной литературы.

Контекст из базы знаний:
${context}

Используй эту информацию для ответа на вопросы пользователя. Если в контексте нет точной информации, используй свои знания, но обязательно укажи, что это общая информация, а не из конкретного документа.`
      : `Ты - эксперт по банковским залогам и ипотечному кредитованию. Твоя задача - консультировать пользователей по вопросам работы с залоговым имуществом, оценке, договорам залога, LTV и другим аспектам банковского залогового кредитования.

Отвечай профессионально, структурированно и по делу. Если не знаешь точного ответа, честно скажи об этом.`;

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
          temperature: 0.7,
          max_tokens: 2000,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
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
   * Генерирует ответ на вопрос пользователя с учетом контекста из базы знаний
   */
  async generateResponse(userQuestion: string, knowledgeContext: string): Promise<string> {
    return await this.chat(
      [{ role: 'user', content: userQuestion }],
      knowledgeContext
    );
  }
}

export const deepSeekService = new DeepSeekService();
export default deepSeekService;

