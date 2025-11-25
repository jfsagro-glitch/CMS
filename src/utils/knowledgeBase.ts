/**
 * База знаний на основе оцифрованного документа
 */

import { documentIndexer, type DocumentChunk } from './documentIndexer';

export interface KnowledgeTopic {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  content: string;
  page: number;
  relatedTopics?: string[];
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  topics: KnowledgeTopic[];
}

class KnowledgeBase {
  private topics: Map<string, KnowledgeTopic> = new Map();
  private categories: Map<string, KnowledgeCategory> = new Map();
  private searchIndex: Map<string, string[]> = new Map(); // keyword -> topicIds

  /**
   * Создает базу знаний из индексированных документов
   */
  async buildFromDocuments(): Promise<void> {
    const documents = documentIndexer.getIndexedDocuments();
    
    for (const doc of documents) {
      // Группируем чанки по темам на основе ключевых слов и контекста
      const topics = this.extractTopics(doc.chunks);
      
      for (const topic of topics) {
        this.topics.set(topic.id, topic);
        
        // Индексируем по ключевым словам
        for (const keyword of topic.keywords) {
          const lowerKeyword = keyword.toLowerCase();
          if (!this.searchIndex.has(lowerKeyword)) {
            this.searchIndex.set(lowerKeyword, []);
          }
          this.searchIndex.get(lowerKeyword)!.push(topic.id);
        }
        
        // Добавляем в категорию
        if (!this.categories.has(topic.category)) {
          this.categories.set(topic.category, {
            id: topic.category,
            name: this.getCategoryName(topic.category),
            description: '',
            topics: [],
          });
        }
        this.categories.get(topic.category)!.topics.push(topic);
      }
    }

    // Сохраняем в localStorage
    this.saveToStorage();
  }

  /**
   * Извлекает темы из чанков документа
   */
  private extractTopics(chunks: DocumentChunk[]): KnowledgeTopic[] {
    const topics: KnowledgeTopic[] = [];
    const processedChunks = new Set<string>();

    for (const chunk of chunks) {
      if (processedChunks.has(chunk.id)) continue;

      // Определяем категорию на основе ключевых слов
      const category = this.detectCategory(chunk);
      
      // Объединяем связанные чанки в одну тему
      const relatedChunks = this.findRelatedChunks(chunk, chunks, processedChunks);
      const combinedText = relatedChunks.map(c => c.text).join(' ');
      
      // Извлекаем заголовок темы
      const title = this.extractTitle(chunk.text, combinedText);
      
      // Извлекаем ключевые слова
      const keywords = this.extractKeywords(combinedText, chunk.keywords);

      const topic: KnowledgeTopic = {
        id: `topic-${chunk.id}`,
        title,
        category,
        keywords,
        content: this.cleanText(combinedText),
        page: chunk.page,
      };

      topics.push(topic);
      
      // Помечаем чанки как обработанные
      relatedChunks.forEach(c => processedChunks.add(c.id));
    }

    return topics;
  }

  /**
   * Определяет категорию на основе содержимого
   */
  private detectCategory(chunk: DocumentChunk): string {
    const text = chunk.text.toLowerCase();
    const keywords = chunk.keywords.map(k => k.toLowerCase());

    // Категории на основе ключевых слов
    if (keywords.some(k => ['ипотека', 'ипотечный', 'ипотечное'].includes(k)) ||
        text.includes('ипотечн')) {
      return 'mortgage';
    }
    
    if (keywords.some(k => ['оценка', 'оценить', 'стоимость'].includes(k)) ||
        text.includes('оценк')) {
      return 'appraisal';
    }
    
    if (keywords.some(k => ['ltv', 'залог', 'залоговое'].includes(k)) ||
        text.includes('залог')) {
      return 'collateral';
    }
    
    if (keywords.some(k => ['договор', 'соглашение'].includes(k)) ||
        text.includes('договор')) {
      return 'contracts';
    }
    
    if (keywords.some(k => ['риск', 'риски'].includes(k)) ||
        text.includes('риск')) {
      return 'risks';
    }
    
    if (keywords.some(k => ['норматив', 'регламент', 'инструкция'].includes(k)) ||
        text.includes('норматив') || text.includes('регламент')) {
      return 'regulations';
    }
    
    if (keywords.some(k => ['регистрация', 'росреестр', 'егрн'].includes(k)) ||
        text.includes('регистрац') || text.includes('росреестр')) {
      return 'registration';
    }

    return 'general';
  }

  /**
   * Находит связанные чанки
   */
  private findRelatedChunks(
    chunk: DocumentChunk,
    allChunks: DocumentChunk[],
    processed: Set<string>
  ): DocumentChunk[] {
    const related: DocumentChunk[] = [chunk];
    const chunkKeywords = new Set(chunk.keywords.map(k => k.toLowerCase()));

    // Ищем чанки на той же странице или соседних
    for (const otherChunk of allChunks) {
      if (processed.has(otherChunk.id) || otherChunk.id === chunk.id) continue;
      
      // Если на той же странице или соседней
      if (Math.abs(otherChunk.page - chunk.page) <= 1) {
        const otherKeywords = new Set(otherChunk.keywords.map(k => k.toLowerCase()));
        
        // Если есть пересечение ключевых слов
        const intersection = [...chunkKeywords].filter(k => otherKeywords.has(k));
        if (intersection.length > 0) {
          related.push(otherChunk);
        }
      }
    }

    return related;
  }

