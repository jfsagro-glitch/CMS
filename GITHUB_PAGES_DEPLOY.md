# 🚀 Развертывание CarShop CMS на GitHub Pages

## 📌 Информация о деплое

**Репозиторий:** https://github.com/jfsagro-glitch/CMS  
**GitHub Pages URL:** https://jfsagro-glitch.github.io/cms/  
**Статус:** ✅ Настроен и готов к деплою

---

## ⚡ Быстрый деплой

### Вариант 1: Автоматический (рекомендуется)

```bash
# 1. Push в main/master ветку
git add .
git commit -m "deploy: готов к production"
git push origin main

# 2. GitHub Actions автоматически соберет и задеплоит
# 3. Через 2-3 минуты сайт будет доступен по адресу:
#    https://jfsagro-glitch.github.io/cms/
```

### Вариант 2: Ручной

```bash
# 1. Соберите проект
npm run build

# 2. Проверьте сборку
npm run check-deploy

# 3. Деплойте на GitHub Pages
npm run deploy

# 4. Сайт будет доступен через 1-2 минуты
```

---

## 🔧 Первоначальная настройка (уже выполнено)

### 1. Конфигурация package.json ✅

```json
{
  "name": "cms-collateral-management",
  "version": "2.0.0",
  "homepage": "https://jfsagro-glitch.github.io/cms/",
  "scripts": {
    "build": "tsc && vite build && npm run postbuild",
    "postbuild": "node scripts/post-build.js",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist",
    "check-deploy": "node scripts/pre-deploy-check.js"
  }
}
```

### 2. Конфигурация Vite ✅

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/cms/' : '/',
  // ... остальная конфигурация
})
```

### 3. HashRouter вместо BrowserRouter ✅

```typescript
// src/App.tsx
import { HashRouter } from 'react-router-dom';

// HashRouter использует # в URL для работы без сервера
// https://jfsagro-glitch.github.io/cms/#/registry
```

### 4. GitHub Actions workflow ✅

Файл `.github/workflows/deploy.yml` настроен для:
- Автоматической сборки при push
- TypeScript type check
- ESLint проверки
- Pre-deploy валидации
- Деплоя на GitHub Pages

---

## 📋 Настройка GitHub репозитория

### Шаг 1: Включить GitHub Pages

1. Откройте репозиторий: https://github.com/jfsagro-glitch/CMS
2. Перейдите в **Settings** → **Pages**
3. В разделе **Source** выберите:
   - **Source:** `GitHub Actions`
4. Сохраните настройки

### Шаг 2: Проверка прав

Убедитесь что у GitHub Actions есть права:
- Settings → Actions → General
- **Workflow permissions:** ✅ Read and write permissions
- **Allow GitHub Actions to create and approve pull requests:** ✅ Enabled

### Шаг 3: Первый деплой

```bash
# Зафиксируйте изменения
git add .
git commit -m "chore: настройка GitHub Pages деплоя"
git push origin main

# Проверьте статус деплоя:
# https://github.com/jfsagro-glitch/CMS/actions
```

---

## 🎯 Процесс деплоя

### Автоматический деплой (при push в main/master):

```
1. Developer: git push origin main
                  ↓
2. GitHub: Триггер workflow
                  ↓
3. GitHub Actions:
   ├─► Checkout code
   ├─► Setup Node.js 18
   ├─► npm ci (установка зависимостей)
   ├─► npm run type-check (проверка типов)
   ├─► npm run lint (проверка кода)
   ├─► npm run build (сборка)
   │   ├─► tsc (TypeScript compile)
   │   ├─► vite build (bundle)
   │   └─► npm run postbuild (404.html, .nojekyll)
   ├─► npm run check-deploy (валидация)
   ├─► Upload artifact
   └─► Deploy to GitHub Pages
                  ↓
4. GitHub Pages: Публикация
                  ↓
