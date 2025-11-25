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
    const response = await fetch('/VND/[Volhin_N.A.]_Zalogovik._Vse_o_bankovskih_zalogah_(b-ok.org).pdf');
    
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
    }
  } catch (error) {
    console.error('Ошибка загрузки документов VND:', error);
  }

  return documentIndexer.getIndexedDocuments();
}

/**
 * Загружает документ вручную через файловый input
 */
export async function loadDocumentManually(file: File): Promise<DocumentIndex> {
  return await documentIndexer.indexPDF(file);
}

