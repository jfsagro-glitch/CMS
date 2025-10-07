# 📂 Структура проекта CarShop CMS

## Полная структура директорий

```
CMS/
│
├── 📁 .vscode/                      # Конфигурация VS Code
│   ├── extensions.json              # Рекомендуемые расширения
│   └── settings.json                # Настройки редактора
│
├── 📁 public/                       # Статические файлы
│   └── vite.svg                     # Иконка Vite
│
├── 📁 src/                          # Исходный код
│   │
│   ├── 📁 components/               # React компоненты
│   │   ├── 📁 layout/               # Layout компоненты
│   │   │   ├── MainLayout.tsx       # Главный layout
│   │   │   ├── SidebarMenu.tsx      # Боковое меню
│   │   │   └── Header.tsx           # Верхняя панель
│   │   │
│   │   └── 📁 common/               # Переиспользуемые компоненты
│   │       ├── ObjectTypeSelector.tsx  # Выбор типа объекта
│   │       ├── BaseTable.tsx           # Базовая таблица
│   │       └── CardForm.tsx            # Форма карточки
│   │
│   ├── 📁 modules/                  # Feature модули (страницы)
│   │   ├── 📁 Registry/             # Модуль реестра
│   │   │   └── RegistryPage.tsx     # Страница реестра
│   │   │
│   │   └── 📁 Placeholder/          # Заглушки
│   │       └── PlaceholderPage.tsx  # Страница-заглушка
│   │
│   ├── 📁 store/                    # Redux store
│   │   ├── 📁 slices/               # Redux slices
│   │   │   ├── appSlice.ts          # Slice настроек приложения
│   │   │   └── cardsSlice.ts        # Slice карточек
│   │   │
│   │   ├── hooks.ts                 # Типизированные хуки
│   │   └── index.ts                 # Конфигурация store
│   │
│   ├── 📁 services/                 # Сервисы
│   │   └── StorageService.ts        # Работа с IndexedDB
│   │
│   ├── 📁 types/                    # TypeScript типы
│   │   └── index.ts                 # Все интерфейсы и типы
│   │
│   ├── 📁 utils/                    # Утилиты
│   │   ├── classification.ts        # Классификация объектов
│   │   ├── helpers.ts               # Вспомогательные функции
│   │   └── sampleData.ts            # Примеры данных
│   │
│   ├── App.tsx                      # Главный компонент приложения
│   ├── main.tsx                     # Точка входа
│   ├── index.css                    # Глобальные стили
│   └── vite-env.d.ts               # Vite type definitions
│
├── 📄 index.html                    # HTML шаблон
│
├── 📄 package.json                  # Зависимости и скрипты
├── 📄 package-lock.json            # (создается при npm install)
│
├── 📄 tsconfig.json                 # TypeScript конфигурация
├── 📄 tsconfig.node.json           # TypeScript для Node скриптов
│
├── 📄 vite.config.ts               # Конфигурация Vite
│
├── 📄 .eslintrc.cjs                # ESLint конфигурация
├── 📄 .prettierrc                  # Prettier конфигурация
├── 📄 .gitignore                   # Git ignore правила
│
└── 📁 Документация/
    ├── README.md                    # Главная документация
    ├── INSTALL.md                   # Инструкция по установке
    ├── QUICKSTART.md               # Быстрый старт
    ├── DEVELOPMENT.md              # Руководство разработчика
    ├── CHANGELOG.md                # История изменений
    ├── STAGE1_CHECKLIST.md        # Контрольный список этапа 1
    ├── STAGE1_COMPLETED.md        # Отчет о завершении этапа 1
    └── PROJECT_STRUCTURE.md        # Этот файл
```

## Описание ключевых файлов

### Конфигурация

| Файл | Назначение |
|------|-----------|
| `package.json` | Зависимости проекта и npm скрипты |
| `tsconfig.json` | Настройки TypeScript компилятора |
| `vite.config.ts` | Конфигурация сборщика Vite |
| `.eslintrc.cjs` | Правила линтинга кода |
| `.prettierrc` | Правила форматирования кода |

### Исходный код

| Директория/Файл | Описание |
|----------------|----------|
| `src/components/layout/` | Компоненты структуры приложения |
| `src/components/common/` | Переиспользуемые UI компоненты |
| `src/modules/` | Модули-фичи (страницы приложения) |
| `src/store/` | Redux state management |
| `src/services/` | Сервисы для работы с данными |
| `src/types/` | TypeScript типы и интерфейсы |
| `src/utils/` | Вспомогательные функции |
| `src/App.tsx` | Root компонент с роутингом |
| `src/main.tsx` | Точка входа, рендеринг App |

### Документация

| Файл | Содержание |
|------|-----------|
| `README.md` | Полное описание проекта |
| `INSTALL.md` | Детальная инструкция по установке |
| `QUICKSTART.md` | Быстрый старт для начала работы |
| `DEVELOPMENT.md` | Руководство для разработчиков |
| `CHANGELOG.md` | История всех изменений |
| `STAGE1_CHECKLIST.md` | Чек-лист этапа 1 |
| `STAGE1_COMPLETED.md` | Отчет о завершении этапа 1 |

