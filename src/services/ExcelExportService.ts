/**
 * Excel Export Service
 * 
 * Handles exporting collateral cards and other data to Excel format
 * Supports filtering, formatting, and styling
 */

import * as XLSX from 'xlsx';
import type { ExtendedCollateralCard } from '@/types';

export interface ExportOptions {
  includePartners?: boolean;
  includeDocuments?: boolean;
  includeCharacteristics?: boolean;
  filename?: string;
}

class ExcelExportService {
  /**
   * Export collateral cards to Excel
   */
  exportCards(
    cards: ExtendedCollateralCard[],
    options: ExportOptions = {}
  ): void {
    const {
      includePartners = true,
      includeDocuments = true,
      includeCharacteristics = true,
      filename = `cards_${new Date().toISOString().split('T')[0]}.xlsx`,
    } = options;

    const workbook = XLSX.utils.book_new();
    const sheets: Record<string, any[]> = {};

    // Main cards sheet
    sheets['Карточки'] = this.formatCardsForExport(
      cards,
      includeCharacteristics
    );

    // Partners sheet
    if (includePartners) {
      const partners = cards.flatMap((card) =>
        (card.partners || []).map((p) => {
          const partnerName = p.organizationName || 
                             (p.firstName || '') + ' ' + (p.lastName || '');
          return {
            cardId: card.id,
            cardNumber: card.number,
            partnerType: p.type,
            partnerName,
            shortName: p.shortName,
            inn: p.inn,
            role: p.role,
            share: p.share ? `${p.share}%` : '',
          };
        })
      );

      if (partners.length > 0) {
        sheets['Партнеры'] = partners;
      }
    }

    // Documents sheet
    if (includeDocuments) {
      const documents = cards.flatMap((card) =>
        (card.documents || []).map((d) => ({
          cardId: card.id,
          cardNumber: card.number,
          docType: d.type,
          docNumber: d.number,
          docDate: d.date ? new Date(d.date).toLocaleDateString('ru-RU') : '',
          issuer: d.issuer,
          series: d.series,
          issuerId: d.issuerId,
          status: d.status,
        }))
      );

      if (documents.length > 0) {
        sheets['Документы'] = documents;
      }
    }

    // Add sheets to workbook
    Object.entries(sheets).forEach(([sheetName, data]) => {
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const colWidths = this.calculateColumnWidths(data);
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // Generate and download file
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Export cards with filtered columns
   */
  private formatCardsForExport(
    cards: ExtendedCollateralCard[],
    includeCharacteristics: boolean
  ): any[] {
    return cards.map((card) => {
      const row: any = {
        'ID': card.id,
        'Номер': card.number,
        'Наименование': card.name,
        'Основной класс': card.mainCategory || '',
        'Статус': card.status || '',
        'Уровень 1': card.classification?.level1 || '',
        'Уровень 2': card.classification?.level2 || '',
        'Адрес полный': card.address?.fullAddress || '',
        'Город': card.address?.city || '',
        'Регион': card.region || '',
        'Собственник': card.owner?.name || '',
        'ИНН собственника': card.owner?.inn || '',
        'Создано': card.createdAt
          ? new Date(card.createdAt).toLocaleDateString('ru-RU')
          : '',
        'Обновлено': card.updatedAt
          ? new Date(card.updatedAt).toLocaleDateString('ru-RU')
          : '',
      };

      // Add characteristics if requested
      if (includeCharacteristics && card.characteristics) {
        const chars = card.characteristics;
        if (chars.cadastralNumber)
          row['Кадастровый номер'] = chars.cadastralNumber;
        if (chars.vin) row['VIN'] = chars.vin;
        if (chars.serialNumber) row['Серийный номер'] = chars.serialNumber;
        if (chars.area) row['Площадь'] = chars.area;
        if (chars.rulesRef) row['Ссылка на правила'] = chars.rulesRef;
      }

      return row;
    });
  }

  /**
   * Calculate column widths based on content
   */
  private calculateColumnWidths(data: any[]): Array<{ wch: number }> {
    if (data.length === 0) return [];

    const headers = Object.keys(data[0]);
    const widths: number[] = [];

    headers.forEach((header) => {
      let maxWidth = header.length + 2;

      data.forEach((row) => {
        const cellValue = row[header];
        const cellWidth =
          String(cellValue || '').length + 2;
        maxWidth = Math.max(maxWidth, cellWidth);
      });

      widths.push(Math.min(maxWidth, 50)); // Cap at 50 chars
    });

    return widths.map((w) => ({ wch: w }));
  }

  /**
   * Export card details report (single card)
   */
  exportCardDetails(card: ExtendedCollateralCard, filename?: string): void {
    const workbook = XLSX.utils.book_new();

    // Main card info
    const cardData = [
      ['Позиция', 'Значение'],
      ['ID', card.id],
      ['Номер', card.number],
      ['Наименование', card.name],
      ['Статус', card.status],
      ['Основной класс', card.mainCategory],
      ['Адрес', card.address?.fullAddress],
      ['Регион', card.region],
      ['Собственник', card.owner?.name],
      ['ИНН', card.owner?.inn],
      ['Дата создания', new Date(card.createdAt).toLocaleDateString('ru-RU')],
      ['Дата обновления', new Date(card.updatedAt).toLocaleDateString('ru-RU')],
    ];

    const cardSheet = XLSX.utils.aoa_to_sheet(cardData);
    cardSheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, cardSheet, 'Карточка');

    // Partners
    if (card.partners && card.partners.length > 0) {
      const partnerData = [
        ['Тип', 'Наименование', 'ИНН', 'Роль', 'Доля'],
        ...card.partners.map((p) => {
          const partnerName = p.organizationName || 
                             (p.firstName || '') + ' ' + (p.lastName || '');
          return [
            p.type === 'individual' ? 'Физлицо' : 'Юрлицо',
            partnerName,
            p.inn || '',
            p.role,
            p.share ? `${p.share}%` : '',
          ];
        }),
      ];

      const partnerSheet = XLSX.utils.aoa_to_sheet(partnerData);
      partnerSheet['!cols'] = [
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(workbook, partnerSheet, 'Партнеры');
    }

    // Documents
    if (card.documents && card.documents.length > 0) {
      const docData = [
        ['Тип', 'Номер', 'Дата', 'Издатель', 'Статус'],
        ...card.documents.map((d) => [
          d.type,
          d.number,
          d.date ? new Date(d.date).toLocaleDateString('ru-RU') : '',
          d.issuer,
          d.status,
        ]),
      ];

      const docSheet = XLSX.utils.aoa_to_sheet(docData);
      docSheet['!cols'] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(workbook, docSheet, 'Документы');
    }

    const exportFilename =
      filename ||
      `card_${card.number}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, exportFilename);
  }
}

export default new ExcelExportService();
