import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Typography,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Collapse,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  ReloadOutlined,
  SearchOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import employeeService from '@/services/EmployeeService';
import type { Employee, EmployeePermission, EmployeeStatus } from '@/types/employee';
import { REGION_CENTERS } from '@/utils/regionCenters';
import { syncEmployeesToZadachnik } from '@/utils/syncEmployeesToZadachnik';
import dayjs from 'dayjs';
import './EmployeesPage.css';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

const STATUS_OPTIONS: { value: EmployeeStatus; label: string; color: string }[] = [
  { value: 'working', label: 'На работе', color: 'green' },
  { value: 'sick_leave', label: 'Больничный', color: 'orange' },
  { value: 'vacation', label: 'Отпуск', color: 'blue' },
  { value: 'business_trip', label: 'Командировка', color: 'purple' },
];

const PERMISSION_LABELS: Record<EmployeePermission, string> = {
  registry_view: 'Просмотр реестра',
  registry_edit: 'Редактирование реестра',
  portfolio_view: 'Просмотр портфеля',
  portfolio_edit: 'Редактирование портфеля',
  conclusions_view: 'Просмотр заключений',
  conclusions_edit: 'Редактирование заключений',
  tasks_view: 'Просмотр задач',
  tasks_edit: 'Редактирование задач',
  reports_view: 'Просмотр отчетов',
  reports_export: 'Экспорт отчетов',
  settings_view: 'Просмотр настроек',
  settings_edit: 'Редактирование настроек',
  admin: 'Администратор',
};

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();
  const [activeRegion, setActiveRegion] = useState<string | string[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = (showMessage = false) => {
    setLoading(true);
    try {
      // Принудительно получаем актуальные данные
      const data = employeeService.getEmployees();
      setEmployees(data);
      // Синхронизируем с zadachnik при загрузке
      syncEmployeesToZadachnik();
      if (showMessage) {
        message.success(`Загружено ${data.length} сотрудников`);
      }
    } catch (error) {
      message.error('Ошибка загрузки сотрудников');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация сотрудников по поисковому запросу
  const filteredEmployees = useMemo(() => {
    if (!searchText.trim()) return employees;

    const search = searchText.toLowerCase();
    return employees.filter(emp => {
      const fullName = `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.toLowerCase();
      const position = (emp.position || '').toLowerCase();
      const region = (emp.region || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const department = (emp.department || '').toLowerCase();

      return (
        fullName.includes(search) ||
        position.includes(search) ||
        region.includes(search) ||
        email.includes(search) ||
        department.includes(search)
      );
    });
  }, [employees, searchText]);

  // Группировка сотрудников по региональным центрам и городам
  const employeesByRegion = useMemo(() => {
    const grouped: Record<string, Record<string, Employee[]>> = {};

    REGION_CENTERS.forEach(center => {
      grouped[center.code] = {};
      center.cities.forEach(city => {
        grouped[center.code][city] = filteredEmployees.filter(emp => emp.region === city);
      });
    });

    return grouped;
  }, [filteredEmployees]);

  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.setFieldsValue({
      ...employee,
      permissions: employee.permissions || [],
      birthDate: employee.birthDate ? dayjs(employee.birthDate) : undefined,
      hireDate: employee.hireDate ? dayjs(employee.hireDate) : undefined,
      status: employee.status || 'working',
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    try {
      employeeService.deleteEmployee(id);
      syncEmployeesToZadachnik(); // Синхронизируем с zadachnik
      message.success('Сотрудник удален');
      loadEmployees();
    } catch (error) {
      message.error('Ошибка удаления сотрудника');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // Преобразуем даты в строки
      const formattedValues = {
        ...values,
        birthDate: values.birthDate ? dayjs(values.birthDate).format('YYYY-MM-DD') : undefined,
        hireDate: values.hireDate ? dayjs(values.hireDate).format('YYYY-MM-DD') : undefined,
        status: values.status || 'working',
      };

      if (editingEmployee) {
        employeeService.updateEmployee(editingEmployee.id, formattedValues);
        syncEmployeesToZadachnik(); // Синхронизируем с zadachnik
        message.success('Сотрудник обновлен');
      } else {
        employeeService.addEmployee(formattedValues);
        syncEmployeesToZadachnik(); // Синхронизируем с zadachnik
        message.success('Сотрудник добавлен');
      }

      setModalVisible(false);
      loadEmployees();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const columns: ColumnsType<Employee> = [
    {
      title: 'ФИО',
      key: 'name',
      width: 180,
      fixed: 'left',
      render: (_, record) => (
        <div style={{ fontSize: '13px' }}>
          <div>
            {record.lastName} {record.firstName} {record.middleName || ''}
          </div>
          {record.employeeNumber && (
            <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>
              № {record.employeeNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Должность',
      dataIndex: 'position',
      key: 'position',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Регион',
      dataIndex: 'region',
      key: 'region',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Роли / Загрузка',
      key: 'roles',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ fontSize: '11px' }}>
          <Space size={4} wrap>
            {record.canMonitor && (
              <Tag color="blue" style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
                М: {record.monitoringWorkload || 0}
              </Tag>
            )}
            {record.canAppraise && (
              <Tag color="purple" style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
                О: {record.appraisalWorkload || 0}
              </Tag>
            )}
            {!record.canMonitor && !record.canAppraise && (
              <Tag color="default" style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
                Общие
              </Tag>
            )}
          </Space>
          {record.status && (
            <Tag
              color={STATUS_OPTIONS.find(opt => opt.value === record.status)?.color || 'default'}
              style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}
            >
              {STATUS_OPTIONS.find(opt => opt.value === record.status)?.label || record.status}
            </Tag>
          )}
          <Tag
            color={record.isActive ? 'green' : 'red'}
            style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}
          >
            {record.isActive ? 'Активен' : 'Неактивен'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Права',
      key: 'permissions',
      width: 150,
      render: (_, record) => (
        <Space wrap size={2}>
          {record.permissions.slice(0, 2).map(perm => (
            <Tag key={perm} color="blue" style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
              {PERMISSION_LABELS[perm].substring(0, 15)}
            </Tag>
          ))}
          {record.permissions.length > 2 && (
            <Tag style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
              +{record.permissions.length - 2}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            style={{ padding: '0 4px' }}
          />
          <Popconfirm
            title="Удалить сотрудника?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
              style={{ padding: '0 4px' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="employees-page" style={{ padding: '8px' }}>
      <Card size="small" style={{ marginBottom: 8 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Title level={4} style={{ margin: 0, fontSize: '16px' }}>
              <TeamOutlined style={{ marginRight: 4 }} />
              Сотрудники
            </Title>
            <Space size={8} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
              <span style={{ fontSize: '12px', color: '#666' }}>
                Всего: <strong>{employees.length}</strong>
              </span>
              <span style={{ fontSize: '12px', color: '#52c41a' }}>
                Активных: <strong>{employees.filter(e => e.isActive).length}</strong>
              </span>
              <span style={{ fontSize: '12px', color: '#1890ff' }}>
                Мониторинг: <strong>{employees.filter(e => e.canMonitor).length}</strong>
              </span>
              <span style={{ fontSize: '12px', color: '#722ed1' }}>
                Оценка: <strong>{employees.filter(e => e.canAppraise).length}</strong>
              </span>
            </Space>
          </div>
          <Space size={4}>
            <Popconfirm
              title="Регенерировать базу сотрудников?"
              description="Это создаст 30 сотрудников на каждый региональный центр. Существующие данные будут перезаписаны."
              onConfirm={() => {
                try {
                  setLoading(true);
                  const regenerated = employeeService.regenerateEmployees();
                  setEmployees(regenerated);
                  syncEmployeesToZadachnik();
                  message.success(`Создано ${regenerated.length} сотрудников`);
                  setLoading(false);
                } catch (error) {
                  message.error('Ошибка регенерации сотрудников');
                  console.error(error);
                  setLoading(false);
                }
              }}
              okText="Да"
              cancelText="Нет"
            >
              <Button icon={<DatabaseOutlined />} loading={loading} size="small">
                Регенерация
              </Button>
            </Popconfirm>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadEmployees(true)}
              loading={loading}
              size="small"
            >
              Обновить
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="small">
              Добавить
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: 8 }}>
          <Input
            placeholder="Поиск по ФИО, должности, региону, email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            size="small"
            style={{ maxWidth: 400 }}
          />
        </div>
      </Card>

      <Collapse
        activeKey={activeRegion}
        onChange={setActiveRegion}
        size="small"
        style={{ marginBottom: 8 }}
      >
        {REGION_CENTERS.map(center => {
          const activeEmployees = Object.values(employeesByRegion[center.code] || {})
            .flat()
            .filter(emp => emp.isActive).length;

          const monitoringEmployees = Object.values(employeesByRegion[center.code] || {})
            .flat()
            .filter(emp => emp.canMonitor).length;
          const appraisalEmployees = Object.values(employeesByRegion[center.code] || {})
            .flat()
            .filter(emp => emp.canAppraise).length;

          return (
            <Panel
              key={center.code}
              header={
                <Space size={4} wrap style={{ fontSize: '12px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>
                    {center.code} - {center.name}
                  </span>
                  <Tag color="green" style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
                    {activeEmployees} акт.
                  </Tag>
                  <Tag color="blue" style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
                    {monitoringEmployees} мон.
                  </Tag>
                  <Tag color="purple" style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
                    {appraisalEmployees} оц.
                  </Tag>
                </Space>
              }
            >
              {center.cities.map(city => {
                const cityEmployees = employeesByRegion[center.code]?.[city] || [];
                if (cityEmployees.length === 0) return null;

                return (
                  <Card
                    key={city}
                    size="small"
                    title={
                      <Space size={4} style={{ fontSize: '12px' }}>
                        <UserOutlined />
                        <span>{city}</span>
                        <Tag style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
                          {cityEmployees.length}
                        </Tag>
                      </Space>
                    }
                    style={{ marginBottom: 8 }}
                    bodyStyle={{ padding: '8px' }}
                  >
                    <Table
                      columns={columns}
                      dataSource={cityEmployees}
                      rowKey="id"
                      pagination={{ pageSize: 10, size: 'small', showSizeChanger: false }}
                      size="small"
                      scroll={{ x: 'max-content' }}
                    />
                  </Card>
                );
              })}
            </Panel>
          );
        })}
      </Collapse>

      <Card
        title={
          <Space size={4} style={{ fontSize: '13px' }}>
            <span>Все сотрудники</span>
            {searchText && (
              <Tag color="blue" style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
                Найдено: {filteredEmployees.length} из {employees.length}
              </Tag>
            )}
          </Space>
        }
        size="small"
        bodyStyle={{ padding: '8px' }}
      >
        <Table
          columns={columns}
          dataSource={filteredEmployees}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: total => `Всего ${total} сотрудников`,
            size: 'small',
            showQuickJumper: true,
          }}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isActive: true,
            permissions: [],
            canMonitor: false,
            canAppraise: false,
            monitoringWorkload: 0,
            appraisalWorkload: 0,
            status: 'working',
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="lastName"
                label="Фамилия"
                rules={[{ required: true, message: 'Введите фамилию' }]}
              >
                <Input placeholder="Иванов" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="firstName"
                label="Имя"
                rules={[{ required: true, message: 'Введите имя' }]}
              >
                <Input placeholder="Иван" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="middleName" label="Отчество">
                <Input placeholder="Иванович" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="position"
                label="Должность"
                rules={[{ required: true, message: 'Введите должность' }]}
              >
                <Input placeholder="Менеджер по работе с залогами" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="region"
                label="Регион"
                rules={[{ required: true, message: 'Выберите регион' }]}
              >
                <Select placeholder="Выберите регион" showSearch>
                  {REGION_CENTERS.flatMap(center =>
                    center.cities.map(city => (
                      <Option key={city} value={city}>
                        {center.code} - {city}
                      </Option>
                    ))
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="Отдел">
                <Input placeholder="Отдел залогового обеспечения" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Телефон">
                <Input placeholder="+7 (495) 123-45-67" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="email" label="Email">
            <Input type="email" placeholder="ivanov@bank.ru" />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Права доступа"
            rules={[{ required: true, message: 'Выберите права доступа' }]}
          >
            <Select mode="multiple" placeholder="Выберите права доступа" style={{ width: '100%' }}>
              {Object.entries(PERMISSION_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="birthDate" label="Дата рождения">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="employeeNumber" label="Табельный номер">
                <Input placeholder="000001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="hireDate" label="Дата приема на работу">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Статус" initialValue="working">
                <Select placeholder="Выберите статус">
                  {STATUS_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Tag color={option.color} style={{ margin: 0 }}>
                        {option.label}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isActive" label="Активен" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="canMonitor"
                label="Может выполнять мониторинг"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="canAppraise" label="Может выполнять оценку" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Примечания">
            <TextArea rows={3} placeholder="Дополнительная информация" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeesPage;
