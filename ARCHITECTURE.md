# 🏗️ Архитектура CarShop CMS

## Общая схема системы

```
┌─────────────────────────────────────────────────────────────┐
│                    CarShop CMS v2.0.0                       │
│                 (React 18 + TypeScript)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
         ┌──────▼──────┐            ┌──────▼──────┐
         │   Frontend  │            │   Storage   │
         │  (Browser)  │            │ (IndexedDB) │
         └──────┬──────┘            └──────┬──────┘
                │                           │
    ┌───────────┴───────────┐               │
    │                       │               │
┌───▼───┐            ┌─────▼─────┐    ┌────▼────┐
│  UI   │            │   State   │    │   DB    │
│ Layer │◄──────────►│  Redux    │◄──►│ Dexie   │
└───────┘            │  Toolkit  │    │   v2    │
                     └───────────┘    └─────────┘
```

## Слои приложения

### 1. UI Layer (Presentation)

```
components/
  ├── layout/           Структура приложения
  │   ├── MainLayout    → Главный контейнер
  │   ├── Header        → Верхняя панель
  │   └── SidebarMenu   → Навигация
  │
  └── common/           Переиспользуемые компоненты
      ├── Forms         → Формы ввода
      ├── Tables        → Отображение данных
      └── Managers      → Управление сущностями
```

### 2. Business Logic Layer

```
modules/
  ├── Registry/         Модуль реестров (✅ готов)
  │   ├── ExtendedRegistryPage
  │   └── RegistryPage
  │
  ├── MobileAppraiser/  Мобильный оценщик (⏳ план)
  ├── SmartDeal/        SmartDeal (⏳ план)
  ├── Reports/          Отчеты (⏳ план)
  ├── Monitoring/       Мониторинг (⏳ план)
  └── Settings/         Настройки (⏳ план)
```

### 3. State Management Layer

```
store/
  ├── index.ts          → Store configuration
  ├── hooks.ts          → Typed hooks
  │
  └── slices/
      ├── appSlice      → App settings (theme, sidebar)
      ├── cardsSlice    → Basic cards
      └── extendedCardsSlice → Extended cards ⭐
```

### 4. Data Access Layer

```
services/
  ├── StorageService.ts          → Basic IndexedDB (v1)
  └── ExtendedStorageService.ts  → Extended IndexedDB (v2) ⭐
```

### 5. Domain Layer

```
types/
  ├── index.ts          → Core types
  ├── stage3Types.ts    → Module types
  └── stage4Types.ts    → Settings types
```

### 6. Utilities Layer

```
utils/
  ├── classification.ts            → Basic classification
  ├── extendedClassification.ts   → Extended (60+ types) ⭐
  ├── characteristicsConfig.ts    → Field configs (150+) ⭐⭐
  ├── helpers.ts                  → Common helpers
  ├── performance.ts              → Performance utils
  ├── sampleData.ts               → Sample data
  └── demoData.ts                 → Demo data
```

---

## Потоки данных

### Поток создания карточки:

```
User Action
    │
    ▼
CollateralCardForm (5 tabs)
    │
    ├─► ObjectTypeSelector → Определяет ObjectTypeKey
    ├─► PartnerManager → Добавляет партнеров
    ├─► AddressInput → Формирует адрес
    ├─► DynamicCharacteristicsForm → Показывает поля по типу
    └─► DocumentManager → Загружает файлы
    │
    ▼
handleSubmit()
    │
    ▼
ExtendedStorageService.saveExtendedCard()
    │
    ▼
IndexedDB (collateralCards table)
    │
    ▼
dispatch(addExtendedCard())
    │
    ▼
Redux Store (extendedCards.items)
    │
    ▼
ExtendedRegistryPage re-renders
    │
    ▼
BaseTable shows new card
```

### Поток загрузки данных:

```
App initialization
    │
    ▼
ExtendedStorageService.initDatabase()
    │
    ▼
IndexedDB opens (version 2)
    │
    ├─► Миграция с v1 (если нужно)
    └─► Инициализация settings
    │
    ▼
ExtendedStorageService.getExtendedCards()
    │
    ▼
IndexedDB query
    │
    ▼
dispatch(setExtendedCards())
    │
    ▼
Redux Store populated
    │
    ▼
Components render with data
```

