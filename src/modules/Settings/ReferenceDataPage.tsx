import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Typography,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Tabs,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd/es/tabs';
import referenceDataService, { type ReferenceDictionary, type ReferenceItem } from '@/services/ReferenceDataService';
import './ReferenceDataPage.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ReferenceDataPage: React.FC = () => {
  const location = useLocation();
  const [dictionaries, setDictionaries] = useState<ReferenceDictionary[]>([]);
  const [selectedDictionary, setSelectedDictionary] = useState<ReferenceDictionary | null>(null);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
  const [form] = Form.useForm();

  const loadDictionaries = useCallback(() => {
    try {
      const data = referenceDataService.getDictionaries();
      setDictionaries(data);
    } catch (error) {
      message.error('Ошибка загрузки справочников');
    }
  }, []);

  useEffect(() => {
    loadDictionaries();
  }, [loadDictionaries]);

  // Проверяем параметр dict в URL для открытия конкретного справочника
  useEffect(() => {
    if (dictionaries.length === 0) return;
    
    // В HashRouter параметры находятся в location.search
    // Также проверяем window.location.hash на случай, если параметры там
    const search = location.search || window.location.search;
    const hash = location.hash || window.location.hash;
    
    // Пробуем получить параметры из search или из hash
    let searchParams: URLSearchParams;
    if (search) {
      searchParams = new URLSearchParams(search);
    } else if (hash.includes('?')) {
      searchParams = new URLSearchParams(hash.split('?')[1]);
    } else {
      searchParams = new URLSearchParams();
    }
    
    const dictId = searchParams.get('dict');
    
    if (dictId) {
      const dict = dictionaries.find(d => d.id === dictId);
      if (dict) {
        // Всегда устанавливаем справочник, если он найден по ID из URL
        setSelectedDictionary(dict);
        return;
      } else {
        console.warn(`Справочник с ID "${dictId}" не найден. Доступные справочники:`, dictionaries.map(d => d.id));
      }
    }
    
    // Если параметра нет и справочник не выбран, выбираем первый
    if (!selectedDictionary && dictionaries.length > 0) {
      setSelectedDictionary(dictionaries[0]);
    }
  }, [dictionaries, location.search, location.hash, selectedDictionary]);

  const handleAddItem = useCallback((dictionary: ReferenceDictionary) => {
    setSelectedDictionary(dictionary);
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      sortOrder: dictionary.items.length + 1,
    });
    setItemModalVisible(true);
  }, [form]);

  const handleEditItem = useCallback((dictionary: ReferenceDictionary, item: ReferenceItem) => {
    setSelectedDictionary(dictionary);
    setEditingItem(item);
    form.setFieldsValue({
      ...item,
    });
    setItemModalVisible(true);
  }, [form]);

  const handleDeleteItem = useCallback((dictionary: ReferenceDictionary, itemId: string) => {
    try {
      referenceDataService.deleteItemFromDictionary(dictionary.id, itemId);
      message.success('Элемент удален');
      loadDictionaries();
    } catch (error) {
      message.error('Ошибка удаления элемента');
    }
  }, [loadDictionaries]);

  const handleSaveItem = useCallback(async () => {
    if (!selectedDictionary) return;

    try {
      const values = await form.validateFields();
      
      if (editingItem) {
        referenceDataService.updateItemInDictionary(selectedDictionary.id, editingItem.id, values);
        message.success('Элемент обновлен');
      } else {
        referenceDataService.addItemToDictionary(selectedDictionary.id, values);
        message.success('Элемент добавлен');
      }
      
      setItemModalVisible(false);
      loadDictionaries();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  }, [loadDictionaries, selectedDictionary, editingItem, form]);

  const getItemColumns = React.useCallback((dictionary: ReferenceDictionary): ColumnsType<ReferenceItem> => [
    {
      title: 'Код',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Порядок сортировки',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      align: 'center',
      width: 120,
    },
    {
      title: 'Статус',
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? 'Активен' : 'Неактивен'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditItem(dictionary, record)}
            size="small"
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить элемент?"
            onConfirm={() => handleDeleteItem(dictionary, record.id)}
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
  ], [handleEditItem, handleDeleteItem]);

  const tabItems: TabsProps['items'] = useMemo(() => dictionaries.map(dictionary => ({
    key: dictionary.id,
    label: dictionary.name,
    children: (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {dictionary.name}
            </Title>
            {dictionary.description && (
              <Text type="secondary">{dictionary.description}</Text>
            )}
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddItem(dictionary)}>
            Добавить элемент
          </Button>
        </div>

        <Table
          columns={getItemColumns(dictionary)}
          dataSource={dictionary.items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          size="small"
        />
      </div>
    ),
  })), [dictionaries, getItemColumns, handleAddItem]);

  return (
    <div className="reference-data-page">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            <DatabaseOutlined /> Управление справочниками
          </Title>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Редактирование справочников, используемых во всех модулях системы
          </Text>
        </div>

        <Tabs items={tabItems} />
      </Card>

      <Modal
        title={editingItem ? 'Редактировать элемент справочника' : 'Добавить элемент в справочник'}
        open={itemModalVisible}
        onOk={handleSaveItem}
        onCancel={() => setItemModalVisible(false)}
        width={600}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isActive: true,
            sortOrder: 1,
          }}
        >
          <Form.Item name="code" label="Код (опционально)">
            <Input placeholder="Код элемента" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Наименование"
            rules={[{ required: true, message: 'Введите наименование' }]}
          >
            <Input placeholder="Наименование элемента" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={3} placeholder="Описание элемента" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sortOrder" label="Порядок сортировки">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Порядок" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Активен" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ReferenceDataPage;

