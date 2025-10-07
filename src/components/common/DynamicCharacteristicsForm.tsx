import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Select, DatePicker, Row, Col } from 'antd';
import dayjs from 'dayjs';
import type { ObjectTypeKey, CharacteristicField, CharacteristicsValues } from '@/types';
import { getCharacteristicsConfig, OBJECT_TYPE_NAMES } from '@/utils/characteristicsConfig';

interface DynamicCharacteristicsFormProps {
  objectType: ObjectTypeKey | null;
  value?: CharacteristicsValues;
  onChange?: (value: CharacteristicsValues) => void;
  form?: any; // Ant Design Form instance
}

const DynamicCharacteristicsForm: React.FC<DynamicCharacteristicsFormProps> = ({
  objectType,
  value = {},
  onChange,
  form,
}) => {
  const fields = getCharacteristicsConfig(objectType);

  useEffect(() => {
    if (form && value) {
      // Преобразуем даты из строк в dayjs объекты
      const formValues = { ...value };
      fields.forEach(field => {
        if (field.type === 'date' && formValues[field.name]) {
          formValues[field.name] = dayjs(formValues[field.name]);
        }
      });
      form.setFieldsValue(formValues);
    }
  }, [objectType, value, form, fields]);

  const handleFieldChange = (fieldName: string, val: any) => {
    const updatedValues = { ...value, [fieldName]: val };
    onChange?.(updatedValues);
  };

  const renderField = (field: CharacteristicField) => {
    const commonProps = {
      placeholder: field.placeholder || field.label,
      disabled: false,
    };

    switch (field.type) {
      case 'number':
        return (
          <InputNumber
            {...commonProps}
            min={field.min}
            max={field.max}
            style={{ width: '100%' }}
            addonAfter={field.unit}
            onChange={val => handleFieldChange(field.name, val)}
          />
        );

      case 'boolean':
        return (
          <Switch
            checked={value[field.name]}
            onChange={val => handleFieldChange(field.name, val)}
          />
        );

      case 'select':
        return (
          <Select
            {...commonProps}
            options={field.options?.map(opt => ({ label: opt, value: opt }))}
            onChange={val => handleFieldChange(field.name, val)}
          />
        );

      case 'date':
        return (
          <DatePicker
            {...commonProps}
            style={{ width: '100%' }}
            format="DD.MM.YYYY"
            onChange={(date) => handleFieldChange(field.name, date?.toISOString())}
          />
        );

      case 'textarea':
        return (
          <Input.TextArea
            {...commonProps}
            rows={3}
            onChange={e => handleFieldChange(field.name, e.target.value)}
          />
        );

      case 'text':
      default:
        return (
          <Input
            {...commonProps}
            onChange={e => handleFieldChange(field.name, e.target.value)}
          />
        );
    }
  };

  if (!objectType) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Выберите тип объекта для отображения характеристик
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Для выбранного типа объекта характеристики не настроены
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, padding: '12px', background: '#f0f2f5', borderRadius: '6px' }}>
        <strong>Тип объекта:</strong> {OBJECT_TYPE_NAMES[objectType]}
      </div>

      <Row gutter={[16, 0]}>
        {fields.map(field => (
          <Col span={field.type === 'textarea' ? 24 : 12} key={field.name}>
            <Form.Item
              name={field.name}
              label={field.label}
              rules={[
                {
                  required: field.required,
                  message: `${field.label} обязательно для заполнения`,
                },
              ]}
              valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
            >
              {renderField(field)}
            </Form.Item>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DynamicCharacteristicsForm;

