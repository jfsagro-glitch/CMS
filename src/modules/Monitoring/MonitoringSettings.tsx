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
} from 'antd';
import { SaveOutlined, MailOutlined, BellOutlined, SettingOutlined } from '@ant-design/icons';
import employeeService from '@/services/EmployeeService';

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
      } catch (error) {
        console.error('Ошибка загрузки сотрудников:', error);
      }
    };
    loadEmployees();
  }, []);

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

