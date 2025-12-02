import React, { useEffect } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Card,
  Row,
  Col,
} from 'antd';
import { AppraisalCompany } from '@/types/AppraisalCompany';
import dayjs from 'dayjs';

interface AppraisalCompanyFormProps {
  initialValues?: Partial<AppraisalCompany>;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

const { TextArea } = Input;

export const AppraisalCompanyForm: React.FC<AppraisalCompanyFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        licenseDate: initialValues.licenseDate ? dayjs(initialValues.licenseDate) : null,
        licenseExpiryDate: initialValues.licenseExpiryDate
          ? dayjs(initialValues.licenseExpiryDate)
          : null,
        accreditationDate: initialValues.accreditationDate
          ? dayjs(initialValues.accreditationDate)
          : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: 'active',
      });
    }
  }, [initialValues, form]);

  const handleFinish = (values: any) => {
    const formattedValues = {
      ...values,
      licenseDate: values.licenseDate ? values.licenseDate.toISOString() : null,
      licenseExpiryDate: values.licenseExpiryDate ? values.licenseExpiryDate.toISOString() : null,
      accreditationDate: values.accreditationDate ? values.accreditationDate.toISOString() : null,
    };
    onSubmit(formattedValues);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} disabled={loading}>
      <Card title="Основная информация" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Наименование компании"
              rules={[{ required: true, message: 'Введите наименование компании' }]}
            >
              <Input placeholder="ООО &quot;Название компании&quot;" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="Статус аккредитации">
              <Select>
                <Select.Option value="active">Активна</Select.Option>
                <Select.Option value="suspended">Приостановлена</Select.Option>
                <Select.Option value="revoked">Отозвана</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="inn" label="ИНН">
              <Input placeholder="1234567890" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="ogrn" label="ОГРН">
              <Input placeholder="1234567890123" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="accreditationDate" label="Дата аккредитации">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Контактная информация" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="address" label="Адрес">
              <TextArea rows={2} placeholder="Полный адрес компании" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="phone" label="Телефон">
                  <Input placeholder="+7 (999) 123-45-67" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="email" label="Email">
                  <Input placeholder="info@company.ru" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="director" label="Руководитель">
              <Input placeholder="ФИО руководителя" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Лицензия" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="licenseNumber" label="Номер лицензии">
              <Input placeholder="№ лицензии" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="licenseDate" label="Дата выдачи">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="licenseExpiryDate" label="Дата окончания">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Дополнительная информация" size="small" style={{ marginBottom: 16 }}>
        <Form.Item name="notes" label="Примечания">
          <TextArea rows={4} placeholder="Дополнительная информация о компании" />
        </Form.Item>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onCancel}>Отмена</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Сохранить
        </Button>
      </div>
    </Form>
  );
};

