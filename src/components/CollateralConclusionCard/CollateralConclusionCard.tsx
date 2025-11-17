import React, { useMemo } from 'react';
import { Tabs, Descriptions, Tag, Typography, Table, Space, Image, Button, Divider } from 'antd';
import { EditOutlined, PrinterOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { CollateralConclusion } from '@/types/collateralConclusion';
import type { TabsProps } from 'antd';

const { Paragraph, Text, Title } = Typography;

interface CollateralConclusionCardProps {
  conclusion: CollateralConclusion;
  onEdit?: () => void;
  onPrint?: () => void;
  onExport?: () => void;
}

const CollateralConclusionCard: React.FC<CollateralConclusionCardProps> = ({ 
  conclusion, 
  onEdit, 
  onPrint, 
  onExport 
}) => {
  const currencyFormatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  });

  const formatCurrency = (value: number | null | undefined) => {
    return value ? currencyFormatter.format(value) : '—';
  };

  const tabItems: TabsProps['items'] = useMemo(() => {
    const items: TabsProps['items'] = [];

    // 1. Основная информация (компактно)
    items.push({
      key: 'main',
      label: 'Основная информация',
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Descriptions bordered column={3} size="small">
            <Descriptions.Item label="№ заключения" span={1}>
              <Text strong>{conclusion.conclusionNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Дата" span={1}>{conclusion.conclusionDate}</Descriptions.Item>
            <Descriptions.Item label="Тип" span={1}>{conclusion.conclusionType}</Descriptions.Item>
            <Descriptions.Item label="Статус" span={1}>
              <Tag
                color={
                  conclusion.status === 'Согласовано'
                    ? 'green'
                    : conclusion.status === 'На согласовании'
                      ? 'blue'
                      : conclusion.status === 'Отклонено' || conclusion.status === 'Аннулировано'
                        ? 'red'
                        : 'default'
                }
              >
                {conclusion.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="REFERENCE" span={1}>
              <Text copyable>{conclusion.reference || '—'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="№ договора" span={1}>{conclusion.contractNumber || '—'}</Descriptions.Item>
            <Descriptions.Item label="Заемщик" span={2}>{conclusion.borrower || '—'}</Descriptions.Item>
            <Descriptions.Item label="ИНН заемщика" span={1}>{conclusion.borrowerInn || '—'}</Descriptions.Item>
            <Descriptions.Item label="Залогодатель" span={2}>{conclusion.pledger || '—'}</Descriptions.Item>
            <Descriptions.Item label="ИНН залогодателя" span={1}>{conclusion.pledgerInn || '—'}</Descriptions.Item>
          </Descriptions>

          {conclusion.creditProduct && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Кредитный продукт</Divider>
              <Descriptions bordered column={3} size="small">
                <Descriptions.Item label="Продукт">{conclusion.creditProduct}</Descriptions.Item>
                <Descriptions.Item label="Сумма, руб.">{formatCurrency(conclusion.creditAmount)}</Descriptions.Item>
                <Descriptions.Item label="Срок, мес.">{conclusion.creditTermMonths || '—'}</Descriptions.Item>
                {conclusion.creditContractNumber && (
                  <Descriptions.Item label="№ Кредитного договора" span={3}>
                    {conclusion.creditContractNumber}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}
        </Space>
      ),
    });

    // 2. Имущество
    items.push({
      key: 'property',
      label: 'Имущество',
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Descriptions bordered column={3} size="small">
            <Descriptions.Item label="Тип залога">{conclusion.collateralType || '—'}</Descriptions.Item>
            <Descriptions.Item label="Наименование" span={2}>{conclusion.collateralName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Местоположение" span={3}>{conclusion.collateralLocation || '—'}</Descriptions.Item>
            {conclusion.totalAreaSqm && (
              <Descriptions.Item label="Площадь, кв.м.">{conclusion.totalAreaSqm}</Descriptions.Item>
            )}
            {conclusion.totalAreaHectares && (
              <Descriptions.Item label="Площадь, сот.">{conclusion.totalAreaHectares}</Descriptions.Item>
            )}
            {conclusion.objectsCount && (
              <Descriptions.Item label="Кол-во объектов">{conclusion.objectsCount}</Descriptions.Item>
            )}
            {conclusion.ownershipShare && (
              <Descriptions.Item label="Доля в праве, %">{conclusion.ownershipShare}</Descriptions.Item>
            )}
          </Descriptions>

          {conclusion.landCadastralNumber && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Земельный участок</Divider>
              <Descriptions bordered column={3} size="small">
                <Descriptions.Item label="Кадастровый номер">{conclusion.landCadastralNumber}</Descriptions.Item>
                <Descriptions.Item label="Категория">{conclusion.landCategory || '—'}</Descriptions.Item>
                <Descriptions.Item label="Разрешенное использование">{conclusion.landPermittedUse || '—'}</Descriptions.Item>
                {conclusion.landAreaSqm && (
                  <Descriptions.Item label="Площадь, кв.м.">{conclusion.landAreaSqm}</Descriptions.Item>
                )}
                {conclusion.landAreaHectares && (
                  <Descriptions.Item label="Площадь, га">{conclusion.landAreaHectares}</Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}

          {(conclusion.ownershipBasis || conclusion.ownershipDocuments || conclusion.registrationRecord) && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Права на объект</Divider>
              <Descriptions bordered column={1} size="small">
                {conclusion.ownershipBasis && (
                  <Descriptions.Item label="Право, на основании которого объект принадлежит Залогодателю">
                    <Paragraph style={{ margin: 0 }}>{conclusion.ownershipBasis}</Paragraph>
                  </Descriptions.Item>
                )}
                {conclusion.ownershipDocuments && (
                  <Descriptions.Item label="Документы-основания">
                    <Paragraph style={{ margin: 0 }}>{conclusion.ownershipDocuments}</Paragraph>
                  </Descriptions.Item>
                )}
                {conclusion.registrationRecord && (
                  <Descriptions.Item label="Запись регистрации в ЕГРН">{conclusion.registrationRecord}</Descriptions.Item>
                )}
                {conclusion.registrationDocument && (
                  <Descriptions.Item label="Правоподтверждающий документ">
                    <Paragraph style={{ margin: 0 }}>{conclusion.registrationDocument}</Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}

          <Divider orientation="left" style={{ margin: '8px 0' }}>Состояние и описание</Divider>
          <Descriptions bordered column={1} size="small">
            {conclusion.collateralDescription && (
              <Descriptions.Item label="Описание имущества">
                <Paragraph style={{ margin: 0 }}>{conclusion.collateralDescription}</Paragraph>
              </Descriptions.Item>
            )}
            {conclusion.collateralCondition && (
              <Descriptions.Item label="Состояние">{conclusion.collateralCondition}</Descriptions.Item>
            )}
            {conclusion.hasReplanning !== null && (
              <Descriptions.Item label="Наличие перепланировок">
                {conclusion.hasReplanning ? 'Да' : 'Нет'}
              </Descriptions.Item>
            )}
            {conclusion.replanningDescription && (
              <Descriptions.Item label="Выявленные перепланировки">
                <Paragraph style={{ margin: 0 }}>{conclusion.replanningDescription}</Paragraph>
              </Descriptions.Item>
            )}
            {conclusion.landFunctionalProvision && (
              <Descriptions.Item label="Функциональное обеспечение ЗУ">
                {conclusion.landFunctionalProvision}
              </Descriptions.Item>
            )}
          </Descriptions>

          {conclusion.hasEncumbrances !== null && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Обременения</Divider>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Наличие обременений">
                  {conclusion.hasEncumbrances ? 'Да' : 'Нет'}
                </Descriptions.Item>
                {conclusion.encumbrancesDescription && (
                  <Descriptions.Item label="Описание">
                    <Paragraph style={{ margin: 0 }}>{conclusion.encumbrancesDescription}</Paragraph>
                  </Descriptions.Item>
                )}
                {conclusion.encumbrancesDetails && (
                  <Descriptions.Item label="Выявленные обременения">
                    <Paragraph style={{ margin: 0 }}>{conclusion.encumbrancesDetails}</Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}

          {(conclusion.bankruptcyCheckDate || conclusion.bankruptcyCheckResult) && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Проверка на банкротство</Divider>
              <Descriptions bordered column={2} size="small">
                {conclusion.bankruptcyCheckDate && (
                  <Descriptions.Item label="Дата проверки">{conclusion.bankruptcyCheckDate}</Descriptions.Item>
                )}
                {conclusion.bankruptcyCheckResult && (
                  <Descriptions.Item label="Результат">{conclusion.bankruptcyCheckResult}</Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}
        </Space>
      ),
    });

    // 3. Оценка
    items.push({
      key: 'valuation',
      label: 'Оценка',
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Descriptions bordered column={3} size="small">
            <Descriptions.Item label="Рыночная стоимость">{formatCurrency(conclusion.marketValue)}</Descriptions.Item>
            <Descriptions.Item label="Залоговая стоимость">{formatCurrency(conclusion.collateralValue)}</Descriptions.Item>
            <Descriptions.Item label="Справедливая стоимость">{formatCurrency(conclusion.fairValue)}</Descriptions.Item>
            {conclusion.cadastralValue && (
              <Descriptions.Item label="Кадастровая стоимость">{formatCurrency(conclusion.cadastralValue)}</Descriptions.Item>
            )}
            {conclusion.marketValuePerSqm && (
              <Descriptions.Item label="Рыночная стоимость, руб./кв.м.">
                {formatCurrency(conclusion.marketValuePerSqm)}
              </Descriptions.Item>
            )}
            {conclusion.marketValuePerHectare && (
              <Descriptions.Item label="Рыночная стоимость, руб./сот.">
                {formatCurrency(conclusion.marketValuePerHectare)}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider orientation="left" style={{ margin: '8px 0' }}>Характеристики</Divider>
          <Descriptions bordered column={3} size="small">
            <Descriptions.Item label="Категория обеспечения">{conclusion.category || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ликвидность">{conclusion.liquidity || '—'}</Descriptions.Item>
            {conclusion.liquidityFairValue && (
              <Descriptions.Item label="Ликвидность при справедливой стоимости">
                {conclusion.liquidityFairValue}
              </Descriptions.Item>
            )}
            {conclusion.liquidityMovable && (
              <Descriptions.Item label="Ликвидность движимого имущества">
                {conclusion.liquidityMovable}
              </Descriptions.Item>
            )}
            {conclusion.riskLevel && (
              <Descriptions.Item label="Уровень риска">
                <Tag
                  color={
                    conclusion.riskLevel === 'Низкий'
                      ? 'green'
                      : conclusion.riskLevel === 'Средний'
                        ? 'blue'
                        : conclusion.riskLevel === 'Высокий'
                          ? 'orange'
                          : 'red'
                  }
                >
                  {conclusion.riskLevel}
                </Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Space>
      ),
    });

    // 4. Отлагательные условия
    if (conclusion.suspensiveConditions && conclusion.suspensiveConditions.length > 0) {
      items.push({
        key: 'suspensive',
        label: 'Отлагательные условия',
        children: (
          <Table
            dataSource={conclusion.suspensiveConditions}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              { title: '№', dataIndex: 'number', width: 60, align: 'center' },
              { title: 'Описание', dataIndex: 'description', key: 'description' },
              { 
                title: 'Отлагательные условия', 
                dataIndex: 'suspensiveCondition', 
                width: 150,
                align: 'center',
                render: (val) => val === '+' ? <Tag color="green">+</Tag> : <Tag color="red">-</Tag>
              },
              { 
                title: 'Доп. условия', 
                dataIndex: 'additionalCondition', 
                width: 150,
                align: 'center',
                render: (val) => val ? <Tag color="blue">+</Tag> : <Tag color="default">-</Tag>
              },
            ]}
          />
        ),
      });
    }

    // 5. Описание объектов
    if (conclusion.detailedDescriptions && conclusion.detailedDescriptions.length > 0) {
      const firstObj = conclusion.detailedDescriptions[0];
      const columns = Object.keys(firstObj)
        .filter(key => key !== 'id' && firstObj[key] !== null && firstObj[key] !== undefined)
        .slice(0, 10) // Ограничиваем количество колонок для компактности
        .map(key => ({
          title: key,
          dataIndex: key,
          key: key,
          width: 150,
          ellipsis: true,
          render: (text: any) => {
            if (text === null || text === undefined) return '—';
            if (typeof text === 'object') return JSON.stringify(text).slice(0, 50);
            return String(text).slice(0, 50);
          },
        }));

      items.push({
        key: 'detailed',
        label: 'Описание объектов',
        children: (
          <Table
            dataSource={conclusion.detailedDescriptions}
            rowKey="id"
            columns={columns}
            pagination={false}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        ),
      });
    }

    // 6. Фото
    if (conclusion.photos && conclusion.photos.length > 0) {
      items.push({
        key: 'photos',
        label: `Фото (${conclusion.photos.length})`,
        children: (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {conclusion.photos.map(photo => (
              <div key={photo.id} style={{ textAlign: 'center' }}>
                <Image
                  src={photo.url}
                  alt={photo.description || 'Фото'}
                  width={200}
                  height={150}
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                />
                {photo.description && (
                  <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                    {photo.description}
                  </Text>
                )}
              </div>
            ))}
          </div>
        ),
      });
    }

    // 7. Рецензия
    if (conclusion.review) {
      items.push({
        key: 'review',
        label: 'Рецензия',
        children: (
          <Descriptions bordered column={1} size="small">
            {conclusion.review.reviewer && (
              <Descriptions.Item label="Рецензент">{conclusion.review.reviewer}</Descriptions.Item>
            )}
            {conclusion.review.reviewerPosition && (
              <Descriptions.Item label="Должность">{conclusion.review.reviewerPosition}</Descriptions.Item>
            )}
            {conclusion.review.reviewDate && (
              <Descriptions.Item label="Дата рецензии">{conclusion.review.reviewDate}</Descriptions.Item>
            )}
            {conclusion.review.reviewText && (
              <Descriptions.Item label="Текст рецензии">
                <Paragraph style={{ margin: 0 }}>{conclusion.review.reviewText}</Paragraph>
              </Descriptions.Item>
            )}
            {conclusion.review.conclusion && (
              <Descriptions.Item label="Заключение">
                <Tag color="green">{conclusion.review.conclusion}</Tag>
              </Descriptions.Item>
            )}
            {conclusion.review.compliance && (
              <Descriptions.Item label="Соответствие требованиям">
                <Paragraph style={{ margin: 0 }}>{conclusion.review.compliance}</Paragraph>
              </Descriptions.Item>
            )}
          </Descriptions>
        ),
      });
    }

    // 8. Расчеты
    if (conclusion.calculations && conclusion.calculations.length > 0) {
      const calcItems: TabsProps['items'] = conclusion.calculations.map(calc => ({
        key: calc.id,
        label: calc.type,
        children: (
          <Descriptions bordered column={2} size="small">
            {Object.entries(calc.data).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {typeof value === 'object' ? (
                  <pre style={{ margin: 0, fontSize: '12px' }}>{JSON.stringify(value, null, 2)}</pre>
                ) : (
                  String(value)
                )}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ),
      }));

      items.push({
        key: 'calculations',
        label: 'Расчеты',
        children: <Tabs items={calcItems} size="small" />,
      });
    }

    // 9. Особое мнение и рекомендации
    if (conclusion.specialOpinion || conclusion.recommendations || conclusion.conclusionText) {
      items.push({
        key: 'opinion',
        label: 'Мнение и рекомендации',
        children: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {conclusion.specialOpinion && (
              <>
                <Title level={5}>Особое мнение</Title>
                <Paragraph>{conclusion.specialOpinion}</Paragraph>
              </>
            )}
            {conclusion.recommendations && (
              <>
                <Title level={5}>Рекомендации</Title>
                <Paragraph>{conclusion.recommendations}</Paragraph>
              </>
            )}
            {conclusion.conclusionText && (
              <>
                <Title level={5}>Текст заключения</Title>
                <Paragraph>{conclusion.conclusionText}</Paragraph>
              </>
            )}
            {conclusion.notes && (
              <>
                <Title level={5}>Примечания</Title>
                <Paragraph>{conclusion.notes}</Paragraph>
              </>
            )}
          </Space>
        ),
      });
    }

    // 10. Согласование
    items.push({
      key: 'approval',
      label: 'Согласование',
      children: (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Автор">{conclusion.author}</Descriptions.Item>
          <Descriptions.Item label="Дата создания">{conclusion.authorDate}</Descriptions.Item>
          {conclusion.approver && (
            <Descriptions.Item label="Согласующий">{conclusion.approver}</Descriptions.Item>
          )}
          {conclusion.approvalDate && (
            <Descriptions.Item label="Дата согласования">{conclusion.approvalDate}</Descriptions.Item>
          )}
          {conclusion.inspectionDate && (
            <Descriptions.Item label="Дата осмотра">{conclusion.inspectionDate}</Descriptions.Item>
          )}
          {conclusion.inspectorName && (
            <Descriptions.Item label="Проводивший осмотр">{conclusion.inspectorName}</Descriptions.Item>
          )}
        </Descriptions>
      ),
    });

    return items;
  }, [conclusion]);

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Кнопки действий */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        {onEdit && (
          <Button icon={<EditOutlined />} onClick={onEdit}>
            Редактировать
          </Button>
        )}
        {onPrint && (
          <Button icon={<PrinterOutlined />} onClick={onPrint}>
            Печать
          </Button>
        )}
        {onExport && (
          <Button icon={<DownloadOutlined />} onClick={onExport}>
            Экспорт
          </Button>
        )}
        <Button icon={<FileTextOutlined />} onClick={() => window.print()}>
          PDF
        </Button>
      </div>

      {/* Вкладки */}
      <Tabs
        items={tabItems}
        defaultActiveKey="main"
        size="small"
        type="card"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default CollateralConclusionCard;
