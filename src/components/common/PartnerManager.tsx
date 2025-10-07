import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Switch, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, BankOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Partner, PartnerType, PartnerRole } from '@/types';
import { generateId } from '@/utils/helpers';

interface PartnerManagerProps {
  value?: Partner[];
  onChange?: (value: Partner[]) => void;
  disabled?: boolean;
}

const PartnerManager: React.FC<PartnerManagerProps> = ({ value = [], onChange, disabled = false }) => {
  const [partners, setPartners] = useState<Partner[]>(value);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [form] = Form.useForm();

  const partnerTypeOptions = [
    { value: 'individual', label: 'Физическое лицо' },
    { value: 'legal', label: 'Юридическое лицо' },
  ];

  const partnerRoleOptions = [
    { value: 'owner', label: 'Собственник' },
    { value: 'pledgor', label: 'Залогодатель' },
    { value: 'appraiser', label: 'Оценщик' },
    { value: 'other', label: 'Другое' },
  ];

  const handleAdd = () => {
    form.resetFields();
    setEditingPartner(null);
    setModalVisible(true);
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    form.setFieldsValue(partner);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    const updatedPartners = partners.filter(p => p.id !== id);
    setPartners(updatedPartners);
    onChange?.(updatedPartners);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const now = new Date();

      const partnerData: Partner = {
        id: editingPartner?.id || generateId(),
        type: values.type,
        role: values.role,
        lastName: values.lastName,
        firstName: values.firstName,
        middleName: values.middleName,
        organizationName: values.organizationName,
        inn: values.inn,
        share: values.share,
        showInRegistry: values.showInRegistry !== undefined ? values.showInRegistry : true,
        createdAt: editingPartner?.createdAt || now,
        updatedAt: now,
      };

      let updatedPartners: Partner[];
      if (editingPartner) {
        updatedPartners = partners.map(p => (p.id === editingPartner.id ? partnerData : p));
      } else {
        updatedPartners = [...partners, partnerData];
      }

      setPartners(updatedPartners);
      onChange?.(updatedPartners);
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getPartnerName = (partner: Partner): string => {
    if (partner.type === 'individual') {
      return [partner.lastName, partner.firstName, partner.middleName].filter(Boolean).join(' ');
    }
    return partner.organizationName || '';
  };

  const getRoleTag = (role: PartnerRole) => {
    const colors: Record<PartnerRole, string> = {
      owner: 'blue',
      pledgor: 'green',
      appraiser: 'orange',
      other: 'default',
    };
    const labels: Record<PartnerRole, string> = {
      owner: 'Собственник',
      pledgor: 'Залогодатель',
      appraiser: 'Оценщик',
      other: 'Другое',
    };
    return <Tag color={colors[role]}>{labels[role]}</Tag>;
  };

  const columns: ColumnsType<Partner> = [
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: PartnerType) =>
        type === 'individual' ? (
          <UserOutlined style={{ fontSize: 18 }} />
        ) : (
          <BankOutlined style={{ fontSize: 18 }} />
        ),
    },
    {
      title: 'Наименование/ФИО',
      key: 'name',
      render: (_, record) => getPartnerName(record),
    },
    {
      title: 'ИНН',
      dataIndex: 'inn',
      key: 'inn',
      width: 150,
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: PartnerRole) => getRoleTag(role),
    },
    {
      title: 'Доля (%)',
      dataIndex: 'share',
      key: 'share',
      width: 100,
      render: (share?: number) => (share !== undefined ? `${share}%` : '-'),
    },
    {
      title: 'В реестре',
      dataIndex: 'showInRegistry',
      key: 'showInRegistry',
      width: 100,
      render: (show: boolean) => (show ? 'Да' : 'Нет'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={disabled}
          >
            Изменить
          </Button>
          <Popconfirm
            title="Удалить партнера?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />} disabled={disabled}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={disabled}>
          Добавить партнера
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={partners}
        rowKey="id"
        pagination={false}
        size="small"
      />

      <Modal
        title={editingPartner ? 'Редактирование партнера' : 'Добавление партнера'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={700}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ showInRegistry: true, type: 'individual' }}
        >
          <Form.Item name="type" label="Тип партнера" rules={[{ required: true, message: 'Выберите тип' }]}>
            <Select
              options={partnerTypeOptions}
              onChange={value => setPartnerType(value as PartnerType)}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return type === 'individual' ? (
                <>
                  <Form.Item name="lastName" label="Фамилия" rules={[{ required: true, message: 'Введите фамилию' }]}>
                    <Input placeholder="Иванов" />
                  </Form.Item>
                  <Form.Item name="firstName" label="Имя" rules={[{ required: true, message: 'Введите имя' }]}>
                    <Input placeholder="Иван" />
                  </Form.Item>
                  <Form.Item name="middleName" label="Отчество">
                    <Input placeholder="Иванович" />
                  </Form.Item>
                </>
              ) : (
                <Form.Item
                  name="organizationName"
                  label="Наименование организации"
                  rules={[{ required: true, message: 'Введите наименование' }]}
                >
                  <Input placeholder="ООО Рога и Копыта" />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="inn" label="ИНН">
            <Input placeholder="1234567890" maxLength={12} />
          </Form.Item>

          <Form.Item name="role" label="Роль" rules={[{ required: true, message: 'Выберите роль' }]}>
            <Select options={partnerRoleOptions} />
          </Form.Item>

          <Form.Item name="share" label="Доля права (%)">
            <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="showInRegistry" label="Показывать в реестре" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PartnerManager;

