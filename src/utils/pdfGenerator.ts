/**
 * Утилита для генерации PDF акта осмотра
 */

import type { Inspection } from '@/types/inspection';
import type { ExtendedCollateralCard } from '@/types';
import dayjs from 'dayjs';

/**
 * Определяет тип приложения на основе типа имущества
 */
function getAttachmentType(card?: ExtendedCollateralCard): string {
  if (!card) return 'default';
  
  const mainCategory = card.mainCategory;
  const level0 = (card.classification as any)?.level0 || (card.classification as any)?.hierarchy?.level0 || '';
  const level1 = (card.classification as any)?.level1 || (card.classification as any)?.hierarchy?.level1 || '';
  const propertyType = (card as any).propertyType || '';
  
  // Недвижимость
  if (mainCategory === 'real_estate') {
    if (level0?.includes('Жилая') || level0?.includes('жилая')) {
      return 'residential_real_estate';
    }
    if (level0?.includes('Коммерческая') || level0?.includes('коммерческая')) {
      return 'commercial_real_estate';
    }
    return 'real_estate';
  }
  
  // Движимое имущество
  if (mainCategory === 'movable') {
    const lowerLevel1 = level1?.toLowerCase() || '';
    const lowerPropertyType = propertyType?.toLowerCase() || '';
    
    if (lowerLevel1.includes('автомобиль') || lowerLevel1.includes('транспорт') || 
        lowerPropertyType.includes('автомобиль') || lowerPropertyType.includes('транспорт')) {
      return 'vehicle';
    }
    if (lowerLevel1.includes('оборудование') || lowerPropertyType.includes('оборудование')) {
      return 'equipment';
    }
    if (lowerLevel1.includes('судно') || lowerLevel1.includes('морск') || lowerLevel1.includes('речн') ||
        lowerPropertyType.includes('судно') || lowerPropertyType.includes('морск') || lowerPropertyType.includes('речн')) {
      return 'vessel';
    }
    if (lowerLevel1.includes('воздушн') || lowerLevel1.includes('самолет') || lowerLevel1.includes('вертолет') ||
        lowerPropertyType.includes('воздушн') || lowerPropertyType.includes('самолет') || lowerPropertyType.includes('вертолет')) {
      return 'aircraft';
    }
    if (lowerLevel1.includes('железнодорожн') || lowerLevel1.includes('вагон') || lowerLevel1.includes('локомотив') ||
        lowerPropertyType.includes('железнодорожн') || lowerPropertyType.includes('вагон') || lowerPropertyType.includes('локомотив')) {
      return 'railway';
    }
    if (lowerLevel1.includes('самоходн') || lowerLevel1.includes('техника') ||
        lowerPropertyType.includes('самоходн') || lowerPropertyType.includes('техника')) {
      return 'self_propelled';
    }
    if (lowerLevel1.includes('тмц') || lowerLevel1.includes('товар') || lowerLevel1.includes('материал') ||
        lowerPropertyType.includes('тмц') || lowerPropertyType.includes('товар') || lowerPropertyType.includes('материал')) {
      return 'inventory';
    }
    return 'equipment';
  }
  
  // Имущественные права
  if (mainCategory === 'property_rights') {
    const lowerLevel1 = level1?.toLowerCase() || '';
    const lowerPropertyType = propertyType?.toLowerCase() || '';
    
    if (lowerLevel1.includes('дол') || lowerLevel1.includes('ук') || 
        lowerPropertyType.includes('дол') || lowerPropertyType.includes('ук')) {
      return 'shares';
    }
    if (lowerLevel1.includes('товарн') || lowerLevel1.includes('знак') || 
        lowerPropertyType.includes('товарн') || lowerPropertyType.includes('знак')) {
      return 'trademark';
    }
    return 'property_rights';
  }
  
  return 'default';
}

/**
 * Генерирует приложение к акту осмотра в зависимости от типа имущества
 */
function generateInspectionAttachment(card?: ExtendedCollateralCard, inspection?: Inspection): string {
  if (!card) return '';
  
  const attachmentType = getAttachmentType(card);
  
  switch (attachmentType) {
    case 'residential_real_estate':
      return generateResidentialRealEstateAttachment(card, inspection);
    case 'commercial_real_estate':
      return generateCommercialRealEstateAttachment(card, inspection);
    case 'vehicle':
      return generateVehicleAttachment(card, inspection);
    case 'equipment':
      return generateEquipmentAttachment(card, inspection);
    case 'vessel':
      return generateVesselAttachment(card, inspection);
    case 'aircraft':
      return generateAircraftAttachment(card, inspection);
    case 'railway':
      return generateRailwayAttachment(card, inspection);
    case 'self_propelled':
      return generateSelfPropelledAttachment(card, inspection);
    case 'inventory':
      return generateInventoryAttachment(card, inspection);
    case 'shares':
      return generateSharesAttachment(card, inspection);
    case 'trademark':
      return generateTrademarkAttachment(card, inspection);
    default:
      return '';
  }
}

