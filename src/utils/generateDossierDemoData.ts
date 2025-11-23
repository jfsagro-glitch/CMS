/**
 * Генерация демо-данных для залогового досье
 * Создает документы для всех сделок из портфеля с иерархией: Клиент -> Залогодатель -> Договор
 */

import * as XLSX from 'xlsx';
import type { CollateralDocument, CollateralFolder, CollateralDossierPayload } from '@/types/collateralDossier';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import type { ExtendedCollateralCard } from '@/types';
import { getDocumentSheetName } from './documentTypesMapping';

interface DocumentTemplate {
  num: number;
  name: string;
  format: string;
  legal: string;
}

/**
 * Чтение документов из Excel файла
 */
async function loadDocumentsFromExcel(): Promise<Map<string, DocumentTemplate[]>> {
  try {
    // В браузере мы не можем напрямую читать файлы, поэтому используем fetch
    const base = import.meta.env.BASE_URL ?? '/';
    const resolvedBase = new URL(base, window.location.origin);
    const normalizedPath = resolvedBase.pathname.endsWith('/')
      ? resolvedBase.pathname
      : `${resolvedBase.pathname}/`;
    const url = `${resolvedBase.origin}${normalizedPath}Documents.xlsx`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Не удалось загрузить файл документов, используем базовый набор');
      return new Map();
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const documentsMap = new Map<string, DocumentTemplate[]>();
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
      
      const documents: DocumentTemplate[] = data
        .filter(row => row[1] && typeof row[1] === 'number' && row[2])
        .map(row => ({
          num: row[1],
          name: String(row[2] || '').trim(),
          format: String(row[3] || '').trim(),
          legal: String(row[4] || '').trim(),
        }))
        .filter(doc => doc.name.length > 0);
      
      if (documents.length > 0) {
        documentsMap.set(sheetName, documents);
      }
    });
    
    return documentsMap;
  } catch (error) {
    console.error('Ошибка загрузки документов из Excel:', error);
    return new Map();
  }
}

/**
 * Генерация демо-документов для сделки
 */
function generateDocumentsForDeal(
  deal: CollateralPortfolioEntry,
  card: ExtendedCollateralCard | null,
  documentsMap: Map<string, DocumentTemplate[]>
): CollateralDocument[] {
  const documents: CollateralDocument[] = [];
  
  // Определяем тип имущества
  const propertyType = (card?.classification as any)?.propertyType || 
                      card?.mainCategory || 
                      'Транспортное средство';
  
  const sheetName = getDocumentSheetName(propertyType);
  const templates = documentsMap.get(sheetName) || [];
  
  // Если нет шаблонов, создаем базовый набор
  if (templates.length === 0) {
    const basicDocs = [
      'Договор залога',
      'Отчет об оценке',
      'Заключение юридической службы',
      'Акт осмотра',
      'Страховой полис',
    ];
    
    basicDocs.forEach((docName, index) => {
      documents.push({
        id: `doc-${deal.reference}-${index}`,
        reference: String(deal.reference),
        borrower: deal.borrower || null,
        pledger: deal.pledger || null,
        inn: deal.inn || null,
        docType: docName,
        folderId: `folder-${deal.reference}`,
        folderPath: [
          deal.borrower || 'Не указан',
          deal.pledger || 'Не указан',
          `Договор ${deal.contractNumber || deal.reference}`,
        ],
        description: `Документ по сделке ${deal.reference}`,
        status: index < 3 ? 'Загружен' : index === 3 ? 'На согласовании' : 'Требует обновления',
        statusColor: index < 3 ? 'green' : index === 3 ? 'orange' : 'red',
        fileName: `${docName}_${deal.reference}.pdf`,
        lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
        responsible: 'Иванов И.И.',
        size: `${Math.floor(Math.random() * 5000 + 100)} КБ`,
      });
    });
    
    return documents;
  }
  
  // Генерируем документы на основе шаблонов
  templates.slice(0, Math.min(10, templates.length)).forEach((template) => {
    const statuses = ['Загружен', 'На согласовании', 'Требует обновления'];
    const statusColors = ['green', 'orange', 'red'];
    const statusIndex = Math.floor(Math.random() * statuses.length);
    
    documents.push({
      id: `doc-${deal.reference}-${template.num}`,
      reference: String(deal.reference),
      borrower: deal.borrower || null,
      pledger: deal.pledger || null,
      inn: deal.inn || null,
      docType: template.name,
      folderId: `folder-${deal.reference}`,
      folderPath: [
        deal.borrower || 'Не указан',
        deal.pledger || 'Не указан',
        `Договор ${deal.contractNumber || deal.reference}`,
      ],
      description: template.format || undefined,
      status: statuses[statusIndex],
      statusColor: statusColors[statusIndex],
      fileName: `${template.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${deal.reference}.pdf`,
      lastUpdated: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
      responsible: ['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.'][Math.floor(Math.random() * 3)],
      size: `${Math.floor(Math.random() * 5000 + 100)} КБ`,
    });
  });
  
  return documents;
}

/**
 * Генерация папок на основе иерархии
 */
function generateFolders(portfolio: CollateralPortfolioEntry[]): CollateralFolder[] {
  const folders = new Map<string, CollateralFolder>();
  
  portfolio.forEach(deal => {
    const borrower = deal.borrower || 'Не указан';
    const pledger = deal.pledger || 'Не указан';
    const contract = `Договор ${deal.contractNumber || deal.reference}`;
    
    // Папка клиента
    const clientFolderId = `client-${borrower}`;
    if (!folders.has(clientFolderId)) {
      folders.set(clientFolderId, {
        id: clientFolderId,
        path: [borrower],
        description: `Документы клиента: ${borrower}`,
      });
    }
    
    // Папка залогодателя
    const pledgerFolderId = `pledger-${borrower}-${pledger}`;
    if (!folders.has(pledgerFolderId)) {
      folders.set(pledgerFolderId, {
        id: pledgerFolderId,
        path: [borrower, pledger],
        description: `Документы залогодателя: ${pledger}`,
      });
    }
    
    // Папка договора
    const contractFolderId = `contract-${deal.reference}`;
    if (!folders.has(contractFolderId)) {
      folders.set(contractFolderId, {
        id: contractFolderId,
        path: [borrower, pledger, contract],
        description: `Документы по договору: ${contract}`,
      });
    }
  });
  
  return Array.from(folders.values());
}

/**
 * Основная функция генерации демо-данных
 */
export async function generateDossierDemoData(
  portfolio: CollateralPortfolioEntry[],
  cards: ExtendedCollateralCard[]
): Promise<CollateralDossierPayload> {
  // Загружаем шаблоны документов из Excel
  const documentsMap = await loadDocumentsFromExcel();
  
  // Создаем карту карточек по reference
  const cardsMap = new Map<string, ExtendedCollateralCard>();
  cards.forEach(card => {
    if (card.characteristics?.reference) {
      cardsMap.set(String(card.characteristics.reference), card);
    }
  });
  
  // Генерируем документы для каждой сделки
  const allDocuments: CollateralDocument[] = [];
  
  portfolio.forEach(deal => {
    const card = cardsMap.get(String(deal.reference));
    const documents = generateDocumentsForDeal(deal, card || null, documentsMap);
    allDocuments.push(...documents);
  });
  
  // Генерируем папки
  const folders = generateFolders(portfolio);
  
  return {
    folders,
    documents: allDocuments,
  };
}

