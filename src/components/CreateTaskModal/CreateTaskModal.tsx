import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, DatePicker, Button, message, Space } from 'antd';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface CreateTaskModalProps {
  visible: boolean;
  deal: CollateralPortfolioEntry | null;
  onCancel: () => void;
  onSuccess?: () => void;
}

// Типы задач из Задачника
const TASK_TYPES = [
  { value: 'Оценка', label: 'Оценка' },
  { value: 'Экспертиза', label: 'Экспертиза' },
  { value: 'Рецензия', label: 'Рецензия' },
  { value: 'ПРКК', label: 'ПРКК' },
  { value: 'Прочее', label: 'Прочее' },
  { value: 'Отчетность', label: 'Отчетность' },
  { value: 'Подготовка СЗ', label: 'Подготовка СЗ' },
];

// Приоритеты
const PRIORITIES = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' },
];

// Регионы
const REGIONS = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург'];

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ visible, deal, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (visible && deal) {
      // Заполняем форму данными из сделки
      form.setFieldsValue({
        region: deal.collateralLocation?.includes('Москва') ? 'Москва' : 
                deal.collateralLocation?.includes('Санкт-Петербург') ? 'Санкт-Петербург' :
                deal.collateralLocation?.includes('Новосибирск') ? 'Новосибирск' :
                deal.collateralLocation?.includes('Екатеринбург') ? 'Екатеринбург' : 'Москва',
        title: `Сделка ${deal.reference || deal.contractNumber || ''} - ${deal.borrower || deal.pledger || ''}`,
        description: `Задача по сделке REFERENCE: ${deal.reference || deal.contractNumber || ''}\n` +
                     `Заемщик: ${deal.borrower || 'Не указан'}\n` +
                     `Залогодатель: ${deal.pledger || 'Не указан'}\n` +
                     `Тип обеспечения: ${deal.collateralType || 'Не указан'}\n` +
                     `Местоположение: ${deal.collateralLocation || 'Не указано'}`,
        priority: 'medium',
        dueDate: dayjs().add(7, 'day'),
      });

      // Загружаем список сотрудников из Задачника
      loadEmployees();
    }
  }, [visible, deal, form]);

  const loadEmployees = () => {
    try {
      const usersData = localStorage.getItem('zadachnik_users');
      if (usersData) {
        const users = JSON.parse(usersData);
        const allEmployees = users?.employee || [];
        setEmployees(allEmployees);
      }
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Получаем текущие задачи из IndexedDB (с fallback на localStorage)
      const extendedStorageService = (await import('@/services/ExtendedStorageService')).default;
      let tasks: any[] = [];
      try {
        tasks = await extendedStorageService.getTasks();
      } catch (error) {
        // Fallback на localStorage
        try {
          const tasksData = localStorage.getItem('zadachnik_tasks');
          if (tasksData) {
            tasks = JSON.parse(tasksData);
          }
        } catch (e) {
          console.warn('Не удалось загрузить задачи:', e);
        }
      }

      // Создаем новую задачу
      const newTask = {
        id: `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        region: values.region,
        type: values.type,
        category: values.type, // Добавляем category для совместимости
        title: values.title,
        description: values.description || '',
        priority: values.priority,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        status: 'created',
        businessUser: 'system@cms.ru',
        businessUserName: 'Система CMS',
        assignedTo: values.assignedTo || [],
        currentAssignee: values.assignedTo?.[0] || null,
        currentAssigneeName: values.assignedTo?.[0] 
          ? employees.find(e => e.email === values.assignedTo[0])?.name 
          : null,
        employeeId: values.assignedTo?.[0] 
          ? employees.find(e => e.email === values.assignedTo[0])?.id 
          : undefined,
        documents: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
          {
            date: new Date().toISOString(),
            user: 'Система CMS',
            userRole: 'system',
            action: 'Создана',
            comment: `Задача создана из карточки сделки ${deal?.reference || deal?.contractNumber || ''}`,
            status: 'created',
          },
        ],
      };

      // Добавляем задачу
      tasks.push(newTask);
      
      // Сохраняем в IndexedDB
      try {
        await extendedStorageService.saveTasks(tasks);
      } catch (error) {
        console.error('Ошибка сохранения задачи в IndexedDB:', error);
        message.error('Не удалось сохранить задачу. Попробуйте еще раз.');
        setLoading(false);
        return;
      }

      message.success('Задача успешно создана в Задачнике');
      form.resetFields();
      setLoading(false);
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      message.error('Ошибка при создании задачи');
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Создать задачу в Задачнике"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Отмена
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Создать задачу
        </Button>,
      ]}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="region"
          label="Регион"
          rules={[{ required: true, message: 'Выберите регион' }]}
        >
          <Select placeholder="Выберите регион">
            {REGIONS.map(region => (
              <Option key={region} value={region}>
                {region}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="type"
          label="Тип задачи"
          rules={[{ required: true, message: 'Выберите тип задачи' }]}
        >
          <Select placeholder="Выберите тип задачи">
            {TASK_TYPES.map(type => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label="Название задачи"
          rules={[{ required: true, message: 'Введите название задачи' }]}
        >
          <Input placeholder="Название задачи" />
        </Form.Item>

        <Form.Item name="description" label="Описание">
          <TextArea rows={4} placeholder="Описание задачи" />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Приоритет"
          rules={[{ required: true, message: 'Выберите приоритет' }]}
        >
          <Select placeholder="Выберите приоритет">
            {PRIORITIES.map(priority => (
              <Option key={priority.value} value={priority.value}>
                {priority.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="dueDate"
          label="Срок выполнения"
          rules={[{ required: true, message: 'Выберите срок выполнения' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item name="assignedTo" label="Исполнитель (необязательно)">
          <Select
            mode="multiple"
            placeholder="Выберите исполнителя"
            showSearch
            filterOption={(input, option) => {
              const label = typeof option?.label === 'string' ? option.label : String(option?.children || '');
              return label.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {employees.map(emp => (
              <Option key={emp.email} value={emp.email}>
                {emp.name} ({emp.email})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {deal && (
          <Form.Item label="Связанная сделка">
            <Space direction="vertical" size="small">
              <div>
                <strong>REFERENCE:</strong> {deal.reference || deal.contractNumber || 'Не указан'}
              </div>
              <div>
                <strong>Заемщик:</strong> {deal.borrower || 'Не указан'}
              </div>
              <div>
                <strong>Залогодатель:</strong> {deal.pledger || 'Не указан'}
              </div>
            </Space>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default CreateTaskModal;