## Организация кода

### Components

```
components/
├── layout/              # Layout компоненты
│   ├── MainLayout       # Главный layout приложения
│   ├── SidebarMenu      # Боковое меню навигации
│   └── Header           # Верхняя панель
│
└── common/              # Общие компоненты
    ├── ObjectTypeSelector  # Иерархический селектор
    ├── BaseTable           # Универсальная таблица
    └── CardForm            # Форма карточки
```

### Modules

```
modules/
├── Registry/            # Модуль реестра (ГОТОВО)
│   └── RegistryPage     # Управление карточками
│
└── Placeholder/         # Заглушки (для будущих модулей)
    └── PlaceholderPage  # Страница "В разработке"
```

### Store

```
store/
├── slices/              # Redux slices
│   ├── appSlice         # Настройки приложения (тема, язык)
│   └── cardsSlice       # Управление карточками
│
├── hooks.ts             # useAppDispatch, useAppSelector
└── index.ts             # configureStore
```

### Services

```
services/
└── StorageService       # IndexedDB через Dexie.js
    ├── initDatabase()
    ├── saveCollateralCard()
    ├── getCollateralCards()
    ├── deleteCollateralCard()
    ├── exportToExcel()
    ├── importFromExcel()
    ├── exportBackup()
    └── importBackup()
```

### Types

```
types/
└── index.ts
    ├── MainCategory
    ├── CardStatus
    ├── RealEstateHierarchy
    ├── CollateralCard
    ├── FilterParams
    ├── SortParams
    ├── AppSettings
    ├── MenuItem
    └── и другие...
```

### Utils

```
utils/
├── classification.ts    # Классификаторы недвижимости
│   ├── realEstateClassification
│   ├── getCBCode()
│   ├── validateClassification()
│   └── getLevel1/2Options()
│
├── helpers.ts          # Вспомогательные функции
│   ├── generateId()
│   ├── formatDate()
│   ├── downloadFile()
│   └── translateCategory/Status()
│
└── sampleData.ts       # Примеры данных для тестирования
    └── sampleCards[]
```

## Потоки данных

### 1. Загрузка данных
```
App.tsx (useEffect)
  → storageService.getCollateralCards()
    → IndexedDB
      → dispatch(setCards())
        → Redux Store
          → Components (useAppSelector)
```

### 2. Создание карточки
```
CardForm (onSubmit)
  → RegistryPage (handleSubmit)
    → storageService.saveCollateralCard()
      → IndexedDB
        → dispatch(addCard())
          → Redux Store
            → BaseTable (re-render)
```

### 3. Переключение темы
```
Header (Switch onChange)
  → dispatch(setTheme())
    → Redux Store
      → App.tsx (ConfigProvider)
        → Re-render всего приложения с новой темой
          → storageService.saveSettings()
            → IndexedDB (персистентность)
```

## Зависимости между модулями

```
App.tsx
  └─> MainLayout
       ├─> SidebarMenu
       ├─> Header
       └─> Outlet
            └─> RegistryPage
                 ├─> BaseTable
                 └─> CardForm (Modal)
                      └─> ObjectTypeSelector
```

## Размер файлов (примерно)

| Тип | Количество | Строки кода |
|-----|-----------|------------|
| Components | 6 | ~800 |
| Pages | 2 | ~300 |
| Store | 3 | ~250 |
| Services | 1 | ~350 |
| Types | 1 | ~100 |
| Utils | 3 | ~200 |
| Config | 5 | ~150 |
| **Всего** | **21** | **~2150** |

## Будущие расширения

### Планируемые директории

```
src/
├── components/
│   ├── ui/              # Базовые UI элементы
│   └── forms/           # Специализированные формы
│
├── modules/
│   ├── Tasks/           # Модуль задач
│   ├── Reports/         # Модуль отчетов
│   ├── MobileAppraiser/ # Мобильный оценщик
│   ├── SmartDeal/       # SmartDeal
│   └── Settings/        # Настройки
│
├── hooks/               # Кастомные хуки
├── contexts/            # React Contexts
├── constants/           # Константы
└── assets/              # Статические ресурсы
    ├── images/
    └── fonts/
```

## Соглашения

### Файлы
- Компоненты: `PascalCase.tsx`
- Хуки: `useSomething.ts`
- Утилиты: `camelCase.ts`
- Типы: `types.ts` или `index.ts`

### Импорты
```typescript
// External
import React from 'react';
import { Button } from 'antd';

// Internal (с alias)
import { useAppSelector } from '@/store/hooks';
import type { CardType } from '@/types';
```

### Экспорты
```typescript
// Named exports для утилит
export const helper = () => {};

// Default export для компонентов
export default MyComponent;
```

---

**Структура проекта организована для:**
- ✅ Легкого масштабирования
- ✅ Простоты навигации
- ✅ Четкого разделения ответственности
- ✅ Удобства разработки