export const generateInspectionPDF = (
  inspection: Inspection,
  collateralCard?: ExtendedCollateralCard
): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Не удалось открыть окно для печати. Разрешите всплывающие окна.');
    return;
  }

  // Получаем данные о залогодателе и заемщике
  const pledgor = collateralCard?.partners?.find(p => p.role === 'pledgor');
  const borrower = collateralCard?.partners?.find(p => p.role === 'owner');
  
  const pledgorName = pledgor
    ? pledgor.type === 'legal'
      ? pledgor.organizationName || ''
      : `${pledgor.lastName || ''} ${pledgor.firstName || ''} ${pledgor.middleName || ''}`.trim()
    : '';
  
  const borrowerName = borrower
    ? borrower.type === 'legal'
      ? borrower.organizationName || ''
      : `${borrower.lastName || ''} ${borrower.firstName || ''} ${borrower.middleName || ''}`.trim()
    : '';

  // Получаем данные о договорах из карточки
  const pledgeContractNumber = collateralCard?.pledgeContractId || collateralCard?.characteristics?.pledgeContractNumber || '';
  const pledgeContractDate = collateralCard?.characteristics?.pledgeContractDate || '';
  const loanContractNumber = collateralCard?.loanContractId || collateralCard?.characteristics?.loanContractNumber || '';
  const loanContractDate = collateralCard?.characteristics?.loanContractDate || '';

  // Используем поля из формы акта, если они есть
  const inspectionMethod = inspection.inspectionMethod || 'Визуальный осмотр';
  const inspectionTypeLabel = inspection.inspectionType === 'primary' ? 'Первичный осмотр'
    : inspection.inspectionType === 'periodic' ? 'Периодический осмотр'
    : inspection.inspectionType === 'monitoring' ? 'Мониторинг'
    : inspection.inspectionType === 'unscheduled' ? 'Внеплановый осмотр'
    : 'Выборочный осмотр';

  // Используем поля из формы акта
  const presenceText = inspection.propertyPresence || 
    (inspection.condition !== 'critical' 
      ? 'Наличие имущества подтверждается'
      : 'Наличие имущества не подтверждается');

  const conditionText = inspection.propertyCondition || 
    (inspection.condition === 'excellent' ? 'Имущество в отличном состоянии'
      : inspection.condition === 'good' ? 'Имущество в хорошем состоянии'
      : inspection.condition === 'satisfactory' ? 'Имущество в удовлетворительном состоянии'
      : inspection.condition === 'poor' ? 'Имущество в плохом состоянии'
      : 'Имущество в критическом состоянии');

  const storageConditionsText = inspection.storageConditions || 
    inspection.overallCondition || 
    'Условия хранения/эксплуатации частично соблюдаются (уточнения в Приложении 1)';

  const conclusionsText = inspection.conclusions || 
    inspection.notes || 
    (inspection.condition === 'critical' 
      ? 'Предлагаемое в залог имущество не возможно рассмотреть в качестве обеспечения'
      : 'Имущество соответствует требованиям для принятия в залог');

  const proposalsText = inspection.proposals || 
    (inspection.recommendations && inspection.recommendations.length > 0
      ? inspection.recommendations.map(r => r.description).join('; ')
      : '-');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Акт проверки наличия и состояния залога ${inspection.id}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 2cm;
          }
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header .number {
          text-align: right;
          margin-bottom: 10px;
          font-size: 12pt;
        }
        .header h1 {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .header .subtitle {
          font-size: 12pt;
          margin-bottom: 20px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-row {
          margin-bottom: 15px;
          display: flex;
          align-items: flex-start;
        }
        .section-label {
          font-weight: bold;
          min-width: 300px;
          margin-right: 10px;
        }
        .section-value {
          flex: 1;
        }
        .contract-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 15px 0;
        }
        .contract-block {
          border: 1px solid #000;
          padding: 10px;
        }
        .contract-block .label {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .info-table td {
          padding: 8px 10px;
          border: 1px solid #000;
          vertical-align: top;
        }
        .info-table td:first-child {
          font-weight: bold;
          width: 40%;
          background-color: #f0f0f0;
        }
        .info-table thead td {
          font-weight: bold;
          background-color: #e8e8e8;
          text-align: center;
          vertical-align: middle;
        }
        .info-table tbody td {
          vertical-align: top;
        }
        .attachment-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 9pt;
        }
        .attachment-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          vertical-align: top;
        }
        .attachment-table thead td {
          font-weight: bold;
          background-color: #e8e8e8;
          text-align: center;
          vertical-align: middle;
        }
        .photos-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin: 15px 0;
        }
        .photo-item {
          border: 1px solid #000;
          padding: 5px;
          text-align: center;
        }
        .photo-item img {
          max-width: 100%;
          height: auto;
          max-height: 200px;
        }
        .photo-item .photo-desc {
          font-size: 10pt;
          margin-top: 5px;
        }
        .signatures {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .signature-block {
          text-align: left;
        }
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 50px;
          padding-top: 5px;
          min-height: 60px;
        }
        .footer {
          margin-top: 30px;
          font-size: 9pt;
          text-align: left;
          color: #666;
          line-height: 1.4;
        }
        .underline {
          border-bottom: 1px solid #000;
          display: inline-block;
          min-width: 200px;
          margin: 0 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="number">№ <span class="underline">${inspection.id}</span></div>
        <h1>Акт*</h1>
        <div class="subtitle">проверки наличия и состояния залога</div>
      </div>

      <div class="section">
        <div class="section-row">
          <div class="section-label">Наименование Залогодателя</div>
          <div class="section-value">${pledgorName || '________________'}</div>
        </div>
        <div class="section-row">
          <div class="section-label">Наименование Заемщика</div>
          <div class="section-value">${borrowerName || '________________'}</div>
        </div>
      </div>

      <div class="section">
        <p>Проведена проверка состояния принятого обеспечения по договору залога: 
        <span class="underline">${pledgeContractNumber || ''}</span> 
        оформленного в обеспечение кредитного договора: 
        <span class="underline">${loanContractNumber || ''}</span></p>
        
        <div class="contract-info">
          <div class="contract-block">
            <div class="label">Договор залога</div>
            <div>Номер: ${pledgeContractNumber || '________________'}</div>
            <div>Дата: ${pledgeContractDate ? dayjs(pledgeContractDate).format('DD.MM.YYYY') : '________________'}</div>
          </div>
          <div class="contract-block">
            <div class="label">Кредитный договор</div>
            <div>Номер: ${loanContractNumber || '________________'}</div>
            <div>Дата: ${loanContractDate ? dayjs(loanContractDate).format('DD.MM.YYYY') : '________________'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-row">
          <div class="section-label">Способ проверки:</div>
          <div class="section-value">${inspectionMethod}</div>
        </div>
        <div class="section-row">
          <div class="section-label">Тип осмотра:</div>
          <div class="section-value">${inspectionTypeLabel}</div>
        </div>
      </div>

      <div class="section">
        <p><em>К Акту Проверки прикладывается Приложение 1 с описанием осматриваемого имущества</em></p>
        <p style="font-size: 10pt; color: #666; margin-top: 5px;">
          Приложения к актам осмотра могут дополняться/изменяться и не требуют дополнительного согласования
        </p>
      </div>

      <div class="section">
        <table class="info-table">
          <tr>
            <td>Наличие заложенного имущества</td>
            <td>${presenceText}</td>
          </tr>
          <tr>
            <td>Состояние заложенного имущества</td>
            <td>${conditionText}. ${inspection.overallCondition || 'Имущество в сохранности, перепланировок/переоборудований не выявлено, эксплуатируется по назначению'}</td>
          </tr>
          <tr>
            <td>Соответствие условий хранения/эксплуатации заложенного имущества</td>
            <td>${storageConditionsText}</td>
          </tr>
          <tr>
            <td>Выводы</td>
            <td>${conclusionsText}</td>
          </tr>
          <tr>
            <td>Предложения</td>
            <td>${proposalsText}</td>
          </tr>
        </table>
      </div>

      ${inspection.photos && inspection.photos.length > 0 ? `
      <div class="section">
        <div style="font-weight: bold; margin-bottom: 10px;">Приложение 1. Фотографии осматриваемого имущества (${inspection.photos.length})</div>
        <div class="photos-grid">
          ${inspection.photos.map((photo, index) => `
            <div class="photo-item">
              <img src="${photo.url}" alt="Фото ${index + 1}" />
              <div class="photo-desc">
                ${photo.location || photo.step || `Фото ${index + 1}`}
                ${photo.description ? `<br>${photo.description}` : ''}
                ${photo.takenAt ? `<br>${dayjs(photo.takenAt).format('DD.MM.YYYY HH:mm')}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${generateInspectionAttachment(collateralCard, inspection)}

      ${inspection.defects && inspection.defects.length > 0 ? `
      <div class="section">
        <div style="font-weight: bold; margin-bottom: 10px;">Приложение 2. Выявленные дефекты</div>
        <table class="info-table">
          ${inspection.defects.map((defect, index) => `
            <tr>
              <td>Дефект ${index + 1}</td>
              <td>${defect.description} (${defect.severity})${defect.location ? `, Местоположение: ${defect.location}` : ''}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-row">
          <div class="section-label">Дата проведения проверки</div>
          <div class="section-value">${dayjs(inspection.inspectionDate).format('DD.MM.YYYY')}</div>
        </div>
      </div>

      <div class="signatures">
        <div class="signature-block">
          <div class="signature-line">
            Сотрудник проводивший осмотр<br>
            ${inspection.inspectorName || '________________'}<br>
            ${inspection.inspectorPosition ? `${inspection.inspectorPosition}` : ''}
          </div>
        </div>
        <div class="signature-block">
          <div class="signature-line">
            Руководитель/заместитель руководителя<br>
            ${inspection.approvedBy || '________________'}<br>
            ${inspection.approvedAt ? dayjs(inspection.approvedAt).format('DD.MM.YYYY') : ''}
          </div>
        </div>
      </div>

      <div class="footer">
        <p>*Акт осмотра составляется в электронном виде, подписывается ЭЦП работника, осуществившим осмотр и его руководителем подразделения. Актуализация данной формы и приложений к ней может проводиться без внесения изменений в настоящее Положение по согласованию с Директором/заместителем директора департамента управления рисками.</p>
        <p style="margin-top: 10px;">Документ сгенерирован автоматически ${dayjs().format('DD.MM.YYYY HH:mm')}</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Генерирует приложение для жилой недвижимости
 */
function generateResidentialRealEstateAttachment(card: ExtendedCollateralCard, _inspection?: Inspection): string {
  const chars = card.characteristics || {};
  const address = card.address || {};
  const cadastralNumber = address.cadastralNumber || chars.cadastralNumber || '';
  const totalArea = chars.totalAreaSqm || chars.totalArea || '';
  const buildYear = chars.buildYear || chars.yearOfConstruction || '';
  const wallMaterial = chars.wallMaterial || '';
  const floorMaterial = chars.floorMaterial || chars.overlapMaterial || '';
  const buildingCondition = chars.buildingCondition || chars.condition || '';
  const finishLevel = chars.finishLevel || chars.finishingLevel || '';
  const finishCondition = chars.finishCondition || '';
  const bookValue = chars.bookValue || chars.balanceValue || 0;
  
  return `
    <div class="section" style="page-break-before: always;">
      <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">
        Приложение к акту осмотра (Жилая недвижимость)
      </div>
      <table class="attachment-table">
        <thead>
          <tr>
            <td style="text-align: center; font-weight: bold;">№ п/п</td>
            <td style="text-align: center; font-weight: bold;">№ В ЗМ</td>
            <td style="text-align: center; font-weight: bold;">Наименование объекта</td>
            <td style="text-align: center; font-weight: bold;">Адрес местоположения</td>
            <td style="text-align: center; font-weight: bold;">Общая площадь объекта, кв. м.<br><span style="color: red; font-size: 9pt;">Только цифры</span></td>
            <td style="text-align: center; font-weight: bold;">Кадастровый номер объекта</td>
            <td style="text-align: center; font-weight: bold;">Балансовая стоимость на последнюю отчетную дату, руб. без учета НДС<br><span style="color: red; font-size: 9pt;">Только цифры</span></td>
            <td style="text-align: center; font-weight: bold;">Год строительства</td>
            <td style="text-align: center; font-weight: bold;">Материал стен</td>
            <td style="text-align: center; font-weight: bold;">Материал перекрытий</td>
            <td style="text-align: center; font-weight: bold;">Состояние конструктивных элементов здания</td>
            <td style="text-align: center; font-weight: bold;">Уровень отделки</td>
            <td style="text-align: center; font-weight: bold;">Состояние отделки</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td></td>
            <td>${card.name || ''}</td>
            <td>${address.fullAddress || ''}</td>
            <td style="text-align: right;">${totalArea || ''}</td>
            <td>${cadastralNumber || ''}</td>
            <td style="text-align: right;">${bookValue ? bookValue.toLocaleString('ru-RU') : '0.00'}</td>
            <td style="text-align: center;">${buildYear || ''}</td>
            <td>${wallMaterial || ''}</td>
            <td>${floorMaterial || ''}</td>
            <td>${buildingCondition || ''}</td>
            <td>${finishLevel || ''}</td>
            <td>${finishCondition || ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Генерирует приложение для коммерческой недвижимости
 */
function generateCommercialRealEstateAttachment(card: ExtendedCollateralCard, _inspection?: Inspection): string {
  const chars = card.characteristics || {};
  const address = card.address || {};
  const cadastralNumber = address.cadastralNumber || chars.cadastralNumber || '';
  const totalArea = chars.totalAreaSqm || chars.totalArea || '';
  const buildYear = chars.buildYear || chars.yearOfConstruction || '';
  const wallMaterial = chars.wallMaterial || '';
  const floorMaterial = chars.floorMaterial || chars.overlapMaterial || '';
  const buildingCondition = chars.buildingCondition || chars.condition || '';
  const finishLevel = chars.finishLevel || chars.finishingLevel || '';
  const finishCondition = chars.finishCondition || '';
  const bookValue = chars.bookValue || chars.balanceValue || 0;
  const level1 = (card.classification as any)?.level1 || (card.classification as any)?.hierarchy?.level1 || '';
  const level2 = (card.classification as any)?.level2 || (card.classification as any)?.hierarchy?.level2 || '';
  
  const objectName = card.name || `${level1}, назначение: нежилое ${level2?.toLowerCase() || 'здание'}, площадь: ${totalArea || ''} кв.м.`;
  
  return `
    <div class="section" style="page-break-before: always;">
      <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">
        Приложение к акту осмотра (Коммерческая недвижимость)
      </div>
      <table class="attachment-table">
        <thead>
          <tr>
            <td style="text-align: center; font-weight: bold;">№ п/п</td>
            <td style="text-align: center; font-weight: bold;">№ В ЗМ</td>
            <td style="text-align: center; font-weight: bold;">Наименование объекта</td>
            <td style="text-align: center; font-weight: bold;">Адрес местоположения</td>
            <td style="text-align: center; font-weight: bold;">Общая площадь объекта, кв. м.<br><span style="color: red; font-size: 9pt;">Только цифры</span></td>
            <td style="text-align: center; font-weight: bold;">Кадастровый номер объекта</td>
            <td style="text-align: center; font-weight: bold;">Балансовая стоимость на последнюю отчетную дату, руб. без учета НДС<br><span style="color: red; font-size: 9pt;">Только цифры</span></td>
            <td style="text-align: center; font-weight: bold;">Год строительства</td>
            <td style="text-align: center; font-weight: bold;">Материал стен</td>
            <td style="text-align: center; font-weight: bold;">Материал перекрытий</td>
            <td style="text-align: center; font-weight: bold;">Состояние конструктивных элементов здания</td>
            <td style="text-align: center; font-weight: bold;">Уровень отделки</td>
            <td style="text-align: center; font-weight: bold;">Состояние отделки</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td></td>
            <td>${objectName}</td>
            <td>${address.fullAddress || ''}</td>
            <td style="text-align: right;">${totalArea || ''}</td>
            <td>${cadastralNumber || ''}</td>
            <td style="text-align: right;">${bookValue ? bookValue.toLocaleString('ru-RU') : '0.00'}</td>
            <td style="text-align: center;">${buildYear || ''}</td>
            <td>${wallMaterial || ''}</td>
            <td>${floorMaterial || ''}</td>
            <td>${buildingCondition || ''}</td>
            <td>${finishLevel || ''}</td>
            <td>${finishCondition || ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Генерирует приложение для автотранспорта
 */
function generateVehicleAttachment(card: ExtendedCollateralCard, _inspection?: Inspection): string {
  const chars = card.characteristics || {};
  const address = card.address || {};
  const make = chars.make || chars.brand || '';
  const model = chars.model || '';
  const vin = chars.vin || chars.identificationNumber || '';
  const chassisNumber = chars.chassisNumber || '';
  const bodyNumber = chars.bodyNumber || '';
  const color = chars.color || '';
  const year = chars.year || chars.yearOfManufacture || '';
  const inventoryNumber = chars.inventoryNumber || '';
  const registrationNumber = chars.registrationNumber || chars.licensePlate || '';
  
  return `
    <div class="section" style="page-break-before: always;">
      <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">
        Приложение к акту осмотра (автотранспорт)
      </div>
      <table class="attachment-table">
        <thead>
          <tr>
            <td style="text-align: center; font-weight: bold;">№п/п</td>
            <td style="text-align: center; font-weight: bold;">№ В ЗМ</td>
            <td style="text-align: center; font-weight: bold;">Наименование</td>
            <td style="text-align: center; font-weight: bold;">Марка</td>
            <td style="text-align: center; font-weight: bold;">Модель ТС</td>
            <td style="text-align: center; font-weight: bold;">Идентификационный номер (VIN)</td>
            <td style="text-align: center; font-weight: bold;">Номер шасси</td>
            <td style="text-align: center; font-weight: bold;">Номер кузова</td>
            <td style="text-align: center; font-weight: bold;">Цвет</td>
            <td style="text-align: center; font-weight: bold;">Год выпуска</td>
            <td style="text-align: center; font-weight: bold;">инвентарный номер</td>
            <td style="text-align: center; font-weight: bold;">Регистрационный знак</td>
            <td style="text-align: center; font-weight: bold;">Адрес местоположения</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td></td>
            <td>${card.name || ''}</td>
            <td>${make}</td>
            <td>${model}</td>
            <td>${vin}</td>
            <td>${chassisNumber}</td>
            <td>${bodyNumber}</td>
            <td>${color}</td>
            <td style="text-align: center;">${year}</td>
            <td>${inventoryNumber}</td>
            <td>${registrationNumber}</td>
            <td>${address.fullAddress || ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Генерирует приложение для оборудования
 */
function generateEquipmentAttachment(card: ExtendedCollateralCard, _inspection?: Inspection): string {
  const chars = card.characteristics || {};
  const address = card.address || {};
  const make = chars.make || chars.brand || '';
  const model = chars.model || '';
  const serialNumber = chars.serialNumber || chars.factoryNumber || '';
  const year = chars.year || chars.yearOfManufacture || '';
  const manufacturer = chars.manufacturer || '';
  const country = chars.country || chars.manufacturerCountry || '';
  const inventoryNumber = chars.inventoryNumber || '';
  const bookValue = chars.bookValue || chars.balanceValue || chars.residualValue || 0;
  const additionalCharacteristics = chars.additionalCharacteristics || '';
  
  return `
    <div class="section" style="page-break-before: always;">
      <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">
        Приложение к акту осмотра (оборудование)
      </div>
      <table class="attachment-table">
        <thead>
          <tr>
            <td style="text-align: center; font-weight: bold;">№п/п</td>
            <td style="text-align: center; font-weight: bold;">№ В ЗМ</td>
            <td style="text-align: center; font-weight: bold;">Наименование</td>
            <td style="text-align: center; font-weight: bold;">Марка</td>
            <td style="text-align: center; font-weight: bold;">Модель</td>
            <td style="text-align: center; font-weight: bold;">Заводской номер</td>
            <td style="text-align: center; font-weight: bold;">Год выпуска</td>
            <td style="text-align: center; font-weight: bold;">Страна - изготовитель</td>
            <td style="text-align: center; font-weight: bold;">Производитель</td>
            <td style="text-align: center; font-weight: bold;">Инвентарный номер</td>
            <td style="text-align: center; font-weight: bold;">Адрес местоположения</td>
            <td style="text-align: center; font-weight: bold;">Остаточная балансовая стоимость, руб.</td>
            <td style="text-align: center; font-weight: bold;">Дополнительные характеристики</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td></td>
            <td>${card.name || ''}</td>
            <td>${make}</td>
            <td>${model}</td>
            <td>${serialNumber}</td>
            <td style="text-align: center;">${year}</td>
            <td>${country}</td>
            <td>${manufacturer}</td>
            <td>${inventoryNumber}</td>
            <td>${address.fullAddress || ''}</td>
            <td style="text-align: right;">${bookValue ? bookValue.toLocaleString('ru-RU') : '0.00'}</td>
            <td>${additionalCharacteristics}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Генерирует приложение для морских/речных судов
 */
function generateVesselAttachment(card: ExtendedCollateralCard, inspection?: Inspection): string {
  const chars = card.characteristics || {};
  const vesselName = chars.vesselName || card.name || '';
  const imo = chars.imo || '';
  const vesselType = chars.vesselType || '';
  const callSign = chars.callSign || '';
  const portOfRegistration = chars.portOfRegistration || '';
  const placeOfConstruction = chars.placeOfConstruction || '';
  const yearOfConstruction = chars.yearOfConstruction || '';
  const hullMaterial = chars.hullMaterial || '';
  const enginesCount = chars.enginesCount || '';
  const enginesPower = chars.enginesPower || '';
  const length = chars.length || '';
  const width = chars.width || '';
  const boardHeight = chars.boardHeight || '';
  const grossTonnage = chars.grossTonnage || '';
  const netTonnage = chars.netTonnage || '';
  const deadweight = chars.deadweight || '';
  const vesselClass = chars.vesselClass || '';
  const identificationConfirmed = inspection?.propertyPresence === 'Наличие имущества подтверждается' ? 'Подтверждена' : '';
  
  const vesselDescription = `Судно "${vesselName}", ИМО ${imo}. Тип судна: ${vesselType}. Позывной сигнал: ${callSign}. Морской порт регистрации: ${portOfRegistration}. Место и год постройки: ${placeOfConstruction}, ${yearOfConstruction}. Главный материал корпуса: ${hullMaterial}. Число и мощность главных двигателей: ${enginesCount}, ${enginesPower} кВт. Главные размерения: Длина ${length} м. Ширина ${width} м. Высота борта ${boardHeight} м. Вместимость валовая ${grossTonnage}. Вместимость чистая ${netTonnage}. Дедвейт ${deadweight} р.т. Класс судна: ${vesselClass}.`;
  
  return `
    <div class="section" style="page-break-before: always;">
      <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">
        Приложение к акту осмотра (морские/речные суда)
      </div>
      <table class="attachment-table">
        <thead>
          <tr>
            <td style="text-align: center; font-weight: bold;">№ п/п</td>
            <td style="text-align: center; font-weight: bold;">№ В ЗМ</td>
            <td style="text-align: center; font-weight: bold;">Наименование объекта</td>
            <td style="text-align: center; font-weight: bold;">Состояние имущества</td>
            <td style="text-align: center; font-weight: bold;">Наличие обременений</td>
            <td style="text-align: center; font-weight: bold;">Идентификация подтверждена/не подтверждена/выявленные разночтения</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td></td>
            <td>${vesselDescription}</td>
            <td>${inspection?.propertyCondition || ''}</td>
            <td></td>
            <td style="background-color: ${identificationConfirmed ? '#ffff00' : 'transparent'};">${identificationConfirmed || ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Генерирует приложение для воздушных судов
 */
function generateAircraftAttachment(card: ExtendedCollateralCard, inspection?: Inspection): string {
  const chars = card.characteristics || {};
  const address = card.address || {};
  const aircraftType = chars.aircraftType || card.name || '';
  const serialNumber = chars.serialNumber || chars.factoryNumber || '';
  const gliderNumber = chars.gliderNumber || '';
  const year = chars.year || chars.yearOfManufacture || '';
  const manufacturer = chars.manufacturer || '';
  const model = chars.model || '';
  const operatingHours = chars.operatingHours || chars.flightHours || '';
  const operabilityConfirmed = inspection?.propertyPresence === 'Наличие имущества подтверждается' ? 'Подтверждена' : '';
  const damagePresence = inspection?.propertyCondition || '';
  const identificationConfirmed = operabilityConfirmed;
  
  return `
    <div class="section" style="page-break-before: always;">
      <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">
        Приложение к акту осмотра (воздушное судно)
      </div>
      <table class="attachment-table">
        <thead>
          <tr>
            <td style="text-align: center; font-weight: bold;">№ п/п</td>
            <td style="text-align: center; font-weight: bold;">№ В ЗМ</td>
            <td style="text-align: center; font-weight: bold;">Вид воздушного судна</td>
            <td style="text-align: center; font-weight: bold;">Серийный (заводской номер)</td>
            <td style="text-align: center; font-weight: bold;">Номер планера</td>
            <td style="text-align: center; font-weight: bold;">Год выпуска</td>
            <td style="text-align: center; font-weight: bold;">Наименование изготовителя</td>
            <td style="text-align: center; font-weight: bold;">Тип (наименование)</td>
            <td style="text-align: center; font-weight: bold;">Адрес местоположения</td>
            <td style="text-align: center; font-weight: bold;">Наработка /налет часов</td>
            <td style="text-align: center; font-weight: bold;">Работоспособность подтверждена/не подтверждена</td>
            <td style="text-align: center; font-weight: bold;">Наличие/отсутствие повреждений</td>
            <td style="text-align: center; font-weight: bold;">Идентификация подтверждена/не подтверждена</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td></td>
            <td>${aircraftType}</td>
            <td>${serialNumber}</td>
            <td>${gliderNumber}</td>
            <td style="text-align: center;">${year}</td>
            <td>${manufacturer}</td>
            <td>${model}</td>
            <td>${address.fullAddress || ''}</td>
            <td>${operatingHours}</td>
            <td>${operabilityConfirmed || ''}</td>
            <td>${damagePresence || ''}</td>
            <td>${identificationConfirmed || ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Генерирует приложение для железнодорожного транспорта
 */
function generateRailwayAttachment(card: ExtendedCollateralCard, inspection?: Inspection): string {
  const chars = card.characteristics || {};
  const make = chars.make || chars.brand || '';
  const model = chars.model || '';
  const serialNumber = chars.serialNumber || chars.factoryNumber || '';
  const year = chars.year || chars.yearOfConstruction || '';
  const identificationMarks = chars.identificationMarks || '';
  const wagonNumber = chars.wagonNumber || '';
  const depot = chars.depot || '';
  const inventoryNumber = chars.inventoryNumber || '';
  const country = chars.country || chars.manufacturerCountry || '';
  const identificationConfirmed = inspection?.propertyPresence === 'Наличие имущества подтверждается' ? 'Подтверждена' : '';
  const encumbrances = '';
  const comments = '';
  
  return `
    <div class="section" style="page-break-before: always;">
      <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">
        Приложение к акту осмотра (Железнодорожный транспорт)
      </div>
      <table class="attachment-table">
        <thead>
          <tr>
            <td style="text-align: center; font-weight: bold;">№п/п</td>
            <td style="text-align: center; font-weight: bold;">№ В ЗМ</td>
            <td style="text-align: center; font-weight: bold;">Наименование</td>
            <td style="text-align: center; font-weight: bold;">Марка, модель</td>
            <td style="text-align: center; font-weight: bold;">Заводской номер</td>
            <td style="text-align: center; font-weight: bold;">Год постройки</td>
            <td style="text-align: center; font-weight: bold;">Идентификационные признаки</td>
            <td style="text-align: center; font-weight: bold;">Номер вагона</td>
            <td style="text-align: center; font-weight: bold;">Депо приписки</td>
            <td style="text-align: center; font-weight: bold;">Инвентарный номер</td>
            <td style="text-align: center; font-weight: bold;">Страна - изготовитель</td>
            <td style="text-align: center; font-weight: bold;">Идентификация подтверждена/не подтверждена /выявленные разночтения</td>
            <td style="text-align: center; font-weight: bold;">Выявленные обременения</td>
            <td style="text-align: center; font-weight: bold;">Комментарии</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td></td>
            <td>${card.name || ''}</td>
            <td>${make} ${model}</td>
            <td>${serialNumber}</td>
            <td style="text-align: center;">${year}</td>
            <td>${identificationMarks}</td>
            <td>${wagonNumber}</td>
            <td>${depot}</td>
            <td>${inventoryNumber}</td>
            <td>${country}</td>
            <td style="background-color: ${identificationConfirmed ? '#ffff00' : 'transparent'};">${identificationConfirmed || ''}</td>
            <td>${encumbrances}</td>
            <td>${comments}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Генерирует приложение для самоходной техники
 */
function generateSelfPropelledAttachment(card: ExtendedCollateralCard, _inspection?: Inspection): string {
  const chars = card.characteristics || {};
  const address = card.address || {};
  const make = chars.make || chars.brand || '';
  const model = chars.model || '';
  const serialNumber = chars.serialNumber || chars.factoryNumber || '';
  const color = chars.color || '';
  const year = chars.year || chars.yearOfManufacture || '';
  const manufacturer = chars.manufacturer || '';
  const inventoryNumber = chars.inventoryNumber || '';
  const registrationNumber = chars.registrationNumber || '';
  const bookValue = chars.bookValue || chars.balanceValue || chars.residualValue || 0;
  
  return `
    <div class="section" style="page-break-before: always;">
      <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">
        Приложение к акту осмотра (Самоходная техника)
      </div>
      <table class="attachment-table">
        <thead>
          <tr>
            <td style="text-align: center; font-weight: bold;">№п/п</td>
            <td style="text-align: center; font-weight: bold;">№ В ЗМ</td>
            <td style="text-align: center; font-weight: bold;">Наименование</td>
            <td style="text-align: center; font-weight: bold;">Марка машины</td>
            <td style="text-align: center; font-weight: bold;">Модель</td>
            <td style="text-align: center; font-weight: bold;">Заводской номер машины (рамы)</td>
            <td style="text-align: center; font-weight: bold;">Цвет</td>
            <td style="text-align: center; font-weight: bold;">Год выпуска</td>
            <td style="text-align: center; font-weight: bold;">Предприятие - изготовитель</td>
            <td style="text-align: center; font-weight: bold;">Инвентарный номер</td>
            <td style="text-align: center; font-weight: bold;">Регистрационный знак</td>
            <td style="text-align: center; font-weight: bold;">Адрес местоположения</td>
            <td style="text-align: center; font-weight: bold;">Остаточная балансовая стоимость единицы, руб.</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td></td>
            <td>${card.name || ''}</td>
            <td>${make}</td>
            <td>${model}</td>
            <td>${serialNumber}</td>
            <td>${color}</td>
            <td style="text-align: center;">${year}</td>
            <td>${manufacturer}</td>
            <td>${inventoryNumber}</td>
            <td>${registrationNumber}</td>
            <td>${address.fullAddress || ''}</td>
            <td style="text-align: right;">${bookValue ? bookValue.toLocaleString('ru-RU') : '0.00'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Генерирует приложение для ТМЦ
 */
function generateInventoryAttachment(card: ExtendedCollateralCard, _inspection?: Inspection): string {
  const chars = card.characteristics || {};
  const address = card.address || {};
  const unit = chars.unit || chars.unitOfMeasurement || '';
  const quantity = chars.quantity || '';
  const location = address.fullAddress || '';
  const encumbrances = '';
  const compliance = '';
  const storageLocation = chars.storageLocation || '';
  const storageSystem = chars.storageSystem || '';
  const securityAlarm = chars.securityAlarm || '';
  const storageConditions = chars.storageConditions || '';
  const features = chars.features || '';
  
  return `
    <div class="section" style="page-break-before: always;">
      <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">
        Приложение к акту осмотра (ТМЦ)
      </div>
      <table class="attachment-table">
        <thead>
          <tr>
            <td style="text-align: center; font-weight: bold;">№ п/п</td>
            <td style="text-align: center; font-weight: bold;">№ В ЗМ</td>
            <td style="text-align: center; font-weight: bold;">Наименование имущества/товаров</td>
            <td style="text-align: center; font-weight: bold;">Единица измерения</td>
            <td style="text-align: center; font-weight: bold;">Количество</td>
            <td style="text-align: center; font-weight: bold;">Местонахождение имущества</td>
            <td style="text-align: center; font-weight: bold;">Выявленные обременения</td>
            <td style="text-align: center; font-weight: bold;">Соответствие товара количественным характеристикам</td>
            <td style="text-align: center; font-weight: bold;">Характеристики места хранения</td>
            <td style="text-align: center; font-weight: bold;">Система хранения</td>
            <td style="text-align: center; font-weight: bold;">Наличие охранно-пожарной сигнализации</td>
            <td style="text-align: center; font-weight: bold;">Условия хранения</td>
            <td style="text-align: center; font-weight: bold;">Особенности</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td></td>
            <td>${card.name || ''}</td>
            <td>${unit}</td>
            <td style="text-align: right;">${quantity}</td>
            <td>${location}</td>
            <td>${encumbrances}</td>
            <td>${compliance}</td>
            <td>${storageLocation}</td>
            <td>${storageSystem}</td>
            <td>${securityAlarm}</td>
            <td>${storageConditions}</td>
            <td>${features}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Генерирует приложение для долей в УК
 */
function generateSharesAttachment(card: ExtendedCollateralCard, _inspection?: Inspection): string {
  const owner = card.partners?.find(p => p.role === 'owner');
  const ownerName = owner
    ? owner.type === 'legal'
      ? owner.organizationName || ''
      : `${owner.lastName || ''} ${owner.firstName || ''} ${owner.middleName || ''}`.trim()
    : '';
  const share = owner?.share || '';
  const egrylConfirmation = '';
  const encumbrances = '';
  
  return `
    <div class="section" style="page-break-before: always;">
      <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">
        Приложение к акту осмотра (доли в УК)
      </div>
      <table class="attachment-table">
        <thead>
          <tr>
            <td style="text-align: center; font-weight: bold;">№ п/п</td>
            <td style="text-align: center; font-weight: bold;">№ В ЗМ</td>
            <td style="text-align: center; font-weight: bold;">Наименование собственника</td>
            <td style="text-align: center; font-weight: bold;">Доля в УК</td>
            <td style="text-align: center; font-weight: bold;">Подтверждение собственника и доли в УК выписок из ЕГРЮЛ</td>
            <td style="text-align: center; font-weight: bold;">Выявленные обременения</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td></td>
            <td>${ownerName}</td>
            <td style="text-align: right;">${share}%</td>
            <td>${egrylConfirmation}</td>
            <td>${encumbrances}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Генерирует приложение для товарных знаков
 */
function generateTrademarkAttachment(card: ExtendedCollateralCard, _inspection?: Inspection): string {
  const chars = card.characteristics || {};
  const certificateNumber = chars.certificateNumber || '';
  const certificateIssuedBy = chars.certificateIssuedBy || '';
  const trademarkName = card.name || '';
  const applicationNumber = chars.applicationNumber || '';
  const priority = chars.priority || '';
  const registrationDate = chars.registrationDate || '';
  const registrationPeriod = chars.registrationPeriod || '';
  const encumbrances = '';
  const comments = '';
  
  return `
    <div class="section" style="page-break-before: always;">
      <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">
        Приложение к акту осмотра на исключительные права на товарные знаки (знаки обслуживания)
      </div>
      <table class="attachment-table">
        <thead>
          <tr>
            <td style="text-align: center; font-weight: bold;">№ п/п</td>
            <td style="text-align: center; font-weight: bold;">№ В ЗМ</td>
            <td style="text-align: center; font-weight: bold;">Свидетельство на товарный знак (знак обслуживания) (№, кем выдано)</td>
            <td style="text-align: center; font-weight: bold;">Наименование товарного знака (знака обслуживания)</td>
            <td style="text-align: center; font-weight: bold;">Номер заявки</td>
            <td style="text-align: center; font-weight: bold;">Приоритет товарного знака</td>
            <td style="text-align: center; font-weight: bold;">Дата регистрации</td>
            <td style="text-align: center; font-weight: bold;">Срок действия регистрации</td>
            <td style="text-align: center; font-weight: bold;">Выявленные обременения</td>
            <td style="text-align: center; font-weight: bold;">Комментарии</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td></td>
            <td>${certificateNumber}${certificateIssuedBy ? `, ${certificateIssuedBy}` : ''}</td>
            <td>${trademarkName}</td>
            <td>${applicationNumber}</td>
            <td>${priority}</td>
            <td>${registrationDate ? dayjs(registrationDate).format('DD.MM.YYYY') : ''}</td>
            <td>${registrationPeriod}</td>
            <td>${encumbrances}</td>
            <td>${comments}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}
