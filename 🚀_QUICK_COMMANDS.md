# 🚀 Шпаргалка команд CarShop CMS

## Установка и запуск

```bash
# Полная установка с нуля
git clone https://github.com/username/CMS.git
cd CMS
npm install
npm run dev

# Если уже установлено - просто запуск
npm run dev
```

## Разработка

```bash
# Запуск dev-сервера (с hot reload)
npm run dev

# Проверка типов TypeScript
npm run type-check

# Проверка кода ESLint
npm run lint
```

## Сборка

```bash
# Production сборка
npm run build

# Просмотр production сборки
npm run preview

# Анализ размера бандла (опционально)
npm run build -- --mode analyze
```

## Деплой

```bash
# Деплой на GitHub Pages
npm run deploy

# Или через GitHub Actions (автоматически при push в main)
git push origin main
```

## Управление данными

```bash
# Все через UI системы:
# 1. Экспорт в Excel - кнопка в интерфейсе
# 2. Резервная копия - кнопка в интерфейсе
# 3. Восстановление - кнопка в интерфейсе
```

## Отладка

```bash
# Открыть в браузере
http://localhost:3000

# DevTools
F12 → Console (ошибки)
F12 → Application → IndexedDB → CMSDatabase (данные)
F12 → Network (запросы)
```

## Очистка

```bash
# Очистить node_modules
rm -rf node_modules
npm install

# Очистить сборку
rm -rf dist

# Очистить кэш (если нужно)
rm -rf node_modules package-lock.json
npm install
```

## Работа с IndexedDB

```javascript
// В консоли браузера (F12):

// Посмотреть все карточки
indexedDB.databases()

// Очистить базу (осторожно!)
indexedDB.deleteDatabase('CMSDatabase')
```

## Git

```bash
# Статус изменений
git status

# Добавить все изменения
git add .

# Коммит
git commit -m "feat: описание изменений"

# Отправить на сервер
git push origin main

# Создать feature branch
git checkout -b feature/my-feature
```

## Быстрые действия в UI

```
Создать карточку:      Alt + N (или кнопка "Создать карточку")
Поиск:                 Click в поле поиска → введите текст
Фильтр:                Click на иконку фильтра в колонке
Сортировка:            Click на заголовок колонки
Экспорт:               Кнопка "Экспорт в Excel"
Переключить тему:      Переключатель в header
Свернуть меню:         Иконка ☰ в header
```

## Структура URL

```
http://localhost:3000/              → Главная (redirect на /registry)
http://localhost:3000/registry      → Реестр карточек ✅
http://localhost:3000/tasks         → Задачи (placeholder)
http://localhost:3000/reports       → Отчеты (placeholder)
http://localhost:3000/settings      → Настройки (placeholder)
```

## Документация - Быстрый доступ

```bash
# Открыть документ
# Windows:
start START_HERE.md

# macOS:
open START_HERE.md

# Linux:
xdg-open START_HERE.md

# Или просто откройте в VS Code / текстовом редакторе
```

## Топ-5 документов

```
1. START_HERE.md           - НАЧНИТЕ ЗДЕСЬ
2. STAGE2_QUICKSTART.md    - Примеры и инструкции
3. DEVELOPMENT.md          - Для разработчиков
4. DEPLOYMENT.md           - Для деплоя
5. HOW_TO_USE.md          - Подробное руководство
```

## Проверка готовности

```bash
# Проверка что все ОК перед деплоем:
npm run type-check  # TypeScript ошибки
npm run lint        # ESLint ошибки
npm run build       # Сборка без ошибок
npm run preview     # Проверка работы
```

## Полезные npm пакеты (опционально)

```bash
# Для анализа бандла
npm install -D rollup-plugin-visualizer

# Для деплоя
npm install -D gh-pages

# Для тестирования (в будущем)
npm install -D vitest @testing-library/react
```

## Горячие клавиши браузера

```
F12              - DevTools
Ctrl+Shift+I     - DevTools (альтернатива)
Ctrl+Shift+C     - Inspect element
Ctrl+R           - Обновить страницу
Ctrl+Shift+R     - Hard refresh (с очисткой кэша)
Ctrl+Shift+Del   - Очистить данные сайта
```

## IndexedDB команды (консоль браузера)

```javascript
// Список баз
await indexedDB.databases()

// Размер использования (примерно)
navigator.storage.estimate()

// Очистить (ОСТОРОЖНО! Потеряете данные!)
indexedDB.deleteDatabase('CMSDatabase')
```

---

## 🆘 SOS - Что-то сломалось

```bash
# 1. Очистить и переустановить
rm -rf node_modules package-lock.json
npm install

# 2. Очистить кэш браузера
Ctrl+Shift+Del → Очистить кэш

# 3. Проверить версию Node
node --version  # Должна быть 18+

# 4. Проверить консоль
F12 → Console → Посмотреть ошибки

# 5. Проверить IndexedDB
F12 → Application → IndexedDB → CMSDatabase

# 6. Последняя надежда - перезагрузка
Закрыть все → npm run dev
```

---

**СОХРАНИТЕ ЭТУ ШПАРГАЛКУ!** 📌

Версия: 2.0.0  
Обновлено: 7 октября 2024

