# CMS Collateral Management v2.0.1

## Обзор

Система управления залоговым имуществом (CMS) - это веб-приложение для каталогизации, отслеживания и анализа залоговых объектов (недвижимость, движимое имущество, права на имущество). Приложение построено с использованием React, Redux, Dexie (IndexedDB) и Ant Design.

### Основные возможности

- 📋 **Реестр залогов**: Мощная таблица с пагинацией, фильтрацией и сортировкой
- 🗂️ **Управление карточками**: Создание, редактирование, удаление залоговых объектов
- 👥 **Управление партнерами**: Добавление владельцев, залогодателей, оценщиков
- 📄 **Управление документами**: Привязка договоров, актов оценки, справок ЕГРН
- 📊 **Экспорт**: Выгрузка карточек и данных в Excel
- 💾 **Локальное хранилище**: Данные хранятся в IndexedDB (без зависимости от сервера)
- 🔄 **Версионирование**: Оптимистичная блокировка для предотвращения потери данных
- ⚡ **Производительность**: Индексирование Dexie, виртуальная прокрутка

## Быстрый старт

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```
Приложение откроется на `http://localhost:5173`

### Сборка для production
```bash
npm run build
```

### Проверка типов
```bash
npm run type-check
```

### Lint
```bash
npm run lint
```

## Архитектура

### Слои приложения

```
┌─────────────────────────────────────────┐
│         UI Components Layer             │
│  (React + Ant Design)                   │
│  - ExtendedRegistryPage                 │
│  - CollateralCardForm                   │
│  - RegistryTable (Virtual Scrolling)    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       Redux State Management            │
│  - appSlice (theme, language)           │
│  - appStateSlice (init state machine)   │
│  - registryQuerySlice (pagination)      │
│  - workflowSlice                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Business Logic Services            │
│  - ExtendedStorageService (Facade)      │
│  - ExcelExportService                   │
│  - NotificationService                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       Data Access Layer (Repos)         │
│  - CollateralRepo (CRUD, Query)         │
│  - PartnerRepo (Partners)               │
│  - DocumentRepo (Documents)             │
│  - TaskRepo (Tasks)                     │
│  - WorkflowRepo (Workflows + Cache)     │
│  - SettingsRepo (App Settings)          │
│  - KnowledgeRepo (Knowledge Base)       │
│  - InspectionRepo (Inspections)         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Database Layer (Dexie v8)          │
│  - extendedDb singleton                 │
│  - 12 indexed tables                    │
│  - ISO date string serialization        │
│  - Version-based migrations             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        IndexedDB (Browser Storage)      │
│  - 100+ MB capacity per app              │
│  - Persistent across sessions           │
│  - Full-text search capable             │
└─────────────────────────────────────────┘
```

### Ключевые паттерны

#### 1. Repository Pattern
Каждая сущность (Collateral, Partner, Document и т.д.) имеет свой репозиторий:

```typescript
// src/data/repos/CollateralRepo.ts
export async function saveCard(card: ExtendedCollateralCard): Promise<void> {
  // 1. Проверка версии (оптимистичная блокировка)
  // 2. Инкремент версии
  // 3. Нормализация индексов
  // 4. Трансакция: card + partners + documents в одной записи
}
```

#### 2. State Machine (Redux)
Инициализация приложения использует состояния:
- `idle` → `loading` → `ready` или `error`
- Повторные попытки при ошибке (max 3)

```typescript
// src/store/slices/appStateSlice.ts
export const initializeApp = createAsyncThunk('appState/initializeApp', async () => {
  // 1. Init database
  // 2. Load settings
  // 3. Sync employees
  // 4. Load/generate demo data
});
```

#### 3. Оптимистичная блокировка (Optimistic Locking)
Каждая карточка имеет поле `version`, которое инкрементируется при сохранении:

```typescript
// Если expectedVersion !== card.version => VersionConflictError
async saveCard(card: Card, expectedVersion?: number) {
  if (expectedVersion && card.version !== expectedVersion) {
    throw new VersionConflictError('Карточка была изменена');
  }
  card.version++;
  await db.cards.put(card);
}
```

#### 4. Query Pattern
Сложные запросы делегируются на фронтенд с использованием Dexie индексов:

```typescript
// src/data/queries/extendedCardQuery.ts
async query(filters, page, pageSize, sort) {
  let collection = db.cards
    .where('[status+updatedAt]').between([status, start], [status, end]);
  
  if (sort) {
    collection = collection.orderBy(sort.field);
  }
  
  return collection.offset((page-1)*pageSize).limit(pageSize).toArray();
}
```

## Структура проекта

