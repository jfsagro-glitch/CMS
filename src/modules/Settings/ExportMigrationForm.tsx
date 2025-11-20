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
  Row,
  Col,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import extendedStorageService from '@/services/ExtendedStorageService';
import employeeService from '@/services/EmployeeService';
import referenceDataService from '@/services/ReferenceDataService';

const { Text } = Typography;

interface ExportMigrationFormProps {
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
    key: 'portfolio',
    label: 'Залоговый портфель',
    description: 'Данные портфеля сделок',
  },
  {
    key: 'collateral-dossier',
    label: 'Залоговое досье',
    description: 'Информация по сделкам',
  },
  {
    key: 'collateral-conclusions',
    label: 'Заключения по залогу',
    description: 'Заключения и оценки',
  },
  {
    key: 'tasks',
    label: 'Задачи',
    description: 'Задачи и поручения',
  },
  {
    key: 'kpi',
    label: 'KPI',
    description: 'Ключевые показатели эффективности',
  },
  {
    key: 'reports',
    label: 'Отчеты',
    description: 'Аналитические отчеты',
  },
  {
    key: 'insurance',
    label: 'Страхование',
    description: 'Страховые полисы',
  },
  {
    key: 'fnp',
    label: 'ФНП',
    description: 'Данные ФНП сервиса',
  },
  {
    key: 'analytics',
    label: 'Аналитика',
    description: 'Аналитические данные',
  },
  {
    key: 'credit-risk',
    label: 'Кредитные риски',
    description: 'Данные по рискам',
  },
  {
    key: 'appraisal',
    label: 'Оценка',
    description: 'Данные оценок',
  },
  {
    key: 'cms-check',
    label: 'CMS Check',
    description: 'Данные дистанционных осмотров',
  },
  {
    key: 'egrn',
    label: 'ЕГРН',
    description: 'Данные ЕГРН',
  },
  {
    key: 'monitoring',
    label: 'Мониторинг',
    description: 'Планы мониторинга и переоценки',
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
    key: 'settings',
    label: 'Настройки',
    description: 'Настройки приложения',
  },
];

const ExportMigrationForm: React.FC<ExportMigrationFormProps> = ({
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

      // Собираем данные из выбранных модулей
      const exportData: Record<string, any> = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        modules: {},
      };

      // Выгружаем данные из каждого выбранного модуля
      for (const moduleKey of modules) {
        try {
          switch (moduleKey) {
            case 'registry': {
              const cards = await extendedStorageService.getExtendedCards();
              exportData.modules.registry = cards;
              break;
            }

            case 'portfolio':
              // Данные портфеля (если есть сервис)
              exportData.modules.portfolio = [];
              break;

            case 'collateral-dossier':
              // Данные досье (если есть сервис)
              exportData.modules['collateral-dossier'] = [];
              break;

            case 'collateral-conclusions':
              // Данные заключений (если есть сервис)
              exportData.modules['collateral-conclusions'] = [];
              break;

            case 'tasks':
              // Данные задач (если есть сервис)
              exportData.modules.tasks = [];
              break;

            case 'kpi':
              // Данные KPI (если есть сервис)
              exportData.modules.kpi = [];
              break;

            case 'reports':
              // Данные отчетов (если есть сервис)
              exportData.modules.reports = [];
              break;

            case 'insurance':
              // Данные страхования (если есть сервис)
              exportData.modules.insurance = [];
              break;

            case 'fnp':
              // Данные ФНП (если есть сервис)
              exportData.modules.fnp = [];
              break;

            case 'analytics':
              // Данные аналитики (если есть сервис)
              exportData.modules.analytics = [];
              break;

            case 'credit-risk':
              // Данные рисков (если есть сервис)
              exportData.modules['credit-risk'] = [];
              break;

            case 'appraisal':
              // Данные оценок (если есть сервис)
              exportData.modules.appraisal = [];
              break;

            case 'cms-check':
              // Данные CMS Check (если есть сервис)
              exportData.modules['cms-check'] = [];
              break;

            case 'egrn':
              // Данные ЕГРН (если есть сервис)
              exportData.modules.egrn = [];
              break;

            case 'monitoring':
              // Данные мониторинга (если есть сервис)
              exportData.modules.monitoring = [];
              break;

            case 'employees': {
              const employees = employeeService.getEmployees();
              exportData.modules.employees = employees;
              break;
            }

            case 'reference-data': {
              const dictionaries = referenceDataService.getDictionaries();
              exportData.modules['reference-data'] = dictionaries;
              break;
            }

            case 'settings': {
              const settings = await extendedStorageService.getSettings();
              exportData.modules.settings = settings;
              break;
            }
          }
        } catch (error) {
          console.error(`Ошибка выгрузки модуля ${moduleKey}:`, error);
          message.warning(`Не удалось выгрузить данные модуля "${MODULE_OPTIONS.find(m => m.key === moduleKey)?.label}"`);
        }
      }

      // Создаем JSON файл
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cms-migration-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success(`Данные успешно выгружены. Выбрано модулей: ${modules.length}`);
      onClose();
    } catch (error) {
      console.error('Ошибка выгрузки данных:', error);
      message.error('Ошибка при выгрузке данных');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined />
          <span>Выгрузить форму для миграции</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button key="select-all" onClick={handleSelectAll}>
          Выбрать все
        </Button>,
        <Button key="deselect-all" onClick={handleDeselectAll}>
          Снять все
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleExport}
        >
          Выгрузить
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Выберите модули CMS, данные из которых необходимо выгрузить. 
            Будет создан JSON файл с данными выбранных модулей.
          </Text>
        </div>

        <Divider />

        <Form.Item
          name="modules"
          rules={[
            {
              validator: (_, value) => {
                if (!value || value.length === 0) {
                  return Promise.reject(new Error('Выберите хотя бы один модуль'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Checkbox.Group
            value={selectedModules}
            onChange={(checkedValues) => {
              setSelectedModules(checkedValues as string[]);
              form.setFieldsValue({ modules: checkedValues });
            }}
            style={{ width: '100%' }}
          >
            <Row gutter={[16, 16]}>
              {MODULE_OPTIONS.map((module) => (
                <Col xs={24} sm={12} lg={8} key={module.key}>
                  <Checkbox value={module.key} style={{ width: '100%' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{module.label}</div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {module.description}
                      </div>
                    </div>
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>

        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f2f5', borderRadius: 4 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Выбрано модулей: <strong>{selectedModules.length}</strong> из {MODULE_OPTIONS.length}
          </Text>
        </div>
      </Form>
    </Modal>
  );
};

export default ExportMigrationForm;

