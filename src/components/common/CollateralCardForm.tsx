import React, { useState, useEffect } from 'react';
import { Tabs, Form, Input, Select, Button, Space, message } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import type { ExtendedCollateralCard, ObjectTypeKey, Partner, Document, Address, CharacteristicsValues } from '@/types';
import ObjectTypeSelector from './ObjectTypeSelector';
import PartnerManager from './PartnerManager';
import AddressInput from './AddressInput';
import DynamicCharacteristicsForm from './DynamicCharacteristicsForm';
import DocumentManager from './DocumentManager';
import { getObjectTypeKey } from '@/utils/extendedClassification';
import { generateId } from '@/utils/helpers';

interface CollateralCardFormProps {
  initialValues?: Partial<ExtendedCollateralCard>;
  onSubmit: (values: ExtendedCollateralCard) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CollateralCardForm: React.FC<CollateralCardFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [cbCode, setCbCode] = useState<number>(initialValues?.cbCode || 0);
  const [objectTypeKey, setObjectTypeKey] = useState<ObjectTypeKey | null>(null);
  
  // Состояния для вкладок
  const [partners, setPartners] = useState<Partner[]>(initialValues?.partners || []);
  const [address, setAddress] = useState<Address | undefined>(initialValues?.address);
  const [characteristics, setCharacteristics] = useState<CharacteristicsValues>(initialValues?.characteristics || {});
  const [documents, setDocuments] = useState<Document[]>(initialValues?.documents || []);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      
      // Определяем ObjectTypeKey из классификации
      if (initialValues.classification) {
        const key = getObjectTypeKey(
          initialValues.classification.level1,
          initialValues.classification.level2
        );
        setObjectTypeKey(key);
      }
    }
  }, [initialValues, form]);

  const handleClassificationChange = (classification: any, code: number) => {
    form.setFieldsValue({ classification });
    setCbCode(code);

    // Определяем тип объекта для характеристик
    const key = getObjectTypeKey(classification.level1, classification.level2);
    setObjectTypeKey(key);

    // Если тип изменился, очищаем характеристики
    if (key !== objectTypeKey) {
      setCharacteristics({});
      form.setFieldsValue({ characteristics: {} });
    }
  };

  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      const now = new Date();

      const cardData: ExtendedCollateralCard = {
        id: initialValues?.id || generateId(),
        ...values,
        cbCode,
        partners,
        address: address || undefined,
        characteristics,
        documents,
        createdAt: initialValues?.createdAt || now,
        updatedAt: now,
      };

      onSubmit(cardData);
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Пожалуйста, заполните все обязательные поля');
    }
  };

  const tabItems = [
    {
      key: '1',
      label: 'Основная информация',
      children: (
        <div>
          <Form.Item
            name="number"
            label="Номер карточки"
            rules={[{ required: true, message: 'Введите номер карточки' }]}
          >
            <Input placeholder="Например: КО-2024-001" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Название объекта"
            rules={[{ required: true, message: 'Введите название объекта' }]}
          >
            <Input placeholder="Краткое описание объекта" />
          </Form.Item>

          <Form.Item
            name="mainCategory"
            label="Основная категория"
            rules={[{ required: true, message: 'Выберите категорию' }]}
          >
            <Select placeholder="Выберите категорию">
              <Select.Option value="real_estate">Недвижимость</Select.Option>
              <Select.Option value="movable">Движимое имущество</Select.Option>
              <Select.Option value="property_rights">Имущественные права</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="classification"
            label="Классификация объекта"
            rules={[
              {
                validator: async (_, value) => {
                  if (!value || !value.level0 || !value.level1 || !value.level2) {
                    return Promise.reject(new Error('Заполните все уровни классификации'));
                  }
                  if (cbCode === 0) {
                    return Promise.reject(new Error('Некорректная комбинация классификации'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <ObjectTypeSelector onChange={handleClassificationChange} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Статус"
            initialValue="editing"
          >
            <Select>
              <Select.Option value="editing">Редактирование</Select.Option>
              <Select.Option value="approved">Утвержден</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={4} placeholder="Подробное описание объекта" />
          </Form.Item>

          <Form.Item name="notes" label="Примечания">
            <Input.TextArea rows={3} placeholder="Дополнительные заметки" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '2',
      label: 'Партнеры',
      children: (
        <div>
          <p style={{ marginBottom: 16, color: '#666' }}>
            Добавьте информацию о собственниках, залогодателях и других участниках сделки
          </p>
          <PartnerManager value={partners} onChange={setPartners} />
        </div>
      ),
    },
    {
      key: '3',
      label: 'Адрес',
      children: (
        <div>
          <p style={{ marginBottom: 16, color: '#666' }}>
            Укажите местоположение объекта. Используйте автозаполнение DaData для точности адреса.
          </p>
          <AddressInput 
            value={address} 
            onChange={setAddress}
            useDaData={true}
            showGeoPicker={false}
          />
        </div>
      ),
    },
    {
      key: '4',
      label: 'Характеристики',
      children: (
        <div>
          <p style={{ marginBottom: 16, color: '#666' }}>
            Характеристики объекта определяются автоматически на основе выбранного типа
          </p>
          <DynamicCharacteristicsForm
            objectType={objectTypeKey}
            value={characteristics}
            onChange={setCharacteristics}
            form={form}
          />
        </div>
      ),
    },
    {
      key: '5',
      label: 'Документы',
      children: (
        <div>
          <p style={{ marginBottom: 16, color: '#666' }}>
            Загрузите сканы документов, фотографии и другие файлы
          </p>
          <DocumentManager value={documents} onChange={setDocuments} />
        </div>
      ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ minHeight: '500px' }}
      />

      <div style={{ marginTop: 24, textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
        <Space>
          <Button onClick={onCancel} icon={<CloseOutlined />}>
            Отмена
          </Button>
          <Button
            type="primary"
            onClick={handleFinish}
            loading={loading}
            icon={<SaveOutlined />}
          >
            {initialValues ? 'Сохранить изменения' : 'Создать карточку'}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default CollateralCardForm;

