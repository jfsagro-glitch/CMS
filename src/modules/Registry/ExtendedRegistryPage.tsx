import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, List, Tag, Empty, Typography, Popconfirm } from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import CollateralCardForm from '@/components/common/CollateralCardForm';
import CollateralCardView from '@/components/common/CollateralCardView';
import RegistryTable from '@/components/common/RegistryTable';
import type { RegistryTableRecord } from '@/components/common/RegistryTable';
import excelExportService from '@/services/ExcelExportService';
import notificationService from '@/services/NotificationService';
import '@/components/common/RegistryTable.css';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addCase as addWorkflowCase } from '@/store/slices/workflowSlice';
import {
  bumpRegistryReloadToken,
  selectRegistryQuery,
  setRegistryFilters,
  setRegistryPage,
  setRegistryPageSize,
  setRegistrySort,
} from '@/store/slices/registryQuerySlice';
import type { RootState } from '@/store';
import extendedStorageService from '@/services/ExtendedStorageService';
import type { CollateralDocument, CollateralDossierPayload } from '@/types/collateralDossier';
import type { WorkflowCase } from '@/types/workflow';
import type { ExtendedCollateralCard } from '@/types';
import { useLocation, useNavigate } from 'react-router-dom';
import { LinkOutlined, DatabaseOutlined } from '@ant-design/icons';
import { generateAllCollateralDemoCards } from '@/utils/collateralDemoData';
import { updateCollateralCardValues } from '@/utils/updateExistingData';

const ExtendedRegistryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const query = useAppSelector(selectRegistryQuery);
  const workflowCases = useAppSelector((state: RootState) => state.workflow.cases);
  const [cards, setCards] = useState<ExtendedCollateralCard[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      const result = await extendedStorageService.queryExtendedCards({
        filters: query.filters,
        page: query.page,
        pageSize: query.pageSize,
        sort: query.sort,
      });
      setCards(result.items);
      setTotalCount(result.total);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      notificationService.error('Ошибка загрузки', errorMsg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.filters,
    query.page,
    query.pageSize,
    query.sort,
    query.reloadToken,
  ]);

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
      dispatch(bumpRegistryReloadToken());
      notificationService.success('Карточка удалена');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      notificationService.error('Ошибка удаления', errorMsg);
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

  const handleStartWorkflow = () => {
    if (!viewingCard) return;
    const existing = workflowCases.find((c: any) => c.objectId === viewingCard.id);
    if (existing) {
      notificationService.info('Workflow уже запущен для этого объекта');
      navigate(`/cms/workflow/object/${existing.id}`);
      closeViewModal();
      return;
    }

    const now = new Date().toISOString();
    const newCaseId = `wf-${viewingCard.id}`;
    const newCase: WorkflowCase = {
      id: newCaseId,
      objectId: viewingCard.id,
      objectName: viewingCard.name,
      assetType: viewingCard.mainCategory || 'Обеспечение',
      debtAmount: undefined,
      appraisedValue: undefined,
      stage: 'ANALYSIS',
      manager:
        typeof viewingCard.owner === 'string'
          ? viewingCard.owner
          : viewingCard.owner?.name || 'Не назначен',
      deadline: undefined,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: `h-${now}`,
          stage: 'ANALYSIS',
          user: 'Система',
          comment: 'Workflow запущен из карточки реестра',
          createdAt: now,
        },
      ],
      documents: [],
      notes: viewingCard.number ? `Запущено по договору ${viewingCard.number}` : undefined,
    };

    dispatch(addWorkflowCase(newCase as any));
    notificationService.success('Workflow запущен');
    navigate(`/cms/workflow/object/${newCaseId}`);
    closeViewModal();
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
        notificationService.success('Карточка обновлена');
      } else {
        notificationService.success('Карточка создана');
      }
      dispatch(bumpRegistryReloadToken());

      setModalVisible(false);
      setEditingCard(null);
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'VERSION_CONFLICT') {
        notificationService.error(
          'Конфликт версии',
          'Карточка была изменена в другой вкладке. Обновите список и повторите.',
          { duration: 5 }
        );
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
        notificationService.error(
          'Ошибка сохранения',
          errorMsg,
          { duration: 5 }
        );
      }
      console.error(error);
    }
  };

  const handleCreate = () => {
    setEditingCard(null);
    setModalVisible(true);
  };

  const handleGenerateDemoData = async () => {
    try {
      const loadingKey = notificationService.loading('Генерация демо-карточек...');
      const demoCards = await generateAllCollateralDemoCards();
      let successCount = 0;
      let errorCount = 0;

      for (const card of demoCards) {
        try {
          // Автоматически обновляем рыночную и залоговую стоимость перед сохранением
          const updatedCard = updateCollateralCardValues(card);
          await extendedStorageService.saveExtendedCard(updatedCard);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Ошибка создания карточки ${card.number}:`, error);
        }
      }

      dispatch(bumpRegistryReloadToken());
      notificationService.close(loadingKey);
      notificationService.bulkOperationSuccess(
        successCount,
        'Создание демо-карточек'
      );
      if (errorCount > 0) {
        notificationService.warning(
          `Ошибки: ${errorCount}`,
          `Проверьте консоль для деталей`
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      notificationService.error(
        'Ошибка генерации',
        errorMsg
      );
      console.error(error);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Создать карточку
        </Button>
        <Popconfirm
          title="Генерация демо-данных"
          description="Создать 50 карточек на каждый тип имущества из справочника? Это может занять некоторое время."
          onConfirm={handleGenerateDemoData}
          okText="Да"
          cancelText="Нет"
        >
          <Button icon={<DatabaseOutlined />}>
            Создать демо-данные (50 карточек на каждый тип)
          </Button>
        </Popconfirm>
        <Button
          icon={<DownloadOutlined />}
          onClick={() => {
            try {
              const loadingKey = notificationService.loading('Экспорт в Excel...');
              excelExportService.exportCards(cards);
              notificationService.close(loadingKey);
              notificationService.success(
                'Экспорт завершен',
                `Выгружено ${cards.length} карточек`
              );
            } catch (err) {
              notificationService.error(
                'Ошибка экспорта',
                'Не удалось экспортировать данные'
              );
              console.error(err);
            }
          }}
          disabled={cards.length === 0}
        >
          Экспорт в Excel ({cards.length})
        </Button>
      </Space>

      <RegistryTable
        data={tableData}
        loading={loading}
        pagination={{ current: query.page, pageSize: query.pageSize, total: totalCount }}
        filters={query.filters}
        sort={query.sort}
        onChange={(pagination, filters, sort) => {
          if (pagination.current && pagination.current !== query.page) {
            dispatch(setRegistryPage(pagination.current));
          }
          if (pagination.pageSize && pagination.pageSize !== query.pageSize) {
            dispatch(setRegistryPageSize(pagination.pageSize));
          }
          if (
            filters.mainCategory !== query.filters.mainCategory ||
            filters.status !== query.filters.status
          ) {
            dispatch(setRegistryFilters(filters));
          }
          if (sort?.field !== query.sort?.field || sort?.order !== query.sort?.order) {
            dispatch(setRegistrySort(sort));
          }
        }}
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
          <Button
            key="workflow"
            type="primary"
            onClick={handleStartWorkflow}
            disabled={!viewingCard}
          >
            Запустить workflow
          </Button>,
          viewingCard?.reference && (
            <Button
              key="portfolio"
              icon={<LinkOutlined />}
              onClick={() => {
                navigate(`/cms/portfolio?q=${viewingCard.reference}`);
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
