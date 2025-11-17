import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  DatePicker,
  Form,
  Drawer,
  Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  LinkOutlined,
  FileTextOutlined,
  InsuranceOutlined,
} from '@ant-design/icons';
import type { CreditRiskRecord, RiskEventCategory } from '@/types/creditRisk';
import { RISK_EVENTS } from '@/types/creditRisk';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './CreditRiskPage.css';

const { Title, Text } = Typography;
const { Option } = Select;

type CreditRiskRow = CreditRiskRecord & { key: string };

const CreditRiskPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [records, setRecords] = useState<CreditRiskRow[]>([]);
  const [loading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<RiskEventCategory | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CreditRiskRow | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Загрузка данных из localStorage (в будущем можно заменить на API)
  useEffect(() => {
    const loadRecords = () => {
      try {
        const stored = localStorage.getItem('creditRiskRecords');
        if (stored) {
          const data = JSON.parse(stored) as CreditRiskRecord[];
          setRecords(
            data.map((item, index) => ({
              ...item,
              key: item.id || `risk-${index}`,
            }))
          );
        }
      } catch (error) {
        console.error('Ошибка загрузки данных ФКР:', error);
        setRecords([]);
      }
    };
    loadRecords();
  }, []);

  // Сохранение данных в localStorage
  const saveRecords = (newRecords: CreditRiskRecord[]) => {
    try {
      localStorage.setItem('creditRiskRecords', JSON.stringify(newRecords));
      setRecords(
        newRecords.map((item, index) => ({
          ...item,
          key: item.id || `risk-${index}`,
        }))
      );
    } catch (error) {
      console.error('Ошибка сохранения данных ФКР:', error);
      message.error('Ошибка сохранения данных');
    }
  };

  const filteredRecords = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return records.filter(record => {
      const matchesSearch =
        !search ||
        String(record.reference).toLowerCase().includes(search) ||
        record.contractNumber?.toLowerCase().includes(search) ||
        record.pledger?.toLowerCase().includes(search) ||
        record.borrower?.toLowerCase().includes(search) ||
        record.riskEvent.name.toLowerCase().includes(search);

      const matchesStatus = !statusFilter || record.status === statusFilter;
      const matchesCategory = !categoryFilter || record.riskEvent.category === categoryFilter;
      const matchesPriority = !priorityFilter || record.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [records, searchValue, statusFilter, categoryFilter, priorityFilter]);

  const stats = useMemo(() => {
    const active = records.filter(r => r.status === 'active').length;
    const resolved = records.filter(r => r.status === 'resolved').length;
    const critical = records.filter(r => r.priority === 'critical' && r.status === 'active').length;
    const high = records.filter(r => r.priority === 'high' && r.status === 'active').length;

    return { total: records.length, active, resolved, critical, high };
  }, [records]);

  const handleCreate = () => {
    setSelectedRecord(null);
    form.resetFields();
    setCreateModalVisible(true);
  };

  const handleView = (record: CreditRiskRow) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const handleEdit = (record: CreditRiskRow) => {
    setSelectedRecord(record);
    form.setFieldsValue({
      ...record,
      eventDate: record.eventDate ? dayjs(record.eventDate) : null,
      detectionDate: record.detectionDate ? dayjs(record.detectionDate) : null,
      resolutionDate: record.resolutionDate ? dayjs(record.resolutionDate) : null,
      riskEventCode: record.riskEvent.code,
    });
    setDrawerVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      const riskEvent = RISK_EVENTS.find(e => e.code === values.riskEventCode);
      if (!riskEvent) {
        message.error('Рисковое событие не найдено');
        return;
      }

      const newRecord: CreditRiskRecord = {
        id: selectedRecord?.id || `risk-${Date.now()}`,
        reference: values.reference,
        contractNumber: values.contractNumber,
        pledger: values.pledger,
        pledgerInn: values.pledgerInn,
        borrower: values.borrower,
        borrowerInn: values.borrowerInn,
        riskEvent,
        suspensiveConditionId: values.suspensiveConditionId,
        suspensiveConditionDescription: values.suspensiveConditionDescription,
        insuranceRelated: values.insuranceRelated || false,
        insurancePolicyNumber: values.insurancePolicyNumber,
        status: values.status || 'active',
        eventDate: values.eventDate ? values.eventDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        detectionDate: values.detectionDate ? values.detectionDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        resolutionDate: values.resolutionDate ? values.resolutionDate.format('YYYY-MM-DD') : undefined,
        description: values.description,
        comments: values.comments,
        resolution: values.resolution,
        detectedBy: values.detectedBy,
        responsible: values.responsible,
        reviewer: values.reviewer,
        priority: values.priority || 'medium',
        documents: values.documents || [],
        createdAt: selectedRecord?.createdAt || dayjs().format('YYYY-MM-DD'),
        updatedAt: dayjs().format('YYYY-MM-DD'),
      };

      const updatedRecords = selectedRecord
        ? records.map(r => (r.id === selectedRecord.id ? newRecord : r))
        : [...records, newRecord];

      saveRecords(updatedRecords);
      message.success(selectedRecord ? 'Запись обновлена' : 'Запись создана');
      setDrawerVisible(false);
      setCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      message.error('Ошибка сохранения записи');
    }
  };


  const getStatusColor = (status: CreditRiskRecord['status']) => {
    switch (status) {
      case 'active':
        return 'red';
      case 'resolved':
        return 'green';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: CreditRiskRecord['priority']) => {
    switch (priority) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category: RiskEventCategory) => {
    const colors: Record<RiskEventCategory, string> = {
      collateral: 'purple',
      borrower: 'cyan',
      financial: 'gold',
      transport: 'blue',
      rating: 'orange',
      industry: 'volcano',
      legal: 'red',
    };
    return colors[category] || 'default';
  };

  const columns: ColumnsType<CreditRiskRow> = [
    {
      title: 'REFERENCE',
      dataIndex: 'reference',
      key: 'reference',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/portfolio?q=${record.reference}`)}
          icon={<LinkOutlined />}
        >
          {record.reference}
        </Button>
      ),
    },
    {
      title: 'Договор залога',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      width: 150,
    },
    {
      title: 'Залогодатель',
      dataIndex: 'pledger',
      key: 'pledger',
      width: 200,
    },
    {
      title: 'Рисковое событие',
      key: 'riskEvent',
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={getCategoryColor(record.riskEvent.category)}>
            {record.riskEvent.code}
          </Tag>
          <Text style={{ fontSize: '12px' }}>{record.riskEvent.name}</Text>
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CreditRiskRecord['status']) => {
        const labels = {
          active: 'Активен',
          resolved: 'Разрешен',
          archived: 'Архив',
        };
        return <Tag color={getStatusColor(status)}>{labels[status]}</Tag>;
      },
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: CreditRiskRecord['priority']) => {
        const labels = {
          critical: 'Критический',
          high: 'Высокий',
          medium: 'Средний',
          low: 'Низкий',
        };
        return <Tag color={getPriorityColor(priority)}>{labels[priority]}</Tag>;
      },
    },
    {
      title: 'Дата события',
      dataIndex: 'eventDate',
      key: 'eventDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Просмотр">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Редактировать">
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="credit-risk-page">
      <div className="credit-risk-page__header">
        <div>
          <Title level={2} className="credit-risk-page__title">
            Финансовый контроль рисков (ФКР)
          </Title>
          <Typography.Paragraph className="credit-risk-page__subtitle">
            Отслеживание рисковых событий и отлагательных условий по договорам залога
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Добавить рисковое событие
        </Button>
      </div>

      <Row gutter={[16, 16]} className="credit-risk-page__stats">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Всего записей" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Активных рисков"
              value={stats.active}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Критических"
              value={stats.critical}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Разрешенных"
              value={stats.resolved}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            allowClear
            placeholder="Поиск по REFERENCE, договору, залогодателю, заемщику"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            style={{ width: '100%' }}
          />
          <Space wrap>
            <Select
              allowClear
              placeholder="Статус"
              style={{ width: 150 }}
              value={statusFilter ?? undefined}
              onChange={value => setStatusFilter(value ?? null)}
            >
              <Option value="active">Активен</Option>
              <Option value="resolved">Разрешен</Option>
              <Option value="archived">Архив</Option>
            </Select>
            <Select
              allowClear
              placeholder="Категория"
              style={{ width: 200 }}
              value={categoryFilter ?? undefined}
              onChange={value => setCategoryFilter(value ?? null)}
            >
              <Option value="collateral">Обеспечение</Option>
              <Option value="borrower">Заемщик/Залогодатель</Option>
              <Option value="financial">Финансовые</Option>
              <Option value="transport">Транспорт</Option>
              <Option value="rating">Рейтинг</Option>
              <Option value="industry">Отрасль</Option>
              <Option value="legal">Юридические</Option>
            </Select>
            <Select
              allowClear
              placeholder="Приоритет"
              style={{ width: 150 }}
              value={priorityFilter ?? undefined}
              onChange={value => setPriorityFilter(value ?? null)}
            >
              <Option value="critical">Критический</Option>
              <Option value="high">Высокий</Option>
              <Option value="medium">Средний</Option>
              <Option value="low">Низкий</Option>
            </Select>
          </Space>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredRecords}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          loading={loading}
          locale={{
            emptyText: <Empty description="Нет записей" />,
          }}
        />
      </Card>

      {/* Модалка просмотра */}
      <Modal
        title="Детали рискового события"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
        width={800}
      >
        {selectedRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="REFERENCE" span={2}>
              <Button
                type="link"
                onClick={() => {
                  navigate(`/portfolio?q=${selectedRecord.reference}`);
                  setModalVisible(false);
                }}
                icon={<LinkOutlined />}
              >
                {selectedRecord.reference}
              </Button>
            </Descriptions.Item>
            <Descriptions.Item label="Договор залога">
              {selectedRecord.contractNumber || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Залогодатель">
              {selectedRecord.pledger}
            </Descriptions.Item>
            <Descriptions.Item label="Заемщик">
              {selectedRecord.borrower || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Рисковое событие" span={2}>
              <Space>
                <Tag color={getCategoryColor(selectedRecord.riskEvent.category)}>
                  {selectedRecord.riskEvent.code}
                </Tag>
                {selectedRecord.riskEvent.name}
              </Space>
            </Descriptions.Item>
            {selectedRecord.suspensiveConditionDescription && (
              <Descriptions.Item label="Отлагательное условие" span={2}>
                {selectedRecord.suspensiveConditionDescription}
              </Descriptions.Item>
            )}
            {selectedRecord.insuranceRelated && (
              <Descriptions.Item label="Страхование" span={2}>
                <Button
                  type="link"
                  onClick={() => {
                    navigate(`/insurance?ref=${selectedRecord.reference}`);
                    setModalVisible(false);
                  }}
                  icon={<InsuranceOutlined />}
                >
                  {selectedRecord.insurancePolicyNumber || 'Перейти к страхованию'}
                </Button>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Статус">
              <Tag color={getStatusColor(selectedRecord.status)}>
                {selectedRecord.status === 'active'
                  ? 'Активен'
                  : selectedRecord.status === 'resolved'
                    ? 'Разрешен'
                    : 'Архив'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Приоритет">
              <Tag color={getPriorityColor(selectedRecord.priority)}>
                {selectedRecord.priority === 'critical'
                  ? 'Критический'
                  : selectedRecord.priority === 'high'
                    ? 'Высокий'
                    : selectedRecord.priority === 'medium'
                      ? 'Средний'
                      : 'Низкий'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Дата события">
              {dayjs(selectedRecord.eventDate).format('DD.MM.YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Дата обнаружения">
              {dayjs(selectedRecord.detectionDate).format('DD.MM.YYYY')}
            </Descriptions.Item>
            {selectedRecord.resolutionDate && (
              <Descriptions.Item label="Дата разрешения">
                {dayjs(selectedRecord.resolutionDate).format('DD.MM.YYYY')}
              </Descriptions.Item>
            )}
            {selectedRecord.description && (
              <Descriptions.Item label="Описание" span={2}>
                {selectedRecord.description}
              </Descriptions.Item>
            )}
            {selectedRecord.comments && (
              <Descriptions.Item label="Комментарии" span={2}>
                {selectedRecord.comments}
              </Descriptions.Item>
            )}
            {selectedRecord.resolution && (
              <Descriptions.Item label="Способ разрешения" span={2}>
                {selectedRecord.resolution}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Drawer для создания/редактирования */}
      <Drawer
        title={selectedRecord ? 'Редактировать запись' : 'Добавить рисковое событие'}
        open={drawerVisible || createModalVisible}
        onClose={() => {
          setDrawerVisible(false);
          setCreateModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            status: 'active',
            priority: 'medium',
            eventDate: dayjs(),
            detectionDate: dayjs(),
          }}
        >
          <Form.Item
            name="reference"
            label="REFERENCE"
            rules={[{ required: true, message: 'Укажите REFERENCE' }]}
          >
            <Input placeholder="REFERENCE сделки" />
          </Form.Item>
          <Form.Item name="contractNumber" label="Договор залога">
            <Input placeholder="Номер договора залога" />
          </Form.Item>
          <Form.Item
            name="pledger"
            label="Залогодатель"
            rules={[{ required: true, message: 'Укажите залогодателя' }]}
          >
            <Input placeholder="Наименование залогодателя" />
          </Form.Item>
          <Form.Item name="pledgerInn" label="ИНН залогодателя">
            <Input placeholder="ИНН" />
          </Form.Item>
          <Form.Item name="borrower" label="Заемщик">
            <Input placeholder="Наименование заемщика" />
          </Form.Item>
          <Form.Item name="borrowerInn" label="ИНН заемщика">
            <Input placeholder="ИНН" />
          </Form.Item>
          <Form.Item
            name="riskEventCode"
            label="Рисковое событие"
            rules={[{ required: true, message: 'Выберите рисковое событие' }]}
          >
            <Select placeholder="Выберите событие" showSearch optionFilterProp="children">
              {RISK_EVENTS.map(event => (
                <Option key={event.code} value={event.code}>
                  [{event.code}] {event.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="suspensiveConditionDescription" label="Отлагательное условие">
            <Input.TextArea rows={3} placeholder="Описание отлагательного условия (если добавлено из заключения)" />
          </Form.Item>
          <Form.Item name="insuranceRelated" label="Связано со страхованием" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="insurancePolicyNumber" label="Номер полиса страхования">
            <Input placeholder="Номер полиса" />
          </Form.Item>
          <Form.Item name="status" label="Статус">
            <Select>
              <Option value="active">Активен</Option>
              <Option value="resolved">Разрешен</Option>
              <Option value="archived">Архив</Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Приоритет">
            <Select>
              <Option value="low">Низкий</Option>
              <Option value="medium">Средний</Option>
              <Option value="high">Высокий</Option>
              <Option value="critical">Критический</Option>
            </Select>
          </Form.Item>
          <Form.Item name="eventDate" label="Дата события">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="detectionDate" label="Дата обнаружения">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="resolutionDate" label="Дата разрешения">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={4} placeholder="Дополнительное описание события" />
          </Form.Item>
          <Form.Item name="comments" label="Комментарии">
            <Input.TextArea rows={3} placeholder="Комментарии" />
          </Form.Item>
          <Form.Item name="resolution" label="Способ разрешения">
            <Input.TextArea rows={3} placeholder="Как был разрешен риск" />
          </Form.Item>
          <Form.Item name="detectedBy" label="Обнаружил">
            <Input placeholder="ФИО сотрудника" />
          </Form.Item>
          <Form.Item name="responsible" label="Ответственный">
            <Input placeholder="ФИО ответственного" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedRecord ? 'Сохранить' : 'Создать'}
              </Button>
              <Button
                onClick={() => {
                  setDrawerVisible(false);
                  setCreateModalVisible(false);
                  form.resetFields();
                }}
              >
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default CreditRiskPage;

