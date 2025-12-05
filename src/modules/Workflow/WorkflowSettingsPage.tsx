import React from 'react';
import { Card, List, Tag, Typography } from 'antd';
import { useAppSelector } from '@/store/hooks';
import { WORKFLOW_STAGES } from './stages';

const { Title, Paragraph, Text } = Typography;

const WorkflowSettingsPage: React.FC = () => {
  const templates = useAppSelector(state => state.workflow.templates);

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
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default WorkflowSettingsPage;
