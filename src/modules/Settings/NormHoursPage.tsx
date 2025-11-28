import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  InputNumber,
  message,
  Tag,
  Row,
  Col,
  Statistic,
  Divider,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { TASK_NORM_HOURS, WORK_HOURS_PER_MONTH, WORK_HOURS_PER_DAY, WORK_DAYS_PER_MONTH } from '@/utils/workloadCalculator';
import './NormHoursPage.css';

const { Title, Text } = Typography;

interface NormHoursRecord {
  key: string;
  functionName: string;
  normHours: number;
  description: string;
}

const NormHoursPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<NormHoursRecord[]>([]);

  useEffect(() => {
    loadNormHours();
  }, []);

  const loadNormHours = () => {
    try {
      // Загружаем нормочасы из localStorage или используем значения по умолчанию
      const saved = localStorage.getItem('norm_hours_settings');
      const savedData = saved ? JSON.parse(saved) : null;

      const data: NormHoursRecord[] = Object.entries(TASK_NORM_HOURS).map(([key, hours]) => {
        const descriptions: Record<string, string> = {
          'Подготовка СЗ': 'Подготовка одного заключения с одним объектом',
          'Подготовка СЗ (2 объекта)': 'Подготовка заключения с двумя объектами',
          'Подготовка СЗ (АЗС)': 'Подготовка заключения для АЗС',
          'Оценка': 'Проведение оценки объекта',
          'Экспертиза': 'Проведение экспертизы',
          'Рецензия': 'Рецензирование документов',
          'ПРКК': 'Проверка рисков',
          'Мониторинг': 'Мониторинг объекта',
          'Осмотр': 'Осмотр объекта',
          'Проверка документов': 'Проверка комплектности документов',
          'Согласование': 'Согласование документов',
          'Контроль качества': 'Контроль качества работы',
          'Отчетность': 'Подготовка отчетности',
          'Прочее': 'Прочие задачи',
        };

        return {
          key,
          functionName: key,
          normHours: savedData?.[key] ?? hours,
          description: descriptions[key] || '—',
        };
      });

      setDataSource(data);
    } catch (error) {
      console.error('Ошибка загрузки нормочасов:', error);
      message.error('Ошибка загрузки нормочасов');
    }
  };

  const handleSave = (key: string, value: number) => {
    const newData = dataSource.map(item => {
      if (item.key === key) {
        return { ...item, normHours: value };
      }
      return item;
    });
    setDataSource(newData);
    setEditingKey(null);
  };

  const handleSaveAll = () => {
    try {
      setLoading(true);
      const settings: Record<string, number> = {};
      dataSource.forEach(item => {
        settings[item.key] = item.normHours;
      });
      localStorage.setItem('norm_hours_settings', JSON.stringify(settings));
      message.success('Нормочасы успешно сохранены');
    } catch (error) {
      console.error('Ошибка сохранения нормочасов:', error);
      message.error('Ошибка сохранения нормочасов');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const newData = dataSource.map(item => ({
      ...item,
      normHours: TASK_NORM_HOURS[item.key] || 2,
    }));
    setDataSource(newData);
    message.info('Нормочасы сброшены к значениям по умолчанию');
  };

  const columns: ColumnsType<NormHoursRecord> = [
    {
      title: 'Функция',
      dataIndex: 'functionName',
      key: 'functionName',
      width: 250,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Нормочасы',
      dataIndex: 'normHours',
      key: 'normHours',
      width: 200,
      align: 'center',
      render: (value: number, record: NormHoursRecord) => {
        const isEditing = editingKey === record.key;
        if (isEditing) {
          return (
            <Space>
              <InputNumber
                min={0.5}
                max={100}
                step={0.5}
                value={value}
                onChange={(val) => {
                  if (val !== null) {
                    handleSave(record.key, val);
                  }
                }}
                onPressEnter={() => setEditingKey(null)}
                autoFocus
                style={{ width: 100 }}
              />
              <Text type="secondary">часов</Text>
            </Space>
          );
        }
        return (
          <Space>
            <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
              {value} ч
            </Tag>
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => setEditingKey(record.key)}
            />
          </Space>
        );
      },
    },
    {
      title: 'В рабочих днях',
      key: 'workDays',
      width: 150,
      align: 'center',
      render: (_, record: NormHoursRecord) => {
        const workDays = (record.normHours / WORK_HOURS_PER_DAY).toFixed(1);
        return <Text type="secondary">{workDays} дн.</Text>;
      },
    },
  ];

  const totalNormHours = dataSource.reduce((sum, item) => sum + item.normHours, 0);
  const avgNormHours = dataSource.length > 0 ? (totalNormHours / dataSource.length).toFixed(1) : '0';

  return (
    <div className="norm-hours-page" style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              Нормочасы по функциям
            </Title>
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              Управление нормочасами для расчета загрузки сотрудников
            </Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Сбросить
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAll} loading={loading}>
              Сохранить
            </Button>
          </Space>
        </div>

        <Divider />

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Statistic
              title="Рабочих часов в день"
              value={WORK_HOURS_PER_DAY}
              suffix="ч"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Рабочих дней в месяце"
              value={WORK_DAYS_PER_MONTH}
              suffix="дн"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Рабочих часов в месяц"
              value={WORK_HOURS_PER_MONTH}
              suffix="ч"
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12}>
            <Statistic
              title="Среднее нормочасов на функцию"
              value={avgNormHours}
              suffix="ч"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Statistic
              title="Всего нормочасов (сумма)"
              value={totalNormHours.toFixed(1)}
              suffix="ч"
              valueStyle={{ color: '#eb2f96' }}
            />
          </Col>
        </Row>

        <Divider />

        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          size="middle"
          rowKey="key"
        />

        <div style={{ marginTop: 24, padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <strong>Примечание:</strong> Изменения вступят в силу после сохранения. Нормочасы используются для расчета
            загрузки сотрудников при генерации задач и в аналитике KPI. Для расчета загрузки используется формула:{' '}
            <code>Загрузка (%) = (Сумма нормочасов задач в работе / Рабочих часов в месяц) × 100%</code>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default NormHoursPage;

