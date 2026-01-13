import React, { useMemo } from 'react';
import { Button, Form, Input, Modal, Select, Typography } from 'antd';
import { CONTACT_EMAIL } from './marketingContent';

type Props = {
  open: boolean;
  onClose: () => void;
};

type AuditRequestForm = {
  name: string;
  company: string;
  role?: string;
  email: string;
  phone?: string;
  goal: string;
};

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Собственник' },
  { value: 'ceo', label: 'CEO' },
  { value: 'coo', label: 'COO / операционный директор' },
  { value: 'cfo', label: 'CFO / финдиректор' },
  { value: 'it', label: 'IT / Digital' },
  { value: 'other', label: 'Другое' },
];

export const RequestAuditModal: React.FC<Props> = ({ open, onClose }) => {
  const [form] = Form.useForm<AuditRequestForm>();

  const mailToBase = useMemo(() => {
    const subject = encodeURIComponent('Запрос: аудит процессов');
    return { to: CONTACT_EMAIL, subject };
  }, []);

  const handleSubmit = async (values: AuditRequestForm) => {
    const lines = [
      `Имя: ${values.name}`,
      `Компания: ${values.company}`,
      `Роль: ${values.role ?? '—'}`,
      `Email: ${values.email}`,
      `Телефон: ${values.phone ?? '—'}`,
      '',
      'Цель / контекст:',
      values.goal,
    ];
    const body = encodeURIComponent(lines.join('\n'));
    const href = `mailto:${mailToBase.to}?subject=${mailToBase.subject}&body=${body}`;

    // Пытаемся открыть почтовый клиент.
    window.location.href = href;
    onClose();
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Получить аудит процессов"
      destroyOnClose
    >
      <Typography.Paragraph style={{ marginTop: 0, color: 'rgba(0,0,0,0.7)' }}>
        Коротко опишите ситуацию — мы вернёмся с вопросами и предложим формат аудита, сроки и
        ожидаемый эффект.
      </Typography.Paragraph>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          label="Имя"
          name="name"
          rules={[{ required: true, message: 'Укажите имя' }]}
        >
          <Input placeholder="Иван" />
        </Form.Item>

        <Form.Item
          label="Компания"
          name="company"
          rules={[{ required: true, message: 'Укажите компанию' }]}
        >
          <Input placeholder="ООО «Компания»" />
        </Form.Item>

        <Form.Item label="Роль" name="role">
          <Select allowClear placeholder="Выберите" options={ROLE_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Укажите email' },
            { type: 'email', message: 'Некорректный email' },
          ]}
        >
          <Input placeholder="name@company.ru" />
        </Form.Item>

        <Form.Item label="Телефон" name="phone">
          <Input placeholder="+7 ..." />
        </Form.Item>

        <Form.Item
          label="Что хотите улучшить (цель, процесс, боль)"
          name="goal"
          rules={[{ required: true, message: 'Опишите цель' }]}
        >
          <Input.TextArea
            autoSize={{ minRows: 4, maxRows: 10 }}
            placeholder="Например: сократить цикл обработки заявок, снизить ручной ввод, получить прозрачные KPI для COO..."
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="primary" htmlType="submit">
            Отправить
          </Button>
        </div>
      </Form>

      <Typography.Paragraph style={{ marginTop: 16, color: 'rgba(0,0,0,0.55)' }}>
        Если удобнее — напишите напрямую: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </Typography.Paragraph>
    </Modal>
  );
};

