import React, { useMemo, useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Progress, List, Tag, Typography, Space } from 'antd';
import { useAppSelector } from '@/store/hooks';
import { WORKFLOW_STAGES } from './stages';
import extendedStorageService from '@/services/ExtendedStorageService';
import type { TaskDB } from '@/services/ExtendedStorageService';

const WorkflowDashboard: React.FC = () => {
  const cases = useAppSelector(state => state.workflow.cases);
  const [tasks, setTasks] = useState<TaskDB[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      setTasksLoading(true);
      try {
        const all = await extendedStorageService.getTasks();
        setTasks(all.filter(t => t.category === 'workflow'));
      } catch (error) {
        console.warn('Не удалось загрузить задачи для KPI workflow:', error);
      } finally {
        setTasksLoading(false);
      }
    };
    loadTasks();
  }, []);

  const stageCounts = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach(c => {
      map[c.stage] = (map[c.stage] || 0) + 1;
    });
    return map;
  }, [cases]);

  const activeTasks = useMemo(() => {
    return cases
      .filter(c => c.stage !== 'COMPLETED' && c.stage !== 'CANCELLED')
      .slice(0, 5)
      .map(c => ({
        title: c.objectName,
        stage: c.stage,
        deadline: c.deadline,
        manager: c.manager || 'Не назначен',
      }));
  }, [cases]);

  const avgDuration = useMemo(() => {
    if (cases.length === 0) return 0;
    const now = Date.now();
    const sumDays = cases.reduce((acc, c) => {
      const start = new Date(c.createdAt).getTime();
      return acc + Math.max(0, now - start) / (1000 * 3600 * 24);
    }, 0);
    return Math.round(sumDays / cases.length);
  }, [cases]);

  const completedCases = cases.filter(c => c.stage === 'COMPLETED');
  const totalRecovered = completedCases.reduce((acc, c) => acc + (c.appraisedValue || 0) * 0.8, 0);
  const totalAppraised = cases.reduce((acc, c) => acc + (c.appraisedValue || 0), 0);
  const efficiencyPercent =
    totalAppraised > 0 ? Math.round((totalRecovered / totalAppraised) * 100) : 0;
  const conversionRate =
    cases.length > 0 ? Math.round((completedCases.length / cases.length) * 100) : 0;

  const now = Date.now();
  const overdueTasks = tasks.filter(
    t => t.status !== 'completed' && new Date(t.dueDate).getTime() < now
  );
  const tasksByStage = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach(t => {
      const parts = t.type?.split('workflow-');
      const stage = parts && parts[1] ? parts[1].toUpperCase() : 'OTHER';
      map[stage] = (map[stage] || 0) + 1;
    });
    return map;
  }, [tasks]);
  const topTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const { Text } = Typography;

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
          <Card title="Завершено / конверсия">
            <Statistic value={`${stageCounts.COMPLETED || 0} (${conversionRate}%)`} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card title="Возвращено средств (оценка)">
            <Statistic value={totalRecovered} suffix="₽" precision={0} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card title="Эффективность по оценке">
            <Statistic value={efficiencyPercent} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card title="Задачи workflow">
            <Statistic value={tasks.length} suffix={tasksLoading ? ' (загрузка)' : ''} />
            <div style={{ marginTop: 8 }}>
              <Text type={overdueTasks.length > 0 ? 'danger' : 'secondary'}>
                Просрочено: {overdueTasks.length}
              </Text>
            </div>
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
        <Col xs={24} md={12}>
          <Card title="Задачи (workflow) — ближайшие">
            <List
              dataSource={topTasks}
              locale={{ emptyText: tasksLoading ? 'Загрузка...' : 'Нет задач' }}
              renderItem={t => (
                <List.Item>
                  <List.Item.Meta
                    title={t.title}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{t.description}</Text>
                        <Text type="secondary">
                          До: {new Date(t.dueDate).toLocaleDateString()} · Статус: {t.status}
                        </Text>
                      </Space>
                    }
                  />
                  <Tag>{t.type}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Задачи по этапам (workflow)">
            <List
              dataSource={Object.entries(tasksByStage)}
              renderItem={([stage, count]) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{stage}</Text>
                    <Tag color={stage === 'COMPLETED' ? 'green' : 'blue'}>{count}</Tag>
                  </Space>
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
