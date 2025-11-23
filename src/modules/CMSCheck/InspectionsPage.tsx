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
  Divider,
} from 'antd';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { Inspection, InspectionType, InspectionStatus, ConditionRating, InspectorType } from '@/types/inspection';
import type { ExtendedCollateralCard } from '@/types';
import inspectionService from '@/services/InspectionService';
import employeeService from '@/services/EmployeeService';
import extendedStorageService from '@/services/ExtendedStorageService';
import InspectionCardModal from '@/components/InspectionCardModal/InspectionCardModal';
import dayjs from 'dayjs';

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
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingInspectionId, setViewingInspectionId] = useState<string | null>(null);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [form] = Form.useForm();
  const [inspectorType, setInspectorType] = useState<InspectorType>('employee');
  const [collateralCards, setCollateralCards] = useState<ExtendedCollateralCard[]>([]);
  const [filters, setFilters] = useState<{
    status?: InspectionStatus;
    type?: InspectionType;
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  }>({});

  useEffect(() => {
    loadCollateralCards();
  }, []);

  const loadCollateralCards = async () => {
    try {
      const cards = await extendedStorageService.getExtendedCards();
      setCollateralCards(cards);
    } catch (error) {
      console.error('Ошибка загрузки карточек:', error);
    }
  };

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
    setInspectorType('employee');
    form.resetFields();
    form.setFieldsValue({ inspectorType: 'employee' });
    setModalVisible(true);
  };

  const handleView = (inspection: Inspection) => {
    console.log('Opening inspection modal for:', inspection.id);
    console.log('Current viewModalVisible before:', viewModalVisible);
    setViewingInspectionId(inspection.id);
    setViewModalVisible(true);
    console.log('Set viewModalVisible to true, viewingInspectionId:', inspection.id);
    // Принудительно обновляем состояние
    setTimeout(() => {
      console.log('After timeout - viewModalVisible should be true');
    }, 0);
  };

  const handleEdit = (inspection: Inspection) => {
    setEditingInspection(inspection);
    form.setFieldsValue({
      ...inspection,
      inspectionDate: inspection.inspectionDate ? dayjs(inspection.inspectionDate) : undefined,
      inspectionMethod: inspection.inspectionMethod || 'Визуальный осмотр',
      propertyPresence: inspection.propertyPresence || 'Наличие имущества подтверждается',
      propertyCondition: inspection.propertyCondition || 'Имущество в сохранности, перепланировок/переоборудований не выявлено, эксплуатируется по назначению',
      storageConditions: inspection.storageConditions || 'Условия хранения/эксплуатации частично соблюдаются (уточнения в Приложении 1)',
      conclusions: inspection.conclusions || undefined,
      proposals: inspection.proposals || '-',
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
      const now = new Date();
      const currentUser = 'Система'; // TODO: Получить из контекста пользователя
      
      const inspectionData: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'> = {
        ...values,
        inspectionType: values.inspectionType as InspectionType,
        status: values.status as InspectionStatus || 'scheduled',
        inspectionDate: values.inspectionDate ? values.inspectionDate.toDate() : now,
        inspectorType: values.inspectorType || 'employee',
        inspectorName: values.inspectorName || '',
        inspectorId: values.inspectorId || undefined,
        inspectorPhone: values.inspectorPhone || undefined,
        inspectorEmail: values.inspectorEmail || undefined,
        clientPhone: values.clientPhone || undefined,
        clientEmail: values.clientEmail || undefined,
        collateralCardId: values.collateralCardId || '',
        collateralName: values.collateralName || '',
        address: values.address || undefined,
        condition: values.condition as ConditionRating,
        // Поля акта проверки
        inspectionMethod: values.inspectionMethod || 'Визуальный осмотр',
        propertyPresence: values.propertyPresence || 'Наличие имущества подтверждается',
        propertyCondition: values.propertyCondition || 'Имущество в сохранности, перепланировок/переоборудований не выявлено, эксплуатируется по назначению',
        storageConditions: values.storageConditions || 'Условия хранения/эксплуатации частично соблюдаются (уточнения в Приложении 1)',
        conclusions: values.conclusions || undefined,
        proposals: values.proposals || '-',
        photos: editingInspection?.photos || [],
        defects: editingInspection?.defects || [],
        recommendations: editingInspection?.recommendations || [],
        history: editingInspection?.history || [{
          id: `hist-${Date.now()}`,
          date: now,
          action: 'created',
          user: currentUser,
          userRole: 'creator',
          comment: 'Осмотр создан',
          status: values.status as InspectionStatus || 'scheduled',
        }],
        createdByUser: editingInspection?.createdByUser || currentUser,
      };

      if (editingInspection) {
        await inspectionService.updateInspection(editingInspection.id, inspectionData);
        message.success('Осмотр обновлен');
      } else {
        const inspectionId = await inspectionService.createInspection(inspectionData);
        
        // Если клиент - генерируем ссылку и отправляем
        if (values.inspectorType === 'client' && values.clientEmail) {
          const link = await inspectionService.generateClientLink(inspectionId);
          // TODO: Отправить email с ссылкой
          message.success(`Осмотр создан. Ссылка для клиента: ${link}`);
        } else {
          message.success('Осмотр создан');
        }
      }

      setModalVisible(false);
      form.resetFields();
      setInspectorType('employee');
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
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            size="small"
          >
            Просмотр
          </Button>
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
          onRow={(record) => ({
            onDoubleClick: () => {
              console.log('Double click on inspection:', record.id);
              handleView(record);
            },
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <InspectionCardModal
        visible={viewModalVisible}
        inspectionId={viewingInspectionId}
        onClose={() => {
          console.log('Closing inspection modal');
          setViewModalVisible(false);
          setViewingInspectionId(null);
        }}
        onApprove={async (id) => {
          await inspectionService.approveInspection(id, 'Система');
          message.success('Осмотр согласован');
          loadInspections();
        }}
        onRequestRevision={async (id, comment) => {
          await inspectionService.requestRevision(id, 'Система', comment);
          message.success('Запрошена доработка');
          loadInspections();
        }}
      />

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
            <Select 
              placeholder="Выберите тип осмотра"
              onChange={(value) => {
                const typeLabel = INSPECTION_TYPES.find(t => t.value === value)?.label || '';
                form.setFieldsValue({ inspectionTypeLabel: typeLabel });
              }}
            >
              {INSPECTION_TYPES.map((t) => (
                <Select.Option key={t.value} value={t.value}>
                  {t.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="collateralCardId"
            label="Объект залога"
            rules={[{ required: true, message: 'Выберите объект залога' }]}
          >
            <Select
              placeholder="Выберите объект залога"
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value) => {
                const card = collateralCards.find(c => c.id === value);
                if (card) {
                  // Получаем данные о залогодателе и заемщике
                  const pledgor = card.partners?.find(p => p.role === 'pledgor');
                  const borrower = card.partners?.find(p => p.role === 'owner');
                  
                  const pledgorName = pledgor
                    ? pledgor.type === 'legal'
                      ? pledgor.organizationName || ''
                      : `${pledgor.lastName || ''} ${pledgor.firstName || ''} ${pledgor.middleName || ''}`.trim()
                    : '';
                  
                  const borrowerName = borrower
                    ? borrower.type === 'legal'
                      ? borrower.organizationName || ''
                      : `${borrower.lastName || ''} ${borrower.firstName || ''} ${borrower.middleName || ''}`.trim()
                    : '';

                  // Получаем данные о договорах
                  const pledgeContractNumber = card.pledgeContractId || card.characteristics?.pledgeContractNumber || '';
                  const pledgeContractDate = card.characteristics?.pledgeContractDate 
                    ? dayjs(card.characteristics.pledgeContractDate).format('DD.MM.YYYY')
                    : '';
                  const loanContractNumber = card.loanContractId || card.characteristics?.loanContractNumber || '';
                  const loanContractDate = card.characteristics?.loanContractDate
                    ? dayjs(card.characteristics.loanContractDate).format('DD.MM.YYYY')
                    : '';

                  form.setFieldsValue({
                    collateralName: card.name,
                    address: card.address ? 
                      `${card.address.city || ''} ${card.address.street || ''} ${card.address.house || ''}`.trim() :
                      undefined,
                    pledgorName,
                    borrowerName,
                    pledgeContractNumber,
                    pledgeContractDate,
                    loanContractNumber,
                    loanContractDate,
                  });
                }
              }}
            >
              {collateralCards.map((card) => (
                <Select.Option
                  key={card.id}
                  value={card.id}
                  label={card.name}
                >
                  {card.name} ({card.number})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="collateralName"
            label="Название объекта"
            rules={[{ required: true, message: 'Введите название объекта' }]}
          >
            <Input placeholder="Название объекта залога" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Адрес"
          >
            <Input placeholder="Адрес объекта" />
          </Form.Item>

          <Form.Item
            name="inspectionDate"
            label="Дата осмотра"
            rules={[{ required: true, message: 'Выберите дату осмотра' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} format="DD.MM.YYYY HH:mm" />
          </Form.Item>

          <Form.Item
            name="inspectorType"
            label="Исполнитель"
            rules={[{ required: true, message: 'Выберите тип исполнителя' }]}
          >
            <Select 
              placeholder="Выберите тип исполнителя"
              onChange={(value) => {
                setInspectorType(value);
                form.setFieldsValue({
                  inspectorId: undefined,
                  inspectorName: undefined,
                  inspectorPhone: undefined,
                  inspectorEmail: undefined,
                  clientPhone: undefined,
                  clientEmail: undefined,
                });
              }}
            >
              <Select.Option value="employee">Сотрудник банка</Select.Option>
              <Select.Option value="client">Клиент</Select.Option>
            </Select>
          </Form.Item>

          {inspectorType === 'employee' ? (
            <>
              <Form.Item
                name="inspectorId"
                label="Сотрудник"
                rules={[{ required: true, message: 'Выберите сотрудника' }]}
              >
                <Select
                  placeholder="Выберите сотрудника"
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    const employee = employeeService.getEmployeeById(value);
                    if (employee) {
                      form.setFieldsValue({
                        inspectorName: `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim(),
                        inspectorPhone: employee.phone,
                        inspectorEmail: employee.email,
                      });
                    }
                  }}
                >
                  {employeeService.getEmployees()
                    .filter(emp => emp.isActive)
                    .map((emp) => (
                      <Select.Option
                        key={emp.id}
                        value={emp.id}
                        label={`${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim()}
                      >
                        {`${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim()} - {emp.position}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
              <Form.Item name="inspectorName" label="ФИО инспектора" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="inspectorPhone" label="Телефон" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="inspectorEmail" label="Email" hidden>
                <Input />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="inspectorName"
                label="ФИО клиента"
                rules={[{ required: true, message: 'Введите ФИО клиента' }]}
              >
                <Input placeholder="ФИО клиента" />
              </Form.Item>
              <Form.Item
                name="clientPhone"
                label="Телефон клиента"
                rules={[{ required: true, message: 'Введите телефон клиента' }]}
              >
                <Input placeholder="+7 (___) ___-__-__" />
              </Form.Item>
              <Form.Item
                name="clientEmail"
                label="Email клиента"
                rules={[
                  { required: true, message: 'Введите email клиента' },
                  { type: 'email', message: 'Введите корректный email' },
                ]}
              >
                <Input placeholder="email@example.com" />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="status"
            label="Статус"
            initialValue="scheduled"
          >
            <Select placeholder="Выберите статус">
              {INSPECTION_STATUSES.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left">Данные акта проверки наличия и состояния залога</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pledgorName"
                label="Наименование Залогодателя"
              >
                <Input 
                  placeholder="Автоматически из карточки залога" 
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="borrowerName"
                label="Наименование Заемщика"
              >
                <Input 
                  placeholder="Автоматически из карточки залога" 
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pledgeContractNumber"
                label="Номер договора залога"
              >
                <Input 
                  placeholder="Автоматически из карточки залога" 
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pledgeContractDate"
                label="Дата договора залога"
              >
                <Input 
                  placeholder="Автоматически из карточки залога" 
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="loanContractNumber"
                label="Номер кредитного договора"
              >
                <Input 
                  placeholder="Автоматически из карточки залога" 
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="loanContractDate"
                label="Дата кредитного договора"
              >
                <Input 
                  placeholder="Автоматически из карточки залога" 
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="inspectionMethod"
                label="Способ проверки"
                initialValue="Визуальный осмотр"
                rules={[{ required: true, message: 'Укажите способ проверки' }]}
              >
                <Select placeholder="Выберите способ проверки">
                  <Select.Option value="Визуальный осмотр">Визуальный осмотр</Select.Option>
                  <Select.Option value="Инструментальный осмотр">Инструментальный осмотр</Select.Option>
                  <Select.Option value="Экспертиза">Экспертиза</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="inspectionTypeLabel"
                label="Тип осмотра"
              >
                <Input 
                  placeholder="Автоматически из типа осмотра" 
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="propertyPresence"
            label="Наличие заложенного имущества"
            initialValue="Наличие имущества подтверждается"
            rules={[{ required: true, message: 'Укажите наличие имущества' }]}
          >
            <Select placeholder="Выберите вариант">
              <Select.Option value="Наличие имущества подтверждается">Наличие имущества подтверждается</Select.Option>
              <Select.Option value="Наличие имущества не подтверждается">Наличие имущества не подтверждается</Select.Option>
              <Select.Option value="Имущество частично отсутствует">Имущество частично отсутствует</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="propertyCondition"
            label="Состояние заложенного имущества"
            initialValue="Имущество в сохранности, перепланировок/переоборудований не выявлено, эксплуатируется по назначению"
            rules={[{ required: true, message: 'Опишите состояние имущества' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Имущество в сохранности, перепланировок/переоборудований не выявлено, эксплуатируется по назначению" 
            />
          </Form.Item>

          <Form.Item
            name="storageConditions"
            label="Соответствие условий хранения/эксплуатации заложенного имущества"
            initialValue="Условия хранения/эксплуатации частично соблюдаются (уточнения в Приложении 1)"
            rules={[{ required: true, message: 'Опишите условия хранения/эксплуатации' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Условия хранения/эксплуатации частично соблюдаются (уточнения в Приложении 1)" 
            />
          </Form.Item>

          <Form.Item
            name="conclusions"
            label="Выводы"
            rules={[{ required: true, message: 'Укажите выводы' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Имущество соответствует требованиям для принятия в залог" 
            />
          </Form.Item>

          <Form.Item
            name="proposals"
            label="Предложения"
            initialValue="-"
          >
            <TextArea 
              rows={2} 
              placeholder="Предложения по улучшению состояния имущества или условий его хранения" 
            />
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