### Поток динамических характеристик:

```
User selects classification
    │
    ▼
ObjectTypeSelector.onChange()
    │
    ├─► level0: "Жилая недвижимость"
    ├─► level1: "Квартира"
    └─► level2: "Помещение"
    │
    ▼
getExtendedCBCode() → 2010
    │
    ▼
getObjectTypeKey() → 'apartment'
    │
    ▼
DynamicCharacteristicsForm receives objectType
    │
    ▼
getCharacteristicsConfig('apartment')
    │
    ▼
Returns 12 fields: [totalArea, livingArea, ...]
    │
    ▼
Form renders fields dynamically
```

---

## IndexedDB Schema

### Version 2 (Current)

```sql
Database: CMSDatabase

Table: collateralCards
  - id (primary key)
  - mainCategory (indexed)
  - status (indexed)
  - number (indexed)
  - name (indexed)
  - cbCode (indexed)
  - createdAt (indexed)
  - updatedAt (indexed)
  - classification (object)
  - partners (array)
  - address (object)
  - characteristics (object)
  - documents (array)

Table: partners
  - id (primary key)
  - type (indexed)
  - role (indexed)
  - inn (indexed)
  - lastName (indexed)
  - organizationName (indexed)
  - ... other fields

Table: documents
  - id (primary key)
  - name (indexed)
  - type (indexed)
  - category (indexed)
  - uploadDate (indexed)
  - fileData (base64 string)
  - ... other fields

Table: settings
  - id (primary key, always 'app-settings')
  - theme
  - language
  - sidebarCollapsed
```

---

## React Component Tree

```
App (ErrorBoundary wrapper)
  │
  └─► Provider (Redux store)
      │
      └─► ConfigProvider (Ant Design theme)
          │
          └─► BrowserRouter
              │
              └─► Routes
                  │
                  └─► MainLayout
                      │
                      ├─► SidebarMenu
                      │   └─► Menu items (8)
                      │
                      ├─► Header
                      │   ├─► Search
                      │   ├─► Theme toggle
                      │   └─► User menu
                      │
                      └─► Outlet
                          │
                          └─► ExtendedRegistryPage ⭐
                              │
                              ├─► Breadcrumbs
                              ├─► Action buttons
                              ├─► Search input
                              │
                              ├─► Table
                              │   └─► Columns (10)
                              │
                              └─► Modal
                                  │
                                  └─► CollateralCardForm
                                      │
                                      └─► Tabs (5)
                                          ├─► Tab 1: Basic info
                                          │   └─► ObjectTypeSelector
                                          ├─► Tab 2: Partners
                                          │   └─► PartnerManager
                                          ├─► Tab 3: Address
                                          │   └─► AddressInput
                                          ├─► Tab 4: Characteristics
                                          │   └─► DynamicCharacteristicsForm
                                          └─► Tab 5: Documents
                                              └─► DocumentManager
```

---

## Redux Store Structure

```typescript
RootState {
  app: {
    theme: 'light' | 'dark',
    language: 'ru' | 'en',
    sidebarCollapsed: boolean,
    loading: boolean,
    initialized: boolean
  },
  
  cards: {
    items: CollateralCard[],        // Базовые (v1)
    filteredItems: CollateralCard[],
    selectedCard: CollateralCard | null,
    filters: FilterParams,
    sort: SortParams | null,
    loading: boolean,
    error: string | null
  },
  
  extendedCards: {                  // ⭐ Расширенные (v2)
    items: ExtendedCollateralCard[],
    filteredItems: ExtendedCollateralCard[],
    selectedCard: ExtendedCollateralCard | null,
    filters: ExtendedFilterParams,
    sort: SortParams | null,
    loading: boolean,
    error: string | null
  }
}
```

---

## TypeScript Type System

