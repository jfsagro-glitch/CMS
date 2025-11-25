/**
 * Сервис самообучения модели на основе обратной связи и анализа документов
 */

import { feedbackStorage, type Feedback } from '@/utils/feedbackStorage';
import { knowledgeBase } from '@/utils/knowledgeBase';
import { documentIndexer } from '@/utils/documentIndexer';

interface LearningPattern {
  questionPattern: string; // Паттерн вопроса
  successfulAnswerTemplate: string; // Шаблон успешного ответа
  keywords: string[]; // Ключевые слова
  category: string; // Категория вопроса
  successRate: number; // Процент успешных ответов
  usageCount: number; // Количество использований
  lastUpdated: Date;
}

interface DocumentInsight {
  documentName: string;
  importantTopics: string[]; // Важные темы из документа
  commonQuestions: string[]; // Частые вопросы по документу
  keywords: string[]; // Ключевые слова документа
  lastAnalyzed: Date;
}

class LearningService {
  private readonly STORAGE_KEY = 'ai_learning_patterns';
  private readonly INSIGHTS_KEY = 'ai_document_insights';
  private patterns: Map<string, LearningPattern> = new Map();
  private documentInsights: Map<string, DocumentInsight> = new Map();

  /**
   * Инициализация - загрузка сохраненных паттернов
   */
  initialize(): void {
    this.loadPatterns();
    this.loadDocumentInsights();
  }

  /**
   * Анализирует обратную связь и извлекает паттерны обучения
   */
  analyzeFeedback(): void {
    const allFeedbacks = feedbackStorage.getAllFeedbacks();
    
    if (allFeedbacks.length === 0) {
      return;
    }

    // Группируем по типам вопросов
    const questionGroups = new Map<string, Feedback[]>();
    
    allFeedbacks.forEach(feedback => {
      const pattern = this.extractQuestionPattern(feedback.question);
      if (!questionGroups.has(pattern)) {
        questionGroups.set(pattern, []);
      }
      questionGroups.get(pattern)!.push(feedback);
    });

    // Анализируем каждую группу
    questionGroups.forEach((feedbacks, pattern) => {
      const likes = feedbacks.filter(f => f.rating === 'like').length;
      const total = feedbacks.length;
      const successRate = total > 0 ? likes / total : 0;

      // Если есть успешные ответы, сохраняем паттерн
      if (likes > 0 && successRate >= 0.5) {
        const bestAnswer = feedbacks
          .filter(f => f.rating === 'like')
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

        const keywords = this.extractKeywords(feedbacks[0].question);
        const category = this.detectCategory(feedbacks[0].question);

        const learningPattern: LearningPattern = {
          questionPattern: pattern,
          successfulAnswerTemplate: this.extractAnswerTemplate(bestAnswer.answer),
          keywords,
          category,
          successRate,
          usageCount: total,
          lastUpdated: new Date(),
        };

        // Обновляем или создаем паттерн
        const existing = this.patterns.get(pattern);
        if (!existing || successRate > existing.successRate) {
          this.patterns.set(pattern, learningPattern);
        } else if (existing) {
          // Обновляем счетчики
          existing.usageCount = total;
          existing.successRate = successRate;
          existing.lastUpdated = new Date();
        }
      }
    });

    this.savePatterns();
  }

  /**
   * Анализирует документы для извлечения инсайтов
   */
  analyzeDocuments(): void {
    const documents = documentIndexer.getIndexedDocuments();
    
    documents.forEach(doc => {
      // Извлекаем важные темы из документа
      const topics = knowledgeBase.getCategories()
        .flatMap(cat => cat.topics)
        .filter(topic => topic.content.toLowerCase().includes(doc.documentName.toLowerCase()));

      const importantTopics = topics
        .map(t => t.title)
        .slice(0, 10);

      // Извлекаем ключевые слова из документа
      const allKeywords = new Set<string>();
      doc.chunks.forEach(chunk => {
        chunk.keywords.forEach(kw => allKeywords.add(kw));
      });

      // Генерируем частые вопросы на основе тем
      const commonQuestions = this.generateCommonQuestions(topics);

      const insight: DocumentInsight = {
        documentName: doc.documentName,
        importantTopics,
        commonQuestions,
        keywords: Array.from(allKeywords).slice(0, 20),
        lastAnalyzed: new Date(),
      };

      this.documentInsights.set(doc.documentName, insight);
    });

    this.saveDocumentInsights();
  }

