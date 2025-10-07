import React, { useState, useEffect } from 'react';
import { Button, Space, Modal, message, Breadcrumb, Table, Input, Tag } from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
  CloudDownloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import CollateralCardForm from '@/components/common/CollateralCardForm';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setExtendedCards,
  addExtendedCard,
  updateExtendedCard,
  deleteExtendedCard,
  deleteExtendedCards,
  setExtendedLoading,
} from '@/store/slices/extendedCardsSlice';
import extendedStorageService from '@/services/ExtendedStorageService';
import { formatDate, translateCategory, translateStatus, downloadFile } from '@/utils/helpers';
import type { ExtendedCollateralCard } from '@/types';

const ExtendedRegistryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filteredItems: cards, loading } = useAppSelector(state => state.extendedCards);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<ExtendedCollateralCard | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');

  const loadCards = async () => {
    try {
      dispatch(setExtendedLoading(true));
      const loadedCards = await extendedStorageService.getExtendedCards();
      dispatch(setExtendedCards(loadedCards));
    } catch (error) {
      message.error('Ошибка загрузки данных');
      console.error(error);
    } finally {
      dispatch(setExtendedLoading(false));
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    setEditingCard(null);
    setModalVisible(true);
  };

  const handleEdit = (card: ExtendedCollateralCard) => {
    setEditingCard(card);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await extendedStorageService.deleteExtendedCard(id);
      dispatch(deleteExtendedCard(id));
      message.success('Карточка удалена');
    } catch (error) {
      message.error('Ошибка удаления карточки');
      console.error(error);
    }
  };

  const handleDeleteMultiple = async () => {
    try {
      await extendedStorageService.deleteExtendedCards(selectedRowKeys as string[]);
      dispatch(deleteExtendedCards(selectedRowKeys as string[]));
      message.success(`Удалено карточек: ${selectedRowKeys.length}`);
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('Ошибка удаления карточек');
      console.error(error);
    }
  };

  const handleSubmit = async (values: ExtendedCollateralCard) => {
    try {
      await extendedStorageService.saveExtendedCard(values);

      if (editingCard) {
        dispatch(updateExtendedCard(values));
        message.success('Карточка обновлена');
      } else {
        dispatch(addExtendedCard(values));
        message.success('Карточка создана');
      }

      setModalVisible(false);
      setEditingCard(null);
    } catch (error) {
      message.error('Ошибка сохранения карточки');
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      const result = await extendedStorageService.exportToExcel(
        cards,
        `registry_export_${new Date().toISOString().split('T')[0]}`
      );
      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('Ошибка экспорта данных');
      console.error(error);
    }
  };

  const handleExportBackup = async () => {
    try {
      const blob = await extendedStorageService.exportBackup();
      const filename = `cms_backup_${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(blob, filename);
      message.success('Резервная копия создана');
    } catch (error) {
      message.error('Ошибка создания резервной копии');
      console.error(error);
    }
  };

  const handleImportBackup = async (file: File) => {
    try {
      await extendedStorageService.importBackup(file);
      message.success('Резервная копия восстановлена');
      await loadCards();
    } catch (error) {
      message.error('Ошибка восстановления резервной копии');
      console.error(error);
    }
  };

  const columns: ColumnsType<ExtendedCollateralCard> = [
    {
      title: '№',
      dataIndex: 'number',
      key: 'number',
      width: 120,
      sorter: (a, b) => a.number.localeCompare(b.number),
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(String(value).toLowerCase()) ||
        record.number.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Категория',
      dataIndex: 'mainCategory',
      key: 'mainCategory',
      width: 150,
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
      title: 'Адрес',
      key: 'address',
      width: 250,
      render: (_, record) => record.address?.fullAddress || '-',
    },
    {
      title: 'Собственники',
      key: 'owners',
      width: 200,
      render: (_, record) => {
        const owners = record.partners.filter(p => p.role === 'owner' && p.showInRegistry);
        if (owners.length === 0) return '-';
        return owners.map(o => {
          const name = o.type === 'individual'
            ? `${o.lastName} ${o.firstName?.charAt(0)}.${o.middleName?.charAt(0)}.`
            : o.organizationName;
          return <Tag key={o.id}>{name}</Tag>;
        });
      },
    },
    {
      title: 'Документы',
      key: 'documents',
      width: 100,
      render: (_, record) => record.documents.length > 0 ? `${record.documents.length} шт.` : '-',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={status === 'approved' ? 'green' : 'orange'}>
          {translateStatus(status)}
        </Tag>
      ),
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
      width: 150,
      render: (date: Date) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => handleEdit(record)}>
            Изменить
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>Главная</Breadcrumb.Item>
        <Breadcrumb.Item>Реестры</Breadcrumb.Item>
      </Breadcrumb>

      <Space style={{ marginBottom: 16 }} wrap>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Создать карточку
        </Button>
        <Button icon={<ExportOutlined />} onClick={handleExport}>
          Экспорт в Excel
        </Button>
        <Button icon={<CloudDownloadOutlined />} onClick={handleExportBackup}>
          Создать резервную копию
        </Button>
        <input
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          id="backup-import"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleImportBackup(file);
          }}
        />
        <Button
          icon={<ImportOutlined />}
          onClick={() => document.getElementById('backup-import')?.click()}
        >
          Восстановить из копии
        </Button>

        {selectedRowKeys.length > 0 && (
          <Button danger onClick={handleDeleteMultiple}>
            Удалить выбранные ({selectedRowKeys.length})
          </Button>
        )}

        <Input
          placeholder="Поиск по названию или номеру..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </Space>

      <Table
        columns={columns}
        dataSource={cards}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          showSizeChanger: true,
          showTotal: total => `Всего: ${total}`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        scroll={{ x: 1800 }}
      />

      <Modal
        title={editingCard ? 'Редактирование карточки' : 'Создание карточки'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCard(null);
        }}
        footer={null}
        width="100%"
        style={{ top: 0, maxWidth: '100vw', paddingBottom: 0 }}
        styles={{ body: { height: 'calc(100vh - 110px)', overflowY: 'auto', padding: '24px 24px 24px 24px' } }}
        centered={false}
        destroyOnClose
      >
        <CollateralCardForm
          initialValues={editingCard || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalVisible(false);
            setEditingCard(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default ExtendedRegistryPage;

