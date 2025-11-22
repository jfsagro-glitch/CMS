/**
 * Упрощенная версия CMS Check - система дистанционных осмотров
 * Работает без бэкенда, использует IndexedDB через InspectionService
 */

import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Popconfirm,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { Inspection, InspectionType, InspectionStatus, ConditionRating } from '@/types/inspection';
import inspectionService from '@/services/InspectionService';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const INSPECTION_TYPES: { value: InspectionType; label: string }[] = [
  { value: 'primary', label: 'Первичный осмотр' },
  { value: 'periodic', label: 'Периодический осмотр' },
  { value: 'unscheduled', label: 'Внеплановый осмотр' },
  { value: 'after_repair', label: 'Осмотр после ремонта' },
  { value: 'before_loan', label: 'Осмотр перед выдачей кредита' },
  { value: 'revaluation', label: 'Осмотр при переоценке' },
  { value: 'monitoring', label: 'Осмотр при мониторинге' },
  { value: 'appraisal', label: 'Осмотр при оценке' },
];

const INSPECTION_STATUSES: { value: InspectionStatus; label: string; color: string }[] = [
  { value: 'scheduled', label: 'Запланирован', color: 'blue' },
  { value: 'in_progress', label: 'В процессе', color: 'orange' },
  { value: 'completed', label: 'Завершен', color: 'green' },
  { value: 'cancelled', label: 'Отменен', color: 'red' },
];

const CONDITIONS: { value: string; label: string; color: string }[] = [
  { value: 'excellent', label: 'Отличное', color: 'green' },
  { value: 'good', label: 'Хорошее', color: 'blue' },
  { value: 'satisfactory', label: 'Удовлетворительное', color: 'orange' },
  { value: 'poor', label: 'Плохое', color: 'red' },
  { value: 'critical', label: 'Критическое', color: 'red' },
];

