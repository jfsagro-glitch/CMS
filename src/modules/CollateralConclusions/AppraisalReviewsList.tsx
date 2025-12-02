import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Input,
  Select,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  EyeOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { AppraisalReview, AppraisalReviewStatus } from '@/types/AppraisalReview';
import { appraisalReviewService } from '@/services/AppraisalReviewService';
import { AppraisalReviewForm } from './AppraisalReviewForm';
import dayjs from 'dayjs';

export const AppraisalReviewsList: React.FC = () => {
  const [reviews, setReviews] = useState<AppraisalReview[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<AppraisalReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = () => {
    appraisalReviewService.initializeDemoData();
    setReviews(appraisalReviewService.getAll());
  };

  const handleCreate = () => {
    setEditingReview(null);
    setIsModalOpen(true);
  };

  const handleEdit = (review: AppraisalReview) => {
    setEditingReview(review);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Удалить рецензию?',
      content: 'Это действие нельзя отменить',
      onOk: () => {
        appraisalReviewService.delete(id);
        message.success('Рецензия удалена');
        loadReviews();
      },
    });
  };

  const handleStatusChange = (id: string, status: AppraisalReviewStatus) => {
    appraisalReviewService.update(id, { status });
    const statusLabels: Record<string, string> = {
      draft: 'Черновик',
      pending: 'На согласовании',
      approved: 'Согласовано',
      rejected: 'Отклонено',
    };
    message.success(`Статус изменен на "${statusLabels[status]}"`);
    loadReviews();
  };

  const filteredReviews = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return reviews.filter(review => {
      const matchesSearch =
        !search ||
        [review.appraiserName, review.reportName, review.reportNumber, review.objectDescription]
          .filter(Boolean)
          .some(val => String(val).toLowerCase().includes(search));
      const matchesStatus = !statusFilter || review.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reviews, searchValue, statusFilter]);

  const stats = useMemo(() => {
    const total = filteredReviews.length;
    const draft = filteredReviews.filter(r => r.status === 'draft').length;
    const approved = filteredReviews.filter(r => r.status === 'approved').length;
    const pending = filteredReviews.filter(r => r.status === 'pending').length;
    const rejected = filteredReviews.filter(r => r.status === 'rejected').length;
    return { total, draft, approved, pending, rejected };
  }, [filteredReviews]);

  const handleSubmit = (values: any) => {
    setLoading(true);
    try {
      if (editingReview) {
        appraisalReviewService.update(editingReview.id, values);
        message.success('Рецензия обновлена');
      } else {
        appraisalReviewService.create({
          ...values,
          status: 'draft',
        });
        message.success('Рецензия создана');
      }
      setIsModalOpen(false);
      loadReviews();
    } catch (error) {
      message.error('Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{id.substring(0, 8)}...</span>
      ),
    },
    {
      title: 'Дата оценки',
      dataIndex: 'appraisalDate',
      key: 'appraisalDate',
      render: (date: string) => (date ? dayjs(date).format('DD.MM.YYYY') : '-'),
    },
    {
      title: 'Оценщик',
      dataIndex: 'appraiserName',
      key: 'appraiserName',
    },
    {
      title: 'Отчет',
      key: 'report',
      render: (_: any, record: AppraisalReview) => (
        <div>
          <div>{record.reportName}</div>
          <small style={{ color: '#888' }}>{record.reportNumber}</small>
          {record.reportDocumentName && (
            <div style={{ marginTop: 4 }}>
              <FileOutlined style={{ color: '#1890ff' }} />{' '}
              <span style={{ fontSize: '12px', color: '#1890ff' }}>{record.reportDocumentName}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Объект',
      dataIndex: 'objectDescription',
      key: 'objectDescription',
      ellipsis: true,
    },
    {
      title: 'Стоимость',
      dataIndex: 'marketValueWithVat',
      key: 'marketValueWithVat',
      render: (val: number) => (val ? `${val.toLocaleString('ru-RU')} ₽` : '-'),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          draft: 'default',
          pending: 'processing',
          approved: 'success',
          rejected: 'error',
        };
        const labels: Record<string, string> = {
          draft: 'Черновик',
          pending: 'На согласовании',
          approved: 'Согласовано',
          rejected: 'Отклонено',
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      render: (_: any, record: AppraisalReview) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            title="Просмотр"
          />
          {record.status === 'draft' && (
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
              title="Редактировать"
            />
          )}
          {record.status === 'draft' && (
            <Button
              icon={<CheckOutlined />}
              size="small"
              type="primary"
              ghost
              title="Отправить на согласование"
              onClick={() => handleStatusChange(record.id, 'pending')}
            />
          )}
          {record.status === 'pending' && (
            <>
              <Button
                icon={<CheckOutlined />}
                size="small"
                type="primary"
                title="Согласовать"
                onClick={() => handleStatusChange(record.id, 'approved')}
              />
              <Button
                icon={<CloseOutlined />}
                size="small"
                danger
                title="Отклонить"
                onClick={() => handleStatusChange(record.id, 'rejected')}
              />
            </>
          )}
          {record.status !== 'approved' && (
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDelete(record.id)}
              title="Удалить"
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="appraisal-reviews-list">
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>Реестр рецензий на отчеты об оценке</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Создать рецензию
          </Button>
        </div>
        <Space size="middle" style={{ width: '100%', marginBottom: 16 }}>
          <Input
            allowClear
            size="large"
            placeholder="Поиск по оценщику, отчету, объекту..."
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            style={{ width: 400 }}
          />
          <Select
            allowClear
            placeholder="Статус"
            style={{ width: 200 }}
            value={statusFilter ?? undefined}
            onChange={v => setStatusFilter(v ?? null)}
            options={[
              { label: 'Черновик', value: 'draft' },
              { label: 'На согласовании', value: 'pending' },
              { label: 'Согласовано', value: 'approved' },
              { label: 'Отклонено', value: 'rejected' },
            ]}
          />
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Всего рецензий" value={stats.total} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Черновики" value={stats.draft} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="На согласовании" value={stats.pending} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Согласовано" value={stats.approved} />
          </Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredReviews}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <span>{editingReview ? 'Редактирование рецензии' : 'Создание рецензии'}</span>
            {editingReview && (
              <Tag
                color={
                  editingReview.status === 'approved'
                    ? 'green'
                    : editingReview.status === 'pending'
                    ? 'blue'
                    : editingReview.status === 'rejected'
                    ? 'red'
                    : 'default'
                }
              >
                {editingReview.status === 'draft'
                  ? 'Черновик'
                  : editingReview.status === 'pending'
                  ? 'На согласовании'
                  : editingReview.status === 'approved'
                  ? 'Согласовано'
                  : 'Отклонено'}
              </Tag>
            )}
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width="95%"
        style={{ top: 10 }}
        styles={{ body: { maxHeight: '85vh', overflowY: 'auto', padding: '16px' } }}
        destroyOnClose
      >
        <AppraisalReviewForm
          initialValues={editingReview || {}}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          loading={loading}
        />
      </Modal>
    </div>
  );
};
