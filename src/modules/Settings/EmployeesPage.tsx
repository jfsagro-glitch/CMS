import React, { useEffect, useState } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import employeeService from '@/services/EmployeeService';
import type { Employee, EmployeePermission } from '@/types/employee';
import './EmployeesPage.css';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

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

const REGIONS = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород'];

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = () => {
    setLoading(true);
    try {
      const data = employeeService.getEmployees();
      setEmployees(data);
    } catch (error) {
      message.error('Ошибка загрузки сотрудников');
    } finally {
      setLoading(false);
    }
  };

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
        message.success('Сотрудник обновлен');
      } else {
        employeeService.addEmployee(values);
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
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            Управление сотрудниками
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Добавить сотрудника
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
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
                <Select placeholder="Выберите регион">
                  {REGIONS.map((region) => (
                    <Option key={region} value={region}>
                      {region}
                    </Option>
                  ))}
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

          <Form.Item name="notes" label="Примечания">
            <TextArea rows={3} placeholder="Дополнительная информация" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeesPage;

