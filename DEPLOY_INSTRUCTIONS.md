# 📦 ИНСТРУКЦИЯ ПО РАЗВЕРТЫВАНИЮ - CarShop CMS

## 🎯 Цель

Развернуть CarShop CMS на GitHub Pages по адресу:
**https://jfsagro-glitch.github.io/cms/**

---

## ✅ ГОТОВНОСТЬ К ДЕПЛОЮ: 100%

Все настройки выполнены! Система готова к публикации.

---

## 🚀 ДЕПЛОЙ ЗА 3 ШАГА

### Шаг 1: Подготовка репозитория GitHub

```bash
# Если репозиторий еще не создан:
# 1. Создайте репозиторий на GitHub: https://github.com/new
#    Имя: CMS
#    Visibility: Public
#    
# 2. Инициализируйте Git локально:
cd CMS
git init
git add .
git commit -m "initial commit: CarShop CMS v2.0.0"
git branch -M main
git remote add origin https://github.com/jfsagro-glitch/CMS.git
git push -u origin main

# Если репозиторий уже существует:
git add .
git commit -m "deploy: готов к GitHub Pages"
git push origin main
```

### Шаг 2: Настройка GitHub Pages

1. Откройте: https://github.com/jfsagro-glitch/CMS/settings/pages

2. В разделе **"Build and deployment":**
   - **Source:** выберите `GitHub Actions`
   
3. Сохраните настройки

4. Перейдите: https://github.com/jfsagro-glitch/CMS/settings/actions

5. В разделе **"Workflow permissions":**
   - ✅ Выберите `Read and write permissions`
   - ✅ Включите `Allow GitHub Actions to create and approve pull requests`
   
6. Сохраните

### Шаг 3: Запуск деплоя

```bash
# Вариант A: Автоматический деплой (рекомендуется)
git push origin main

# Через 2-3 минуты сайт будет доступен по адресу:
# https://jfsagro-glitch.github.io/cms/

# Вариант B: Ручной деплой
npm run build
npm run check-deploy
npm run deploy

# Вариант C: Триггер через GitHub UI
# 1. https://github.com/jfsagro-glitch/CMS/actions
# 2. Выберите workflow "Deploy CarShop CMS to GitHub Pages"
# 3. Нажмите "Run workflow"
```

---

## 🎉 ГОТОВО!

После успешного деплоя:

**URL:** https://jfsagro-glitch.github.io/cms/

**Что проверить:**
1. Сайт открывается
2. Навигация работает (/#/registry, /#/tasks и т.д.)
3. Демо-данные загрузились (5 карточек)
4. Можно создать новую карточку
5. IndexedDB работает
6. Экспорт в Excel работает

---

## 📝 Дополнительная информация

### Статус деплоя:

**Проверить:** https://github.com/jfsagro-glitch/CMS/actions

**Время деплоя:** 2-5 минут

**Badge для README:**

```markdown
[![Deploy Status](https://github.com/jfsagro-glitch/CMS/actions/workflows/deploy.yml/badge.svg)](https://github.com/jfsagro-glitch/CMS/actions/workflows/deploy.yml)
```

### Обновление сайта:

```bash
# Любой push в main автоматически обновит сайт:
git add .
git commit -m "update: ..."
git push origin main
```

---

## 🛠️ Настройки (уже выполнены)

### ✅ package.json
```json
{
  "homepage": "https://jfsagro-glitch.github.io/cms/",
  "scripts": {
    "build": "tsc && vite build && npm run postbuild",
    "deploy": "gh-pages -d dist"
  }
}
```

### ✅ vite.config.ts
```typescript
base: '/cms/'  // GitHub Pages base path
```

### ✅ HashRouter
```typescript
// src/App.tsx
import { HashRouter } from 'react-router-dom';
// URL format: https://jfsagro-glitch.github.io/cms/#/registry
```

### ✅ GitHub Actions
`.github/workflows/deploy.yml` - автоматический деплой

### ✅ Скрипты
- `scripts/post-build.js` - создает 404.html и .nojekyll
- `scripts/pre-deploy-check.js` - проверка перед деплоем

---

## ⚠️ Важные замечания

### 1. HashRouter vs BrowserRouter:

**Используется:** HashRouter  
**Почему:** GitHub Pages - статический хостинг, нет server-side routing  
**URL:** Содержит # (например: `/#/registry`)  
**Альтернатива:** BrowserRouter требует backend или сложную настройку

### 2. Base Path:

**Production:** `/cms/` (имя репозитория)  
**Development:** `/` (localhost)  

**Автоматически:** Vite использует правильный base в зависимости от NODE_ENV

### 3. IndexedDB:

**Работает полностью!** Данные хранятся локально в браузере  
**Домен:** `https://jfsagro-glitch.github.io`  
**Персистентность:** Между сессиями  
**Offline:** Работает без интернета

### 4. Ограничения GitHub Pages:

- **Размер:** Рекомендуется до 1 GB
- **Bandwidth:** 100 GB/month (soft limit)
- **Билды:** 10 builds/hour
- **HTTPS:** Включен автоматически

---

## 📞 Поддержка

**Проблемы с деплоем:**
- См. раздел "Troubleshooting" в GITHUB_PAGES_DEPLOY.md
- Проверьте Actions: https://github.com/jfsagro-glitch/CMS/actions
- Проверьте консоль браузера (F12)

**Технические вопросы:**
- См. DEVELOPMENT.md
- См. DEPLOYMENT.md

---

## 🎊 УСПЕШНОГО ДЕПЛОЯ!

```bash
npm run deploy
```

**Ваш сайт будет доступен через 2-3 минуты!**

🌐 https://jfsagro-glitch.github.io/cms/

---

**Версия:** 2.0.0  
**Дата:** 7 октября 2024  
**Статус:** ✅ Готов к деплою

