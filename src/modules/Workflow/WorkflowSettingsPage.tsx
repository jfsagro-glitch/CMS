import React, { useState } from 'react';
import { Card, List, Tag, Typography, Modal, Form, Input, Select, Button, Space, message } from 'antd';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { WORKFLOW_STAGES } from './stages';
import { updateTemplate } from '@/store/slices/workflowSlice';

const { Title, Paragraph, Text } = Typography;

const WorkflowSettingsPage: React.FC = () => {
  const templates = useAppSelector(state => state.workflow.templates);
  const dispatch = useAppDispatch();
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const startEdit = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (!tpl) return;
    form.setFieldsValue(tpl);
    setEditingTemplateId(tplId);
  };

  const saveEdit = () => {
    form
      .validateFields()
      .then(values => {
        const updated = {
          ...values,
          id: editingTemplateId!,
          updatedAt: new Date().toISOString(),
        };
        dispatch(updateTemplate(updated));
        setEditingTemplateId(null);
        message.success('Шаблон обновлён');
      })
      .catch(() => {});
  };

  return (
    <div style={{ padding: 16 }}>
      <Title level={3} style={{ marginBottom: 12 }}>
        Настройки Workflow
      </Title>

      <Card title="Этапы и чеклисты" style={{ marginBottom: 16 }}>
        <List
          dataSource={WORKFLOW_STAGES}
          renderItem={stage => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{stage.title}</span>
                    <Tag>{stage.key}</Tag>
                  </div>
                }
                description={
                  <div>
                    <Paragraph style={{ marginBottom: 4 }}>{stage.description}</Paragraph>
                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                      {stage.checklist.map(item => (
                        <li key={item}>
                          <Text>{item}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Card title="Шаблоны документов workflow">
        <List
          dataSource={templates}
          renderItem={tpl => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{tpl.name}</span>
                    <Tag>{tpl.type}</Tag>
                  </div>
                }
                description={
                  <div>
                    <Paragraph style={{ marginBottom: 4 }}>
                      {tpl.description || 'Описание не задано'}
                    </Paragraph>
                    <Text type="secondary">
                      Обновлён: {new Date(tpl.updatedAt).toLocaleDateString()}
                    </Text>
                  </div>
                }
              />
              <Space>
                <Button size="small" onClick={() => startEdit(tpl.id)}>
                  Редактировать
                </Button>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="Редактирование шаблона"
        open={Boolean(editingTemplateId)}
        onOk={saveEdit}
        onCancel={() => setEditingTemplateId(null)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Тип" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'notification', label: 'Уведомление' },
                { value: 'claim', label: 'Претензия' },
                { value: 'agreement', label: 'Соглашение' },
                { value: 'sale-contract', label: 'ДКП' },
                { value: 'other', label: 'Другое' },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkflowSettingsPage;