  /**
   * Получает рекомендации для улучшения ответа на основе накопленного опыта
   */
  getRecommendations(question: string): {
    suggestedTemplate?: string;
    importantKeywords: string[];
    relatedPatterns: LearningPattern[];
    documentInsights?: DocumentInsight[];
  } {
    const keywords = this.extractKeywords(question);
    const category = this.detectCategory(question);

    // Ищем похожие паттерны
    const relatedPatterns = Array.from(this.patterns.values())
      .filter(p => {
        // Проверяем совпадение категории
        if (p.category === category) return true;
        
        // Проверяем совпадение ключевых слов
        const commonKeywords = p.keywords.filter(kw => keywords.includes(kw));
        return commonKeywords.length >= 2;
      })
      .sort((a, b) => {
        // Сортируем по успешности и частоте использования
        const scoreA = a.successRate * Math.log(a.usageCount + 1);
        const scoreB = b.successRate * Math.log(b.usageCount + 1);
        return scoreB - scoreA;
      })
      .slice(0, 3);

    // Находим наиболее подходящий шаблон
    const bestPattern = relatedPatterns[0];
    const suggestedTemplate = bestPattern?.successfulAnswerTemplate;

    // Находим релевантные инсайты из документов
    const relevantInsights = Array.from(this.documentInsights.values())
      .filter(insight => {
        const hasRelevantKeywords = insight.keywords.some(kw => 
          keywords.some(qkw => qkw.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(qkw.toLowerCase()))
        );
        return hasRelevantKeywords;
      })
      .slice(0, 2);

    return {
      suggestedTemplate,
      importantKeywords: keywords,
      relatedPatterns,
      documentInsights: relevantInsights.length > 0 ? relevantInsights : undefined,
    };
  }

  /**
   * Извлекает паттерн из вопроса
   */
  private extractQuestionPattern(question: string): string {
    const lower = question.toLowerCase();
    
    // Удаляем конкретные значения, оставляем структуру
    let pattern = lower
      .replace(/\d+/g, '[число]')
      .replace(/"[^"]*"/g, '[строка]')
      .replace(/'[^']*'/g, '[строка]')
      .replace(/\b(как|что|когда|где|почему|зачем|какой|какая|какое|какие)\b/g, '[вопрос]')
      .replace(/\b(рассчитать|определить|найти|получить|создать|сделать)\b/g, '[действие]');

    // Нормализуем пробелы
    pattern = pattern.replace(/\s+/g, ' ').trim();
    
    return pattern;
  }

  /**
   * Извлекает ключевые слова из текста
   */
  private extractKeywords(text: string): string[] {
    const lower = text.toLowerCase();
    const keywords: string[] = [];

    // Важные термины для банковских залогов
    const importantTerms = [
      'залог', 'залоговое имущество', 'залогодатель', 'залогодержатель',
      'ипотека', 'ипотечный договор', 'ltv', 'loan-to-value',
      'оценка', 'оценщик', 'рыночная стоимость', 'залоговая стоимость',
      'договор залога', 'обременение', 'регистрация', 'росреестр',
      'егрн', 'риск', 'мониторинг', 'осмотр', 'взыскание',
    ];

    importantTerms.forEach(term => {
      if (lower.includes(term)) {
        keywords.push(term);
      }
    });

    // Извлекаем существительные (простая эвристика)
    const words = lower.split(/\s+/).filter(w => w.length > 4);
    words.forEach(word => {
      if (!keywords.includes(word) && keywords.length < 10) {
        keywords.push(word);
      }
    });

    return [...new Set(keywords)].slice(0, 10);
  }

