/**
 * Утилита для индексации и поиска по документам из папки VND
 */

import { extendedDb, type DocumentIndexDB, type DocumentChunkDB } from '@/services/ExtendedStorageService';

export interface DocumentChunk {
  id: string;
  documentName: string;
  page: number;
  text: string;
  keywords: string[];
  imageData?: string; // Base64 для изображений
  isImage?: boolean; // Флаг, что это изображение
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
      
      // Подавляем предупреждения PDF.js в консоли (некритические)
      if (typeof window !== 'undefined' && window.console) {
        const originalWarn = console.warn;
        console.warn = (...args: any[]) => {
          // Фильтруем предупреждения о шрифтах TrueType
          const message = args.join(' ');
          if (message.includes('TT: undefined function') || 
              message.includes('Warning: TT:') ||
              message.includes('Missing or invalid font')) {
            // Подавляем эти предупреждения, так как они не критичны
            return;
          }
          originalWarn.apply(console, args);
        };
      }
      
      this.workerInitialized = true;
      if (import.meta.env.MODE === 'development') {
        // Подавляем предупреждения PDF.js о шрифтах
        if (typeof window !== 'undefined') {
          const originalWarn = console.warn;
          console.warn = function(...args: any[]) {
            // Пропускаем предупреждения о шрифтах PDF.js
            if (args[0] && typeof args[0] === 'string' && args[0].includes('TT: undefined function')) {
              return;
            }
            originalWarn.apply(console, args);
          };
        }
        
        if (import.meta.env.MODE === 'development') {
          console.log('PDF.js worker инициализирован:', pdfjsLib.GlobalWorkerOptions.workerSrc);
        }
      }
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
    // Сохраняем оригинальный console.warn для восстановления
    const originalConsoleWarn = console.warn;
    
