/**
 * Генерация XML файла отчета по форме 0409310 ЦБ РФ
 */

import type { CollateralPortfolioEntry } from '@/types/portfolio';

interface GenerateXMLOptions {
  portfolioData: CollateralPortfolioEntry[];
  creditOrgCode?: string;
  creditOrgName?: string;
  reportDate?: string;
}

export function generateForm310XML(options: GenerateXMLOptions): string {
  const {
    portfolioData,
    creditOrgCode = '000000000',
    creditOrgName = 'Кредитная организация',
    reportDate = new Date().toISOString().split('T')[0],
  } = options;

  const guid = generateGUID();
  const ns = 'urn:cbr-ru:rep0409310:v4.0.4.5';

  // Создаем XML строку
  let xml = `<?xml version="1.0" encoding="windows-1251"?>\n`;
  xml += `<Ф0409310 xmlns="${ns}"\n`;
  xml += `\tИдентификатор="${guid}"\n`;
  xml += `\tВерсияФормата="4.0.4.5"\n`;
  xml += `\tДатаВерсииФормата="2025-04-24"\n`;
  xml += `\tВерсия="4.0.4.5"\n`;
  xml += `\tДата="${reportDate}"\n`;
  xml += `\tНомер="1"\n`;
  xml += `\tДатаВерсии="2025-04-24"\n`;
  xml += `\tДатаВерсииФормата="2025-04-24T00:00:00">\n`;

  // Кредитная организация
  xml += `\t<КредитнаяОрганизация Наименование="${escapeXML(creditOrgName)}" Код="${creditOrgCode}"/>\n`;

  // Раздел 310
  xml += `\t<Раздел310 НП="1">\n`;

  // Генерируем разделы для каждой записи (максимум 100)
  const items = portfolioData.slice(0, 100);
  for (const item of items) {
    const ref = String(item.reference || item.contractNumber || '');
    if (!ref) continue;

    // Раздел 1: Общие сведения
    xml += `\t\t<Раздел1 Раздел1_1="${ref}">\n`;
    xml += `\t\t\t<Подраздел1>\n`;
    xml += `\t\t\t\t<Раздел1_1 Раздел1.1_2="${ref}"/>\n`;
    const regDate = formatDate(item.registrationDate || item.collateralContractDate);
    xml += `\t\t\t\t<Раздел1.1 Раздел1.1_3="${regDate}" Раздел1.1_4="${escapeXML(String(item.collateralType || '-'))}"/>\n`;
    if (item.collateralReference) {
      xml += `\t\t\t\t<Раздел1.2 Раздел1.2_2="${item.collateralReference}"/>\n`;
    }
    if (item.lastMonitoringDate && item.lastMonitoringDate !== '-') {
      xml += `\t\t\t\t<Раздел1.3 Раздел1.3_2="${formatDate(item.lastMonitoringDate)}"/>\n`;
    }
    xml += `\t\t\t</Подраздел1>\n`;
    if (item.closeDate && item.closeDate !== '-') {
      xml += `\t\t\t<Раздел1.4 Раздел1.4_2="${formatDate(item.closeDate)}"/>\n`;
    }
    xml += `\t\t</Раздел1>\n`;

    // Раздел 2: Финансовые показатели
    const contractDate = formatDate(item.contractDate);
    xml += `\t\t<Раздел2\n`;
    xml += `\t\t\tРаздел2_1="${ref}"\n`;
    xml += `\t\t\tРаздел2_2="${escapeXML(String(item.contractNumber || ''))}"\n`;
    xml += `\t\t\tРаздел2_3="${formatDecimal(item.debtRub || 0)}"\n`;
    xml += `\t\t\tРаздел2_4="${contractDate}"\n`;
    xml += `\t\t\tРаздел2_5="${formatDecimal(item.overdueInterest || 0)}"\n`;
    xml += `\t\t\tРаздел2_6="${contractDate}"\n`;
    xml += `\t\t\tРаздел2_7="${formatDecimal(item.overduePrincipal || 0)}"\n`;
    xml += `\t\t\tРаздел2_8="${contractDate}"\n`;
    xml += `\t\t\tРаздел2_9="${formatDecimal(item.overdueInterest || 0)}"\n`;
    xml += `\t\t\tРаздел2_10="${contractDate}"\n`;
    xml += `\t\t\tРаздел2_11="${formatDecimal(item.limitRub || 0)}"\n`;
    xml += `\t\t\tРаздел2_12="${contractDate}"\n`;
    xml += `\t\t\tРаздел2_13="0.00"\n`;
    xml += `\t\t\tРаздел2_14="${contractDate}"/>\n`;

    // Раздел 3: Оценка обеспечения
    xml += `\t\t<Раздел3\n`;
    xml += `\t\t\tРаздел3_1="${ref}"\n`;
    xml += `\t\t\tРаздел3_2="${escapeXML(String(item.collateralLocation || ''))}"\n`;
    xml += `\t\t\tРаздел3_3="${escapeXML(String(item.collateralType || ''))}"\n`;
    xml += `\t\t\tРаздел3_4="${escapeXML(String(item.collateralCategory || ''))}"\n`;
    xml += `\t\t\tРаздел3_5="310310"\n`;
    xml += `\t\t\tРаздел3_6="${escapeXML(String(item.collateralInfo || ''))}"\n`;
    xml += `\t\t\tРаздел3_7="${escapeXML(String(item.collateralPurpose || ''))}"\n`;
    xml += `\t\t\tРаздел3_8="${escapeXML(String(item.qualityCategory || ''))}"\n`;
    xml += `\t\t\tРаздел3_9="${escapeXML(String(item.liquidity || ''))}"\n`;
    xml += `\t\t\tРаздел3_10="${escapeXML(String(item.collateralValue || 0))}"\n`;
    xml += `\t\t\tРаздел3_11="${formatDecimal(item.marketValue || item.currentMarketValue || 0)}"/>\n`;

    // Раздел 4: Детализация по типам обеспечения
    const collateralType = String(item.collateralType || '').toLowerCase();
    xml += `\t\t<Раздел4 Раздел4_1="${ref}">\n`;

    if (collateralType.includes('недвиж') || collateralType.includes('зем') || collateralType.includes('здание')) {
      // 4.1 - Недвижимость
      xml += `\t\t\t<Раздел4.1\n`;
      xml += `\t\t\t\tРаздел4.1_2="${escapeXML(String(item.collateralLocation || ''))}"\n`;
      xml += `\t\t\t\tРаздел4.1_3="${formatDate(item.registrationDate || item.collateralContractDate)}"\n`;
      xml += `\t\t\t\tРаздел4.1_4="${formatDate(item.initialValuationDate)}"\n`;
      xml += `\t\t\t\tРаздел4.1_5="${String(item.collateralReference || '')}"\n`;
      xml += `\t\t\t\tРаздел4.1_6="${formatDate(item.currentValuationDate)}"/>\n`;
    } else if (collateralType.includes('транспорт') || collateralType.includes('авто')) {
      // 4.3 - Транспортные средства
      xml += `\t\t\t<Раздел4.3\n`;
      xml += `\t\t\t\tРаздел4.3_2="${formatDate(item.registrationDate || item.collateralContractDate)}"\n`;
      xml += `\t\t\t\tРаздел4.3_3="${escapeXML(String(item.collateralInfo || ''))}"\n`;
      xml += `\t\t\t\tРаздел4.3_4="${escapeXML(String(item.collateralLocation || ''))}"\n`;
      xml += `\t\t\t\tРаздел4.3_5="2024"\n`;
      xml += `\t\t\t\tРаздел4.3_6="${escapeXML(String(item.collateralInfo || ''))}"\n`;
      xml += `\t\t\t\tРаздел4.3_7="${escapeXML(String(item.collateralInfo || ''))}"\n`;
      xml += `\t\t\t\tРаздел4.3_8="${escapeXML(String(item.collateralInfo || ''))}"/>\n`;
    }

    xml += `\t\t</Раздел4>\n`;

    // Раздел 5: Информация о залогодателях
    const pledger = item.pledger || item.borrower || '';
    if (pledger) {
      xml += `\t\t<Раздел5 Раздел5_1="${ref}">\n`;
      xml += `\t\t\t<Раздел5.1\n`;
      xml += `\t\t\t\tРаздел5.1_2="${escapeXML(String(item.collateralLocation || ''))}"\n`;
      xml += `\t\t\t\tРаздел5.1_3="${escapeXML(pledger)}"\n`;
      xml += `\t\t\t\tРаздел5.1_4="${escapeXML(pledger)}"\n`;
      xml += `\t\t\t\tРаздел5.1_5=""\n`;
      xml += `\t\t\t\tРаздел5.1_6=""\n`;
      xml += `\t\t\t\tРаздел5.1_7=""\n`;
      xml += `\t\t\t\tРаздел5.1_8="${String(item.inn || '')}"\n`;
      xml += `\t\t\t\tРаздел5.1_9=""/>\n`;
      xml += `\t\t</Раздел5>\n`;
    }
  }

  xml += `\t</Раздел310>\n`;
  xml += `</Ф0409310>`;

  return xml;
}

function escapeXML(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(value: string | null | undefined): string {
  if (!value || value === '-') {
    return new Date().toISOString().split('T')[0];
  }
  try {
    const str = String(value).trim();
    
    // Если уже в формате YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    
    // Пробуем распарсить DD.MM.YYYY или DD/MM/YYYY
    const parts = str.split(/[.\/-]/);
    if (parts.length === 3) {
      const [part1, part2, part3] = parts;
      
      // Определяем формат: если первая часть 4 цифры - это год
      if (part1.length === 4) {
        // YYYY-MM-DD или YYYY/MM/DD
        return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
      } else {
        // DD.MM.YYYY или DD/MM/YYYY
        return `${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
      }
    }
    
    return new Date().toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function formatDecimal(value: number | string | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '0.00';
  try {
    const num = typeof value === 'string' ? parseFloat(value.replace(/\s/g, '').replace(',', '.')) : Number(value);
    return num.toFixed(decimals);
  } catch {
    return '0.00';
  }
}

function generateGUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function downloadXML(xmlContent: string, filename: string): void {
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=windows-1251' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

