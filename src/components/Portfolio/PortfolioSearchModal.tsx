/**
 * Модальное окно для поиска и выбора объектов обеспечения для привязки к договору
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Input,
  Table,
  Space,
  Typography,
  Tag,
  Empty,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import type { ExtendedCollateralCard } from '@/types';
import extendedStorageService from '@/services/ExtendedStorageService';

const { Text } = Typography;

interface PortfolioSearchModalProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (object: ExtendedCollateralCard) => void;
  excludeIds?: string[]; // ID объектов, которые уже привязаны
}

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | null | undefined) => {
  return value == null ? '—' : currencyFormatter.format(value);
};

const PortfolioSearchModal: React.FC<PortfolioSearchModalProps> = ({
  visible,
  onCancel,
  onSelect,
  excludeIds = [],
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [objects, setObjects] = useState<ExtendedCollateralCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredObjects, setFilteredObjects] = useState<ExtendedCollateralCard[]>([]);

  const filterObjects = useCallback(() => {
    if (searchValue.trim()) {
      const search = searchValue.toLowerCase();
      const filtered = objects.filter(obj => {
        if (excludeIds.includes(obj.id)) return false;
        return (
          obj.name?.toLowerCase().includes(search) ||
          obj.number?.toLowerCase().includes(search) ||
          obj.address?.fullAddress?.toLowerCase().includes(search) ||
          obj.propertyType?.toLowerCase().includes(search)
        );
      });
      setFilteredObjects(filtered);
    } else {
      setFilteredObjects(objects.filter(obj => !excludeIds.includes(obj.id)));
    }
  }, [searchValue, objects, excludeIds]);

  const loadObjects = useCallback(async () => {
    setLoading(true);
    try {
      const allObjects = await extendedStorageService.getExtendedCards();
      setObjects(allObjects);
      setFilteredObjects(allObjects.filter(obj => !excludeIds.includes(obj.id)));
    } catch (error) {
      console.error('Ошибка загрузки объектов:', error);
    } finally {
      setLoading(false);
    }
  }, [excludeIds]);

  useEffect(() => {
    if (visible) {
      loadObjects();
    }
  }, [visible, loadObjects]);

  useEffect(() => {
    filterObjects();
  }, [filterObjects]);

  const columns: ColumnsType<ExtendedCollateralCard> = [
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.number}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Тип имущества',
      key: 'propertyType',
      render: (_, record) => (
        <Tag>{record.propertyType || '—'}</Tag>
      ),
    },
    {
      title: 'Адрес',
      key: 'address',
      render: (_, record) => (
        <Text>{record.address?.fullAddress || '—'}</Text>
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
      title: 'Действие',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <a onClick={() => onSelect(record)}>Выбрать</a>
      ),
    },
  ];

  return (
    <Modal
      title="Выбор объекта обеспечения"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Input
          placeholder="Поиск по наименованию, номеру, адресу..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          allowClear
        />
        {loading ? (
          <Spin tip="Загрузка объектов..." />
        ) : filteredObjects.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredObjects}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
            onRow={record => ({
              onDoubleClick: () => onSelect(record),
            })}
          />
        ) : (
          <Empty description="Объекты не найдены" />
        )}
      </Space>
    </Modal>
  );
};

export default PortfolioSearchModal;

