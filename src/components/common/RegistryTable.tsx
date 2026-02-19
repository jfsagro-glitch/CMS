import React from 'react';
import { Table, Button, Tooltip, Tag } from 'antd';
import { EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { RegistrySort, RegistryFilters } from '@/store/slices/registryQuerySlice';

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
  pagination: { current: number; pageSize: number; total: number };
  filters: RegistryFilters;
  sort: RegistrySort | null;
  onChange: (pagination: TablePaginationConfig, filters: RegistryFilters, sort: RegistrySort | null) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onDoubleClick: (record: RegistryTableRecord) => void;
}

export const RegistryTable: React.FC<RegistryTableProps> = ({
  data,
  loading,
  pagination,
  filters,
  sort,
  onChange,
  onEdit,
  onView,
  onDelete,
  onDoubleClick,
}) => {
  // Данные передаются уже отфильтрованными из родительского компонента
  const filteredData = data;

  const columns: ColumnsType<RegistryTableRecord> = [
    {
      title: '№',
      dataIndex: 'number',
      key: 'number',
      width: 100,
      fixed: 'left',
      sorter: true,
      sortOrder: sort?.field === 'number' ? (sort.order === 'asc' ? 'ascend' : 'descend') : null,
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      sorter: true,
      sortOrder: sort?.field === 'name' ? (sort.order === 'asc' ? 'ascend' : 'descend') : null,
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
      filteredValue: filters.mainCategory ? [filters.mainCategory] : null,
      render: (category: string) => {
        const categoryConfig = {
          real_estate: { color: 'blue', text: 'Недвижимость' },
          movable: { color: 'green', text: 'Движимое' },
          property_rights: { color: 'orange', text: 'Имущественные права' },
        };
        const config = categoryConfig[category as keyof typeof categoryConfig] || {
          color: 'default',
          text: category || 'Не указано',
        };
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
      filteredValue: filters.status ? [filters.status] : null,
      render: (status: string) => {
        const statusConfig = {
          editing: { color: 'orange', text: 'Редактирование' },
          approved: { color: 'green', text: 'Согласовано' },
          archived: { color: 'default', text: 'Архив' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || {
          color: 'default',
          text: status || 'Не указано',
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Адрес',
      dataIndex: 'addresses',
      key: 'address',
      width: 300,
      render: (addresses: any[]) => <div>{addresses?.[0]?.fullAddress || 'Не указан'}</div>,
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: true,
      sortOrder: sort?.field === 'createdAt' ? (sort.order === 'asc' ? 'ascend' : 'descend') : null,
      render: (date: Date) => new Date(date).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      fixed: 'right',
        render: (_, record) => (
          <div style={{ display: 'flex', gap: '8px' }}>
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
          </div>
        ),
    },
  ];

  return (
    <div className="registry-table-container">
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200, y: 620 }}
        virtual
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `Показано ${range[0]}-${range[1]} из ${total} записей`,
          pageSizeOptions: ['15', '30', '50', '100'],
        }}
        onChange={(nextPagination, tableFilters, tableSorter) => {
          const mainCategory = Array.isArray(tableFilters.mainCategory)
            ? (tableFilters.mainCategory[0] as RegistryFilters['mainCategory'])
            : undefined;
          const status = Array.isArray(tableFilters.status)
            ? (tableFilters.status[0] as RegistryFilters['status'])
            : undefined;
          const nextFilters: RegistryFilters = {
            ...filters,
            mainCategory,
            status,
          };

          let nextSort: RegistrySort | null = null;
          if (!Array.isArray(tableSorter) && tableSorter?.field && tableSorter?.order) {
            nextSort = {
              field: tableSorter.field as RegistrySort['field'],
              order: tableSorter.order === 'ascend' ? 'asc' : 'desc',
            };
          }

          onChange(nextPagination, nextFilters, nextSort);
        }}
        onRow={record => ({
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
