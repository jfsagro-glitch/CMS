import React, { useState, useMemo } from 'react';
import { Table, Button, Space, Tooltip, Input, Tag, Select } from 'antd';
import { EditOutlined, EyeOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

export interface RegistryTableRecord {
  id: string;
  number: string;
  name: string;
  mainCategory: string;
  status: string;
  classification: any;
  addresses: { fullAddress?: string }[];
  owner?: {
    name?: string;
    inn?: string;
  };
  characteristics?: {
    cadastralNumber?: string;
    vin?: string;
    serialNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface RegistryTableProps {
  data: RegistryTableRecord[];
  loading?: boolean;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onDoubleClick: (record: RegistryTableRecord) => void;
}

const getSearchPlaceholder = (attribute: string): string => {
  switch (attribute) {
    case 'owner': return 'залогодателю (название, ИНН)';
    case 'identifier': return 'идентификатору (кадастровый номер, VIN, серийный номер, ID)';
    case 'name': return 'наименованию';
    case 'type': return 'типу объекта';
    case 'kind': return 'виду объекта';
    default: return 'наименованию';
  }
};

export const RegistryTable: React.FC<RegistryTableProps> = ({
  data,
  loading,
  onEdit,
  onView,
  onDelete,
  onDoubleClick
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchAttribute, setSearchAttribute] = useState<string>('name');

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    
    return data.filter(item => {
      const searchLower = searchText.toLowerCase();
      
      switch (searchAttribute) {
        case 'owner':
          return item.owner?.name?.toLowerCase().includes(searchLower) ||
                 item.owner?.inn?.toLowerCase().includes(searchLower);
        case 'identifier':
          return item.characteristics?.cadastralNumber?.toLowerCase().includes(searchLower) ||
                 item.characteristics?.vin?.toLowerCase().includes(searchLower) ||
                 item.characteristics?.serialNumber?.toLowerCase().includes(searchLower) ||
                 item.id?.toLowerCase().includes(searchLower);
        case 'name':
          return item.name?.toLowerCase().includes(searchLower);
        case 'type':
          return item.classification?.level1?.toLowerCase().includes(searchLower) ||
                 item.classification?.level0?.toLowerCase().includes(searchLower);
        case 'kind':
          return item.classification?.level2?.toLowerCase().includes(searchLower);
        default:
          return item.name?.toLowerCase().includes(searchLower) ||
                 item.number?.toLowerCase().includes(searchLower) ||
                 item.addresses?.some(addr => addr.fullAddress?.toLowerCase().includes(searchLower));
      }
    });
  }, [data, searchText, searchAttribute]);

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
        { text: 'Имущественные права', value: 'property_rights' },
      ],
      onFilter: (value, record) => record.mainCategory === value,
      render: (category: string) => {
        const categoryConfig = {
          real_estate: { color: 'blue', text: 'Недвижимость' },
          movable: { color: 'green', text: 'Движимое' },
          property_rights: { color: 'orange', text: 'Имущественные права' },
        };
        const config = categoryConfig[category as keyof typeof categoryConfig] || { color: 'default', text: category || 'Не указано' };
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
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status || 'Не указано' };
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
        <div className="search-container">
          <Select
            value={searchAttribute}
            onChange={setSearchAttribute}
            style={{ width: 200, marginRight: 8 }}
            options={[
              { value: 'owner', label: 'Залогодатель' },
              { value: 'identifier', label: 'Идентификатор' },
              { value: 'name', label: 'Наименование' },
              { value: 'type', label: 'Тип' },
              { value: 'kind', label: 'Вид' },
            ]}
          />
          <Input
            placeholder={`Поиск по ${getSearchPlaceholder(searchAttribute)}...`}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ 
              flex: 1,
              backgroundColor: '#f5f5f5',
              borderColor: '#d9d9d9'
            }}
            allowClear
          />
        </div>
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