  /**
   * Извлекает заголовок из текста
   */
  private extractTitle(text: string, _fullText: string): string {
    // Ищем строки, которые выглядят как заголовки (короткие, с заглавными буквами)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Заголовки обычно короткие (до 100 символов) и содержат заглавные буквы
      if (trimmed.length > 10 && trimmed.length < 100 && 
          /[А-ЯЁ]/.test(trimmed) && trimmed.split(' ').length < 15) {
        return trimmed;
      }
    }

    // Если не нашли, берем первые слова
    const words = text.split(/\s+/).slice(0, 10).join(' ');
    return words.length > 80 ? words.slice(0, 77) + '...' : words;
  }

  /**
   * Извлекает ключевые слова из текста
   */
  private extractKeywords(text: string, existingKeywords: string[]): string[] {
    const keywords = new Set<string>(existingKeywords);
    const lowerText = text.toLowerCase();

    // Важные термины для банковских залогов
    const importantTerms = [
      'залог', 'залоговое имущество', 'залогодатель', 'залогодержатель',
      'ипотека', 'ипотечный договор', 'ипотечное кредитование',
      'ltv', 'loan-to-value', 'залоговая стоимость', 'рыночная стоимость',
      'оценка', 'оценщик', 'отчет об оценке', 'переоценка',
      'договор залога', 'договор ипотеки', 'залоговое право',
      'обременение', 'снятие обременения', 'регистрация залога',
      'недвижимость', 'квартира', 'дом', 'земельный участок',
      'транспортное средство', 'автомобиль', 'оборудование',
      'росреестр', 'егрн', 'кадастровый номер',
      'кредит', 'кредитный договор', 'задолженность',
      'нормативный документ', 'регламент', 'инструкция',
      'риск', 'управление рисками', 'мониторинг',
      'страхование', 'страховой полис',
    ];

    for (const term of importantTerms) {
      if (lowerText.includes(term.toLowerCase())) {
        keywords.add(term);
      }
    }

    return Array.from(keywords);
  }

  /**
   * Очищает текст от лишних пробелов и символов
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Получает название категории
   */
  private getCategoryName(categoryId: string): string {
    const names: Record<string, string> = {
      mortgage: 'Ипотека',
      appraisal: 'Оценка',
      collateral: 'Залоговое имущество',
      contracts: 'Договоры',
      risks: 'Риски',
      regulations: 'Нормативные документы',
      registration: 'Регистрация',
      general: 'Общие вопросы',
    };
    return names[categoryId] || 'Общие вопросы';
  }

  /**
   * Поиск по базе знаний
   */
  search(query: string, maxResults: number = 5): KnowledgeTopic[] {
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
    
    const scoredTopics = new Map<string, number>();

    // Поиск по ключевым словам
    for (const word of queryWords) {
      const topicIds = this.searchIndex.get(word) || [];
      for (const topicId of topicIds) {
        const currentScore = scoredTopics.get(topicId) || 0;
        scoredTopics.set(topicId, currentScore + 10);
      }
    }

    // Поиск по содержимому
    for (const [topicId, topic] of this.topics.entries()) {
      const lowerContent = topic.content.toLowerCase();
      const lowerTitle = topic.title.toLowerCase();

      let score = scoredTopics.get(topicId) || 0;

      // Точное совпадение в заголовке
      if (lowerTitle.includes(lowerQuery)) {
        score += 30;
      }

      // Совпадение в содержимом
      const contentMatches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
      score += contentMatches * 2;

      // Совпадение отдельных слов
      for (const word of queryWords) {
        const wordMatches = (lowerContent.match(new RegExp(word, 'g')) || []).length;
        score += wordMatches;
      }

      if (score > 0) {
        scoredTopics.set(topicId, score);
      }
    }

    // Сортируем и возвращаем топ результатов
    return Array.from(scoredTopics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxResults)
      .map(([topicId]) => this.topics.get(topicId)!)
      .filter(Boolean);
  }

  /**
   * Получить все категории
   */
  getCategories(): KnowledgeCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Получить тему по ID
   */
  getTopic(id: string): KnowledgeTopic | undefined {
    return this.topics.get(id);
  }

  /**
   * Получить темы по категории
   */
  getTopicsByCategory(categoryId: string): KnowledgeTopic[] {
    const category = this.categories.get(categoryId);
    return category ? category.topics : [];
  }

  /**
   * Сохранить в localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        topics: Array.from(this.topics.values()),
        categories: Array.from(this.categories.values()),
        version: '1.0',
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('knowledgeBase', JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка сохранения базы знаний:', error);
    }
  }

  /**
   * Загрузить из localStorage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('knowledgeBase');
      if (stored) {
        const data = JSON.parse(stored);
        
        this.topics.clear();
        this.categories.clear();
        this.searchIndex.clear();

        // Восстанавливаем темы
        for (const topic of data.topics || []) {
          this.topics.set(topic.id, topic);
          
          // Восстанавливаем индекс
          for (const keyword of topic.keywords || []) {
            const lowerKeyword = keyword.toLowerCase();
            if (!this.searchIndex.has(lowerKeyword)) {
              this.searchIndex.set(lowerKeyword, []);
            }
            this.searchIndex.get(lowerKeyword)!.push(topic.id);
          }
        }

        // Восстанавливаем категории
        for (const category of data.categories || []) {
          this.categories.set(category.id, category);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки базы знаний:', error);
    }
  }

  /**
   * Очистить базу знаний
   */
  clear(): void {
    this.topics.clear();
    this.categories.clear();
    this.searchIndex.clear();
    localStorage.removeItem('knowledgeBase');
  }
}

export const knowledgeBase = new KnowledgeBase();

