import React, { useMemo, useState } from 'react';
import { Card, Col, Row, Tag, Button, Dropdown, MenuProps, Space, Typography } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { WORKFLOW_STAGES } from './stages';
import { updateCaseStage } from '@/store/slices/workflowSlice';
import type { WorkflowCase, WorkflowStage } from '@/types/workflow';

const { Text } = Typography;

const WorkflowPipeline: React.FC = () => {
  const dispatch = useAppDispatch();
  const cases = useAppSelector(state => state.workflow.cases);
  const [dragOverStage, setDragOverStage] = useState<WorkflowStage | null>(null);

  const grouped = useMemo(() => {
    const map: Record<WorkflowStage, WorkflowCase[]> = {
      ANALYSIS: [],
      PREPARATION: [],
      NEGOTIATION: [],
      APPROVAL: [],
      AGREEMENT: [],
      SALE: [],
      COMPLETED: [],
      CANCELLED: [],
    };
    cases.forEach(c => map[c.stage].push(c));
    return map;
  }, [cases]);

  const stageMenu = (id: string): MenuProps => ({
    items: WORKFLOW_STAGES.map(s => ({
      key: s.key,
      label: s.title,
      onClick: () => dispatch(updateCaseStage({ id, stage: s.key })),
    })),
  });

  const handleDrop = (stage: WorkflowStage, caseId: string) => {
    dispatch(updateCaseStage({ id: caseId, stage }));
  };

  const columnStyle = (stage: WorkflowStage) =>
    dragOverStage === stage
      ? { border: '1px dashed #1890ff', background: '#f0f7ff' }
      : { border: '1px solid #f0f0f0' };

  return (
    <div style={{ padding: 16 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Перетащи карточку в нужный этап или выбери этап через «Перевести»
      </Text>
      <div style={{ height: 8 }} />
      <Row gutter={[12, 12]} wrap>
        {WORKFLOW_STAGES.map(stage => (
          <Col xs={24} sm={12} md={8} lg={6} key={stage.key}>
            <Card
              title={
                <Space direction="vertical" size={0}>
                  <Text strong>{stage.title}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stage.description}
                  </Text>
                </Space>
              }
              size="small"
              bodyStyle={{ padding: 8 }}
              style={columnStyle(stage.key)}
              onDragOver={e => {
                e.preventDefault();
                setDragOverStage(stage.key);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={e => {
                e.preventDefault();
                const caseId = e.dataTransfer.getData('text/plain');
                if (caseId) {
                  handleDrop(stage.key, caseId);
                }
                setDragOverStage(null);
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {grouped[stage.key].length === 0 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Нет объектов на этом этапе
                  </Text>
                )}
                {grouped[stage.key].map(item => (
                  <Card
                    key={item.id}
                    size="small"
                    style={{ borderColor: '#f0f0f0' }}
                    title={item.objectName}
                    extra={<Tag color="blue">{item.assetType}</Tag>}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', item.id);
                      setDragOverStage(stage.key);
                    }}
                    onDragEnd={() => setDragOverStage(null)}
                  >
                    <div style={{ fontSize: 12, marginBottom: 8 }}>
                      Долг: {item.debtAmount?.toLocaleString('ru-RU') || '—'} ₽ <br />
                      Оценка: {item.appraisedValue?.toLocaleString('ru-RU') || '—'} ₽
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Менеджер:
                        </Text>{' '}
                        {item.manager || 'Не назначен'}
                      </div>
                      <Dropdown menu={stageMenu(item.id)} trigger={['click']}>
                        <Button size="small">Перевести</Button>
                      </Dropdown>
                    </div>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default WorkflowPipeline;

