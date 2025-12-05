import React, { useMemo } from 'react';
import { Card, Col, Row, Statistic, Progress, List, Tag } from 'antd';
import { useAppSelector } from '@/store/hooks';
import { WORKFLOW_STAGES } from './stages';

const WorkflowDashboard: React.FC = () => {
  const cases = useAppSelector(state => state.workflow.cases);

  const stageCounts = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach(c => {
      map[c.stage] = (map[c.stage] || 0) + 1;
    });
    return map;
  }, [cases]);

  const activeTasks = useMemo(
    () =>
      cases
        .filter(c => c.stage !== 'COMPLETED' && c.stage !== 'CANCELLED')
        .slice(0, 5)
        .map(c => ({
          title: c.objectName,
          stage: c.stage,
          deadline: c.deadline,
          manager: c.manager || 'Не назначен',
        })),
    [cases]
  );

  const avgDuration = 45; // заглушка, пока нет реальных расчётов
  const totalRecovered = cases
    .filter(c => c.stage === 'COMPLETED')
    .reduce((acc, c) => acc + (c.appraisedValue || 0) * 0.8, 0);

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card title="Средний срок реализации">
            <Statistic value={avgDuration} suffix="дней" />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card title="Активных кейсов">
            <Statistic value={cases.length} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card title="Завершено">
            <Statistic value={stageCounts.COMPLETED || 0} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card title="Возвращено средств (оценка)">
            <Statistic value={totalRecovered} suffix="₽" precision={0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Воронка этапов">
            <List
              dataSource={WORKFLOW_STAGES}
              renderItem={stage => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{stage.title}</span>
                        <Tag>{stageCounts[stage.key] || 0}</Tag>
                      </div>
                    }
                    description={stage.description}
                  />
                  <Progress
                    percent={Math.min(100, (stageCounts[stage.key] || 0) * 10)}
                    size="small"
                    showInfo={false}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Ближайшие дедлайны">
            <List
              dataSource={activeTasks}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={`Этап: ${item.stage}. Менеджер: ${item.manager}`}
                  />
                  <div>{item.deadline ? new Date(item.deadline).toLocaleDateString() : '—'}</div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WorkflowDashboard;

