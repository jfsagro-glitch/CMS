import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Switch,
  Select,
  Button,
  Space,
  Divider,
  Typography,
  InputNumber,
  message,
  Alert,
  Table,
} from 'antd';
import { SaveOutlined, MailOutlined, BellOutlined, SettingOutlined, RocketOutlined, UserOutlined } from '@ant-design/icons';
import employeeService from '@/services/EmployeeService';
import { extendedStorageService } from '@/services/ExtendedStorageService';
import { 
  autopilotMonitoring, 
  autopilotAppraisal, 
  saveMonitoringAssignments, 
  saveAppraisalAssignments,
  loadMonitoringAssignments,
  loadAppraisalAssignments,
} from '@/utils/autopilotAssignment';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface MonitoringSettings {
  // Настройки уведомлений
  notificationsEnabled: boolean;
  notificationFrequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  customNotificationDays?: number; // Для custom частоты
  
  // Email сотрудника Банка
  bankEmployeeEmail: string;
  bankEmployeeName?: string;
  bankEmployeeId?: string;
  
  // Уведомления клиенту
  clientNotificationsEnabled: boolean;
  clientNotificationDaysBefore: number; // За сколько дней до мониторинга уведомлять клиента
  clientNotificationTemplate?: string; // Шаблон уведомления клиенту
  
  // Дополнительные настройки
  autoReminderEnabled: boolean;
  reminderDaysBefore: number; // За сколько дней напоминать сотруднику
}

const STORAGE_KEY = 'cms_monitoring_settings';

const MonitoringSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [monitoringEmployees, setMonitoringEmployees] = useState<any[]>([]);
  const [appraisalEmployees, setAppraisalEmployees] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [regionAssignments, setRegionAssignments] = useState<Record<string, { monitoring?: string; appraisal?: string }>>({});
  const [autopilotLoading, setAutopilotLoading] = useState(false);

  // Загрузка настроек
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved) as MonitoringSettings;
        form.setFieldsValue(settings);
      } else {
        // Значения по умолчанию
        form.setFieldsValue({
          notificationsEnabled: true,
          notificationFrequency: 'weekly',
          clientNotificationsEnabled: false,
          clientNotificationDaysBefore: 7,
          autoReminderEnabled: true,
          reminderDaysBefore: 3,
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  }, [form]);

  // Загрузка списка сотрудников
  useEffect(() => {
    const loadEmployees = () => {
      try {
        const allEmployees = employeeService.getEmployees();
        setEmployees(allEmployees.filter(emp => emp.isActive));
        setMonitoringEmployees(employeeService.getMonitoringEmployees());
        setAppraisalEmployees(employeeService.getAppraisalEmployees());
        setRegions(employeeService.getRegions());
      } catch (error) {
        console.error('Ошибка загрузки сотрудников:', error);
      }
    };
    loadEmployees();
  }, []);

  // Загрузка назначений по регионам
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const monitoringAssignments = loadMonitoringAssignments();
        const appraisalAssignments = loadAppraisalAssignments();
        const cards = await extendedStorageService.getExtendedCards();
        
        const assignments: Record<string, { monitoring?: string; appraisal?: string }> = {};
        
        // Группируем по регионам
        regions.forEach(region => {
          assignments[region] = {};
          
          // Находим назначения для мониторинга в этом регионе
          const monitoringCards = cards.filter(card => {
            const cardRegion = card.address?.region || card.address?.city || 'Не указан';
            return cardRegion === region && card.nextMonitoringDate;
          });
          
          if (monitoringCards.length > 0) {
            const firstCard = monitoringCards[0];
            const monitoringAssignment = monitoringAssignments.find(a => a.cardId === firstCard.id);
            if (monitoringAssignment) {
              assignments[region].monitoring = monitoringAssignment.employeeId;
            }
          }
          
          // Находим назначения для оценки в этом регионе
          const appraisalCards = cards.filter(card => {
            const cardRegion = card.address?.region || card.address?.city || 'Не указан';
            return cardRegion === region && card.nextEvaluationDate;
          });
          
          if (appraisalCards.length > 0) {
            const firstCard = appraisalCards[0];
            const appraisalAssignment = appraisalAssignments.find(a => a.cardId === firstCard.id);
            if (appraisalAssignment) {
              assignments[region].appraisal = appraisalAssignment.employeeId;
            }
          }
        });
        
        setRegionAssignments(assignments);
      } catch (error) {
        console.error('Ошибка загрузки назначений:', error);
      }
    };
    
    if (regions.length > 0) {
      loadAssignments();
    }
  }, [regions]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Сохраняем настройки
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      
      message.success('Настройки мониторинга сохранены');
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      message.error('Ошибка при сохранении настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      form.setFieldsValue({
        bankEmployeeEmail: employee.email || '',
        bankEmployeeName: `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim(),
        bankEmployeeId: employee.id,
      });
    }
  };

  const handleRegionMonitoringChange = async (region: string, employeeId: string) => {
    try {
      const cards = await extendedStorageService.getExtendedCards();
      const regionCards = cards.filter(card => {
        const cardRegion = card.address?.region || card.address?.city || 'Не указан';
        return cardRegion === region && card.nextMonitoringDate;
      });

      const employee = employeeService.getEmployeeById(employeeId);
      if (!employee) return;

      const assignments = loadMonitoringAssignments();
      
      // Обновляем назначения для всех карточек региона
      regionCards.forEach(card => {
        const existingIndex = assignments.findIndex(a => a.cardId === card.id);
        const newAssignment = {
          cardId: card.id,
          employeeId: employee.id,
          employeeName: `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim(),
          region: employee.region,
        };
        
        if (existingIndex >= 0) {
          assignments[existingIndex] = newAssignment;
        } else {
          assignments.push(newAssignment);
        }
      });

      saveMonitoringAssignments(assignments);
      
      setRegionAssignments(prev => ({
        ...prev,
        [region]: { ...prev[region], monitoring: employeeId },
      }));

      message.success(`Ответственный за мониторинг в регионе "${region}" назначен`);
    } catch (error) {
      console.error('Ошибка назначения ответственного:', error);
      message.error('Ошибка при назначении ответственного');
    }
  };

  const handleRegionAppraisalChange = async (region: string, employeeId: string) => {
    try {
      const cards = await extendedStorageService.getExtendedCards();
      const regionCards = cards.filter(card => {
        const cardRegion = card.address?.region || card.address?.city || 'Не указан';
        return cardRegion === region && card.nextEvaluationDate;
      });

      const employee = employeeService.getEmployeeById(employeeId);
      if (!employee) return;

      const assignments = loadAppraisalAssignments();
      
      // Обновляем назначения для всех карточек региона
      regionCards.forEach(card => {
        const existingIndex = assignments.findIndex(a => a.cardId === card.id);
        const newAssignment = {
          cardId: card.id,
          employeeId: employee.id,
          employeeName: `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim(),
          region: employee.region,
        };
        
        if (existingIndex >= 0) {
          assignments[existingIndex] = newAssignment;
        } else {
          assignments.push(newAssignment);
        }
      });

      saveAppraisalAssignments(assignments);
      
      setRegionAssignments(prev => ({
        ...prev,
        [region]: { ...prev[region], appraisal: employeeId },
      }));

      message.success(`Ответственный за оценку в регионе "${region}" назначен`);
    } catch (error) {
      console.error('Ошибка назначения ответственного:', error);
      message.error('Ошибка при назначении ответственного');
    }
  };

  const handleAutopilotMonitoring = async () => {
    try {
      setAutopilotLoading(true);
      const cards = await extendedStorageService.getExtendedCards();
      const assignments = autopilotMonitoring(cards);
      saveMonitoringAssignments(assignments);
      
      // Обновляем отображение
      const newAssignments: Record<string, { monitoring?: string; appraisal?: string }> = {};
      regions.forEach(region => {
        const regionAssignment = assignments.find(a => {
          const card = cards.find(c => c.id === a.cardId);
          const cardRegion = card?.address?.region || card?.address?.city || 'Не указан';
          return cardRegion === region;
        });
        if (regionAssignment) {
          newAssignments[region] = { monitoring: regionAssignment.employeeId };
        }
      });
      
      setRegionAssignments(prev => ({ ...prev, ...newAssignments }));
      message.success(`Автопилот выполнен: назначено ${assignments.length} объектов для мониторинга`);
    } catch (error) {
      console.error('Ошибка автопилота мониторинга:', error);
      message.error('Ошибка при выполнении автопилота');
    } finally {
      setAutopilotLoading(false);
    }
  };

  const handleAutopilotAppraisal = async () => {
    try {
      setAutopilotLoading(true);
      const cards = await extendedStorageService.getExtendedCards();
      const assignments = autopilotAppraisal(cards);
      saveAppraisalAssignments(assignments);
      
      // Обновляем отображение
      const newAssignments: Record<string, { monitoring?: string; appraisal?: string }> = {};
      regions.forEach(region => {
        const regionAssignment = assignments.find(a => {
          const card = cards.find(c => c.id === a.cardId);
          const cardRegion = card?.address?.region || card?.address?.city || 'Не указан';
          return cardRegion === region;
        });
        if (regionAssignment) {
          newAssignments[region] = { appraisal: regionAssignment.employeeId };
        }
      });
      
      setRegionAssignments(prev => ({ ...prev, ...newAssignments }));
      message.success(`Автопилот выполнен: назначено ${assignments.length} объектов для оценки`);
    } catch (error) {
      console.error('Ошибка автопилота оценки:', error);
      message.error('Ошибка при выполнении автопилота');
    } finally {
      setAutopilotLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <SettingOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
            Настройки мониторинга
          </Title>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Настройка уведомлений, периодичности и интеграции с почтовой рассылкой
          </Text>
        </div>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          {/* Настройки уведомлений */}
          <Card
            title={
              <Space>
                <BellOutlined />
                <span>Настройки уведомлений</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Form.Item
              name="notificationsEnabled"
              label="Включить уведомления"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="notificationFrequency"
              label="Периодичность уведомлений"
              rules={[{ required: true, message: 'Выберите периодичность' }]}
            >
              <Select>
                <Select.Option value="daily">Ежедневно</Select.Option>
                <Select.Option value="weekly">Еженедельно</Select.Option>
                <Select.Option value="monthly">Ежемесячно</Select.Option>
                <Select.Option value="custom">Произвольная (указать дни)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.notificationFrequency !== currentValues.notificationFrequency
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('notificationFrequency') === 'custom' ? (
                  <Form.Item
                    name="customNotificationDays"
                    label="Количество дней между уведомлениями"
                    rules={[{ required: true, message: 'Укажите количество дней' }]}
                  >
                    <InputNumber min={1} max={365} style={{ width: '100%' }} />
                  </Form.Item>
                ) : null
              }
            </Form.Item>

            <Form.Item
              name="autoReminderEnabled"
              label="Автоматическое напоминание сотруднику"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.autoReminderEnabled !== currentValues.autoReminderEnabled
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('autoReminderEnabled') ? (
                  <Form.Item
                    name="reminderDaysBefore"
                    label="Напоминать за (дней до мониторинга)"
                    rules={[{ required: true, message: 'Укажите количество дней' }]}
                  >
                    <InputNumber min={1} max={30} style={{ width: '100%' }} />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </Card>

          {/* Интеграция с почтовой рассылкой */}
          <Card
            title={
              <Space>
                <MailOutlined />
                <span>Интеграция с почтовой рассылкой</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Alert
              message="Настройка email-уведомлений"
              description="Укажите сотрудника Банка, ответственного за мониторинг, для автоматической рассылки уведомлений"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              name="bankEmployeeId"
              label="Ответственный сотрудник Банка"
              rules={[{ required: true, message: 'Выберите сотрудника' }]}
            >
              <Select
                placeholder="Выберите сотрудника"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onChange={handleEmployeeSelect}
                options={employees.map(emp => ({
                  value: emp.id,
                  label: `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim(),
                }))}
              />
            </Form.Item>

            <Form.Item
              name="bankEmployeeEmail"
              label="Email для уведомлений"
              rules={[
                { required: true, message: 'Укажите email' },
                { type: 'email', message: 'Неверный формат email' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="email@example.com"
              />
            </Form.Item>

            <Form.Item name="bankEmployeeName" hidden>
              <Input />
            </Form.Item>
          </Card>

          {/* Уведомления клиенту */}
          <Card
            title={
              <Space>
                <BellOutlined />
                <span>Уведомления клиенту Банка</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Alert
              message="Автоматические уведомления клиенту"
              description="Настройте автоматическую отправку уведомлений клиенту о предстоящем мониторинге"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              name="clientNotificationsEnabled"
              label="Включить уведомления клиенту"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.clientNotificationsEnabled !== currentValues.clientNotificationsEnabled
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('clientNotificationsEnabled') ? (
                  <>
                    <Form.Item
                      name="clientNotificationDaysBefore"
                      label="Уведомлять клиента за (дней до мониторинга)"
                      rules={[{ required: true, message: 'Укажите количество дней' }]}
                    >
                      <InputNumber min={1} max={30} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      name="clientNotificationTemplate"
                      label="Шаблон уведомления клиенту"
                    >
                      <TextArea
                        rows={6}
                        placeholder="Уважаемый клиент! Напоминаем, что {дата} запланирован мониторинг объекта залога по договору {номер_договора}. Пожалуйста, обеспечьте доступ к объекту."
                      />
                    </Form.Item>
                  </>
                ) : null
              }
            </Form.Item>
          </Card>

          {/* Назначение ответственных за мониторинг */}
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Назначение ответственных за мониторинг</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
            extra={
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={handleAutopilotMonitoring}
                loading={autopilotLoading}
              >
                Автопилот
              </Button>
            }
          >
            <Alert
              message="Распределение по регионам"
              description="Назначьте ответственных сотрудников для мониторинга по каждому региону. Используйте 'Автопилот' для автоматического распределения с учетом загрузки сотрудников."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Table
              dataSource={regions.map(region => ({
                key: region,
                region,
                monitoringEmployee: regionAssignments[region]?.monitoring,
              }))}
              columns={[
                {
                  title: 'Регион',
                  dataIndex: 'region',
                  key: 'region',
                },
                {
                  title: 'Ответственный за мониторинг',
                  dataIndex: 'monitoringEmployee',
                  key: 'monitoringEmployee',
                  render: (value, record) => (
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Выберите сотрудника"
                      value={value}
                      onChange={(employeeId) => handleRegionMonitoringChange(record.region, employeeId)}
                      options={monitoringEmployees
                        .filter(emp => emp.region === record.region)
                        .map(emp => ({
                          value: emp.id,
                          label: `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim(),
                        }))}
                    />
                  ),
                },
              ]}
              pagination={false}
            />
          </Card>

          {/* Назначение ответственных за оценку */}
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Назначение ответственных за оценку</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
            extra={
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={handleAutopilotAppraisal}
                loading={autopilotLoading}
              >
                Автопилот
              </Button>
            }
          >
            <Alert
              message="Распределение по регионам"
              description="Назначьте ответственных сотрудников для оценки по каждому региону. Используйте 'Автопилот' для автоматического распределения с учетом загрузки сотрудников."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Table
              dataSource={regions.map(region => ({
                key: region,
                region,
                appraisalEmployee: regionAssignments[region]?.appraisal,
              }))}
              columns={[
                {
                  title: 'Регион',
                  dataIndex: 'region',
                  key: 'region',
                },
                {
                  title: 'Ответственный за оценку',
                  dataIndex: 'appraisalEmployee',
                  key: 'appraisalEmployee',
                  render: (value, record) => (
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Выберите сотрудника"
                      value={value}
                      onChange={(employeeId) => handleRegionAppraisalChange(record.region, employeeId)}
                      options={appraisalEmployees
                        .filter(emp => emp.region === record.region)
                        .map(emp => ({
                          value: emp.id,
                          label: `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim(),
                        }))}
                    />
                  ),
                },
              ]}
              pagination={false}
            />
          </Card>

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                Сохранить настройки
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  const saved = localStorage.getItem(STORAGE_KEY);
                  if (saved) {
                    const settings = JSON.parse(saved);
                    form.setFieldsValue(settings);
                  }
                }}
              >
                Отменить изменения
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default MonitoringSettings;

