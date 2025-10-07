import React, { useState } from 'react';
import { Upload, Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Tag, message } from 'antd';
import {
  UploadOutlined,
  FileOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Document } from '@/types';
import { generateId, formatDate } from '@/utils/helpers';

interface DocumentManagerProps {
  value?: Document[];
  onChange?: (value: Document[]) => void;
  disabled?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ value = [], onChange, disabled = false }) => {
  const [documents, setDocuments] = useState<Document[]>(value);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  const documentCategories = [
    'Правоустанавливающие документы',
    'Технические документы',
    'Отчеты об оценке',
    'Фотографии',
    'Договоры',
    'Прочее',
  ];

  const handleUpload = () => {
    setUploadModalVisible(true);
    form.resetFields();
    setFileList([]);
  };

  const handleUploadSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (fileList.length === 0) {
        message.error('Выберите файл для загрузки');
        return;
      }

      const newDocuments: Document[] = [];

      for (const file of fileList) {
        // Читаем файл как Base64 для хранения в IndexedDB
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file.originFileObj);
        });

        const doc: Document = {
          id: generateId(),
          name: file.name,
          type: values.type || 'Прочее',
          size: file.size,
          mimeType: file.type,
          uploadDate: new Date(),
          category: values.category,
          description: values.description,
          fileData,
        };

        newDocuments.push(doc);
      }

      const updatedDocuments = [...documents, ...newDocuments];
      setDocuments(updatedDocuments);
      onChange?.(updatedDocuments);
      setUploadModalVisible(false);
      message.success(`Загружено документов: ${newDocuments.length}`);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDelete = (id: string) => {
    const updatedDocuments = documents.filter(d => d.id !== id);
    setDocuments(updatedDocuments);
    onChange?.(updatedDocuments);
    message.success('Документ удален');
  };

  const handleDownload = (doc: Document) => {
    if (!doc.fileData) {
      message.error('Данные файла недоступны');
      return;
    }

    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Файл скачан');
  };

  const handlePreview = (doc: Document) => {
    setPreviewDocument(doc);
    setPreviewModalVisible(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileOutlined style={{ color: '#52c41a' }} />;
    } else if (mimeType.includes('pdf')) {
      return <FileOutlined style={{ color: '#f5222d' }} />;
    } else if (mimeType.includes('word')) {
      return <FileOutlined style={{ color: '#1890ff' }} />;
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileOutlined style={{ color: '#52c41a' }} />;
    }
    return <FileOutlined />;
  };

  const columns: ColumnsType<Document> = [
    {
      title: 'Тип',
      dataIndex: 'mimeType',
      key: 'mimeType',
      width: 60,
      render: (mimeType: string) => getFileIcon(mimeType),
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      width: 200,
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: 'Размер',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: 'Дата загрузки',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      width: 180,
      render: (date: Date) => formatDate(date),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
            size="small"
          >
            Просмотр
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            size="small"
          >
            Скачать
          </Button>
          <Popconfirm
            title="Удалить документ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small" disabled={disabled}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const uploadProps: UploadProps = {
    multiple: true,
    fileList,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    beforeUpload: () => {
      return false; // Предотвращаем автоматическую загрузку
    },
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={handleUpload}
          disabled={disabled}
        >
          Загрузить документы
        </Button>
        {documents.length > 0 && (
          <span style={{ color: '#999' }}>
            Всего документов: {documents.length} ({formatFileSize(documents.reduce((sum, d) => sum + d.size, 0))})
          </span>
        )}
      </Space>

      <Table
        columns={columns}
        dataSource={documents}
        rowKey="id"
        pagination={false}
        size="small"
      />

      <Modal
        title="Загрузка документов"
        open={uploadModalVisible}
        onOk={handleUploadSubmit}
        onCancel={() => {
          setUploadModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        width={600}
        okText="Загрузить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Выберите файлы">
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Нажмите или перетащите файлы в эту область</p>
              <p className="ant-upload-hint">Поддерживается загрузка одного или нескольких файлов</p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            name="category"
            label="Категория документа"
            rules={[{ required: true, message: 'Выберите категорию' }]}
          >
            <Select
              options={documentCategories.map(cat => ({ label: cat, value: cat }))}
              placeholder="Выберите категорию"
            />
          </Form.Item>

          <Form.Item name="type" label="Тип документа">
            <Input placeholder="Например: Свидетельство о праве собственности" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} placeholder="Краткое описание документа" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={previewDocument?.name}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => previewDocument && handleDownload(previewDocument)}>
            Скачать
          </Button>,
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
        width={800}
      >
        {previewDocument && previewDocument.fileData && (
          <div style={{ textAlign: 'center' }}>
            {previewDocument.mimeType.startsWith('image/') ? (
              <img
                src={previewDocument.fileData}
                alt={previewDocument.name}
                style={{ maxWidth: '100%', maxHeight: '600px' }}
              />
            ) : previewDocument.mimeType === 'application/pdf' ? (
              <iframe
                src={previewDocument.fileData}
                style={{ width: '100%', height: '600px', border: 'none' }}
                title={previewDocument.name}
              />
            ) : (
              <div style={{ padding: '40px' }}>
                <FileOutlined style={{ fontSize: 64, color: '#999' }} />
                <p style={{ marginTop: 16, color: '#999' }}>
                  Предпросмотр недоступен для данного типа файла
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentManager;

