/**
 * Утилита для загрузки документов из папки VND
 */

import { documentIndexer, type DocumentIndex } from './documentIndexer';
import { knowledgeBase } from './knowledgeBase';

/**
 * Загружает и индексирует документы из папки VND
 */
export async function loadVNDDocuments(): Promise<DocumentIndex[]> {
  try {
    // Загружаем существующие индексы
    documentIndexer.loadFromStorage();

    // Пытаемся загрузить PDF из папки VND
    // Пробуем разные пути для разных окружений
    const pdfFileName = '[Volhin_N.A.]_Zalogovik._Vse_o_bankovskih_zalogah_(b-ok.org).pdf';
    const basePath = import.meta.env.BASE_URL || './';
    
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
      const blob = await response.blob();
      const file = new File(
        [blob],
        '[Volhin_N.A.]_Zalogovik._Vse_o_bankovskih_zalogah_(b-ok.org).pdf',
        { type: 'application/pdf' }
      );

      // Проверяем, не индексирован ли уже этот документ
      const existingIndexes = documentIndexer.getIndexedDocuments();
      const alreadyIndexed = existingIndexes.find(
        idx => idx.documentName === file.name
      );

      if (!alreadyIndexed) {
        console.log('Индексирую документ:', file.name);
        await documentIndexer.indexPDF(file);
        console.log('✅ Документ проиндексирован');
        
        // Строим базу знаний из индексированного документа
        console.log('Строю базу знаний...');
        await knowledgeBase.buildFromDocuments();
        console.log('✅ База знаний построена');
      } else {
        console.log('Документ уже проиндексирован:', file.name);
        // Загружаем базу знаний из хранилища
        knowledgeBase.loadFromStorage();
      }
    } else {
      console.warn('Не удалось загрузить документ из VND:', response?.statusText || 'файл не найден');
      console.info('Вы можете загрузить PDF документ вручную через кнопку "Загрузить документ"');
      
      // Пытаемся загрузить из localStorage, если документ был проиндексирован ранее
      const existingIndexes = documentIndexer.getIndexedDocuments();
      if (existingIndexes.length > 0) {
        console.log('Найдены ранее проиндексированные документы в localStorage');
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки документов VND:', error);
    // Не показываем ошибку пользователю, так как документ можно загрузить вручную
    // Пытаемся загрузить из localStorage
    try {
      const existingIndexes = documentIndexer.getIndexedDocuments();
      if (existingIndexes.length > 0) {
        console.log('Загружены ранее проиндексированные документы из localStorage');
      }
    } catch (storageError) {
      console.error('Ошибка загрузки из localStorage:', storageError);
    }
  }

  return documentIndexer.getIndexedDocuments();
}

/**
 * Загружает документ вручную через файловый input
 */
export async function loadDocumentManually(file: File): Promise<DocumentIndex> {
  const index = await documentIndexer.indexPDF(file);
  
  // Строим базу знаний из индексированного документа
  await knowledgeBase.buildFromDocuments();
  
  return index;
}

