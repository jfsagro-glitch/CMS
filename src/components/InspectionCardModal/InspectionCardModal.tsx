/**
 * Модалка карточки осмотра
 * Отображает все данные осмотра, хронологию и фотографии
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Tabs,
  Descriptions,
  Tag,
  Typography,
  Space,
  Image,
  Button,
  Empty,
  Spin,
  Timeline,
  Row,
  Col,
  Card,
  message,
  Input,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  FileTextOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { Inspection, InspectionHistoryItem } from '@/types/inspection';
import inspectionService from '@/services/InspectionService';
import { generateInspectionPDF } from '@/utils/pdfGenerator';
import dayjs from 'dayjs';
import './InspectionCardModal.css';

const { Text } = Typography;
const { TextArea } = Input;

interface InspectionCardModalProps {
  visible: boolean;
  inspectionId: string | null;
  onClose: () => void;
  onApprove?: (inspectionId: string) => void;
  onRequestRevision?: (inspectionId: string, comment: string) => void;
}

const InspectionCardModal: React.FC<InspectionCardModalProps> = ({
  visible,
  inspectionId,
  onClose,
  onApprove,
  onRequestRevision,
}) => {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');

  useEffect(() => {
    if (visible && inspectionId) {
      loadInspection();
    } else {
      setInspection(null);
    }
  }, [visible, inspectionId]);

  const loadInspection = async () => {
    if (!inspectionId) return;
    setLoading(true);
    try {
      const data = await inspectionService.getInspectionById(inspectionId);
      setInspection(data || null);
    } catch (error) {
      console.error('Ошибка загрузки осмотра:', error);
      message.error('Не удалось загрузить осмотр');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (inspectionId && onApprove) {
      onApprove(inspectionId);
      loadInspection();
    }
  };

  const handleRequestRevision = () => {
    if (inspectionId && onRequestRevision && revisionComment.trim()) {
      onRequestRevision(inspectionId, revisionComment);
      setRevisionComment('');
      loadInspection();
    }
  };

  const handleGeneratePDF = () => {
    if (inspection) {
      generateInspectionPDF(inspection);
    } else {
      message.error('Осмотр не загружен');
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      scheduled: 'blue',
      sent_to_client: 'cyan',
      in_progress: 'orange',
      submitted_for_review: 'purple',
      needs_revision: 'red',
      approved: 'green',
      completed: 'green',
      cancelled: 'red',
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      scheduled: 'Запланирован',
      sent_to_client: 'Отправлен клиенту',
      in_progress: 'В процессе',
      submitted_for_review: 'На проверке',
      needs_revision: 'Требует доработки',
      approved: 'Согласован',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };
    return statusLabels[status] || status;
  };

  const getHistoryIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'sent_to_client':
        return <ClockCircleOutlined style={{ color: '#13c2c2' }} />;
      case 'submitted':
        return <ClockCircleOutlined style={{ color: '#722ed1' }} />;
      case 'reviewed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'approved':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'revision_requested':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const tabs: TabsProps['items'] = [
    {
      key: 'info',
      label: 'Информация',
      children: inspection ? (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Тип осмотра">
            {inspection.inspectionType}
          </Descriptions.Item>
          <Descriptions.Item label="Статус">
            <Tag color={getStatusColor(inspection.status)}>
              {getStatusLabel(inspection.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Дата осмотра">
            {dayjs(inspection.inspectionDate).format('DD.MM.YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Объект">
            {inspection.collateralName}
          </Descriptions.Item>
          <Descriptions.Item label="Адрес">
            {inspection.address || 'Не указан'}
          </Descriptions.Item>
          <Descriptions.Item label="Исполнитель">
            {inspection.inspectorName}
            {inspection.inspectorType === 'client' && (
              <Tag color="orange" style={{ marginLeft: 8 }}>Клиент</Tag>
            )}
            {inspection.inspectorType === 'employee' && (
              <Tag color="blue" style={{ marginLeft: 8 }}>Сотрудник</Tag>
            )}
          </Descriptions.Item>
          {inspection.inspectorPhone && (
            <Descriptions.Item label="Телефон">
              {inspection.inspectorPhone}
            </Descriptions.Item>
          )}
          {inspection.inspectorEmail && (
            <Descriptions.Item label="Email">
              {inspection.inspectorEmail}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Состояние">
            <Tag color={inspection.condition === 'excellent' ? 'green' : 
                        inspection.condition === 'good' ? 'blue' :
                        inspection.condition === 'satisfactory' ? 'orange' : 'red'}>
              {inspection.condition}
            </Tag>
          </Descriptions.Item>
          {inspection.notes && (
            <Descriptions.Item label="Примечания" span={2}>
              {inspection.notes}
            </Descriptions.Item>
          )}
          {inspection.latitude && inspection.longitude && (
            <Descriptions.Item label="Геолокация" span={2}>
              <Space>
                <EnvironmentOutlined />
                <Text>
                  {inspection.latitude.toFixed(6)}, {inspection.longitude.toFixed(6)}
                </Text>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    window.open(
                      `https://yandex.ru/maps/?pt=${inspection.longitude},${inspection.latitude}&z=16`,
                      '_blank'
                    );
                  }}
                >
                  Открыть на карте
                </Button>
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      ) : (
        <Empty description="Данные не загружены" />
      ),
    },
    {
      key: 'photos',
      label: (
        <Space>
          <CameraOutlined />
          Фотографии ({inspection?.photos?.length || 0})
        </Space>
      ),
      children: inspection?.photos && inspection.photos.length > 0 ? (
        <Row gutter={[16, 16]}>
          {inspection.photos.map((photo) => (
            <Col key={photo.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                cover={
                  <Image
                    src={photo.url}
                    alt={photo.description || 'Фото осмотра'}
                    preview={{
                      mask: 'Просмотр',
                    }}
                    style={{ height: 200, objectFit: 'cover' }}
                  />
                }
              >
                <Card.Meta
                  title={photo.location || photo.step || 'Фото'}
                  description={
                    <Space direction="vertical" size="small">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(photo.takenAt).format('DD.MM.YYYY HH:mm')}
                      </Text>
                      {photo.latitude && photo.longitude && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <EnvironmentOutlined /> {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                        </Text>
                      )}
                      {photo.description && (
                        <Text style={{ fontSize: 12 }}>{photo.description}</Text>
                      )}
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="Фотографии отсутствуют" />
      ),
    },
    {
      key: 'history',
      label: 'Хронология',
      children: inspection?.history && inspection.history.length > 0 ? (
        <Timeline>
          {inspection.history.map((item: InspectionHistoryItem) => (
            <Timeline.Item
              key={item.id}
              dot={getHistoryIcon(item.action)}
            >
              <Space direction="vertical" size="small">
                <Space>
                  <Text strong>{item.user}</Text>
                  <Tag color={getStatusColor(item.status)}>
                    {getStatusLabel(item.status)}
                  </Tag>
                </Space>
                <Text type="secondary">
                  {dayjs(item.date).format('DD.MM.YYYY HH:mm')}
                </Text>
                <Text>{item.action === 'created' ? 'Создал осмотр' :
                       item.action === 'sent_to_client' ? 'Отправил клиенту' :
                       item.action === 'submitted' ? 'Отправил на проверку' :
                       item.action === 'reviewed' ? 'Проверил' :
                       item.action === 'approved' ? 'Согласовал' :
                       item.action === 'revision_requested' ? 'Запросил доработку' :
                       item.action}</Text>
                {item.comment && (
                  <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                    {item.comment}
                  </Text>
                )}
              </Space>
            </Timeline.Item>
          ))}
        </Timeline>
      ) : (
        <Empty description="Хронология отсутствует" />
      ),
    },
  ];

  const canApprove = inspection?.status === 'submitted_for_review';
  const canRequestRevision = inspection?.status === 'submitted_for_review';

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>Карточка осмотра</span>
          {inspection && (
            <Tag color={getStatusColor(inspection.status)}>
              {getStatusLabel(inspection.status)}
            </Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="pdf" icon={<DownloadOutlined />} onClick={handleGeneratePDF}>
          Скачать PDF
        </Button>,
        canRequestRevision && (
          <Button
            key="revision"
            danger
            onClick={handleRequestRevision}
            disabled={!revisionComment.trim()}
          >
            Запросить доработку
          </Button>
        ),
        canApprove && (
          <Button key="approve" type="primary" onClick={handleApprove}>
            Согласовать
          </Button>
        ),
        <Button key="close" onClick={onClose}>
          Закрыть
        </Button>,
      ].filter(Boolean)}
      width={900}
      className="inspection-card-modal"
    >
      {loading ? (
        <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: '40px' }} />
      ) : inspection ? (
        <>
          {canRequestRevision && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Комментарий к доработке:</Text>
                <TextArea
                  rows={3}
                  value={revisionComment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRevisionComment(e.target.value)}
                  placeholder="Укажите, что нужно доработать в осмотре"
                />
              </Space>
            </Card>
          )}
          <Tabs items={tabs} />
        </>
      ) : (
        <Empty description="Осмотр не найден" />
      )}
    </Modal>
  );
};

export default InspectionCardModal;

