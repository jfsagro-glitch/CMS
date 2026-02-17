import React, { useState } from 'react';
import { Result, Button, Card, Row, Col, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  DatabaseOutlined,
  FilePdfOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
} from '@ant-design/icons';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Если это страница настроек, показываем ссылки на подразделы
  const isSettingsPage =
    location.pathname === '/cms/settings' ||
    location.pathname === '#/cms/settings' ||
    location.hash === '#/cms/settings';

  const getSystemDescriptionMarkdown = (): string => {
    return `# ОПИСАНИЕ ФУНКЦИОНАЛА CMS - СИСТЕМА УПРАВЛЕНИЯ ЗАЛОГОВЫМ ИМУЩЕСТВОМ

**Версия:** 2.0.0  
**Дата:** Декабрь 2024  
**Технологии:** React 18, TypeScript, Ant Design 5, Redux Toolkit, IndexedDB

---

## 📋 ОГЛАВЛЕНИЕ

1. Реестр объектов
2. Залоговый портфель
3. Задачи
4. KPI
5. Отчеты
6. Залоговое досье
7. Залоговые заключения
8. Страхование
9. ФНП
10. Аналитика
11. Модуль мониторинга
12. Модуль оценки
13. CMS Check
14. ЕГРН
15. Загрузка
16. Мониторинг
17. Справочная с ИИ
18. Настройки

---

## 1. РЕЕСТР ОБЪЕКТОВ

**Путь:** /cms/registry

### Основной функционал:
- **Управление карточками залогового имущества** - полный CRUD (создание, чтение, обновление, удаление)
- **Расширенная классификация объектов** - 60+ типов объектов с 3-уровневой иерархией
- **Динамические формы** - 150+ полей характеристик, автоматически подстраивающихся под тип объекта
- **Многостраничная форма карточки** (5 вкладок): Основная информация, Адрес, Характеристики, Партнеры, Документы
- **Фильтрация и поиск** - по всем полям карточки
- **Сортировка** - по любому столбцу таблицы
- **Экспорт/импорт** - Excel формат для массовых операций
- **Резервное копирование** - экспорт/импорт всей базы данных

---

## 2. ЗАЛОГОВЫЙ ПОРТФЕЛЬ

**Путь:** /cms/portfolio

### Основной функционал:
- **Агрегированное представление залогового портфеля**
- **Аналитика портфеля** - статистика по категориям, статусам, стоимости
- **Фильтрация и группировка** объектов залога
- **Визуализация данных** - графики и диаграммы портфеля
- **Оценка рисков** портфеля

---

## 3. ЗАДАЧИ

**Путь:** /cms/tasks

### Основной функционал:
- **Управление задачами** (Zadachnik) - система задач для сотрудников
- **Создание задач** - назначение задач сотрудникам с приоритетами и сроками
- **Статусы задач** - планируется, в работе, выполнено, отменено
- **Приоритеты** - низкий, средний, высокий, критический
- **Назначение исполнителей** - привязка задач к сотрудникам
- **Фильтрация задач** - по статусу, приоритету, исполнителю, региону
- **Автогенерация задач** - автоматическое создание задач для активных сотрудников

---

## 4. KPI

**Путь:** /cms/kpi

### Основной функционал:
- **KPI и аналитика** - ключевые показатели эффективности
- **Метрики производительности** - отслеживание показателей работы
- **Дашборд KPI** - визуализация ключевых метрик
- **Сравнительная аналитика** - сравнение показателей по периодам

---

## 5. ОТЧЕТЫ

**Путь:** /cms/reports

### Основной функционал:
- **Агрегирование отчетности** - формирование различных отчетов
- **Типы отчетов**: Отчеты по реестру объектов, портфелю, задачам, оценкам
- **Экспорт отчетов** - в Excel, PDF форматы
- **Настраиваемые параметры** - выбор периодов, фильтров, группировок

---

## 6. ЗАЛОГОВОЕ ДОСЬЕ

**Путь:** /cms/collateral-dossier

### Основной функционал:
- **Формирование залогового досье** - комплексная информация об объекте залога
- **Сбор документов** - все документы по объекту в одном месте
- **История изменений** - отслеживание всех изменений карточки
- **Связанные объекты** - связи между объектами залога
- **Экспорт досье** - формирование PDF досье для печати

---

## 7. ЗАЛОГОВЫЕ ЗАКЛЮЧЕНИЯ

**Путь:** /cms/collateral-conclusions

### Основной функционал:
- **Создание залоговых заключений** - формирование экспертных заключений
- **Шаблоны заключений** - использование готовых шаблонов
- **Редактирование заключений** - создание и редактирование текста заключений
- **Привязка к объектам** - связь заключений с карточками залога
- **Экспорт заключений** - сохранение в PDF, Word форматах

---

## 8. СТРАХОВАНИЕ

**Путь:** /cms/insurance

### Основной функционал:
- **Управление страховыми полисами** - учет страховых полисов по объектам залога
- **Сроки действия полисов** - отслеживание сроков страхования
- **Уведомления о продлении** - напоминания о необходимости продления
- **Страховые компании** - справочник страховщиков
- **Суммы страхования** - учет страховых сумм и премий

---

## 9. ФНП

**Путь:** /cms/fnp

### Основной функционал:
- **Регистрация залога движимого имущества ФНП** - работа с Федеральной нотариальной палатой
- **Подача заявлений** - формирование заявлений на регистрацию залога
- **Отслеживание статусов** - мониторинг статусов регистрации
- **Документооборот** - управление документами для ФНП

---

## 10. АНАЛИТИКА

**Путь:** /cms/analytics

### Основной функционал:
- **Расширенная аналитика** - углубленный анализ данных
- **Визуализация данных** - графики, диаграммы, дашборды
- **Анализ трендов** - выявление тенденций в портфеле
- **Прогнозирование** - прогнозные модели на основе исторических данных
- **Сравнительный анализ** - сравнение показателей по различным параметрам

---

## 11. МОДУЛЬ МОНИТОРИНГА

**Путь:** /cms/credit-risk

### Основной функционал:
- **Мониторинг кредитных рисков** - отслеживание рисков по залоговому имуществу
- **Оценка рисков** - автоматическая и ручная оценка рисков
- **Алерты и уведомления** - оповещения о критических ситуациях
- **Рейтинг рисков** - классификация объектов по уровню риска
- **Отчеты по рискам** - формирование отчетов о рисках портфеля

---

## 12. МОДУЛЬ ОЦЕНКИ

**Путь:** /cms/appraisal

### Основной функционал:
- **Автоматическая оценка объектов залога** - расчет стоимости объектов
- **Методы оценки**: Доходный подход (DCF, прямая капитализация, множитель валового дохода), Сравнительный подход (сравнение продаж, извлечение из рынка), Затратный подход (стоимость замещения, воспроизводства, износ)
- **Расчет LTV** - соотношение суммы займа к стоимости залога
- **Залоговая стоимость** - расчет залоговой стоимости с учетом дисконтов
- **История оценок** - сохранение истории всех оценок объекта
- **Экспорт отчетов об оценке** - формирование PDF отчетов

---

## 13. CMS CHECK

**Путь:** /cms/cms-check

### Основной функционал:
- **Система дистанционных осмотров** - проведение осмотров объектов залога
- **Мобильный интерфейс** - доступ к осмотрам через мобильные устройства
- **Фотофиксация** - загрузка фотографий объекта
- **Чек-листы осмотра** - структурированные формы для осмотра
- **Геолокация** - привязка осмотра к координатам
- **Подпись инспектора** - электронная подпись результатов осмотра
- **Отчеты об осмотре** - автоматическое формирование отчетов

---

## 14. ЕГРН

**Путь:** /cms/egrn

### Основной функционал:
- **Регистрация ипотеки** - работа с Единым государственным реестром недвижимости
- **Снятие обременений** - оформление снятия обременений с недвижимости
- **Выписки ЕГРН** - запрос и получение выписок из ЕГРН
- **Отслеживание статусов** - мониторинг статусов регистрационных действий
- **Документооборот** - управление документами для регистрации

---

## 15. ЗАГРУЗКА

**Путь:** /cms/upload

### Основной функционал:
- **Миграция данных** - перенос данных из других систем
- **Экспорт данных** - выгрузка данных в Excel для миграции
- **Импорт данных** - загрузка данных из Excel файлов
- **Массовые изменения** - массовое редактирование записей через Excel
- **Валидация данных** - проверка корректности импортируемых данных
- **Отчеты об импорте** - статистика по результатам импорта

---

## 16. МОНИТОРИНГ

**Путь:** /cms/monitoring

### Основной функционал:
- **Мониторинг системы** - отслеживание состояния системы
- **Мониторинг объектов** - контроль состояния объектов залога
- **Настройки мониторинга** - конфигурация параметров мониторинга
- **Уведомления** - система оповещений о событиях
- **Логирование** - журнал событий и действий в системе

---

## 17. СПРАВОЧНАЯ С ИИ

**Путь:** /cms/reference

### Основной функционал:
- **AI-помощник** - интеллектуальный помощник на базе DeepSeek AI
- **База знаний** - справочная литература по банковским залогам ("Залоговik")
- **Поиск по базе знаний** - семантический поиск по документам
- **Чат с ИИ** - диалоговый интерфейс для получения консультаций
- **Режим оценки** - AI-оценка объектов залога с использованием профессиональных методов
- **Эквалайзер скилов** - настройка приоритетов методов оценки
- **Режим экспертизы** - настройка уровня экспертизы, анализа, краткости ответов
- **Самообучение ИИ** - система обратной связи (лайк/дизлайк) для улучшения ответов
- **Режим обучения** - интенсивное самообучение системы на базе документов
- **Эволюция ИИ** - система уровней и опыта ИИ-помощника
- **Экспорт PDF отчетов** - генерация подробных отчетов об оценке с расчетами
- **История чатов** - сохранение истории диалогов с ИИ

---

## 18. НАСТРОЙКИ

**Путь:** /cms/settings

### Подразделы:

#### 18.1. Сотрудники
- **Управление сотрудниками** - добавление, редактирование, деактивация сотрудников
- **Роли и права доступа** - назначение ролей и прав сотрудникам
- **Синхронизация с задачами** - автоматическая синхронизация с системой задач

#### 18.2. Справочные данные
- **Управление справочниками** - редактирование классификаторов и справочников
- **Категории объектов** - управление категориями залогового имущества
- **Типы объектов** - настройка типов объектов и их характеристик

#### 18.3. Норма-часы
- **Нормативы времени** - установка нормативов времени на выполнение задач
- **Расчет трудозатрат** - автоматический расчет трудозатрат на основе нормативов

#### 18.4. Метрики
- **Настройка метрик** - конфигурация метрик для KPI и аналитики
- **Пороговые значения** - установка пороговых значений для метрик

---

## 🔧 ТЕХНИЧЕСКИЕ ОСОБЕННОСТИ

### Хранение данных:
- **IndexedDB** - основное хранилище данных в браузере
- **LocalStorage** - хранение настроек и кэша
- **Автоматическое резервное копирование** - экспорт/импорт базы данных

### Производительность:
- **Оптимизация рендеринга** - мемоизация компонентов, виртуализация списков
- **Ленивая загрузка** - загрузка данных по требованию
- **Кэширование** - кэширование результатов поиска и запросов

### Безопасность:
- **Валидация данных** - проверка всех входящих данных
- **Обработка ошибок** - graceful error handling
- **Логирование** - журналирование критических операций

### Интерфейс:
- **Адаптивный дизайн** - поддержка различных размеров экранов
- **Темная/светлая тема** - переключение тем оформления
- **Локализация** - русский язык интерфейса

---

## 📊 СТАТИСТИКА СИСТЕМЫ

- **Модулей:** 18 основных разделов
- **Типов объектов:** 60+
- **Полей характеристик:** 150+
- **Уровней классификации:** 3
- **Методов оценки:** 8 (доходный, сравнительный, затратный подходы)
- **Форматов экспорта:** Excel, PDF, JSON

---

**Дата создания документа:** Декабрь 2024  
**Версия CMS:** 2.0.0`;
  };

  const handleDownloadPdf = async () => {
    try {
      setLoading(true);
      message.info('Генерация PDF описания системы...');

      // Пытаемся загрузить файл, если не получается - используем встроенное содержимое
      let markdownText = '';
      try {
        const response = await fetch('/INSTRUCTION/CMS_FUNCTIONALITY.md');
        if (response.ok) {
          markdownText = await response.text();
        } else {
          throw new Error('Файл не найден, используем встроенное содержимое');
        }
      } catch (error) {
        // Используем встроенное содержимое описания
        markdownText = getSystemDescriptionMarkdown();
      }

      // Преобразуем Markdown в HTML
      const html = convertMarkdownToHtml(markdownText);

      // Создаем временный контейнер для рендеринга PDF
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.minHeight = '100px';
      container.style.padding = '20px';
      container.style.backgroundColor = '#ffffff';
      container.style.color = '#000000';
      container.style.fontFamily =
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      container.style.fontSize = '12px';
      container.style.lineHeight = '1.6';
      container.style.boxSizing = 'border-box';
      container.style.visibility = 'visible';
      container.style.opacity = '1';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '999999';
      container.style.overflow = 'visible';
      container.innerHTML = html;
      document.body.appendChild(container);

      // Ждем рендеринга
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 500));

      // Принудительный reflow
      void container.offsetHeight;
      const containerHeight = container.scrollHeight || 1000;

      if (containerHeight < 50) {
        document.body.removeChild(container);
        throw new Error('Контейнер PDF пуст или не отрендерился');
      }

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: containerHeight,
        windowWidth: 800,
        windowHeight: containerHeight,
      } as any);

      document.body.removeChild(container);

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas пуст');
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;

      const yPosition = margin;
      const imgWidth = maxWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Разбиваем на страницы, если изображение не помещается
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      const ts = new Date().toISOString().slice(0, 10);
      pdf.save(`Описание_системы_CMS_${ts}.pdf`);
      message.success('PDF описание системы успешно выгружено');
    } catch (error: any) {
      console.error('Ошибка генерации PDF:', error);
      message.error(`Ошибка генерации PDF: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const convertMarkdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Заголовки
    html = html.replace(
      /^### (.*$)/gim,
      '<h3 style="margin: 16px 0 8px 0; font-size: 16px; font-weight: 600; color: #1890ff;">$1</h3>'
    );
    html = html.replace(
      /^## (.*$)/gim,
      '<h2 style="margin: 20px 0 12px 0; font-size: 20px; font-weight: 700; color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 4px;">$1</h2>'
    );
    html = html.replace(
      /^# (.*$)/gim,
      '<h1 style="margin: 24px 0 16px 0; font-size: 24px; font-weight: 700; color: #1890ff;">$1</h1>'
    );

    // Жирный текст
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong style="font-weight: 600;">$1</strong>');

    // Списки
    html = html.replace(/^- (.*$)/gim, '<li style="margin: 4px 0; padding-left: 8px;">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul style="margin: 8px 0; padding-left: 24px;">$1</ul>');

    // Разделители
    html = html.replace(
      /^---$/gim,
      '<hr style="margin: 16px 0; border: none; border-top: 1px solid #e8e8e8;" />'
    );

    // Параграфы
    html = html
      .split('\n\n')
      .map(para => {
        if (para.trim() && !para.match(/^<[h|u|o|l|d]/)) {
          return `<p style="margin: 8px 0; text-align: justify;">${para.trim()}</p>`;
        }
        return para;
      })
      .join('\n');

    // Код
    html = html.replace(
      /`(.*?)`/gim,
      '<code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace;">$1</code>'
    );

    // Ссылки
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/gim,
      '<a href="$2" style="color: #1890ff; text-decoration: none;">$1</a>'
    );

    return `<div style="max-width: 800px; margin: 0 auto;">${html}</div>`;
  };

  if (isSettingsPage) {
    return (
      <div style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h1 style={{ margin: 0 }}>Настройки</h1>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            loading={loading}
            onClick={handleDownloadPdf}
            size="large"
          >
            Выгрузить Описание системы
          </Button>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/cms/settings/employees')}
            >
              <div style={{ textAlign: 'center' }}>
                <UserOutlined
                  style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }}
                />
                <h3>Управление сотрудниками</h3>
                <p style={{ color: '#8c8c8c' }}>
                  Добавление и редактирование сотрудников, их ролей и прав доступа
                </p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/cms/settings/reference-data')}
            >
              <div style={{ textAlign: 'center' }}>
                <DatabaseOutlined
                  style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }}
                />
                <h3>Справочники</h3>
                <p style={{ color: '#8c8c8c' }}>Управление всеми справочниками системы</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/cms/settings/norm-hours')}
            >
              <div style={{ textAlign: 'center' }}>
                <ClockCircleOutlined
                  style={{ fontSize: '48px', color: '#fa8c16', marginBottom: '16px' }}
                />
                <h3>Нормочасы по функциям</h3>
                <p style={{ color: '#8c8c8c' }}>
                  Управление нормочасами для расчета загрузки сотрудников
                </p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/cms/settings/metrics')}
            >
              <div style={{ textAlign: 'center' }}>
                <LineChartOutlined
                  style={{ fontSize: '48px', color: '#722ed1', marginBottom: '16px' }}
                />
                <h3>Метрики KPI и MBO</h3>
                <p style={{ color: '#8c8c8c' }}>
                  Корректировка ключевых показателей и целевых значений MBO
                </p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/cms/settings/appraisal-companies')}
            >
              <div style={{ textAlign: 'center' }}>
                <SafetyCertificateOutlined
                  style={{ fontSize: '48px', color: '#13c2c2', marginBottom: '16px' }}
                />
                <h3>Аккредитация оценочных компаний</h3>
                <p style={{ color: '#8c8c8c' }}>
                  Реестр оценочных компаний и управление их аккредитацией
                </p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={() => navigate('/cms/settings/workflow')}
            >
              <div style={{ textAlign: 'center' }}>
                <RocketOutlined
                  style={{ fontSize: '48px', color: '#fadb14', marginBottom: '16px' }}
                />
                <h3>Настройки Workflow</h3>
                <p style={{ color: '#8c8c8c' }}>
                  Управление этапами, чеклистами и шаблонами внесудебной реализации
                </p>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <Result
      status="info"
      title={title}
      subTitle={subtitle || 'Этот раздел находится в разработке'}
      extra={<Button onClick={() => navigate('/cms/registry')}>Вернуться к реестру</Button>}
    />
  );
};

export default PlaceholderPage;
