/**
 * Утилита для генерации PDF акта осмотра
 */

import type { Inspection } from '@/types/inspection';
import dayjs from 'dayjs';

export const generateInspectionPDF = (inspection: Inspection): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Не удалось открыть окно для печати. Разрешите всплывающие окна.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Акт осмотра ${inspection.id}</title>
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
          line-height: 1.5;
          margin: 0;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 16pt;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .header .subtitle {
          font-size: 12pt;
          margin-bottom: 20px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 10px;
          border-bottom: 1px solid #000;
          padding-bottom: 5px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .info-table td {
          padding: 5px 10px;
          border: 1px solid #000;
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
          display: flex;
          justify-content: space-between;
        }
        .signature-block {
          width: 45%;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 50px;
          padding-top: 5px;
        }
        .footer {
          margin-top: 30px;
          font-size: 10pt;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>АКТ ОСМОТРА ОБЕСПЕЧЕНИЯ</h1>
        <div class="subtitle">№ ${inspection.id}</div>
        <div class="subtitle">от ${dayjs(inspection.inspectionDate).format('DD.MM.YYYY')}</div>
      </div>

      <div class="section">
        <div class="section-title">1. Общая информация</div>
        <table class="info-table">
          <tr>
            <td>Тип осмотра</td>
            <td>${inspection.inspectionType}</td>
          </tr>
          <tr>
            <td>Дата осмотра</td>
            <td>${dayjs(inspection.inspectionDate).format('DD.MM.YYYY HH:mm')}</td>
          </tr>
          <tr>
            <td>Объект осмотра</td>
            <td>${inspection.collateralName}</td>
          </tr>
          ${inspection.address ? `
          <tr>
            <td>Адрес</td>
            <td>${inspection.address}</td>
          </tr>
          ` : ''}
          ${inspection.collateralNumber ? `
          <tr>
            <td>Номер объекта</td>
            <td>${inspection.collateralNumber}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div class="section">
        <div class="section-title">2. Исполнитель</div>
        <table class="info-table">
          <tr>
            <td>ФИО</td>
            <td>${inspection.inspectorName}</td>
          </tr>
          <tr>
            <td>Тип исполнителя</td>
            <td>${inspection.inspectorType === 'employee' ? 'Сотрудник банка' : 'Клиент'}</td>
          </tr>
          ${inspection.inspectorPosition ? `
          <tr>
            <td>Должность</td>
            <td>${inspection.inspectorPosition}</td>
          </tr>
          ` : ''}
          ${inspection.inspectorPhone ? `
          <tr>
            <td>Телефон</td>
            <td>${inspection.inspectorPhone}</td>
          </tr>
          ` : ''}
          ${inspection.inspectorEmail ? `
          <tr>
            <td>Email</td>
            <td>${inspection.inspectorEmail}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div class="section">
        <div class="section-title">3. Результаты осмотра</div>
        <table class="info-table">
          <tr>
            <td>Состояние объекта</td>
            <td>${inspection.condition}</td>
          </tr>
          ${inspection.overallCondition ? `
          <tr>
            <td>Описание состояния</td>
            <td>${inspection.overallCondition}</td>
          </tr>
          ` : ''}
          ${inspection.latitude && inspection.longitude ? `
          <tr>
            <td>Геолокация</td>
            <td>${inspection.latitude.toFixed(6)}, ${inspection.longitude.toFixed(6)}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${inspection.photos && inspection.photos.length > 0 ? `
      <div class="section">
        <div class="section-title">4. Фотографии (${inspection.photos.length})</div>
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
        <div class="section-title">5. Выявленные дефекты</div>
        <table class="info-table">
          ${inspection.defects.map((defect, index) => `
            <tr>
              <td>Дефект ${index + 1}</td>
              <td>${defect.description} (${defect.severity})</td>
            </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}

      ${inspection.recommendations && inspection.recommendations.length > 0 ? `
      <div class="section">
        <div class="section-title">6. Рекомендации</div>
        <table class="info-table">
          ${inspection.recommendations.map((rec, index) => `
            <tr>
              <td>Рекомендация ${index + 1}</td>
              <td>${rec.description} (${rec.priority})</td>
            </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}

      ${inspection.notes ? `
      <div class="section">
        <div class="section-title">7. Примечания</div>
        <p>${inspection.notes}</p>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">8. Хронология</div>
        <table class="info-table">
          ${inspection.history && inspection.history.length > 0 ? inspection.history.map((item) => `
            <tr>
              <td>${dayjs(item.date).format('DD.MM.YYYY HH:mm')}</td>
              <td>${item.user}: ${item.action}${item.comment ? ` - ${item.comment}` : ''}</td>
            </tr>
          `).join('') : '<tr><td colspan="2">Нет данных</td></tr>'}
        </table>
      </div>

      <div class="signatures">
        <div class="signature-block">
          <div class="signature-line">
            Исполнитель: ${inspection.inspectorName}
          </div>
        </div>
        ${inspection.approvedBy ? `
        <div class="signature-block">
          <div class="signature-line">
            Согласовал: ${inspection.approvedBy}
            ${inspection.approvedAt ? `<br>${dayjs(inspection.approvedAt).format('DD.MM.YYYY')}` : ''}
          </div>
        </div>
        ` : ''}
      </div>

      <div class="footer">
        <p>Документ сгенерирован автоматически ${dayjs().format('DD.MM.YYYY HH:mm')}</p>
        <p>Статус: ${inspection.status}</p>
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
