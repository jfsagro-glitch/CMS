/**
 * Компонент для динамического отображения атрибутов имущества
 * в зависимости от выбранного типа
 */

import React from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Switch, Divider, Typography } from 'antd';
import type { CollateralAttribute } from '@/utils/collateralAttributesConfig';
import { getGroupedCollateralAttributes } from '@/utils/collateralAttributesConfig';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

interface CollateralAttributesFormProps {
  collateralType: string | null | undefined;
  form: any; // Ant Design Form instance
}

const CollateralAttributesForm: React.FC<CollateralAttributesFormProps> = ({ collateralType }) => {
  const groupedAttributes = getGroupedCollateralAttributes(collateralType);

  const renderFormItem = (attr: CollateralAttribute) => {
    const rules = attr.required ? [{ required: true, message: `Поле "${attr.label}" обязательно для заполнения` }] : [];

    switch (attr.type) {
      case 'text':
        return (
          <Form.Item key={attr.key} name={attr.key} label={attr.label} rules={rules}>
            <Input placeholder={attr.placeholder || attr.label} />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item key={attr.key} name={attr.key} label={attr.label} rules={rules}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder={attr.placeholder || attr.label}
              min={attr.min}
              max={attr.max}
              addonAfter={attr.unit}
            />
          </Form.Item>
        );

      case 'boolean':
        return (
          <Form.Item key={attr.key} name={attr.key} label={attr.label} valuePropName="checked">
            <Switch />
          </Form.Item>
        );

      case 'select':
        return (
          <Form.Item key={attr.key} name={attr.key} label={attr.label} rules={rules}>
            <Select placeholder={attr.placeholder || `Выберите ${attr.label.toLowerCase()}`} allowClear>
              {attr.options?.map(option => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'date':
        return (
          <Form.Item key={attr.key} name={attr.key} label={attr.label} rules={rules}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder={attr.placeholder || attr.label} />
          </Form.Item>
        );

      case 'textarea':
        return (
          <Form.Item key={attr.key} name={attr.key} label={attr.label} rules={rules}>
            <TextArea rows={3} placeholder={attr.placeholder || attr.label} />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  if (!collateralType || Object.keys(groupedAttributes).length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        Выберите тип имущества для отображения атрибутов
      </div>
    );
  }

  return (
    <div>
      {Object.entries(groupedAttributes).map(([groupName, attributes]) => (
        <div key={groupName} style={{ marginBottom: '24px' }}>
          <Divider orientation="left">
            <Title level={5} style={{ margin: 0 }}>
              {groupName}
            </Title>
          </Divider>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {attributes.map(attr => renderFormItem(attr))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollateralAttributesForm;

