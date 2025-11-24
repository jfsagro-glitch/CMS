import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  Tabs,
  DatePicker,
  Radio,
  Drawer,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd/es/tabs';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  HomeOutlined,
  UnlockOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import type { EGRNRequest, EGRNServiceType } from '@/types/egrn';
import { loadEGRNDemoData } from '@/utils/egrnDemoData';
import dayjs from 'dayjs';
import './EGRNPage.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

type EGRNRequestRow = EGRNRequest & { key: string };

const EGRNPage: React.FC = () => {
  const location = useLocation();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<EGRNServiceType>('mortgage_registration');
  const [requests, setRequests] = useState<EGRNRequestRow[]>([]);
  const [loading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<EGRNRequestRow | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const handleCreateFromCard = useCallback((objectId: string, cadastralNumber: string, objectName: string) => {
    setSelectedRequest(null);
    form.resetFields();
    form.setFieldsValue({
      serviceType: 'extract',
      objectId,
      cadastralNumber,
      objectName,
      extractType: 'about_object',
      applicantType: 'legal',
      status: 'draft',
    });
    setActiveTab('extract');
    setDrawerVisible(true);
  }, [form]);

  // Загрузка данных из localStorage
  useEffect(() => {
    const loadRequests = () => {
      try {
        // Загружаем демо-данные, если их нет
        loadEGRNDemoData();
        
        const stored = localStorage.getItem('egrnRequests');
        if (stored) {
          const data = JSON.parse(stored) as EGRNRequest[];
          setRequests(
            data.map((item, index) => ({
              ...item,
              key: item.id || `egrn-${index}`,
            }))
          );
        }
      } catch (error) {
        console.error('Ошибка загрузки данных ЕГРН:', error);
      }
    };
    loadRequests();
  }, []);
  
  // Обработка параметров URL для создания запроса из карточки
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const objectId = params.get('objectId');
    const cadastralNumber = params.get('cadastralNumber');
    const objectName = params.get('objectName');
    
    if (objectId && cadastralNumber) {
      handleCreateFromCard(objectId, cadastralNumber, objectName || '');
      // Очищаем параметры из URL
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, location.pathname, handleCreateFromCard]);

  // Сохранение данных
  const saveRequests = (newRequests: EGRNRequest[]) => {
    try {
      localStorage.setItem('egrnRequests', JSON.stringify(newRequests));
      setRequests(
        newRequests.map((item, index) => ({
          ...item,
          key: item.id || `egrn-${index}`,
        }))
      );
    } catch (error) {
      console.error('Ошибка сохранения данных ЕГРН:', error);
      message.error('Ошибка сохранения данных');
    }
  };

  const filteredRequests = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return requests.filter(request => {
      const matchesTab = request.serviceType === activeTab;
      const matchesSearch =
        !search ||
        request.objectName?.toLowerCase().includes(search) ||
        String(request.reference || '').toLowerCase().includes(search) ||
        request.contractNumber?.toLowerCase().includes(search) ||
        request.cadastralNumber?.toLowerCase().includes(search);

      const matchesStatus = !statusFilter || request.status === statusFilter;

      return matchesTab && matchesSearch && matchesStatus;
    });
  }, [requests, activeTab, searchValue, statusFilter]);

  const stats = useMemo(() => {
    const tabRequests = requests.filter(r => r.serviceType === activeTab);
    const completed = tabRequests.filter(r => r.status === 'completed').length;
    const inProgress = tabRequests.filter(r => r.status === 'in_progress').length;
    const submitted = tabRequests.filter(r => r.status === 'submitted').length;

    return { total: tabRequests.length, completed, inProgress, submitted };
  }, [requests, activeTab]);

  const handleCreate = () => {
    setSelectedRequest(null);
    form.resetFields();
    form.setFieldsValue({
      serviceType: activeTab,
      applicantType: 'legal',
      status: 'draft',
    });
    setDrawerVisible(true);
  };

  const handleEdit = (request: EGRNRequestRow) => {
    setSelectedRequest(request);
    form.setFieldsValue({
      ...request,
      mortgageContractDate: request.mortgageContractDate ? dayjs(request.mortgageContractDate) : null,
      encumbranceDate: request.encumbranceDate ? dayjs(request.encumbranceDate) : null,
      submittedAt: request.submittedAt ? dayjs(request.submittedAt) : null,
      completedAt: request.completedAt ? dayjs(request.completedAt) : null,
      resultDate: request.resultDate ? dayjs(request.resultDate) : null,
    });
    setDrawerVisible(true);
  };

  const handleView = (request: EGRNRequestRow) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      const newRequest: EGRNRequest = {
        id: selectedRequest?.id || `egrn-${Date.now()}`,
        serviceType: activeTab,
        objectId: values.objectId,
        reference: values.reference,
        contractNumber: values.contractNumber,
        objectName: values.objectName,
        cadastralNumber: values.cadastralNumber,
        address: values.address,
        applicantName: values.applicantName,
        applicantInn: values.applicantInn,
        applicantType: values.applicantType,
        mortgageContractNumber: values.mortgageContractNumber,
        mortgageContractDate: values.mortgageContractDate ? values.mortgageContractDate.format('YYYY-MM-DD') : undefined,
        mortgageAmount: values.mortgageAmount,
        mortgageTerm: values.mortgageTerm,
        encumbranceType: values.encumbranceType,
        encumbranceNumber: values.encumbranceNumber,
        encumbranceDate: values.encumbranceDate ? values.encumbranceDate.format('YYYY-MM-DD') : undefined,
        removalReason: values.removalReason,
        extractType: values.extractType,
        extractPurpose: values.extractPurpose,
        status: values.status || 'draft',
        submittedAt: values.submittedAt ? values.submittedAt.format('YYYY-MM-DD') : undefined,
        completedAt: values.completedAt ? values.completedAt.format('YYYY-MM-DD') : undefined,
        resultDocument: values.resultDocument,
        resultNumber: values.resultNumber,
        resultDate: values.resultDate ? values.resultDate.format('YYYY-MM-DD') : undefined,
        comments: values.comments,
        rejectionReason: values.rejectionReason,
        createdAt: selectedRequest?.createdAt || dayjs().format('YYYY-MM-DD'),
        updatedAt: dayjs().format('YYYY-MM-DD'),
      };

      const updatedRequests = selectedRequest
        ? requests.map(r => (r.id === selectedRequest.id ? newRequest : r))
        : [...requests, newRequest];

      saveRequests(updatedRequests);
      message.success(selectedRequest ? 'Запрос обновлен' : 'Запрос создан');
      setDrawerVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      message.error('Ошибка сохранения запроса');
    }
  };

  const getStatusColor = (status: EGRNRequest['status']) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'submitted':
        return 'orange';
      case 'rejected':
        return 'red';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: EGRNRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined />;
      case 'rejected':
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getStatusLabel = (status: EGRNRequest['status']) => {
    const labels = {
      draft: 'Черновик',
      submitted: 'Подано',
      in_progress: 'В работе',
      completed: 'Завершено',
      rejected: 'Отклонено',
    };
    return labels[status];
  };

  const getServiceTypeLabel = (type: EGRNServiceType) => {
    switch (type) {
      case 'mortgage_registration':
        return 'Регистрация ДДУ';
      case 'encumbrance_removal':
        return 'Прекращение обременения';
      case 'extract':
        return 'Выписки ЕГРН';
      default:
        return type;
    }
  };

  const getStatusDescription = (status: EGRNRequest['status'], serviceType: EGRNServiceType): string => {
    if (status === 'in_progress') {
      if (serviceType === 'mortgage_registration') {
        return 'В Росреестре';
      }
      if (serviceType === 'encumbrance_removal') {
        return 'Подписание заявлений';
      }
      if (serviceType === 'extract') {
        return 'В обработке';
      }
      return 'Обрабатывается';
    }
    if (status === 'submitted') {
      if (serviceType === 'extract') {
        return 'Запрос отправлен';
      }
      return 'Отправляем в Росреестр';
    }
    if (status === 'completed') {
      if (serviceType === 'extract') {
        return 'Выписка получена';
      }
      return 'Сделка зарегистрирована';
    }
    if (status === 'rejected') {
      return 'Регистрация приостановлена';
    }
    if (status === 'draft') {
      return 'Черновик';
    }
    return '';
  };

  const getStatusSubDescription = (status: EGRNRequest['status'], serviceType?: EGRNServiceType): string => {
    if (status === 'in_progress') {
      if (serviceType === 'extract') {
        return 'Ожидание ответа';
      }
      return 'Обрабатывается';
    }
    if (status === 'submitted') {
      if (serviceType === 'extract') {
        return 'Ожидание обработки';
      }
      return '';
    }
    if (status === 'rejected') {
      return 'Регистрация приостановлена';
    }
    return '';
  };

  const [expandedParticipants, setExpandedParticipants] = useState<Record<string, boolean>>({});

  const toggleParticipants = (id: string) => {
    setExpandedParticipants(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const columns: ColumnsType<EGRNRequestRow> = [
    {
      title: 'Отправлено',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('DD.MM.YYYY') : '—'),
    },
    {
      title: 'Адрес объекта',
      key: 'address',
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.address || '—'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {getServiceTypeLabel(record.serviceType)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 250,
      render: (status: EGRNRequest['status'], record) => {
        const description = getStatusDescription(status, record.serviceType);
        const subDescription = getStatusSubDescription(status);
        const color = getStatusColor(status);
        
        return (
          <Space direction="vertical" size={0}>
            <Space>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor:
                    color === 'green' ? '#52c41a' :
                    color === 'orange' ? '#fa8c16' :
                    color === 'blue' ? '#1890ff' :
                    color === 'red' ? '#ff4d4f' :
                    '#d9d9d9',
                  display: 'inline-block',
                }}
              />
              <Text>{description || getStatusLabel(status)}</Text>
            </Space>
            {subDescription && (
              <Text type="secondary" style={{ fontSize: '12px', marginLeft: 16 }}>
                {getStatusSubDescription(status, record.serviceType)}
              </Text>
            )}
            {status === 'in_progress' && record.serviceType === 'encumbrance_removal' && (
              <Text type="secondary" style={{ fontSize: '12px', marginLeft: 16 }}>
                Требуется подпись
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Сотрудник',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 180,
      render: (name: string) => name || '—',
    },
    {
      title: 'Участники',
      key: 'participants',
      width: 250,
      render: (_, record) => {
        const participants = record.participants || [];
        const isExpanded = expandedParticipants[record.id];
        const visibleCount = isExpanded ? participants.length : 2;
        const visibleParticipants = participants.slice(0, visibleCount);
        const remainingCount = participants.length - visibleCount;

        if (participants.length === 0) {
          return <Text type="secondary">—</Text>;
        }

        return (
          <Space direction="vertical" size={0}>
            {visibleParticipants.map((participant, index) => (
              <Text key={index}>{participant}</Text>
            ))}
            {remainingCount > 0 && (
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: 'auto', fontSize: '12px' }}
                onClick={() => toggleParticipants(record.id)}
              >
                ещё {remainingCount}
              </Button>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="Просмотр">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)} />
        </Tooltip>
      ),
    },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'mortgage_registration',
      label: (
        <Space>
          <HomeOutlined />
          Регистрация ипотеки
        </Space>
      ),
    },
    {
      key: 'encumbrance_removal',
      label: (
        <Space>
          <UnlockOutlined />
          Снятие обременений
        </Space>
      ),
    },
    {
      key: 'extract',
      label: (
        <Space>
          <FileSearchOutlined />
          Выписки ЕГРН
        </Space>
      ),
    },
  ];

  const renderFormFields = () => {
    if (activeTab === 'mortgage_registration') {
      return (
        <>
          <Form.Item name="mortgageContractNumber" label="Номер договора ипотеки" rules={[{ required: true }]}>
            <Input placeholder="Номер договора" />
          </Form.Item>
          <Form.Item name="mortgageContractDate" label="Дата договора ипотеки" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="mortgageAmount" label="Сумма ипотеки, руб.">
            <Input type="number" placeholder="Сумма" />
          </Form.Item>
          <Form.Item name="mortgageTerm" label="Срок ипотеки">
            <Input placeholder="Срок" />
          </Form.Item>
        </>
      );
    } else if (activeTab === 'encumbrance_removal') {
      return (
        <>
          <Form.Item name="encumbranceType" label="Тип обременения" rules={[{ required: true }]}>
            <Select placeholder="Выберите тип">
              <Option value="ипотека">Ипотека</Option>
              <Option value="аренда">Аренда</Option>
              <Option value="залог">Залог</Option>
              <Option value="сервитут">Сервитут</Option>
              <Option value="другое">Другое</Option>
            </Select>
          </Form.Item>
          <Form.Item name="encumbranceNumber" label="Номер обременения">
            <Input placeholder="Номер" />
          </Form.Item>
          <Form.Item name="encumbranceDate" label="Дата регистрации обременения">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="removalReason" label="Основание для снятия" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Основание для снятия обременения" />
          </Form.Item>
        </>
      );
    } else if (activeTab === 'extract') {
      return (
        <>
          <Form.Item name="extractType" label="Тип выписки" rules={[{ required: true }]}>
            <Select placeholder="Выберите тип">
              <Option value="full">Полная выписка</Option>
              <Option value="short">Краткая выписка</Option>
              <Option value="about_object">Выписка об объекте</Option>
              <Option value="about_rights">Выписка о правах</Option>
            </Select>
          </Form.Item>
          <Form.Item name="extractPurpose" label="Цель получения выписки">
            <TextArea rows={2} placeholder="Цель получения выписки" />
          </Form.Item>
        </>
      );
    }
    return null;
  };

  return (
    <div className="egrn-page">
      <div className="egrn-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Сделки
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}>
          + Создать сделку
        </Button>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={key => {
            setActiveTab(key as EGRNServiceType);
            setStatusFilter(null);
            setSearchValue('');
          }}
          items={tabItems}
        />
      </Card>

      <Row gutter={[16, 16]} className="egrn-page__stats">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Всего запросов" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Подано"
              value={stats.submitted}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="В работе"
              value={stats.inProgress}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Завершено"
              value={stats.completed}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            allowClear
            placeholder="Поиск по объекту, REFERENCE, договору, кадастровому номеру"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            style={{ width: '100%' }}
          />
          <Select
            allowClear
            placeholder="Статус"
            style={{ width: 150 }}
            value={statusFilter ?? undefined}
            onChange={value => setStatusFilter(value ?? null)}
          >
            <Option value="draft">Черновик</Option>
            <Option value="submitted">Подано</Option>
            <Option value="in_progress">В работе</Option>
            <Option value="completed">Завершено</Option>
            <Option value="rejected">Отклонено</Option>
          </Select>
        </Space>
      </Card>

          <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredRequests}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          loading={loading}
          locale={{
            emptyText: <Empty description="Нет регистраций" />,
          }}
          rowClassName={() => 'egrn-table-row'}
          onRow={(record) => ({
            onClick: () => handleView(record),
          })}
        />
      </Card>

      {/* Модалка просмотра */}
      <Modal
        title={
          <Space>
            {selectedRequest?.serviceType === 'extract' ? (
              <FileSearchOutlined />
            ) : selectedRequest?.serviceType === 'encumbrance_removal' ? (
              <UnlockOutlined />
            ) : (
              <HomeOutlined />
            )}
            <span>{selectedRequest ? getServiceTypeLabel(selectedRequest.serviceType) : 'Детали запроса'}</span>
            {selectedRequest && (
              <Tag color={getStatusColor(selectedRequest.status)}>
                {getStatusLabel(selectedRequest.status)}
              </Tag>
            )}
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="edit" icon={<EditOutlined />} onClick={() => {
            if (selectedRequest) {
              handleEdit(selectedRequest);
              setModalVisible(false);
            }
          }}>
            Редактировать
          </Button>,
          <Button key="close" onClick={() => setModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
        width={800}
      >
        {selectedRequest && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Тип услуги" span={2}>
              {getServiceTypeLabel(selectedRequest.serviceType)}
            </Descriptions.Item>
            <Descriptions.Item label="Объект" span={2}>
              {selectedRequest.objectName || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Адрес" span={2}>
              {selectedRequest.address || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Кадастровый номер">
              {selectedRequest.cadastralNumber || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="REFERENCE">
              {selectedRequest.reference || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Номер договора залога">
              {selectedRequest.contractNumber || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Дата отправки">
              {selectedRequest.submittedAt ? dayjs(selectedRequest.submittedAt).format('DD.MM.YYYY') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Сотрудник">
              {selectedRequest.employeeName || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Участники" span={2}>
              {selectedRequest.participants && selectedRequest.participants.length > 0
                ? selectedRequest.participants.join(', ')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Заявитель" span={2}>
              {selectedRequest.applicantName || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="ИНН заявителя">
              {selectedRequest.applicantInn || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Статус">
              <Tag color={getStatusColor(selectedRequest.status)} icon={getStatusIcon(selectedRequest.status)}>
                {getStatusLabel(selectedRequest.status)}
              </Tag>
            </Descriptions.Item>
            {selectedRequest.serviceType === 'mortgage_registration' && (
              <>
                <Descriptions.Item label="Номер договора ипотеки">
                  {selectedRequest.mortgageContractNumber || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Дата договора">
                  {selectedRequest.mortgageContractDate ? dayjs(selectedRequest.mortgageContractDate).format('DD.MM.YYYY') : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Сумма ипотеки">
                  {selectedRequest.mortgageAmount
                    ? new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                        maximumFractionDigits: 0,
                      }).format(selectedRequest.mortgageAmount)
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Срок ипотеки">
                  {selectedRequest.mortgageTerm || '—'}
                </Descriptions.Item>
              </>
            )}
            {selectedRequest.serviceType === 'encumbrance_removal' && (
              <>
                <Descriptions.Item label="Тип обременения">
                  {selectedRequest.encumbranceType || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Номер обременения">
                  {selectedRequest.encumbranceNumber || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Дата регистрации">
                  {selectedRequest.encumbranceDate ? dayjs(selectedRequest.encumbranceDate).format('DD.MM.YYYY') : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Основание для снятия" span={2}>
                  {selectedRequest.removalReason || '—'}
                </Descriptions.Item>
              </>
            )}
            {selectedRequest.serviceType === 'extract' && (
              <>
                <Descriptions.Item label="Тип выписки">
                  {selectedRequest.extractType === 'full'
                    ? 'Полная выписка'
                    : selectedRequest.extractType === 'short'
                      ? 'Краткая выписка'
                      : selectedRequest.extractType === 'about_object'
                        ? 'Выписка об объекте'
                        : selectedRequest.extractType === 'about_rights'
                          ? 'Выписка о правах'
                          : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Цель получения">
                  {selectedRequest.extractPurpose || '—'}
                </Descriptions.Item>
                {selectedRequest.cost && (
                  <Descriptions.Item label="Стоимость">
                    {new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    }).format(selectedRequest.cost)}
                  </Descriptions.Item>
                )}
                {selectedRequest.completedAt && (
                  <Descriptions.Item label="Дата получения">
                    {dayjs(selectedRequest.completedAt).format('DD.MM.YYYY')}
                  </Descriptions.Item>
                )}
              </>
            )}
            {selectedRequest.resultNumber && (
              <Descriptions.Item label={selectedRequest.serviceType === 'extract' ? 'Номер выписки' : 'Номер результата'}>
                {selectedRequest.resultNumber}
              </Descriptions.Item>
            )}
            {selectedRequest.resultDate && (
              <Descriptions.Item label={selectedRequest.serviceType === 'extract' ? 'Дата выписки' : 'Дата результата'}>
                {dayjs(selectedRequest.resultDate).format('DD.MM.YYYY')}
              </Descriptions.Item>
            )}
            {selectedRequest.resultDocument && (
              <Descriptions.Item label="Документ" span={2}>
                <Button type="link" icon={<FileSearchOutlined />} onClick={() => {
                  message.info('Скачивание документа...');
                }}>
                  Скачать документ
                </Button>
              </Descriptions.Item>
            )}
            {selectedRequest.comments && (
              <Descriptions.Item label="Комментарии" span={2}>
                {selectedRequest.comments}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Drawer для создания/редактирования */}
      <Drawer
        title={selectedRequest ? 'Редактировать запрос' : `Создать запрос: ${getServiceTypeLabel(activeTab)}`}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            serviceType: activeTab,
            applicantType: 'legal',
            status: 'draft',
          }}
        >
          <Form.Item name="serviceType" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="objectName" label="Наименование объекта" rules={[{ required: true }]}>
            <Input placeholder="Наименование объекта" />
          </Form.Item>
          <Form.Item name="cadastralNumber" label="Кадастровый номер" rules={[{ required: true }]}>
            <Input placeholder="23:49:0303008:1915" />
          </Form.Item>
          <Form.Item name="address" label="Адрес">
            <Input placeholder="Адрес объекта" />
          </Form.Item>
          <Form.Item name="reference" label="REFERENCE">
            <Input placeholder="REFERENCE сделки" />
          </Form.Item>
          <Form.Item name="contractNumber" label="Номер договора залога">
            <Input placeholder="Номер договора" />
          </Form.Item>
          <Form.Item name="applicantType" label="Тип заявителя">
            <Radio.Group>
              <Radio value="legal">Юридическое лицо</Radio>
              <Radio value="individual">Физическое лицо</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="applicantName" label="Наименование заявителя" rules={[{ required: true }]}>
            <Input placeholder="Наименование" />
          </Form.Item>
          <Form.Item name="applicantInn" label="ИНН заявителя">
            <Input placeholder="ИНН" />
          </Form.Item>
          {renderFormFields()}
          <Form.Item name="status" label="Статус">
            <Select>
              <Option value="draft">Черновик</Option>
              <Option value="submitted">Подано</Option>
              <Option value="in_progress">В работе</Option>
              <Option value="completed">Завершено</Option>
              <Option value="rejected">Отклонено</Option>
            </Select>
          </Form.Item>
          <Form.Item name="submittedAt" label="Дата подачи">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="completedAt" label="Дата завершения">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="resultNumber" label="Номер результата">
            <Input placeholder="Номер выписки/регистрации" />
          </Form.Item>
          <Form.Item name="resultDate" label="Дата результата">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="comments" label="Комментарии">
            <TextArea rows={3} placeholder="Комментарии" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedRequest ? 'Сохранить' : 'Создать'}
              </Button>
              <Button
                onClick={() => {
                  setDrawerVisible(false);
                  form.resetFields();
                }}
              >
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default EGRNPage;

