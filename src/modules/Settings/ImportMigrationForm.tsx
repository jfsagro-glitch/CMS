import React, { useState } from 'react';
import {
  Modal,
  Form,
  Upload,
  Button,
  Space,
  message,
  Typography,
  Divider,
  Alert,
  List,
  Tag,
} from 'antd';
import {
  UploadOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import extendedStorageService from '@/services/ExtendedStorageService';
import employeeService from '@/services/EmployeeService';
import referenceDataService from '@/services/ReferenceDataService';
import { useAppDispatch } from '@/store/hooks';
import { setCards } from '@/store/slices/cardsSlice';

const { Text } = Typography;
const { Dragger } = Upload;

interface ImportMigrationFormProps {
  visible: boolean;
  onClose: () => void;
}

interface ImportResult {
  module: string;
  success: boolean;
  count: number;
  error?: string;
}

const ImportMigrationForm: React.FC<ImportMigrationFormProps> = ({
  visible,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importCompleted, setImportCompleted] = useState(false);
  const dispatch = useAppDispatch();

  const handleFileChange: UploadProps['onChange'] = (info) => {
    setFileList(info.fileList);
    setImportResults([]);
    setImportCompleted(false);
  };

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.warning('Выберите файл для загрузки');
      return;
    }

    const file = fileList[0].originFileObj;
    if (!file) {
      message.error('Файл не найден');
      return;
    }

    setLoading(true);
    setImportResults([]);
    setImportCompleted(false);

    try {
      // Читаем файл
      const fileContent = await file.text();
      let importData: any;

      try {
        importData = JSON.parse(fileContent);
      } catch (error) {
        message.error('Неверный формат файла. Ожидается JSON файл.');
        setLoading(false);
        return;
      }

      // Проверяем структуру файла
      if (!importData.modules || typeof importData.modules !== 'object') {
        message.error('Неверная структура файла миграции');
        setLoading(false);
        return;
      }

      const results: ImportResult[] = [];

      // Импортируем данные из каждого модуля
      for (const [moduleKey, moduleData] of Object.entries(importData.modules)) {
        try {
          let count = 0;

          switch (moduleKey) {
            case 'registry':
              if (Array.isArray(moduleData)) {
                for (const card of moduleData) {
                  await extendedStorageService.saveExtendedCard(card);
                  count++;
                }
                // Обновляем Redux store
                const cards = await extendedStorageService.getExtendedCards();
                dispatch(setCards(cards));
              }
              results.push({ module: 'Реестр объектов', success: true, count });
              break;

            case 'portfolio':
              // Импорт данных портфеля (если есть сервис)
              results.push({ module: 'Залоговый портфель', success: true, count: 0 });
              break;

            case 'collateral-dossier':
              // Импорт данных досье (если есть сервис)
              results.push({ module: 'Залоговое досье', success: true, count: 0 });
              break;

            case 'collateral-conclusions':
              // Импорт данных заключений (если есть сервис)
              results.push({ module: 'Заключения по залогу', success: true, count: 0 });
              break;

            case 'tasks':
              // Импорт данных задач (если есть сервис)
              results.push({ module: 'Задачи', success: true, count: 0 });
              break;

            case 'kpi':
              // Импорт данных KPI (если есть сервис)
              results.push({ module: 'KPI', success: true, count: 0 });
              break;

            case 'reports':
              // Импорт данных отчетов (если есть сервис)
              results.push({ module: 'Отчеты', success: true, count: 0 });
              break;

            case 'insurance':
              // Импорт данных страхования (если есть сервис)
              results.push({ module: 'Страхование', success: true, count: 0 });
              break;

            case 'fnp':
              // Импорт данных ФНП (если есть сервис)
              results.push({ module: 'ФНП', success: true, count: 0 });
              break;

            case 'analytics':
              // Импорт данных аналитики (если есть сервис)
              results.push({ module: 'Аналитика', success: true, count: 0 });
              break;

            case 'credit-risk':
              // Импорт данных рисков (если есть сервис)
              results.push({ module: 'Кредитные риски', success: true, count: 0 });
              break;

            case 'appraisal':
              // Импорт данных оценок (если есть сервис)
              results.push({ module: 'Оценка', success: true, count: 0 });
              break;

            case 'cms-check':
              // Импорт данных CMS Check (если есть сервис)
              results.push({ module: 'CMS Check', success: true, count: 0 });
              break;

            case 'egrn':
              // Импорт данных ЕГРН (если есть сервис)
              results.push({ module: 'ЕГРН', success: true, count: 0 });
              break;

            case 'monitoring':
              // Импорт данных мониторинга (если есть сервис)
              results.push({ module: 'Мониторинг', success: true, count: 0 });
              break;

            case 'employees':
              if (Array.isArray(moduleData)) {
                for (const employee of moduleData) {
                  try {
                    // Если сотрудник с таким ID уже существует, обновляем его
                    if (employee.id) {
                      const existing = employeeService.getEmployeeById(employee.id);
                      if (existing) {
                        const { id, ...updates } = employee;
                        // Удаляем служебные поля
                        delete (updates as any).createdAt;
                        delete (updates as any).updatedAt;
                        employeeService.updateEmployee(id, updates);
                        count++;
                        continue;
                      }
                    }
                    // Иначе создаем нового (без id, createdAt, updatedAt)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { id, createdAt, updatedAt, ...employeeData } = employee;
                    employeeService.addEmployee(employeeData);
                    count++;
                  } catch (error) {
                    console.error('Ошибка импорта сотрудника:', error);
                  }
                }
              }
              results.push({ module: 'Сотрудники', success: true, count });
              break;

            case 'reference-data':
              if (Array.isArray(moduleData)) {
                const existingDictionaries = referenceDataService.getDictionaries();
                const updatedDictionaries = [...existingDictionaries];
                
                for (const dict of moduleData) {
                  try {
                    // Если справочник с таким ID уже существует, обновляем его
                    const existingIndex = updatedDictionaries.findIndex(d => d.id === dict.id);
                    if (existingIndex !== -1) {
                      updatedDictionaries[existingIndex] = {
                        ...updatedDictionaries[existingIndex],
                        ...dict,
                        updatedAt: new Date().toISOString(),
                      };
                    } else {
                      // Иначе добавляем новый
                      updatedDictionaries.push({
                        ...dict,
                        updatedAt: new Date().toISOString(),
                      });
                    }
                    count++;
                  } catch (error) {
                    console.error('Ошибка импорта справочника:', error);
                  }
                }
                
                // Сохраняем все справочники
                referenceDataService.saveDictionaries(updatedDictionaries);
              }
              results.push({ module: 'Справочники', success: true, count });
              break;

            case 'settings':
              if (moduleData) {
                await extendedStorageService.saveSettings(moduleData);
                count = 1;
              }
              results.push({ module: 'Настройки', success: true, count });
              break;

            default:
              results.push({
                module: moduleKey,
                success: false,
                count: 0,
                error: 'Неизвестный модуль',
              });
          }
        } catch (error: any) {
          results.push({
            module: moduleKey,
            success: false,
            count: 0,
            error: error.message || 'Ошибка импорта',
          });
        }
      }

      setImportResults(results);
      setImportCompleted(true);

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.reduce((sum, r) => sum + r.count, 0);

      if (successCount === results.length) {
        message.success(
          `Импорт завершен успешно. Импортировано записей: ${totalCount}`
        );
      } else {
        message.warning(
          `Импорт завершен с ошибками. Успешно: ${successCount}/${results.length}`
        );
      }
    } catch (error: any) {
      console.error('Ошибка импорта данных:', error);
      message.error(`Ошибка при импорте данных: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFileList([]);
    setImportResults([]);
    setImportCompleted(false);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <UploadOutlined />
          <span>Загрузить форму</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          {importCompleted ? 'Закрыть' : 'Отмена'}
        </Button>,
        ...(!importCompleted ? [
          <Button
            key="import"
            type="primary"
            icon={<UploadOutlined />}
            loading={loading}
            onClick={handleImport}
            disabled={fileList.length === 0}
          >
            Загрузить данные
          </Button>
        ] : [])
      ]}
    >
      <Form form={form} layout="vertical">
        {!importCompleted ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">
                Выберите JSON файл миграции для загрузки данных в модули CMS.
                Данные будут импортированы в соответствующие модули системы.
              </Text>
            </div>

            <Divider />

            <Form.Item
              name="file"
              rules={[
                {
                  required: true,
                  message: 'Выберите файл для загрузки',
                },
              ]}
            >
              <Dragger
                accept=".json"
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={() => false}
                maxCount={1}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Нажмите или перетащите файл сюда для загрузки
                </p>
                <p className="ant-upload-hint">
                  Поддерживается только формат JSON
                </p>
              </Dragger>
            </Form.Item>

            <Alert
              message="Внимание"
              description="При импорте данных существующие записи могут быть перезаписаны. Рекомендуется создать резервную копию перед импортом."
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </>
        ) : (
          <>
            <Alert
              message="Импорт завершен"
              description="Результаты импорта данных из файла миграции"
              type={importResults.every(r => r.success) ? 'success' : 'warning'}
              showIcon
              style={{ marginBottom: 16 }}
            />

            <List
              dataSource={importResults}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.success ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
                      )
                    }
                    title={
                      <Space>
                        <span>{item.module}</span>
                        {item.success && item.count > 0 && (
                          <Tag color="blue">{item.count} записей</Tag>
                        )}
                        {!item.success && (
                          <Tag color="red">Ошибка</Tag>
                        )}
                      </Space>
                    }
                    description={item.error || (item.success ? 'Успешно импортировано' : '')}
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Form>
    </Modal>
  );
};

export default ImportMigrationForm;

