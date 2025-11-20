import React, { useState } from 'react';
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Divider,
  Tabs,
} from 'antd';
import {
  DownloadOutlined,
  UploadOutlined,
  SwapOutlined,
  EditOutlined,
} from '@ant-design/icons';
import ExportMigrationForm from '../Settings/ExportMigrationForm';
import ImportMigrationForm from '../Settings/ImportMigrationForm';
import BulkEditExportForm from './BulkEditExportForm';
import BulkEditImportForm from './BulkEditImportForm';

const { Title, Text } = Typography;

const UploadPage: React.FC = () => {
  const [exportMigrationVisible, setExportMigrationVisible] = useState(false);
  const [importMigrationVisible, setImportMigrationVisible] = useState(false);
  const [exportBulkEditVisible, setExportBulkEditVisible] = useState(false);
  const [importBulkEditVisible, setImportBulkEditVisible] = useState(false);

  const tabItems = [
    {
      key: 'migration',
      label: 'Миграция данных',
      icon: <SwapOutlined />,
      children: (
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            Выгрузка и загрузка данных из различных модулей CMS для переноса между системами или создания резервных копий.
            Данные выгружаются в формате JSON.
          </Text>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card
                hoverable
                style={{ height: '100%', textAlign: 'center' }}
                onClick={() => setExportMigrationVisible(true)}
              >
                <DownloadOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: 16 }} />
                <Title level={4}>Выгрузить форму для миграции</Title>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Выберите модули CMS, данные из которых необходимо выгрузить. 
                  Будет создан JSON файл для миграции с выбранными данными.
                </Text>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  size="large"
                  style={{ marginTop: 16 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExportMigrationVisible(true);
                  }}
                >
                  Выгрузить данные
                </Button>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                hoverable
                style={{ height: '100%', textAlign: 'center' }}
                onClick={() => setImportMigrationVisible(true)}
              >
                <UploadOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: 16 }} />
                <Title level={4}>Загрузить форму</Title>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Загрузите JSON файл миграции для заполнения модулей CMS данными. 
                  Данные будут импортированы в соответствующие модули системы.
                </Text>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  size="large"
                  style={{ marginTop: 16, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportMigrationVisible(true);
                  }}
                >
                  Загрузить данные
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'bulk-edit',
      label: 'Массовые изменения',
      icon: <EditOutlined />,
      children: (
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            Выгрузка данных в XLS файл для массового редактирования. 
            После внесения изменений в файл, загрузите его обратно для обновления данных в системе.
            Все модули выгружаются в один лист с колонками "Модуль" и "ID".
          </Text>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card
                hoverable
                style={{ height: '100%', textAlign: 'center' }}
                onClick={() => setExportBulkEditVisible(true)}
              >
                <DownloadOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: 16 }} />
                <Title level={4}>Выгрузить данные для редактирования</Title>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Выберите модули, данные из которых необходимо выгрузить в XLS файл. 
                  Все данные будут в одном файле с колонками "Модуль" и "ID".
                </Text>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  size="large"
                  style={{ marginTop: 16 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExportBulkEditVisible(true);
                  }}
                >
                  Выгрузить в XLS
                </Button>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                hoverable
                style={{ height: '100%', textAlign: 'center' }}
                onClick={() => setImportBulkEditVisible(true)}
              >
                <UploadOutlined style={{ fontSize: '64px', color: '#722ed1', marginBottom: 16 }} />
                <Title level={4}>Загрузить измененный файл</Title>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Загрузите отредактированный XLS файл для применения изменений. 
                  Записи с существующим ID будут обновлены, новые записи будут созданы.
                </Text>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  size="large"
                  style={{ marginTop: 16, backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportBulkEditVisible(true);
                  }}
                >
                  Загрузить и применить
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <UploadOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
            Загрузка и выгрузка данных
          </Title>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Миграция данных между системами и массовое редактирование данных через XLS файлы
          </Text>
        </div>

        <Divider />

        <Tabs items={tabItems} defaultActiveKey="migration" />
      </Card>

      <ExportMigrationForm
        visible={exportMigrationVisible}
        onClose={() => setExportMigrationVisible(false)}
      />

      <ImportMigrationForm
        visible={importMigrationVisible}
        onClose={() => setImportMigrationVisible(false)}
      />

      <BulkEditExportForm
        visible={exportBulkEditVisible}
        onClose={() => setExportBulkEditVisible(false)}
      />

      <BulkEditImportForm
        visible={importBulkEditVisible}
        onClose={() => setImportBulkEditVisible(false)}
      />
    </div>
  );
};

export default UploadPage;