```
Core Types (index.ts)
  ├── MainCategory
  ├── CardStatus
  ├── RealEstateHierarchy
  ├── CollateralCard
  ├── ExtendedCollateralCard ⭐
  ├── Partner
  ├── Address
  ├── Document
  ├── CharacteristicField
  ├── ObjectTypeKey (18 types)
  └── ... 50+ more types

Module Types (stage3Types.ts)
  ├── MobileAppraiser module (10+ types)
  ├── SmartDeal module (15+ types)
  ├── Reports module (10+ types)
  └── Extended documents (5+ types)

Settings Types (stage4Types.ts)
  ├── Settings module (10+ types)
  ├── Monitoring module (10+ types)
  ├── Role system (5+ types)
  └── Performance (5+ types)
```

---

## Build Output

```
dist/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].js         Main chunk
  │   ├── react-vendor-[hash].js  React + Router
  │   ├── antd-vendor-[hash].js   Ant Design + Icons
  │   ├── redux-vendor-[hash].js  Redux
  │   └── index-[hash].css        Styles
  └── vite.svg
```

**Оптимизация:**
- Code splitting на 3 vendor chunks
- Tree shaking
- Минификация
- Source maps (опционально)

---

## Patterns и Best Practices

### Component Pattern:

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Component } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

// 2. Types
interface MyComponentProps {
  value?: any;
  onChange?: (value: any) => void;
}

// 3. Component
const MyComponent: React.FC<MyComponentProps> = ({ value, onChange }) => {
  // Hooks
  const dispatch = useAppDispatch();
  const state = useAppSelector(selector);
  const [local, setLocal] = useState();

  // Effects
  useEffect(() => {}, []);

  // Handlers
  const handleAction = () => {};

  // Render
  return <div>...</div>;
};

export default MyComponent;
```

### Service Pattern:

```typescript
class MyService {
  private db: Database;

  async getData(): Promise<Data[]> {
    return await this.db.table.toArray();
  }

  async saveData(data: Data): Promise<void> {
    await this.db.table.put(data);
  }
}

export const myService = new MyService();
```

### Redux Slice Pattern:

```typescript
const mySlice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
  },
});
```

---

## Модульность

### Принцип разделения:

**Components** → UI only, no business logic  
**Modules** → Feature grouping, pages  
**Store** → State management  
**Services** → Data access  
**Utils** → Pure functions  
**Types** → Type definitions  

### Зависимости:

```
App
  └─► Modules
      └─► Components
          └─► Utils
              └─► Types

Services
  └─► Utils
      └─► Types

Store
  └─► Types
```

**Правило:** Нет циклических зависимостей!

---

## Масштабируемость

### Текущая (v2.0):

**Поддерживает:**
- До 5000 карточек
- До 50 MB документов
- До 1000 партнеров
- Offline работа

**Оптимизировано для:**
- 100-1000 карточек
- 10-20 MB документов
- Быстрый поиск и фильтрация

### Будущая (v3.0+):

**Планируется:**
- Backend API
- PostgreSQL
- До 100,000+ карточек
- Неограниченные документы (S3)
- Многопользовательский режим
- Real-time синхронизация

---

## Security

### Текущая версия:

**Client-side only:**
- ✅ IndexedDB (локальное хранилище)
- ✅ Input validation
- ✅ XSS protection (React автоматически)
- ⚠️ Нет аутентификации (single-user)
- ⚠️ Нет авторизации (все права)

### Планируется (Этап 4):

**Ролевая модель:**
- Аутентификация пользователей
- 5 ролей (admin, manager, appraiser, auditor, viewer)
- Права на модули и операции
- Аудит действий

---

## Performance

### Current optimizations:

✅ **Code splitting** - 3 vendor bundles  
✅ **Tree shaking** - unused code removed  
✅ **Minification** - production builds  
✅ **Lazy loading** ready  
✅ **IndexedDB** - fast local storage  

### Planned optimizations:

⏳ **Virtualization** - для списков 1000+ items  
⏳ **React.memo** - для expensive components  
⏳ **Service Worker** - для offline + cache  
⏳ **Image optimization** - для больших фото  
⏳ **Pagination** - server-side (с backend)  

---

## Testing Strategy (Planned)

### Unit Tests:

```
src/**/__tests__/
  ├── components/
  ├── utils/
  └── services/
