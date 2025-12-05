import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tag,
  Descriptions,
  Timeline,
  Alert,
  Typography,
  Divider,
  Space,
  Button,
  message,
  Form,
  Input,
  Select,
} from 'antd';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { WORKFLOW_STAGES } from './stages';
import { updateCaseStage, updateCaseDocuments } from '@/store/slices/workflowSlice';
import extendedStorageService from '@/services/ExtendedStorageService';
import type { TaskDB } from '@/services/ExtendedStorageService';
import type { ExtendedCollateralCard } from '@/types';

const { Title, Paragraph, Text } = Typography;

const WorkflowCasePage: React.FC = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const cases = useAppSelector(state => state.workflow.cases);
  const current = useMemo(() => cases.find(c => c.id === id), [cases, id]);

  if (!current) {
    return <Alert type="warning" message="Кейс не найден" />;
  }

  const stageMeta = WORKFLOW_STAGES.find(s => s.key === current.stage);
  const stageOrder = WORKFLOW_STAGES.map(s => s.key);
  const idx = stageOrder.indexOf(current.stage);
  const prevStage = idx > 0 ? stageOrder[idx - 1] : null;
  const nextStage = idx >= 0 && idx < stageOrder.length - 1 ? stageOrder[idx + 1] : null;
  const [docForm] = Form.useForm();

  const changeStage = async (stage: string, comment: string) => {
    dispatch(
      updateCaseStage({
        id: current.id,
        stage: stage as any,
        comment,
        user: 'Система',
      })
    );

    // Триггеры задач: при APPROVAL и COMPLETED создаём задачу в Zadachnik (IndexedDB)
    if (stage === 'APPROVAL' || stage === 'COMPLETED') {
      try {
        const now = new Date();
        const task: TaskDB = {
          id: `task-wf-${current.id}-${stage}-${now.getTime()}`,
          region: current.assetType || '—',
          type: stage === 'APPROVAL' ? 'workflow-approval' : 'workflow-release',
          title:
            stage === 'APPROVAL'
              ? `Согласование условий сделки по ${current.objectName}`
              : `Снятие обременения / завершение по ${current.objectName}`,
          description: `Workflow кейс ${current.id} перешёл в этап ${stage}. Источник: карточка workflow.`,
          priority: 'high',
          dueDate: new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString(),
          status: 'new',
          businessUser: 'workflow',
          businessUserName: 'Workflow',
          assignedTo: [],
          currentAssignee: null,
          currentAssigneeName: null,
          employeeId: undefined,
          documents: [],
          comments: [],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          history: [
            {
              date: now.toISOString(),
              user: 'Workflow',
              userRole: 'system',
              action: `Создано при переходе в этап ${stage}`,
              status: 'new',
            },
          ],
          category: 'workflow',
        };
        await extendedStorageService.saveTask(task);
        message.success(`Этап изменён на ${stage}. Создана задача в Zadachnik`);
      } catch (error) {
        console.warn('Не удалось создать задачу для workflow:', error);
        message.warning(`Этап изменён на ${stage}, но задачу создать не удалось`);
      }
    } else {
      message.success(`Этап изменён на ${stage}`);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Title level={3} style={{ marginBottom: 12 }}>
        {current.objectName}{' '}
        <Tag color={current.stage === 'COMPLETED' ? 'green' : 'blue'}>{current.stage}</Tag>
      </Title>

      <Space style={{ marginBottom: 12 }} wrap>
        {prevStage && (
          <Button onClick={() => changeStage(prevStage, 'Возврат на предыдущий этап из карточки')}>
            ← {prevStage}
          </Button>
        )}
        {nextStage && (
          <Button type="primary" onClick={() => changeStage(nextStage, 'Перевод на следующий этап')}>
            {nextStage} →
          </Button>
        )}
        <Button onClick={() => changeStage(current.stage, 'Зафиксировано без изменений')}>
          Обновить историю
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title="Основная информация">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Объект">{current.objectName}</Descriptions.Item>
              <Descriptions.Item label="Тип">{current.assetType}</Descriptions.Item>
              <Descriptions.Item label="Долг">
                {current.debtAmount?.toLocaleString('ru-RU') || '—'} ₽
              </Descriptions.Item>
              <Descriptions.Item label="Оценка">
                {current.appraisedValue?.toLocaleString('ru-RU') || '—'} ₽
              </Descriptions.Item>
              <Descriptions.Item label="Менеджер">
                {current.manager || 'Не назначен'}
              </Descriptions.Item>
              <Descriptions.Item label="Дедлайн">
                {current.deadline ? new Date(current.deadline).toLocaleDateString() : '—'}
              </Descriptions.Item>
            </Descriptions>
            {current.notes && (
              <Paragraph style={{ marginTop: 12 }}>
                <Text strong>Заметки: </Text>
                {current.notes}
              </Paragraph>
            )}
          </Card>

          <Card title="Документы workflow" style={{ marginTop: 16 }}>
            {current.documents.length === 0 ? (
              <Text type="secondary">Документы ещё не добавлены</Text>
            ) : (
              current.documents.map(doc => (
                <Paragraph key={doc.id} style={{ marginBottom: 8 }}>
                  <Link to={doc.url || '#'} target="_blank">
                    {doc.name}
                  </Link>{' '}
                  <Tag>{doc.type}</Tag>
                </Paragraph>
              ))
            )}
            <Divider />
            <Form
              form={docForm}
              layout="vertical"
              onFinish={async values => {
                const newDoc = {
                  id: `doc-${Date.now()}`,
                  name: values.name,
                  type: values.type,
                  url: values.url || undefined,
                  createdAt: new Date().toISOString(),
                };
                dispatch(
                  updateCaseDocuments({
                    id: current.id,
                    documents: [...current.documents, newDoc],
                  })
                );
                docForm.resetFields();
                message.success('Документ добавлен в кейс');

                // Сохраняем ссылку в залоговое досье объекта (documents в карточке)
                try {
                  const card = (await extendedStorageService.getExtendedCardById(
                    current.objectId
                  )) as ExtendedCollateralCard | undefined;
                  if (card) {
                    const existingDocs = Array.isArray(card.documents) ? card.documents : [];
                    const updatedCard: ExtendedCollateralCard = {
                      ...card,
                      documents: [
                        ...existingDocs,
                        {
                          id: newDoc.id,
                          name: newDoc.name,
                          type: newDoc.type,
                          size: 0,
                          mimeType: 'text/uri-list',
                          uploadDate: new Date(),
                          description: 'Добавлено из workflow',
                          fileData: newDoc.url,
                        },
                      ],
                    };
                    await extendedStorageService.saveExtendedCard(updatedCard);
                  }
                } catch (error) {
                  console.warn('Не удалось сохранить документ в залоговом досье:', error);
                }
              }}
            >
              <Row gutter={8}>
                <Col span={8}>
                  <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                    <Input placeholder="Напр. Уведомление" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="type" label="Тип" initialValue="workflow-doc">
                    <Select
                      options={[
                        { value: 'workflow-doc', label: 'Workflow' },
                        { value: 'notification', label: 'Уведомление' },
                        { value: 'agreement', label: 'Соглашение' },
                        { value: 'sale-contract', label: 'ДКП' },
                        { value: 'other', label: 'Другое' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item name="url" label="Ссылка (опционально)">
                    <Input placeholder="https://..." />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit">
                Добавить документ
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="Этап и чеклист" style={{ marginBottom: 16 }}>
            <Paragraph>
              <Text strong>{stageMeta?.title}</Text>
              <br />
              <Text type="secondary">{stageMeta?.description}</Text>
            </Paragraph>
            <Divider style={{ margin: '8px 0' }} />
            <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
              {stageMeta?.checklist.map(item => (
                <li key={item}>
                  <Text>{item}</Text>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="История этапов">
            <Timeline
              items={current.history.map(h => ({
                color: h.stage === 'COMPLETED' ? 'green' : 'blue',
                children: (
                  <div>
                    <Text strong>{h.stage}</Text> — {new Date(h.createdAt).toLocaleString()}
                    {h.comment && (
                      <div>
                        <Text type="secondary">{h.comment}</Text>
                      </div>
                    )}
                    <div>
                      <Text type="secondary">Исполнитель: {h.user}</Text>
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WorkflowCasePage;

