import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, DatePicker, Button, message } from 'antd';
import dayjs from 'dayjs';
import type { CollateralConclusion } from '@/types/collateralConclusion';

const { TextArea } = Input;
const { Option } = Select;

interface CreateConclusionModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const CreateConclusionModal: React.FC<CreateConclusionModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldsValue({
        conclusionDate: dayjs(),
        authorDate: dayjs().format('YYYY-MM-DD'),
        status: 'Черновик',
        conclusionType: 'Первичное',
      });
      loadPortfolioData();
    }
  }, [visible, form]);

  const loadPortfolioData = async () => {
    try {
      const base = import.meta.env.BASE_URL ?? '/';
      const resolvedBase = new URL(base, window.location.origin);
      const normalizedPath = resolvedBase.pathname.endsWith('/')
        ? resolvedBase.pathname
        : `${resolvedBase.pathname}/`;
      const url = `${resolvedBase.origin}${normalizedPath}portfolioData.json?v=${Date.now()}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setPortfolioData(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных портфеля:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Генерируем номер заключения
      const conclusionNumber = `ЗК-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      const newConclusion: CollateralConclusion = {
        id: `conclusion-${Date.now()}`,
        conclusionNumber,
        conclusionDate: values.conclusionDate.format('YYYY-MM-DD'),
        reference: values.reference || null,
        contractNumber: values.contractNumber || null,
        pledger: values.pledger || null,
        pledgerInn: values.pledgerInn || null,
        borrower: values.borrower || null,
        borrowerInn: values.borrowerInn || null,
        creditProduct: values.creditProduct || null,
        creditAmount: values.creditAmount ? parseFloat(values.creditAmount) : null,
        creditTermMonths: values.creditTermMonths ? parseInt(values.creditTermMonths) : null,
        collateralType: values.collateralType || null,
        collateralName: values.collateralName || null,
        collateralPurpose: values.collateralPurpose || null,
        totalAreaSqm: values.totalAreaSqm ? parseFloat(values.totalAreaSqm) : null,
        totalAreaHectares: values.totalAreaHectares ? parseFloat(values.totalAreaHectares) : null,
        collateralLocation: values.collateralLocation || null,
        objectsCount: values.objectsCount ? parseInt(values.objectsCount) : null,
        ownershipShare: values.ownershipShare ? parseFloat(values.ownershipShare) : null,
        landCategory: values.landCategory || null,
        landPermittedUse: values.landPermittedUse || null,
        landCadastralNumber: values.landCadastralNumber || null,
        landAreaSqm: values.landAreaSqm ? parseFloat(values.landAreaSqm) : null,
        marketValue: values.marketValue ? parseFloat(values.marketValue) : null,
        collateralValue: values.collateralValue ? parseFloat(values.collateralValue) : null,
        fairValue: values.fairValue ? parseFloat(values.fairValue) : null,
        category: values.category || null,
        liquidity: values.liquidity || null,
        liquidityFairValue: values.liquidityFairValue || null,
        collateralDescription: values.collateralDescription || null,
        collateralCondition: values.collateralCondition || null,
        hasReplanning: values.hasReplanning !== undefined ? values.hasReplanning : null,
        landFunctionalProvision: values.landFunctionalProvision || null,
        hasEncumbrances: values.hasEncumbrances !== undefined ? values.hasEncumbrances : null,
        encumbrancesDescription: values.encumbrancesDescription || null,
        inspectionDate: values.inspectionDate ? values.inspectionDate.format('YYYY-MM-DD') : null,
        inspectorName: values.inspectorName || null,
        specialOpinion: values.specialOpinion || null,
        conclusionType: values.conclusionType,
        status: values.status,
        statusColor:
          values.status === 'Согласовано'
            ? 'green'
            : values.status === 'На согласовании'
              ? 'blue'
              : values.status === 'Отклонено' || values.status === 'Аннулировано'
                ? 'red'
                : undefined,
        author: values.author || 'Система',
        authorDate: values.authorDate || dayjs().format('YYYY-MM-DD'),
        approver: values.approver || null,
        approvalDate: values.approvalDate ? values.approvalDate.format('YYYY-MM-DD') : null,
        conclusionText: values.conclusionText || '',
        recommendations: values.recommendations || undefined,
        riskLevel: values.riskLevel || undefined,
        notes: values.notes || undefined,
      };

      // Загружаем существующие заключения
      const base = import.meta.env.BASE_URL ?? '/';
      const resolvedBase = new URL(base, window.location.origin);
      const normalizedPath = resolvedBase.pathname.endsWith('/')
        ? resolvedBase.pathname
        : `${resolvedBase.pathname}/`;
      const url = `${resolvedBase.origin}${normalizedPath}collateralConclusionsData.json?v=${Date.now()}`;
      const response = await fetch(url, { cache: 'no-store' });
      let existingConclusions: CollateralConclusion[] = [];
      if (response.ok) {
        existingConclusions = await response.json();
      }

      // Добавляем новое заключение
      existingConclusions.push(newConclusion);

      // Сохраняем обратно (в реальном приложении это должно быть через API)
      // Для демо-версии просто показываем сообщение
      message.success(`Заключение "${conclusionNumber}" создано (в демо-версии данные не сохраняются)`);
      form.resetFields();
      setLoading(false);
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error('Ошибка создания заключения:', error);
      message.error('Ошибка при создании заключения');
      setLoading(false);
    }
  };

  const handleReferenceChange = (reference: string) => {
    const deal = portfolioData.find((d: any) => String(d.reference) === String(reference));
    if (deal) {
      form.setFieldsValue({
        contractNumber: deal.contractNumber || null,
        pledger: deal.pledger || null,
        pledgerInn: deal.inn || null,
        borrower: deal.borrower || null,
        collateralType: deal.collateralType || null,
        collateralLocation: deal.collateralLocation || null,
        collateralValue: deal.collateralValue || null,
        marketValue: deal.marketValue || deal.currentMarketValue || null,
        fairValue: deal.fairValue || null,
        category: deal.qualityCategory || null,
        liquidity: deal.liquidity || null,
      });
    }
  };

  return (
    <Modal
      title="Создать залоговое заключение"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Отмена
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Создать
        </Button>,
      ]}
      width={900}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="reference"
          label="REFERENCE сделки"
          tooltip="Выберите сделку из портфеля для автозаполнения данных"
        >
          <Select
            placeholder="Выберите REFERENCE"
            showSearch
            allowClear
            onChange={handleReferenceChange}
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {portfolioData.map((deal: any) => (
              <Option key={deal.reference} value={deal.reference}>
                {deal.reference} - {deal.borrower || deal.pledger || 'Не указано'}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="conclusionType" label="Тип заключения" rules={[{ required: true }]}>
          <Select>
            <Option value="Первичное">Первичное</Option>
            <Option value="Повторное">Повторное</Option>
            <Option value="Дополнительное">Дополнительное</Option>
            <Option value="Переоценка">Переоценка</Option>
          </Select>
        </Form.Item>

        <Form.Item name="conclusionDate" label="Дата заключения" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item name="status" label="Статус" rules={[{ required: true }]}>
          <Select>
            <Option value="Черновик">Черновик</Option>
            <Option value="На согласовании">На согласовании</Option>
            <Option value="Согласовано">Согласовано</Option>
            <Option value="Отклонено">Отклонено</Option>
            <Option value="Аннулировано">Аннулировано</Option>
          </Select>
        </Form.Item>

        <Form.Item name="contractNumber" label="№ договора">
          <Input placeholder="Номер договора" />
        </Form.Item>

        <Form.Item name="pledger" label="Залогодатель">
          <Input placeholder="Залогодатель" />
        </Form.Item>

        <Form.Item name="pledgerInn" label="ИНН залогодателя">
          <Input placeholder="ИНН" />
        </Form.Item>

        <Form.Item name="borrower" label="Заемщик">
          <Input placeholder="Заемщик" />
        </Form.Item>

        <Form.Item name="collateralType" label="Тип залога">
          <Input placeholder="Тип залога" />
        </Form.Item>

        <Form.Item name="collateralName" label="Наименование, назначение">
          <Input placeholder="Наименование и назначение имущества" />
        </Form.Item>

        <Form.Item name="collateralPurpose" label="Назначение обеспечения">
          <Input placeholder="Назначение обеспечения" />
        </Form.Item>

        <Form.Item name="collateralLocation" label="Местоположение">
          <Input placeholder="Местоположение предмета залога" />
        </Form.Item>

        <Form.Item name="totalAreaSqm" label="Общая площадь, кв.м.">
          <Input type="number" placeholder="Площадь в квадратных метрах" />
        </Form.Item>

        <Form.Item name="totalAreaHectares" label="Общая площадь, сот.">
          <Input type="number" step="0.01" placeholder="Площадь в сотках" />
        </Form.Item>

        <Form.Item name="objectsCount" label="Количество объектов">
          <Input type="number" placeholder="Количество объектов" />
        </Form.Item>

        <Form.Item name="ownershipShare" label="Доля в праве, %">
          <Input type="number" placeholder="Доля в праве" />
        </Form.Item>

        <Form.Item name="landCadastralNumber" label="Кадастровый номер земельного участка">
          <Input placeholder="Кадастровый номер" />
        </Form.Item>

        <Form.Item name="landCategory" label="Категория земель">
          <Input placeholder="Категория земель" />
        </Form.Item>

        <Form.Item name="landPermittedUse" label="Разрешенный вид использования">
          <Input placeholder="Разрешенный вид использования" />
        </Form.Item>

        <Form.Item name="landAreaSqm" label="Площадь земельного участка, кв.м.">
          <Input type="number" placeholder="Площадь земельного участка" />
        </Form.Item>

        <Form.Item name="collateralDescription" label="Описание имущества">
          <TextArea rows={4} placeholder="Состояние и краткое описание имущества" />
        </Form.Item>

        <Form.Item name="collateralCondition" label="Состояние имущества">
          <Select placeholder="Выберите состояние">
            <Option value="хорошее">Хорошее</Option>
            <Option value="удовлетворительное">Удовлетворительное</Option>
            <Option value="неудовлетворительное">Неудовлетворительное</Option>
          </Select>
        </Form.Item>

        <Form.Item name="hasReplanning" label="Наличие перепланировок">
          <Select placeholder="Выберите">
            <Option value={true}>Да</Option>
            <Option value={false}>Нет</Option>
          </Select>
        </Form.Item>

        <Form.Item name="hasEncumbrances" label="Наличие обременений">
          <Select placeholder="Выберите">
            <Option value={true}>Да</Option>
            <Option value={false}>Нет</Option>
          </Select>
        </Form.Item>

        <Form.Item name="encumbrancesDescription" label="Описание обременений">
          <TextArea rows={3} placeholder="Описание обременений" />
        </Form.Item>

        <Form.Item name="inspectionDate" label="Дата осмотра / проверки">
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item name="inspectorName" label="Сотрудник ПР, проводивший проверку">
          <Input placeholder="ФИО сотрудника" />
        </Form.Item>

        <Form.Item name="category" label="Категория обеспечения">
          <Select placeholder="Выберите категорию">
            <Option value="Формальное">Формальное</Option>
            <Option value="Достаточное">Достаточное</Option>
            <Option value="Недостаточное">Недостаточное</Option>
          </Select>
        </Form.Item>

        <Form.Item name="liquidity" label="Ликвидность">
          <Select placeholder="Выберите ликвидность">
            <Option value="высокая (срок реализации до 90 дней)">Высокая (срок реализации до 90 дней)</Option>
            <Option value="удовлетворительная (срок реализации до 365 дней)">Удовлетворительная (срок реализации до 365 дней)</Option>
            <Option value="низкая (срок реализации свыше 365 дней)">Низкая (срок реализации свыше 365 дней)</Option>
            <Option value="малоудовлетворительная">Малоудовлетворительная</Option>
          </Select>
        </Form.Item>

        <Form.Item name="riskLevel" label="Уровень риска">
          <Select placeholder="Выберите уровень риска">
            <Option value="Низкий">Низкий</Option>
            <Option value="Средний">Средний</Option>
            <Option value="Высокий">Высокий</Option>
            <Option value="Критический">Критический</Option>
          </Select>
        </Form.Item>

        <Form.Item name="collateralValue" label="Оценочная стоимость, руб.">
          <Input type="number" placeholder="Оценочная стоимость" />
        </Form.Item>

        <Form.Item name="marketValue" label="Рыночная стоимость, руб.">
          <Input type="number" placeholder="Рыночная стоимость" />
        </Form.Item>

        <Form.Item name="fairValue" label="Справедливая стоимость, руб.">
          <Input type="number" placeholder="Справедливая стоимость" />
        </Form.Item>

        <Form.Item name="conclusionText" label="Текст заключения" rules={[{ required: true }]}>
          <TextArea rows={6} placeholder="Введите текст заключения" />
        </Form.Item>

        <Form.Item name="recommendations" label="Рекомендации">
          <TextArea rows={4} placeholder="Введите рекомендации" />
        </Form.Item>

        <Form.Item name="specialOpinion" label="Особое мнение">
          <TextArea rows={6} placeholder="Введите особое мнение" />
        </Form.Item>

        <Form.Item name="notes" label="Примечания">
          <TextArea rows={3} placeholder="Введите примечания" />
        </Form.Item>

        <Form.Item name="author" label="Автор" rules={[{ required: true }]}>
          <Input placeholder="Автор заключения" />
        </Form.Item>

        <Form.Item name="authorDate" label="Дата создания">
          <Input disabled />
        </Form.Item>

        <Form.Item name="approver" label="Согласующий">
          <Input placeholder="Согласующий" />
        </Form.Item>

        <Form.Item name="approvalDate" label="Дата согласования">
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateConclusionModal;