```

**Coverage target:** 70%+

### E2E Tests:

```
e2e/
  ├── registry.spec.ts
  ├── forms.spec.ts
  └── export.spec.ts
```

**Tool:** Playwright или Cypress

### Integration Tests:

```
tests/integration/
  ├── storage.test.ts
  ├── redux.test.ts
  └── navigation.test.ts
```

---

## Deployment Architecture

### Development:

```
Developer
  ↓
npm run dev
  ↓
Vite Dev Server (localhost:3000)
  ↓
Browser (with HMR)
```

### Production (GitHub Pages):

```
Developer
  ↓
git push origin main
  ↓
GitHub Actions
  ├─► npm ci
  ├─► npm run build
  └─► deploy to gh-pages
  ↓
GitHub Pages CDN
  ↓
Users' Browsers
```

### Alternative (Vercel/Netlify):

```
Developer
  ↓
git push
  ↓
Auto-build
  ↓
Global CDN
  ↓
Users
```

---

## Data Flow: Complete Example

### Создание карточки квартиры:

```
1. User clicks "Создать карточку"
   │
   ▼
2. CollateralCardForm opens (Modal)
   │
   ▼
3. User fills Tab 1: Жилая → Квартира → Помещение
   │
   ├─► ObjectTypeSelector determines code: 2010
   └─► Triggers: getObjectTypeKey() → 'apartment'
   │
   ▼
4. User goes to Tab 4 (Characteristics)
   │
   ├─► DynamicCharacteristicsForm receives objectType='apartment'
   ├─► getCharacteristicsConfig('apartment')
   └─► Renders 12 fields (площадь, этаж, комнаты...)
   │
   ▼
5. User fills all fields + other tabs
   │
   ▼
6. User clicks "Создать карточку"
   │
   ▼
7. Form validation
   │
   ▼
8. handleSubmit() collects data from all tabs
   │
   ▼
9. ExtendedStorageService.saveExtendedCard()
   │
   ├─► Serialize data
   ├─► Transform dates
   └─► Put into IndexedDB
   │
   ▼
10. dispatch(addExtendedCard())
   │
   ▼
11. Redux state updates
   │
   ▼
12. ExtendedRegistryPage re-renders
   │
   ▼
13. New card appears in table
   │
   ▼
14. Success message shown
```

---

## Future Architecture (v3.0+)

### With Backend:

```
┌─────────────┐         ┌──────────────┐        ┌──────────┐
│   Browser   │◄───────►│  REST API    │◄──────►│   DB     │
│  (React)    │  HTTP   │  (Node.js)   │  SQL   │(Postgres)│
└─────────────┘         └──────────────┘        └──────────┘
      │                        │                      │
      │                        │                      │
  IndexedDB              Redis Cache            Backups
  (Offline)              (Session)              (S3)
```

### Microservices (Future):

```
┌─────────────────────────────────────┐
│          API Gateway                │
└─────────────┬───────────────────────┘
              │
    ┌─────────┼─────────┬─────────┬──────────┐
    │         │         │         │          │
┌───▼───┐ ┌──▼──┐ ┌────▼────┐ ┌──▼───┐ ┌───▼────┐
│ Cards │ │Auth │ │Documents│ │Reports│ │Appraisal│
│Service│ │     │ │ Service │ │Service│ │ Service │
└───────┘ └─────┘ └─────────┘ └───────┘ └────────┘
```

---

## Заключение

**Текущая архитектура (v2.0):**
- ✅ Простая и понятная
- ✅ Модульная и масштабируемая
- ✅ Type-safe (TypeScript)
- ✅ Готова к production (базовый функционал)

**Будущая архитектура:**
- Backend API
- Микросервисы
- Real-time синхронизация
- Масштабирование до enterprise

---

**Версия:** 2.0.0  
**Дата:** 7 октября 2024  
**Статус:** ✅ Production Ready

