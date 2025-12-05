import React from 'react';
import { Tabs } from 'antd';
import WorkflowDashboard from './WorkflowDashboard';
import WorkflowPipeline from './WorkflowPipeline';

const WorkflowPage: React.FC = () => {
  return (
    <Tabs
      defaultActiveKey="pipeline"
      items={[
        { key: 'dashboard', label: 'Dashboard', children: <WorkflowDashboard /> },
        { key: 'pipeline', label: 'Pipeline', children: <WorkflowPipeline /> },
      ]}
    />
  );
};

export default WorkflowPage;

