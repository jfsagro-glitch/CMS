# 🚀 Руководство по развертыванию CarShop CMS

## Варианты развертывания

### 1. GitHub Pages (Рекомендуется для демо)

**Автоматический деплой:**

1. Загрузите проект на GitHub
2. Перейдите в Settings → Pages
3. Source: GitHub Actions
4. Файл `.github/workflows/deploy.yml` автоматически настроит деплой

**Ручной деплой:**

```bash
# Сборка проекта
npm run build

# Установка gh-pages (если еще не установлено)
npm install -D gh-pages

# Добавьте в package.json:
# "deploy": "gh-pages -d dist"

# Деплой
npm run deploy
```

**URL проекта:** `https://<username>.github.io/CMS/`

### 2. Vercel

```bash
# Установка Vercel CLI
npm install -g vercel

# Деплой
vercel

# Production деплой
vercel --prod
```

**Конфигурация:** `vercel.json` (опционально)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 3. Netlify

**Через Netlify CLI:**

```bash
# Установка
npm install -g netlify-cli

# Деплой
netlify deploy

# Production
netlify deploy --prod
```

**Через веб-интерфейс:**
1. Подключите GitHub репозиторий
2. Build command: `npm run build`
3. Publish directory: `dist`

### 4. Локальный сервер

**Nginx конфигурация:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Apache (.htaccess):**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 5. Docker

**Dockerfile:**

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Запуск:**

```bash
docker build -t carshop-cms .
docker run -p 8080:80 carshop-cms
```

## Настройка базового пути

Если приложение развернуто не в корне домена, измените `base` в `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/your-path/', // Например: '/cms/'
  // ...
})
```

## Переменные окружения

Создайте файлы `.env` для разных окружений:

**.env.production:**
```env
VITE_APP_TITLE="CarShop CMS"
VITE_APP_VERSION="2.0.0"
VITE_BASE_URL="/CMS/"
```

**.env.development:**
```env
VITE_APP_TITLE="CarShop CMS [DEV]"
VITE_APP_VERSION="2.0.0-dev"
VITE_BASE_URL="/"
```

## Оптимизация production сборки

**1. Включите минификацию и tree-shaking** (уже включено в Vite)

**2. Разделение на чанки** (настроено в vite.config.ts):
- react-vendor
- antd-vendor
- redux-vendor

**3. Кэширование:**
- Статические файлы: 1 год
- HTML: без кэширования
- API: настраивается

**4. Компрессия:**

Nginx:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

**5. Анализ размера бандла:**

```bash
npm install -D rollup-plugin-visualizer

# Добавьте в vite.config.ts:
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  visualizer({ open: true })
]

# Запустите сборку
npm run build
```

## Проверка перед деплоем

### Чеклист:

- [ ] Все зависимости установлены
- [ ] Проект собирается без ошибок: `npm run build`
- [ ] Работает локально: `npm run preview`
- [ ] Настроен базовый путь (если нужно)
- [ ] Переменные окружения настроены
- [ ] IndexedDB работает в production
- [ ] Все роуты работают (SPA routing)
- [ ] Статические файлы доступны
- [ ] Нет console.log в production коде
- [ ] Source maps отключены для production (или ограничены)

### Тестирование production сборки:

```bash
# Сборка
npm run build

# Просмотр
npm run preview

# Открыть http://localhost:4173
```

## CI/CD

### GitHub Actions (уже настроено)

Файл `.github/workflows/deploy.yml` автоматически:
1. Устанавливает зависимости
2. Собирает проект
3. Деплоит на GitHub Pages

### GitLab CI

```yaml
# .gitlab-ci.yml
image: node:18

stages:
  - build
  - deploy

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - npm install -g netlify-cli
    - netlify deploy --prod --dir=dist
  only:
    - master
```

## Мониторинг

После деплоя рекомендуется настроить:

1. **Google Analytics** (опционально)
2. **Sentry** для отслеживания ошибок
3. **LogRocket** для session replay
4. **Lighthouse CI** для мониторинга производительности

## Обновление

```bash
# Получить последние изменения
git pull origin main

# Установить зависимости
npm install

# Собрать
npm run build

# Деплой (зависит от метода)
npm run deploy  # или другая команда
```

## Откат к предыдущей версии

### GitHub Pages:
1. Найдите предыдущий успешный workflow
2. Re-run workflow

### Vercel/Netlify:
1. Зайдите в панель управления
2. Deployments → Select previous → Publish

### Docker:
```bash
# Откат к предыдущему образу
docker pull carshop-cms:previous-tag
docker run -p 8080:80 carshop-cms:previous-tag
```

## Безопасность

1. **HTTPS:** Обязательно используйте HTTPS
2. **CSP Headers:** Настройте Content Security Policy
3. **CORS:** Настройте правильно для API (если используется)
4. **Секреты:** Не включайте секреты в код
5. **Регулярные обновления:** Обновляйте зависимости

## Поддержка

При проблемах с деплоем:
1. Проверьте логи сборки
2. Проверьте консоль браузера
3. Убедитесь в правильности базового пути
4. Проверьте совместимость Node.js версии

---

**Рекомендуемый стек для production:**
- **Hosting:** GitHub Pages (для демо) или Vercel (для production)
- **Database:** IndexedDB (клиентская) или добавить backend API
- **Monitoring:** Sentry + Google Analytics
- **CI/CD:** GitHub Actions

**Готово к деплою!** 🚀