const InspectionsPage: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<{
    status?: InspectionStatus;
    type?: InspectionType;
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  }>({});

  useEffect(() => {
    loadInspections();
    inspectionService.initDatabase();
  }, []);

  const loadInspections = async () => {
    setLoading(true);
    try {
      const data = await inspectionService.getInspections();
      setInspections(data);
    } catch (error) {
      console.error('Ошибка загрузки осмотров:', error);
      message.error('Не удалось загрузить осмотры');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingInspection(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (inspection: Inspection) => {
    setEditingInspection(inspection);
    form.setFieldsValue({
      ...inspection,
      inspectionDate: inspection.inspectionDate ? dayjs(inspection.inspectionDate) : undefined,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await inspectionService.deleteInspection(id);
      message.success('Осмотр удален');
      loadInspections();
    } catch (error) {
      console.error('Ошибка удаления осмотра:', error);
      message.error('Не удалось удалить осмотр');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const inspectionData = {
        ...values,
        inspectionDate: values.inspectionDate ? values.inspectionDate.toDate() : new Date(),
        photos: [],
        defects: [],
        recommendations: [],
        condition: values.condition as ConditionRating,
      };

      if (editingInspection) {
        await inspectionService.updateInspection(editingInspection.id, inspectionData);
        message.success('Осмотр обновлен');
      } else {
        await inspectionService.createInspection(inspectionData);
        message.success('Осмотр создан');
      }

      setModalVisible(false);
      form.resetFields();
      loadInspections();
    } catch (error) {
      console.error('Ошибка сохранения осмотра:', error);
      message.error('Не удалось сохранить осмотр');
    }
  };

  const getFilteredInspections = () => {
    let filtered = [...inspections];

    if (filters.status) {
      filtered = filtered.filter((i) => i.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter((i) => i.inspectionType === filters.type);
    }

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter((i) => {
        const date = dayjs(i.inspectionDate);
        return date.isAfter(start.subtract(1, 'day')) && date.isBefore(end.add(1, 'day'));
      });
    }

    return filtered;
  };

  const filteredInspections = getFilteredInspections();

  const stats = React.useMemo(() => {
    const total = inspections.length;
    const byStatus = inspections.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {} as Record<InspectionStatus, number>);
    const byType = inspections.reduce((acc, i) => {
      acc[i.inspectionType] = (acc[i.inspectionType] || 0) + 1;
      return acc;
    }, {} as Record<InspectionType, number>);

    return { total, byStatus, byType };
  }, [inspections]);

  const columns = [
    {
      title: 'Дата осмотра',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      render: (date: Date) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      sorter: (a: Inspection, b: Inspection) =>
        dayjs(a.inspectionDate).unix() - dayjs(b.inspectionDate).unix(),
    },
    {
      title: 'Тип',
      dataIndex: 'inspectionType',
      key: 'inspectionType',
      render: (type: InspectionType) => {
        const typeInfo = INSPECTION_TYPES.find((t) => t.value === type);
        return typeInfo?.label || type;
      },
    },
    {
      title: 'Инспектор',
      dataIndex: 'inspectorName',
      key: 'inspectorName',
    },
    {
      title: 'Объект',
      dataIndex: 'collateralName',
      key: 'collateralName',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: InspectionStatus) => {
        const statusInfo = INSPECTION_STATUSES.find((s) => s.value === status);
        return statusInfo ? (
          <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
        ) : (
          <Tag>{status}</Tag>
        );
      },
    },
    {
      title: 'Состояние',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition: string) => {
        const conditionInfo = CONDITIONS.find((c) => c.value === condition);
        return conditionInfo ? (
          <Tag color={conditionInfo.color}>{conditionInfo.label}</Tag>
        ) : (
          <Tag>{condition}</Tag>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Inspection) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить осмотр?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="Всего осмотров" value={stats.total} />
          </Col>
          <Col span={6}>
            <Statistic
              title="Завершено"
              value={stats.byStatus.completed || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="В процессе"
              value={stats.byStatus.in_progress || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic title="Запланировано" value={stats.byStatus.scheduled || 0} />
          </Col>
        </Row>

        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="Фильтр по статусу"
              allowClear
              style={{ width: 200 }}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              {INSPECTION_STATUSES.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.label}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Фильтр по типу"
              allowClear
              style={{ width: 200 }}
              onChange={(value) => setFilters({ ...filters, type: value })}
            >
              {INSPECTION_TYPES.map((t) => (
                <Select.Option key={t.value} value={t.value}>
                  {t.label}
                </Select.Option>
              ))}
            </Select>
            <RangePicker
              placeholder={['Дата начала', 'Дата окончания']}
              onChange={(dates) =>
                setFilters({
                  ...filters,
                  dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
                })
              }
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadInspections}>
              Обновить
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Создать осмотр
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredInspections}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingInspection ? 'Редактировать осмотр' : 'Создать осмотр'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="inspectionType"
            label="Тип осмотра"
            rules={[{ required: true, message: 'Выберите тип осмотра' }]}
          >
            <Select placeholder="Выберите тип осмотра">
              {INSPECTION_TYPES.map((t) => (
                <Select.Option key={t.value} value={t.value}>
                  {t.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="inspectionDate"
            label="Дата осмотра"
            rules={[{ required: true, message: 'Выберите дату осмотра' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} format="DD.MM.YYYY HH:mm" />
          </Form.Item>

          <Form.Item
            name="inspectorName"
            label="Инспектор"
            rules={[{ required: true, message: 'Введите имя инспектора' }]}
          >
            <Input placeholder="ФИО инспектора" />
          </Form.Item>

          <Form.Item
            name="inspectorId"
            label="ID инспектора"
            rules={[{ required: true, message: 'Введите ID инспектора' }]}
          >
            <Input placeholder="ID инспектора" />
          </Form.Item>

          <Form.Item
            name="collateralCardId"
            label="ID карточки залога"
            rules={[{ required: true, message: 'Введите ID карточки залога' }]}
          >
            <Input placeholder="ID карточки залога" />
          </Form.Item>

          <Form.Item
            name="collateralName"
            label="Название объекта"
            rules={[{ required: true, message: 'Введите название объекта' }]}
          >
            <Input placeholder="Название объекта залога" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Статус"
            rules={[{ required: true, message: 'Выберите статус' }]}
          >
            <Select placeholder="Выберите статус">
              {INSPECTION_STATUSES.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="condition"
            label="Состояние объекта"
            rules={[{ required: true, message: 'Выберите состояние' }]}
          >
            <Select placeholder="Выберите состояние">
              {CONDITIONS.map((c) => (
                <Select.Option key={c.value} value={c.value}>
                  {c.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Примечания">
            <TextArea rows={4} placeholder="Дополнительная информация" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InspectionsPage;

