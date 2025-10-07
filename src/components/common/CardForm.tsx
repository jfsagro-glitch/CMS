import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Space, Divider } from 'antd';
import ObjectTypeSelector from './ObjectTypeSelector';
import type { CollateralCard, RealEstateHierarchy } from '@/types';

interface CardFormProps {
  initialValues?: Partial<CollateralCard>;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CardForm: React.FC<CardFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [cbCode, setCbCode] = React.useState<number>(initialValues?.cbCode || 0);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleClassificationChange = (classification: RealEstateHierarchy, code: number) => {
    form.setFieldsValue({ classification });
    setCbCode(code);
  };

  const handleFinish = (values: any) => {
    onSubmit({
      ...values,
      cbCode,
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={initialValues}
    >
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
        <Input placeholder="Например: Офисное помещение, ул. Ленина, д. 1" />
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

      <Divider>Классификация объекта</Divider>

      <Form.Item
        name="classification"
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

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? 'Сохранить' : 'Создать'}
          </Button>
          <Button onClick={onCancel}>
            Отмена
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default CardForm;

