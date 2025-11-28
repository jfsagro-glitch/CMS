# 🚀 Быстрое решение проблем с деплоем

## ⚡ Что делать, если деплой не проходит:

### 1. Проверьте GitHub Actions
Откройте: **https://github.com/jfsagro-glitch/CMS/actions**

Посмотрите последний workflow:
- 🟢 Зеленый check = деплой успешен
- 🔴 Красный X = есть ошибка (откройте и посмотрите логи)
- 🟡 Желтая точка = деплой в процессе

### 2. Проверьте настройки GitHub Pages
Откройте: **https://github.com/jfsagro-glitch/CMS/settings/pages**

**Важно:** Source должен быть **"GitHub Actions"** (не "Deploy from a branch")

### 3. Проверьте права GitHub Actions
Откройте: **https://github.com/jfsagro-glitch/CMS/settings/actions**

**Workflow permissions:** должно быть **"Read and write permissions"**

### 4. Запустите деплой вручную

Если автоматический деплой не запускается, выполните:

```bash
# Создайте пустой коммит для триггера
git commit --allow-empty -m "trigger: deploy to GitHub Pages"
git push origin main
```

Или запустите workflow вручную:
1. Откройте: https://github.com/jfsagro-glitch/CMS/actions
2. Найдите "Deploy CarShop CMS to GitHub Pages"
3. Нажмите "Run workflow" → выберите `main` → "Run workflow"

### 5. Проверьте локальную сборку

Убедитесь, что локально всё собирается:

```bash
npm run build
npm run check-deploy
```

Если есть ошибки - исправьте их перед деплоем.

## 📋 Частые проблемы:

### Проблема: "Workflow не запускается"
**Решение:** Проверьте настройки GitHub Pages (должен быть выбран "GitHub Actions")

### Проблема: "Build failed"
**Решение:** 
1. Откройте логи в GitHub Actions
2. Найдите ошибку
3. Исправьте её локально
4. Запушьте исправления

### Проблема: "Deploy failed"
**Решение:** Проверьте права GitHub Actions (должны быть "Read and write permissions")

## 🔗 Полезные ссылки:

- **GitHub Actions:** https://github.com/jfsagro-glitch/CMS/actions
- **GitHub Pages:** https://github.com/jfsagro-glitch/CMS/settings/pages
- **Actions Settings:** https://github.com/jfsagro-glitch/CMS/settings/actions
- **Сайт:** https://jfsagro-glitch.github.io/cms/

