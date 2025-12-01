import React, { useState } from 'react';
import { Result, Button, Card, Row, Col, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, DatabaseOutlined, FilePdfOutlined, ClockCircleOutlined, LineChartOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Если это страница настроек, показываем ссылки на подразделы
  const isSettingsPage = location.pathname === '/settings' || location.pathname === '#/settings' || location.hash === '#/settings';

  const handleDownloadPdf = async () => {
    try {
      setLoading(true);
      message.info('Генерация PDF описания системы...');

      // Пытаемся загрузить файл, если не получается - используем встроенное содержимое
      let markdownText = '';
      try {
        const response = await fetch('/INSTRUCTION/CMS_FUNCTIONALITY.md');
        if (response.ok) {
          markdownText = await response.text();
        } else {
          throw new Error('Файл не найден, используем встроенное содержимое');
        }
      } catch (error) {
        // Используем встроенное содержимое описания
        markdownText = getSystemDescriptionMarkdown();
      }

      // Преобразуем Markdown в HTML
      const html = convertMarkdownToHtml(markdownText);

      // Создаем временный контейнер для рендеринга PDF
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.minHeight = '100px';
      container.style.padding = '20px';
      container.style.backgroundColor = '#ffffff';
      container.style.color = '#000000';
      container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      container.style.fontSize = '12px';
      container.style.lineHeight = '1.6';
      container.style.boxSizing = 'border-box';
      container.style.visibility = 'visible';
      container.style.opacity = '1';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '999999';
      container.style.overflow = 'visible';
      container.innerHTML = html;
      document.body.appendChild(container);

      // Ждем рендеринга
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 500));

      // Принудительный reflow
      void container.offsetHeight;
      const containerHeight = container.scrollHeight || 1000;

      if (containerHeight < 50) {
        document.body.removeChild(container);
        throw new Error('Контейнер PDF пуст или не отрендерился');
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: containerHeight,
        windowWidth: 800,
        windowHeight: containerHeight,
      });

      document.body.removeChild(container);

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas пуст');
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      let yPosition = margin;
      const imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Разбиваем на страницы, если изображение не помещается
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      const ts = new Date().toISOString().slice(0, 10);
      pdf.save(`Описание_системы_CMS_${ts}.pdf`);
      message.success('PDF описание системы успешно выгружено');
    } catch (error: any) {
      console.error('Ошибка генерации PDF:', error);
      message.error(`Ошибка генерации PDF: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const convertMarkdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Заголовки
    html = html.replace(/^### (.*$)/gim, '<h3 style="margin: 16px 0 8px 0; font-size: 16px; font-weight: 600; color: #1890ff;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="margin: 20px 0 12px 0; font-size: 20px; font-weight: 700; color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 4px;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="margin: 24px 0 16px 0; font-size: 24px; font-weight: 700; color: #1890ff;">$1</h1>');

    // Жирный текст
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong style="font-weight: 600;">$1</strong>');

    // Списки
    html = html.replace(/^\- (.*$)/gim, '<li style="margin: 4px 0; padding-left: 8px;">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul style="margin: 8px 0; padding-left: 24px;">$1</ul>');

    // Разделители
    html = html.replace(/^---$/gim, '<hr style="margin: 16px 0; border: none; border-top: 1px solid #e8e8e8;" />');

    // Параграфы
    html = html.split('\n\n').map(para => {
      if (para.trim() && !para.match(/^<[h|u|o|l|d]/)) {
        return `<p style="margin: 8px 0; text-align: justify;">${para.trim()}</p>`;
      }
      return para;
    }).join('\n');

    // Код
    html = html.replace(/`(.*?)`/gim, '<code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace;">$1</code>');

    // Ссылки
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" style="color: #1890ff; text-decoration: none;">$1</a>');

    return `<div style="max-width: 800px; margin: 0 auto;">${html}</div>`;
  };

  if (isSettingsPage) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0 }}>Настройки</h1>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            loading={loading}
            onClick={handleDownloadPdf}
            size="large"
          >
            Выгрузить Описание системы
          </Button>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/settings/employees')}
            >
              <div style={{ textAlign: 'center' }}>
                <UserOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <h3>Управление сотрудниками</h3>
                <p style={{ color: '#8c8c8c' }}>Добавление и редактирование сотрудников, их ролей и прав доступа</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/settings/reference-data')}
            >
              <div style={{ textAlign: 'center' }}>
                <DatabaseOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                <h3>Справочники</h3>
                <p style={{ color: '#8c8c8c' }}>Управление всеми справочниками системы</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/settings/norm-hours')}
            >
              <div style={{ textAlign: 'center' }}>
                <ClockCircleOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: '16px' }} />
                <h3>Нормочасы по функциям</h3>
                <p style={{ color: '#8c8c8c' }}>Управление нормочасами для расчета загрузки сотрудников</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/settings/metrics')}
            >
              <div style={{ textAlign: 'center' }}>
                <LineChartOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '16px' }} />
                <h3>Метрики KPI и MBO</h3>
                <p style={{ color: '#8c8c8c' }}>Корректировка ключевых показателей и целевых значений MBO</p>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <Result
      status="info"
      title={title}
      subTitle={subtitle || 'Этот раздел находится в разработке'}
      extra={
        <Button onClick={() => navigate('/registry')}>
          Вернуться к реестру
        </Button>
      }
    />
  );
};

export default PlaceholderPage;

