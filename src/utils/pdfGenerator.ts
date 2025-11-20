/**
 * Утилита для генерации PDF из markdown
 */

/**
 * Простой парсер markdown в HTML
 */
const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  // Заголовки
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Жирный текст
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Курсив
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Ссылки
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

  // Списки
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>');

  // Параграфы
  html = html.split('\n\n').map(para => {
    if (para.trim() && !para.match(/^<[h|u|o|l]/)) {
      return `<p>${para.trim()}</p>`;
    }
    return para;
  }).join('\n');

  // Обернуть списки
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');

  // Горизонтальная линия
  html = html.replace(/^---$/gim, '<hr>');

  // Код
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  return html;
};

/**
 * Генерация PDF из markdown текста
 */
export const generatePdfFromMarkdown = async (markdown: string): Promise<void> => {
  try {
    // Конвертируем markdown в HTML
    const htmlContent = markdownToHtml(markdown);

    // Создаем полный HTML документ
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Инструкция по использованию CMS</title>
          <style>
            @media print {
              @page {
                margin: 2cm;
                size: A4;
              }
              body {
                margin: 0;
                padding: 20px;
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                line-height: 1.6;
                color: #000;
              }
              h1 {
                font-size: 24pt;
                margin-top: 20px;
                margin-bottom: 10px;
                page-break-after: avoid;
              }
              h2 {
                font-size: 18pt;
                margin-top: 16px;
                margin-bottom: 8px;
                page-break-after: avoid;
              }
              h3 {
                font-size: 14pt;
                margin-top: 12px;
                margin-bottom: 6px;
                page-break-after: avoid;
              }
              p {
                margin: 8px 0;
                text-align: justify;
              }
              ul, ol {
                margin: 8px 0;
                padding-left: 30px;
              }
              li {
                margin: 4px 0;
              }
              code {
                background-color: #f5f5f5;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 10pt;
              }
              a {
                color: #0000EE;
                text-decoration: underline;
              }
              hr {
                border: none;
                border-top: 1px solid #ccc;
                margin: 20px 0;
              }
              strong {
                font-weight: bold;
              }
              em {
                font-style: italic;
              }
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #000;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              font-size: 24pt;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            h2 {
              font-size: 18pt;
              margin-top: 16px;
              margin-bottom: 8px;
            }
            h3 {
              font-size: 14pt;
              margin-top: 12px;
              margin-bottom: 6px;
            }
            p {
              margin: 8px 0;
            }
            ul, ol {
              margin: 8px 0;
              padding-left: 30px;
            }
            li {
              margin: 4px 0;
            }
            code {
              background-color: #f5f5f5;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
            }
            a {
              color: #0000EE;
              text-decoration: underline;
            }
            hr {
              border: none;
              border-top: 1px solid #ccc;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    // Создаем новое окно для печати
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Не удалось открыть окно для печати. Проверьте настройки блокировки всплывающих окон.');
    }

    printWindow.document.write(fullHtml);
    printWindow.document.close();

    // Ждем загрузки содержимого
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Закрываем окно после печати (опционально)
        // printWindow.close();
      }, 250);
    };
  } catch (error) {
    console.error('Ошибка генерации PDF:', error);
    throw error;
  }
};

/**
 * Загрузка markdown файла и генерация PDF
 */
export const downloadPdfFromMarkdownFile = async (filePath: string): Promise<void> => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Не удалось загрузить файл: ${response.statusText}`);
    }
    
    const markdown = await response.text();
    await generatePdfFromMarkdown(markdown);
  } catch (error) {
    console.error('Ошибка загрузки и генерации PDF:', error);
    throw error;
  }
};

