/**
 * Компонент карточки договора с вкладками
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  Tabs,
  Descriptions,
  Button,
  Space,
  Table,
  Typography,
  Tag,
  Popconfirm,
  message,
  Empty,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  LinkOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import type { ExtendedCollateralCard } from '@/types';
import extendedStorageService from '@/services/ExtendedStorageService';
import { useNavigate } from 'react-router-dom';
import PortfolioSearchModal from './PortfolioSearchModal';


interface PortfolioContractCardProps {
  contract: CollateralPortfolioEntry;
  visible: boolean;
  onClose: () => void;
  onUpdate?: (contract: CollateralPortfolioEntry) => void;
}

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const formatCurrency = (value: number | string | null | undefined) => {
  const numeric = typeof value === 'number' ? value : value ? parseFloat(String(value)) : null;
  return numeric == null ? '—' : currencyFormatter.format(numeric);
};

const formatText = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return '—';
  const text = String(value).trim();
  return text.length > 0 ? text : '—';
};

const PortfolioContractCard: React.FC<PortfolioContractCardProps> = ({
  contract,
  visible,
  onClose,
  onUpdate,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [attachedObjects, setAttachedObjects] = useState<ExtendedCollateralCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  const loadAttachedObjects = useCallback(async () => {
    setLoading(true);
    try {
      const reference = String(contract.reference ?? contract.contractNumber ?? '');
      const allCards = await extendedStorageService.getExtendedCards();
      const relatedObjects = allCards.filter(
        card =>
          (card.reference && String(card.reference) === reference) ||
          (card.contractNumber && card.contractNumber === contract.contractNumber)
      );
      setAttachedObjects(relatedObjects);
    } catch (error) {
      console.error('Ошибка загрузки объектов:', error);
      message.error('Ошибка загрузки объектов');
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    if (visible && contract) {
      loadAttachedObjects();
    }
  }, [visible, contract, loadAttachedObjects]);

  // Дисконт для расчета залоговой стоимости (70-80% от рыночной)
  const COLLATERAL_DISCOUNT = 0.75; // 75% от рыночной стоимости

  // Расчет совокупной стоимости объектов
  const totalObjectsMarketValue = useMemo(() => {
    return attachedObjects.reduce((sum, obj) => sum + (obj.marketValue || 0), 0);
  }, [attachedObjects]);

  const totalObjectsPledgeValue = useMemo(() => {
    return Math.floor(totalObjectsMarketValue * COLLATERAL_DISCOUNT);
  }, [totalObjectsMarketValue]);

  // Расчет LTV (отношение задолженности к залоговой стоимости)
  const ltv = useMemo(() => {
    const debt = typeof contract.debtRub === 'number' ? contract.debtRub : parseFloat(String(contract.debtRub || 0));
    const collateralValue = typeof contract.collateralValue === 'number' 
      ? contract.collateralValue 
      : parseFloat(String(contract.collateralValue || 0));
    if (collateralValue > 0) {
      return Math.min(debt / collateralValue, 2); // Ограничиваем выбросы (максимум 200%)
    }
    return null;
  }, [contract.debtRub, contract.collateralValue]);

  // Обработка отвязки объекта
  const handleUnlinkObject = async (objectId: string) => {
    try {
      const object = attachedObjects.find(obj => obj.id === objectId);
      if (!object) return;

      // Обновляем объект, убирая привязку к договору
      const updatedObject: ExtendedCollateralCard = {
        ...object,
        reference: undefined,
        contractNumber: undefined,
        contractId: undefined,
      };
      await extendedStorageService.saveExtendedCard(updatedObject);

      // Обновляем стоимость договора
      const objectMarketValue = object.marketValue || 0;
      const currentMarketValue = typeof contract.marketValue === 'number' 
        ? contract.marketValue 
        : parseFloat(String(contract.marketValue || 0));
      const newMarketValue = Math.max(0, currentMarketValue - objectMarketValue);
      
      // Рассчитываем залоговую стоимость с применением дисконта
      const newCollateralValue = Math.floor(newMarketValue * COLLATERAL_DISCOUNT);

      // Обновляем договор (если есть onUpdate)
      if (onUpdate) {
        onUpdate({
          ...contract,
          collateralValue: newCollateralValue,
          marketValue: newMarketValue,
          currentMarketValue: newMarketValue,
        });
      }

      message.success('Объект отвязан от договора');
      await loadAttachedObjects();
    } catch (error) {
      console.error('Ошибка отвязки объекта:', error);
      message.error('Ошибка при отвязке объекта');
    }
  };

  // Обработка привязки объекта
  const handleLinkObject = async (object: ExtendedCollateralCard) => {
    try {
      const reference = String(contract.reference ?? contract.contractNumber ?? '');
      
      // Обновляем объект, добавляя привязку к договору
      const updatedObject: ExtendedCollateralCard = {
        ...object,
        reference,
        contractNumber: contract.contractNumber || undefined,
        contractId: contract.contractNumber || undefined,
      };
      await extendedStorageService.saveExtendedCard(updatedObject);

      // Обновляем стоимость договора
      const objectMarketValue = object.marketValue || 0;
      const currentMarketValue = typeof contract.marketValue === 'number' 
        ? contract.marketValue 
        : parseFloat(String(contract.marketValue || 0));
      const newMarketValue = currentMarketValue + objectMarketValue;
      
      // Рассчитываем залоговую стоимость с применением дисконта
      const newCollateralValue = Math.floor(newMarketValue * COLLATERAL_DISCOUNT);

      // Обновляем договор (если есть onUpdate)
      if (onUpdate) {
        onUpdate({
          ...contract,
          collateralValue: newCollateralValue,
          marketValue: newMarketValue,
          currentMarketValue: newMarketValue,
        });
      }

      message.success('Объект привязан к договору');
      await loadAttachedObjects();
      setSearchModalVisible(false);
    } catch (error) {
      console.error('Ошибка привязки объекта:', error);
      message.error('Ошибка при привязке объекта');
    }
  };

  // Переход к объекту в реестре
  const handleGoToObject = (objectId: string) => {
    navigate(`/registry?objectId=${objectId}`);
    onClose();
  };

  // Колонки таблицы объектов
  const objectsColumns: ColumnsType<ExtendedCollateralCard> = [
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Адрес',
      key: 'address',
      render: (_, record) => (
        <Typography.Text>{record.address?.fullAddress || '—'}</Typography.Text>
      ),
    },
    {
      title: 'Рыночная стоимость',
      key: 'marketValue',
      align: 'right',
      render: (_, record) => formatCurrency(record.marketValue),
    },
    {
      title: 'Залоговая стоимость',
      key: 'pledgeValue',
      align: 'right',
      render: (_, record) => formatCurrency(record.pledgeValue),
    },
    {
      title: 'Характеристики',
      key: 'characteristics',
      render: (_, record) => {
        const props: string[] = [];
        if (record.propertyType) props.push(record.propertyType);
        if (record.classification?.level1) props.push(record.classification.level1);
        return (
          <Space wrap>
            {props.map((prop, idx) => (
              <Tag key={idx}>{prop}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => handleGoToObject(record.id)}
          >
            Открыть
          </Button>
          <Popconfirm
            title="Отвязать объект от договора?"
            description="Стоимость договора будет уменьшена на стоимость объекта"
            onConfirm={() => handleUnlinkObject(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              Отвязать
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'general',
      label: (
        <span>
          <FileTextOutlined />
          Общие сведения
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions title="Общие сведения" bordered column={3} size="small">
            <Descriptions.Item label="Сегмент">{formatText(contract.segment)}</Descriptions.Item>
            <Descriptions.Item label="Группа">{formatText(contract.group)}</Descriptions.Item>
            <Descriptions.Item label="REFERENCE">{formatText(contract.reference)}</Descriptions.Item>
            <Descriptions.Item label="Залогодатель">{formatText(contract.pledger)}</Descriptions.Item>
            <Descriptions.Item label="ИНН">{formatText(contract.inn)}</Descriptions.Item>
            <Descriptions.Item label="Заемщик">{formatText(contract.borrower)}</Descriptions.Item>
            <Descriptions.Item label="№ договора">{formatText(contract.contractNumber)}</Descriptions.Item>
            <Descriptions.Item label="Дата договора">{formatText(contract.contractDate)}</Descriptions.Item>
            <Descriptions.Item label="Тип">{formatText(contract.type)}</Descriptions.Item>
            <Descriptions.Item label="Дата открытия">{formatText(contract.openDate)}</Descriptions.Item>
            <Descriptions.Item label="Дата закрытия">{formatText(contract.closeDate)}</Descriptions.Item>
          </Descriptions>

          <Descriptions title="Финансовые показатели" bordered column={3} size="small">
            <Descriptions.Item label="Задолженность, руб.">{formatCurrency(contract.debtRub)}</Descriptions.Item>
            <Descriptions.Item label="Лимит, руб.">{formatCurrency(contract.limitRub)}</Descriptions.Item>
            <Descriptions.Item label="LTV">
              {ltv !== null ? (
                <Tag color={ltv > 0.8 ? 'red' : ltv > 0.6 ? 'orange' : 'green'}>
                  {percentFormatter.format(ltv)}
                </Tag>
              ) : (
                '—'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Проср. ОД, руб.">{formatCurrency(contract.overduePrincipal)}</Descriptions.Item>
            <Descriptions.Item label="Проср. %, руб.">{formatCurrency(contract.overdueInterest)}</Descriptions.Item>
          </Descriptions>

          <Descriptions title="Оценка обеспечения" bordered column={3} size="small">
            <Descriptions.Item label="Залоговая стоимость, руб.">{formatCurrency(contract.collateralValue)}</Descriptions.Item>
            <Descriptions.Item label="Рыночная стоимость, руб.">{formatCurrency(contract.marketValue)}</Descriptions.Item>
            <Descriptions.Item label="Совокупная рыночная стоимость объектов">{formatCurrency(totalObjectsMarketValue)}</Descriptions.Item>
            <Descriptions.Item label="Совокупная залоговая стоимость объектов">{formatCurrency(totalObjectsPledgeValue)}</Descriptions.Item>
            <Descriptions.Item label="Дата первоначального определения стоимости">
              {formatText(contract.initialValuationDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Актуальная рыночная стоимость, руб.">
              {formatCurrency(contract.currentMarketValue)}
            </Descriptions.Item>
            <Descriptions.Item label="Дата определения текущей стоимости">
              {formatText(contract.currentValuationDate)}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions title="Обеспечение" bordered column={3} size="small">
            <Descriptions.Item label="Тип обеспечения">{formatText(contract.collateralType)}</Descriptions.Item>
            <Descriptions.Item label="Назначение обеспечения" span={2}>
              {formatText(contract.collateralPurpose)}
            </Descriptions.Item>
            <Descriptions.Item label="Информация о залоге" span={3}>
              {formatText(contract.collateralInfo)}
            </Descriptions.Item>
            <Descriptions.Item label="Местоположение предмета залога" span={2}>
              {formatText(contract.collateralLocation)}
            </Descriptions.Item>
            <Descriptions.Item label="Ликвидность">{formatText(contract.liquidity)}</Descriptions.Item>
          </Descriptions>
        </Space>
      ),
    },
    {
      key: 'objects',
      label: (
        <span>
          <HomeOutlined />
          Объекты в договоре ({attachedObjects.length})
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Space direction="vertical" size="small">
                <div>
                  <Typography.Text strong>Рыночная стоимость: </Typography.Text>
                  <Typography.Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                    {formatCurrency(totalObjectsMarketValue)}
                  </Typography.Text>
                </div>
                <div>
                  <Typography.Text strong>Залоговая стоимость (с дисконтом 75%): </Typography.Text>
                  <Typography.Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                    {formatCurrency(totalObjectsPledgeValue)}
                  </Typography.Text>
                </div>
              </Space>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setSearchModalVisible(true)}
            >
              Привязать объект
            </Button>
          </div>
          {loading ? (
            <Spin tip="Загрузка объектов..." />
          ) : attachedObjects.length > 0 ? (
            <Table
              columns={objectsColumns}
              dataSource={attachedObjects}
              rowKey="id"
              pagination={false}
              size="small"
            />
          ) : (
            <Empty description="Объекты по данному договору не найдены" />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>Карточка договора залога</span>
            <Tag>{formatText(contract.reference)}</Tag>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Закрыть
          </Button>,
        ]}
        width="90%"
        style={{ top: 20 }}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Modal>

      <PortfolioSearchModal
        visible={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        onSelect={handleLinkObject}
        excludeIds={attachedObjects.map(obj => obj.id)}
      />
    </>
  );
};

export default PortfolioContractCard;

