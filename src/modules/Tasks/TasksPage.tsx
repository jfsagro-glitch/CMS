import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import './TasksPage.css';

const TasksPage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setLoading(false);
    };

    iframe.addEventListener('load', handleLoad);

    // Устанавливаем путь к Zadachnik
    const base = import.meta.env.BASE_URL ?? '/';
    const zadachnikPath = `${base}zadachnik/index.html`;
    iframe.src = zadachnikPath;

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, []);

  return (
    <div className="tasks-page">
      {loading && (
        <div className="tasks-loading">
          <Spin size="large" tip="Загрузка системы задач..." />
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="tasks-iframe"
        title="ЗАДАЧНИК - Система управления задачами"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default TasksPage;

