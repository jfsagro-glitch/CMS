# ПОЛНОЕ ТЕХНИЧЕСКОЕ ОПИСАНИЕ ПРОЕКТА CMS
## Система управления залоговым имуществом

**Версия документа:** 2.0.1 | **Дата:** Февраль 2026 | **Язык:** Русский

---

## 📋 СОДЕРЖАНИЕ
1. [Обзор проекта](#обзор-проекта)
2. [Архитектура приложения](#архитектура-приложения)
3. [Технологический стек](#технологический-стек)
4. [Структура папок](#структура-папок)
5. [Типы данных](#типы-данных)
6. [Сервисы](#сервисы)
7. [Redux хранилище](#redux-хранилище)
8. [Модули и страницы](#модули-и-страницы)
9. [Компоненты](#компоненты)
10. [Утилиты](#утилиты)
11. [Базы данных](#базы-данных)
12. [Контексты](#контексты)
13. [Hooks](#hooks)

---

## 🎯 ОБЗОР ПРОЕКТА

### Назначение
CMS (Corporate Management Systems) — веб-приложение для управления залоговым имуществом в банковском секторе. Система позволяет отслеживать, оценивать и управлять залоговыми объектами, проводить мониторинг портфеля, управлять осмотрами и вести комплексный учет залоговых активов.

### Основные возможности
- **Реестр залоговых объектов** — централизованное хранилище информации о всех залоговых активах
- **Управление портфелем** — анализ портфеля ссуд с привязкой к залоговым объектам
- **Система осмотров (CMS Check)** — электронная система мобильных осмотров с фотофиксацией
- **Оценка имущества** — работа с оценками, калькуляторы стоимости
- **Мониторинг и переоценка** — планирование и отслеживание периодических мониторингов
- **Управление задачами** — распределение работ между сотрудниками по регионам
- **Отчетность** — генерация отчетов для ЦБ РФ (Форма 310)
- **Управление сотрудниками** — система управления ролями и разрешениями
- **Справочники** — справочные данные, словари, классификаторы

### Бизнес-модель
- **Целевые пользователи:** банковские сотрудники разных уровней (операторы, менеджеры, оценщики, руководители)
- **Масштаб:** поддержка крупного портфеля залоговых активов (сотни тысяч объектов)
- **Регионы:** работа с 6+ региональными центрами, распределенная система сотрудников

---

## 🏗️ АРХИТЕКТУРА ПРИЛОЖЕНИЯ

### Общая схема
```
┌─────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND (SPA)                     │
│  (HTML5 + TypeScript + React 18 + Redux Toolkit)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    IndexedDB      localStorage    DaData API
   (Dexie ORM)     (ключевые       (адреса)
  (основная БД)    данные)
```

### Паттерны архитектуры

**1. MVC (Model-View-Controller) адаптация:**
- **Model:** Типы данных (`src/types/`) + Сервисы (`src/services/`)
- **View:** Компоненты React (`src/components/`)
- **Controller:** Redux слайсы + Page компоненты (модули)

**2. State Management (Redux Toolkit):**
```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Store     │ ←─→  │ Redux Slices │ ←─→  │  Components  │
│ (app state) │      │  (reducers)  │      │  (UI)        │
└─────────────┘      └──────────────┘      └──────────────┘
```

**3. Service Layer:**
- Изолируют бизнес-логику от компонентов
- Управляют доступом к БД
- Интегрируют внешние API

**4. Type Safety (TypeScript):**
- Полная типизация всего кода
- Интерфейсы для данных и API
- Generic типы для переиспользования

### Жизненный цикл приложения

```
1. main.tsx          → Инициализация React
2. App.tsx           → Инициализирует Redux, устанавливает маршруты
3. AppContent        → Инициализирует данные:
   - Контролирует загрузку приложения
   - Инициализирует IndexedDB
   - Загружает демо-данные (если база пустая)
   - Синхронизирует сотрудников
   - Генерирует задачи
   - Загружает workflow кейсы и шаблоны
4. MainLayout        → Основной макет (Header, Sidebar, Content)
5. Page Components   → Отдельные страницы модулей
```

### Инициализация (подробно)

```typescript
const initApp = async () => {
  // 1. Очистка старых задач из localStorage
  localStorage.removeItem('zadachnik_tasks');
  
  // 2. Инициализация IndexedDB
  await extendedStorageService.initDatabase();
  
  // 3. Загрузка карточек из IndexedDB
  const cards = await extendedStorageService.getExtendedCards();
  
  // 4. Если база пустая - загрузить демо-данные
  if (cards.length === 0) {
    const { loadDemoData } = await import('./utils/demoData');
    await loadDemoData(extendedStorageService);
  }
  
  // 5. Синхронизация сотрудников
  const { syncEmployeesToZadachnik } = await import('./utils/syncEmployeesToZadachnik');
  syncEmployeesToZadachnik();
  
  // 6. Загрузка осмотров
  const inspectionService = await import('./services/InspectionService').default;
  const inspections = await inspectionService.getInspections();
  if (inspections.length === 0) {
    const { loadInspectionDemoData } = await import('./utils/inspectionDemoData');
    await loadInspectionDemoData();
  }
  
  // 7. Загрузка workflow
  const wfCases = await extendedStorageService.getWorkflowCases();
  const wfTemplates = await extendedStorageService.getWorkflowTemplates();
  
  // 8. Уведомление об инициализации
  dispatch(setInitialized(true));
};
```

---

## 💻 ТЕХНОЛОГИЧЕСКИЙ СТЕК

### Frontend
- **React 18.2.0** — библиотека для UI
- **TypeScript 5.3.3** — типизация JavaScript
- **Vite 5.0.8** — бандлер и dev сервер
- **React Router DOM 6.20.0** — маршрутизация (HashRouter)
- **Redux Toolkit 2.0.1** — глобальное состояние
- **React-Redux 9.0.4** — интеграция Redux с React

### UI / Дизайн
- **Ant Design 5.12.0** — компонент UI библиотека
- **Ant Design Icons 5.2.6** — иконки

### Работа с данными
- **Dexie 3.2.4** — ORM для IndexedDB
- **Dexie React Hooks 1.1.7** — хуки для Dexie
- **XLSX 0.18.5** — работа с Excel файлами

### Утилиты
- **Dayjs 1.11.10** — работа с датами
- **html2canvas 1.4.1** — преобразование HTML в изображения
- **jsPDF 2.5.1** — генерация PDF
- **PDF.js 5.4.394** — работа с PDF
- **Mammoth 1.11.0** — конвертация Word в HTML

### Внешние API
- **DaData API** — подсказки адресов

### Development Tools
- **ESLint 8.55.0** — линтер кода
- **TypeScript ESLint** — поддержка TS в ESLint
- **gh-pages 6.1.0** — развертывание на GitHub Pages

---

## 📂 СТРУКТУРА ПАПОК

```
src/
├── App.tsx                    # Корневой компонент (маршруты, инициализация)
├── main.tsx                   # Точка входа в приложение
├── index.css                  # Глобальные стили
│
├── components/                # React компоненты
│   ├── layout/               # Компоненты макета
│   │   ├── MainLayout.tsx    # Основной макет (Header, Sidebar, Content)
│   │   ├── Header.tsx        # Шапка приложения
│   │   ├── SidebarMenu.tsx   # Боковое меню
│   │   └── RightToolbar.tsx  # Правая панель инструментов
│   │
│   ├── common/                # Многоразовые компоненты
│   │   ├── ErrorBoundary.tsx # Обработка ошибок
│   │   └── ...
│   │
│   ├── CollateralAttributesForm/  # Форма атрибутов залога
│   ├── CollateralConclusionCard/  # Карточка заключения
│   ├── CreateTaskModal/           # Модальное окно создания задачи
│   ├── InspectionCardModal/       # Модальное окно осмотра
│   ├── MonitoringCardModal/       # Модальное окно мониторинга
│   ├── Portfolio/                 # Компоненты портфеля
│   └── Timeline/                  # Компоненты временной шкалы
│
├── modules/                   # Страницы приложения (один модуль = одна страница)
│   ├── Registry/             # Реестр залоговых объектов
│   │   ├── ExtendedRegistryPage.tsx
│   │   └── RegistryPage.tsx
│   ├── Portfolio/            # Портфель ссуд
│   ├── Monitoring/           # Система мониторинга
│   ├── Tasks/                # Управление задачами
│   ├── Reports/              # Отчетность
│   ├── Insurance/            # Страхование
│   ├── Appraisal/            # Оценка имущества
│   ├── CMSCheck/             # Система осмотров
│   ├── CollateralDossier/    # Досье залога
│   ├── CollateralConclusions/# Залоговые заключения
│   ├── CreditRisk/           # Управление кредитным риском
│   ├── EGRN/                 # ЕГРН выписки
│   ├── FNP/                  # ФНП регистрация
│   ├── Analytics/            # Аналитика и KPI
│   ├── KPI/                  # Показатели производительности
│   ├── Upload/               # Загрузка данных
│   ├── Reference/            # Справочники
│   ├── Workflow/             # Workflow процессы
│   ├── Settings/             # Настройки
│   │   ├── EmployeesPage.tsx
│   │   ├── ReferenceDataPage.tsx
│   │   ├── NormHoursPage.tsx
│   │   ├── MetricsPage.tsx
│   │   └── AppraisalCompaniesPage.tsx
│   └── ProjectsPortfolio/    # Главная страница / коммерческое предложение
│
├── types/                     # TypeScript интерфейсы и типы
│   ├── index.ts              # Основные типы
│   ├── collateralDossier.ts  # Типы досье
│   ├── portfolio.ts          # Типы портфеля
│   ├── employee.ts           # Типы сотрудников
│   ├── workflow.ts           # Типы workflow
│   ├── inspection.ts         # Типы осмотров
│   ├── appraisal.ts          # Типы оценок
│   ├── insurance.ts          # Типы страхования
│   ├── fnp.ts                # Типы ФНП
│   ├── creditRisk.ts         # Типы кредитного риска
│   ├── monitoring.ts         # Типы мониторинга
│   ├── kpi.ts                # Типы KPI
│   ├── reports.ts            # Типы отчетности
│   ├── stage3Types.ts        # Дополнительные типы (Stage 3)
│   └── timeline.ts           # Типы временной шкалы
│
├── services/                  # Бизнес-логика и работа с БД
│   ├── ExtendedStorageService.ts      # Основной сервис IndexedDB
│   ├── EmployeeService.ts             # Управление сотрудниками
│   ├── InspectionService.ts           # Система осмотров
│   ├── AppraisalAIService.ts          # AI для оценок
│   ├── AppraisalCompanyService.ts     # Компании оценщиков
│   ├── AppraisalReviewService.ts      # Проверка оценок
│   ├── DaDataService.ts               # Интеграция DaData API
│   ├── DeepSeekService.ts             # AI интеграция (DeepSeek)
│   ├── EvolutionService.ts            # Службы эволюции (?)
│   ├── GeolocationService.ts          # Геолокация
│   ├── ImageGenerationService.ts      # Генерация изображений
│   ├── LearningService.ts             # Обучение системы
│   ├── QuestionEnhancementService.ts  # Улучшение вопросов
│   ├── ReferenceDataService.ts        # Справочные данные
│   ├── demoDataGenerator.ts           # Генерация демо-данных
│   └── StorageService.ts              # Работа с localStorage (legacy)
│
├── store/                     # Redux хранилище
│   ├── index.ts              # Конфигурация store
│   ├── hooks.ts              # useAppDispatch, useAppSelector
│   └── slices/               # Redux slices (reducers + actions)
│       ├── appSlice.ts       # Глобальное состояние приложения
│       ├── cardsSlice.ts     # Базовые карточки (legacy)
│       ├── extendedCardsSlice.ts  # Расширенные карточки
│       └── workflowSlice.ts    # Workflow состояние
│
├── contexts/                  # React Contexts (для глобального состояния)
│   ├── ThemeContext.tsx       # Контекст тем оформления
│   ├── ThemeContext.types.ts  # Типы для ThemeContext
│   ├── DemoDataContext.tsx    # Контекст демо-данных
│   └── DemoDataContext.types.ts
│
├── hooks/                     # Custom React Hooks
│   ├── useDemoData.ts        # Хук для работы с демо-данными
│   └── useTheme.ts           # Хук для работы с темами
│
├── utils/                     # Вспомогательные функции
│   ├── helpers.ts                  # Генерация ID, форматирование дат
│   ├── demoData.ts                 # Демо-данные для карточек
│   ├── inspectionDemoData.ts       # Демо-данные для осмотров
│   ├── demoDataGenerator.ts        # Генератор демо-данных
│   ├── generateTasksForEmployees.ts    # Генерация задач
│   ├── syncEmployeesToZadachnik.ts     # Синхронизация сотрудников
│   ├── classification.ts           # Классификаторы недвижимости
│   ├── characteristicsConfig.ts    # Конфигурация свойств
│   ├── collateralAttributesConfig.ts   # Конфигурация атрибутов
│   ├── collateralAttributesFromDict.ts # Генерация атрибутов из словарей
│   ├── bulkEditUtils.ts            # Утилиты для массового редактирования
│   ├── documentIndexer.ts          # Индексирование документов
│   ├── documentLoader.ts           # Загрузка документов
│   ├── documentTypesMapping.ts      # Виды документов
│   ├── knowledgeBase.ts            # База знаний
│   ├── pdfGenerator.ts             # Генерация PDF
│   ├── reportGenerators/           # Генераторы отчетов разных типов
│   ├── workflowTemplates.ts        # Шаблоны workflow
│   ├── workloadCalculator.ts       # Калькулятор рабочей нагрузки
│   ├── regionCenters.ts            # Справочник региональных центров
│   ├── kpiMetricsStorage.ts        # Хранилище KPI метрик
│   ├── monitoringPlanGenerator.ts  # Генератор планов мониторинга
│   ├── portfolioDemoData.ts        # Демо-данные портфеля
│   ├── egrnDemoData.ts             # Демо-данные ЕГРН
│   ├── generateDossierDemoData.ts  # Генерация демо-досье
│   ├── generateForm310XML.ts       # Генерация Формы 310 в XML
│   ├── updateExistingData.ts       # Обновление существующих данных
│   ├── updatePortfolioFromObjects.ts   # Синхронизация портфеля
│   └── sampleData.ts               # Примеры данных
│
├── styles/                    # Глобальные стили
│   ├── global.css            # Глобальные CSS правила
│   └── theme.ts              # Конфигурация тем оформления
│
├── data/                      # (пусто) Резерв для данных
│
└── vite-env.d.ts            # Типы окружения Vite


public/
├── brand/                    # Логотипы и бренд материалы
├── ...                      # Статические ресурсы
└── index.html              # HTML шаблон
```

---

## 📊 ТИПЫ ДАННЫХ

### 1. Основные типы (src/types/index.ts)

#### Классификация объектов
```typescript
// Основные категории
type MainCategory = 'real_estate' | 'movable' | 'property_rights';

// Иерархия недвижимости (4 уровня)
interface RealEstateHierarchy {
  level0: string; // 'Коммерческая', 'Жилая', 'Промышленная'
  level1: string; // Вид (квартира, офис и т.д.)
  level2: string; // Тип (здание, помещение и т.д.)
}
```

#### Карточка залога
```typescript
interface CollateralCard {
  id: string;
  mainCategory: MainCategory;
  classification: RealEstateHierarchy;
  cbCode: number;                    // Код Центробанка
  status: 'editing' | 'approved' | 'archived';
  number: string;                    // Номер карточки
  name: string;                      // Название объекта
  createdAt: Date;
  updatedAt: Date;
  attributeLevels?: Record<string, string>;
  characteristics?: Record<string, any>;
}
```

#### Партнеры (владельцы, залогодатели и т.д.)
```typescript
interface Partner {
  id: string;
  type: 'individual' | 'legal';      // Физ.лицо или Юр.лицо
  role: 'owner' | 'pledgor' | 'appraiser' | 'other';
  // Для физ.лиц:
  lastName?: string;
  firstName?: string;
  middleName?: string;
  // Для юр.лиц:
  organizationName?: string;
  shortName?: string;
  // Скорые поля:
  inn?: string;
  share?: number;                    // Доля права (%)
  showInRegistry?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Адрес залога
```typescript
interface Address {
  id: string;
  region: string;
  city: string;
  street: string;
  house: string;
  building?: string;
  apartment?: string;
  postalCode: string;
  fullAddress: string;
  cadastralNumber?: string;           // Кадастровый номер
  latitude?: number;                  // Геолокация
  longitude?: number;
}
```

#### Документ
```typescript
interface Document {
  id: string;
  cardId: string;
  name: string;
  type: string;
  content?: string;                   // Base64 или текст
  uploadedAt: Date;
  uploadedBy: string;
  size?: number;
  url?: string;
}
```

### 2. Расширенные типы (Stage 2)

#### ExtendedCollateralCard
```typescript
interface ExtendedCollateralCard extends CollateralCard {
  partners: Partner[];                // Связанные партнеры
  address: Address;                   // Адрес объекта
  characteristics: {
    // Для недвижимости:
    totalAreaSqm?: number;
    livingArea?: number;
    floor?: number;
    totalFloors?: number;
    roomsCount?: number;
    // Для земли:
    landArea?: number;
    landCategory?: string;
    // Для движимого:
    serialNumber?: string;
    yearManufactured?: number;
  };
  documents: Document[];              // Документы
  insuranceRecords?: InsuranceRecord[];
  monitoring?: MonitoringRecord[];
}
```

### 3. Типы для осмотров (src/types/inspection.ts)

```typescript
interface Inspection {
  id: string;
  inspectionType: InspectionType;     // primary, periodic, appointment и т.д.
  status: InspectionStatus;           // scheduled, in_progress, completed и т.д.
  inspectionDate: Date;
  collateralCardId: string;
  collateralName: string;
  
  // Инспектор (сотрудник или клиент)
  inspectorType: 'employee' | 'client';
  inspectorId?: string;
  inspectorName: string;
  inspectorPhone?: string;
  
  // Фотографии и дефекты
  photos: InspectionPhoto[];
  defects: InspectionDefect[];
  recommendations: InspectionRecommendation[];
  
  // Оценка состояния
  conditionRating: 'excellent' | 'good' | 'satisfactory' | 'poor' | 'critical';
  
  // История и документы
  history: InspectionHistoryItem[];
  documents?: WorkflowDocument[];
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. Типы для Workflow (src/types/workflow.ts)

```typescript
interface WorkflowCase {
  id: string;
  objectId: string;
  objectName: string;
  stage: WorkflowStage; // ANALYSIS, PREPARATION, NEGOTIATION, APPROVAL, AGREEMENT, SALE, COMPLETED
  
  // Финансовые показатели
  debtAmount?: number;
  appraisedValue?: number;
  daysOverdue?: number;
  
  // Управление процессом
  manager?: string;
  deadline?: string;
  
  // История и документы
  history: WorkflowHistoryItem[];
  documents: WorkflowDocument[];
  
  createdAt: string;
  updatedAt: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  type: 'notification' | 'claim' | 'agreement' | 'sale-contract' | 'other';
  content: string;                    // Текст с плейсхолдерами {{object.name}}
  updatedAt: string;
}
```

### 5. Типы для оценки (src/types/appraisal.ts)

```typescript
interface AppraisalResult {
  id: string;
  objectId: string;
  
  // Результаты оценки (в рублях)
  marketValue?: number;               // Рыночная стоимость
  collateralValue?: number;           // Залоговая стоимость
  fairValue?: number;                 // Справедливая стоимость
  
  // Методология
  appraisalMethod?: string;
  comparableObjectsCount?: number;    // Кол-во использованных аналогов
  confidenceLevel?: 'high' | 'medium' | 'low';
  
  // Сравнимые объекты
  comparableObjects?: ComparableObject[];
  
  // Утверждение
  status: 'draft' | 'approved' | 'rejected';
  appraisedAt: string;
  appraisedBy?: string;
}
```

### 6. Типы для Портфеля (src/types/portfolio.ts)

```typescript
interface CollateralPortfolioEntry {
  // Идентификация
  reference: string | number;         // Уникальный ID сделки
  segment: string | null;             // Сегмент портфеля
  borrower: string | null;            // Заемщик
  pledger: string | null;             // Залогодатель
  
  // Договор
  contractNumber: string | null;
  contractDate: string | null;
  
  // Финансовые показатели
  debtRub: number | string | null;    // Долг в рублях
  limitRub: number | string | null;   // Лимит кредита
  overduePrincipal: number | string | null;  // Просроченный основной долг
  overdueInterest: number | string | null;   // Просроченные проценты
  
  // Залоговое обеспечение
  collateralReference: string | number | null;
  collateralType: string | null;
  collateralValue: number | string | null;    // Уд. стоимость
  marketValue: number | string | null;        // Рыночная стоимость
  
  // Даты оценки
  initialValuationDate: string | null;
  currentValuationDate: string | null;
  
  // Мониторинг
  lastMonitoringDate: string | null;
  nextMonitoringDate: string | null;
  monitoringType: string | null;
}
```

### 7. Типы сотрудников (src/types/employee.ts)

```typescript
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  
  // Работа
  position: string;                   // Должность
  region: string;                     // Регион
  department?: string;
  hireDate?: string;
  
  // Контакты
  email?: string;
  phone?: string;
  
  // Статус и роли
  isActive: boolean;
  status?: 'working' | 'sick_leave' | 'vacation' | 'business_trip';
  
  // Функции
  canMonitor?: boolean;               // Может мониторить?
  canAppraise?: boolean;              // Может оценивать?
  isManager?: boolean;                // Руководитель?
  
  // Рабочая нагрузка
  monitoringWorkload?: number;        // Кол-во объектов на мониторинг
  appraisalWorkload?: number;         // Кол-во объектов на оценку
  
  // Разрешения
  permissions: EmployeePermission[]; // registry_view, reports_export и т.д.
  
  createdAt: string;
  updatedAt: string;
}
```

### 8. Типы для мониторинга (src/types/monitoring.ts)

```typescript
interface MonitoringPlanEntry {
  reference: string | number;
  collateralType: string;
  frequencyMonths: number;            // Периодичность в месяцах
  lastMonitoringDate: string;
  plannedDate: string;
  timeframe: 'overdue' | 'week' | 'month' | 'quarter' | 'later';
  owner: string;                      // ответственный сотрудник
  priority: string;
  liquidity: string;
  collateralValue: number | null;
}
```

### 9. Типы для КПИ (src/types/kpi.ts)

```typescript
interface KPIData {
  totalPortfolioValue: number;        // Общая стоимость портфеля
  totalContracts: number;             // Всего контрактов
  activeContracts: number;            // Активных контрактов
  completedTasks: number;             // Завершенных задач
  pendingTasks: number;               // Ожидающих задач
  overdueTasks: number;               // Просроченных задач
  slaCompliance: number;              // Соблюдение SLA (%)
  currentWorkload: number;            // Текущая нагрузка на сотрудников
  mboCompletionOverall: number;       // Выполнение КПО (%)
}
```

---

## 🔧 СЕРВИСЫ

### 1. ExtendedStorageService (главный сервис данных)

**Назначение:** Управление всеми данными через IndexedDB с ORM-библиотекой Dexie.

**Таблицы IndexedDB:**
- `collateralCards` — карточки залоговых объектов
- `partners` — партнеры (владельцы, залогодатели)
- `documents` — документы
- `settings` — глобальные настройки приложения
- `inspections` — осмотры
- `documentIndexes` — индексы документов
- `documentChunks` — текстовые куски документов (для полнотекстового поиска)
- `knowledgeTopics` — темы базы знаний
- `knowledgeCategories` — категории базы знаний
- `knowledgeSearchIndex` — обратный индекс поиска
- `tasks` — задачи (нарушение потока)
- `workflowCases` — workflow процессы
- `workflowTemplates` — шаблоны

**Основные методы:**
```typescript
// Карточки
getExtendedCards(): Promise<ExtendedCollateralCard[]>
getCardById(id: string): Promise<ExtendedCollateralCard | undefined>
searchCards(query: string): Promise<ExtendedCollateralCard[]>
filterCards(filters: ExtendedFilterParams): Promise<ExtendedCollateralCard[]>
saveCard(card: ExtendedCollateralCard): Promise<string>
updateCard(id: string, updates: Partial<ExtendedCollateralCard>): Promise<void>
deleteCard(id: string): Promise<void>
bulkImportCards(cards: ExtendedCollateralCard[]): Promise<number>

// Партнеры
getPartnersByCardId(cardId: string): Promise<Partner[]>
savePartner(partner: Partner): Promise<string>
deletePartner(id: string): Promise<void>

// Документы
getDocumentsByCardId(cardId: string): Promise<Document[]>
saveDocument(doc: Document): Promise<string>
deleteDocument(id: string): Promise<void>

// Задачи
getTasks(): Promise<TaskDB[]>
saveTasks(tasks: TaskDB[]): Promise<void>
getTasksByEmployee(employeeId: string): Promise<TaskDB[]>

// Workflow
getWorkflowCases(): Promise<WorkflowCase[]>
saveWorkflowCase(caseObj: WorkflowCase): Promise<void>
getWorkflowTemplates(): Promise<WorkflowTemplate[]>
saveWorkflowTemplates(templates: WorkflowTemplate[]): Promise<void>

// Настройки
getSettings(): Promise<AppSettings>
saveSettings(settings: AppSettings): Promise<void>

// Базы знаний
indexDocument(name: string, text: string): Promise<void>
searchKnowledge(query: string): Promise<KnowledgeTopicDB[]>
```

### 2. EmployeeService (управление сотрудниками)

**Назначение:** Управление сотрудниками и их правами доступа (localStorage).

**Хранилище:** localStorage ключ `cms_employees`

**Основные методы:**
```typescript
getEmployees(): Employee[]              // Получить всех
getEmployeeById(id: string): Employee | undefined
addEmployee(employee): Employee         // Добавить и указать ID
updateEmployee(id: string, updates): Employee | null
deleteEmployee(id: string): boolean
regenerateEmployees(): Employee[]       // Пересоздать базу с демо-данными
saveEmployees(employees: Employee[]): void
getActiveEmployees(): Employee[]
getEmployeesByRegion(region: string): Employee[]
getEmployeesWithRole(role: 'monitor' | 'appraiser'): Employee[]
calculateWorkload(employeeId: string): KPIWorkloadByPeriod
```

**Демо-данные:** ~180 сотрудников по 30 по каждому из 6 региональных центров

### 3. InspectionService (система осмотров)

**Назначение:** Управление осмотрами (CMS Check).

**Хранилище:** IndexedDB таблица `inspections`

**Основные методы:**
```typescript
initDatabase(): Promise<void>
getInspections(): Promise<Inspection[]>
getInspectionById(id: string): Promise<Inspection | undefined>
getInspectionsByCardId(cardId: string): Promise<Inspection[]>
getInspectionsByType(type: InspectionType): Promise<Inspection[]>
getInspectionsByStatus(status: InspectionStatus): Promise<Inspection[]>
getInspectionsByInspector(inspectorId: string): Promise<Inspection[]>
createInspection(inspection: Inspection): Promise<string>
updateInspection(id: string, updates: Partial<Inspection>): Promise<void>
deleteInspection(id: string): Promise<void>
submitInspection(id: string, data: any): Promise<void>
approveInspection(id: string): Promise<void>
requestRevision(id: string, reason: string): Promise<void>
```

### 4. DaDataService (интеграция с DaData API)

**Назначение:** Подсказки адресов и геокодирование через DaData API.

**API:** https://suggestions.dadata.ru/suggestions/api/4_1/rs

**Ключ API:** `8369d552d89563916982831fbb6ddb90b7d38fe2`

**Лимит:** 10,000 запросов в день (бесплатный тариф)

**Основные методы:**
```typescript
suggestAddress(query: string, count?: number): Promise<DaDataAddress[]>
geolocateAddress(latitude: number, longitude: number): Promise<DaDataAddress[]>
getRemainingRequests(): number      // Запросов осталось в день
```

**Возвращаемые данные:**
```typescript
interface DaDataAddress {
  value: string;                    // Полный текст
  data: {
    postal_code: string;
    region: string;
    city: string;
    street: string;
    house: string;
    geo_lat: string;               // Широта
    geo_lon: string;               // Долгота
    // + 100+ других полей
  }
}
```

### 5. AppraisalAIService (AI для оценок)

**Назначение:** Интеграция с AI системами для автоматической оценки стоимости.

**Методы:**
```typescript
estimateValue(card: ExtendedCollateralCard): Promise<AppraisalResult>
getComparableObjects(card: ExtendedCollateralCard): Promise<ComparableObject[]>
validateAppraisal(appraisal: AppraisalResult): Promise<ValidationResult>
```

### 6. ImageGenerationService (генерация изображений)

**Назначение:** Генерация изображений и визуализаций.

**Методы:**
```typescript
generatePropertyImage(characteristics: any): Promise<string>  // Base64
generatePortfolioChart(data: any): Promise<string>
```

### 7. ReferenceDataService (справочные данные)

**Назначение:** Работа с справочниками (словарями) классификаторов.

**Методы:**
```typescript
getClassifications(): Record<string, any>
getCBCodes(): Record<string, CbCode>
getPropertyTypes(): PropertyType[]
getCharacteristicsByType(type: string): Characteristic[]
validateClassification(classification: any): boolean
```

### 8. Другие сервисы

```
DeepSeekService          — Интеграция с DeepSeek AI
GeolocationService       — Получение координат GPS
LearningService          — Обучение системы на данных
QuestionEnhancementService — Расширение поиска и вопросов
EvolutionService         — Эволюция системы(?)
AppraisalCompanyService  — Управление компаниями оценщиков
AppraisalReviewService   — Проверка эценок
```

---

## 🏪 REDUX ХРАНИЛИЩЕ

### Структура Store

```typescript
interface RootState {
  app: AppState;           // Глобальное состояние приложения
  cards: CardsState;       // Базовые карточки (архаичное)
  extendedCards: ExtendedCardsState;  // Расширенные карточки
  workflow: WorkflowState; // Workflow процессы
}
```

### 1. appSlice — Глобальное состояние

**Состояние:**
```typescript
interface AppState {
  theme: 'light' | 'dark' | 'compact';
  language: 'ru' | 'en';
  sidebarCollapsed: boolean;
  loading: boolean;
  initialized: boolean;  // Загрузилось ли приложение
}
```

**Actions:**
```typescript
setTheme(theme)               // Смена темы
setLanguage(language)         // Смена языка
toggleSidebar()               // Развернуть/свернуть sidebar
setSidebarCollapsed(value)    // Установить состояние sidebar
setLoading(value)             // Установить флаг загрузки
setInitialized(value)         // Установить флаг инициализации
setSettings(partial)          // Обновить все настройки
```

### 2. extendedCardsSlice — Карточки залога

**Состояние:**
```typescript
interface ExtendedCardsState {
  items: ExtendedCollateralCard[];
  filteredItems: ExtendedCollateralCard[];
  selectedCard: ExtendedCollateralCard | null;
  filters: ExtendedFilterParams;
  sort: SortParams | null;
  loading: boolean;
  error: string | null;
}
```

**Actions:**
```typescript
setExtendedCards(items)       // Загрузить все карточки
addExtendedCard(card)         // Добавить карточку
updateExtendedCard(card)      // Обновить карточку
deleteExtendedCard(id)        // Удалить карточку
deleteExtendedCards(ids)      // Удалить несколько
setSelectedCard(card)         // Выбрать карточку
setFilters(filters)           // Применить фильтры
setSort(sort)                 // Применить сортировку
clearFilters()                // Очистить фильтры
setLoading(value)             // Флаг загрузки
setError(message)             // Установить ошибку
```

**Фильтры:**
```typescript
interface ExtendedFilterParams {
  mainCategory?: MainCategory;
  status?: CardStatus;
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
  partners?: string[];
  region?: string;
}
```

### 3. workflowSlice — Workflow процессы

**Состояние:**
```typescript
interface WorkflowState {
  cases: WorkflowCase[];
  templates: WorkflowTemplate[];
  selectedCase: WorkflowCase | null;
  loading: boolean;
  error: string | null;
}
```

**Actions:**
```typescript
setCases(cases)               // Загрузить кейсы
setCaseSelected(caseObj)      // Выбрать кейс
addCase(caseObj)              // Добавить кейс
updateCase(caseObj)           // Обновить кейс
deleteCase(id)                // Удалить кейс
setTemplates(templates)       // Загрузить шаблоны
addTemplate(template)         // Добавить шаблон
updateTemplate(template)      // Обновить шаблон
deleteTemplate(id)            // Удалить шаблон
setLoading(value)             // Флаг загрузки
setError(message)             // Установить ошибку
```

### Использование в компонентах

```typescript
// Получение state
const { theme, initialized } = useAppSelector(state => state.app);
const { items, selectedCard } = useAppSelector(state => state.extendedCards);
const { cases } = useAppSelector(state => state.workflow);

// Dispatch actions
const dispatch = useAppDispatch();
dispatch(setTheme('dark'));
dispatch(setExtendedCards(cards));
```

---

## 🧩 МОДУЛИ И СТРАНИЦЫ

Каждый модуль — это отдельная страница приложения. Все модули находятся в `src/modules/` и используют единую систему маршрутизации.

### 1. Registry (Реестр залоговых объектов)

**Путь:** `/cms/registry`  
**Файлы:** `ExtendedRegistryPage.tsx`, `RegistryPage.tsx`

**Что показывает:**
- Таблица всех залоговых карточек
- Фильтры по категории, статусу, дате
- Поиск по названию и номеру
- Сортировка по полям

**Функциональность:**
- Просмотр деталей карточки
- Редактирование карточки
- Добавление новой карточки
- Удаление карточки
- Экспорт в Excel
- Импорт из Excel
- Массовое редактирование

**Данные:**
- Источник: IndexedDB таблица `collateralCards`
- Redux: `extendedCards` slice
- Сервис: `ExtendedStorageService`

### 2. Portfolio (Портфель ссуд)

**Путь:** `/cms/portfolio`  
**Файлы:** `PortfolioPage.tsx`, `PortfolioPage.css`

**Что показывает:**
- Таблица с данными портфеля
- Связь между ссудами и залоговыми объектами
- Финансовые показатели (долг, лимит, переплаты)
- Даты оценок и мониторинга

**Функциональность:**
- Просмотр данных сделки
- Связывание залога с контрактом
- Отслеживание просроченных платежей
- Выявление просроченных объектов
- Анализ ликвидности

**Данные:**
- Источник: JSON файлы (`public/portfolioData.json`)
- Тип: `CollateralPortfolioEntry[]`

### 3. Monitoring (Мониторинг и переоценка)

**Путь:** `/cms/monitoring`  
**Файлы:** `MonitoringPage.tsx`, `MonitoringSettings.tsx`

**Что показывает:**
- План мониторинга (какие объекты нужно мониторить)
- План переоценки (какие объекты нужно переоценить)
- Распределение работ по сотрудникам
- Сроки выполнения

**Функциональность:**
- Генерация плана мониторинга
- Назначение ответственных
- Отслеживание выполнения
- Переоценка объектов
- Обновление стоимостей

**Данные:**
- Тип: `MonitoringPlanEntry[]`
- Генератор: `monitoringPlanGenerator.ts`

### 4. Tasks (Управление задачами)

**Путь:** `/cms/tasks`  
**Файлы:** `TasksPage.tsx`

**Что показывает:**
- Список всех задач
- Фильтры по типу, статусу, приоритету
- Распределение по сотрудникам

**Функциональность:**
- Просмотр задач
- Создание задачи
- Редактирование задачи
- Назначение сотрудника
- Отслеживание выполнения
- История задач (комментарии, изменения)

**Данные:**
- Источник: IndexedDB таблица `tasks`
- Тип: `TaskDB[]`
- Генератор: `generateTasksForEmployees.ts`
- **Примечание:** совместимость с системой Zadachnik

### 5. CMSCheck (Система осмотров)

**Путь:** `/cms/cms-check`  
**Файлы:** `CMSCheckPage.tsx`, `MobileInspectionPage.tsx`

**Что показывает:**
- Список все осмотров
- Статусы осмотров
- Детали каждого осмотра
- Фотографии, дефекты, рекомендации

**Функциональность:**
- Планирование осмотра
- Отправка клиенту (мобильная ссылка с токеном)
- Ввод результатов (фото, описание состояния)
- Отметка дефектов и рекомендаций
- Согласование и утверждение
- Экспорт отчета

**Данные:**
- Источник: IndexedDB таблица `inspections`
- Тип: `Inspection[]`
- Сервис: `InspectionService`

### 6. Appraisal (Оценка имущества)

**Путь:** `/cms/appraisal`  
**Файлы:** `AppraisalPage.tsx`

**Что показывает:**
- Список объектов на оценку
- Состояние оценок
- Результаты оценки
- Сравнимые объекты

**Функциональность:**
- Запрос оценки
- Просмотр результатов
- Утверждение/отклонение оценки
- Ввод корректировок
- Управление компаниями оценщиков
- AI помощь в оценке

**Данные:**
- Тип: `AppraisalResult[]`
- Сервисы: `AppraisalAIService`, `AppraisalCompanyService`, `AppraisalReviewService`

### 7. CollateralConclusions (Залоговые заключения)

**Путь:** `/cms/collateral-conclusions`  
**Файлы:** `CollateralConclusionsPage.tsx`

**Что показывает:**
- Список заключений по залогам
- Статусы и результаты
- История согласований

**Функциональность:**
- Просмотр заключения
- Подготовка заключения
- Согласование
- Архивирование

**Данные:**
- Источник: JSON файлы
- Тип: `CollateralConclusion[]`

### 8. CreditRisk (Управление кредитным риском)

**Путь:** `/cms/credit-risk`  
**Файлы:** `CreditRiskPage.tsx`

**Что показывает:**
- Риск-события по залогам
- Уровни риска
- История и мониторинг

**Функциональность:**
- Фиксирование риск-события
- Оценка важности
- Принятие мер
- Отслеживание решения

**Данные:**
- Справочник событий: `RISK_EVENTS[]` (в `creditRisk.ts`)

### 9. FNP (ФНП регистрация)

**Путь:** `/cms/fnp`  
**Файлы:** `FNPServicePage.tsx`

**Что показывает:**
- Регистрации в ФНП (Федеральная нотариальная палата)
- Статусы регистрации
- Документы и уведомления

**Функциональность:**
- Подготовка заявки на регистрацию
- Отправка в ФНП
- Отслеживание статуса
- Получение номера регистрации

**Данные:**
- Тип: `FNPRegistration[]`

### 10. EGRN (ЕГРН выписки)

**Путь:** `/cms/egrn`  
**Файлы:** `EGRNPage.tsx`

**Что показывает:**
- Запросы и выписки из ЕГРН
- Статусы выписок
- Кадастровые номера

**Функциональность:**
- Запрос выписки из ЕГРН
- Отслеживание статуса запроса
- Получение и сохранение выписки
- Проверка собственнических прав

**Данные:**
- Тип: `EGRNStatement[]`

### 11. Insurance (Страхование)

**Путь:** `/cms/insurance`  
**Файлы:** `InsurancePage.tsx`

**Что показывает:**
- Полисы страхования
- Покрытие и сумму
- Сроки действия

**Функциональность:**
- Просмотр полисов
- Отслеживание сроков (истечения полисов)
- Уведомления о необходимости переиндексирования

**Данные:**
- Тип: `InsuranceRecord[]`

### 12. Reports (Отчетность)

**Путь:** `/cms/reports`  
**Файлы:** `ReportsPage.tsx`

**Что показывает:**
- Сгенерированные отчеты
- Форма 310 ЦБ РФ
- Состояние отчетов

**Функциональность:**
- Генерация Формы 310
- Экспорт в XML/Excel/PDF
- Отправка в ЦБ РФ
- Архивирование

**Данные:**
- Тип: `Form310Report[]`
- Генератор: `generateForm310XML.ts`

### 13. KPI (Показатели производительности)

**Путь:** `/cms/kpi`  
**Файлы:** `KPIPage.tsx`

**Что показывает:**
- Статистика по портфелю
- Посмотрев по сотрудникам
- KPI метрики

**Функциональность:**
- Просмотр статистики
- Анализ производительности
- Прогноз SLA compliance

**Данные:**
- Тип: `KPIData`
- Хранилище: `kpiMetricsStorage.ts`

### 14. Analytics (Аналитика)

**Путь:** `/cms/analytics`  
**Файлы:** `AnalyticsPage.tsx`

**Что показывает:**
- Графики и диаграммы
- Тренды портфеля
- Прогнозы

**Функциональность:**
- Анализ данных
- Визуализация
- Экспорт графиков

### 15. Settings (Настройки)

**Путь:** `/cms/settings/*`

#### 15.1 Employees (Управление сотрудниками)
- Просмотр/редактирование сотрудников
- Назначение ролей и разрешений
- Распределение по регионам

#### 15.2 Reference Data (Справочники)
- Редактирование классификаторов
- Управление словарями
- Обновление справочников

#### 15.3 Norm Hours (Нормы часов)
- Установка норм рабочих часов
- ОПБХ (основные показатели бизнес-часов)
- Календари работы

#### 15.4 Metrics (Метрики KPI)
- Настройка KPI метрик
- Установка целей
- Пересчет показателей

#### 15.5 Workflow (Настройки workflow)
- Управление стадиями
- Шаблоны уведомлений
- Условия переходов

#### 15.6 Appraisal Companies (Компании оценщиков)
- Каталог компаний оценщиков
- Лицензии и рейтинги
- Ограничения по типам объектов

### 16. Upload (Загрузка данных)

**Путь:** `/cms/upload`  
**Файлы:** `UploadPage.tsx`

**Что показывает:**
- Форма загрузки Excel файлов
- История загрузок
- Ошибки валидации

**Функциональность:**
- Загрузка карточек из Excel
- Загрузка портфеля
- Валидация и проверка
- Импорт в БД

**Данные:**
- Разбор Excel через `XLSX`
- Валидация через различные утилиты

### 17. Reference (Справочники / Dictionary)

**Путь:** `/cms/reference`  
**Файлы:** `ReferencePage.tsx`

**Что показывает:**
- Справочники для классификации
- Словари атрибутов
- Опции для выпадающих списков

**Функциональность:**
- Просмотр справочников
- Поиск в справочниках
- Редактирование (для администраторов)

### 18. Workflow (Управление процессемами)

**Путь:** `/cms/workflow`  
**Файлы:** `WorkflowPage.tsx`, `WorkflowCasePage.tsx`, `WorkflowSettingsPage.tsx`

**Что показывает:**
- Список workflow кейсов (процессов)
- Стадии каждого кейса
- История и документы

**Функциональность:**
- Создание нового workflow
- Переход между стадиями
- Добавление комментариев и документов
- Шаблоны уведомлений (в Settings)

---

## 🔧 КОМПОНЕНТЫ

### Layout Components

**MainLayout.tsx**
```
┌────────────────────────────────────────┐
│             Header                      │
├──────────────┬─────────────────────────┤
│ SidebarMenu  │  Content                 │
│              │  (вставляется через     │
│  - Registry  │   <Outlet />)            │
│  - Portfolio │                         │
│  - Monitoring│  [Page Component]       │
│  - Tasks     │                         │
│  - Reports   │                         │
│  - Settings  │                         │
│  ...         │                         │
├──────────────┴─────────────────────────┤
└────────────────────────────────────────┘
```

**Header.tsx** — Шапка с логотипом, поисковой строкой, переключателем тем

**SidebarMenu.tsx** — Боковое меню с основной навигацией

**RightToolbar.tsx** — Правая панель с инструментами

### Feature Components

**CollateralAttributesForm**
- Форма для редактирования атрибутов залога
- Динамические поля в зависимости от типа объекта
- Валидация данных

**CollateralConclusionCard**
- Карточка залогового заключения
- Отображение результатов оценки
- История согласований

**CreateTaskModal**
- Модальное окно создания новой задачи
- Выбор типа, приоритета, ответственного
- Привязка к объекту

**InspectionCardModal**
- Модальное окно для осмотра
- Загрузка фотографий
- Добавление дефектов и рекомендаций

**Portfolio Components**
- Таблицы портфеля
- Фильтры и поиск
- Экспорт данных

**Timeline**
- Временная шкала истории изменений
- События и комментарии

### Common Components

**ErrorBoundary.tsx**
- Перехватывает React ошибки
- Отображает fallback UI
- Логирует ошибки

---

## 📚 УТИЛИТЫ

### helpers.ts — Вспомогательные функции

```typescript
// Генерация ID
generateId(): string
// -> "1708110400000-a1b2c3d4e"

// Форматирование дат
formatDate(date): string
// -> "17.02.2026 10:30"

formatDateOnly(date): string
// -> "17.02.2026"

// Скачивание файла
downloadFile(blob: Blob, filename: string): void

// Переводы
translateCategory(category): string
// 'real_estate' -> 'Недвижимость'

translateStatus(status): string
// 'editing' -> 'Редактирование'

// Другие утилиты
round(number, decimals): number
isEmpty(value): boolean
deepClone(object): any
```

### classification.ts — Классификаторы недвижимости

```typescript
// Полная иерархия недвижимости
const realEstateClassification = {
  'Коммерческая недвижимость': {
    'Офис': { 'Здание': [...], 'Помещение': [...] },
    'Торговля': { ... },
    'Складское помещение': { ... },
    ...
  },
  'Жилая недвижимость': {
    'Квартира': { 'Помещение': [...] },
    'Дом': { 'Здание': [...] },
    ...
  },
  'Промышленная недвижимость': { ... }
}

// Функции
getCBCode(classification): number
validateClassification(classification): boolean
getLevel1Options(level0): string[]
getLevel2Options(level0, level1): string[]
```

### characteristicsConfig.ts — Конфигурация свойств объектов

```typescript
// Описание какие свойства есть для каждого типа
const characteristicsMap = {
  'Квартира': [
    { name: 'totalAreaSqm', label: 'Общая площадь' },
    { name: 'livingArea', label: 'Жилая площадь' },
    { name: 'kitchenArea', label: 'Площадь кухни' },
    { name: 'floor', label: 'Этаж' },
    { name: 'totalFloors', label: 'Всего этажей' },
    { name: 'roomsCount', label: 'Кол-во комнат' },
  ],
  ...
}

function getCharacteristics(objectType): Characteristic[]
```

### collateralAttributesConfig.ts — Иерархия атрибутов залога

```typescript
// 5 уровней иерархии атрибутов
const attributeHierarchy = [
  {
    level: 1,
    name: 'Вид обеспечения',
    values: ['Недвижимое имущество', 'Движимое имущество', ...]
  },
  {
    level: 2,
    name: 'Тип обеспечения',
    values: ['Земельный участок', 'Здание', ...]
  },
  ...
]
```

### demoData.ts — Демо-данные для карточек

```typescript
// Массив демо-карточек для быстрого тестирования
export const demoExtendedCards: ExtendedCollateralCard[] = [
  {
    id: 'demo-1',
    number: 'КО-2024-001',
    name: '3-комнатная квартира на ул. Ленина',
    mainCategory: 'real_estate',
    classification: {
      level0: 'Жилая недвижимость',
      level1: 'Квартира',
      level2: 'Помещение',
    },
    // ...
  },
  // ~ 10 более примеров разных типов
]

export const demoPartners: Partner[] = [
  // Примеры партнеров
]

async function loadDemoData(service): Promise<void>
// Загружает все демо-данные в IndexedDB
```

### inspectionDemoData.ts — Демо-данные для осмотров

```typescript
// Демо-данные осмотров
async function loadInspectionDemoData(): Promise<void>

// Генерирует ~20 осмотров на демо-карточки
```

### demoDataGenerator.ts — Генератор демо-данных

```typescript
// Более сложные генераторы случайных данных
function generateLargeScale(): Promise<void>
// Генерирует 1000+ объектов для тестирования масштаба

function generatePortfolioData(): Promise<void>
// Генерирует портфель
```

### generateTasksForEmployees.ts — Генерация задач

```typescript
async function generateTasksForEmployees(): Promise<void>
// Генерирует ~60 задач на каждого активного сотрудника
// Распределяет по типам: Мониторинг, Оценка, Экспертиза и т.д.
// Привязывает задачи к объектам из реестра
```

### syncEmployeesToZadachnik.ts — Синхронизация сотрудников

```typescript
function syncEmployeesToZadachnik(): void
// Синхронизирует сотрудников с внешней системой Zadachnik
// Обновляет контакты и статусы
```

### documentIndexer.ts, documentLoader.ts — Работа с документами

```typescript
// Индексирование документов для полнотекстового поиска
async function indexDocument(name, text): Promise<void>

// Загрузка документов из файлов
async function loadDocument(file): Promise<Document>

// Поиск в индексе
async function searchInDocuments(query): Promise<DocumentChunk[]>
```

### knowledgeBase.ts — База знаний

```typescript
// Интеграция с базой знаний приложения
// Для поиска информации по залогам и процедурам

async function searchKnowledge(query): Promise<Topic[]>
function buildKnowledgeIndex(): void
```

### reportGenerators/ — Генераторы отчетов

```
reportGenerators/
├── generateForm310XML.ts    # Форма 310 ЦБ РФ в XML
├── generateAnalyticalReport.ts
└── ...
```

### workflowTemplates.ts — Шаблоны workflow

```typescript
export const DEFAULT_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tmpl-notification',
    name: 'Уведомление должника',
    type: 'notification',
    content: `Уважаемый {{debtor.name}}!
              Ваш долг по договору {{contract.number}} составляет {{debt.amount}} рублей...`
  },
  // ... 10+ шаблонов
]
```

### workloadCalculator.ts — Расчет рабочей нагрузки

```typescript
// Расчет сколько объектов назначено каждому сотруднику
function calculateWorkload(employeeId): KPIWorkloadByPeriod
// -> { last7Days: 5, last30Days: 25, last90Days: 75 }

function distributeWorkByCapacity(
  objects: ExtendedCollateralCard[],
  employees: Employee[]
): void
// Автоматически распределяет объекты по сотрудникам
// с учетом их рабочей нагрузки
```

### monitoringPlanGenerator.ts — Генератор плана мониторинга

```typescript
async function generateMonitoringPlan(): Promise<MonitoringPlanEntry[]>
// Генерирует план мониторинга на основе:
// - Даты последнего мониторинга
// - Установленной периодичности
// - Приоритета объектов

async function generateRevaluationPlan(): Promise<RevaluationPlanEntry[]>
// Аналогично для переоценок
```

### portfolioDemoData.ts, egrnDemoData.ts, и т.д.

Содержат демо-данные соответственно:
- Портфеля ссуд
- ЕГРН выписок
- ФНП регистраций и т.д.

### bulkEditUtils.ts — Массовое редактирование

```typescript
// Для работы с импортом/экспортом Excel

interface BulkEditValidationError {
  rowNumber: number;
  field: string;
  value: any;
  error: string;
}

async function validateExcelData(
  data: any[]
): Promise<BulkEditValidationError[]>

async function importCards(data: any[]): Promise<ImportResult>
```

### updateExistingData.ts, updatePortfolioFromObjects.ts

```typescript
// Обновление и синхронизация данных между модулями
async function updatePortfolioFromObjects(): Promise<void>
// Синхронизирует портфель с изменениями в реестре объектов
```

---

## 💾 БАЗЫ ДАННЫХ

### IndexedDB (основная база)

**ORM Библиотека:** Dexie 3.2.4

**Инициализация:**
```typescript
class ExtendedCMSDatabase extends Dexie {
  collateralCards!: Table<ExtendedCollateralCard, string>;
  partners!: Table<Partner, string>;
  documents!: Table<Document, string>;
  // ... и т.д.
  
  constructor() {
    super('extended-cms-database');
    this.version(1).stores({
      collateralCards: 'id, number, status, mainCategory',
      partners: 'id, cardId',
      documents: 'id, cardId',
      // С индексами для быстрого поиска
    });
  }
}
```

**Структура таблиц:**

| Таблица | Индекс | Назначение |
|---------|--------|-----------|
| `collateralCards` | id, number, status, mainCategory | Карточки залоговых объектов |
| `partners` | id, cardId | Владельцы и залогодатели |
| `documents` | id, cardId | Загруженные документы |
| `settings` | id | Глобальные настройки |
| `inspections` | id, collateralCardId, status | Осмотры объектов |
| `documentIndexes` | documentName | Индексы документов |
| `documentChunks` | id, documentName, keywords | Текстовые части документов |
| `knowledgeTopics` | id, category | Темы базы знаний |
| `knowledgeCategories` | id, name | Категории знаний |
| `knowledgeSearchIndex` | keyword | Обратный индекс |
| `tasks` | id, region, status | Задачи сотрудников |
| `workflowCases` | id, objectId, stage | Workflow процессы |
| `workflowTemplates` | id, type | Шаблоны уведомлений |

**Сохранение данных:**

Инициализация происходит в `App.tsx`:
```typescript
await extendedStorageService.initDatabase();
const cards = await extendedStorageService.getExtendedCards();

// При изменении
dispatch(updateExtendedCard(card));
// Компонент должен вызвать:
await extendedStorageService.updateCard(card.id, card);
```

### localStorage (память сессии)

**Назначение:** Быстрое хранилище для небольших часто используемых данных.

**Ключи:**
```typescript
'cms_employees'          // JSON array of employees
'cms-theme'              // Current theme name
'cms_settings'           // User settings (legacy)
'cms_selectedCard'       // Currently selected card ID
'cms_sidebarCollapsed'   // Sidebar state
// Демо-данные (если еще есть):
'zadachnik_tasks'        // Удаляется при инициализации
```

**Проблемы:**
- localStorage имеет лимит ~5-10 MB
- При превышении генерируется `QuotaExceededError`
- Система переехала на IndexedDB для больших данных

### Демо-данные (JSON файлы)

Некоторые данные хранятся в JSON файлах для быстрого прототипирования:

```
public/
├── portfolioData.json              # Портфель ссуд
├── collateralConclusionsData.json # Заключения
├── egrnData.json                  # ЕГРН выписки
├── insuranceData.json             # Страхование
└── ...
```

**Загрузка:**
```typescript
const response = await fetch('/public/portfolioData.json');
const data = await response.json();
```

### Структура демо-данных при первом запуске

1. **IndexedDB инициализируется** → пустые таблицы
2. **Обнаруживается что база пустая** → загружаются демо-данные
3. **Демо-данные содержат:**
   - 10-15 примерных карточек (разные типы недвижимости)
   - 100-200 сотрудников (6 региональных центров × 30 человек)
   - 1000+ задач (60 задач на активного сотрудника)
   - 20+ осмотров
   - ~50 портфельных записей

4. **Статусные сообщения в консоли:**
   ```
   ✅ Очищены старые задачи из localStorage
   ✅ Демо-данные загружены автоматически
   ✅ Демо-данные осмотров загружены автоматически
   ✅ Сгенерировано 1200 задач для 20 активных сотрудников
   ```

---

## 🎨 КОНТЕКСТЫ (React Context API)

### 1. ThemeContext (src/contexts/ThemeContext.tsx)

**Назначение:** Управление темой оформления приложения.

**Значение контекста:**
```typescript
interface ThemeContext {
  currentTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

type ThemeMode = 
  | 'light'           // Стандартная светлая тема
  | 'dark'            // Темная тема
  | 'dark-gray'       // Темно-серая тема (по умолчанию)
  | 'windows-97'      // Ностальгия :) 
  | 'windows-xp'      // Ностальгия :)
  | 'matrix'          // Ностальгия :)
  | 'ios'             // Стиль iOS
```

**Использование:**
```typescript
const { currentTheme, setTheme } = useContext(ThemeContext);
setTheme('dark'); // Смена темы
```

**Сохранение:**
```typescript
// Сохраняется в localStorage
localStorage.setItem('cms-theme', currentTheme);

// При загрузке читается из localStorage
const saved = localStorage.getItem('cms-theme');
```

**Интеграция с Ant Design:**
```typescript
const getThemeConfig = () => {
  switch (currentTheme) {
    case 'dark':
      return { algorithm: theme.darkAlgorithm };
    case 'compact':
      return { algorithm: [theme.defaultAlgorithm, theme.compactAlgorithm] };
    // ... другие темы
  }
};
```

### 2. DemoDataContext (src/contexts/DemoDataContext.tsx)

**Назначение:** Управление демо-данными и сменой режима демо.

**Значение контекста:**
```typescript
interface DemoDataContextValue {
  isDemoMode: boolean;
  setDemoMode: (value: boolean) => void;
  reloadDemoData: () => Promise<void>;
}
```

**Функциональность:**
- Отслеживание находимся ли мы в режиме демо-данных
- Возможность перезагрузить демо-данные
- Возможность переключиться на реальные данные

**Использование:**
```typescript
const { isDemoMode, reloadDemoData } = useContext(DemoDataContext);

// Перезагрузить демо-данные
if (isDemoMode) {
  await reloadDemoData();
}
```

---

## 🪝 CUSTOM HOOKS

### useDemoData.ts

```typescript
function useDemoData() {
  return {
    isDemoMode: boolean,
    cards: ExtendedCollateralCard[],
    employees: Employee[],
    loading: boolean,
    reloadDemoData: () => Promise<void>,
    generateNewCards: (count: number) => Promise<void>,
  };
}

// Использование в компонентах
const { isDemoMode, cards } = useDemoData();
```

### useTheme.ts

```typescript
function useTheme() {
  return {
    currentTheme: ThemeMode,
    setTheme: (theme: ThemeMode) => void,
    isDarkMode: boolean,
    toggleDarkMode: () => void,
  };
}

// Использование в компонентах
const { currentTheme, setTheme } = useTheme();
```

### store/hooks.ts (Redux Hooks)

```typescript
// Готовые хуки для типизированной работы с Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Использование
const dispatch = useAppDispatch();
const { theme } = useAppSelector(state => state.app);
```

---

## 🔄 МАРШРУТИЗАЦИЯ

### Структура маршрутов (React Router v6)

```
                        App.tsx (Provider, ErrorBoundary)
                              ↓
                        AppContent (инициализация)
                              ↓
                        HashRouter
                              ↓
                    ┌─────────┴──────────┐
                    ↓                    ↓
            ProjectsPortfolio/      /cms/
            (коммерческое          (основное
             предложение)           приложение)
                  ↓                    ↓
         ConsultingHome         MainLayout
         ServicesPage          (Header, Sidebar
         CasesPage             Content)
         ITProjectsPage              ↓
         BrandStoryPage        Route по модулям:
         CommercialOffer       - registry
                               - portfolio
                               - monitoring
                               - tasks
                               - reports
                               - settings/*
                               - ...
```

### Маршруты (App.tsx)

```typescript
<HashRouter>  // Использует # для навигации (для GitHub Pages)
  <Routes>
    {/* Основная страница (коммерческое предложение) */}
    <Route path="/" element={<ProjectsPortfolioPage />}>
      <Route index element={<ITProjectsPage />} />
      <Route path="home" element={<ConsultingHomePage />} />
      <Route path="services" element={<ServicesPage />} />
      <Route path="cases" element={<CasesPage />} />
      <Route path="projects" element={<ITProjectsPage />} />
      <Route path="about" element={<BrandStoryPage />} />
      <Route path="offer" element={<CommercialOfferPage />} />
    </Route>

    {/* Редирект старых путей */}
    <Route path="registry" element={<Navigate to="/cms/registry" replace />} />
    <Route path="portfolio" element={<Navigate to="/cms/portfolio" replace />} />
    {/* ... более редиректов ... */}

    {/* Основное приложение */}
    <Route path="cms" element={<MainLayout />}>
      <Route index element={<Navigate to="registry" replace />} />
      <Route path="registry" element={<ExtendedRegistryPage />} />
      <Route path="portfolio" element={<PortfolioPage />} />
      <Route path="monitoring" element={<MonitoringPage />} />
      <Route path="tasks" element={<TasksPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="inspection/:token" element={<MobileInspectionPage />} />
      <Route path="settings/employees" element={<EmployeesPage />} />
      <Route path="settings/reference-data" element={<ReferenceDataPage />} />
      <Route path="settings/workflow" element={<WorkflowSettingsPage />} />
      {/* ... и т.д. */}
    </Route>
  </Routes>
</HashRouter>
```

### URL примеры

```
/#/                       # Главная страница
/#/services               # Услуги
/#/cases                  # Кейсы
/#/cms/registry           # Реестр залоговых объектов
/#/cms/portfolio          # Портфель ссуд
/#/cms/tasks              # Управление задачами
/#/cms/monitoring         # Мониторинг
/#/cms/inspection/abc123  # Мобильный осмотр (по токену)
/#/cms/settings/employees # Настройки сотрудников
```

---

## 🌐 ИНТЕГРАЦИИ С ВНЕШНИМИ СИСТЕМАМИ

### DaData API (подсказки адресов)

**Endpoint:** `https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address`

**Использование:**
```typescript
const addresses = await daDataService.suggestAddress('Москва, ул. Ле');
// Возвращает список подсказок с координатами
```

**Сервис:** `src/services/DaDataService.ts`

### Zadachnik (система управления задачами)

**Интеграция:** `syncEmployeesToZadachnik.ts`

**Функциональность:**
- Синхронизация сотрудников
- Синхронизация задач
- Обновление статусов

### Внешние AI системы

- **DeepSeekService** — интеграция с DeepSeek AI
- **AppraisalAIService** — AI для оценки стоимости
- **ImageGenerationService** — генерация изображений

---

## 📋 СПРАВОЧНИКИ И СЛОВАРИ

### Справочник региональных центров

**Файл:** `src/utils/regionCenters.ts`

```typescript
export const REGION_CENTERS = [
  { code: 'SPB', name: 'Санкт-Петербург', city: 'Санкт-Петербург' },
  { code: 'MSK', name: 'Москва', city: 'Москва' },
  { code: 'EKB', name: 'Екатеринбург', city: 'Екатеринбург' },
  { code: 'NSK', name: 'Новосибирск', city: 'Новосибирск' },
  { code: 'KZN', name: 'Казань', city: 'Казань' },
  { code: 'RST', name: 'Ростов-на-Дону', city: 'Ростов-на-Дону' },
];
```

### Справочник должностей

Встроен в `EmployeeService`:
```typescript
const positions = [
  'Оператор', 'Менеджер', 'Оценщик',
  'Мониторер', 'Руководитель отдела', ...
];
```

### Справочник типов залога

Встроен в `classification.ts`:
```typescript
// Иерархия classificсation в 3 уровня
// Level 0: Коммерческая, Жилая, Промышленная
// Level 1: Конкретные типы (офис, квартира, земля)
// Level 2: Вид (здание, помещение, участок)
```

### Справочник кодов Центробанка

Встроен в каждом классификаторе:
```typescript
cbCode: number; // 2010 - квартира, 2020 - офис и т.д.
```

### Справочник риск-событий

**Файл:** `src/types/creditRisk.ts`

```typescript
export const RISK_EVENTS = [
  { id: 'risk_001', code: '001', name: 'Изменение состава предмета залога', ... },
  { id: 'risk_002', code: '002', name: 'Нарушение условий хранения', ... },
  // ~ 20 событий
];
```

### Справочник видов документов

**Файл:** `src/utils/documentTypesMapping.ts`

```typescript
const documentTypes = [
  { id: 'passport', name: 'Паспорт' },
  { id: 'ownership', name: 'Свидетельство собственности' },
  { id: 'title_deed', name: 'Выписка из ЕГРN' },
  // ... и т.д.
];
```

---

## 📊 ДИАГРАММА ПОТОКА ДАННЫХ

```
┌──────────────────────────────────────────────────────────────┐
│                    Пользователь (браузер)                    │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   React UI   │
                   │ (компоненты) │
                   └──────┬───────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    Redux Store    React State      Contexts
    (глобальное)  (локальное)    (ThemeContext,
                                  DemoDataContext)
         │                │                │
         └────────────────┼────────────────┘
                          │
                    ┌─────▼─────┐
                    │  Сервисы  │
                    │ (Business │
                    │  Logic)   │
                    └─────┬─────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
    IndexedDB        localStorage      DaData API
    (основные        (настройки,      (подсказки
    данные)          справочники)      адресов)
```

---

## 🚀 ЗАПУСК И РАЗВЕРТЫВАНИЕ

### Требуемый Node.js версия
- Node.js 16+ (тестировано на Node 18+)
- npm 8+

### Команды разработки

```bash
# Установка зависимостей
npm install

# Запуск dev сервера (Vite)
npm run dev
# Доступно на http://localhost:5173/

# Сборка для production
npm run build
# Результат в папке dist/

# Проверка качества кода
npm run lint

# Проверка типов TypeScript
npm run type-check

# Развертывание на GitHub Pages
npm run deploy
```

### Структура сборки

```typescript
// vite.config.ts (примерная конфигурация)
{
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}
```

---

## 📝 СОГЛАШЕНИЯ О КОДИРОВАНИИ

### Именование переменных

```typescript
// Сущности
interface User { }
interface Employee { }

// Boolean переменные
const isActive = true;
const canEdit = false;
const hasPermission = true;

// Коллекции (множественное число)
const employees: Employee[] = [];
const cardIds: string[] = [];

// Стейт
const [isLoading, setIsLoading] = useState(false);
const [selectedCard, setSelectedCard] = useState<Collateral | null>(null);
```

### Структура файлов компонентов

```typescript
// SomeComponent.tsx

import React from 'react';
import styles from './SomeComponent.css';
import { SomeInterface } from '@/types';

interface Props {
  title: string;
  onAction?: () => void;
}

const SomeComponent: React.FC<Props> = ({ title, onAction }) => {
  return (
    <div className={styles.container}>
      {title}
    </div>
  );
};

export default SomeComponent;
```

### Типизация Redux

```typescript
// Всегда используется TypedUseSelectorHook
import { useAppDispatch, useAppSelector } from '@/store/hooks';

// Вместо обычных
import { useDispatch, useSelector } from 'react-redux';
```

---

## ⚠️ ИЗВЕСТНЫЕ ОГРАНИЧЕНИЯ И ПРОБЛЕМЫ

1. **localStorage лимит 5-10 MB**
   - Решение: большие данные хранятся в IndexedDB
   - Демо-данные отчищаются при запуске

2. **CORS при запросах к API**
   - DaData работает только с CORS-дружественными браузерами
   - Локальное развертывание может требовать прокси

3. **IndexedDB не поддерживает все напрямую**
   - Date объекты сохраняются как ISO строки
   - Redux игнорирует серализацию для Date полей

4. **Производительность с большими наборами данных**
   - При 100000+ объектов можно ожидать замедления
   - Нужна паджинация или виртуализация списков

5. **Синхронизация между вкладками браузера**
   - IndexedDB обновляется независимо в каждой вкладке
   - Может требоваться ручная синхронизация

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

### Документация библиотек
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Ant Design](https://ant.design/)
- [Dexie.js](https://dexie.org/)
- [React Router v6](https://reactrouter.com/)

### Структура проекта
- Смотрите `PROJECT_STRUCTURE.md` для визуальной иерархии
- Смотрите `ARCHITECTURE.md` для деталей архитектуры

---

## 🔐 БЕЗОПАСНОСТЬ И ПРИВАТНОСТЬ

### Хранение данных
- Все данные хранятся локально в браузере (IndexedDB + localStorage)
- Данные не отправляются на сервер (кроме DaData API для адресов)
- При очистке кэша браузера все данные удаляются

### Аутентификация
- На текущий момент аутентификация НЕ РЕАЛИЗОВАНА
- Система предполагает, что пользователь уже авторизован
- Роли и разрешения хранятся в `EmployeeService` (localStorage)

### Рекомендации для production

1. Добавить механизм аутентификации (OAuth, JWT)
2. Перенести данные на backend сервер
3. Реализовать шифрование чувствительных данных
4. Добавить аудит логирование
5. Использовать HTTPS для всех запросов

---

**Конец документа**

Последнее обновление: Февраль 2026 г.
Версия: 2.0.1
Автор: Архитектор системы CMS
