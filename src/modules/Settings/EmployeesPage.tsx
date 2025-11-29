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
  Upload,
  Avatar,
  List,
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
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import employeeService from '@/services/EmployeeService';
import type { Employee, EmployeePermission, EmployeeStatus } from '@/types/employee';
import { REGION_CENTERS } from '@/utils/regionCenters';
import { syncEmployeesToZadachnik } from '@/utils/syncEmployeesToZadachnik';
import { generateTasksForEmployees } from '@/utils/generateTasksForEmployees';
import extendedStorageService from '@/services/ExtendedStorageService';
import type { TaskDB } from '@/services/ExtendedStorageService';
import dayjs from 'dayjs';
import { calculateRegionCenterWorkload } from '@/utils/workloadCalculator';
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
  const [tasks, setTasks] = useState<TaskDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();
  const [activeRegion, setActiveRegion] = useState<string | string[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadEmployees();
    loadTasks();
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

  const loadTasks = async () => {
    try {
      let loaded: TaskDB[] = [];
      try {
        loaded = await extendedStorageService.getTasks();
      } catch (error) {
        // Fallback на localStorage, если IndexedDB недоступен
        try {
          const existingTasks = localStorage.getItem('zadachnik_tasks');
          if (existingTasks) {
            loaded = JSON.parse(existingTasks);
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Не удалось загрузить задачи из localStorage:', e);
        }
      }
      setTasks(loaded);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Ошибка загрузки задач для статистики загрузки сотрудников:', error);
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

  // Статистика загрузки по региональным центрам (на основе нормочасов)
  const workloadByRegionCenter = useMemo(() => {
    const stats: Record<
      string,
      {
        workloadPercent: number;
        totalNormHours: number;
        tasksCount: number;
        workingEmployeesCount: number;
      }
    > = {};

    REGION_CENTERS.forEach(center => {
      const workload = calculateRegionCenterWorkload(tasks, employees, center.code, center.cities);
      stats[center.code] = workload;
    });

    return stats;
  }, [tasks, employees]);

  // Демо задачи для каждого регионального центра (для отображения под блоком загрузки)
  const demoTasksByRegionCenter = useMemo(() => {
    const grouped: Record<string, TaskDB[]> = {};

    REGION_CENTERS.forEach(center => {
      const centerTasks = tasks
        .filter(task => {
          const taskRegion = (task.region || '').toString();
          return center.cities.includes(taskRegion) || taskRegion === center.code;
        })
        .sort((a, b) => {
          const dateA = dayjs(
            a.updatedAt || a.createdAt || a.dueDate || dayjs().toISOString()
          ).valueOf();
          const dateB = dayjs(
            b.updatedAt || b.createdAt || b.dueDate || dayjs().toISOString()
          ).valueOf();
          return dateB - dateA;
        })
        .slice(0, 5);

      grouped[center.code] = centerTasks;
    });

    return grouped;
  }, [tasks]);

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
      photo: employee.photo
        ? [{ uid: '-1', name: 'photo.png', status: 'done', url: employee.photo }]
        : [],
    });
    setModalVisible(true);
  };

  // Преобразование файла в base64
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Обработчик загрузки фото
  const handlePhotoChange = async (info: any) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done' || info.file.originFileObj) {
      try {
        const base64 = await getBase64(info.file.originFileObj || info.file);
        form.setFieldsValue({
          photo: [{ ...info.file, thumbUrl: base64, url: base64 }],
        });
      } catch (error) {
        message.error('Ошибка загрузки фото');
        console.error(error);
      }
    }
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

      // Обработка фото - извлекаем base64 из Upload компонента
      let photoUrl: string | undefined = undefined;
      if (values.photo && values.photo.length > 0) {
        const file = values.photo[0];
        if (file.response) {
          // Если файл был загружен на сервер
          photoUrl = file.response.url;
        } else if (file.thumbUrl) {
          // Если это base64 или локальный URL
          photoUrl = file.thumbUrl;
        } else if (file.url) {
          // Если это уже URL
          photoUrl = file.url;
        }
      } else if (editingEmployee?.photo) {
        // Сохраняем существующее фото, если новое не загружено
        photoUrl = editingEmployee.photo;
      }

      // Преобразуем даты в строки
      const formattedValues = {
        ...values,
        birthDate: values.birthDate ? dayjs(values.birthDate).format('YYYY-MM-DD') : undefined,
        hireDate: values.hireDate ? dayjs(values.hireDate).format('YYYY-MM-DD') : undefined,
        status: values.status || 'working',
        photo: photoUrl,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px' }}>
          <Avatar src={record.photo} icon={<UserOutlined />} size={40} style={{ flexShrink: 0 }} />
          <div>
            <div>
              {record.lastName} {record.firstName} {record.middleName || ''}
            </div>
            {record.employeeNumber && (
              <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>
                № {record.employeeNumber}
              </div>
            )}
          </div>
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
            {record.isManager && (
              <Tag color="gold" style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
                Руководитель
              </Tag>
            )}
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
            {!record.canMonitor && !record.canAppraise && !record.isManager && (
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
            <Space
              size={8}
              split={<span style={{ color: '#d9d9d9' }}>|</span>}
              style={{ marginTop: 4 }}
            >
              <span style={{ fontSize: '12px', color: '#52c41a' }}>
                На работе:{' '}
                <strong>{employees.filter(e => e.status === 'working' || !e.status).length}</strong>
              </span>
              <span style={{ fontSize: '12px', color: '#fa8c16' }}>
                Больничный:{' '}
                <strong>{employees.filter(e => e.status === 'sick_leave').length}</strong>
              </span>
              <span style={{ fontSize: '12px', color: '#1890ff' }}>
                Отпуск: <strong>{employees.filter(e => e.status === 'vacation').length}</strong>
              </span>
              <span style={{ fontSize: '12px', color: '#722ed1' }}>
                Командировка:{' '}
                <strong>{employees.filter(e => e.status === 'business_trip').length}</strong>
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
            <Popconfirm
              title="Сгенерировать задачи для всех сотрудников?"
              description="Это создаст 30-50 задач на каждого активного сотрудника. Большая часть будет выполнена, 1% просрочена."
              onConfirm={() => {
                try {
                  generateTasksForEmployees();
                  message.success('Задачи успешно сгенерированы');
                } catch (error) {
                  message.error('Ошибка генерации задач');
                  console.error(error);
                }
              }}
              okText="Да"
              cancelText="Нет"
            >
              <Button icon={<ReloadOutlined />} size="small">
                Генерировать задачи
              </Button>
            </Popconfirm>
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
          const centerEmployees = Object.values(employeesByRegion[center.code] || {}).flat();
          const activeEmployees = centerEmployees.filter(emp => emp.isActive).length;

          const monitoringEmployees = centerEmployees.filter(emp => emp.canMonitor).length;
          const appraisalEmployees = centerEmployees.filter(emp => emp.canAppraise).length;

          const workload = workloadByRegionCenter[center.code] || {
            workloadPercent: 0,
            totalNormHours: 0,
            tasksCount: 0,
            workingEmployeesCount: 0,
          };
          const loadPercent = workload.workloadPercent;
          const centerDemoTasks = demoTasksByRegionCenter[center.code] || [];

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
                  <Tag color="gold" style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
                    Загрузка: {loadPercent}%
                  </Tag>
                </Space>
              }
            >
              <Card
                size="small"
                type="inner"
                title="Демо задачи (нагрузка)"
                style={{ marginBottom: 8 }}
                bodyStyle={{ padding: 8, maxHeight: 220, overflowY: 'auto' }}
              >
                <List
                  size="small"
                  dataSource={centerDemoTasks}
                  locale={{ emptyText: 'Демо задачи формируются автоматически' }}
                  renderItem={task => (
                    <List.Item key={task.id} style={{ padding: '6px 0' }}>
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Space size={4} wrap>
                          <Tag color="geekblue" style={{ margin: 0 }}>
                            {task.type || 'Задача'}
                          </Tag>
                          <Tag color="gold" style={{ margin: 0 }}>
                            {(task.status || '').toString()}
                          </Tag>
                        </Space>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{task.title}</div>
                        <Space size={4} wrap style={{ fontSize: 11, color: 'rgba(0,0,0,0.65)' }}>
                          {task.currentAssigneeName && (
                            <span>Исполнитель: {task.currentAssigneeName}</span>
                          )}
                          {task.dueDate && (
                            <span>Срок: {dayjs(task.dueDate).format('DD.MM.YYYY')}</span>
                          )}
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>

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
            isManager: false,
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

          <Form.Item name="photo" label="Фото сотрудника">
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false} // Предотвращаем автоматическую загрузку
              onChange={handlePhotoChange}
              accept="image/*"
            >
              {form.getFieldValue('photo')?.length >= 1 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Загрузить</div>
                </div>
              )}
            </Upload>
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isManager"
                label="Руководитель региона"
                valuePropName="checked"
                tooltip="Назначить сотрудника руководителем региона"
              >
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