  /**
   * Определяет категорию вопроса
   */
  private detectCategory(question: string): string {
    const lower = question.toLowerCase();
    
    if (lower.includes('ltv') || lower.includes('loan-to-value') || lower.includes('залоговая стоимость')) {
      return 'ltv_calculation';
    }
    if (lower.includes('оценк') || lower.includes('оценщик')) {
      return 'appraisal';
    }
    if (lower.includes('риск')) {
      return 'risks';
    }
    if (lower.includes('регистрац') || lower.includes('росреестр') || lower.includes('егрн')) {
      return 'registration';
    }
    if (lower.includes('осмотр') || lower.includes('мониторинг')) {
      return 'monitoring';
    }
    if (lower.includes('ипотек')) {
      return 'mortgage';
    }
    if (lower.includes('договор')) {
      return 'pledge_contract';
    }
    
    return 'general';
  }

  /**
   * Извлекает шаблон из успешного ответа
   */
  private extractAnswerTemplate(answer: string): string {
    // Упрощаем ответ, убирая конкретные значения
    let template = answer
      .replace(/\d+/g, '[число]')
      .replace(/"[^"]*"/g, '[пример]')
      .replace(/\b(?:https?:\/\/[^\s]+|www\.[^\s]+)/g, '[ссылка]')
      .substring(0, 500); // Ограничиваем длину

    return template;
  }

  /**
   * Генерирует частые вопросы на основе тем
   */
  private generateCommonQuestions(topics: any[]): string[] {
    const questions: string[] = [];
    
    topics.slice(0, 5).forEach(topic => {
      const title = topic.title.toLowerCase();
      
      // Генерируем вопросы на основе заголовков тем
      if (title.includes('расчет') || title.includes('определение')) {
        questions.push(`Как ${title}?`);
      } else if (title.includes('требования') || title.includes('порядок')) {
        questions.push(`Какие ${title}?`);
      } else {
        questions.push(`Что такое ${title}?`);
      }
    });

    return questions.slice(0, 5);
  }

  /**
   * Сохраняет паттерны обучения
   */
  private savePatterns(): void {
    try {
      const data = Array.from(this.patterns.values()).map(p => ({
        ...p,
        lastUpdated: p.lastUpdated.toISOString(),
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка сохранения паттернов обучения:', error);
    }
  }

  /**
   * Загружает паттерны обучения
   */
  private loadPatterns(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.patterns.clear();
        data.forEach((p: any) => {
          this.patterns.set(p.questionPattern, {
            ...p,
            lastUpdated: new Date(p.lastUpdated),
          });
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки паттернов обучения:', error);
    }
  }

  /**
   * Сохраняет инсайты документов
   */
  private saveDocumentInsights(): void {
    try {
      const data = Array.from(this.documentInsights.values()).map(i => ({
        ...i,
        lastAnalyzed: i.lastAnalyzed.toISOString(),
      }));
      localStorage.setItem(this.INSIGHTS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка сохранения инсайтов документов:', error);
    }
  }

  /**
   * Загружает инсайты документов
   */
  private loadDocumentInsights(): void {
    try {
      const stored = localStorage.getItem(this.INSIGHTS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.documentInsights.clear();
        data.forEach((i: any) => {
          this.documentInsights.set(i.documentName, {
            ...i,
            lastAnalyzed: new Date(i.lastAnalyzed),
          });
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки инсайтов документов:', error);
    }
  }

  /**
   * Получает статистику обучения
   */
  getLearningStats(): {
    patternsCount: number;
    insightsCount: number;
    averageSuccessRate: number;
    totalUsage: number;
  } {
    const patterns = Array.from(this.patterns.values());
    const avgSuccessRate = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length
      : 0;
    const totalUsage = patterns.reduce((sum, p) => sum + p.usageCount, 0);

    return {
      patternsCount: this.patterns.size,
      insightsCount: this.documentInsights.size,
      averageSuccessRate: avgSuccessRate,
      totalUsage,
    };
  }
}

export const learningService = new LearningService();
export default learningService;