5. URL: https://jfsagro-glitch.github.io/cms/
```

**Время:** 2-5 минут

### Ручной деплой:

```bash
# 1. Сборка
npm run build
# → tsc
# → vite build
# → post-build script (404.html, .nojekyll)

# 2. Проверка
npm run check-deploy
# → Валидация dist/ folder
# → Проверка всех файлов
# → Проверка homepage

# 3. Деплой
npm run deploy
# → gh-pages -d dist
# → Push to gh-pages branch

# 4. Проверка
# Откройте https://jfsagro-glitch.github.io/cms/
```

**Время:** 1-2 минуты

---

## 🛠️ Скрипты

### post-build.js ✅

**Назначение:** Подготовка сборки для GitHub Pages

**Что делает:**
1. Копирует `index.html` → `404.html` (для SPA routing)
2. Создает `.nojekyll` (отключает Jekyll processing)
3. Проверяет наличие всех файлов

**Запуск:** Автоматически после `vite build`

### pre-deploy-check.js ✅

**Назначение:** Валидация перед деплоем

**Что проверяет:**
1. Существование `dist/` folder
2. Наличие `index.html`
3. Наличие `404.html` (SPA support)
4. Наличие `.nojekyll`
5. Правильность `homepage` в package.json
6. Размер сборки (предупреждение если >100MB)
7. Наличие `assets/`

**Запуск:** `npm run check-deploy`

---

## 🌐 URL Structure

### Production (GitHub Pages):

```
https://jfsagro-glitch.github.io/cms/
  │
  ├─ / (главная)                    → /#/
  ├─ /#/registry                    → Реестр
  ├─ /#/tasks                       → Задачи
  ├─ /#/reports                     → Отчеты
  ├─ /#/mobile-appraiser            → Мобильный оценщик
  ├─ /#/smartdeal                   → SmartDeal
  ├─ /#/upload                      → Загрузка
  ├─ /#/monitoring                  → Мониторинг
  └─ /#/settings                    → Настройки
```

**Примечание:** HashRouter добавляет `#` в URL для работы без сервера

### Development (localhost):

```
http://localhost:3000/
  │
  ├─ /#/registry
  ├─ /#/tasks
  └─ ... (то же самое)
```

---

## 🎨 Особенности GitHub Pages

### SPA Routing

**Проблема:** GitHub Pages не поддерживает server-side routing

**Решение 1 (используется):** HashRouter
- URL: `https://jfsagro-glitch.github.io/cms/#/registry`
- Работает без дополнительной настройки
- # символ в URL

**Решение 2 (альтернатива):** 404.html redirect
- Создается автоматически в `post-build.js`
- Fallback для прямых ссылок

### Jekyll Processing

**Проблема:** GitHub Pages по умолчанию обрабатывает файлы через Jekyll

**Решение:** `.nojekyll` файл
- Создается в `post-build.js`
- Отключает Jekyll processing
- Файлы начинающиеся с `_` работают корректно

### IndexedDB

**Работает!** IndexedDB полностью поддерживается на GitHub Pages
- Данные хранятся локально в браузере
- Персистентность между сессиями
- Работает offline

---

## ✅ Чеклист перед первым деплоем

### Предварительно:

- [x] Node.js 18+ установлен
- [x] Репозиторий создан: https://github.com/jfsagro-glitch/CMS
- [x] package.json настроен (homepage, scripts)
- [x] vite.config.ts настроен (base: '/cms/')
- [x] HashRouter используется
- [x] GitHub Actions workflow создан
- [x] Скрипты post-build и check-deploy созданы

### Перед деплоем:

```bash
# 1. Проверка типов
npm run type-check
# Не должно быть ошибок

# 2. Проверка кода
npm run lint
# Исправьте критические ошибки

# 3. Локальная сборка
npm run build
# Должна завершиться успешно

# 4. Проверка сборки
npm run check-deploy
# Все проверки должны пройти ✅

# 5. Просмотр локально
npm run preview
# Откройте http://localhost:4173
# Проверьте что все работает

# 6. Деплой
npm run deploy
# Или push в GitHub для автодеплоя
```

