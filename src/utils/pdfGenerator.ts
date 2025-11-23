/**
 * Утилита для генерации PDF акта осмотра
 */

import type { Inspection } from '@/types/inspection';
import type { ExtendedCollateralCard } from '@/types';
import dayjs from 'dayjs';

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

  // Определяем способ проверки и тип осмотра
  const inspectionMethod = 'Визуальный осмотр';
  const inspectionTypeLabel = inspection.inspectionType === 'primary' ? 'Первичный осмотр'
    : inspection.inspectionType === 'periodic' ? 'Периодический осмотр'
    : inspection.inspectionType === 'monitoring' ? 'Мониторинг'
    : inspection.inspectionType === 'unscheduled' ? 'Внеплановый осмотр'
    : 'Выборочный осмотр';

  // Определяем состояние имущества
  const conditionText = inspection.condition === 'excellent' ? 'Имущество в отличном состоянии'
    : inspection.condition === 'good' ? 'Имущество в хорошем состоянии'
    : inspection.condition === 'satisfactory' ? 'Имущество в удовлетворительном состоянии'
    : inspection.condition === 'poor' ? 'Имущество в плохом состоянии'
    : 'Имущество в критическом состоянии';

  const presenceText = inspection.condition !== 'critical' 
    ? 'Наличие имущества подтверждается'
    : 'Наличие имущества не подтверждается';

  const storageConditionsText = inspection.overallCondition || 
    'Условия хранения/эксплуатации частично соблюдаются (уточнения в Приложении 1)';

  const conclusionsText = inspection.notes || 
    (inspection.condition === 'critical' 
      ? 'Предлагаемое в залог имущество не возможно рассмотреть в качестве обеспечения'
      : 'Имущество соответствует требованиям для принятия в залог');

  const proposalsText = inspection.recommendations && inspection.recommendations.length > 0
    ? inspection.recommendations.map(r => r.description).join('; ')
    : '-';

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