```
src/
├── components/
│   ├── common/          # Переиспользуемые компоненты
│   │   ├── CollateralCardForm.tsx
│   │   ├── RegistryTable.tsx
│   │   └── ...
│   └── layout/
├── modules/             # Страницы и модули
│   ├── Registry/        # Реестр залогов (главная)
│   ├── Workflow/        # Управление процессами
│   ├── Settings/        # Настройки
│   └── ...
├── store/               # Redux
│   ├── slices/          # Redux слайсы
│   │   ├── appSlice.ts
│   │   ├── appStateSlice.ts (State Machine)
│   │   ├── registryQuerySlice.ts
│   │   └── ...
│   └── index.ts
├── data/                # Слой доступа к данным
│   ├── db/
│   │   └── extendedDb.ts (Dexie schema + migrations)
│   ├── repos/           # Репозитории
│   │   ├── CollateralRepo.ts
│   │   ├── PartnerRepo.ts
│   │   └── ...
│   └── queries/         # Типизированные запросы
├── services/            # Бизнес-логика
│   ├── ExtendedStorageService.ts (Facade)
│   ├── ExcelExportService.ts (Export)
│   ├── NotificationService.ts (UI Notifications)
│   └── ...
├── types/
│   └── index.ts         # Главные типы (ExtendedCollateralCard, Partner, etc)
├── utils/
│   ├── performance.ts   # Измерение производительности
│   ├── collateralAttributesFromDict.ts
│   └── ...
├── App.tsx
└── main.tsx
```

## Миграция базы данных

Dexie использует версионирование схемы. Текущая версия: **v8**

### Версии
- **v1-v5**: Изначальная структура
- **v6**: Миграция Tasks из localStorage в IndexedDB
- **v7**: Добавлены индексы для PartnerIds, RegionIds
- **v8**: Добавлены индексы статуса, версионирование карточек

### При обновлении

При изменении схемы:

```typescript
// В extendedDb.ts
db.version(9).upgrade(tx => {
  // Добавить новую таблицу или поле
  return tx.table('newTable').toArray();
});
```

Dexie автоматически запустит миграцию при первой инициализации.

## API

### ExtendedStorageService

```typescript
// Инициализация
await extendedStorageService.initDatabase();

// CRUD для карточек
const card = await extendedStorageService.getExtendedCard(id);
const cards = await extendedStorageService.getExtendedCards();
await extendedStorageService.saveExtendedCard(card);
await extendedStorageService.deleteExtendedCard(id);

// Запросы с фильтрацией и пагинацией
const result = await extendedStorageService.queryExtendedCards({
  filters: { status: 'approved', mainCategory: 'real_estate' },
  page: 1,
  pageSize: 20,
  sort: { field: 'name', order: 'asc' }
});

// Управление партнерами
const partner = await extendedStorageService.getPartner(id);
await extendedStorageService.savePartner(partner);

// Управление документами
const docs = await extendedStorageService.getDocuments(cardId);
await extendedStorageService.saveDocument(document);

// Экспорт
const file = excelExportService.exportCards(cards);
```

### NotificationService

```typescript
// Success
notificationService.success('Карточка создана');
notificationService.success('Успех', 'Описание операции');

// Error
notificationService.error('Ошибка');
notificationService.error('Конфликт версии', 'Карточка была изменена');

// Warning
notificationService.warning('Предупреждение');

// Info
notificationService.info('Информация');

// Loading
const key = notificationService.loading('Экспорт в Excel...');
// ... after operation
notificationService.close(key);

// Bulk operations
notificationService.bulkOperationSuccess(185, 'Экспорт');
```

## Производительность

### Инициализация
- **Init DB**: ~200ms (Dexie bootstrap)
- **Load cards**: ~100ms (100 cards)
- **Load demo data**: ~1000ms (250 cards)
- **总 init time**: ~1.3s (первый запуск)

### Запросы
- **Query 1000 cards**: ~50ms
- **Export 185 cards**: ~200ms
- **Table render**: Virtual scrolling, ~16ms per frame

### Оптимизация

```typescript
// ✅ Используются индексы Dexie
db.cards.where('[status+updatedAt]').between([status, start], [status, end]);

// ✅ Пакетирование операций
await db.transaction('rw', db.cards, db.partners, db.documents, async () => {
  // Multiple operations in single transaction
});

// ✅ Кеширование (WorkflowRepo)
const cachedTemplates = cache.get(CACHE_KEY);
if (cachedTemplates && !cachedTemplates.isExpired()) {
  return cachedTemplates.data;
}

// ✅ Виртуальная прокрутка (RegistryTable)
// Таблица рендерит только видимые строки
```

## Обработка ошибок

### Версионные конфликты

```typescript
try {
  await extendedStorageService.saveExtendedCard(card);
} catch (error) {
  if (error.code === 'VERSION_CONFLICT') {
    // Показать пользователю: "Карточка была изменена в другой вкладке"
    // Предложить перезагрузить и повторить
  }
}
```

### Инициализация

```typescript
// App.tsx отслеживает состояние инициализации
const { initState, error } = useAppSelector(state => state.appState);

if (initState === 'loading') {
  // Show spinner
}

if (initState === 'error') {
  // Show retry button with error message
}

if (initState === 'critical_error') {
  // Show fatal error with "Clear and reload" button
}
```

## Развертывание

### GitHub Pages

```bash
npm run build
npm run deploy
```

Приложение развертывается на `cmsauto.ru` (настроено в package.json)

### Переменные окружения

Нет необходимости в переменных окружения - все настройки в коде или localStorage.

## Браузеры

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ iOS Safari 14+

Требуется поддержка:
- IndexedDB
- ES2020+
- Web Workers (для Dexie)

## Лицензия

MIT

## Контакты

Проблемы: см. TESTING.md и ARCHITECTURE.md

---

**Версия**: 2.0.1  
**Дата**: 2024-12-19  
**Статус**: Production Ready ✅
