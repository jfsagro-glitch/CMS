/**
 * Утилита для загрузки документов из папки VND
 */

import { documentIndexer, type DocumentIndex } from './documentIndexer';

/**
 * Загружает и индексирует документы из папки VND
 */
export async function loadVNDDocuments(): Promise<DocumentIndex[]> {
  try {
    // Загружаем существующие индексы
    documentIndexer.loadFromStorage();

    // Пытаемся загрузить PDF из папки VND
    // Пробуем разные пути для разных окружений
    const basePath = import.meta.env.BASE_URL || './';
    const pdfPath = `${basePath}VND/[Volhin_N.A.]_Zalogovik._Vse_o_bankovskih_zalogah_(b-ok.org).pdf`;
    
    let response = await fetch(pdfPath);
    
    // Если не получилось, пробуем без base path
    if (!response.ok) {
      response = await fetch('/VND/[Volhin_N.A.]_Zalogovik._Vse_o_bankovskih_zalogah_(b-ok.org).pdf');
    }
    
    // Если все еще не получилось, пробуем относительный путь
    if (!response.ok) {
      response = await fetch('./VND/[Volhin_N.A.]_Zalogovik._Vse_o_bankovskih_zalogah_(b-ok.org).pdf');
    }
    
    if (response.ok) {
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
      } else {
        console.log('Документ уже проиндексирован:', file.name);
      }
    } else {
      console.warn('Не удалось загрузить документ из VND:', response.statusText);
      console.info('Вы можете загрузить PDF документ вручную через кнопку "Загрузить документ"');
    }
  } catch (error) {
    console.error('Ошибка загрузки документов VND:', error);
    // Не показываем ошибку пользователю, так как документ можно загрузить вручную
  }

  return documentIndexer.getIndexedDocuments();
}

/**
 * Загружает документ вручную через файловый input
 */
export async function loadDocumentManually(file: File): Promise<DocumentIndex> {
  return await documentIndexer.indexPDF(file);
}

