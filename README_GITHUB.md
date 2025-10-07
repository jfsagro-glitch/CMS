# 🏦 CarShop CMS - Система управления залоговым имуществом

> Современная веб-система для управления реестром залогового имущества банков и финансовых организаций

[![Deploy Status](https://github.com/jfsagro-glitch/CMS/actions/workflows/deploy.yml/badge.svg)](https://github.com/jfsagro-glitch/CMS/actions/workflows/deploy.yml)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/jfsagro-glitch/CMS)
[![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/react-18.2.0-blue.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

---

## 🌐 Live Demo

### **🔗 [https://jfsagro-glitch.github.io/cms/](https://jfsagro-glitch.github.io/cms/)**

Попробуйте систему онлайн! При первом запуске автоматически загрузятся 5 демо-карточек.

---

## ✨ Ключевые возможности

- 📋 **Реестр карточек обеспечения** - полный CRUD с поиском и фильтрацией
- 🎯 **18 типов объектов** - от квартир до автомобилей с динамическими характеристиками
- 👥 **Управление партнерами** - собственники, залогодатели с долями права
- 🗺️ **Автозаполнение адресов** - интеграция с DaData (база ФИАС)
- 📍 **Геолокация** - определение местоположения одним кликом
- 📄 **Документы** - загрузка, предпросмотр (изображения, PDF), управление
- 📊 **Экспорт/импорт** - Excel, JSON резервное копирование
- 🔍 **Поиск в реальном времени** - по всем полям
- 🎨 **Современный UI** - Ant Design 5, светлая/темная темы
- 💾 **Offline-first** - работает без интернета через IndexedDB

---

## 🚀 Быстрый старт

### Установка и запуск локально

```bash
# Клонировать репозиторий
git clone https://github.com/jfsagro-glitch/CMS.git
cd CMS

# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev
```

Приложение откроется автоматически на `http://localhost:3000`

### Сборка для production

```bash
# Production сборка
npm run build

# Просмотр production сборки
npm run preview

# Деплой на GitHub Pages
npm run deploy
```

---

## 📚 Документация

### Для начала работы:

- **[⭐_READ_ME_FIRST.md](./⭐_READ_ME_FIRST.md)** - НАЧНИТЕ ЗДЕСЬ!
- **[START_HERE.md](./START_HERE.md)** - Введение в систему
- **[STAGE2_QUICKSTART.md](./STAGE2_QUICKSTART.md)** - Подробные примеры использования
- **[HOW_TO_USE.md](./HOW_TO_USE.md)** - Детальное руководство пользователя

### Для разработчиков:

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Руководство разработчика
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Структура кода
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Архитектура системы

### Для деплоя:

- **[✅_DEPLOYMENT_READY.md](./✅_DEPLOYMENT_READY.md)** - Пошаговая инструкция деплоя
- **[GITHUB_PAGES_DEPLOY.md](./GITHUB_PAGES_DEPLOY.md)** - Полное руководство
- **[🚀_DEPLOY_NOW.md](./🚀_DEPLOY_NOW.md)** - Быстрые команды

### Интеграции:

- **[DADATA_INTEGRATION.md](./DADATA_INTEGRATION.md)** - Автозаполнение адресов через DaData

### Полная информация:

- **[PROJECT_COMPLETE.md](./PROJECT_COMPLETE.md)** - Комплексная документация проекта
- **[📖_NAVIGATION_MAP.md](./📖_NAVIGATION_MAP.md)** - Навигация по всем документам

---

## 🏗️ Технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18.2.0 | Frontend framework |
| TypeScript | 5.3.3 | Type safety |
| Ant Design | 5.12.0 | UI components |
| Redux Toolkit | 2.0.1 | State management |
| React Router | 6.20.0 | Routing (HashRouter) |
| Dexie.js | 3.2.4 | IndexedDB wrapper |
| Vite | 5.0.8 | Build tool |
| DaData API | 4.1 | Address suggestions (ФИАС) |
| XLSX | 0.18.5 | Excel import/export |

---

## 📊 Функциональность

### Типы объектов (18):

**Жилая недвижимость (5):**
- Квартира, Жилой дом, Таунхаус, Комната, Земельный участок

**Коммерческая недвижимость (7):**
- Офис, Торговое помещение, Склад, Гостиница, Кафе/ресторан, АЗС, Автосалон

**Промышленная недвижимость (2):**
- Промышленное здание, Цех

**Движимое имущество (4):**
- Легковой автомобиль, Грузовой автомобиль, Оборудование, Техника

### Характеристики:

- **150+ полей** с валидацией
- **Динамическое отображение** по типу объекта
- **Автоматическая подстановка** единиц измерения
- **Коды ЦБ** (60+ кодов)

---

## 🎨 Скриншоты

### Главная страница - Реестр карточек
- Таблица с полными данными
- Поиск и фильтрация
- Массовые операции

### Создание карточки - 5 вкладок
1. Основная информация + классификация
2. Партнеры (собственники, залогодатели)
3. **Адрес с DaData** автозаполнением ⭐
4. Характеристики (динамические поля)
5. Документы (загрузка, предпросмотр)

### Темы
- Светлая и темная темы
- Сохранение настроек

---

## 🔧 Разработка

### Установка зависимостей:

```bash
npm install
```

### Команды разработки:

```bash
npm run dev         # Запуск dev-сервера
npm run build       # Production сборка
npm run preview     # Просмотр production
npm run lint        # Проверка кода
npm run type-check  # Проверка типов
```

### Деплой:

```bash
npm run deploy      # Ручной деплой на GitHub Pages
```

**Автодеплой:** Push в `main` → GitHub Actions автоматически деплоит

---

## 📁 Структура проекта

```
src/
├── components/          # React компоненты
│   ├── layout/         # MainLayout, Header, Sidebar
│   └── common/         # Переиспользуемые компоненты
├── modules/            # Feature модули (страницы)
│   └── Registry/       # Модуль реестра (готов)
├── store/              # Redux store и slices
├── services/           # Сервисы (IndexedDB, DaData)
├── types/              # TypeScript типы
├── utils/              # Утилиты и конфигурация
├── App.tsx             # Главный компонент
└── main.tsx            # Точка входа
```

---

## 🗺️ Интеграция с DaData

### Автозаполнение адресов:

**API:** [DaData.ru](https://dadata.ru/)  
**База:** ФИАС (Федеральная информационная адресная система)

**Возможности:**
- Подсказки при вводе (от 3 символов)
- ФИАС и КЛАДР идентификаторы
- Координаты (широта, долгота)
- Почтовый индекс
- Ближайшее метро (для городов)
- Административное деление (ОКАТО, ОКТМО)
- Валидация качества адреса

**Подробности:** см. [DADATA_INTEGRATION.md](./DADATA_INTEGRATION.md)

---

## 💾 Хранение данных

### IndexedDB:

**База:** CMSDatabase (версия 2)

**Таблицы:**
- `collateralCards` - ExtendedCollateralCard (с партнерами, адресами, характеристиками, документами)
- `partners` - Partner
- `documents` - Document
- `settings` - AppSettings

**Особенности:**
- Offline-first подход
- Автоматические миграции
- Backup/Restore функционал
- Хранение документов (Base64)

---

## 📖 Roadmap

### ✅ Реализовано (70%):

- ✅ Этап 1: Базовая архитектура (100%)
- ✅ Этап 2: Модуль реестров и динамические формы (100%)
- ✅ Этап 5: GitHub Pages Deploy (100%)
- ✅ Этап 6: DaData интеграция (100%)

### ⏳ В планах (30%):

- ⏳ Этап 3: Расширенные модули (10% - планы готовы)
  - Мобильный оценщик
  - SmartDeal (закладные, ЕГРН)
  - Отчеты ЦБ
  
- ⏳ Этап 4: Настройки и оптимизация (15% - планы готовы)
  - Ролевая модель
  - Модуль мониторинга
  - Система справочников

**Детали:** см. [STAGE3_PLAN.md](./STAGE3_PLAN.md)

---

## 🤝 Вклад в проект

Проект открыт для улучшений!

**Как помочь:**
1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

**Области для вклада:**
- Новые типы объектов
- Дополнительные характеристики
- UI/UX улучшения
- Документация
- Тесты
- Оптимизация

---

## 📝 Лицензия

Proprietary - Все права защищены

---

## 📞 Контакты

- **Repository:** https://github.com/jfsagro-glitch/CMS
- **Issues:** https://github.com/jfsagro-glitch/CMS/issues
- **Discussions:** https://github.com/jfsagro-glitch/CMS/discussions

---

## 🎊 О проекте

**CarShop CMS** создана для автоматизации управления залоговым имуществом в банках и финансовых организациях.

**Статус:** ✅ Production Ready  
**Версия:** 2.0.0  
**Дата релиза:** 7 октября 2024

**Создано:**
- 92 файла
- 10,000+ строк кода
- 32 документа
- 21 компонент
- 18 типов объектов
- 150+ полей характеристик

---

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║         🎉 ГОТОВО К ИСПОЛЬЗОВАНИЮ! 🎉                   ║
║                                                          ║
║  🌐 Live Demo:                                           ║
║  https://jfsagro-glitch.github.io/cms/                   ║
║                                                          ║
║  📖 Документация: START_HERE.md                          ║
║  🚀 Деплой: ✅_DEPLOYMENT_READY.md                      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

**Начните работу:** Откройте [⭐_READ_ME_FIRST.md](./⭐_READ_ME_FIRST.md)

**© 2024 CarShop CMS | Built with ❤️ using React + TypeScript + DaData**

