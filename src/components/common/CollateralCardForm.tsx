import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Form, Input, Select, Button, Space, message, Row, Col, DatePicker, Switch, Divider, Modal, Table } from 'antd';
import { SaveOutlined, CloseOutlined, LinkOutlined, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import type { ExtendedCollateralCard, ObjectTypeKey, Partner, Document, Address, CharacteristicsValues } from '@/types';
import ObjectTypeSelector from './ObjectTypeSelector';
import PartnerManager from './PartnerManager';
import AddressInput from './AddressInput';
import DocumentManager from './DocumentManager';
import { getObjectTypeKey } from '@/utils/extendedClassification';
import referenceDataService from '@/services/ReferenceDataService';
import { generateId } from '@/utils/helpers';
import { getPropertyTypes, getAttributesForPropertyType, distributeAttributesByTabs } from '@/utils/collateralAttributesFromDict';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface CollateralCardFormProps {
  initialValues?: Partial<ExtendedCollateralCard>;
  onSubmit: (values: ExtendedCollateralCard) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CollateralCardForm: React.FC<CollateralCardFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [cbCode, setCbCode] = useState<number>(initialValues?.cbCode || 0);
  const [objectTypeKey, setObjectTypeKey] = useState<ObjectTypeKey | null>(null);
  const [propertyType, setPropertyType] = useState<string | undefined>(initialValues?.propertyType);
  const [dictReady, setDictReady] = useState<boolean>(false);
  
  // Состояния для вкладок
  const [partners, setPartners] = useState<Partner[]>(initialValues?.partners || []);
  const [address, setAddress] = useState<Address | undefined>(initialValues?.address);
  const [characteristics, setCharacteristics] = useState<CharacteristicsValues>(initialValues?.characteristics || {});
  const [documents, setDocuments] = useState<Document[]>(initialValues?.documents || []);
  const [contractSelectModalVisible, setContractSelectModalVisible] = useState(false);
  const [portfolioContracts, setPortfolioContracts] = useState<CollateralPortfolioEntry[]>([]);
  const [contractSearchValue, setContractSearchValue] = useState('');
  
  // Получаем типы имущества из справочника
  const propertyTypes = useMemo(() => (dictReady ? getPropertyTypes() : []), [dictReady]);
  
  // Получаем атрибуты для выбранного типа имущества
  const propertyAttributes = useMemo(() => {
    if (!propertyType) return [];
    return getAttributesForPropertyType(propertyType);
  }, [propertyType]);
  
  // Распределяем атрибуты по вкладкам
  const distributedAttributes = useMemo(() => {
    return distributeAttributesByTabs(propertyAttributes);
  }, [propertyAttributes]);

  // Синхронизируем атрибуты с unified-attributes.json при монтировании (однократно)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await referenceDataService.syncCollateralAttributesFromUnified();
      } catch (e) {
        console.warn('Не удалось синхронизировать атрибуты залога из unified-attributes.json', e);
      } finally {
        if (mounted) setDictReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        egrnStatementDate: initialValues.egrnStatementDate ? dayjs(initialValues.egrnStatementDate) : undefined,
      });
      
      // Определяем ObjectTypeKey из классификации
      if (initialValues.classification) {
        const key = getObjectTypeKey(
          initialValues.classification.level1,
          initialValues.classification.level2
        );
        setObjectTypeKey(key);
      }
    }
  }, [initialValues, form]);

  const handleClassificationChange = (classification: any, code: number) => {
    form.setFieldsValue({ classification });
    setCbCode(code);

    // Определяем тип объекта для характеристик
    const key = getObjectTypeKey(classification.level1, classification.level2);
    setObjectTypeKey(key);

    // Если тип изменился, очищаем характеристики
    if (key !== objectTypeKey) {
      setCharacteristics({});
      form.setFieldsValue({ characteristics: {} });
    }
  };
  
  const handlePropertyTypeChange = (value: string) => {
    setPropertyType(value);
    // Очищаем характеристики при смене типа имущества
    setCharacteristics({});
    form.setFieldsValue({ characteristics: {} });
  };
  
  // Проверка, нужно ли показывать кнопку заказа выписки ЕГРН
  const shouldShowOrderEgrnButton = useMemo(() => {
    if (!initialValues?.egrnStatementDate || !initialValues.mainCategory || initialValues.mainCategory !== 'real_estate') {
      return false;
    }
    const statementDate = dayjs(initialValues.egrnStatementDate);
    const daysSinceStatement = dayjs().diff(statementDate, 'days');
    return daysSinceStatement > 30;
  }, [initialValues?.egrnStatementDate, initialValues?.mainCategory]);
  
  // Обработчик заказа выписки ЕГРН
  const handleOrderEgrn = () => {
    const cardId = initialValues?.id;
    const cadastralNumber = address?.cadastralNumber || characteristics?.objectCadastralNumber;
    const objectName = form.getFieldValue('name');
    
    // Переходим в модуль ЕГРН с предзаполненными данными
    navigate(`/egrn?objectId=${cardId}&cadastralNumber=${cadastralNumber}&objectName=${encodeURIComponent(objectName || '')}`);
    message.info('Переход в модуль ЕГРН для заказа выписки');
  };
  
  // Переход в залоговое досье
  const handleGoToDossier = () => {
    const reference = form.getFieldValue('reference');
    if (reference) {
      window.open(`#/portfolio?reference=${reference}`, '_blank');
    } else {
      message.warning('Не указан REFERENCE сделки');
    }
  };
  
  // Загрузка договоров из портфеля
  useEffect(() => {
    const loadPortfolioContracts = async () => {
      try {
        const base = import.meta.env.BASE_URL ?? '/';
        const resolvedBase = new URL(base, window.location.origin);
        const normalizedPath = resolvedBase.pathname.endsWith('/')
          ? resolvedBase.pathname
          : `${resolvedBase.pathname}/`;
        const url = `${resolvedBase.origin}${normalizedPath}portfolioData.json?v=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json() as CollateralPortfolioEntry[];
          setPortfolioContracts(data);
        }
      } catch (error) {
        console.warn('Не удалось загрузить договоры из портфеля', error);
      }
    };
    
    if (contractSelectModalVisible) {
      loadPortfolioContracts();
    }
  }, [contractSelectModalVisible]);
  
  // Выбор договора из портфеля
  const handleSelectContract = (contract: CollateralPortfolioEntry) => {
    form.setFieldsValue({
      reference: contract.reference,
      contractNumber: contract.contractNumber,
      contractId: contract.contractNumber, // Используем contractNumber как ID
    });
    
    // Автоматически заполняем данные заемщика и залогодателя
    if (contract.borrower && contract.inn) {
      const borrowerPartner: Partner = {
        id: generateId(),
        type: 'legal',
        role: 'owner',
        organizationName: contract.borrower,
        inn: String(contract.inn),
        share: 100,
        showInRegistry: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedPartners = partners.filter(p => p.role !== 'owner');
      setPartners([...updatedPartners, borrowerPartner]);
    }
    
    if (contract.pledger) {
      const pledgorPartner: Partner = {
        id: generateId(),
        type: 'legal',
        role: 'pledgor',
        organizationName: contract.pledger,
        inn: String(contract.inn || ''),
        share: 100,
        showInRegistry: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedPartners = partners.filter(p => p.role !== 'pledgor');
      setPartners([...updatedPartners, pledgorPartner]);
    }
    
    setContractSelectModalVisible(false);
    message.success('Договор выбран, данные заемщика и залогодателя заполнены');
  };
  
  // Отфильтрованные договоры для поиска
  const filteredContracts = useMemo(() => {
    if (!contractSearchValue) return portfolioContracts.slice(0, 50);
    const search = contractSearchValue.toLowerCase();
    return portfolioContracts.filter(contract => 
      contract.contractNumber?.toLowerCase().includes(search) ||
      contract.reference?.toString().toLowerCase().includes(search) ||
      contract.borrower?.toLowerCase().includes(search) ||
      contract.pledger?.toLowerCase().includes(search)
    ).slice(0, 50);
  }, [portfolioContracts, contractSearchValue]);
  
  // Переход к договору
  const handleGoToContract = () => {
    const contractId = form.getFieldValue('contractId');
    const contractNumber = form.getFieldValue('contractNumber');
    const reference = form.getFieldValue('reference');
    
    if (contractId) {
      navigate(`/portfolio?contractId=${contractId}`);
    } else if (contractNumber) {
      navigate(`/portfolio?contractNumber=${contractNumber}`);
    } else if (reference) {
      navigate(`/portfolio?reference=${reference}`);
    } else {
      message.warning('Не указан договор');
    }
  };
  
  // Колонки для таблицы договоров
  const contractColumns: ColumnsType<CollateralPortfolioEntry> = [
    {
      title: 'REFERENCE',
      dataIndex: 'reference',
      key: 'reference',
      width: 120,
    },
    {
      title: 'Номер договора',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      width: 150,
    },
    {
      title: 'Заемщик',
      dataIndex: 'borrower',
      key: 'borrower',
      width: 200,
    },
    {
      title: 'Залогодатель',
      dataIndex: 'pledger',
      key: 'pledger',
      width: 200,
    },
    {
      title: 'ИНН',
      dataIndex: 'inn',
      key: 'inn',
      width: 120,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleSelectContract(record)}>
          Выбрать
        </Button>
      ),
    },
  ];

  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      const now = new Date();

      const cardData: ExtendedCollateralCard = {
        id: initialValues?.id || generateId(),
        ...values,
        cbCode,
        partners,
        address: address || undefined,
        characteristics,
        documents,
        propertyType,
        egrnStatementDate: values.egrnStatementDate ? values.egrnStatementDate.format('YYYY-MM-DD') : undefined,
        createdAt: initialValues?.createdAt || now,
        updatedAt: now,
      };

      onSubmit(cardData);
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Пожалуйста, заполните все обязательные поля');
    }
  };
  
  // Получаем заемщика и залогодателя из партнеров
  const borrower = useMemo(() => partners.find(p => p.role === 'owner' || p.role === 'pledgor'), [partners]);
  const pledgor = useMemo(() => partners.find(p => p.role === 'pledgor'), [partners]);
  
  // Проверяем, является ли объект недвижимостью
  const isRealEstate = form.getFieldValue('mainCategory') === 'real_estate';

  const tabItems = [
    {
      key: '1',
      label: 'Главная',
      children: (
        <div>
          <Form.Item
            name="name"
            label="Наименование имущества (NAME_OF_PROPERTY)"
            rules={[{ required: true, message: 'Введите наименование' }]}
          >
            <Input placeholder="Наименование имущества" />
          </Form.Item>
          
          <Form.Item label="Адрес">
            <AddressInput 
              value={address} 
              onChange={setAddress}
              useDaData={true}
              showGeoPicker={false}
            />
          </Form.Item>
          
          <Divider orientation="left">Клиент</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Заемщик">
                <Input 
                  value={borrower?.organizationName || `${borrower?.lastName || ''} ${borrower?.firstName || ''} ${borrower?.middleName || ''}`.trim()}
                  disabled
                  placeholder="Выберите заемщика во вкладке партнеры"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="ИНН заемщика">
                <Input value={borrower?.inn} disabled placeholder="ИНН" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Залогодатель (OWNER_TIN)">
                <Input 
                  value={pledgor?.organizationName || `${pledgor?.lastName || ''} ${pledgor?.firstName || ''} ${pledgor?.middleName || ''}`.trim()}
                  disabled
                  placeholder="Выберите залогодателя во вкладке партнеры"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="ИНН залогодателя (OWNER_TIN)">
                <Input value={pledgor?.inn} disabled placeholder="ИНН залогодателя" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="propertyType"
            label="Тип имущества (из справочника атрибутов залога)"
          >
            <Select 
              placeholder="Выберите тип имущества"
              onChange={handlePropertyTypeChange}
              value={propertyType}
            >
              {propertyTypes.map(type => (
                <Select.Option key={type} value={type}>{type}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          
          <Form.Item
            name="mainCategory"
            label="Основная категория"
            rules={[{ required: true, message: 'Выберите категорию' }]}
          >
            <Select placeholder="Выберите категорию">
              <Select.Option value="real_estate">Недвижимость</Select.Option>
              <Select.Option value="movable">Движимое имущество</Select.Option>
              <Select.Option value="property_rights">Имущественные права</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="classification"
            label="Классификация объекта"
            rules={[
              {
                validator: async (_, value) => {
                  if (!value || !value.level0 || !value.level1 || !value.level2) {
                    return Promise.reject(new Error('Заполните все уровни классификации'));
                  }
                  if (cbCode === 0) {
                    return Promise.reject(new Error('Некорректная комбинация классификации'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <ObjectTypeSelector onChange={handleClassificationChange} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '2',
      label: 'Характеристики',
      children: (
        <div>
          <p style={{ marginBottom: 16, color: '#666' }}>
            Все характеристики объекта согласно справочнику атрибутов залога
          </p>
          {propertyType ? (
            <div>
              {distributedAttributes.characteristics.map((attr) => (
                <Form.Item
                  key={attr.code}
                  name={['characteristics', attr.code]}
                  label={attr.name}
                  rules={attr.required ? [{ required: true, message: `Заполните ${attr.name}` }] : []}
                >
                  {attr.type === 'number' ? (
                    <Input type="number" placeholder={attr.name} />
                  ) : attr.type === 'boolean' ? (
                    <Switch />
                  ) : attr.type === 'date' ? (
                    <DatePicker style={{ width: '100%' }} />
                  ) : (
                    <Input placeholder={attr.name} />
                  )}
                </Form.Item>
              ))}
              {distributedAttributes.characteristics.length === 0 && (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                  Характеристики определяются после выбора типа имущества на главной вкладке
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              Выберите тип имущества на главной вкладке для отображения характеристик
            </p>
          )}
        </div>
      ),
    },
    {
      key: '3',
      label: 'Документы',
      children: (
        <div>
          <DocumentManager value={documents} onChange={setDocuments} />
          
          <Divider />
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="link" 
              icon={<LinkOutlined />} 
              onClick={handleGoToDossier}
              style={{ paddingLeft: 0 }}
            >
              Перейти в Залоговое досье
            </Button>
            
            {isRealEstate && (
              <div>
                <Form.Item
                  name="egrnStatementDate"
                  label="Дата выписки ЕГРН"
                >
                  <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                </Form.Item>
                
                {shouldShowOrderEgrnButton && (
                  <Form.Item>
                    <Button
                      type="primary"
                      danger
                      icon={<ExclamationCircleOutlined />}
                      onClick={handleOrderEgrn}
                    >
                      Заказать выписку ЕГРН (выписка более 30 дней)
                    </Button>
                  </Form.Item>
                )}
              </div>
            )}
          </Space>
        </div>
      ),
    },
    {
      key: '4',
      label: 'Заметки',
      children: (
        <div>
          <Form.Item name="notes" label="Комментарии">
            <Input.TextArea rows={6} placeholder="Комментарии по данному имуществу" />
          </Form.Item>
          
          <Form.Item name="suspensiveConditions" label="Отлагательные условия">
            <Input.TextArea rows={6} placeholder="Отлагательные условия по данному имуществу" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '5',
      label: 'Оценка',
      children: (
        <div>
          <Form.Item name="marketValue" label="Стоимость (рыночная)">
            <Input type="number" placeholder="Рыночная стоимость, руб." addonAfter="₽" />
          </Form.Item>
          
          <Form.Item name="pledgeValue" label="Залоговая стоимость">
            <Input type="number" placeholder="Залоговая стоимость, руб." addonAfter="₽" />
          </Form.Item>
          
          <Form.Item name={['characteristics', 'HAVEL_MARKET']} label="Наличие ликвидного рынка (HAVEL_MARKET)" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item name={['characteristics', 'TYPE_COLLATERAL']} label="Тип обеспечения (TYPE_COLLATERAL - основной/дополнительный)">
            <Select placeholder="Выберите тип обеспечения">
              <Select.Option value="основной">Основной</Select.Option>
              <Select.Option value="дополнительный">Дополнительный</Select.Option>
            </Select>
          </Form.Item>
          
          {distributedAttributes.evaluation.map((attr) => (
            <Form.Item
              key={attr.code}
              name={['characteristics', attr.code]}
              label={attr.name}
              rules={attr.required ? [{ required: true, message: `Заполните ${attr.name}` }] : []}
            >
              {attr.type === 'number' ? (
                <Input type="number" placeholder={attr.name} />
              ) : attr.type === 'boolean' ? (
                <Switch />
              ) : attr.type === 'date' ? (
                <DatePicker style={{ width: '100%' }} />
              ) : (
                <Input placeholder={attr.name} />
              )}
            </Form.Item>
          ))}
        </div>
      ),
    },
    {
      key: '6',
      label: 'Договор',
      children: (
        <div>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              onClick={() => setContractSelectModalVisible(true)}
            >
              Выбрать договор из портфеля
            </Button>
            
            <Form.Item name="reference" label="REFERENCE сделки">
              <Input placeholder="REFERENCE сделки из портфеля" />
            </Form.Item>
            
            <Form.Item name="contractNumber" label="Номер договора">
              <Input placeholder="Номер договора залога" />
            </Form.Item>
            
            <Form.Item name="contractId" label="ID договора (для навигации)" hidden>
              <Input />
            </Form.Item>
            
            {(form.getFieldValue('reference') || form.getFieldValue('contractNumber')) && (
              <Button 
                type="default" 
                icon={<LinkOutlined />} 
                onClick={handleGoToContract}
              >
                Перейти к договору в портфеле
              </Button>
            )}
          </Space>
        </div>
      ),
    },
    {
      key: '7',
      label: 'Партнеры',
      children: (
        <div>
          <p style={{ marginBottom: 16, color: '#666' }}>
            Добавьте информацию о собственниках, залогодателях и других участниках сделки
          </p>
          <PartnerManager value={partners} onChange={setPartners} />
        </div>
      ),
    },
  ];

  if (!dictReady) {
    return null;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      size="middle"
      style={{ padding: '0 8px' }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ minHeight: '400px' }}
        size="small"
      />

      <div style={{ marginTop: 16, textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 12, position: 'sticky', bottom: 0, background: '#fff', zIndex: 10 }}>
        <Space>
          <Button onClick={onCancel} icon={<CloseOutlined />}>
            Отмена
          </Button>
          <Button
            type="primary"
            onClick={handleFinish}
            loading={loading}
            icon={<SaveOutlined />}
          >
            {initialValues ? 'Сохранить изменения' : 'Создать карточку'}
          </Button>
        </Space>
      </div>
      
      {/* Модальное окно выбора договора */}
      <Modal
        title="Выбор договора из портфеля"
        open={contractSelectModalVisible}
        onCancel={() => setContractSelectModalVisible(false)}
        footer={null}
        width={800}
      >
        <Input
          placeholder="Поиск по REFERENCE, номеру договора, заемщику, залогодателю"
          prefix={<SearchOutlined />}
          value={contractSearchValue}
          onChange={(e) => setContractSearchValue(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Table
          columns={contractColumns}
          dataSource={filteredContracts}
          rowKey={(record) => `${record.reference}-${record.contractNumber}`}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Modal>
    </Form>
  );
};

export default CollateralCardForm;