---

## 🔍 Проверка после деплоя

### 1. Откройте сайт:

```
https://jfsagro-glitch.github.io/cms/
```

### 2. Проверьте функции:

- [ ] Сайт открывается без ошибок
- [ ] Боковое меню работает
- [ ] Навигация между разделами работает
- [ ] Демо-данные загрузились (5 карточек)
- [ ] Можно создать новую карточку
- [ ] IndexedDB работает (данные сохраняются)
- [ ] Экспорт в Excel работает
- [ ] Темы переключаются
- [ ] Все ссылки работают

### 3. Проверьте в DevTools:

```
F12 → Console
  → Не должно быть ошибок (кроме предупреждений)

F12 → Application → IndexedDB → CMSDatabase
  → База должна быть версии 2
  → Должны быть 5 демо-карточек

F12 → Network
  → Все ресурсы должны загружаться успешно
  → Нет 404 ошибок
```

### 4. Проверьте в разных браузерах:

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (если доступен)

---

## 🐛 Troubleshooting

### Проблема: Сайт не открывается (404)

**Причины:**
1. GitHub Pages не включен в настройках
2. Неправильный base path
3. Деплой еще не завершился

**Решение:**
```bash
# 1. Проверьте Settings → Pages
#    Source должен быть: GitHub Actions

# 2. Проверьте vite.config.ts
#    base должен быть: '/cms/'

# 3. Подождите 2-3 минуты после push
#    Проверьте статус: https://github.com/jfsagro-glitch/CMS/actions

# 4. Очистите кэш браузера: Ctrl+Shift+R
```

### Проблема: Роуты не работают (404 при переходе)

**Причина:** Не используется HashRouter

**Решение:**
```bash
# Убедитесь что в src/App.tsx используется HashRouter:
import { HashRouter } from 'react-router-dom';

# Пересоберите:
npm run build
npm run deploy
```

### Проблема: CSS/JS не загружаются

**Причина:** Неправильный base path

**Решение:**
```bash
# 1. Проверьте vite.config.ts
#    base: '/cms/' (должен совпадать с именем репозитория)

# 2. Пересоберите
npm run build
npm run deploy
```

### Проблема: Демо-данные не загружаются

**Причина:** Ошибка в console

**Решение:**
```bash
# 1. Откройте DevTools → Console
# 2. Посмотрите ошибки
# 3. Очистите IndexedDB:
#    F12 → Application → IndexedDB → CMSDatabase → Delete database
# 4. Перезагрузите страницу: F5
```

### Проблема: GitHub Actions fails

**Проверьте логи:**
```
1. https://github.com/jfsagro-glitch/CMS/actions
2. Кликните на failed workflow
3. Посмотрите на какой step упало
4. Исправьте ошибку
5. Push снова
```

---

## 📊 Мониторинг деплоя

### GitHub Actions Dashboard:

```
https://github.com/jfsagro-glitch/CMS/actions
```

**Статусы:**
- 🟢 Зеленый check - Успешно
- 🔴 Красный X - Ошибка
- 🟡 Желтый точка - В процессе

### Логи:

Кликните на workflow → Откроется детальный лог каждого step

---

## 🔄 Процесс обновления

### Обновление контента:

```bash
# 1. Внесите изменения в код
# 2. Протестируйте локально
npm run dev

# 3. Соберите
npm run build

# 4. Проверьте
npm run preview

# 5. Закоммитьте и запушьте
git add .
git commit -m "feat: добавлена новая функция"
git push origin main

# 6. GitHub Actions автоматически задеплоит
# 7. Через 2-3 минуты изменения будут на сайте
```

### Откат к предыдущей версии:

```bash
# Вариант 1: Через GitHub
1. https://github.com/jfsagro-glitch/CMS/actions
2. Найдите предыдущий успешный workflow
3. Re-run all jobs

# Вариант 2: Через Git
git revert HEAD
git push origin main
```

