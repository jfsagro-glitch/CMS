import React, { useState, useEffect } from 'react';
import { Button, Space, Modal, message, Breadcrumb, Drawer } from 'antd';
import {
  ThunderboltOutlined,
} from '@ant-design/icons';
import CollateralCardForm from '@/components/common/CollateralCardForm';
import CollateralCardView from '@/components/common/CollateralCardView';
import RegistryTable from '@/components/common/RegistryTable';
import type { RegistryTableRecord } from '@/components/common/RegistryTable';
import '@/components/common/RegistryTable.css';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { generateDemoCards } from '@/services/demoDataGenerator';
import {
  setExtendedCards,
  addExtendedCard,
  updateExtendedCard,
  deleteExtendedCard,
  setExtendedLoading,
} from '@/store/slices/extendedCardsSlice';
import extendedStorageService from '@/services/ExtendedStorageService';
import type { ExtendedCollateralCard } from '@/types';

const ExtendedRegistryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filteredItems: cards, loading } = useAppSelector((state: any) => state.extendedCards);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<ExtendedCollateralCard | null>(null);
  const [viewingCard, setViewingCard] = useState<ExtendedCollateralCard | null>(null);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);

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


  const handleEdit = (id: string) => {
    const card = cards.find((c: any) => c.id === id);
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
    const card = cards.find((c: any) => c.id === id);
    if (card) {
      setViewingCard(card);
      setViewDrawerVisible(true);
    }
  };

  const handleDoubleClick = (record: RegistryTableRecord) => {
    handleView(record.id);
  };

  const handleLoadDemoData = async () => {
    try {
      const demoCards = generateDemoCards();
      message.loading({ content: 'Загрузка демо-данных...', key: 'demo' });
      
      for (const card of demoCards) {
        await extendedStorageService.saveExtendedCard(card);
      }
      
      dispatch(setExtendedCards(demoCards));
      message.success({ content: `Загружено ${demoCards.length} демо-карточек`, key: 'demo', duration: 3 });
    } catch (error) {
      message.error({ content: 'Ошибка загрузки демо-данных', key: 'demo' });
      console.error(error);
    }
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
    owner: card.owner,
    characteristics: card.characteristics,
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



  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>Главная</Breadcrumb.Item>
        <Breadcrumb.Item>Реестры</Breadcrumb.Item>
      </Breadcrumb>


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

      <Drawer
        title="Просмотр карточки"
        placement="right"
        width={800}
        open={viewDrawerVisible}
        onClose={() => {
          setViewDrawerVisible(false);
          setViewingCard(null);
        }}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
      >
        {viewingCard && <CollateralCardView card={viewingCard} />}
      </Drawer>
    </div>
  );
};

export default ExtendedRegistryPage;

