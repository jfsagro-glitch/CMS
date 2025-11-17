import React, { useMemo } from 'react';
import { Tabs, Descriptions, Tag, Typography, Table, Space, Image } from 'antd';
import type { CollateralConclusion } from '@/types/collateralConclusion';
import type { TabsProps } from 'antd';

const { Paragraph, Text } = Typography;

interface CollateralConclusionCardProps {
  conclusion: CollateralConclusion;
}

const CollateralConclusionCard: React.FC<CollateralConclusionCardProps> = ({ conclusion }) => {
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

    // Основная информация
    items.push({
      key: 'main',
      label: 'Основная информация',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions title="Общие сведения" bordered column={3} size="small">
            <Descriptions.Item label="№ заключения">{conclusion.conclusionNumber}</Descriptions.Item>
            <Descriptions.Item label="Дата заключения">{conclusion.conclusionDate}</Descriptions.Item>
            <Descriptions.Item label="Тип заключения">{conclusion.conclusionType}</Descriptions.Item>
            <Descriptions.Item label="Статус">
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
            <Descriptions.Item label="REFERENCE">
              {conclusion.reference ? <Text code>{conclusion.reference}</Text> : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="№ договора">{conclusion.contractNumber || '—'}</Descriptions.Item>
          </Descriptions>

          <Descriptions title="Стороны" bordered column={3} size="small">
            <Descriptions.Item label="Заемщик" span={2}>{conclusion.borrower || '—'}</Descriptions.Item>
            <Descriptions.Item label="ИНН заемщика">{conclusion.borrowerInn || '—'}</Descriptions.Item>
            <Descriptions.Item label="Залогодатель" span={2}>{conclusion.pledger || '—'}</Descriptions.Item>
            <Descriptions.Item label="ИНН залогодателя">{conclusion.pledgerInn || '—'}</Descriptions.Item>
          </Descriptions>

          {conclusion.creditProduct && (
            <Descriptions title="Кредитный продукт" bordered column={3} size="small">
              <Descriptions.Item label="Продукт">{conclusion.creditProduct}</Descriptions.Item>
              <Descriptions.Item label="Сумма, руб.">{formatCurrency(conclusion.creditAmount)}</Descriptions.Item>
              <Descriptions.Item label="Срок, мес.">{conclusion.creditTermMonths || '—'}</Descriptions.Item>
            </Descriptions>
          )}
        </Space>
      ),
    });

    // Имущество
    items.push({
      key: 'property',
      label: 'Имущество',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions title="Основные характеристики" bordered column={3} size="small">
            <Descriptions.Item label="Тип залога">{conclusion.collateralType || '—'}</Descriptions.Item>
            <Descriptions.Item label="Наименование, назначение" span={2}>
              {conclusion.collateralName || conclusion.collateralPurpose || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Местоположение" span={3}>
              {conclusion.collateralLocation || '—'}
            </Descriptions.Item>
            {conclusion.totalAreaSqm && (
              <Descriptions.Item label="Общая площадь, кв.м.">{conclusion.totalAreaSqm}</Descriptions.Item>
            )}
            {conclusion.totalAreaHectares && (
              <Descriptions.Item label="Общая площадь, сот.">{conclusion.totalAreaHectares}</Descriptions.Item>
            )}
            {conclusion.objectsCount && (
              <Descriptions.Item label="Количество объектов">{conclusion.objectsCount}</Descriptions.Item>
            )}
            {conclusion.ownershipShare && (
              <Descriptions.Item label="Доля в праве, %">{conclusion.ownershipShare}</Descriptions.Item>
            )}
          </Descriptions>

          {conclusion.landCadastralNumber && (
            <Descriptions title="Земельный участок" bordered column={3} size="small">
              <Descriptions.Item label="Кадастровый номер">{conclusion.landCadastralNumber}</Descriptions.Item>
              <Descriptions.Item label="Категория земель">{conclusion.landCategory || '—'}</Descriptions.Item>
              <Descriptions.Item label="Разрешенный вид использования">
                {conclusion.landPermittedUse || '—'}
              </Descriptions.Item>
              {conclusion.landAreaSqm && (
                <Descriptions.Item label="Площадь, кв.м.">{conclusion.landAreaSqm}</Descriptions.Item>
              )}
            </Descriptions>
          )}

          <Descriptions title="Состояние и описание" bordered column={1} size="small">
            <Descriptions.Item label="Описание имущества">
              <Paragraph>{conclusion.collateralDescription || '—'}</Paragraph>
            </Descriptions.Item>
            {conclusion.collateralCondition && (
              <Descriptions.Item label="Состояние">{conclusion.collateralCondition}</Descriptions.Item>
            )}
            {conclusion.hasReplanning !== null && (
              <Descriptions.Item label="Наличие перепланировок">
                {conclusion.hasReplanning ? 'Да' : 'Нет'}
              </Descriptions.Item>
            )}
            {conclusion.landFunctionalProvision && (
              <Descriptions.Item label="Функциональное обеспечение земельным участком">
                {conclusion.landFunctionalProvision}
              </Descriptions.Item>
            )}
          </Descriptions>

          {conclusion.hasEncumbrances !== null && (
            <Descriptions title="Обременения" bordered column={1} size="small">
              <Descriptions.Item label="Наличие зарегистрированных обременений">
                {conclusion.hasEncumbrances ? 'Да' : 'Нет'}
              </Descriptions.Item>
              {conclusion.encumbrancesDescription && (
                <Descriptions.Item label="Описание обременений">
                  <Paragraph>{conclusion.encumbrancesDescription}</Paragraph>
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Space>
      ),
    });

    // Оценка
    items.push({
      key: 'valuation',
      label: 'Оценка',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions title="Стоимость" bordered column={3} size="small">
            <Descriptions.Item label="Рыночная стоимость">{formatCurrency(conclusion.marketValue)}</Descriptions.Item>
            <Descriptions.Item label="Залоговая стоимость">
              {formatCurrency(conclusion.collateralValue)}
            </Descriptions.Item>
            <Descriptions.Item label="Справедливая стоимость">{formatCurrency(conclusion.fairValue)}</Descriptions.Item>
          </Descriptions>

          <Descriptions title="Характеристики" bordered column={3} size="small">
            <Descriptions.Item label="Категория обеспечения">{conclusion.category || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ликвидность">{conclusion.liquidity || '—'}</Descriptions.Item>
            {conclusion.liquidityFairValue && (
              <Descriptions.Item label="Ликвидность при справедливой стоимости">
                {conclusion.liquidityFairValue}
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

    // Отлагательные условия
    if (conclusion.suspensiveConditions && conclusion.suspensiveConditions.length > 0) {
      items.push({
        key: 'conditions',
        label: 'Отлагательные условия',
        children: (
          <Table
            dataSource={conclusion.suspensiveConditions}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '№', dataIndex: 'number', width: 60 },
              { title: 'Перечень условий', dataIndex: 'description', width: 300 },
              { title: 'Отлагательные условия', dataIndex: 'suspensiveCondition' },
              { title: 'Дополнительные условия', dataIndex: 'additionalCondition' },
            ]}
            size="small"
          />
        ),
      });
    }

    // Детальное описание
    if (conclusion.detailedDescriptions && conclusion.detailedDescriptions.length > 0) {
      items.push({
        key: 'detailed',
        label: 'Описание объектов',
        children: (
          <Table
            dataSource={conclusion.detailedDescriptions}
            rowKey="id"
            pagination={false}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        ),
      });
    }

    // Фото
    if (conclusion.photos && conclusion.photos.length > 0) {
      items.push({
        key: 'photos',
        label: 'Фото',
        children: (
          <Space wrap>
            {conclusion.photos.map(photo => (
              <div key={photo.id} style={{ textAlign: 'center' }}>
                <Image
                  src={photo.url}
                  alt={photo.description}
                  width={200}
                  style={{ marginBottom: 8 }}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBpbWFnZTwvdGV4dD48L3N2Zz4="
                />
                {photo.description && <div>{photo.description}</div>}
              </div>
            ))}
          </Space>
        ),
      });
    }

    // Рецензия
    if (conclusion.review) {
      items.push({
        key: 'review',
        label: 'Рецензия',
        children: (
          <Descriptions bordered column={1} size="small">
            {conclusion.review.reviewer && (
              <Descriptions.Item label="Рецензент">{conclusion.review.reviewer}</Descriptions.Item>
            )}
            {conclusion.review.reviewDate && (
              <Descriptions.Item label="Дата рецензии">{conclusion.review.reviewDate}</Descriptions.Item>
            )}
            {conclusion.review.reviewText && (
              <Descriptions.Item label="Текст рецензии">
                <Paragraph>{conclusion.review.reviewText}</Paragraph>
              </Descriptions.Item>
            )}
            {conclusion.review.conclusion && (
              <Descriptions.Item label="Заключение">
                <Paragraph>{conclusion.review.conclusion}</Paragraph>
              </Descriptions.Item>
            )}
          </Descriptions>
        ),
      });
    }

    // Расчеты
    if (conclusion.calculations && conclusion.calculations.length > 0) {
      const calcItems: TabsProps['items'] = conclusion.calculations.map(calc => ({
        key: calc.id,
        label: calc.type,
        children: (
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
            {JSON.stringify(calc.data, null, 2)}
          </pre>
        ),
      }));

      items.push({
        key: 'calculations',
        label: 'Расчеты',
        children: <Tabs type="card" size="small" items={calcItems} />,
      });
    }

    // Проверка и особое мнение
    items.push({
      key: 'inspection',
      label: 'Проверка и мнение',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions title="Проверка" bordered column={2} size="small">
            {conclusion.inspectionDate && (
              <Descriptions.Item label="Дата осмотра / проверки">{conclusion.inspectionDate}</Descriptions.Item>
            )}
            {conclusion.inspectorName && (
              <Descriptions.Item label="Сотрудник ПР, проводивший проверку">
                {conclusion.inspectorName}
              </Descriptions.Item>
            )}
          </Descriptions>

          {conclusion.specialOpinion && (
            <Descriptions title="Особое мнение" bordered column={1} size="small">
              <Descriptions.Item label="Особое мнение">
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{conclusion.specialOpinion}</Paragraph>
              </Descriptions.Item>
            </Descriptions>
          )}

          {conclusion.conclusionText && (
            <Descriptions title="Текст заключения" bordered column={1} size="small">
              <Descriptions.Item label="Заключение">
                <Paragraph>{conclusion.conclusionText}</Paragraph>
              </Descriptions.Item>
            </Descriptions>
          )}

          {conclusion.recommendations && (
            <Descriptions title="Рекомендации" bordered column={1} size="small">
              <Descriptions.Item label="Рекомендации">
                <Paragraph>{conclusion.recommendations}</Paragraph>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Space>
      ),
    });

    // Согласование
    items.push({
      key: 'approval',
      label: 'Согласование',
      children: (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Автор">{conclusion.author}</Descriptions.Item>
          <Descriptions.Item label="Дата создания">{conclusion.authorDate}</Descriptions.Item>
          {conclusion.approver && (
            <>
              <Descriptions.Item label="Согласующий">{conclusion.approver}</Descriptions.Item>
              {conclusion.approvalDate && (
                <Descriptions.Item label="Дата согласования">{conclusion.approvalDate}</Descriptions.Item>
              )}
            </>
          )}
          {conclusion.notes && (
            <Descriptions.Item label="Примечания" span={2}>
              <Paragraph>{conclusion.notes}</Paragraph>
            </Descriptions.Item>
          )}
        </Descriptions>
      ),
    });

    return items;
  }, [conclusion, formatCurrency]);

  return <Tabs defaultActiveKey="main" size="small" items={tabItems} />;
};

export default CollateralConclusionCard;