---

## 💾 Демо-данные

### Автоматическая загрузка ✅

При первом запуске на GitHub Pages автоматически загрузятся 5 демо-карточек:

1. **Квартира** - 3-комн., ул. Ленина, 75 кв.м
2. **Офис** - Бизнес-центр, класс A, 120 кв.м
3. **Склад** - Класс A, 5000 кв.м, 12м высота
4. **Автомобиль** - Toyota Camry 2020, VIN
5. **Жилой дом** - 250 кв.м, 2 этажа, 15 соток

**Файл:** `src/utils/demoData.ts`

### Как отключить:

Закомментируйте в `src/App.tsx`:

```typescript
// Автозагрузка демо-данных при первом запуске
if (cards.length === 0) {
  // Закомментируйте этот блок чтобы отключить
}
```

---

## 🌐 Custom Domain (опционально)

Если хотите использовать свой домен:

### 1. Настройте DNS:

```
Type: CNAME
Name: cms (или @)
Value: jfsagro-glitch.github.io
```

### 2. Добавьте в репозиторий:

```bash
# Settings → Pages → Custom domain
# Введите: your-domain.com
# GitHub создаст CNAME файл автоматически
```

### 3. Обновите package.json:

```json
"homepage": "https://your-domain.com/"
```

### 4. Обновите vite.config.ts:

```typescript
base: process.env.NODE_ENV === 'production' ? '/' : '/',
```

### 5. Пересоберите и задеплойте:

```bash
npm run build
npm run deploy
```

---

## 📈 Оптимизация для production

### Текущая оптимизация (уже применена):

✅ **Code splitting:**
- react-vendor (~140KB)
- antd-vendor (~200KB)
- redux-vendor (~30KB)
- app code (~200KB)

✅ **Minification:**
- JS минифицирован
- CSS минифицирован
- HTML минифицирован

✅ **Tree shaking:**
- Неиспользуемый код удален

### Дополнительная оптимизация (опционально):

**1. Компрессия:**

GitHub Pages автоматически сжимает файлы (gzip)

**2. Кэширование:**

```html
<!-- В index.html добавьте meta теги -->
<meta http-equiv="Cache-Control" content="public, max-age=31536000">
```

**3. Preload критичных ресурсов:**

```html
<link rel="preload" href="/cms/assets/react-vendor.js" as="script">
```

---

## 📊 Мониторинг

### Google Analytics (опционально):

Добавьте в `index.html`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Uptime мониторинг:

Используйте сервисы:
- UptimeRobot (бесплатный)
- Pingdom
- StatusCake

URL для мониторинга: `https://jfsagro-glitch.github.io/cms/`

---

## 🎯 Критерии успешного деплоя

### После деплоя должно работать:

- [x] Сайт открывается по адресу https://jfsagro-glitch.github.io/cms/
- [x] Все маршруты работают (/#/registry, /#/tasks и т.д.)
- [x] Демо-данные загружаются автоматически
- [x] IndexedDB функционирует
- [x] Можно создать новую карточку
- [x] Данные сохраняются при перезагрузке
- [x] Экспорт в Excel работает
- [x] Темы переключаются
- [x] Нет ошибок в консоли

---

## 🚀 ГОТОВО К ДЕПЛОЮ!

### Команды для деплоя:

```bash
# Проверка перед деплоем
npm run build
npm run check-deploy

# Ручной деплой
npm run deploy

# Автоматический деплой
git push origin main
```

### После деплоя:

**URL:** https://jfsagro-glitch.github.io/cms/

**Проверьте:** Все функции работают

**Поделитесь:** Ссылкой с пользователями!

---

**СИСТЕМА ГОТОВА К ПУБЛИКАЦИИ НА GITHUB PAGES!** 🎉

**Дата:** 7 октября 2024  
**Версия:** 2.0.0  
**URL:** https://jfsagro-glitch.github.io/cms/

