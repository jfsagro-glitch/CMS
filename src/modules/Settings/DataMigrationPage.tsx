import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  DownloadOutlined,
  UploadOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import ExportMigrationForm from './ExportMigrationForm';
import ImportMigrationForm from './ImportMigrationForm';
import './DataMigrationPage.css';

const { Title, Text } = Typography;

const DataMigrationPage: React.FC = () => {
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);

  return (
    <div className="data-migration-page">
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <SwapOutlined style={{ fontSize: '28px', color: '#13c2c2' }} />
            Миграция данных
          </Title>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Выгрузка и загрузка данных из различных модулей CMS для переноса между системами или создания резервных копий
          </Text>
        </div>

        <Divider />

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card
              hoverable
              style={{ height: '100%', textAlign: 'center' }}
              onClick={() => setExportModalVisible(true)}
            >
              <DownloadOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: 16 }} />
              <Title level={4}>Выгрузить форму для миграции</Title>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Выберите модули CMS, данные из которых необходимо выгрузить. 
                Будет создан файл для миграции с выбранными данными.
              </Text>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                size="large"
                style={{ marginTop: 16 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setExportModalVisible(true);
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
              onClick={() => setImportModalVisible(true)}
            >
              <UploadOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: 16 }} />
              <Title level={4}>Загрузить форму</Title>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Загрузите файл миграции для заполнения модулей CMS данными. 
                Данные будут импортированы в соответствующие модули системы.
              </Text>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                size="large"
                style={{ marginTop: 16, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setImportModalVisible(true);
                }}
              >
                Загрузить данные
              </Button>
            </Card>
          </Col>
        </Row>
      </Card>

      <ExportMigrationForm
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
      />

      <ImportMigrationForm
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
      />
    </div>
  );
};

export default DataMigrationPage;

