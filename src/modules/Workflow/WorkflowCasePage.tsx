import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Tag, Descriptions, Timeline, Alert, Typography, Divider } from 'antd';
import { useAppSelector } from '@/store/hooks';
import { WORKFLOW_STAGES } from './stages';

const { Title, Paragraph, Text } = Typography;

const WorkflowCasePage: React.FC = () => {
  const { id } = useParams();
  const cases = useAppSelector(state => state.workflow.cases);
  const current = useMemo(() => cases.find(c => c.id === id), [cases, id]);

  if (!current) {
    return <Alert type="warning" message="Кейс не найден" />;
  }

  const stageMeta = WORKFLOW_STAGES.find(s => s.key === current.stage);

  return (
    <div style={{ padding: 16 }}>
      <Title level={3} style={{ marginBottom: 12 }}>
        {current.objectName}{' '}
        <Tag color={current.stage === 'COMPLETED' ? 'green' : 'blue'}>{current.stage}</Tag>
      </Title>

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

