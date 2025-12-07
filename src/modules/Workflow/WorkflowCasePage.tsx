import React, { useMemo, useEffect, useState } from 'react';
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
import {
  updateCaseStage,
  updateCaseDocuments,
  updateCaseSegment,
} from '@/store/slices/workflowSlice';
import extendedStorageService from '@/services/ExtendedStorageService';
import type { TaskDB } from '@/services/ExtendedStorageService';
import type { ExtendedCollateralCard } from '@/types';
import { renderWorkflowTemplate } from '@/utils/workflowTemplates';

const { Title, Paragraph, Text } = Typography;

const WorkflowCasePage: React.FC = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { cases, segments, templates } = useAppSelector(state => state.workflow);
  const current = useMemo(() => cases.find(c => c.id === id), [cases, id]);
  const [caseTasks, setCaseTasks] = useState<TaskDB[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [docForm] = Form.useForm();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [generating, setGenerating] = useState(false);

  const loadTasks = async () => {
    setTasksLoading(true);
    try {
      const all = await extendedStorageService.getTasks();
      if (current) {
        setCaseTasks(all.filter(t => t.workflowCaseId === current.id));
      } else {
        setCaseTasks([]);
      }
    } catch (error) {
      console.warn('Не удалось загрузить задачи workflow:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  if (!current) {
    return <Alert type="warning" message="Кейс не найден" />;
  }

  const stageMeta = WORKFLOW_STAGES.find(s => s.key === current.stage);
  const stageOrder = WORKFLOW_STAGES.map(s => s.key);
  const idx = stageOrder.indexOf(current.stage);
  const prevStage = idx > 0 ? stageOrder[idx - 1] : null;
  const nextStage = idx >= 0 && idx < stageOrder.length - 1 ? stageOrder[idx + 1] : null;

  const createTaskForStage = async ({
    stage,
    title,
    description,
    priority = 'medium',
    dueInDays = 3,
  }: {
    stage: string;
    title: string;
    description: string;
    priority?: TaskDB['priority'];
    dueInDays?: number;
  }) => {
    const now = new Date();
    const task: TaskDB = {
      id: `task-wf-${current.id}-${stage}-${now.getTime()}`,
      region: current.assetType || '—',
      type: `workflow-${stage.toLowerCase()}`,
      title,
      description,
      priority: priority as TaskDB['priority'],
      dueDate: new Date(now.getTime() + dueInDays * 24 * 3600 * 1000).toISOString(),
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
      workflowCaseId: current.id,
    };
    await extendedStorageService.saveTask(task);
  };

  const changeStage = async (stage: string, comment: string) => {
    dispatch(
      updateCaseStage({
        id: current.id,
        stage: stage as any,
        comment,
        user: 'Система',
      })
    );

    // Триггеры задач по этапам
    try {
      if (stage === 'PREPARATION') {
        await createTaskForStage({
          stage,
          title: `Подготовить пакет документов по ${current.objectName}`,
          description: `Workflow кейс ${current.id} на этапе PREPARATION. Собрать уведомления/претензии.`,
          priority: 'high',
          dueInDays: 2,
        });
      }
      if (stage === 'NEGOTIATION') {
        await createTaskForStage({
          stage,
          title: `Переговоры с должником/залогодателем по ${current.objectName}`,
          description: `Workflow кейс ${current.id} на этапе NEGOTIATION. Зафиксировать предложения, скидку/рассрочку.`,
          priority: 'high',
          dueInDays: 3,
        });
      }
      if (stage === 'APPROVAL') {
        await createTaskForStage({
          stage,
          title: `Согласование условий сделки по ${current.objectName}`,
          description: `Workflow кейс ${current.id} на этапе APPROVAL. Визы руководства/юрблока.`,
          priority: 'high',
          dueInDays: 3,
        });
      }
      if (stage === 'AGREEMENT') {
        await createTaskForStage({
          stage,
          title: `Договор/отступное по ${current.objectName}`,
          description: `Workflow кейс ${current.id} на этапе AGREEMENT. Подготовить/подписать договор.`,
          priority: 'high',
          dueInDays: 5,
        });
      }
      if (stage === 'SALE') {
        await createTaskForStage({
          stage,
          title: `Фиксация сделки и расчётов по ${current.objectName}`,
          description: `Workflow кейс ${current.id} на этапе SALE. Ввести покупателя, сумму, дату.`,
          priority: 'medium',
          dueInDays: 5,
        });
      }
      if (stage === 'COMPLETED') {
        await createTaskForStage({
          stage,
          title: `Снятие обременения / закрытие кейса ${current.objectName}`,
          description: `Workflow кейс ${current.id} завершён. Создать задачу на снятие обременения, обновить досье.`,
          priority: 'high',
          dueInDays: 5,
        });
      }
      await loadTasks();
      message.success(`Этап изменён на ${stage}. Задачи созданы (если требуются).`);
    } catch (error) {
      console.warn('Не удалось создать задачи для workflow:', error);
      message.warning(`Этап изменён на ${stage}, но часть задач не создалась`);
    }

    // Сообщение по умолчанию (если задач не было)
    if (
      !['PREPARATION', 'NEGOTIATION', 'APPROVAL', 'AGREEMENT', 'SALE', 'COMPLETED'].includes(stage)
    ) {
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
          <Button
            type="primary"
            onClick={() => changeStage(nextStage, 'Перевод на следующий этап')}
          >
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
              <Descriptions.Item label="Сегмент должника">
                <Select
                  size="small"
                  style={{ minWidth: 220 }}
                  placeholder="Выберите сегмент"
                  value={current.segmentId}
                  onChange={value =>
                    dispatch(
                      updateCaseSegment({
                        id: current.id,
                        segmentId: value,
                      })
                    )
                  }
                  allowClear
                  options={segments.map(seg => ({
                    value: seg.id,
                    label: seg.name,
                  }))}
                />
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
            <Space style={{ marginBottom: 8 }} wrap>
              <Select
                placeholder="Выберите шаблон для генерации"
                style={{ minWidth: 260 }}
                value={selectedTemplateId}
                onChange={value => setSelectedTemplateId(value)}
                options={templates.map(t => ({
                  value: t.id,
                  label: t.name,
                }))}
              />
              <Button
                type="primary"
                disabled={!selectedTemplateId}
                loading={generating}
                onClick={async () => {
                  if (!selectedTemplateId) return;
                  const tpl = templates.find(t => t.id === selectedTemplateId);
                  if (!tpl) return;
                  try {
                    setGenerating(true);
                    const card = (await extendedStorageService.getExtendedCardById(
                      current.objectId
                    )) as ExtendedCollateralCard | undefined;
                    const content = renderWorkflowTemplate(tpl, current, card || null, {});
                    const encoded = encodeURIComponent(content);
                    const url = `data:text/plain;charset=utf-8,${encoded}`;
                    const docName = `${tpl.name} от ${new Date()
                      .toLocaleDateString('ru-RU')
                      .replace(/\./g, '-')}`;

                    const newDoc = {
                      id: `doc-${Date.now()}`,
                      name: docName,
                      type: tpl.type,
                      url,
                      createdAt: new Date().toISOString(),
                    };

                    // Обновляем кейс
                    const updatedDocs = [...current.documents, newDoc];
                    dispatch(
                      updateCaseDocuments({
                        id: current.id,
                        documents: updatedDocs,
                      })
                    );

                    // Сохраняем в залоговое досье
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
                            size: content.length,
                            mimeType: 'text/plain',
                            uploadDate: new Date(),
                            description: `Сгенерировано в Workflow по шаблону "${tpl.name}"`,
                            fileData: content,
                          },
                        ],
                      };
                      await extendedStorageService.saveExtendedCard(updatedCard);
                    }

                    message.success(`Документ по шаблону "${tpl.name}" сгенерирован`);
                  } catch (error) {
                    console.error('Ошибка генерации документа workflow:', error);
                    message.error('Не удалось сгенерировать документ по шаблону');
                  } finally {
                    setGenerating(false);
                  }
                }}
              >
                Сгенерировать документ
              </Button>
            </Space>
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

          <Card title="Связанные задачи (workflow)" style={{ marginTop: 16 }}>
            {tasksLoading ? (
              <Text type="secondary">Загрузка задач...</Text>
            ) : caseTasks.length === 0 ? (
              <Text type="secondary">Задач ещё нет</Text>
            ) : (
              <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                {caseTasks.map(t => (
                  <li key={t.id}>
                    <Text strong>{t.title}</Text> — <Text type="secondary">{t.status}</Text>
                    <br />
                    <Text type="secondary">
                      До: {new Date(t.dueDate).toLocaleDateString()} · {t.description}
                    </Text>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WorkflowCasePage;
