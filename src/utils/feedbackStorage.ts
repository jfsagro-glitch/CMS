/**
 * Утилита для хранения и анализа обратной связи по ответам ИИ
 */

export interface Feedback {
  messageId: string;
  question: string;
  answer: string;
  rating: 'like' | 'dislike';
  timestamp: Date;
  context?: string; // Контекст из базы знаний, который использовался
}

class FeedbackStorage {
  private readonly STORAGE_KEY = 'ai_feedback';

  /**
   * Сохраняет обратную связь
   */
  saveFeedback(feedback: Feedback): void {
    try {
      const feedbacks = this.getAllFeedbacks();
      feedbacks.push({
        ...feedback,
        timestamp: feedback.timestamp,
      });

      // Храним только последние 1000 отзывов
      let limited = feedbacks;
      if (limited.length > 1000) {
        limited = limited.slice(-1000);
      }

      const serialized = JSON.stringify(limited);

      try {
        localStorage.setItem(this.STORAGE_KEY, serialized);
      } catch (error) {
        // Обработка переполнения localStorage, аналогично chatStorage
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          try {
            // Пробуем сохранить только последние 200 отзывов
            const pruned = limited.slice(-200);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pruned));
            console.warn(
              'localStorage для ai_feedback переполнен, старые отзывы удалены. Оставлено:',
              pruned.length
            );
          } catch (secondError) {
            console.error(
              'Повторная ошибка QuotaExceededError при сохранении обратной связи, очищаем ai_feedback.',
              secondError
            );
            localStorage.removeItem(this.STORAGE_KEY);
          }
        } else {
          console.error('Ошибка сохранения обратной связи:', error);
        }
      }
    } catch (error) {
      console.error('Ошибка подготовки обратной связи к сохранению:', error);
    }
  }

  /**
   * Получает все отзывы
   */
  getAllFeedbacks(): Feedback[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      
      const feedbacks = JSON.parse(data);
      return feedbacks.map((f: any) => ({
        ...f,
        timestamp: new Date(f.timestamp),
      }));
    } catch (error) {
      console.error('Ошибка загрузки обратной связи:', error);
      return [];
    }
  }

  /**
   * Получает статистику по отзывам
   */
  getFeedbackStats(): { likes: number; dislikes: number; total: number } {
    const feedbacks = this.getAllFeedbacks();
    const likes = feedbacks.filter(f => f.rating === 'like').length;
    const dislikes = feedbacks.filter(f => f.rating === 'dislike').length;
    
    return {
      likes,
      dislikes,
      total: feedbacks.length,
    };
  }

  /**
   * Получает примеры хороших ответов (лайки)
   */
  getGoodExamples(count: number = 5): Feedback[] {
    const feedbacks = this.getAllFeedbacks();
    return feedbacks
      .filter(f => f.rating === 'like')
      .slice(-count)
      .reverse();
  }

  /**
   * Получает примеры плохих ответов (дизлайки)
   */
  getBadExamples(count: number = 5): Feedback[] {
    const feedbacks = this.getAllFeedbacks();
    return feedbacks
      .filter(f => f.rating === 'dislike')
      .slice(-count)
      .reverse();
  }

  /**
   * Анализирует паттерны в вопросах с дизлайками
   */
  analyzeDislikes(): {
    commonTopics: string[];
    suggestions: string[];
  } {
    const dislikes = this.getBadExamples(20);
    
    // Извлекаем ключевые слова из вопросов с дизлайками
    const keywords = new Map<string, number>();
    dislikes.forEach(f => {
      const words = f.question.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      });
    });

    const commonTopics = Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    const suggestions: string[] = [];
    if (dislikes.length > 0) {
      suggestions.push('Обратите внимание на вопросы, связанные с: ' + commonTopics.join(', '));
    }

    return { commonTopics, suggestions };
  }

  /**
   * Очищает всю обратную связь
   */
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const feedbackStorage = new FeedbackStorage();

