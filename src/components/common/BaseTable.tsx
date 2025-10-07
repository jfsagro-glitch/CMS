import React from 'react';
import { Table, Space, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CollateralCard } from '@/types';
import { formatDate, translateCategory, translateStatus } from '@/utils/helpers';

interface BaseTableProps {
  data: CollateralCard[];
  loading?: boolean;
  onEdit?: (record: CollateralCard) => void;
  onDelete?: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => void;
}

const BaseTable: React.FC<BaseTableProps> = ({
  data,
  loading = false,
  onEdit,
  onDelete,
  onDeleteMultiple,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);

  const columns: ColumnsType<CollateralCard> = [
    {
      title: '№',
      dataIndex: 'number',
      key: 'number',
      width: 100,
      sorter: (a, b) => a.number.localeCompare(b.number),
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Категория',
      dataIndex: 'mainCategory',
      key: 'mainCategory',
      width: 200,
      render: (category: string) => translateCategory(category),
      filters: [
        { text: 'Недвижимость', value: 'real_estate' },
        { text: 'Движимое имущество', value: 'movable' },
        { text: 'Имущественные права', value: 'property_rights' },
      ],
      onFilter: (value, record) => record.mainCategory === value,
    },
    {
      title: 'Вид объекта',
      key: 'level1',
      width: 150,
      render: (_, record) => record.classification.level1,
    },
    {
      title: 'Код ЦБ',
      dataIndex: 'cbCode',
      key: 'cbCode',
      width: 100,
      sorter: (a, b) => a.cbCode - b.cbCode,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => translateStatus(status),
      filters: [
        { text: 'Редактирование', value: 'editing' },
        { text: 'Утвержден', value: 'approved' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: Date) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {onEdit && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              Изменить
            </Button>
          )}
          {onDelete && (
            <Popconfirm
              title="Удалить карточку?"
              description="Это действие нельзя отменить"
              onConfirm={() => onDelete(record.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              >
                Удалить
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = onDeleteMultiple
    ? {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
          setSelectedRowKeys(newSelectedRowKeys);
        },
      }
    : undefined;

  const handleDeleteSelected = () => {
    if (onDeleteMultiple && selectedRowKeys.length > 0) {
      onDeleteMultiple(selectedRowKeys as string[]);
      setSelectedRowKeys([]);
    }
  };

  return (
    <>
      {onDeleteMultiple && selectedRowKeys.length > 0 && (
        <Space style={{ marginBottom: 16 }}>
          <Popconfirm
            title={`Удалить выбранные карточки (${selectedRowKeys.length})?`}
            description="Это действие нельзя отменить"
            onConfirm={handleDeleteSelected}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger>
              Удалить выбранные ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        </Space>
      )}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total}`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        scroll={{ x: 1200 }}
      />
    </>
  );
};

export default BaseTable;

