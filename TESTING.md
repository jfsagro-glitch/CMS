# Тестирование CMS Collateral Management

## Обзор

Этот документ описывает стратегию тестирования приложения CMS для управления залоговым имуществом.

## Уровни тестирования

### 1. Type-Check (Статический анализ типов)
**Команда**: `npm run type-check`
- ✅ **Статус**: Пройден (0 ошибок)
- **Покрытие**:
  - Все файлы TypeScript/TSX компилируются без ошибок
  - Типы Redux, React, и пользовательских сервисов корректны
  - Проверка типов для ExtendedCollateralCard, Partner, Document

### 2. Lint (  ESLint)
**Команда**: `npm run lint`
- ✅ **Статус**: Пройден (0 ошибок, 0 предупреждений)
- **Правила**:
  - React Hooks exhaustive-deps
  - prefer-const для переменных
  - Удаление неиспользуемых disables

### 3. Unit тесты (Планируемые)

#### CollateralRepo.test.ts
Тестирование CRUD операций с версионированием:
```typescript
describe('CollateralRepo', () => {
  it('should create new card', async () => {
    const card = { id: 'test', number: 'N001', ...};
    const result = await repo.saveCard(card);
    expect(result.version).toBe(1);
  });

  it('should throw VersionConflictError on version mismatch', async () => {
    const card = { id: 'test', version: 1, ... };
    card.version = 2; // Simulate external change
    await expect(repo.saveCard(card, 1)).rejects.toThrow('VERSION_CONFLICT');
  });

  it('should query cards with pagination', async () => {
    const result = await repo.query({
      page: 1,
      pageSize: 10,
      filters: { status: 'approved' },
    });
    expect(result.items.length).toBeLessThanOrEqual(10);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});
```

#### ExcelExportService.test.ts
Тестирование экспорта данных:
```typescript
describe('ExcelExportService', () => {
  it('should export cards to Excel', () => {
    const cards = [{ id: 'test', number: 'N001', ... }];
    expect(() => service.exportCards(cards)).not.toThrow();
  });

  it('should handle empty cards array', () => {
    expect(() => service.exportCards([])).not.toThrow();
  });

  it('should export single card details', () => {
    const card = { id: 'test', ... };
    expect(() => service.exportCardDetails(card)).not.toThrow();
  });
});
```

#### NotificationService.test.ts
Тестирование уведомлений:
```typescript
describe('NotificationService', () => {
  it('should show success notification', () => {
    notificationService.success('Test');
    // Verify message.success was called
  });

  it('should calculate correct Russian plurals', () => {
    expect(service.bulkOperationSuccess(1, 'Test')).toContain('элемент');
    expect(service.bulkOperationSuccess(2, 'Test')).toContain('элемента');
    expect(service.bulkOperationSuccess(5, 'Test')).toContain('элементов');
  });
});
```

### 4. Интеграционные тесты (E2E сценарии)

#### Сценарий 1: Создание и редактирование карточки
```
1. Открыть страницу реестра
2. Нажать "Создать карточку"
3. Заполнить все обязательные поля
4. Добавить партнера и документ
5. Сохранить карточку
6. Проверить, что карточка появилась в реестре
7. Открыть карточку на редактирование
8. Изменить статус на "Архивирована"
9. Сохранить
10. Проверить обновление в таблице
```

**Ожидаемые результаты**:
- ✅ Карточка успешно создана с version=1
- ✅ Партнер с share сохранен
- ✅ Документ привязан к карточке
- ✅ Обновление увеличивает version на 1
- ✅ Уведомления отображаются корректно

#### Сценарий 2: Версионные конфликты
```
1. Открыть карточку #1 в вкладке А
2. Открыть ту же карточку в вкладке Б
3. Изменить в вкладке А и сохранить
4. Вернуться в вкладку Б и попытаться сохранить
5. Ожидать ошибку версионного конфликта
```

**Ожидаемые результаты**:
- ✅ Вкладка Б получает ошибку "карточка была изменена в другой вкладке"
- ✅ Данные не перезаписаны
- ✅ Пользователь может обновить и повторить

