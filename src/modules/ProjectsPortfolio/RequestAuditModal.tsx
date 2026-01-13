import React, { useMemo } from 'react';
import { Button, Form, Input, Modal, Select, Typography } from 'antd';
import { CONTACT_EMAIL } from './marketingContent';
import type { MarketingCopy } from './i18n';

type Props = {
  open: boolean;
  onClose: () => void;
  copy: MarketingCopy;
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

export const RequestAuditModal: React.FC<Props> = ({ open, onClose, copy }) => {
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
      title={copy.auditModal.title}
      destroyOnClose
    >
      <Typography.Paragraph style={{ marginTop: 0, color: 'rgba(0,0,0,0.7)' }}>
        {copy.auditModal.intro}
      </Typography.Paragraph>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          label={copy.auditModal.name.label}
          name="name"
          rules={[{ required: true, message: copy.auditModal.name.required }]}
        >
          <Input placeholder={copy.auditModal.name.placeholder} />
        </Form.Item>

        <Form.Item
          label={copy.auditModal.company.label}
          name="company"
          rules={[{ required: true, message: copy.auditModal.company.required }]}
        >
          <Input placeholder={copy.auditModal.company.placeholder} />
        </Form.Item>

        <Form.Item label={copy.auditModal.role.label} name="role">
          <Select allowClear placeholder={copy.auditModal.role.placeholder} options={ROLE_OPTIONS} />
        </Form.Item>

        <Form.Item
          label={copy.auditModal.email.label}
          name="email"
          rules={[
            { required: true, message: copy.auditModal.email.required },
            { type: 'email', message: copy.auditModal.email.invalid },
          ]}
        >
          <Input placeholder={copy.auditModal.email.placeholder} />
        </Form.Item>

        <Form.Item label={copy.auditModal.phone.label} name="phone">
          <Input placeholder={copy.auditModal.phone.placeholder} />
        </Form.Item>

        <Form.Item
          label={copy.auditModal.goal.label}
          name="goal"
          rules={[{ required: true, message: copy.auditModal.goal.required }]}
        >
          <Input.TextArea
            autoSize={{ minRows: 4, maxRows: 10 }}
            placeholder={copy.auditModal.goal.placeholder}
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>{copy.cta.cancel}</Button>
          <Button type="primary" htmlType="submit">
            {copy.cta.send}
          </Button>
        </div>
      </Form>

      <Typography.Paragraph style={{ marginTop: 16, color: 'rgba(0,0,0,0.55)' }}>
        {copy.auditModal.direct} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </Typography.Paragraph>
    </Modal>
  );
};

