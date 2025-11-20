import React, { useState } from 'react';
import {
  Modal,
  Form,
  Checkbox,
  Button,
  Space,
  message,
  Typography,
  Divider,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportModulesToXLS } from '@/utils/bulkEditUtils';

const { Text } = Typography;

interface BulkEditExportFormProps {
  visible: boolean;
  onClose: () => void;
}

interface ModuleOption {
  key: string;
  label: string;
  description: string;
}

const MODULE_OPTIONS: ModuleOption[] = [
  {
    key: 'registry',
    label: 'Реестр объектов',
    description: 'Карточки залогового имущества',
  },
  {
    key: 'employees',
    label: 'Сотрудники',
    description: 'Данные сотрудников и их права',
  },
  {
    key: 'reference-data',
    label: 'Справочники',
    description: 'Все справочники системы',
  },
  {
    key: 'cms-check',
    label: 'CMS Check',
    description: 'Данные дистанционных осмотров',
  },
];

const BulkEditExportForm: React.FC<BulkEditExportFormProps> = ({
  visible,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const handleSelectAll = () => {
    const allKeys = MODULE_OPTIONS.map(m => m.key);
    setSelectedModules(allKeys);
    form.setFieldsValue({ modules: allKeys });
  };

  const handleDeselectAll = () => {
    setSelectedModules([]);
    form.setFieldsValue({ modules: [] });
  };

  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      const modules = values.modules || [];

      if (modules.length === 0) {
        message.warning('Выберите хотя бы один модуль для выгрузки');
        return;
      }

      setLoading(true);

      try {
        await exportModulesToXLS(modules);
        message.success(`Данные успешно выгружены в XLS. Выбрано модулей: ${modules.length}`);
        onClose();
      } catch (error: any) {
        console.error('Ошибка выгрузки данных:', error);
        message.error(`Ошибка при выгрузке данных: ${error.message || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка валидации:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined />
          <span>Выгрузить данные для массовых изменений</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleExport}
        >
          Выгрузить в XLS
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Выберите модули, данные из которых необходимо выгрузить для массовых изменений.
          Все данные будут выгружены в один XLS файл с колонками "Модуль" и "ID".
        </Text>

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space>
            <Button size="small" onClick={handleSelectAll}>
              Выбрать все
            </Button>
            <Button size="small" onClick={handleDeselectAll}>
              Снять все
            </Button>
          </Space>

          <Form.Item
            name="modules"
            rules={[{ required: true, message: 'Выберите хотя бы один модуль' }]}
          >
            <Checkbox.Group
              value={selectedModules}
              onChange={(values) => {
                setSelectedModules(values as string[]);
                form.setFieldsValue({ modules: values });
              }}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {MODULE_OPTIONS.map((module) => (
                  <Checkbox key={module.key} value={module.key}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{module.label}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {module.description}
                      </Text>
                    </div>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default BulkEditExportForm;

