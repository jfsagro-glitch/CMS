import React, { useState, useEffect } from 'react';
import { Button, Space, Modal, message, Breadcrumb } from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';
import CollateralCardForm from '@/components/common/CollateralCardForm';
import RegistryTable from '@/components/common/RegistryTable';
import type { RegistryTableRecord } from '@/components/common/RegistryTable';
import '@/components/common/RegistryTable.css';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setExtendedCards,
  addExtendedCard,
  updateExtendedCard,
  deleteExtendedCard,
  setExtendedLoading,
} from '@/store/slices/extendedCardsSlice';
import extendedStorageService from '@/services/ExtendedStorageService';
import { downloadFile } from '@/utils/helpers';
import type { ExtendedCollateralCard } from '@/types';

const ExtendedRegistryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filteredItems: cards, loading } = useAppSelector(state => state.extendedCards);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<ExtendedCollateralCard | null>(null);

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

  const handleEdit = (id: string) => {
    const card = cards.find(c => c.id === id);
    if (card) {
      setEditingCard(card);
      setModalVisible(true);
    }
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

  const handleView = (id: string) => {
    handleEdit(id); // For now, view also opens edit modal
  };

  const handleDoubleClick = (record: RegistryTableRecord) => {
    handleEdit(record.id); // For now, double click also opens edit modal
  };

  // Prepare data for RegistryTable
  const tableData: RegistryTableRecord[] = cards.map((card: ExtendedCollateralCard) => ({
    id: card.id,
    number: card.number,
    name: card.name,
    mainCategory: card.mainCategory,
    status: card.status,
    classification: card.classification,
    addresses: card.address ? [{ fullAddress: card.address.fullAddress }] : [],
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  }));


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

      </Space>

      <RegistryTable
        data={tableData}
        loading={loading}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onDoubleClick={handleDoubleClick}
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
        style={{ top: 0, maxWidth: 'none', padding: 0 }}
        styles={{ body: { height: 'calc(100vh - 110px)', overflowY: 'auto' } }}
        destroyOnClose
        centered
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

