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

    // 1. Залоговое заключение (основная вкладка со всей информацией)
    items.push({
      key: 'main',
      label: 'Залоговое заключение',
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Основная информация */}
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

          {/* Кредитный продукт */}
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

          {/* Имущество */}
          <Divider orientation="left" style={{ margin: '8px 0' }}>Имущество, предлагаемое в залог</Divider>
          <Descriptions bordered column={3} size="small">
            <Descriptions.Item label="Тип залога">{conclusion.collateralType || '—'}</Descriptions.Item>
            <Descriptions.Item label="Наименование, назначение" span={2}>{conclusion.collateralName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Местоположение" span={3}>{conclusion.collateralLocation || '—'}</Descriptions.Item>
            {conclusion.totalAreaSqm && (
              <Descriptions.Item label="общая площадь, кв.м.">{conclusion.totalAreaSqm}</Descriptions.Item>
            )}
            {conclusion.totalAreaHectares && (
              <Descriptions.Item label="общая площадь, сот.">{conclusion.totalAreaHectares}</Descriptions.Item>
            )}
            {conclusion.objectsCount && (
              <Descriptions.Item label="кол-во объектов">{conclusion.objectsCount}</Descriptions.Item>
            )}
            {conclusion.ownershipShare && (
              <Descriptions.Item label="оцениваемые права, доля в праве %">{conclusion.ownershipShare}</Descriptions.Item>
            )}
            {conclusion.marketValue && (
              <Descriptions.Item label="рыночная стоимость">{formatCurrency(conclusion.marketValue)}</Descriptions.Item>
            )}
            {conclusion.collateralValue && (
              <Descriptions.Item label="залоговая стоимость">{formatCurrency(conclusion.collateralValue)}</Descriptions.Item>
            )}
          </Descriptions>

          {/* Земельный участок */}
          {conclusion.landCadastralNumber && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Наименование, категория земель и разрешенный вид использования</Divider>
              <Descriptions bordered column={3} size="small">
                <Descriptions.Item label="Кадастровый номер">{conclusion.landCadastralNumber}</Descriptions.Item>
                <Descriptions.Item label="Категория">{conclusion.landCategory || '—'}</Descriptions.Item>
                <Descriptions.Item label="Разрешенное использование">{conclusion.landPermittedUse || '—'}</Descriptions.Item>
                {conclusion.landAreaSqm && (
                  <Descriptions.Item label="общая площадь, кв.м.">{conclusion.landAreaSqm}</Descriptions.Item>
                )}
                {conclusion.landAreaHectares && (
                  <Descriptions.Item label="общая площадь, сот.">{conclusion.landAreaHectares}</Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}

          {/* Состояние и описание */}
          <Divider orientation="left" style={{ margin: '8px 0' }}>Состояние и краткое описание имущества, предлагаемого в залог</Divider>
          <Descriptions bordered column={1} size="small">
            {conclusion.collateralDescription && (
              <Descriptions.Item label="Описание">
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

          {/* Обременения */}
          {conclusion.hasEncumbrances !== null && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Наличие зарегистрированных обременений</Divider>
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

          {/* Проверка на банкротство */}
          {(conclusion.bankruptcyCheckDate || conclusion.bankruptcyCheckResult) && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Информация о наличии / отсутствии признаков банкротства</Divider>
              <Descriptions bordered column={2} size="small">
                {conclusion.bankruptcyCheckDate && (
                  <Descriptions.Item label="Дата проведения проверки">{conclusion.bankruptcyCheckDate}</Descriptions.Item>
                )}
                {conclusion.inspectorName && (
                  <Descriptions.Item label="Сотрудник ПР, проводивший проверку">{conclusion.inspectorName}</Descriptions.Item>
                )}
                {conclusion.bankruptcyCheckResult && (
                  <Descriptions.Item label="Результат" span={2}>{conclusion.bankruptcyCheckResult}</Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}

          {/* Оценка */}
          <Divider orientation="left" style={{ margin: '8px 0' }}>Оценка</Divider>
          <Descriptions bordered column={3} size="small">
            <Descriptions.Item label="Рыночная стоимость, руб">{formatCurrency(conclusion.marketValue)}</Descriptions.Item>
            <Descriptions.Item label="Залоговая стоимость, руб">{formatCurrency(conclusion.collateralValue)}</Descriptions.Item>
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

          {/* Характеристики */}
          <Divider orientation="left" style={{ margin: '8px 0' }}>Характеристики</Divider>
          <Descriptions bordered column={3} size="small">
            <Descriptions.Item label="Категория обеспечения">{conclusion.category || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ликвидность недвижимого имущества">{conclusion.liquidity || '—'}</Descriptions.Item>
            {conclusion.liquidityFairValue && (
              <Descriptions.Item label="Ликвидность недвижимого имущества (при справедливой стоимости)">
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

          {/* Особое мнение */}
          {conclusion.specialOpinion && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Особое мнение</Divider>
              <Paragraph>{conclusion.specialOpinion}</Paragraph>
            </>
          )}

          {/* Права на объект */}
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
                  <Descriptions.Item label="Документы-основания возникновения права собственности">
                    <Paragraph style={{ margin: 0 }}>{conclusion.ownershipDocuments}</Paragraph>
                  </Descriptions.Item>
                )}
                {conclusion.registrationRecord && (
                  <Descriptions.Item label="Запись регистрации в ЕГРН (дата, №)">{conclusion.registrationRecord}</Descriptions.Item>
                )}
                {conclusion.registrationDocument && (
                  <Descriptions.Item label="Правоподтверждающий документ">
                    <Paragraph style={{ margin: 0 }}>{conclusion.registrationDocument}</Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}

          {/* Проверка */}
          {conclusion.inspectionDate && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Проверка</Divider>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Дата осмотра">{conclusion.inspectionDate}</Descriptions.Item>
                {conclusion.inspectorName && (
                  <Descriptions.Item label="Сотрудник проводивший осмотр">{conclusion.inspectorName}</Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}
        </Space>
      ),
    });

    // 2. Отлагательные условия
    items.push({
      key: 'suspensive',
      label: 'отлагательные',
      children: (
          <div>
            {conclusion.suspensiveConditions && conclusion.suspensiveConditions.length > 0 ? (
              <Table
                dataSource={conclusion.suspensiveConditions}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: '№', dataIndex: 'number', width: 60, align: 'center' },
                  { title: 'Перечень отлагательных и дополнительных условий', dataIndex: 'description', key: 'description' },
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
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                Отлагательные условия не указаны
              </div>
            )}
          </div>
        ),
      });

    // 3. Описание
    items.push({
      key: 'detailed',
      label: 'Описание',
      children: (() => {
        if (conclusion.detailedDescriptions && conclusion.detailedDescriptions.length > 0) {
          const firstObj = conclusion.detailedDescriptions[0];
          const columns = Object.keys(firstObj)
            .filter(key => key !== 'id' && firstObj[key] !== null && firstObj[key] !== undefined)
            .slice(0, 15)
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

          return (
            <Table
              dataSource={conclusion.detailedDescriptions}
              rowKey="id"
              columns={columns}
              pagination={false}
              scroll={{ x: 'max-content' }}
              size="small"
            />
          );
        }
        return (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            Описание объектов отсутствует
          </div>
        );
      })(),
    });

    // 4. Фото
    items.push({
      key: 'photos',
      label: 'Фото',

      children: (
        <div>
          {conclusion.photos && conclusion.photos.length > 0 ? (
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
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Фотографии отсутствуют
            </div>
          )}
        </div>
      ),
    });

    // 5. Аналоги
    items.push({
      key: 'analogs',
      label: 'Аналоги',
      children: (
        <div>
          {conclusion.calculations && conclusion.calculations.some(calc => 
            calc.data && calc.data.analogs && Array.isArray(calc.data.analogs)
          ) ? (
            <div>
              {conclusion.calculations
                .filter(calc => calc.data && calc.data.analogs && Array.isArray(calc.data.analogs))
                .map(calc => (
                  <div key={calc.id} style={{ marginBottom: '24px' }}>
                    <Title level={5}>{calc.type}</Title>
                    <Table
                      dataSource={calc.data.analogs}
                      rowKey={(_, index) => `analog-${index}`}
                      pagination={false}
                      size="small"
                      columns={[
                        { title: '№', dataIndex: 'number', width: 60, align: 'center' },
                        { title: 'Адрес', dataIndex: 'address', key: 'address' },
                        { title: 'Краткое описание', dataIndex: 'description', key: 'description' },
                        { 
                          title: 'Цена предложения, руб.', 
                          dataIndex: 'price', 
                          key: 'price',
                          align: 'right',
                          render: (val) => formatCurrency(val)
                        },
                        { 
                          title: 'Площадь, кв.м.', 
                          dataIndex: 'area', 
                          key: 'area',
                          align: 'right'
                        },
                      ]}
                    />
                  </div>
                ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Аналоги отсутствуют
            </div>
          )}
        </div>
      ),
    });

    // 6. расчеты
    items.push({
      key: 'calculations',
      label: 'расчеты',
      children: (
        <div>
          {conclusion.calculations && conclusion.calculations.length > 0 ? (
            <div>
              {conclusion.calculations
                .filter(calc => !calc.data.analogs || !Array.isArray(calc.data.analogs)) // Исключаем расчеты с аналогами (они в отдельной вкладке)
                .map(calc => (
                  <div key={calc.id} style={{ marginBottom: '24px' }}>
                    <Title level={5}>{calc.type}</Title>
                    <Descriptions bordered column={2} size="small">
                      {Object.entries(calc.data)
                        .filter(([key]) => key !== 'analogs')
                        .map(([key, value]) => (
                          <Descriptions.Item key={key} label={key}>
                            {typeof value === 'object' && value !== null ? (
                              <pre style={{ margin: 0, fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              String(value)
                            )}
                          </Descriptions.Item>
                        ))}
                    </Descriptions>
                  </div>
                ))}
              {conclusion.calculations.filter(calc => !calc.data.analogs || !Array.isArray(calc.data.analogs)).length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  Расчеты отсутствуют
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Расчеты отсутствуют
            </div>
          )}
        </div>
      ),
    });

    // 7. Рецензия
    items.push({
      key: 'review',
      label: 'Рецензия',
      children: (
        <div>
          {conclusion.review ? (
            <Descriptions bordered column={1} size="small">
              {conclusion.review.reviewer && (
                <Descriptions.Item label="Сотрудник составляющий рецензию">{conclusion.review.reviewer}</Descriptions.Item>
              )}
              {conclusion.review.reviewerPosition && (
                <Descriptions.Item label="Должность">{conclusion.review.reviewerPosition}</Descriptions.Item>
              )}
              {conclusion.review.reviewDate && (
                <Descriptions.Item label="Дата составления рецензии">{conclusion.review.reviewDate}</Descriptions.Item>
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
              {conclusion.review.reportCompliance && (
                <Descriptions.Item label="Соответствие отчета требованиям">
                  <Paragraph style={{ margin: 0 }}>{conclusion.review.reportCompliance}</Paragraph>
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Рецензия отсутствует
            </div>
          )}
        </div>
      ),
    });

    // 8. для договора
    items.push({
      key: 'for-contract',
      label: 'для договора',

      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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

          {conclusion.specialOpinion && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Особое мнение</Divider>
              <Paragraph>{conclusion.specialOpinion}</Paragraph>
            </>
          )}
          {conclusion.recommendations && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Рекомендации</Divider>
              <Paragraph>{conclusion.recommendations}</Paragraph>
            </>
          )}
          {conclusion.conclusionText && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Текст заключения</Divider>
              <Paragraph>{conclusion.conclusionText}</Paragraph>
            </>
          )}
          {conclusion.notes && (
            <>
              <Divider orientation="left" style={{ margin: '8px 0' }}>Примечания</Divider>
              <Paragraph>{conclusion.notes}</Paragraph>
            </>
          )}
        </Space>
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
        tabBarStyle={{ 
          marginBottom: '16px',
          borderBottom: '1px solid #f0f0f0'
        }}
      />
    </div>
  );
};

export default CollateralConclusionCard;
