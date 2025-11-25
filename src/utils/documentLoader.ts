/**
 * Утилита для загрузки документов из папки VND
 */

import { documentIndexer, type DocumentIndex } from './documentIndexer';
import { knowledgeBase } from './knowledgeBase';

/**
 * Список известных документов в папке VND
 * Поддерживаются: PDF, DOCX, XLSX
 * Временные файлы (начинающиеся с ~$) игнорируются автоматически
 */
const KNOWN_DOCUMENT_FILES = [
  // Основные документы
  '[Volhin_N.A.]_Zalogovik._Vse_o_bankovskih_zalogah_(b-ok.org).pdf',
  'Виды залогового имущества.docx',
  'Отнесение фондированного обеспечения к категориям качества обеспечения.docx',
  'Документы для мониторинга залога.xlsx',
  'Нетиповые риски.docx',
  'Примеры заданий.docx',
  // Документы по оценке
  'Оценка АЗС.docx',
  'Оценка торговых центров.docx',
  'BusinesStat АЗС.docx',
  // FSO документы (Федеральные стандарты оценки)
  'FSO1.pdf',
  'FSO2.pdf',
  'FSO3.pdf',
  'FSO4.pdf',
  'FSO5.pdf',
  'FSO6.pdf',
  'FSO7.pdf',
  'FSO8.pdf',
  'FSO9.pdf',
  'FSO10.pdf',
  'FSO11.pdf',
  // Документы по оценке (PDF)
  'ocenka_biznesa_voprosy_s_otvetami.pdf',
  'ocenka_nedvizhimosti_predpriyatiya_voprosy_s_otvetami.pdf',
  'ocenka_nedvizhimosti_voprosy_s_otvetami.pdf',
];

/**
 * Определяет тип файла по расширению
 */
function getFileType(fileName: string): 'pdf' | 'docx' | 'xlsx' | 'unknown' {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.pdf')) return 'pdf';
  if (lowerName.endsWith('.docx')) return 'docx';
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) return 'xlsx';
  return 'unknown';
}

/**
 * Загружает и индексирует все документы из папки VND
 */
