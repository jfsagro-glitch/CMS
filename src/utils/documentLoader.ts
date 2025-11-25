/**
 * Утилита для загрузки документов из папки VND
 */

import { documentIndexer, type DocumentIndex } from './documentIndexer';
import { knowledgeBase } from './knowledgeBase';

/**
 * Список известных PDF документов в папке VND
 * Можно расширить, добавив другие документы
 */
const KNOWN_PDF_FILES = [
  '[Volhin_N.A.]_Zalogovik._Vse_o_bankovskih_zalogah_(b-ok.org).pdf',
  // Добавьте сюда другие PDF файлы по мере их добавления в папку VND
];

/**
 * Загружает и индексирует все PDF документы из папки VND
 */
export async function loadVNDDocuments(forceReindex: boolean = false): Promise<DocumentIndex[]> {
  try {
    // Загружаем существующие индексы
    documentIndexer.loadFromStorage();
    
    const basePath = import.meta.env.BASE_URL || './';
    const indexedDocuments: DocumentIndex[] = [];
    let needsRebuild = false;

    // Пытаемся загрузить все известные PDF файлы
    for (const pdfFileName of KNOWN_PDF_FILES) {
      // Список путей для попытки загрузки (для GitHub Pages и локальной разработки)
      const pathsToTry = [
        `${basePath}VND/${pdfFileName}`, // Для GitHub Pages с base path
        `./VND/${pdfFileName}`, // Относительный путь
        `/VND/${pdfFileName}`, // Абсолютный путь
        `VND/${pdfFileName}`, // Без слешей
        `${window.location.origin}${basePath}VND/${pdfFileName}`, // Полный URL
        `${window.location.origin}/VND/${pdfFileName}`, // Полный URL без base path
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
          const file = new File(
            [blob],
            pdfFileName,
            { type: 'application/pdf' }
          );

          // Проверяем, не индексирован ли уже этот документ
          const existingIndexes = documentIndexer.getIndexedDocuments();
          const existingIndex = existingIndexes.find(
            idx => idx.documentName === file.name
          );

          // Если принудительная переиндексация или документ не индексирован
          if (forceReindex || !existingIndex) {
            console.log(`Индексирую документ: ${file.name}`);
            const index = await documentIndexer.indexPDF(file);
            indexedDocuments.push(index);
            console.log(`✅ Документ проиндексирован: ${file.name} (${index.totalPages} страниц, ${index.chunks.length} чанков)`);
            needsRebuild = true;
          } else {
            console.log(`Документ уже проиндексирован: ${file.name} (${existingIndex.totalPages} страниц)`);
            indexedDocuments.push(existingIndex);
          }
        } catch (error) {
          console.error(`Ошибка индексации документа ${pdfFileName}:`, error);
        }
      } else {
        console.warn(`Не удалось загрузить документ из VND: ${pdfFileName}`);
      }
    }

    // Если были проиндексированы новые документы или принудительная переиндексация, перестраиваем базу знаний
    if (needsRebuild || forceReindex) {
      console.log('Строю базу знаний из всех документов...');
      await knowledgeBase.buildFromDocuments();
      console.log('✅ База знаний построена');
    } else {
      // Загружаем базу знаний из хранилища
      knowledgeBase.loadFromStorage();
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
  const index = await documentIndexer.indexPDF(file);
  
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

