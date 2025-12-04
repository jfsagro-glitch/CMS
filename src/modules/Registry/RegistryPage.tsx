import React, { useState, useEffect } from 'react';
import { Button, Space, Modal, message, Breadcrumb } from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';
import BaseTable from '@/components/common/BaseTable';
import CardForm from '@/components/common/CardForm';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCards,
  addCard,
  updateCard,
  deleteCard,
  deleteCards,
  setLoading,
} from '@/store/slices/cardsSlice';
import storageService from '@/services/StorageService';
import { generateId, downloadFile } from '@/utils/helpers';
import type { CollateralCard } from '@/types';
import { generateCardsFromAttributeLevels } from '@/utils/generateDemoFromLevels';

const RegistryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filteredItems: cards, loading } = useAppSelector(state => state.cards);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<CollateralCard | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);

  const loadCards = async () => {
    try {
      dispatch(setLoading(true));
      let loadedCards = await storageService.getCollateralCards();
      // Если пусто, пробуем сгенерировать из уровней атрибутов (3 карточки на подгруппу)
      if (!loadedCards || loadedCards.length === 0) {
        const created = await generateCardsFromAttributeLevels();
        if (created > 0) {
          loadedCards = await storageService.getCollateralCards();
        }
      }
      dispatch(setCards(loadedCards));
    } catch (error) {
      message.error('Ошибка загрузки данных');
      console.error(error);
    } finally {
      dispatch(setLoading(false));
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

  const handleEdit = (card: CollateralCard) => {
    setEditingCard(card);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await storageService.deleteCollateralCard(id);
      dispatch(deleteCard(id));
      message.success('Карточка удалена');
    } catch (error) {
      message.error('Ошибка удаления карточки');
      console.error(error);
    }
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    try {
      await storageService.deleteCollateralCards(ids);
      dispatch(deleteCards(ids));
      message.success(`Удалено карточек: ${ids.length}`);
    } catch (error) {
      message.error('Ошибка удаления карточек');
      console.error(error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const cardData: CollateralCard = {
        id: editingCard?.id || generateId(),
        ...values,
        createdAt: editingCard?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await storageService.saveCollateralCard(cardData);

      if (editingCard) {
        dispatch(updateCard(cardData));
        message.success('Карточка обновлена');
      } else {
        dispatch(addCard(cardData));
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
      const result = await storageService.exportToExcel(
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

  const handleImportClick = () => {
    setImportModalVisible(true);
  };

  const handleImport = async (file: File) => {
    try {
      const result = await storageService.importFromExcel(file);
      if (result.success) {
        message.success(result.message);
        await loadCards(); // Перезагружаем данные
        setImportModalVisible(false);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('Ошибка импорта данных');
      console.error(error);
    }
  };

  const handleExportBackup = async () => {
    try {
      const blob = await storageService.exportBackup();
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
      await storageService.importBackup(file);
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
        <Breadcrumb.Item>Реестр объектов</Breadcrumb.Item>
      </Breadcrumb>

      <Space style={{ marginBottom: 16 }} wrap>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Создать карточку
        </Button>
        <Button icon={<ExportOutlined />} onClick={handleExport}>
          Экспорт в Excel
        </Button>
        <Button icon={<ImportOutlined />} onClick={handleImportClick}>
          Импорт из Excel
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
          icon={<CloudDownloadOutlined />}
          onClick={() => document.getElementById('backup-import')?.click()}
        >
          Восстановить из копии
        </Button>
      </Space>

      <BaseTable
        data={cards}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDeleteMultiple={handleDeleteMultiple}
      />

      <Modal
        title={editingCard ? 'Редактирование карточки' : 'Создание карточки'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCard(null);
        }}
        footer={null}
        width={700}
      >
        <CardForm
          initialValues={editingCard || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalVisible(false);
            setEditingCard(null);
          }}
        />
      </Modal>

      <Modal
        title="Импорт из Excel"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
          }}
        />
      </Modal>
    </div>
  );
};

export default RegistryPage;
