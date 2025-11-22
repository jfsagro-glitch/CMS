import React, { useState } from 'react';
import { Result, Button, Card, Row, Col, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, DatabaseOutlined, FilePdfOutlined } from '@ant-design/icons';
// import { downloadPdfFromMarkdownFile } from '@/utils/pdfGenerator';

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
      // const base = import.meta.env.BASE_URL ?? './';
      // const markdownPath = `${base}INSTRUCTION/CMS_USER_MANUAL.md`;
      // await downloadPdfFromMarkdownFile(markdownPath);
      message.info('Генерация PDF из Markdown временно отключена');
      message.success('PDF инструкция открыта для печати');
    } catch (error: any) {
      console.error('Ошибка генерации PDF:', error);
      message.error(`Ошибка генерации PDF: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
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
            Выгрузить инструкцию в PDF
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

