import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  Button,
  Modal,
  Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileTextOutlined, SearchOutlined, CalendarOutlined, CheckCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import type { Form310Report } from '@/types/reports';
import { generateForm310XML, downloadXML } from '@/utils/generateForm310XML';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import { message } from 'antd';
import './ReportsPage.css';

type ReportRow = Form310Report & { key: string };

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.BASE_URL ?? '/';
        const resolvedBase = new URL(base, window.location.origin);
        const normalizedPath = resolvedBase.pathname.endsWith('/')
          ? resolvedBase.pathname
          : `${resolvedBase.pathname}/`;
        const url = `${resolvedBase.origin}${normalizedPath}reportsData.json?v=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Не удалось загрузить отчеты (${response.status})`);
        }
        const payload = await response.json();
        if (!mounted) return;

        const reportsData = payload.reports || [];
        setReports(
          reportsData.map((r: Form310Report) => ({
            ...r,
            key: r.id,
          }))
        );
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Неизвестная ошибка');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const statusOptions = useMemo(() => {
    const statusSet = Array.from(new Set(reports.map(r => r.status)));
    return statusSet.map(status => ({
      value: status,
      label: status === 'draft' ? 'Черновик' : status === 'submitted' ? 'Отправлен' : status === 'approved' ? 'Утвержден' : 'Отклонен',
    }));
  }, [reports]);

  const dateOptions = useMemo(() => {
    const dates = Array.from(new Set(reports.map(r => r.reportDate))).sort().reverse();
    return dates.map(date => ({ value: date, label: date }));
  }, [reports]);

  const filteredReports = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return reports.filter(r => {
      const matchesSearch =
        !search ||
        [
          r.reportNumber,
          r.guid,
          r.creditOrg.name,
          r.creditOrg.code,
          r.reportDate,
        ]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(search));
      const matchesStatus = !statusFilter || r.status === statusFilter;
      const matchesDate = !dateFilter || r.reportDate === dateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [reports, searchValue, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    const total = filteredReports.length;
    const draft = filteredReports.filter(r => r.status === 'draft').length;
    const submitted = filteredReports.filter(r => r.status === 'submitted').length;
    const approved = filteredReports.filter(r => r.status === 'approved').length;
    return { total, draft, submitted, approved };
  }, [filteredReports]);

  const statusColor: Record<string, string> = {
    draft: 'default',
    submitted: 'processing',
    approved: 'success',
    rejected: 'error',
  };

  const statusLabel: Record<string, string> = {
    draft: 'Черновик',
    submitted: 'Отправлен',
    approved: 'Утвержден',
    rejected: 'Отклонен',
  };

  const columns: ColumnsType<ReportRow> = useMemo(
    () => [
      {
        title: 'Номер отчета',
        dataIndex: 'reportNumber',
        key: 'reportNumber',
        width: 200,
        render: (text: string, record: ReportRow) => (
          <div>
            <div style={{ fontWeight: 600 }}>{text}</div>
            <div className="reports-muted">GUID: {record.guid.substring(0, 8)}...</div>
          </div>
        ),
      },
      {
        title: 'Дата отчета',
        dataIndex: 'reportDate',
        key: 'reportDate',
        width: 150,
        render: (date: string) => (
          <Space>
            <CalendarOutlined />
            <span>{date}</span>
          </Space>
        ),
      },
      {
        title: 'Кредитная организация',
        key: 'creditOrg',
        width: 300,
        render: (_, record: ReportRow) => (
          <div>
            <Typography.Text strong>{record.creditOrg.name}</Typography.Text>
            <div className="reports-muted">Код: {record.creditOrg.code}</div>
          </div>
        ),
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        width: 150,
        render: (status: string) => (
          <Tag color={statusColor[status] || 'default'}>{statusLabel[status] || status}</Tag>
        ),
      },
      {
        title: 'Разделы',
        key: 'sections',
        width: 200,
        render: (_, record: ReportRow) => {
          const sections = [];
          if (record.section1) sections.push('1');
          if (record.section2) sections.push('2');
          if (record.section3) sections.push('3');
          if (record.section4) sections.push('4');
          if (record.section5) sections.push('5');
          if (record.section6) sections.push('6');
          return <span>{sections.join(', ') || '—'}</span>;
        },
      },
      {
        title: 'Обновлен',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 180,
        render: (date: string) => new Date(date).toLocaleString('ru-RU'),
      },
    ],
    [statusColor, statusLabel]
  );

  const handleViewReport = (record: ReportRow) => {
    setSelectedReport(record);
    setModalVisible(true);
  };

  const handleGenerateXML = async () => {
    try {
      message.loading({ content: 'Загрузка данных портфеля...', key: 'generate-xml' });
      
      // Загружаем данные портфеля
      const base = import.meta.env.BASE_URL ?? '/';
      const resolvedBase = new URL(base, window.location.origin);
      const normalizedPath = resolvedBase.pathname.endsWith('/')
        ? resolvedBase.pathname
        : `${resolvedBase.pathname}/`;
      const portfolioUrl = `${resolvedBase.origin}${normalizedPath}portfolioData.json?v=${Date.now()}`;
      
      const portfolioResponse = await fetch(portfolioUrl, { cache: 'no-store' });
      if (!portfolioResponse.ok) {
        throw new Error('Не удалось загрузить данные портфеля');
      }
      
      const portfolioData = (await portfolioResponse.json()) as CollateralPortfolioEntry[];
      
      message.loading({ content: 'Генерация XML отчета...', key: 'generate-xml' });
      
      // Генерируем XML
      const xmlContent = generateForm310XML({
        portfolioData,
        creditOrgCode: '000000000',
        creditOrgName: 'Кредитная организация',
        reportDate: new Date().toISOString().split('T')[0],
      });
      
      // Скачиваем файл
      const filename = `Ф310_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${Date.now()}.xml`;
      downloadXML(xmlContent, filename);
      
      message.success({ content: `XML отчет "${filename}" успешно сгенерирован и скачан`, key: 'generate-xml', duration: 4 });
    } catch (error) {
      message.error({
        content: error instanceof Error ? error.message : 'Ошибка при генерации XML отчета',
        key: 'generate-xml',
        duration: 4,
      });
    }
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <Typography.Title level={2} className="reports-title">
            Отчеты (Форма 310)
          </Typography.Title>
          <Typography.Paragraph className="reports-subtitle">
            Отчетность по залоговому имуществу в соответствии с формой 310 ЦБ РФ
          </Typography.Paragraph>
        </div>
        <Space size="middle" direction="vertical">
          <Tooltip title="Поиск по номеру, GUID, организации">
            <Input
              allowClear
              size="large"
              placeholder="Поиск по отчетам"
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              style={{ width: 360 }}
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            onClick={handleGenerateXML}
          >
            Сформировать XML отчет (Ф310)
          </Button>
        </Space>
      </div>

      <Card>
        <div className="reports-filters">
          <Select
            allowClear
            placeholder="Статус"
            style={{ width: 200 }}
            options={statusOptions}
            value={statusFilter ?? undefined}
            onChange={v => setStatusFilter(v ?? null)}
          />
          <Select
            allowClear
            placeholder="Дата отчета"
            style={{ width: 200 }}
            options={dateOptions}
            value={dateFilter ?? undefined}
            onChange={v => setDateFilter(v ?? null)}
          />
        </div>
      </Card>

      <Row gutter={[16, 16]} className="reports-stats">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Всего отчетов"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Черновики"
              value={stats.draft}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Отправлены"
              value={stats.submitted}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Утверждены"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="reports-table-card" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredReports}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          loading={loading}
          onRow={record => ({
            onDoubleClick: () => handleViewReport(record),
          })}
          locale={{
            emptyText: (
              <Empty
                description="Нет отчетов, удовлетворяющих фильтрам"
                className="reports-empty"
              />
            ),
          }}
        />
      </Card>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить отчеты"
          description={error}
          action={
            <a onClick={() => window.location.reload()} style={{ fontWeight: 600 }}>
              Повторить
            </a>
          }
        />
      )}

      <Modal
        title={`Отчет ${selectedReport?.reportNumber || ''}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedReport(null);
        }}
        footer={[
          <Button key="close" type="primary" onClick={() => {
            setModalVisible(false);
            setSelectedReport(null);
          }}>
            Закрыть
          </Button>,
        ]}
        width="90%"
        style={{ top: 20 }}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {selectedReport && (
          <div className="reports-modal">
            <Descriptions title="Общая информация" bordered column={2} size="small">
              <Descriptions.Item label="Номер отчета">{selectedReport.reportNumber}</Descriptions.Item>
              <Descriptions.Item label="GUID">{selectedReport.guid}</Descriptions.Item>
              <Descriptions.Item label="Дата отчета">{selectedReport.reportDate}</Descriptions.Item>
              <Descriptions.Item label="Статус">
                <Tag color={statusColor[selectedReport.status] || 'default'}>
                  {statusLabel[selectedReport.status] || selectedReport.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Кредитная организация" span={2}>
                {selectedReport.creditOrg.name} (Код: {selectedReport.creditOrg.code})
              </Descriptions.Item>
              <Descriptions.Item label="Создан">{new Date(selectedReport.createdAt).toLocaleString('ru-RU')}</Descriptions.Item>
              <Descriptions.Item label="Обновлен">{new Date(selectedReport.updatedAt).toLocaleString('ru-RU')}</Descriptions.Item>
            </Descriptions>

            {selectedReport.section1 && selectedReport.section1.items.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Typography.Title level={4}>Раздел 1: Общие сведения</Typography.Title>
                <Typography.Text type="secondary">
                  Записей: {selectedReport.section1.items.length}
                </Typography.Text>
              </div>
            )}

            {selectedReport.section2 && selectedReport.section2.items.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Typography.Title level={4}>Раздел 2: Финансовые показатели</Typography.Title>
                <Typography.Text type="secondary">
                  Записей: {selectedReport.section2.items.length}
                </Typography.Text>
              </div>
            )}

            {selectedReport.section3 && selectedReport.section3.items.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Typography.Title level={4}>Раздел 3: Оценка обеспечения</Typography.Title>
                <Typography.Text type="secondary">
                  Записей: {selectedReport.section3.items.length}
                </Typography.Text>
              </div>
            )}

            {selectedReport.errors && selectedReport.errors.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Alert
                  type="warning"
                  message="Ошибки при обработке"
                  description={
                    <ul>
                      {selectedReport.errors.map((err, idx) => (
                        <li key={idx}>
                          <strong>{err.field}:</strong> {err.message}
                        </li>
                      ))}
                    </ul>
                  }
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportsPage;

