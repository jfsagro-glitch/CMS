# 🛠️ Руководство разработчика

## Структура проекта

### Организация кода

```
src/
├── components/          # React компоненты
│   ├── layout/         # Layout компоненты (MainLayout, Header, Sidebar)
│   ├── common/         # Переиспользуемые компоненты
│   └── ui/             # Базовые UI компоненты (будущее)
│
├── modules/            # Feature модули (страницы)
│   ├── Registry/       # Модуль реестра карточек
│   └── Placeholder/    # Заглушки для будущих модулей
│
├── store/              # Redux Toolkit
│   ├── slices/         # Redux slices
│   ├── hooks.ts        # Типизированные хуки
│   └── index.ts        # Store configuration
│
├── services/           # Сервисы для работы с данными
│   └── StorageService.ts
│
├── types/              # TypeScript типы и интерфейсы
│   └── index.ts
│
├── utils/              # Утилиты и хелперы
│   ├── classification.ts
│   ├── helpers.ts
│   └── sampleData.ts
│
├── App.tsx             # Главный компонент
├── main.tsx            # Точка входа
└── index.css           # Глобальные стили
```

## Архитектурные принципы

### 1. Feature-Based организация
Каждый модуль (feature) в папке `modules/` содержит:
- Страницы модуля
- Специфичные компоненты
- Типы (если нужны только здесь)

### 2. Separation of Concerns
- **Components** - только UI, минимум логики
- **Store** - state management
- **Services** - работа с данными
- **Utils** - чистые функции

### 3. TypeScript First
- Строгая типизация
- Интерфейсы для всех сущностей
- Избегаем `any`

### 4. React Best Practices
- Функциональные компоненты
- Hooks для состояния
- Мемоизация где нужно

## Соглашения о коде

### Именование файлов
- Компоненты: `PascalCase.tsx` (Example: `CardForm.tsx`)
- Утилиты: `camelCase.ts` (Example: `helpers.ts`)
- Типы: `index.ts` или `types.ts`
- Константы: `UPPER_SNAKE_CASE` внутри файлов

### Именование переменных
```typescript
// Компоненты
const UserCard: React.FC = () => {};

// Хуки
const useUserData = () => {};

// Константы
const MAX_ITEMS = 100;

// Функции
const calculateTotal = () => {};

// Интерфейсы
interface UserData {}

// Types
type Status = 'active' | 'inactive';
```

### Структура компонента
```typescript
import React, { useState, useEffect } from 'react';
import { Component } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { MyType } from '@/types';

interface MyComponentProps {
  // props
}

const MyComponent: React.FC<MyComponentProps> = ({ prop }) => {
  // Hooks
  const dispatch = useAppDispatch();
  const state = useAppSelector(selector);
  const [localState, setLocalState] = useState();

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Handlers
  const handleClick = () => {
    // ...
  };

  // Render helpers
  const renderItem = () => {
    // ...
  };

  // Return
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

## Redux Toolkit

### Создание нового slice

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MyState {
  // state shape
}

const initialState: MyState = {
  // initial values
};

const mySlice = createSlice({
  name: 'myFeature',
  initialState,
  reducers: {
    myAction: (state, action: PayloadAction<Type>) => {
      // mutation via Immer
    },
  },
});

export const { myAction } = mySlice.actions;
export default mySlice.reducer;
```

### Использование в компоненте

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { myAction } from '@/store/slices/mySlice';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const data = useAppSelector(state => state.myFeature.data);

  const handleAction = () => {
    dispatch(myAction(payload));
  };
};
```

## Работа с IndexedDB

### Добавление новой таблицы

1. Обновите `StorageService.ts`:
```typescript
class CMSDatabase extends Dexie {
  myTable!: Table<MyType, string>;

  constructor() {
    super('CMSDatabase');
    
    this.version(2).stores({
      // existing tables...
      myTable: 'id, field1, field2'
    });
  }
}
```

2. Добавьте методы в StorageService:
```typescript
async getMyData(): Promise<MyType[]> {
  return await this.db.myTable.toArray();
}

async saveMyData(data: MyType): Promise<void> {
  await this.db.myTable.put(data);
}
```

## Добавление нового модуля

1. Создайте папку в `src/modules/MyModule/`
2. Создайте главный файл страницы `MyModulePage.tsx`
3. Добавьте route в `App.tsx`:
```typescript
<Route path="my-module" element={<MyModulePage />} />
```
4. Добавьте пункт в меню в `SidebarMenu.tsx`

## Стилизация

### Использование Ant Design
```typescript
import { Button, Space, Card } from 'antd';

// Используем компоненты Ant Design
<Button type="primary">Click</Button>
```

### Кастомные стили
```typescript
// Inline styles для простых случаев
<div style={{ padding: '16px' }}>...</div>

// CSS modules для сложной стилизации (будущее)
```

### Темизация
```typescript
// В App.tsx уже настроен ConfigProvider
// Все компоненты автоматически поддерживают темы
```

## Тестирование (будущее)

### Unit тесты
```bash
npm run test
```

### E2E тесты
```bash
npm run test:e2e
```

## Полезные команды

```bash
# Разработка
npm run dev              # Запуск dev-сервера

# Сборка
npm run build            # Production build
npm run preview          # Превью production build

# Качество кода
npm run lint             # Запуск ESLint
npm run lint:fix         # Исправить автоматически

# Типы
npm run type-check       # Проверка типов TypeScript
```

## Отладка

### React DevTools
1. Установите расширение React DevTools
2. Откройте DevTools (F12) → Components

### Redux DevTools
1. Установите расширение Redux DevTools
2. Откройте DevTools (F12) → Redux

### IndexedDB
1. DevTools (F12) → Application → IndexedDB
2. Просмотр данных в таблицах

### Console логи
```typescript
console.log('Debug:', data);
console.error('Error:', error);
console.table(arrayData); // Для массивов
```

## Performance

### Оптимизация рендеринга
```typescript
import { memo, useMemo, useCallback } from 'react';

// Мемоизация компонента
const MyComponent = memo(() => {
  // ...
});

// Мемоизация значения
const value = useMemo(() => expensiveCalculation(), [deps]);

// Мемоизация callback
const handler = useCallback(() => {}, [deps]);
```

### Lazy loading
```typescript
import { lazy, Suspense } from 'react';

const MyModule = lazy(() => import('./MyModule'));

<Suspense fallback={<Spinner />}>
  <MyModule />
</Suspense>
```

## Git workflow (рекомендации)

```bash
# Создание feature branch
git checkout -b feature/my-feature

# Коммиты
git commit -m "feat: add new feature"
git commit -m "fix: fix bug"
git commit -m "docs: update documentation"

# Push и PR
git push origin feature/my-feature
# Создайте Pull Request
```

## Полезные ресурсы

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Ant Design](https://ant.design/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Dexie.js](https://dexie.org/)

## Вопросы и поддержка

При возникновении вопросов:
1. Проверьте документацию
2. Посмотрите примеры в существующем коде
3. Проверьте консоль браузера
4. Обратитесь к команде

---

**Happy Coding! 🚀**

