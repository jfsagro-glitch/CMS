import React, { useMemo } from 'react';
import { Tabs, Descriptions, Tag, Typography, Table, Space, Image, Button, Divider, message } from 'antd';
import { EditOutlined, PrinterOutlined, DownloadOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import type { CollateralConclusion } from '@/types/collateralConclusion';
import type { TabsProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { CreditRiskRecord } from '@/types/creditRisk';
import { RISK_EVENTS } from '@/types/creditRisk';
import { getGroupedCollateralAttributes, getAttributeValue } from '@/utils/collateralAttributesConfig';
import dayjs from 'dayjs';

const { Paragraph, Text } = Typography;

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
  const navigate = useNavigate();

  const handleAddToCreditRisk = (condition: any) => {
    try {
      // Загружаем существующие записи
      const stored = localStorage.getItem('creditRiskRecords');
      const existingRecords: CreditRiskRecord[] = stored ? JSON.parse(stored) : [];

      // Создаем новую запись для отлагательного условия
      const newRecord: CreditRiskRecord = {
        id: `risk-${Date.now()}`,
        reference: conclusion.reference || '',
        contractNumber: conclusion.contractNumber || undefined,
        pledger: conclusion.pledger || '',
        pledgerInn: conclusion.pledgerInn || undefined,
        borrower: conclusion.borrower || undefined,
        borrowerInn: conclusion.borrowerInn || undefined,
        riskEvent: RISK_EVENTS[0], // По умолчанию первое событие, можно будет изменить
        suspensiveConditionId: condition.id,
        suspensiveConditionDescription: condition.description,
        insuranceRelated: false,
        status: 'active',
        eventDate: dayjs().format('YYYY-MM-DD'),
        detectionDate: dayjs().format('YYYY-MM-DD'),
        priority: 'medium',
        documents: [],
        createdAt: dayjs().format('YYYY-MM-DD'),
        updatedAt: dayjs().format('YYYY-MM-DD'),
      };

      // Сохраняем
      existingRecords.push(newRecord);
      localStorage.setItem('creditRiskRecords', JSON.stringify(existingRecords));

      message.success('Отлагательное условие добавлено в модуль ФКР');
      
      // Переходим в модуль ФКР
      setTimeout(() => {
        navigate('/credit-risk');
      }, 500);
    } catch (error) {
      console.error('Ошибка добавления в ФКР:', error);
      message.error('Ошибка добавления в модуль ФКР');
    }
  };
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

    // 1. Залоговое заключение (основная вкладка)
    items.push({
      key: 'conclusion',
      label: 'Залоговое заключение',
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

          <Divider orientation="left" style={{ margin: '8px 0' }}>Согласование</Divider>
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
        </Space>
      ),
    });

    // 2. Характеристики
    const collateralType = conclusion.collateralType;
    const groupedAttributes = getGroupedCollateralAttributes(collateralType || undefined);
    
    // Собираем все характеристики из заключения
    const allCharacteristics: Record<string, any> = {
      ...(conclusion.additionalData || {}),
      // Добавляем основные поля, если они есть
      marketValue: conclusion.marketValue,
      collateralValue: conclusion.collateralValue,
      fairValue: conclusion.fairValue,
      totalAreaSqm: conclusion.totalAreaSqm,
      totalAreaHectares: conclusion.totalAreaHectares,
      landAreaSqm: conclusion.landAreaSqm,
      landAreaHectares: conclusion.landAreaHectares,
      category: conclusion.category,
      liquidity: conclusion.liquidity,
      collateralCondition: conclusion.collateralCondition,
      ownershipShare: conclusion.ownershipShare,
      hasEncumbrances: conclusion.hasEncumbrances,
      encumbrancesDescription: conclusion.encumbrancesDescription,
      hasReplanning: conclusion.hasReplanning,
      landCategory: conclusion.landCategory,
      landPermittedUse: conclusion.landPermittedUse,
      landCadastralNumber: conclusion.landCadastralNumber,
      cadastralValue: conclusion.cadastralValue,
      marketValuePerSqm: conclusion.marketValuePerSqm,
      marketValuePerHectare: conclusion.marketValuePerHectare,
    };
    
    // Проверяем наличие хотя бы одной характеристики
    const hasCharacteristics = Object.values(allCharacteristics).some(
      value => value !== null && value !== undefined && value !== ''
    );

    const formatAttributeValue = (attr: any, value: any): string => {
      if (value === null || value === undefined || value === '') return '—';
      
      if (attr.type === 'boolean') {
        return value ? 'Да' : 'Нет';
      }
      
      if (attr.type === 'number' && attr.unit) {
        return `${value} ${attr.unit}`;
      }
      
      if (attr.type === 'number') {
        return String(value);
      }
      
      return String(value);
    };

    items.push({
      key: 'characteristics',
      label: 'Характеристики',
      children: (() => {
        const groups = Object.keys(groupedAttributes);
        
        if (groups.length === 0 || !hasCharacteristics) {
          return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Характеристики не указаны</div>;
        }

        return (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {groups.map(group => {
              const attributes = groupedAttributes[group];
              const items: any[] = [];
              
              attributes.forEach(attr => {
                const value = getAttributeValue(allCharacteristics, attr.key);
                if (value !== null && value !== undefined && value !== '') {
                  items.push({
                    label: attr.label,
                    children: formatAttributeValue(attr, value),
                  });
                }
              });
              
              if (items.length === 0) return null;
              
              return (
                <div key={group}>
                  <Divider orientation="left" style={{ margin: '8px 0' }}>{group}</Divider>
                  <Descriptions bordered column={2} size="small" items={items} />
                </div>
              );
            })}
          </Space>
        );
      })(),
    });

    // 3. Отлагательные условия
    if (conclusion.suspensiveConditions && conclusion.suspensiveConditions.length > 0) {
      items.push({
        key: 'suspensive',
        label: 'отлагательные',
        children: (
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
              {
                title: 'Действия',
                key: 'actions',
                width: 150,
                align: 'center',
                render: (_, record) => (
                  <Button
                    type="link"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddToCreditRisk(record)}
                    size="small"
                  >
                    Добавить в модуль ФКР
                  </Button>
                ),
              },
            ]}
          />
        ),
      });
    } else {
      // Всегда показываем вкладку, даже если нет данных
      items.push({
        key: 'suspensive',
        label: 'отлагательные',
        children: <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет отлагательных условий</div>,
      });
    }

    // 4. Описание
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
        label: 'Описание',
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
    } else {
      items.push({
        key: 'detailed',
        label: 'Описание',
        children: <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет описания объектов</div>,
      });
    }

    // 5. Фото
    if (conclusion.photos && conclusion.photos.length > 0) {
      items.push({
        key: 'photos',
        label: 'Фото',
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
    } else {
      items.push({
        key: 'photos',
        label: 'Фото',
        children: <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет фотографий</div>,
      });
    }

    // 6. Аналоги (для расчетов)
    if (conclusion.calculations && conclusion.calculations.length > 0) {
      // Извлекаем аналоги из расчетов
      const analogsData: any[] = [];
      conclusion.calculations.forEach(calc => {
        if (calc.data && calc.data.analogs && Array.isArray(calc.data.analogs)) {
          calc.data.analogs.forEach((analog: any, idx: number) => {
            analogsData.push({
              id: `analog-${calc.id}-${idx}`,
              number: analog.number || idx + 1,
              address: analog.address || '—',
              description: analog.description || '—',
              price: analog.price || '—',
              area: analog.area || '—',
              type: calc.type,
            });
          });
        }
      });

      if (analogsData.length > 0) {
        items.push({
          key: 'analogs',
          label: 'Аналоги',
          children: (
            <Table
              dataSource={analogsData}
              rowKey="id"
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
                  render: (val) => typeof val === 'number' ? formatCurrency(val) : val
                },
                { 
                  title: 'Площадь, кв.м.', 
                  dataIndex: 'area', 
                  key: 'area',
                  align: 'right'
                },
                { title: 'Тип расчета', dataIndex: 'type', key: 'type' },
              ]}
            />
          ),
        });
      } else {
        items.push({
          key: 'analogs',
          label: 'Аналоги',
          children: <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных об аналогах</div>,
        });
      }
    } else {
      items.push({
        key: 'analogs',
        label: 'Аналоги',
        children: <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет данных об аналогах</div>,
      });
    }

    // 7. Расчеты
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
        label: 'расчеты',
        children: <Tabs items={calcItems} size="small" />,
      });
    } else {
      items.push({
        key: 'calculations',
        label: 'расчеты',
        children: <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Нет расчетов</div>,
      });
    }

    // 8. Рецензия
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
    } else {
      items.push({
        key: 'review',
        label: 'Рецензия',
        children: <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Рецензия не проведена</div>,
      });
    }

    // 8. Для договора (приложение к договору залога)
    items.push({
      key: 'contract',
      label: 'для договора',
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Приложение к договору залога">
              <Paragraph>
                Настоящее заключение является приложением к договору залога и содержит полную информацию 
                о предмете залога, его оценке и условиях принятия в залог.
              </Paragraph>
            </Descriptions.Item>
            {conclusion.conclusionNumber && (
              <Descriptions.Item label="Номер заключения">{conclusion.conclusionNumber}</Descriptions.Item>
            )}
            {conclusion.conclusionDate && (
              <Descriptions.Item label="Дата заключения">{conclusion.conclusionDate}</Descriptions.Item>
            )}
            {conclusion.contractNumber && (
              <Descriptions.Item label="Номер договора залога">{conclusion.contractNumber}</Descriptions.Item>
            )}
            {conclusion.collateralType && (
              <Descriptions.Item label="Тип залога">{conclusion.collateralType}</Descriptions.Item>
            )}
            {conclusion.marketValue && (
              <Descriptions.Item label="Рыночная стоимость">{formatCurrency(conclusion.marketValue)}</Descriptions.Item>
            )}
            {conclusion.collateralValue && (
              <Descriptions.Item label="Залоговая стоимость">{formatCurrency(conclusion.collateralValue)}</Descriptions.Item>
            )}
            {conclusion.specialOpinion && (
              <Descriptions.Item label="Особое мнение">
                <Paragraph style={{ margin: 0 }}>{conclusion.specialOpinion}</Paragraph>
              </Descriptions.Item>
            )}
            {conclusion.recommendations && (
              <Descriptions.Item label="Рекомендации">
                <Paragraph style={{ margin: 0 }}>{conclusion.recommendations}</Paragraph>
              </Descriptions.Item>
            )}
            {conclusion.conclusionText && (
              <Descriptions.Item label="Текст заключения">
                <Paragraph style={{ margin: 0 }}>{conclusion.conclusionText}</Paragraph>
              </Descriptions.Item>
            )}
          </Descriptions>
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
        defaultActiveKey="conclusion"
        size="small"
        type="card"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default CollateralConclusionCard;
