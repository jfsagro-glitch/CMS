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
  Badge,
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
import type { Employee, EmployeePermission } from '@/types/employee';
import { REGION_CENTERS } from '@/utils/regionCenters';
import { syncEmployeesToZadachnik } from '@/utils/syncEmployeesToZadachnik';
import './EmployeesPage.css';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

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
      
      return fullName.includes(search) ||
             position.includes(search) ||
             region.includes(search) ||
             email.includes(search) ||
             department.includes(search);
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
      
      if (editingEmployee) {
        employeeService.updateEmployee(editingEmployee.id, values);
        syncEmployeesToZadachnik(); // Синхронизируем с zadachnik
        message.success('Сотрудник обновлен');
      } else {
        employeeService.addEmployee(values);
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
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <span>
            {record.lastName} {record.firstName} {record.middleName || ''}
          </span>
        </Space>
      ),
    },
    {
      title: 'Должность',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Регион',
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: 'Отдел',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Права',
      key: 'permissions',
      render: (_, record) => (
        <Space wrap>
          {record.permissions.slice(0, 3).map((perm) => (
            <Tag key={perm} color="blue">
              {PERMISSION_LABELS[perm]}
            </Tag>
          ))}
          {record.permissions.length > 3 && (
            <Tag>+{record.permissions.length - 3}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Роли',
      key: 'roles',
      render: (_, record) => (
        <Space wrap>
          {record.canMonitor && (
            <Tag color="blue">Мониторинг</Tag>
          )}
          {record.canAppraise && (
            <Tag color="purple">Оценка</Tag>
          )}
          {!record.canMonitor && !record.canAppraise && (
            <Tag color="default">Общие задачи</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Загрузка',
      key: 'workload',
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ fontSize: '12px' }}>
          {record.canMonitor && (
            <div>
              <Tag color="blue" style={{ margin: 0 }}>
                Мониторинг: {record.monitoringWorkload || 0}
              </Tag>
            </div>
          )}
          {record.canAppraise && (
            <div>
              <Tag color="purple" style={{ margin: 0 }}>
                Оценка: {record.appraisalWorkload || 0}
              </Tag>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Активен' : 'Неактивен'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить сотрудника?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="employees-page">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                <TeamOutlined style={{ marginRight: 8 }} />
                Управление сотрудниками
              </Title>
              <div style={{ marginTop: 8, color: '#666' }}>
                Всего: <strong>{employees.length}</strong> | 
                Активных: <strong style={{ color: '#52c41a' }}>{employees.filter(e => e.isActive).length}</strong> | 
                Мониторинг: <strong style={{ color: '#1890ff' }}>{employees.filter(e => e.canMonitor).length}</strong> | 
                Оценка: <strong style={{ color: '#722ed1' }}>{employees.filter(e => e.canAppraise).length}</strong>
              </div>
            </div>
            <Space>
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
                <Button icon={<DatabaseOutlined />} loading={loading}>
                  Регенерировать базу
                </Button>
              </Popconfirm>
              <Button icon={<ReloadOutlined />} onClick={() => loadEmployees(true)} loading={loading}>
                Обновить
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                Добавить сотрудника
              </Button>
            </Space>
          </div>
          
          <Input
            placeholder="Поиск по ФИО, должности, региону, email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ maxWidth: 500 }}
          />
        </div>

        <Collapse
          activeKey={activeRegion}
          onChange={setActiveRegion}
          style={{ marginBottom: 16 }}
        >
          {REGION_CENTERS.map(center => {
            const totalEmployees = Object.values(employeesByRegion[center.code] || {}).flat().length;
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
                  <Space wrap>
                    <Badge count={totalEmployees} showZero>
                      <span style={{ fontWeight: 600 }}>
                        {center.code} - {center.name}
                      </span>
                    </Badge>
                    <Tag color="green">{activeEmployees} активных</Tag>
                    <Tag color="blue">{monitoringEmployees} мониторинг</Tag>
                    <Tag color="purple">{appraisalEmployees} оценка</Tag>
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
                        <Space>
                          <UserOutlined />
                          <span>{city}</span>
                          <Tag>{cityEmployees.length} сотрудников</Tag>
                        </Space>
                      }
                      style={{ marginBottom: 16 }}
                    >
                      <Table
                        columns={columns}
                        dataSource={cityEmployees}
                        rowKey="id"
                        pagination={{ pageSize: 10, size: 'small' }}
                        size="small"
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
            <Space>
              <span>Все сотрудники</span>
              {searchText && (
                <Tag color="blue">
                  Найдено: {filteredEmployees.length} из {employees.length}
                </Tag>
              )}
            </Space>
          } 
          size="small"
        >
          <Table
            columns={columns}
            dataSource={filteredEmployees}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Всего ${total} сотрудников` }}
          />
        </Card>
      </Card>

      <Modal
        title={editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={700}
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
            <Select
              mode="multiple"
              placeholder="Выберите права доступа"
              style={{ width: '100%' }}
            >
              {Object.entries(PERMISSION_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="hireDate" label="Дата приема на работу">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Активен" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="canMonitor" label="Может выполнять мониторинг" valuePropName="checked">
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

