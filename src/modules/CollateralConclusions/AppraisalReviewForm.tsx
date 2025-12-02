import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Checkbox,
  Table,
  Upload,
  message,
} from 'antd';
import { UploadOutlined, FileOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { AppraisalReview } from '@/types/AppraisalReview';
import dayjs from 'dayjs';

interface AppraisalReviewFormProps {
  initialValues?: Partial<AppraisalReview>;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

const { TextArea } = Input;

export const AppraisalReviewForm: React.FC<AppraisalReviewFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        appraisalDate: initialValues.appraisalDate ? dayjs(initialValues.appraisalDate) : null,
        reviewDate: initialValues.reviewDate ? dayjs(initialValues.reviewDate) : null,
      });

      // Устанавливаем файл, если он есть
      if (initialValues.reportDocumentId && initialValues.reportDocumentName) {
        setFileList([
          {
            uid: initialValues.reportDocumentId,
            name: initialValues.reportDocumentName,
            status: 'done',
          } as UploadFile,
        ]);
      } else {
        setFileList([]);
      }
    } else {
      form.resetFields();
      setFileList([]);
      // Set defaults
      form.setFieldsValue({
        valueType: 'Рыночная стоимость',
        marketCorrespondence: true,
        compliance135FZ: 'compliant',
      });
    }
  }, [initialValues, form]);

  const handleFinish = async (values: any) => {
    let reportDocumentId = initialValues?.reportDocumentId || null;
    let reportDocumentName = initialValues?.reportDocumentName || null;

    // Обрабатываем загруженный файл
    if (fileList.length > 0 && fileList[0].originFileObj) {
      const file = fileList[0].originFileObj;
      try {
        // Конвертируем файл в base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Сохраняем в localStorage (можно улучшить, используя IndexedDB)
        const documentId = crypto.randomUUID();
        const documentData = {
          id: documentId,
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          uploadedAt: new Date().toISOString(),
        };
        localStorage.setItem(`appraisal_report_${documentId}`, JSON.stringify(documentData));

        reportDocumentId = documentId;
        reportDocumentName = file.name;
      } catch (error) {
        message.error('Ошибка при загрузке файла');
        return;
      }
    } else if (fileList.length === 0 && initialValues?.reportDocumentId) {
      // Файл был удален
      reportDocumentId = null;
      reportDocumentName = null;
    }

    const formattedValues = {
      ...values,
      appraisalDate: values.appraisalDate ? values.appraisalDate.toISOString() : null,
      reviewDate: values.reviewDate ? values.reviewDate.toISOString() : null,
      reportDocumentId,
      reportDocumentName,
    };
    onSubmit(formattedValues);
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const isDoc =
        file.type.includes('wordprocessingml') ||
        file.name.endsWith('.doc') ||
        file.name.endsWith('.docx');
      if (!isPdf && !isDoc) {
        message.error('Можно загружать только PDF или DOC/DOCX файлы!');
        return Upload.LIST_IGNORE;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('Файл должен быть меньше 10MB!');
        return Upload.LIST_IGNORE;
      }
      return false; // Предотвращаем автоматическую загрузку
    },
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList);
    },
    onRemove: () => {
      setFileList([]);
      form.setFieldsValue({ reportDocumentId: null, reportDocumentName: null });
    },
    maxCount: 1,
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} disabled={loading}>
      <Card title="Общие сведения" size="small" style={{ marginBottom: 16 }}>
        {initialValues?.id && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Form.Item label="ID рецензии">
                <Input value={initialValues.id} disabled style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>
        )}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="appraiserName"
              label="Наименование оценщика"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="hasRecommendation"
              label="Наличие рекомендации"
              valuePropName="checked"
            >
              <Checkbox>Рекомендован банком</Checkbox>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="reportName" label="Наименование отчета" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="reportNumber" label="Номер отчета" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="appraisalDate" label="Дата оценки" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="appraisalPurpose" label="Цель оценки">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="valueType" label="Вид стоимости">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="marketValueWithVat" label="Итоговая рыночная стоимость (с НДС)">
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                parser={value => value!.replace(/\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="objectDescription" label="Описание оцениваемого объекта">
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item label="Отчет об оценке (файл)">
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Загрузить отчет</Button>
          </Upload>
          <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
            Поддерживаются файлы PDF, DOC, DOCX (макс. 10MB)
          </div>
          {fileList.length > 0 && fileList[0].status === 'done' && (
            <div style={{ marginTop: 8 }}>
              <FileOutlined /> {fileList[0].name}
            </div>
          )}
        </Form.Item>
      </Card>

      <Card title="Требования к оформлению отчета" size="small" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          pagination={false}
          dataSource={[
            {
              key: '1',
              requirement:
                'Отчет об оценке соответствует требованиям Федерального закона от 29.07.98 г. №135-ФЗ «Об оценочной деятельности в Российской Федерации» (со всеми изменениями на дату оценки), Федеральным стандартам оценки',
              compliance: 'compliance135FZ',
              note: 'complianceNote',
            },
          ]}
          columns={[
            {
              title: 'Требования к оформлению отчета',
              dataIndex: 'requirement',
              key: 'requirement',
              width: '50%',
            },
            {
              title: 'Соответствие требованиям',
              dataIndex: 'compliance',
              key: 'compliance',
              width: '25%',
              render: (fieldName: string) => (
                <Form.Item name={fieldName} noStyle>
                  <Select placeholder="Выберите">
                    <Select.Option value="compliant">Соответствует</Select.Option>
                    <Select.Option value="not_compliant">Не соответствует</Select.Option>
                    <Select.Option value="partial">Соответствует частично</Select.Option>
                  </Select>
                </Form.Item>
              ),
            },
            {
              title: 'Примечание',
              dataIndex: 'note',
              key: 'note',
              width: '25%',
              render: (fieldName: string) => (
                <Form.Item name={fieldName} noStyle>
                  <Input placeholder="Примечание" />
                </Form.Item>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Расчет стоимости объекта оценки" size="small" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          pagination={false}
          dataSource={[
            {
              key: 'comparative',
              approach: 'Сравнительный подход',
              methodology: 'comparativeMethodologyValid',
              errors: 'comparativeErrors',
              conclusion: 'comparativeConclusion',
            },
            {
              key: 'cost',
              approach: 'Затратный подход',
              methodology: 'costMethodologyValid',
              errors: 'costErrors',
              conclusion: 'costConclusion',
            },
            {
              key: 'income',
              approach: 'Доходный подход',
              methodology: 'incomeMethodologyValid',
              errors: 'incomeErrors',
              conclusion: 'incomeConclusion',
            },
          ]}
          columns={[
            {
              title: 'Подход',
              dataIndex: 'approach',
              key: 'approach',
              width: '20%',
            },
            {
              title:
                'Правильность и обоснованность выбора метода в рамках подхода/Корректность обоснования отказа от использования подхода',
              dataIndex: 'methodology',
              key: 'methodology',
              width: '30%',
              render: (fieldName: string) => (
                <Form.Item name={fieldName} noStyle>
                  <TextArea rows={2} placeholder="Комментарии" />
                </Form.Item>
              ),
            },
            {
              title:
                'Наличие ошибок в расчетах, корректность подобранных аналогов, обоснованность принятых корректировок, прочие нарушения',
              dataIndex: 'errors',
              key: 'errors',
              width: '30%',
              render: (fieldName: string) => (
                <Form.Item name={fieldName} noStyle>
                  <TextArea rows={2} placeholder="Комментарии" />
                </Form.Item>
              ),
            },
            {
              title: 'Выводы в рамках подхода',
              dataIndex: 'conclusion',
              key: 'conclusion',
              width: '20%',
              render: (fieldName: string) => (
                <Form.Item name={fieldName} noStyle>
                  <TextArea rows={2} placeholder="Выводы" />
                </Form.Item>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Согласование результатов" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="reconciliationWeightsJustification"
          label="Обоснование выбора использованных весов, присвоенных каждому из подходов"
        >
          <TextArea rows={3} placeholder="Опишите обоснование выбора весов для каждого подхода" />
        </Form.Item>
      </Card>

      <Card
        title="Вывод о корректности определения рыночной стоимости"
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Form.Item
          name="marketValueCorrectness"
          label="Вывод о корректности определения рыночной стоимости"
        >
          <TextArea
            rows={3}
            placeholder="Сформулируйте вывод о корректности определения рыночной стоимости"
          />
        </Form.Item>

        <Form.Item
          name="marketCorrespondence"
          label="Стоимость соответствует рынку"
          valuePropName="checked"
        >
          <Checkbox>Да, стоимость соответствует рынку</Checkbox>
        </Form.Item>
      </Card>

      <Card title="Подпись" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="reviewDate" label="Дата рецензии">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="reviewerName" label="ФИО сотрудника">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="reviewerPosition" label="Должность">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onCancel}>Отмена</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Сохранить
        </Button>
      </div>
    </Form>
  );
};
