import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Space,
  message,
  Typography,
  Divider,
  Alert,
  List,
  Tag,
  Progress,
} from 'antd';
import {
  UploadOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { parseBulkEditXLS, updateOrCreateRecord, type BulkEditResult } from '@/utils/bulkEditUtils';
import { useAppDispatch } from '@/store/hooks';
import { setCards } from '@/store/slices/cardsSlice';
import extendedStorageService from '@/services/ExtendedStorageService';

const { Text } = Typography;
const { Dragger } = Upload;

interface BulkEditImportFormProps {
  visible: boolean;
  onClose: () => void;
}

const BulkEditImportForm: React.FC<BulkEditImportFormProps> = ({
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [importResults, setImportResults] = useState<BulkEditResult[]>([]);
  const [importCompleted, setImportCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const dispatch = useAppDispatch();

  const handleFileChange: UploadProps['onChange'] = (info) => {
    setFileList(info.fileList);
    setImportResults([]);
    setImportCompleted(false);
    setProgress(0);
  };

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.warning('Выберите XLS файл для загрузки');
      return;
    }

    const file = fileList[0].originFileObj;
    if (!file) {
      message.error('Файл не найден');
      return;
    }

    // Проверяем расширение файла
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      message.error('Неверный формат файла. Ожидается XLS или XLSX файл.');
      return;
    }

    setLoading(true);
    setImportResults([]);
    setImportCompleted(false);
    setProgress(0);

    try {
      // Парсим XLS файл
      const rows = await parseBulkEditXLS(file);
      
      if (rows.length === 0) {
        message.warning('Файл не содержит данных');
        setLoading(false);
        return;
      }

      // Группируем по модулям
      const moduleGroups = new Map<string, typeof rows>();
      rows.forEach(row => {
        if (!moduleGroups.has(row.module)) {
          moduleGroups.set(row.module, []);
        }
        moduleGroups.get(row.module)!.push(row);
      });

      const results: BulkEditResult[] = [];
      let processed = 0;
      const total = rows.length;

      // Обрабатываем каждый модуль
      for (const [module, moduleRows] of moduleGroups.entries()) {
        const moduleResult: BulkEditResult = {
          module,
          updated: 0,
          created: 0,
          errors: [],
        };

        // Обрабатываем каждую строку модуля
        for (const row of moduleRows) {
          try {
            const result = await updateOrCreateRecord(module, row);
            if (result.success) {
              if (result.created) {
                moduleResult.created++;
              } else {
                moduleResult.updated++;
              }
            } else {
              moduleResult.errors.push(result.error || 'Неизвестная ошибка');
            }
          } catch (error: any) {
            moduleResult.errors.push(`Строка ${row.id || 'без ID'}: ${error.message || String(error)}`);
          }

          processed++;
          setProgress(Math.round((processed / total) * 100));
        }

        results.push(moduleResult);
      }

      // Обновляем Redux store для реестра
      try {
        const cards = await extendedStorageService.getExtendedCards();
        dispatch(setCards(cards));
      } catch (error) {
        console.warn('Не удалось обновить Redux store:', error);
      }

      setImportResults(results);
      setImportCompleted(true);

      const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
      const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

      if (totalErrors === 0) {
        message.success(
          `Импорт завершен: обновлено ${totalUpdated}, создано ${totalCreated} записей`
        );
      } else {
        message.warning(
          `Импорт завершен с ошибками: обновлено ${totalUpdated}, создано ${totalCreated}, ошибок: ${totalErrors}`
        );
      }
    } catch (error: any) {
      console.error('Ошибка импорта данных:', error);
      message.error(`Ошибка при импорте данных: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const getModuleLabel = (moduleKey: string): string => {
    const labels: Record<string, string> = {
      'registry': 'Реестр объектов',
      'employees': 'Сотрудники',
      'reference-data': 'Справочники',
      'cms-check': 'CMS Check',
    };
    return labels[moduleKey] || moduleKey;
  };

  return (
    <Modal
      title={
        <Space>
          <UploadOutlined />
          <span>Загрузить файл массовых изменений</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          {importCompleted ? 'Закрыть' : 'Отмена'}
        </Button>,
        <Button
          key="import"
          type="primary"
          icon={<UploadOutlined />}
          loading={loading}
          onClick={handleImport}
          disabled={fileList.length === 0 || importCompleted}
        >
          Загрузить и применить изменения
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Text type="secondary">
          Загрузите XLS файл с массовыми изменениями. Файл должен содержать колонки "Модуль" и "ID".
          Записи с существующим ID будут обновлены, записи без ID или с новым ID будут созданы.
        </Text>

        <Dragger
          fileList={fileList}
          onChange={handleFileChange}
          beforeUpload={() => false}
          accept=".xlsx,.xls"
          maxCount={1}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Нажмите или перетащите файл для загрузки</p>
          <p className="ant-upload-hint">
            Поддерживаются файлы формата XLS и XLSX
          </p>
        </Dragger>

        {loading && (
          <div>
            <Progress percent={progress} status="active" />
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Обработка данных...
            </Text>
          </div>
        )}

        {importCompleted && importResults.length > 0 && (
          <div>
            <Divider>Результаты импорта</Divider>
            <List
              dataSource={importResults}
              renderItem={(result) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{getModuleLabel(result.module)}</span>
                        {result.errors.length === 0 ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>
                            Успешно
                          </Tag>
                        ) : (
                          <Tag color="warning" icon={<CloseCircleOutlined />}>
                            С ошибками
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text>
                          Обновлено: <strong>{result.updated}</strong>, Создано: <strong>{result.created}</strong>
                        </Text>
                        {result.errors.length > 0 && (
                          <Alert
                            type="warning"
                            message="Ошибки"
                            description={
                              <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {result.errors.slice(0, 5).map((error, idx) => (
                                  <li key={idx}>{error}</li>
                                ))}
                                {result.errors.length > 5 && (
                                  <li>... и еще {result.errors.length - 5} ошибок</li>
                                )}
                              </ul>
                            }
                            style={{ marginTop: 8 }}
                          />
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default BulkEditImportForm;

