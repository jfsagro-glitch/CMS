/**
 * База знаний на основе оцифрованного документа
 */

import { documentIndexer, type DocumentChunk } from './documentIndexer';
import { extendedDb } from '@/services/ExtendedStorageService';
import type { KnowledgeTopicDB, KnowledgeCategoryDB, KnowledgeSearchIndexDB } from '@/services/ExtendedStorageService';

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
  private searchCache: { key: string; results: KnowledgeTopic[] } | null = null; // Кэш результатов поиска

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

    // Сохраняем в IndexedDB (асинхронно)
    this.saveToStorage().catch(err => console.error('Ошибка сохранения базы знаний:', err));
    
    // Очищаем кэш поиска при обновлении базы знаний
    this.searchCache = null;
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
      
      // Объединяем связанные чанки в одну тему (увеличиваем радиус поиска)
      const relatedChunks = this.findRelatedChunks(chunk, chunks, processedChunks);
      const combinedText = relatedChunks.map(c => c.text).join(' ').trim();
      
      // Пропускаем слишком короткие темы
      if (combinedText.length < 100) {
        continue;
      }
      
      // Извлекаем заголовок темы
      const title = this.extractTitle(combinedText);
      
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
   * Определяет категорию на основе содержимого документа
   * Категории основаны на структуре книги "Залоговik. Все о банковских залогах"
   */
  private detectCategory(chunk: DocumentChunk): string {
    const text = chunk.text.toLowerCase();
    const keywords = chunk.keywords.map(k => k.toLowerCase());

    // 1. Понятие и сущность залога
    if (text.includes('понятие залога') || text.includes('сущность залога') ||
        text.includes('определение залога') || text.includes('залог как способ') ||
        (text.includes('залог') && (text.includes('понятие') || text.includes('сущность') || text.includes('определение')))) {
      return 'collateral_concept';
    }

    // 2. Виды и типы залога
    if (text.includes('виды залога') || text.includes('типы залога') ||
        text.includes('классификация залога') || text.includes('разновидности залога') ||
        (text.includes('залог') && (text.includes('вид') || text.includes('тип') || text.includes('классификац')))) {
      return 'collateral_types';
    }

    // 3. Ипотека и ипотечное кредитование
    if (keywords.some(k => ['ипотека', 'ипотечный', 'ипотечное'].includes(k)) ||
        text.includes('ипотечн') || text.includes('ипотечное кредитование') ||
        text.includes('ипотечный договор') || text.includes('ипотечное жилищное кредитование')) {
      return 'mortgage';
    }

    // 4. Договор залога
    if (text.includes('договор залога') || text.includes('залоговый договор') ||
        text.includes('заключение договора залога') || text.includes('условия договора залога') ||
        (keywords.some(k => ['договор', 'соглашение'].includes(k)) && text.includes('залог'))) {
      return 'pledge_contract';
    }

    // 5. Предмет залога
    if (text.includes('предмет залога') || text.includes('объект залога') ||
        text.includes('имущество в залоге') || text.includes('залоговое имущество') ||
        (text.includes('предмет') && text.includes('залог'))) {
      return 'collateral_object';
    }

    // 6. Оценка залогового имущества
    if (keywords.some(k => ['оценка', 'оценить', 'стоимость'].includes(k)) ||
        text.includes('оценк') || text.includes('независимая оценка') ||
        text.includes('отчет об оценке') || text.includes('оценщик') ||
        text.includes('рыночная стоимость') || text.includes('залоговая стоимость')) {
      return 'appraisal';
    }

    // 7. LTV и залоговая стоимость
    if (keywords.some(k => ['ltv', 'loan-to-value'].includes(k)) ||
        text.includes('ltv') || text.includes('loan-to-value') ||
        text.includes('соотношение займа к стоимости') ||
        (text.includes('залоговая стоимость') && (text.includes('расчет') || text.includes('определение')))) {
      return 'ltv_calculation';
    }

    // 8. Регистрация залога
    if (keywords.some(k => ['регистрация', 'росреестр', 'егрн'].includes(k)) ||
        text.includes('регистрац') || text.includes('росреестр') ||
        text.includes('государственная регистрация') || text.includes('регистрация залога') ||
        text.includes('егрн') || text.includes('кадастровый учет')) {
      return 'registration';
    }

    // 9. Обременение и снятие обременения
    if (text.includes('обременение') || text.includes('снятие обременения') ||
        text.includes('прекращение обременения') || text.includes('освобождение от обременения')) {
      return 'encumbrance';
    }

    // 10. Риски и управление рисками
    if (keywords.some(k => ['риск', 'риски'].includes(k)) ||
        text.includes('риск') || text.includes('управление рисками') ||
        text.includes('анализ рисков') || text.includes('контроль рисков') ||
        text.includes('минимизация рисков')) {
      return 'risks';
    }

    // 11. Мониторинг залога
    if (text.includes('мониторинг залога') || text.includes('контроль залога') ||
        text.includes('проверка залога') || text.includes('осмотр залога') ||
        text.includes('проверка наличия залога')) {
      return 'monitoring';
    }

    // 12. Обращение взыскания на залог
    if (text.includes('обращение взыскания') || text.includes('взыскание на залог') ||
        text.includes('реализация залога') || text.includes('продажа залога') ||
        text.includes('обращение взыскания на предмет залога')) {
      return 'enforcement';
    }

    // 13. Страхование залога
    if (text.includes('страхование залога') || text.includes('страхование залогового имущества') ||
        keywords.some(k => ['страхование', 'страховой полис'].includes(k)) ||
        (text.includes('страхование') && text.includes('залог'))) {
      return 'insurance';
    }

    // 14. Нормативные документы и законодательство
    if (keywords.some(k => ['норматив', 'регламент', 'инструкция', 'закон', 'кодекс'].includes(k)) ||
        text.includes('норматив') || text.includes('регламент') ||
        text.includes('гражданский кодекс') || text.includes('федеральный закон') ||
        text.includes('нормативно-правовой') || text.includes('законодательство')) {
      return 'regulations';
    }

    // 15. Недвижимость как предмет залога
    if ((text.includes('недвижимость') || text.includes('квартира') || text.includes('дом') ||
         text.includes('земельный участок')) && text.includes('залог')) {
      return 'real_estate_collateral';
    }

    // 16. Движимое имущество как предмет залога
    if ((text.includes('движимое имущество') || text.includes('автомобиль') ||
         text.includes('транспортное средство') || text.includes('оборудование')) &&
        text.includes('залог')) {
      return 'movable_collateral';
    }

    // 17. Права и обязанности сторон
    if (text.includes('права залогодателя') || text.includes('права залогодержателя') ||
        text.includes('обязанности залогодателя') || text.includes('обязанности залогодержателя') ||
        text.includes('права и обязанности') || (text.includes('право') && text.includes('залог'))) {
      return 'rights_obligations';
    }

    // 18. Залогодатель и залогодержатель
    if (text.includes('залогодатель') || text.includes('залогодержатель') ||
        (text.includes('стороны') && text.includes('договор залога'))) {
      return 'parties';
    }

    // 19. Общие вопросы залога
    if (text.includes('залог') || keywords.some(k => ['залоговое имущество'].includes(k))) {
      return 'collateral_general';
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
      
      // Если на той же странице или соседних (увеличиваем радиус до 2 страниц)
      if (Math.abs(otherChunk.page - chunk.page) <= 2) {
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
   * Улучшенная версия для определения структуры документа
   */
  private extractTitle(text: string): string {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Паттерны для определения заголовков
    const titlePatterns = [
      // Номера глав/разделов: "Глава 1", "Раздел 2.1", "1.1.", "§ 1"
      /^(?:Глава|Раздел|§|Часть)\s*\d+[.\s]*(.+)$/i,
      // Нумерованные заголовки: "1. Название", "1.1. Подзаголовок"
      /^\d+[.\s]+\d*[.\s]*([А-ЯЁ][^.!?]{10,80})$/,
      // Заголовки с заглавными буквами в начале строки
      /^([А-ЯЁ][А-Яа-яё\s]{10,80})$/,
      // Заголовки с двоеточием
      /^([А-ЯЁ][^:]{10,80}):/,
    ];

    // Ищем заголовки в начале текста
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      
      // Проверяем паттерны
      for (const pattern of titlePatterns) {
        const match = line.match(pattern);
        if (match) {
          const title = match[1] || match[0];
          // Проверяем, что это не обычный текст (не слишком длинный, не заканчивается точкой)
          if (title.length > 10 && title.length < 100 && 
              !title.endsWith('.') && title.split(' ').length < 15) {
            return title.trim();
          }
        }
      }
      
      // Проверяем строки, которые выглядят как заголовки
      if (line.length > 10 && line.length < 100 && 
          /^[А-ЯЁ]/.test(line) && 
          line.split(' ').length < 15 &&
          !line.endsWith('.') &&
          !line.endsWith(',') &&
          !line.includes('что') && !line.includes('как') && !line.includes('когда')) {
        return line;
      }
    }

    // Если не нашли заголовок, пытаемся извлечь из первых предложений
    const firstSentence = text.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 10 && firstSentence.length < 100) {
      return firstSentence;
    }

    // В крайнем случае берем первые слова
    const words = text.split(/\s+/).slice(0, 12).join(' ');
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
   * Получает название категории на основе структуры документа
   */
  private getCategoryName(categoryId: string): string {
    const names: Record<string, string> = {
      // Основные понятия
      collateral_concept: 'Понятие и сущность залога',
      collateral_types: 'Виды и типы залога',
      collateral_general: 'Общие вопросы залога',
      collateral_object: 'Предмет залога',
      
      // Ипотека
      mortgage: 'Ипотека и ипотечное кредитование',
      
      // Договоры
      pledge_contract: 'Договор залога',
      
      // Оценка и стоимость
      appraisal: 'Оценка залогового имущества',
      ltv_calculation: 'LTV и залоговая стоимость',
      
      // Регистрация и обременение
      registration: 'Регистрация залога',
      encumbrance: 'Обременение и снятие обременения',
      
      // Управление
      risks: 'Риски и управление рисками',
      monitoring: 'Мониторинг залога',
      enforcement: 'Обращение взыскания на залог',
      insurance: 'Страхование залога',
      
      // Нормативные документы
      regulations: 'Нормативные документы и законодательство',
      
      // Типы имущества
      real_estate_collateral: 'Недвижимость как предмет залога',
      movable_collateral: 'Движимое имущество как предмет залога',
      
      // Стороны договора
      parties: 'Залогодатель и залогодержатель',
      rights_obligations: 'Права и обязанности сторон',
      
      // Общее
      general: 'Общие вопросы',
    };
    return names[categoryId] || 'Общие вопросы';
  }

  /**
   * Поиск по базе знаний (оптимизированная версия)
   */
  search(query: string, maxResults: number = 5): KnowledgeTopic[] {
    // Кэширование результатов поиска для производительности
    const cacheKey = `${query.toLowerCase()}-${maxResults}`;
    if (this.searchCache && this.searchCache.key === cacheKey) {
      return this.searchCache.results;
    }
    if (!query || query.trim().length === 0) {
      return [];
    }

    const lowerQuery = query.toLowerCase().trim();
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
    
    if (queryWords.length === 0 && lowerQuery.length < 3) {
      return [];
    }

    const scoredTopics = new Map<string, number>();
    const queryRegex = new RegExp(lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    // Поиск по ключевым словам (оптимизировано)
    for (const word of queryWords) {
      const topicIds = this.searchIndex.get(word);
      if (topicIds) {
        for (const topicId of topicIds) {
          const currentScore = scoredTopics.get(topicId) || 0;
          scoredTopics.set(topicId, currentScore + 10);
        }
      }
    }

    // Поиск по содержимому (оптимизировано - только по темам с начальным счетом или если запрос короткий)
    const topicsToCheck = queryWords.length === 0 || scoredTopics.size < maxResults * 2
      ? Array.from(this.topics.entries())
      : Array.from(scoredTopics.keys()).map(id => [id, this.topics.get(id)] as [string, KnowledgeTopic | undefined]).filter(([, t]) => t) as [string, KnowledgeTopic][];

    for (const [topicId, topic] of topicsToCheck) {
      if (!topic) continue;

      const lowerContent = topic.content.toLowerCase();
      const lowerTitle = topic.title.toLowerCase();

      let score = scoredTopics.get(topicId) || 0;

      // Точное совпадение в заголовке (высокий приоритет)
      if (lowerTitle.includes(lowerQuery)) {
        score += 30;
      }

      // Совпадение в содержимом
      try {
        const contentMatches = (lowerContent.match(queryRegex) || []).length;
        score += contentMatches * 2;
      } catch {
        // Если regex невалидный, используем простой поиск
        if (lowerContent.includes(lowerQuery)) {
          score += 2;
        }
      }

      // Совпадение отдельных слов (только если есть слова для поиска)
      if (queryWords.length > 0) {
        for (const word of queryWords) {
          try {
            const wordRegex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const wordMatches = (lowerContent.match(wordRegex) || []).length;
            score += wordMatches;
          } catch {
            // Если regex невалидный, используем простой поиск
            if (lowerContent.includes(word)) {
              score += 1;
            }
          }
        }
      }

      if (score > 0) {
        scoredTopics.set(topicId, score);
      }
    }

    // Сортируем и возвращаем топ результатов
    const sorted = Array.from(scoredTopics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxResults);

    return sorted
      .map(([topicId]) => this.topics.get(topicId))
      .filter((topic): topic is KnowledgeTopic => topic !== undefined);
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
   * Сохранить в IndexedDB
   */
  private async saveToStorage(): Promise<void> {
    try {
      // Очищаем старые данные
      await Promise.all([
        extendedDb.knowledgeTopics.clear(),
        extendedDb.knowledgeCategories.clear(),
        extendedDb.knowledgeSearchIndex.clear()
      ]);

      // Сохраняем темы (батчами по 1000)
      const topicsToSave: KnowledgeTopicDB[] = Array.from(this.topics.values()).map(topic => ({
        id: topic.id,
        title: topic.title,
        category: topic.category,
        keywords: topic.keywords,
        content: topic.content,
        page: topic.page,
        relatedTopics: topic.relatedTopics,
      }));

      const topicBatchSize = 1000;
      for (let i = 0; i < topicsToSave.length; i += topicBatchSize) {
        const batch = topicsToSave.slice(i, i + topicBatchSize);
        await extendedDb.knowledgeTopics.bulkPut(batch);
      }

      // Сохраняем категории (со ссылками на темы)
      const categoriesToSave: KnowledgeCategoryDB[] = Array.from(this.categories.values()).map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        topicIds: category.topics.map(t => t.id),
      }));

      if (categoriesToSave.length > 0) {
        await extendedDb.knowledgeCategories.bulkPut(categoriesToSave);
      }

      // Сохраняем поисковый индекс (батчами)
      const searchIndexToSave: KnowledgeSearchIndexDB[] = Array.from(this.searchIndex.entries()).map(([keyword, topicIds]) => ({
        keyword,
        topicIds,
      }));

      const indexBatchSize = 1000;
      for (let i = 0; i < searchIndexToSave.length; i += indexBatchSize) {
        const batch = searchIndexToSave.slice(i, i + indexBatchSize);
        await extendedDb.knowledgeSearchIndex.bulkPut(batch);
      }
    } catch (error) {
      console.error('Ошибка сохранения базы знаний в IndexedDB:', error);
      // Fallback на localStorage для метаданных (без полного контента)
      try {
        const data = {
          categories: Array.from(this.categories.values()).map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            topicCount: cat.topics.length,
          })),
          topicCount: this.topics.size,
          version: '1.0',
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('knowledgeBase_fallback', JSON.stringify(data));
      } catch (fallbackError) {
        console.error('Ошибка сохранения в localStorage (fallback):', fallbackError);
      }
    }
  }

  /**
   * Загрузить из IndexedDB
   */
  async loadFromStorage(): Promise<void> {
    try {
      // Загружаем темы
      const topicsFromDB = await extendedDb.knowledgeTopics.toArray();
      this.topics.clear();
      for (const topicDB of topicsFromDB) {
        const topic: KnowledgeTopic = {
          id: topicDB.id,
          title: topicDB.title,
          category: topicDB.category,
          keywords: topicDB.keywords,
          content: topicDB.content,
          page: topicDB.page,
          relatedTopics: topicDB.relatedTopics,
        };
        this.topics.set(topic.id, topic);
      }

      // Загружаем поисковый индекс
      const searchIndexFromDB = await extendedDb.knowledgeSearchIndex.toArray();
      this.searchIndex.clear();
      for (const indexDB of searchIndexFromDB) {
        this.searchIndex.set(indexDB.keyword, indexDB.topicIds);
      }

      // Загружаем категории и восстанавливаем связи с темами
      const categoriesFromDB = await extendedDb.knowledgeCategories.toArray();
      this.categories.clear();
      for (const categoryDB of categoriesFromDB) {
        const topics = categoryDB.topicIds
          .map(id => this.topics.get(id))
          .filter((t): t is KnowledgeTopic => t !== undefined);

        const category: KnowledgeCategory = {
          id: categoryDB.id,
          name: categoryDB.name,
          description: categoryDB.description,
          topics,
        };
        this.categories.set(category.id, category);
      }

      // Если в IndexedDB ничего нет, пробуем загрузить из localStorage (миграция)
      if (topicsFromDB.length === 0) {
        const stored = localStorage.getItem('knowledgeBase');
        if (stored) {
          try {
            const data = JSON.parse(stored);
            
            this.topics.clear();
            this.categories.clear();
            this.searchIndex.clear();

            // Восстанавливаем темы
            for (const topic of data.topics || []) {
              this.topics.set(topic.id, topic);
              
              // Восстанавливаем поисковый индекс
              for (const keyword of topic.keywords) {
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

            // Мигрируем в IndexedDB
            await this.saveToStorage();
            // Удаляем из localStorage после успешной миграции
            localStorage.removeItem('knowledgeBase');
          } catch (migrationError) {
            console.error('Ошибка миграции из localStorage:', migrationError);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки базы знаний из IndexedDB:', error);
      // Fallback на localStorage (только метаданные)
      try {
        const stored = localStorage.getItem('knowledgeBase_fallback');
        if (stored) {
          const data = JSON.parse(stored);
          console.log(`Загружены метаданные базы знаний: ${data.topicCount} тем, ${data.categories?.length || 0} категорий`);
        }
      } catch (fallbackError) {
        console.error('Ошибка загрузки из localStorage (fallback):', fallbackError);
      }
    }
  }

  /**
   * Очистить базу знаний
   */
  async clear(): Promise<void> {
    this.topics.clear();
    this.categories.clear();
    this.searchIndex.clear();
    try {
      await Promise.all([
        extendedDb.knowledgeTopics.clear(),
        extendedDb.knowledgeCategories.clear(),
        extendedDb.knowledgeSearchIndex.clear()
      ]);
      localStorage.removeItem('knowledgeBase');
      localStorage.removeItem('knowledgeBase_fallback');
    } catch (error) {
      console.error('Ошибка очистки базы знаний:', error);
    }
  }
}

export const knowledgeBase = new KnowledgeBase();