#### Сценарий 3: Экспорт в Excel
```
1. Открыть реестр с 100+ карточками
2. Нажать "Экспорт в Excel (185)"
3. Дождаться загрузки файла
4. Открыть файл в Excel
5. Проверить количество строк и столбцов
```

**Ожидаемые результаты**:
- ✅ Файл загружен за < 5 сек
- ✅ Все 185 карточек в листе "Карточки"
- ✅ Партнеры в отдельном листе
- ✅ Документы в отдельном листе
- ✅ Все столбцы отформатированы

#### Сценарий 4: Инициализация приложения
```
1. Очистить localStorage и IndexedDB
2. Открыть приложение
3. Ждать инициализации
4. Проверить загрузку демо-данных
5. Проверить готовность UI
```

**Ожидаемые результаты**:
- ✅ Состояние: Idle -> Loading -> Ready
- ✅ Демо-данные загружены при первом запуске
- ✅ Реестр отображает карточки
- ✅ Все вкладки доступны

#### Сценарий 5: Пагинация
```
1. Открыть реестр с 500+ карточками
2. Установить размер страницы = 20
3. Перейти на страницу 3
4. Проверить отображение карточек 41-60
5. Отсортировать по наименованию
6. Проверить, что сортировка работает
```

**Ожидаемые результаты**:
- ✅ Таблица загружает данные с серва
- ✅ Пагинация работает корректно
- ✅ Сортировка сохраняется при смене страницы
- ✅ Фильтры применяются правильно

## Инструменты тестирования

### Уже внедренные
- **TypeScript** - type-check
- **ESLint** - lint
- **Redux DevTools** - отладка состояния
- **Performance API** (perfMark/perfMeasure) - измерение времени инициализации

### Рекомендуется добавить
- **Vitest** - быстрые unit тесты
- **Playwright** - E2E тесты с headless браузером
- **Coverage** - измерение покрытия кода

## Checklist перед production

- [ ] ✅ Type-check пройден (0 errors)
- [ ] ✅ ESLint пройден (0 errors, 0 warnings)
- [ ] [ ] Unit тесты написаны (CollateralRepo, ExcelExportService, NotificationService)
- [ ] [ ] E2E тесты написаны (5 сценариев выше)
- [ ] [ ] Performance testing (init time < 2s)
- [ ] [ ] Browser compatibility (Chrome, Firefox, Safari)
- [ ] [ ] Mobile responsiveness (tested on iPhone/Android)
- [ ] [ ] Accessibility (a11y) - WCAG 2.1 Level AA
- [ ] [ ] Load testing (500+ карточек)
- [ ] [ ] Security review (XSS, CSRF, injection)

## Результаты тестирования

### v2.0.1 (Текущая версия)

| Тест | Статус | Дата | Примечания |
|------|--------|------|-----------|
| Type-check | ✅ Pass | 2024-12-19 | 0 errors |
| ESLint | ✅ Pass | 2024-12-19 | 0 errors, 0 warnings |
| Init performance | ✅ Pass | 2024-12-19 | ~1.2s (dev mode) |
| Demo data generation | ✅ Pass | 2024-12-19 | 250 cards in ~3s |
| Excel export | ⏳ Pending | - | 185 cards export |
| E2E scenarios | ⏳ Pending | - | Manual testing required |

## Команды для локального тестирования

```bash
# Type-check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Dev server
npm run dev

# Performance measurement
# Откройте консоль при загрузке (F12 -> Console)
# Найдите сообщения вида:
# ✅ init:db: Xms
# ✅ init:demo: Yms
# ✅ init:total: Zms
```

## Регрессионные тесты

При добавлении новых функций:
1. Запустить `npm run type-check` и `npm run lint`
2. Вручную протестировать критические пути
3. Проверить консоль на ошибки
4. Проверить Performance вкладку в DevTools

## Контакты

Вопросы по тестированию: см. АРХ ИТЕКТУРА.md