    try {
      // Инициализируем worker перед использованием
      await this.initializeWorker();
      
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      
      // Настройки для более мягкой обработки ошибок и предупреждений
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        // Игнорируем некритичные предупреждения о шрифтах
        verbosity: 0, // 0 = errors, 1 = warnings, 5 = infos
        // Отключаем строгую проверку шрифтов
        stopAtErrors: false,
        // Дополнительные опции для обработки проблемных PDF
        isEvalSupported: false,
        disableFontFace: false,
        // Игнорируем предупреждения о неопределенных функциях шрифтов
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      
      // Подавляем предупреждения при обработке страниц
      console.warn = (...args: any[]) => {
        const message = args.join(' ');
        if (message.includes('TT: undefined function') || 
            message.includes('Warning: TT:') ||
            message.includes('Missing or invalid font') ||
            message.includes('pdf.worker')) {
          // Подавляем некритические предупреждения о шрифтах
          return;
        }
        originalConsoleWarn.apply(console, args);
      };
      
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

      // Сохраняем в IndexedDB (асинхронно, не блокируя)
      this.saveToStorage().catch(err => console.error('Ошибка сохранения индекса PDF:', err));

      // Восстанавливаем оригинальный console.warn
      console.warn = originalConsoleWarn;
      
      return index;
    } catch (error) {
      // Восстанавливаем оригинальный console.warn в случае ошибки
      console.warn = originalConsoleWarn;
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

      // Сохраняем в IndexedDB (асинхронно, не блокируя) - только этот документ
      this.saveToStorage(file.name).catch(err => console.error('Ошибка сохранения индекса DOCX:', err));

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

      // Сохраняем в IndexedDB (асинхронно, не блокируя) - только этот документ
      this.saveToStorage(file.name).catch(err => console.error('Ошибка сохранения индекса XLSX:', err));

      return index;
    } catch (error) {
      console.error('Ошибка индексации XLSX:', error);
      throw error;
    }
  }

  /**
   * Индексирует изображение (сохраняет и создает описание)
   */
  async indexImage(file: File): Promise<DocumentIndex> {
    try {
      // Читаем изображение как Base64
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Создаем чанк с изображением
      // Текст будет заполнен после анализа через AI
      const chunk: DocumentChunk = {
        id: `${file.name}-image-1`,
        documentName: file.name,
        page: 1,
        text: `[Изображение: ${file.name}]`, // Временный текст, будет заменен после анализа
        keywords: this.extractKeywordsFromImageName(file.name),
        imageData,
        isImage: true,
      };

      const index: DocumentIndex = {
        documentName: file.name,
        chunks: [chunk],
        totalPages: 1,
        indexedAt: new Date(),
      };

      this.indexes.set(file.name, index);
      this.chunks.push(chunk);

      // Сохраняем в IndexedDB (асинхронно, не блокируя) - только этот документ
      this.saveToStorage(file.name).catch(err => console.error('Ошибка сохранения индекса изображения:', err));

      return index;
    } catch (error) {
      console.error('Ошибка индексации изображения:', error);
      throw error;
    }
  }

  /**
   * Извлекает ключевые слова из имени изображения
   */
  private extractKeywordsFromImageName(fileName: string): string[] {
    const keywords: string[] = [];
    const lowerName = fileName.toLowerCase();
    
    // Проверяем наличие ключевых слов в имени файла
    const imageKeywords = [
      'залог', 'ипотека', 'недвижимость', 'квартира', 'дом', 'офис', 'склад',
      'автомобиль', 'транспорт', 'документ', 'договор', 'свидетельство',
      'выписка', 'егрн', 'кадастр', 'оценка', 'отчет', 'акт', 'осмотр',
    ];

    for (const keyword of imageKeywords) {
      if (lowerName.includes(keyword)) {
        keywords.push(keyword);
      }
    }

    return keywords;
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
    } else if (this.isImageFile(fileName)) {
      return await this.indexImage(file);
    } else {
      throw new Error(`Неподдерживаемый формат файла: ${file.name}. Поддерживаются: PDF, DOCX, XLSX, XLS, JPG, JPEG, PNG, GIF, BMP, WEBP`);
    }
  }

  /**
   * Проверяет, является ли файл изображением
   */
  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => fileName.endsWith(ext));
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
   * Сохранить индексы в IndexedDB (оптимизированная версия - сохраняет только новые/обновленные)
   */
  private async saveToStorage(documentName?: string): Promise<void> {
    try {
      // Если указан конкретный документ, сохраняем только его
      if (documentName) {
        const index = this.indexes.get(documentName);
        if (!index) return;

        const indexToSave: DocumentIndexDB = {
          documentName: index.documentName,
          totalPages: index.totalPages,
          indexedAt: index.indexedAt,
        };

        // Удаляем старые данные для этого документа
        await Promise.all([
          extendedDb.documentChunks.where('documentName').equals(documentName).delete(),
          extendedDb.documentIndexes.where('documentName').equals(documentName).delete()
        ]);

        // Сохраняем новый индекс
        await extendedDb.documentIndexes.put(indexToSave);

        // Сохраняем чанки для этого документа (батчами)
        const chunksToSave: DocumentChunkDB[] = index.chunks.map(chunk => ({
          id: chunk.id,
          documentName: chunk.documentName,
          page: chunk.page,
          text: chunk.text,
          keywords: chunk.keywords,
          imageData: chunk.imageData,
          isImage: chunk.isImage,
        }));

        const batchSize = 1000;
        for (let i = 0; i < chunksToSave.length; i += batchSize) {
          const batch = chunksToSave.slice(i, i + batchSize);
          await extendedDb.documentChunks.bulkPut(batch);
        }
      } else {
        // Сохраняем все индексы (для миграции или полного обновления)
        const indexesToSave: DocumentIndexDB[] = Array.from(this.indexes.values()).map((index) => ({
          documentName: index.documentName,
          totalPages: index.totalPages,
          indexedAt: index.indexedAt,
        }));

        if (indexesToSave.length === 0) return;

        // Удаляем старые индексы и чанки для обновляемых документов
        const documentNames = indexesToSave.map(idx => idx.documentName);
        await Promise.all([
          extendedDb.documentChunks.where('documentName').anyOf(documentNames).delete(),
          extendedDb.documentIndexes.where('documentName').anyOf(documentNames).delete()
        ]);

        // Сохраняем новые индексы
        await extendedDb.documentIndexes.bulkPut(indexesToSave);

        // Сохраняем чанки (батчами по 1000 для оптимизации)
        const chunksToSave: DocumentChunkDB[] = this.chunks.map(chunk => ({
          id: chunk.id,
          documentName: chunk.documentName,
          page: chunk.page,
          text: chunk.text,
          keywords: chunk.keywords,
          imageData: chunk.imageData,
          isImage: chunk.isImage,
        }));

        const batchSize = 1000;
        for (let i = 0; i < chunksToSave.length; i += batchSize) {
          const batch = chunksToSave.slice(i, i + batchSize);
          await extendedDb.documentChunks.bulkPut(batch);
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения индексов в IndexedDB:', error);
      // Fallback на localStorage для небольших данных (только метаданные)
      try {
        const data = {
          indexes: Array.from(this.indexes.values()).map((index) => ({
            documentName: index.documentName,
            totalPages: index.totalPages,
            indexedAt: index.indexedAt.toISOString(),
          })),
          // Не сохраняем чанки в localStorage - только метаданные
        };
        localStorage.setItem('documentIndexes_fallback', JSON.stringify(data));
      } catch (fallbackError) {
        console.error('Ошибка сохранения в localStorage (fallback):', fallbackError);
      }
    }
  }

  /**
   * Загрузить индексы из IndexedDB
   */
  async loadFromStorage(): Promise<void> {
    try {
      // Загружаем индексы из IndexedDB
      const indexesFromDB = await extendedDb.documentIndexes.toArray();
      const chunksFromDB = await extendedDb.documentChunks.toArray();

      this.indexes.clear();
      this.chunks = [];

      // Группируем чанки по документам
      const chunksByDocument = new Map<string, DocumentChunk[]>();
      for (const chunkDB of chunksFromDB) {
        if (!chunksByDocument.has(chunkDB.documentName)) {
          chunksByDocument.set(chunkDB.documentName, []);
        }
        chunksByDocument.get(chunkDB.documentName)!.push({
          id: chunkDB.id,
          documentName: chunkDB.documentName,
          page: chunkDB.page,
          text: chunkDB.text,
          keywords: chunkDB.keywords,
          imageData: chunkDB.imageData,
          isImage: chunkDB.isImage,
        });
      }

      // Восстанавливаем индексы
      for (const indexDB of indexesFromDB) {
        const chunks = chunksByDocument.get(indexDB.documentName) || [];
        const index: DocumentIndex = {
          documentName: indexDB.documentName,
          chunks,
          totalPages: indexDB.totalPages,
          indexedAt: indexDB.indexedAt instanceof Date ? indexDB.indexedAt : new Date(indexDB.indexedAt),
        };
        this.indexes.set(index.documentName, index);
        this.chunks.push(...chunks);
      }

      // Если в IndexedDB ничего нет, пробуем загрузить из localStorage (миграция)
      if (indexesFromDB.length === 0) {
        const stored = localStorage.getItem('documentIndexes');
        if (stored) {
          try {
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

            // Мигрируем в IndexedDB
            await this.saveToStorage();
            // Удаляем из localStorage после успешной миграции
            localStorage.removeItem('documentIndexes');
          } catch (migrationError) {
            console.error('Ошибка миграции из localStorage:', migrationError);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки индексов из IndexedDB:', error);
      // Fallback на localStorage
      try {
        const stored = localStorage.getItem('documentIndexes_fallback');
        if (stored) {
          const data = JSON.parse(stored);
          this.indexes.clear();
          this.chunks = [];

          for (const indexData of data.indexes || []) {
            const index: DocumentIndex = {
              documentName: indexData.documentName,
              chunks: (data.chunks || []).filter((c: any) => c.documentName === indexData.documentName).map((c: any) => ({
                id: c.id,
                documentName: c.documentName,
                page: c.page,
                text: c.text,
                keywords: c.keywords,
                isImage: c.isImage,
              })),
              totalPages: indexData.totalPages,
              indexedAt: new Date(indexData.indexedAt),
            };
            this.indexes.set(index.documentName, index);
            this.chunks.push(...index.chunks);
          }
        }
      } catch (fallbackError) {
        console.error('Ошибка загрузки из localStorage (fallback):', fallbackError);
      }
    }
  }

  /**
   * Очистить все индексы
   */
  async clearIndexes(): Promise<void> {
    this.indexes.clear();
    this.chunks = [];
    try {
      await extendedDb.documentIndexes.clear();
      await extendedDb.documentChunks.clear();
      localStorage.removeItem('documentIndexes');
      localStorage.removeItem('documentIndexes_fallback');
    } catch (error) {
      console.error('Ошибка очистки индексов:', error);
    }
  }

  /**
   * Обновить индекс документа (публичный метод)
   */
  updateDocumentIndex(index: DocumentIndex): void {
    this.indexes.set(index.documentName, index);
    
    // Обновляем chunks
    const oldChunks = this.chunks.filter(c => c.documentName !== index.documentName);
    this.chunks = [...oldChunks, ...index.chunks];
    
    // Сохраняем в IndexedDB (асинхронно) - только этот документ
    this.saveToStorage(index.documentName).catch(err => console.error('Ошибка обновления индекса:', err));
  }

  /**
   * Извлечь ключевые слова из текста (публичный метод)
   */
  extractKeywordsPublic(text: string): string[] {
    return this.extractKeywords(text);
  }
}

export const documentIndexer = new DocumentIndexer();

