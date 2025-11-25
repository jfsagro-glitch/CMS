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

  /**
   * Индексирует PDF документ
   */
  async indexPDF(file: File): Promise<DocumentIndex> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      
      // Настройка worker для pdf.js
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
          
          // Разбиваем на чанки по 500 символов
          const chunkSize = 500;
          for (let i = 0; i < pageText.length; i += chunkSize) {
            const chunkText = pageText.slice(i, i + chunkSize);
            const keywords = this.extractKeywords(chunkText);
            
            chunks.push({
              id: `${file.name}-${pageNum}-${i}`,
              documentName: file.name,
              page: pageNum,
              text: chunkText,
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

    // Список важных терминов для банковских залогов
    const importantTerms = [
      'залог', 'залоговое имущество', 'залогодатель', 'залогодержатель',
      'ипотека', 'ипотечное кредитование', 'ипотечный договор',
      'ltv', 'loan-to-value', 'залоговая стоимость', 'рыночная стоимость',
      'оценка', 'оценщик', 'отчет об оценке',
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

