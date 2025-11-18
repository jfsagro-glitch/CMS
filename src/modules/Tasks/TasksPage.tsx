import React, { useEffect, useRef, useState } from 'react';
import { Spin, Space, Button, Typography, Divider } from 'antd';
import {
  PlusOutlined,
  BarChartOutlined,
  RobotOutlined,
  SettingOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import employeeService from '@/services/EmployeeService';
import './TasksPage.css';

const { Text } = Typography;

const TasksPage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; region: string } | null>(null);

  useEffect(() => {
    // Получаем текущего пользователя (для демо берем первого активного)
    const employees = employeeService.getEmployees();
    const activeEmployee = employees.find(emp => emp.isActive) || employees[0];
    if (activeEmployee) {
      setCurrentUser({
        name: `${activeEmployee.firstName} ${activeEmployee.lastName}`,
        role: activeEmployee.position,
        region: activeEmployee.region,
      });
    }
  }, []);

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

  const handleExportCSV = () => {
    try {
      const tasksData = JSON.parse(localStorage.getItem('zadachnik_tasks') || '[]');
      if (tasksData.length === 0) {
        alert('Нет данных для экспорта');
        return;
      }

      const headers = ['ID', 'Название', 'Статус', 'Исполнитель', 'Дата создания', 'Срок выполнения', 'Приоритет'];
      const rows = tasksData.map((task: any) => [
        task.id || '',
        task.title || task.name || '',
        task.status || '',
        task.assignee || '',
        task.createdAt || '',
        task.dueDate || '',
        task.priority || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Задачи_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Ошибка при экспорте данных');
    }
  };

  return (
    <div className="tasks-page">
      {/* Верхний тулбар */}
      <div style={{ 
        padding: '16px 24px', 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <Space size="large" split={<Divider type="vertical" />}>
          <Space>
            <Text strong>Роль:</Text>
            <Text>{currentUser?.role || 'Руководитель'}</Text>
          </Space>
          <Space>
            <Text strong>{currentUser?.region || 'Москва'}</Text>
          </Space>
          <Space>
            <UserOutlined />
            <Text>{currentUser?.name || 'Анна Руководитель'}</Text>
          </Space>
        </Space>

        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            Новая задача
          </Button>
          <Button icon={<BarChartOutlined />}>
            Аналитика
          </Button>
          <Button icon={<RobotOutlined />}>
            Автопилот
          </Button>
          <Button icon={<SettingOutlined />}>
            Настройки
          </Button>
          <Button icon={<ReloadOutlined />}>
            Обновить данные
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
            Экспорт CSV
          </Button>
        </Space>
      </div>

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

