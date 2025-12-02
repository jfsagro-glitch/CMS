import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Input,
  Card,
  Row,
  Col,
  Statistic,
  Upload,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileTextOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { AppraisalCompany } from '@/types/AppraisalCompany';
import { appraisalCompanyService } from '@/services/AppraisalCompanyService';
import { AppraisalCompanyForm } from './AppraisalCompanyForm';
import type { ColumnsType } from 'antd/es/table';

export const AppraisalCompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<AppraisalCompany[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<AppraisalCompany | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Загружаем начальные данные из файла, если они еще не загружены
        const imported = await appraisalCompanyService.loadInitialData();
        if (imported > 0) {
          message.success(`Загружено компаний из реестра: ${imported}`);
        } else {
          // Проверяем, были ли данные загружены ранее
          const alreadyLoaded = localStorage.getItem('cms_appraisal_companies_initial_data_loaded');
          if (alreadyLoaded !== 'true') {
            message.warning('Не удалось загрузить данные из файла. Проверьте консоль для деталей.');
          }
        }
      } catch (error: any) {
        console.error('Ошибка инициализации данных:', error);
        message.error(`Ошибка загрузки данных: ${error.message || 'Неизвестная ошибка'}`);
      } finally {
        loadCompanies();
      }
    };
    initializeData();
  }, []);

  const loadCompanies = () => {
    setCompanies(appraisalCompanyService.getAll());
  };

  const handleCreate = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleEdit = (company: AppraisalCompany) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Удалить компанию?',
      content: 'Это действие нельзя отменить',
      onOk: () => {
        appraisalCompanyService.delete(id);
        message.success('Компания удалена');
        loadCompanies();
      },
    });
  };

  const handleRequestDocuments = (company: AppraisalCompany) => {
    message.info(`Запрос документов для компании "${company.name}" отправлен`);
    // Здесь можно добавить логику отправки запроса
  };

  const handleImportFile = async (file: File) => {
    setImportLoading(true);
    try {
      let imported = 0;

      if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        // Excel формат - при ручном импорте очищаем существующие данные
        imported = await appraisalCompanyService.loadFromExcelFile(file, 20, true);
        message.success(`Импортировано компаний: ${imported}`);
        loadCompanies();
        setImportLoading(false);
        return false;
      }

      const text = await file.text();
      // Парсинг файла - предполагаем, что это может быть CSV, TSV или JSON
      // Попробуем определить формат
      let companies: Partial<AppraisalCompany>[] = [];

      if (file.name.endsWith('.json')) {
        // JSON формат
        companies = JSON.parse(text);
      } else {
        // CSV/TSV формат
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(/\t|,/).map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(/\t|,/).map(v => v.trim());
          const company: any = {};
          headers.forEach((header, index) => {
            const value = values[index] || '';
            // Маппинг заголовков на поля
            if (
              header.toLowerCase().includes('наименование') ||
              header.toLowerCase().includes('название')
            ) {
              company.name = value;
            } else if (header.toLowerCase().includes('инн')) {
              company.inn = value;
            } else if (header.toLowerCase().includes('огрн')) {
              company.ogrn = value;
            } else if (header.toLowerCase().includes('адрес')) {
              company.address = value;
            } else if (header.toLowerCase().includes('телефон')) {
              company.phone = value;
            } else if (header.toLowerCase().includes('email')) {
              company.email = value;
            } else if (
              header.toLowerCase().includes('руководитель') ||
              header.toLowerCase().includes('директор')
            ) {
              company.director = value;
            } else if (header.toLowerCase().includes('лицензия')) {
              company.licenseNumber = value;
            } else {
              company[header] = value;
            }
          });
          if (company.name) {
            companies.push({
              ...company,
              status: 'active',
            });
          }
        }
      }

      // Сохраняем компании
      for (const companyData of companies) {
        if (companyData.name) {
          appraisalCompanyService.create(
            companyData as Omit<AppraisalCompany, 'id' | 'createdAt' | 'updatedAt'>
          );
          imported++;
        }
      }

      message.success(`Импортировано компаний: ${imported}`);
      loadCompanies();
    } catch (error: any) {
      console.error('Ошибка импорта:', error);
      message.error(`Ошибка импорта файла: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setImportLoading(false);
    }
    return false; // Предотвращаем автоматическую загрузку
  };

  const uploadProps: UploadProps = {
    beforeUpload: file => {
      handleImportFile(file);
      return false;
    },
    showUploadList: false,
    accept: '.csv,.tsv,.txt,.json,.xls,.xlsx',
  };

  const handleSubmit = (values: any) => {
    setLoading(true);
    try {
      if (editingCompany) {
        appraisalCompanyService.update(editingCompany.id, values);
        message.success('Компания обновлена');
      } else {
        appraisalCompanyService.create(values);
        message.success('Компания создана');
      }
      setIsModalOpen(false);
      loadCompanies();
    } catch (error) {
      message.error('Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return companies.filter(company => {
      return (
        !search ||
        [
          company.name,
          company.inn,
          company.address,
          company.phone,
          company.website,
        ]
          .filter(Boolean)
          .some(val => String(val).toLowerCase().includes(search))
      );
    });
  }, [companies, searchValue]);

  const stats = useMemo(() => {
    const total = filteredCompanies.length;
    const active = filteredCompanies.filter(c => c.status === 'active').length;
    const suspended = filteredCompanies.filter(c => c.status === 'suspended').length;
    const revoked = filteredCompanies.filter(c => c.status === 'revoked').length;
    return { total, active, suspended, revoked };
  }, [filteredCompanies]);

  const columns: ColumnsType<AppraisalCompany> = [
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text, record) => (
        <Button type="link" onClick={() => handleEdit(record)} style={{ padding: 0 }}>
          {text}
        </Button>
      ),
    },
    {
      title: 'ИНН',
      dataIndex: 'inn',
      key: 'inn',
      width: 120,
    },
    {
      title: 'Адрес',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      width: 300,
    },
    {
      title: 'Сайт',
      dataIndex: 'website',
      key: 'website',
      width: 200,
      render: (website: string) =>
        website ? (
          <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">
            {website}
          </a>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'Срок действия сертификатов',
      dataIndex: 'certificateExpiryDate',
      key: 'certificateExpiryDate',
      width: 180,
      render: (date: string) =>
        date ? (
          <span>{new Date(date).toLocaleDateString('ru-RU')}</span>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: 'Срок действия страхования',
      dataIndex: 'insuranceExpiryDate',
      key: 'insuranceExpiryDate',
      width: 180,
      render: (date: string) =>
        date ? (
          <span>{new Date(date).toLocaleDateString('ru-RU')}</span>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: 'Членство в СРО',
      dataIndex: 'sroMembership',
      key: 'sroMembership',
      width: 140,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>{value ? 'Да' : 'Нет'}</Tag>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: 'green',
          suspended: 'orange',
          revoked: 'red',
        };
        const labels: Record<string, string> = {
          active: 'Активна',
          suspended: 'Приостановлена',
          revoked: 'Отозвана',
        };
        return <Tag color={colors[status] || 'default'}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_: any, record: AppraisalCompany) => (
        <Space>
          <Button
            icon={<FileTextOutlined />}
            size="small"
            onClick={() => handleRequestDocuments(record)}
            title="Запросить документы"
          >
            Документы
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            title="Редактировать"
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
            title="Удалить"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="appraisal-companies-page">
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>Реестр оценочных компаний</h2>
          <Space>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={importLoading}>
                Импорт из файла
              </Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Добавить компанию
            </Button>
          </Space>
        </div>
        <Input
          allowClear
          size="large"
          placeholder="Поиск по названию, ИНН, адресу, телефону, сайту..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          style={{ width: 400, marginBottom: 16 }}
        />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Всего компаний" value={stats.total} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Активных" value={stats.active} valueStyle={{ color: '#3f8600' }} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Приостановленных"
              value={stats.suspended}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Отозванных" value={stats.revoked} valueStyle={{ color: '#cf1322' }} />
          </Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredCompanies}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1400 }}
          onRow={record => ({
            onDoubleClick: () => handleEdit(record),
          })}
        />
      </Card>

      <Modal
        title={
          <Space>
            <span>{editingCompany ? 'Редактирование компании' : 'Добавление компании'}</span>
            {editingCompany && (
              <Tag color={editingCompany.status === 'active' ? 'green' : 'orange'}>
                {editingCompany.status === 'active'
                  ? 'Активна'
                  : editingCompany.status === 'suspended'
                  ? 'Приостановлена'
                  : 'Отозвана'}
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
        <AppraisalCompanyForm
          initialValues={editingCompany || {}}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          loading={loading}
        />
      </Modal>
    </div>
  );
};
