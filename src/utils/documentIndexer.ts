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
      
      // Для разработки используем worker из node_modules
      if (import.meta.env.DEV) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      } else {
        // Для продакшена используем unpkg.com (более надежный чем cdnjs)
        // Используем .mjs версию для лучшей совместимости
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }
      
      this.workerInitialized = true;
      console.log('PDF.js worker инициализирован:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    } catch (error) {
      console.error('Ошибка инициализации PDF.js worker:', error);
      // Fallback на jsdelivr
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        this.workerInitialized = true;
        console.log('PDF.js worker инициализирован (fallback):', pdfjsLib.GlobalWorkerOptions.workerSrc);
      } catch (finalError) {
        console.error('Критическая ошибка инициализации PDF.js worker:', finalError);
      }
    }
  }

  /**
   * Разбивает текст на чанки
   */
  private createChunks(text: string, fileName: string, pageNum: number = 1): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    
    if (!text || text.trim().length === 0) {
      return chunks;
    }

    // Улучшенное разбиение на чанки: по предложениям, но не более 1000 символов
    const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
    let currentChunk = '';
    let chunkStartIndex = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const potentialChunk = currentChunk ? `${currentChunk}. ${sentence}` : sentence;
      
      if (potentialChunk.length > 1000 && currentChunk) {
        // Сохраняем текущий чанк
        const keywords = this.extractKeywords(currentChunk);
        chunks.push({
          id: `${fileName}-${pageNum}-${chunkStartIndex}`,
          documentName: fileName,
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
        id: `${fileName}-${pageNum}-${chunkStartIndex}-final`,
        documentName: fileName,
        page: pageNum,
        text: currentChunk,
        keywords,
      });
    }

    return chunks;
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
          const pageChunks = this.createChunks(pageText, file.name, pageNum);
          chunks.push(...pageChunks);
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
   * Индексирует DOCX документ
   */
  async indexDOCX(file: File): Promise<DocumentIndex> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      
      if (!text || text.trim().length === 0) {
        throw new Error('Документ не содержит текста');
      }

      // Разбиваем текст на "страницы" (примерно по 2000 символов)
      const pageSize = 2000;
      const pages: string[] = [];
      for (let i = 0; i < text.length; i += pageSize) {
        pages.push(text.slice(i, i + pageSize));
      }

      const chunks: DocumentChunk[] = [];
      pages.forEach((pageText, index) => {
        const pageChunks = this.createChunks(pageText, file.name, index + 1);
        chunks.push(...pageChunks);
      });

      const index: DocumentIndex = {
        documentName: file.name,
        chunks,
        totalPages: pages.length,
        indexedAt: new Date(),
      };

      this.indexes.set(file.name, index);
      this.chunks.push(...chunks);

      // Сохраняем в localStorage
      this.saveToStorage();

      return index;
    } catch (error) {
      console.error('Ошибка индексации DOCX:', error);
      throw error;
    }
  }

  /**
   * Индексирует XLSX документ
   */
  async indexXLSX(file: File): Promise<DocumentIndex> {
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const chunks: DocumentChunk[] = [];
      let totalPages = 0;
      const allText: string[] = [];

      // Обрабатываем все листы
      workbook.SheetNames.forEach((sheetName, sheetIndex) => {
        const worksheet = workbook.Sheets[sheetName];
        
        // Конвертируем лист в JSON для извлечения данных
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        // Формируем текст из данных листа
        const sheetText = jsonData
          .map((row: any) => {
            if (Array.isArray(row)) {
              return row.filter(cell => cell && String(cell).trim()).join(' | ');
            }
            return String(row).trim();
          })
          .filter((row: string) => row.length > 0)
          .join('\n');

        if (sheetText.trim().length > 0) {
          allText.push(`Лист "${sheetName}":\n${sheetText}`);
          const sheetChunks = this.createChunks(sheetText, file.name, sheetIndex + 1);
          chunks.push(...sheetChunks);
          totalPages++;
        }
      });

      if (chunks.length === 0) {
        throw new Error('Документ не содержит данных');
      }

      const index: DocumentIndex = {
        documentName: file.name,
        chunks,
        totalPages: totalPages || 1,
        indexedAt: new Date(),
      };

      this.indexes.set(file.name, index);
      this.chunks.push(...chunks);

      // Сохраняем в localStorage
      this.saveToStorage();

      return index;
    } catch (error) {
      console.error('Ошибка индексации XLSX:', error);
      throw error;
    }
  }

  /**
   * Универсальный метод индексации документа (определяет тип автоматически)
   */
  async indexDocument(file: File): Promise<DocumentIndex> {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf')) {
      return await this.indexPDF(file);
    } else if (fileName.endsWith('.docx')) {
      return await this.indexDOCX(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return await this.indexXLSX(file);
    } else {
      throw new Error(`Неподдерживаемый формат файла: ${file.name}. Поддерживаются: PDF, DOCX, XLSX`);
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

