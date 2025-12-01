/**
 * Сервис для генерации изображений объектов оценки через ИИ
 */

// Используем OpenAI DALL-E API для генерации изображений
// Можно заменить на другой сервис при необходимости
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

// Альтернативный сервис через Hugging Face (бесплатный, но требует регистрации)
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || '';

class ImageGenerationService {
  /**
   * Генерирует изображение объекта на основе описания
   */
  async generateImage(description: string, objectType?: string, location?: string): Promise<string> {
    try {
      // Формируем детальный промпт для генерации изображения
      const prompt = this.buildImagePrompt(description, objectType, location);
      
      // Пробуем использовать OpenAI DALL-E, если доступен ключ
      if (OPENAI_API_KEY) {
        return await this.generateWithOpenAI(prompt);
      }
      
      // Если OpenAI недоступен, пробуем Hugging Face
      if (HUGGINGFACE_API_KEY) {
        return await this.generateWithHuggingFace(prompt);
      }
      
      // Если нет API ключей, используем fallback - возвращаем placeholder
      if (import.meta.env.MODE === 'development') {
        console.warn('API ключи для генерации изображений не настроены. Используется placeholder.');
        console.info('Для настройки генерации изображений создайте файл .env и добавьте:');
        console.info('  VITE_OPENAI_API_KEY=your-key (для OpenAI DALL-E)');
        console.info('  или');
        console.info('  VITE_HUGGINGFACE_API_KEY=your-token (для Hugging Face)');
      }
      return this.generatePlaceholderImage(description, objectType);
    } catch (error) {
      console.error('Ошибка генерации изображения:', error);
      // Возвращаем placeholder при ошибке
      return this.generatePlaceholderImage(description, objectType);
    }
  }

  /**
   * Генерирует изображение через OpenAI DALL-E
   */
  private async generateWithOpenAI(prompt: string): Promise<string> {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.data && data.data.length > 0 && data.data[0].url) {
        // Загружаем изображение и конвертируем в base64
        const imageResponse = await fetch(data.data[0].url);
        const blob = await imageResponse.blob();
        return await this.blobToBase64(blob);
      }

      throw new Error('Не удалось получить изображение от OpenAI');
    } catch (error) {
      console.error('Ошибка генерации через OpenAI:', error);
      throw error;
    }
  }

  /**
   * Генерирует изображение через Hugging Face API
   */
  private async generateWithHuggingFace(prompt: string): Promise<string> {
    try {
      const response = await fetch(HUGGINGFACE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 20,
            guidance_scale: 7.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const blob = await response.blob();
      return await this.blobToBase64(blob);
    } catch (error) {
      console.error('Ошибка генерации через Hugging Face:', error);
      throw error;
    }
  }

  /**
   * Создает промпт для генерации изображения на основе описания объекта
   */
  private buildImagePrompt(description: string, objectType?: string, location?: string): string {
    let prompt = 'Professional real estate photography, high quality, realistic, detailed, ';
    
    if (objectType) {
      const typeLower = objectType.toLowerCase();
      
      // Специфичные промпты для разных типов объектов
      if (typeLower.includes('квартира') || typeLower.includes('жилое')) {
        prompt += 'modern apartment interior, well-lit, clean, spacious rooms, ';
      } else if (typeLower.includes('дом') || typeLower.includes('коттедж')) {
        prompt += 'beautiful house exterior, modern architecture, well-maintained, ';
      } else if (typeLower.includes('торговый центр') || typeLower.includes('офис')) {
        prompt += 'commercial building, modern architecture, professional, ';
      } else if (typeLower.includes('склад') || typeLower.includes('производство')) {
        prompt += 'industrial building, warehouse, functional, ';
      } else if (typeLower.includes('земельный участок') || typeLower.includes('земля')) {
        prompt += 'land plot, aerial view, well-maintained, clear boundaries, ';
      } else if (typeLower.includes('автомобиль') || typeLower.includes('транспорт')) {
        prompt += 'professional car photography, clean vehicle, good condition, ';
      } else if (typeLower.includes('оборудование') || typeLower.includes('техника')) {
        prompt += 'industrial equipment, professional photography, clean, functional, ';
      } else {
        prompt += 'professional property photography, well-maintained, ';
      }
    }
    
    if (location) {
      prompt += `located in ${location}, `;
    }
    
    prompt += description;
    prompt += ', professional real estate photography style, high resolution, detailed, realistic';
    
    return prompt;
  }

  /**
   * Генерирует placeholder изображение (SVG) если API недоступен
   */
  private generatePlaceholderImage(description: string, objectType?: string): string {
    // Создаем простой SVG placeholder с информацией об объекте
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1890ff;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#40a9ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#bae7ff;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#grad)"/>
        <text x="200" y="120" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">
          ${objectType || 'Объект оценки'}
        </text>
        <text x="200" y="160" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">
          ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}
        </text>
        <text x="200" y="200" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)" text-anchor="middle">
          Изображение будет сгенерировано ИИ
        </text>
      </svg>
    `.trim();
    
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  /**
   * Конвертирует Blob в base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Не удалось конвертировать изображение в base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const imageGenerationService = new ImageGenerationService();
export default imageGenerationService;

