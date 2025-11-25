/**
 * Утилита для индексации и поиска по документам из папки VND
 */

export interface DocumentChunk {
  id: string;
  documentName: string;
  page: number;
  text: string;
  keywords: string[];
}

export interface DocumentIndex {
  documentName: string;
  chunks: DocumentChunk[];
  totalPages: number;
  indexedAt: Date;
}

class DocumentIndexer {
  private indexes: Map<string, DocumentIndex> = new Map();
  private chunks: DocumentChunk[] = [];
  private workerInitialized = false;

  /**
   * Инициализирует PDF.js worker (вызывается один раз)
   */
  private async initializeWorker(): Promise<void> {
    if (this.workerInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      const pdfjsLib = await import('pdfjs-dist');
      
      // Пробуем использовать worker из node_modules (для dev) или CDN (для prod)
      try {
        // Для разработки используем worker из node_modules
        if (import.meta.env.DEV) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
          ).toString();
        } else {
          // Для продакшена используем CDN
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }
        this.workerInitialized = true;
      } catch (e) {
        // Fallback на CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        this.workerInitialized = true;
      }
    } catch (error) {
      console.error('Ошибка инициализации PDF.js worker:', error);
    }
  }

  /**
   * Индексирует PDF документ
   */
  async indexPDF(file: File): Promise<DocumentIndex> {
    try {
      // Инициализируем worker перед использованием
      await this.initializeWorker();
      
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      const chunks: DocumentChunk[] = [];
      const allText: string[] = [];

      // Извлекаем текст со всех страниц
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();

        if (pageText.length > 0) {
          allText.push(pageText);
          
          // Улучшенное разбиение на чанки: по предложениям, но не более 1000 символов
          const sentences = pageText.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
          let currentChunk = '';
          let chunkStartIndex = 0;
          
          for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            const potentialChunk = currentChunk ? `${currentChunk}. ${sentence}` : sentence;
            
            if (potentialChunk.length > 1000 && currentChunk) {
              // Сохраняем текущий чанк
              const keywords = this.extractKeywords(currentChunk);
              chunks.push({
                id: `${file.name}-${pageNum}-${chunkStartIndex}`,
                documentName: file.name,
                page: pageNum,
                text: currentChunk,
                keywords,
              });
              
              // Начинаем новый чанк
              currentChunk = sentence;
              chunkStartIndex = i;
            } else {
              currentChunk = potentialChunk;
            }
          }
          
          // Добавляем последний чанк
          if (currentChunk.trim().length > 0) {
            const keywords = this.extractKeywords(currentChunk);
            chunks.push({
              id: `${file.name}-${pageNum}-${chunkStartIndex}-final`,
              documentName: file.name,
              page: pageNum,
              text: currentChunk,
              keywords,
            });
          }
        }
      }

      const index: DocumentIndex = {
        documentName: file.name,
        chunks,
        totalPages,
        indexedAt: new Date(),
      };

      this.indexes.set(file.name, index);
      this.chunks.push(...chunks);

      // Сохраняем в localStorage
      this.saveToStorage();

      return index;
    } catch (error) {
      console.error('Ошибка индексации PDF:', error);
      throw error;
    }
  }

  /**
   * Извлекает ключевые слова из текста
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();

    // Расширенный список важных терминов для банковских залогов
    const importantTerms = [
      // Основные понятия
      'залог', 'залоговое имущество', 'залогодатель', 'залогодержатель', 'залоговое право',
      'ипотека', 'ипотечное кредитование', 'ипотечный договор', 'ипотечное жилищное кредитование',
      'ltv', 'loan-to-value', 'залоговая стоимость', 'рыночная стоимость', 'кадастровая стоимость',
      'оценка', 'оценщик', 'отчет об оценке', 'переоценка', 'независимая оценка',
      'договор залога', 'договор ипотеки', 'залоговое право', 'право залога',
      'обременение', 'снятие обременения', 'регистрация залога', 'государственная регистрация',
      // Типы имущества
      'недвижимость', 'квартира', 'дом', 'земельный участок', 'коммерческая недвижимость',
      'транспортное средство', 'автомобиль', 'оборудование', 'движимое имущество',
      // Организации и документы
      'росреестр', 'егрн', 'кадастровый номер', 'кадастровый учет',
      'кредит', 'кредитный договор', 'задолженность', 'основной долг', 'проценты',
      'нормативный документ', 'регламент', 'инструкция', 'положение', 'политика',
      // Риски и управление
      'риск', 'управление рисками', 'мониторинг', 'контроль', 'анализ рисков',
      'страхование', 'страховой полис', 'страховая сумма',
      // Процедуры
      'обращение взыскания', 'реализация залога', 'продажа залога',
      'проверка залога', 'осмотр залога', 'мониторинг залога',
    ];

    for (const term of importantTerms) {
      if (lowerText.includes(term.toLowerCase())) {
        keywords.push(term);
      }
    }

    return [...new Set(keywords)];
  }

  /**
   * Поиск по индексированным документам
   */
  search(query: string, maxResults: number = 5): DocumentChunk[] {
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);

    const scoredChunks = this.chunks.map(chunk => {
      let score = 0;
      const lowerText = chunk.text.toLowerCase();

      // Поиск по ключевым словам
      for (const keyword of chunk.keywords) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }

      // Поиск по словам запроса
      for (const word of queryWords) {
        const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
        score += matches * 2;
      }

      // Точное совпадение фразы
      if (lowerText.includes(lowerQuery)) {
        score += 20;
      }

      return { chunk, score };
    });

    return scoredChunks
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.chunk);
  }

  /**
   * Получить все индексированные документы
   */
  getIndexedDocuments(): DocumentIndex[] {
    return Array.from(this.indexes.values());
  }

  /**
   * Сохранить индексы в localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        indexes: Array.from(this.indexes.values()).map((index) => ({
          ...index,
          indexedAt: index.indexedAt.toISOString(),
        })),
        chunks: this.chunks,
      };
      localStorage.setItem('documentIndexes', JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка сохранения индексов:', error);
    }
  }

  /**
   * Загрузить индексы из localStorage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('documentIndexes');
      if (stored) {
        const data = JSON.parse(stored);
        
        this.indexes.clear();
        this.chunks = [];

        for (const indexData of data.indexes || []) {
          const index: DocumentIndex = {
            ...indexData,
            indexedAt: new Date(indexData.indexedAt),
          };
          this.indexes.set(index.documentName, index);
          this.chunks.push(...index.chunks);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки индексов:', error);
    }
  }

  /**
   * Очистить все индексы
   */
  clearIndexes(): void {
    this.indexes.clear();
    this.chunks = [];
    localStorage.removeItem('documentIndexes');
  }
}

export const documentIndexer = new DocumentIndexer();

