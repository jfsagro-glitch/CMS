/**
 * Сервис регистрации залога движимого имущества ФНП
 * (Федеральная нотариальная палата)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  DatePicker,
  message,
  Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { FNPRegistration } from '@/types/fnp';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './FNPServicePage.css';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Paragraph } = Typography;

type FNPRegistrationRow = FNPRegistration & { key: string };

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | string | null | undefined) => {
  const numeric = typeof value === 'string' ? parseFloat(value.replace(/\s/g, '').replace(',', '.')) : Number(value);
  return Number.isFinite(numeric) ? currencyFormatter.format(numeric) : '—';
};

const formatText = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return '—';
  }
  const text = String(value).trim();
  return text.length > 0 ? text : '—';
};

const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  draft: { color: 'default', text: 'Черновик', icon: <FileTextOutlined /> },
  submitted: { color: 'processing', text: 'Подано', icon: <ClockCircleOutlined /> },
  registered: { color: 'success', text: 'Зарегистрировано', icon: <CheckCircleOutlined /> },
  rejected: { color: 'error', text: 'Отклонено', icon: <CloseCircleOutlined /> },
  cancelled: { color: 'default', text: 'Аннулировано', icon: <CloseCircleOutlined /> },
};

const FNPServicePage: React.FC = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<FNPRegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<FNPRegistrationRow | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [form] = Form.useForm();
  const [portfolioData, setPortfolioData] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Загружаем данные регистраций из localStorage (в реальном приложении - из API)
        const stored = localStorage.getItem('fnp_registrations');
        let data: FNPRegistration[] = [];
        if (stored) {
          data = JSON.parse(stored);
        } else {
          // Генерируем демо-данные
          data = generateDemoRegistrations();
          localStorage.setItem('fnp_registrations', JSON.stringify(data));
        }

        if (!mounted) return;
        setRegistrations(
          data.map((item, index) => ({
            ...item,
            key: item.id || `fnp-${index}`,
          }))
        );

        // Загружаем данные портфеля для автозаполнения
        await loadPortfolioData();
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Неизвестная ошибка');
        setRegistrations([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const loadPortfolioData = async () => {
    try {
      const base = import.meta.env.BASE_URL ?? '/';
      const resolvedBase = new URL(base, window.location.origin);
      const normalizedPath = resolvedBase.pathname.endsWith('/')
        ? resolvedBase.pathname
        : `${resolvedBase.pathname}/`;
      const url = `${resolvedBase.origin}${normalizedPath}portfolioData.json?v=${Date.now()}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setPortfolioData(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных портфеля:', error);
    }
  };

  const generateDemoRegistrations = (): FNPRegistration[] => {
    const types = ['Транспортные средства', 'Оборудование', 'Товары в обороте'];
    const statuses: FNPRegistration['status'][] = ['draft', 'submitted', 'registered', 'rejected'];
    const registrations: FNPRegistration[] = [];

    for (let i = 1; i <= 20; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const statusInfo = statusConfig[status];

      registrations.push({
        id: `fnp-${i}`,
        registrationNumber: status === 'registered' ? `ФНП-${2024}-${String(i).padStart(6, '0')}` : undefined,
        registrationDate: status === 'registered' ? dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD') : undefined,
        status,
        statusText: statusInfo.text,
        reference: `REF-${1000 + i}`,
        contractNumber: `ДЗ-${2024}-${i}`,
        pledgerName: `ООО "Компания ${i}"`,
        pledgerInn: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        pledgerType: 'legal',
        borrowerName: `Заемщик ${i}`,
        collateralType: type,
        collateralName: type === 'Транспортные средства' 
          ? `Автомобиль ${['Toyota', 'BMW', 'Mercedes', 'Audi'][Math.floor(Math.random() * 4)]}`
          : type === 'Оборудование'
            ? `Оборудование ${i}`
            : `Товары ${i}`,
        vehicleBrand: type === 'Транспортные средства' ? ['Toyota', 'BMW', 'Mercedes'][Math.floor(Math.random() * 3)] : undefined,
        vehicleModel: type === 'Транспортные средства' ? 'Model X' : undefined,
        vehicleYear: type === 'Транспортные средства' ? 2020 + Math.floor(Math.random() * 4) : undefined,
        vehicleVin: type === 'Транспортные средства' ? `VIN${Math.random().toString(36).substring(2, 17).toUpperCase()}` : undefined,
        marketValue: Math.floor(Math.random() * 5000000) + 500000,
        collateralValue: Math.floor(Math.random() * 4000000) + 400000,
        pledgeContractNumber: `ДЗ-${2024}-${i}`,
        pledgeContractDate: dayjs().subtract(Math.floor(Math.random() * 60), 'day').format('YYYY-MM-DD'),
        pledgeAmount: Math.floor(Math.random() * 3000000) + 300000,
        createdAt: dayjs().subtract(Math.floor(Math.random() * 90), 'day').toISOString(),
        updatedAt: dayjs().subtract(Math.floor(Math.random() * 10), 'day').toISOString(),
      });
    }

    return registrations;
  };

  const filteredRegistrations = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return registrations.filter(reg => {
      const matchesSearch =
        !search ||
        [
          reg.registrationNumber,
          reg.pledgerName,
          reg.contractNumber,
          reg.reference,
          reg.collateralName,
          reg.collateralType,
        ]
          .filter(Boolean)
          .some(val => String(val).toLowerCase().includes(search));

      const matchesStatus = !statusFilter || reg.status === statusFilter;
      const matchesType = !typeFilter || reg.collateralType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [registrations, searchValue, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = filteredRegistrations.length;
    const draft = filteredRegistrations.filter(r => r.status === 'draft').length;
    const submitted = filteredRegistrations.filter(r => r.status === 'submitted').length;
    const registered = filteredRegistrations.filter(r => r.status === 'registered').length;
    return { total, draft, submitted, registered };
  }, [filteredRegistrations]);

  const statusOptions = useMemo(
    () =>
      Array.from(new Set(registrations.map(r => r.status))).map(status => ({
        label: statusConfig[status].text,
        value: status,
      })),
    [registrations],
  );

  const typeOptions = useMemo(
    () =>
      Array.from(new Set(registrations.map(r => r.collateralType))).map(type => ({
        label: type,
        value: type,
      })),
    [registrations],
  );

  const handleViewRegistration = (record: FNPRegistrationRow) => {
    setSelectedRegistration(record);
    setModalVisible(true);
  };

  const handleCreateRegistration = () => {
    setSelectedRegistration(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'draft',
      pledgerType: 'legal',
      pledgeContractDate: dayjs(),
    });
    setFormVisible(true);
  };

  const handleEditRegistration = React.useCallback((record: FNPRegistrationRow) => {
    setSelectedRegistration(record);
    form.setFieldsValue({
      ...record,
      pledgeContractDate: record.pledgeContractDate ? dayjs(record.pledgeContractDate) : undefined,
      registrationDate: record.registrationDate ? dayjs(record.registrationDate) : undefined,
    });
    setFormVisible(true);
  }, [form]);

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const now = dayjs().toISOString();

      if (selectedRegistration) {
        // Редактирование
        const updated: FNPRegistration = {
          ...selectedRegistration,
          ...values,
          pledgeContractDate: values.pledgeContractDate?.format('YYYY-MM-DD'),
          registrationDate: values.registrationDate?.format('YYYY-MM-DD'),
          updatedAt: now,
        };
        const updatedList = registrations.map(r => (r.id === selectedRegistration.id ? { ...updated, key: updated.id } : r));
        setRegistrations(updatedList);
        localStorage.setItem('fnp_registrations', JSON.stringify(updatedList));
        message.success('Регистрация обновлена');
      } else {
        // Создание
        const newReg: FNPRegistration = {
          id: `fnp-${Date.now()}`,
          status: values.status || 'draft',
          statusText: statusConfig[values.status || 'draft'].text,
          ...values,
          pledgeContractDate: values.pledgeContractDate?.format('YYYY-MM-DD'),
          registrationDate: values.registrationDate?.format('YYYY-MM-DD'),
          createdAt: now,
          updatedAt: now,
        };
        const updatedList = [...registrations, { ...newReg, key: newReg.id }];
        setRegistrations(updatedList);
        localStorage.setItem('fnp_registrations', JSON.stringify(updatedList));
        message.success('Регистрация создана');
      }

      setFormVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      message.error('Ошибка при сохранении регистрации');
    }
  };

  const handleDeleteRegistration = React.useCallback((id: string) => {
    Modal.confirm({
      title: 'Удалить регистрацию?',
      content: 'Это действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: () => {
        const updatedList = registrations.filter(r => r.id !== id);
        setRegistrations(updatedList);
        localStorage.setItem('fnp_registrations', JSON.stringify(updatedList));
        message.success('Регистрация удалена');
      },
    });
  }, [registrations]);

  const handleReferenceChange = (reference: string) => {
    const deal = portfolioData.find((d: any) => String(d.reference) === String(reference));
    if (deal) {
      form.setFieldsValue({
        contractNumber: deal.contractNumber || null,
        pledgerName: deal.pledger || null,
        pledgerInn: deal.inn || null,
        borrowerName: deal.borrower || null,
        collateralType: deal.collateralType || null,
        collateralName: deal.collateralType || null,
        marketValue: deal.marketValue || deal.currentMarketValue || null,
        collateralValue: deal.collateralValue || null,
        pledgeAmount: deal.debtRub || null,
      });
    }
  };

  const handleGoToPortfolio = React.useCallback((reference?: string | null) => {
    if (reference) {
      navigate(`/portfolio?q=${reference}`);
    }
  }, [navigate]);

  const columns: ColumnsType<FNPRegistrationRow> = useMemo(
    () => [
      {
        title: '№ регистрации',
        dataIndex: 'registrationNumber',
        key: 'registrationNumber',
        width: 150,
        render: (text, record: FNPRegistrationRow) => (
          <Button type="link" onClick={() => handleViewRegistration(record)} style={{ padding: 0 }}>
            {text || <span style={{ color: '#999' }}>—</span>}
          </Button>
        ),
      },
      {
        title: 'Дата регистрации',
        dataIndex: 'registrationDate',
        key: 'registrationDate',
        width: 120,
        render: text => formatText(text),
      },
      {
        title: 'REFERENCE',
        dataIndex: 'reference',
        key: 'reference',
        width: 120,
        render: (text) => (
          <Tooltip title={text}>
            <Button
              type="link"
              onClick={() => handleGoToPortfolio(text)}
              style={{ padding: 0 }}
            >
              <Typography.Text copyable ellipsis={{ suffix: String(text).slice(-4) }}>
                {text}
              </Typography.Text>
            </Button>
          </Tooltip>
        ),
      },
      {
        title: 'Залогодатель',
        dataIndex: 'pledgerName',
        key: 'pledgerName',
        width: 200,
        render: text => formatText(text),
      },
      {
        title: 'Тип имущества',
        dataIndex: 'collateralType',
        key: 'collateralType',
        width: 150,
        render: text => formatText(text),
      },
      {
        title: 'Предмет залога',
        dataIndex: 'collateralName',
        key: 'collateralName',
        width: 200,
        render: text => formatText(text),
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        width: 150,
        render: (status: string, record) => {
          const config = statusConfig[status] || statusConfig.draft;
          return (
            <Tag color={config.color} icon={config.icon}>
              {record.statusText}
            </Tag>
          );
        },
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="Просмотреть">
              <Button icon={<EyeOutlined />} onClick={() => handleViewRegistration(record)} size="small" />
            </Tooltip>
            {record.status === 'draft' && (
              <Tooltip title="Редактировать">
                <Button icon={<EditOutlined />} onClick={() => handleEditRegistration(record)} size="small" />
              </Tooltip>
            )}
            {record.status === 'draft' && (
              <Tooltip title="Удалить">
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteRegistration(record.id)}
                  size="small"
                  danger
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ],
    [handleGoToPortfolio, handleEditRegistration, handleDeleteRegistration],
  );

  return (
    <div className="fnp-service-page">
      <div className="fnp-header">
        <div>
          <Title level={2} className="fnp-title">
            Регистрация залога движимого имущества ФНП
          </Title>
          <Paragraph className="fnp-subtitle">
            Сервис регистрации залога движимого имущества в реестре Федеральной нотариальной палаты
          </Paragraph>
        </div>
        <Space size="middle">
          <Input
            allowClear
            size="large"
            placeholder="Поиск по №, REFERENCE, залогодателю"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            style={{ width: 360 }}
          />
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreateRegistration}
          >
            Создать регистрацию
          </Button>
        </Space>
      </div>

      <Card>
        <div className="fnp-filters">
          <Select
            allowClear
            placeholder="Статус регистрации"
            style={{ width: 200 }}
            options={statusOptions}
            value={statusFilter ?? undefined}
            onChange={v => setStatusFilter(v ?? null)}
          />
          <Select
            allowClear
            placeholder="Тип имущества"
            style={{ width: 200 }}
            options={typeOptions}
            value={typeFilter ?? undefined}
            onChange={v => setTypeFilter(v ?? null)}
          />
        </div>
      </Card>

      <Row gutter={[16, 16]} className="fnp-stats">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Всего регистраций" value={stats.total} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Черновики" value={stats.draft} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Подано" value={stats.submitted} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Зарегистрировано" value={stats.registered} />
          </Card>
        </Col>
      </Row>

      <Card className="fnp-table-card" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredRegistrations}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1400 }}
          loading={loading}
          onRow={record => ({
            onDoubleClick: () => handleViewRegistration(record),
          })}
          locale={{
            emptyText: (
              <Empty
                description="Нет регистраций, удовлетворяющих фильтрам"
                className="fnp-empty"
              />
            ),
          }}
        />
      </Card>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить данные регистраций"
          description={error}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              Повторить
            </Button>
          }
        />
      )}

      {/* Модальное окно просмотра регистрации */}
      <Modal
        title="Регистрация залога ФНП"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          selectedRegistration?.status === 'draft' && (
            <Button key="edit" icon={<EditOutlined />} onClick={() => {
              setModalVisible(false);
              handleEditRegistration(selectedRegistration!);
            }}>
              Редактировать
            </Button>
          ),
          <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
        width="90%"
        style={{ top: 20 }}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {selectedRegistration && (
          <div className="fnp-registration-details">
            <Descriptions bordered column={3} size="small">
              <Descriptions.Item label="№ регистрации" span={1}>
                {formatText(selectedRegistration.registrationNumber) || <span style={{ color: '#999' }}>Не присвоен</span>}
              </Descriptions.Item>
              <Descriptions.Item label="Дата регистрации" span={1}>
                {formatText(selectedRegistration.registrationDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Статус" span={1}>
                <Tag color={statusConfig[selectedRegistration.status].color} icon={statusConfig[selectedRegistration.status].icon}>
                  {selectedRegistration.statusText}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="REFERENCE" span={1}>
                <Button
                  type="link"
                  onClick={() => handleGoToPortfolio(selectedRegistration.reference)}
                  style={{ padding: 0 }}
                >
                  {formatText(selectedRegistration.reference)}
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="№ договора залога" span={2}>
                {formatText(selectedRegistration.pledgeContractNumber)}
              </Descriptions.Item>

              <Divider orientation="left">Залогодатель</Divider>
              <Descriptions.Item label="Наименование" span={2}>
                {formatText(selectedRegistration.pledgerName)}
              </Descriptions.Item>
              <Descriptions.Item label="Тип" span={1}>
                {selectedRegistration.pledgerType === 'legal' ? 'Юридическое лицо' : 'Физическое лицо'}
              </Descriptions.Item>
              <Descriptions.Item label="ИНН">{formatText(selectedRegistration.pledgerInn)}</Descriptions.Item>
              <Descriptions.Item label="ОГРН">{formatText(selectedRegistration.pledgerOgrn)}</Descriptions.Item>
              <Descriptions.Item label="Адрес" span={3}>
                {formatText(selectedRegistration.pledgerAddress)}
              </Descriptions.Item>

              {selectedRegistration.borrowerName && (
                <>
                  <Divider orientation="left">Заемщик</Divider>
                  <Descriptions.Item label="Наименование" span={2}>
                    {formatText(selectedRegistration.borrowerName)}
                  </Descriptions.Item>
                  <Descriptions.Item label="ИНН">{formatText(selectedRegistration.borrowerInn)}</Descriptions.Item>
                </>
              )}

              <Divider orientation="left">Предмет залога</Divider>
              <Descriptions.Item label="Тип имущества" span={1}>
                {formatText(selectedRegistration.collateralType)}
              </Descriptions.Item>
              <Descriptions.Item label="Наименование" span={2}>
                {formatText(selectedRegistration.collateralName)}
              </Descriptions.Item>

              {selectedRegistration.collateralType === 'Транспортные средства' && (
                <>
                  <Descriptions.Item label="Марка">{formatText(selectedRegistration.vehicleBrand)}</Descriptions.Item>
                  <Descriptions.Item label="Модель">{formatText(selectedRegistration.vehicleModel)}</Descriptions.Item>
                  <Descriptions.Item label="Год выпуска">{formatText(selectedRegistration.vehicleYear)}</Descriptions.Item>
                  <Descriptions.Item label="VIN">{formatText(selectedRegistration.vehicleVin)}</Descriptions.Item>
                  <Descriptions.Item label="Гос. номер">{formatText(selectedRegistration.vehicleRegistrationNumber)}</Descriptions.Item>
                  <Descriptions.Item label="Номер кузова">{formatText(selectedRegistration.vehicleBodyNumber)}</Descriptions.Item>
                  <Descriptions.Item label="Номер шасси">{formatText(selectedRegistration.vehicleChassisNumber)}</Descriptions.Item>
                  <Descriptions.Item label="Номер рамы">{formatText(selectedRegistration.vehicleFrameNumber)}</Descriptions.Item>
                </>
              )}

              {selectedRegistration.collateralType === 'Оборудование' && (
                <>
                  <Descriptions.Item label="Наименование" span={2}>
                    {formatText(selectedRegistration.equipmentName)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Производитель">{formatText(selectedRegistration.equipmentManufacturer)}</Descriptions.Item>
                  <Descriptions.Item label="Модель">{formatText(selectedRegistration.equipmentModel)}</Descriptions.Item>
                  <Descriptions.Item label="Серийный номер">{formatText(selectedRegistration.equipmentSerialNumber)}</Descriptions.Item>
                  <Descriptions.Item label="Инвентарный номер">{formatText(selectedRegistration.equipmentInventoryNumber)}</Descriptions.Item>
                  <Descriptions.Item label="Год выпуска">{formatText(selectedRegistration.equipmentYear)}</Descriptions.Item>
                </>
              )}

              <Divider orientation="left">Оценка</Divider>
              <Descriptions.Item label="Рыночная стоимость">{formatCurrency(selectedRegistration.marketValue)}</Descriptions.Item>
              <Descriptions.Item label="Залоговая стоимость">{formatCurrency(selectedRegistration.collateralValue)}</Descriptions.Item>
              <Descriptions.Item label="Сумма обязательства">{formatCurrency(selectedRegistration.pledgeAmount)}</Descriptions.Item>

              <Divider orientation="left">Договор залога</Divider>
              <Descriptions.Item label="№ договора">{formatText(selectedRegistration.pledgeContractNumber)}</Descriptions.Item>
              <Descriptions.Item label="Дата договора">{formatText(selectedRegistration.pledgeContractDate)}</Descriptions.Item>
              <Descriptions.Item label="Сумма обязательства">{formatCurrency(selectedRegistration.pledgeAmount)}</Descriptions.Item>

              {selectedRegistration.notaryName && (
                <>
                  <Divider orientation="left">Нотариус</Divider>
                  <Descriptions.Item label="ФИО нотариуса" span={2}>
                    {formatText(selectedRegistration.notaryName)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Регион">{formatText(selectedRegistration.notaryRegion)}</Descriptions.Item>
                  <Descriptions.Item label="Нотариальная контора" span={3}>
                    {formatText(selectedRegistration.notaryOffice)}
                  </Descriptions.Item>
                </>
              )}

              {selectedRegistration.rejectionReason && (
                <>
                  <Divider orientation="left">Отклонение</Divider>
                  <Descriptions.Item label="Причина отклонения" span={3}>
                    <Paragraph style={{ margin: 0, color: '#ff4d4f' }}>
                      {selectedRegistration.rejectionReason}
                    </Paragraph>
                  </Descriptions.Item>
                </>
              )}

              {selectedRegistration.comments && (
                <>
                  <Divider orientation="left">Комментарии</Divider>
                  <Descriptions.Item label="Примечания" span={3}>
                    <Paragraph style={{ margin: 0 }}>{selectedRegistration.comments}</Paragraph>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Модальное окно создания/редактирования регистрации */}
      <Modal
        title={selectedRegistration ? 'Редактировать регистрацию' : 'Создать регистрацию залога ФНП'}
        open={formVisible}
        onCancel={() => {
          setFormVisible(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setFormVisible(false);
            form.resetFields();
          }}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={handleFormSubmit}>
            {selectedRegistration ? 'Сохранить' : 'Создать'}
          </Button>,
        ]}
        width={900}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="reference"
            label="REFERENCE сделки"
            tooltip="Выберите сделку из портфеля для автозаполнения данных"
          >
            <Select
              placeholder="Выберите REFERENCE"
              showSearch
              allowClear
              onChange={handleReferenceChange}
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {portfolioData.map((deal: any) => (
                <Option key={deal.reference} value={deal.reference}>
                  {deal.reference} - {deal.borrower || deal.pledger || 'Не указано'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Статус" rules={[{ required: true }]}>
            <Select>
              <Option value="draft">Черновик</Option>
              <Option value="submitted">Подано</Option>
              <Option value="registered">Зарегистрировано</Option>
              <Option value="rejected">Отклонено</Option>
              <Option value="cancelled">Аннулировано</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">Залогодатель</Divider>
          <Form.Item name="pledgerType" label="Тип залогодателя" rules={[{ required: true }]}>
            <Select>
              <Option value="legal">Юридическое лицо</Option>
              <Option value="individual">Физическое лицо</Option>
            </Select>
          </Form.Item>

          <Form.Item name="pledgerName" label="Наименование залогодателя" rules={[{ required: true }]}>
            <Input placeholder="Наименование" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pledgerInn" label="ИНН">
                <Input placeholder="ИНН" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pledgerOgrn" label="ОГРН">
                <Input placeholder="ОГРН" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="pledgerAddress" label="Адрес залогодателя">
            <TextArea rows={2} placeholder="Адрес" />
          </Form.Item>

          <Divider orientation="left">Заемщик</Divider>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="borrowerName" label="Наименование заемщика">
                <Input placeholder="Наименование" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="borrowerInn" label="ИНН заемщика">
                <Input placeholder="ИНН" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Предмет залога</Divider>
          <Form.Item name="collateralType" label="Тип движимого имущества" rules={[{ required: true }]}>
            <Select placeholder="Выберите тип">
              <Option value="Транспортные средства">Транспортные средства</Option>
              <Option value="Оборудование">Оборудование</Option>
              <Option value="Товары в обороте">Товары в обороте</Option>
            </Select>
          </Form.Item>

          <Form.Item name="collateralName" label="Наименование предмета залога" rules={[{ required: true }]}>
            <Input placeholder="Наименование" />
          </Form.Item>

          <Form.Item name="collateralDescription" label="Описание предмета залога">
            <TextArea rows={3} placeholder="Подробное описание" />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.collateralType !== currentValues.collateralType}>
            {({ getFieldValue }) => {
              const collateralType = getFieldValue('collateralType');
              if (collateralType === 'Транспортные средства') {
                return (
                  <>
                    <Divider orientation="left">Данные транспортного средства</Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="vehicleBrand" label="Марка">
                          <Input placeholder="Марка ТС" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="vehicleModel" label="Модель">
                          <Input placeholder="Модель" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="vehicleYear" label="Год выпуска">
                          <InputNumber style={{ width: '100%' }} min={1900} max={new Date().getFullYear()} />
                        </Form.Item>
                      </Col>
                      <Col span={16}>
                        <Form.Item name="vehicleVin" label="VIN номер">
                          <Input placeholder="VIN" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="vehicleRegistrationNumber" label="Гос. номер">
                          <Input placeholder="A777AA92" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="vehicleBodyNumber" label="Номер кузова">
                          <Input placeholder="Номер кузова" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="vehicleChassisNumber" label="Номер шасси">
                          <Input placeholder="Номер шасси" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="vehicleFrameNumber" label="Номер рамы">
                      <Input placeholder="Номер рамы" />
                    </Form.Item>
                  </>
                );
              }
              if (collateralType === 'Оборудование') {
                return (
                  <>
                    <Divider orientation="left">Данные оборудования</Divider>
                    <Form.Item name="equipmentName" label="Наименование оборудования">
                      <Input placeholder="Наименование" />
                    </Form.Item>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="equipmentManufacturer" label="Производитель">
                          <Input placeholder="Производитель" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="equipmentModel" label="Модель">
                          <Input placeholder="Модель" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="equipmentSerialNumber" label="Серийный номер">
                          <Input placeholder="Серийный номер" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="equipmentInventoryNumber" label="Инвентарный номер">
                          <Input placeholder="Инвентарный номер" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="equipmentYear" label="Год выпуска">
                      <InputNumber style={{ width: '100%' }} min={1900} max={new Date().getFullYear()} />
                    </Form.Item>
                  </>
                );
              }
              if (collateralType === 'Товары в обороте') {
                return (
                  <>
                    <Divider orientation="left">Данные товаров</Divider>
                    <Form.Item name="goodsDescription" label="Описание товаров">
                      <TextArea rows={3} placeholder="Подробное описание товаров" />
                    </Form.Item>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="goodsQuantity" label="Количество">
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="goodsUnit" label="Единица измерения">
                          <Input placeholder="шт., кг, м и т.д." />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                );
              }
              return null;
            }}
          </Form.Item>

          <Divider orientation="left">Оценка</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="marketValue" label="Рыночная стоимость, руб.">
                <InputNumber style={{ width: '100%' }} min={0} addonAfter="руб." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="collateralValue" label="Залоговая стоимость, руб.">
                <InputNumber style={{ width: '100%' }} min={0} addonAfter="руб." />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Договор залога</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pledgeContractNumber" label="№ договора залога">
                <Input placeholder="Номер договора" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pledgeContractDate" label="Дата договора залога">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="pledgeAmount" label="Сумма обязательства, обеспеченного залогом, руб.">
            <InputNumber style={{ width: '100%' }} min={0} addonAfter="руб." />
          </Form.Item>

          <Divider orientation="left">Нотариус</Divider>
          <Form.Item name="notaryName" label="ФИО нотариуса">
            <Input placeholder="ФИО нотариуса" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="notaryRegion" label="Регион">
                <Input placeholder="Регион" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notaryOffice" label="Нотариальная контора">
                <Input placeholder="Название конторы" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="comments" label="Комментарии">
            <TextArea rows={3} placeholder="Дополнительные комментарии" />
          </Form.Item>

          {selectedRegistration?.status === 'rejected' && (
            <Form.Item name="rejectionReason" label="Причина отклонения">
              <TextArea rows={2} placeholder="Причина отклонения регистрации" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default FNPServicePage;

