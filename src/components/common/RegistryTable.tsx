import React, { useState, useMemo } from 'react';
import { Table, Button, Space, Tooltip, Input, Tag } from 'antd';
import { EditOutlined, EyeOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { CollateralCard } from '../../types';

export interface RegistryTableRecord extends CollateralCard {
  addresses: { fullAddress?: string }[];
}

interface RegistryTableProps {
  data: RegistryTableRecord[];
  loading?: boolean;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onDoubleClick: (record: RegistryTableRecord) => void;
}

export const RegistryTable: React.FC<RegistryTableProps> = ({
  data,
  loading,
  onEdit,
  onView,
  onDelete,
  onDoubleClick
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    return data.filter(item =>
      item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.number?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.addresses?.some(addr => 
        addr.fullAddress?.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [data, searchText]);

  const columns: ColumnsType<RegistryTableRecord> = [
    {
      title: '№',
      dataIndex: 'number',
      key: 'number',
      width: 100,
      fixed: 'left',
      sorter: (a, b) => a.number.localeCompare(b.number),
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
            {record.classification.level1}
          </div>
        </div>
      ),
    },
    {
      title: 'Тип',
      dataIndex: 'mainCategory',
      key: 'mainCategory',
      width: 120,
      filters: [
        { text: 'Недвижимость', value: 'real_estate' },
        { text: 'Движимое имущество', value: 'movable' },
        { text: 'НМА', value: 'intangible' },
      ],
      onFilter: (value, record) => record.mainCategory === value,
      render: (category: string) => {
        const categoryConfig = {
          real_estate: { color: 'blue', text: 'Недвижимость' },
          movable: { color: 'green', text: 'Движимое' },
          intangible: { color: 'orange', text: 'НМА' },
        };
        const config = categoryConfig[category as keyof typeof categoryConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Редактирование', value: 'editing' },
        { text: 'Согласовано', value: 'approved' },
        { text: 'Архив', value: 'archived' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => {
        const statusConfig = {
          editing: { color: 'orange', text: 'Редактирование' },
          approved: { color: 'green', text: 'Согласовано' },
          archived: { color: 'default', text: 'Архив' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Адрес',
      dataIndex: 'addresses',
      key: 'address',
      width: 300,
      render: (addresses: any[]) => (
        <div>{addresses?.[0]?.fullAddress || 'Не указан'}</div>
      ),
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: Date) => new Date(date).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Просмотр">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => onView(record.id)}
            />
          </Tooltip>
          <Tooltip title="Редактировать">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => onEdit(record.id)}
            />
          </Tooltip>
          <Tooltip title="Удалить">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => onDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="registry-table-container">
      <div className="table-header">
        <Input
          placeholder="Поиск по названию, номеру или адресу..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Space>
          <span>Найдено: {filteredData.length}</span>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200, y: 600 }}
        pagination={{
          pageSize: 30,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `Показано ${range[0]}-${range[1]} из ${total} записей`,
          pageSizeOptions: ['15', '30', '50', '100'],
        }}
        onRow={(record) => ({
          onDoubleClick: () => onDoubleClick(record),
          style: { cursor: 'pointer' },
        })}
        size="middle"
        className="registry-table"
      />
    </div>
  );
};

export default RegistryTable;
