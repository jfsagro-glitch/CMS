import React, { useState, useEffect } from 'react';
import { Modal, message, Button, Space, List, Tag, Empty, Typography } from 'antd';
import CollateralCardForm from '@/components/common/CollateralCardForm';
import CollateralCardView from '@/components/common/CollateralCardView';
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
import type { CollateralDocument, CollateralDossierPayload } from '@/types/collateralDossier';
import type { ExtendedCollateralCard } from '@/types';
import { useLocation, useNavigate } from 'react-router-dom';
import { LinkOutlined } from '@ant-design/icons';

const ExtendedRegistryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { filteredItems: cards, loading } = useAppSelector((state: any) => state.extendedCards);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<ExtendedCollateralCard | null>(null);
  const [viewingCard, setViewingCard] = useState<ExtendedCollateralCard | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [dossierModalVisible, setDossierModalVisible] = useState(false);
  const [dossierData, setDossierData] = useState<CollateralDocument[]>([]);
  const [dossierLoading, setDossierLoading] = useState(true);
  const [selectedDossierDocs, setSelectedDossierDocs] = useState<CollateralDocument[]>([]);

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

  // Обработка deep linking - открытие объекта по ID из URL
  useEffect(() => {
    if (cards.length > 0) {
      const params = new URLSearchParams(location.search);
      const objectId = params.get('objectId');
      if (objectId) {
        const card = cards.find((c: ExtendedCollateralCard) => c.id === objectId);
        if (card) {
          setViewingCard(card);
          setViewModalVisible(true);
          // Очищаем параметр из URL
          window.history.replaceState({}, '', location.pathname);
        }
      }
    }
  }, [cards, location.search, location.pathname]);

  useEffect(() => {
    const loadDossierData = async () => {
      try {
        const base = import.meta.env.BASE_URL ?? '/';
        const resolvedBase = new URL(base, window.location.origin);
        const normalizedPath = resolvedBase.pathname.endsWith('/')
          ? resolvedBase.pathname
          : `${resolvedBase.pathname}/`;
        const url = `${resolvedBase.origin}${normalizedPath}collateralDossier.json?v=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load dossier (${response.status})`);
        }
        const payload = (await response.json()) as CollateralDossierPayload;
        setDossierData(payload.documents);
      } catch (error) {
        console.warn('Не удалось загрузить данные залогового досье', error);
      } finally {
        setDossierLoading(false);
      }
    };

    loadDossierData();
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
      setViewModalVisible(true);
    }
  };

  const handleDoubleClick = (record: RegistryTableRecord) => {
    handleView(record.id);
  };

  const closeViewModal = () => {
    setViewModalVisible(false);
    setViewingCard(null);
  };

  const openDossierModal = () => {
    if (!viewingCard) return;
    const reference = String(viewingCard.number ?? viewingCard.id ?? '');
    const docs = dossierData.filter(doc => String(doc.reference) === reference);
    setSelectedDossierDocs(docs);
    setDossierModalVisible(true);
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

      <Modal
        title={
          <Space>
            <span>Карточка объекта</span>
            {viewingCard && (
              <Typography.Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                ID: {viewingCard.id}
              </Typography.Text>
            )}
          </Space>
        }
        open={viewModalVisible}
        onCancel={closeViewModal}
        footer={[
          viewingCard?.reference && (
            <Button
              key="portfolio"
              icon={<LinkOutlined />}
              onClick={() => {
                navigate(`/portfolio?q=${viewingCard.reference}`);
                closeViewModal();
              }}
            >
              Перейти в портфель
            </Button>
          ),
          <Button key="dossier" type="primary" onClick={openDossierModal} disabled={!viewingCard}>
            Залоговое досье
          </Button>,
          <Button key="close" onClick={closeViewModal}>
            Закрыть
          </Button>,
        ]}
        width="90%"
        style={{ top: 20 }}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        destroyOnClose
      >
        {viewingCard && <CollateralCardView card={viewingCard} />}
      </Modal>

      <Modal
        title="Залоговое досье по договору"
        open={dossierModalVisible}
        onCancel={() => setDossierModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDossierModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
        width={720}
      >
        {dossierLoading ? (
          <Empty description="Загрузка документов..." />
        ) : selectedDossierDocs.length === 0 ? (
          <Empty description="По данному договору нет документов" />
        ) : (
          <List
            dataSource={selectedDossierDocs}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={item.statusColor || 'blue'}>{item.status}</Tag>
                      <span>{item.docType}</span>
                    </Space>
                  }
                  description={
                    <Typography.Text type="secondary">
                      {item.folderPath.join(' / ')} · {item.lastUpdated}
                    </Typography.Text>
                  }
                />
                <div>
                  <div>{item.fileName}</div>
                  <Typography.Text type="secondary">{item.responsible}</Typography.Text>
                </div>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default ExtendedRegistryPage;