export async function loadVNDDocuments(forceReindex: boolean = false): Promise<DocumentIndex[]> {
  try {
    // Загружаем существующие индексы
    documentIndexer.loadFromStorage();
    
    const basePath = import.meta.env.BASE_URL || './';
    const indexedDocuments: DocumentIndex[] = [];
    let needsRebuild = false;

    // Пытаемся загрузить все известные документы
    for (const fileName of KNOWN_DOCUMENT_FILES) {
      // Игнорируем временные файлы (начинающиеся с ~$)
      if (fileName.startsWith('~$')) {
        continue;
      }
      
      const fileType = getFileType(fileName);
      if (fileType === 'unknown') {
        console.warn(`Пропущен файл с неизвестным типом: ${fileName}`);
        continue;
      }
      // Список путей для попытки загрузки (для GitHub Pages и локальной разработки)
      const pathsToTry = [
        `${basePath}VND/${fileName}`, // Для GitHub Pages с base path
        `./VND/${fileName}`, // Относительный путь
        `/VND/${fileName}`, // Абсолютный путь
        `VND/${fileName}`, // Без слешей
        `${window.location.origin}${basePath}VND/${fileName}`, // Полный URL
        `${window.location.origin}/VND/${fileName}`, // Полный URL без base path
      ];
      
      let response: Response | null = null;
      for (const pdfPath of pathsToTry) {
        try {
          const testResponse = await fetch(pdfPath);
          if (testResponse.ok) {
            response = testResponse;
            break;
          }
        } catch (e) {
          // Продолжаем попытки
          continue;
        }
      }
      
      if (response && response.ok) {
        try {
          const blob = await response.blob();
          
          // Определяем MIME тип по расширению
          let mimeType = 'application/octet-stream';
          if (fileType === 'pdf') mimeType = 'application/pdf';
          else if (fileType === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          else if (fileType === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          
          const file = new File(
            [blob],
            fileName,
            { type: mimeType }
          );

          // Проверяем, не индексирован ли уже этот документ
          const existingIndexes = documentIndexer.getIndexedDocuments();
          const existingIndex = existingIndexes.find(
            idx => idx.documentName === file.name
          );

          // Если принудительная переиндексация или документ не индексирован
          if (forceReindex || !existingIndex) {
            console.log(`Индексирую документ: ${file.name} (тип: ${fileType})`);
            const index = await documentIndexer.indexDocument(file);
            indexedDocuments.push(index);
            console.log(`✅ Документ проиндексирован: ${file.name} (${index.totalPages} страниц/листов, ${index.chunks.length} чанков)`);
            needsRebuild = true;
          } else {
            console.log(`Документ уже проиндексирован: ${file.name} (${existingIndex.totalPages} страниц/листов)`);
            indexedDocuments.push(existingIndex);
          }
        } catch (error) {
          console.error(`Ошибка индексации документа ${fileName}:`, error);
        }
      } else {
        console.warn(`Не удалось загрузить документ из VND: ${fileName}`);
      }
    }

    // Если были проиндексированы новые документы или принудительная переиндексация, перестраиваем базу знаний
    if (needsRebuild || forceReindex) {
      console.log('🔨 Строю базу знаний из всех документов...');
      await knowledgeBase.buildFromDocuments();
      const categories = knowledgeBase.getCategories();
      console.log(`✅ База знаний построена: ${categories.length} категорий, ${indexedDocuments.length} документов`);
    } else {
      // Загружаем базу знаний из хранилища
      knowledgeBase.loadFromStorage();
      const categories = knowledgeBase.getCategories();
      console.log(`📚 База знаний загружена из хранилища: ${categories.length} категорий, ${indexedDocuments.length} документов`);
    }

    // Если не удалось загрузить ни одного документа, но есть сохраненные индексы
    if (indexedDocuments.length === 0) {
      const existingIndexes = documentIndexer.getIndexedDocuments();
      if (existingIndexes.length > 0) {
        console.log(`Найдены ранее проиндексированные документы в localStorage: ${existingIndexes.length}`);
        return existingIndexes;
      }
      console.info('Документы не найдены. Вы можете загрузить PDF документ вручную через кнопку "Загрузить документ"');
    } else {
      console.log(`✅ Всего проиндексировано документов: ${indexedDocuments.length}`);
    }

    return indexedDocuments.length > 0 ? indexedDocuments : documentIndexer.getIndexedDocuments();
  } catch (error) {
    console.error('Ошибка загрузки документов VND:', error);
    // Пытаемся загрузить из localStorage
    try {
      const existingIndexes = documentIndexer.getIndexedDocuments();
      if (existingIndexes.length > 0) {
        console.log('Загружены ранее проиндексированные документы из localStorage');
        return existingIndexes;
      }
    } catch (storageError) {
      console.error('Ошибка загрузки из localStorage:', storageError);
    }
    return [];
  }
}

/**
 * Загружает документ вручную через файловый input
 */
export async function loadDocumentManually(file: File): Promise<DocumentIndex> {
  const fileType = getFileType(file.name);
  if (fileType === 'unknown') {
    throw new Error(`Неподдерживаемый формат файла: ${file.name}. Поддерживаются: PDF, DOCX, XLSX`);
  }
  
  const index = await documentIndexer.indexDocument(file);
  
  // Строим базу знаний из всех индексированных документов
  await knowledgeBase.buildFromDocuments();
  
  return index;
}

/**
 * Принудительно переиндексирует все документы из папки VND
 */
export async function reindexAllDocuments(): Promise<DocumentIndex[]> {
  console.log('🔄 Начинаю принудительную переиндексацию всех документов...');
  
  // Очищаем существующие индексы
  documentIndexer.clearIndexes();
  knowledgeBase.clear();
  
  // Загружаем и индексируем все документы заново
  return await loadVNDDocuments(true);
}

