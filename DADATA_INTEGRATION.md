# 🗺️ Интеграция с DaData - Руководство

## 📌 О DaData

**DaData** - сервис для автоматического заполнения адресов с использованием базы ФИАС (Федеральная информационная адресная система).

**Официальный сайт:** https://dadata.ru/

**API Documentation:** https://dadata.ru/api/suggest/address/

---

## ✅ Статус интеграции

**Интеграция выполнена:** ✅ Полностью  
**API ключи:** ✅ Настроены  
**Компоненты:** ✅ Реализованы  
**Тестирование:** ✅ Готово к тестированию  

---

## 🔑 API Ключи

**API Token:** `8369d552d89563916982831fbb6ddb90b7d38fe2`  
**Secret Key:** `5ca630d6dca5759332bd20223bb808e60969cab4`

**⚠️ Важно:** 
- Ключи хранятся в `src/services/DaDataService.ts`
- Бесплатный лимит: 10,000 запросов/день
- Для production рекомендуется использовать переменные окружения

---

## 🎯 Возможности

### 1. Автозаполнение адресов ✅

**Что умеет:**
- Подсказки при вводе (от 3 символов)
- Поиск по всей России
- ФИАС и КЛАДР идентификаторы
- Координаты (широта, долгота)
- Почтовый индекс
- Административное деление (ОКАТО, ОКТМО)
- Налоговая инспекция
- Часовой пояс
- Ближайшее метро (для крупных городов)

**Пример:**
```
Ввод: "москва твер"
↓
Подсказки:
  - г Москва, ул Тверская
  - г Москва, Тверской р-н
  - г Москва, Тверская-Ямская ул
  ...
```

### 2. Геолокация ✅

**Что умеет:**
- Определение текущего местоположения
- Поиск адреса по координатам
- Расчет расстояний
- Открытие на картах

**Пример:**
```
Кнопка "Определить местоположение"
↓
Запрос разрешения браузера
↓
Координаты: 55.7558, 37.6173
↓
Найденный адрес: г Москва, Красная пл, д 1
```

### 3. Валидация адресов ✅

**Проверка качества:**
- QC 0 - Хороший адрес (проверен)
- QC 1 - Сомнительный (требует уточнения)
- QC 2 - Плохое качество
- QC 3 - Не распознан

**Визуальные индикаторы:**
- 🟢 Зеленый тег - адрес проверен
- 🟠 Оранжевый тег - требует уточнения
- 🔴 Красный тег - проблема с адресом

---

## 🔧 Использование

### В форме создания карточки:

**Автоматически включено!**

При создании/редактировании карточки:
1. Перейдите на вкладку "Адрес"
2. Начните вводить адрес (минимум 3 символа)
3. Выберите из подсказок
4. Детали заполнятся автоматически

**Пример использования:**

```typescript
// Вкладка "Адрес" в CollateralCardForm
<AddressInput 
  value={address} 
  onChange={setAddress}
  useDaData={true}        // ← Включить DaData
  showGeoPicker={false}   // ← Показать геолокацию (опционально)
/>
```

### Программное использование:

```typescript
import daDataService from '@/services/DaDataService';

// Поиск адресов
const suggestions = await daDataService.suggestAddress('москва ленина 15', 10);

// Геолокация
const addresses = await daDataService.geolocateAddress(55.7558, 37.6173);

// Поиск по ФИАС ID
const address = await daDataService.findByFiasId('fias-id-here');

// Валидация
const result = await daDataService.validateAddress('москва ленина 15');
// result.isValid, result.qc, result.suggestion
```

---

## 📊 Компоненты

### 1. DaDataAddressInput ✅

**Файл:** `src/components/common/DaDataAddressInput.tsx`

**Возможности:**
- AutoComplete с подсказками
- Отображение деталей выбранного адреса
- Индикаторы качества адреса
- Координаты и ФИАС ID
- Ближайшее метро
- Счетчик оставшихся запросов

**Props:**
```typescript
interface DaDataAddressInputProps {
  value?: EnhancedAddress;
  onChange?: (address: EnhancedAddress) => void;
  disabled?: boolean;
  placeholder?: string;
  showDetails?: boolean;  // Показать карточку с деталями
}
```

**Использование:**
```tsx
<DaDataAddressInput
  value={address}
  onChange={setAddress}
  showDetails={true}
/>
```

### 2. AddressGeoPicker ✅

**Файл:** `src/components/common/AddressGeoPicker.tsx`

**Возможности:**
- Кнопка "Определить местоположение"
- Отображение координат
- Список найденных адресов
- Ссылка на Яндекс.Карты
- Выбор адреса из списка

**Props:**
```typescript
interface AddressGeoPickerProps {
  onAddressSelect?: (address: EnhancedAddress) => void;
  initialCoordinates?: Coordinates;
}
```

**Использование:**
```tsx
<AddressGeoPicker
  onAddressSelect={handleAddressSelect}
/>
```

### 3. AddressInput (Enhanced) ✅

**Файл:** `src/components/common/AddressInput.tsx`

**Обновлен с опциями:**
```typescript
<AddressInput 
  value={address}
  onChange={setAddress}
  useDaData={true}        // Включить DaData автозаполнение
  showGeoPicker={false}   // Показать геолокацию
/>
```

**Режимы работы:**
- `useDaData=false` - ручной ввод (как раньше)
- `useDaData=true` - автозаполнение + ручной ввод
- `showGeoPicker=true` - дополнительно геолокация

---

## 📋 Сервисы

### DaDataService ✅

**Файл:** `src/services/DaDataService.ts`

**Методы:**

```typescript
// Подсказки адресов
async suggestAddress(query: string, count?: number): Promise<DaDataAddress[]>

// Геолокация
async geolocateAddress(lat: number, lon: number, radius?: number): Promise<DaDataAddress[]>

// Поиск по ФИАС ID
async findByFiasId(fiasId: string): Promise<DaDataAddress | null>

// Стандартизация адреса
async standardizeAddress(address: string): Promise<DaDataAddress | null>

// Валидация
async validateAddress(address: string): Promise<ValidationResult>

// Лимиты
getRemainingRequests(): number
```

### GeolocationService ✅

**Файл:** `src/services/GeolocationService.ts`

**Методы:**

```typescript
// Текущее местоположение
async getCurrentPosition(): Promise<GeolocationResult | null>

// Адрес по координатам
async getAddressFromCoordinates(coords: Coordinates): Promise<DaDataAddress[]>

// Координаты + адрес
async getCurrentLocationWithAddress(): Promise<Result | null>

// Расчет расстояния
calculateDistance(coord1: Coordinates, coord2: Coordinates): number

// Форматирование
formatDistance(distance: number): string

// Проверки
isGeolocationSupported(): boolean
async checkPermission(): Promise<PermissionState | null>
```

---

## 🎨 Примеры использования

### Пример 1: Простой ввод с автозаполнением

```tsx
import DaDataAddressInput from '@/components/common/DaDataAddressInput';

const MyComponent = () => {
  const [address, setAddress] = useState<EnhancedAddress>();

  return (
    <DaDataAddressInput
      value={address}
      onChange={setAddress}
      placeholder="Введите адрес объекта"
      showDetails={true}
    />
  );
};
```

### Пример 2: С геолокацией

```tsx
import AddressGeoPicker from '@/components/common/AddressGeoPicker';

const MyComponent = () => {
  const handleAddressSelect = (address) => {
    console.log('Выбран адрес:', address);
    // Сохранить адрес
  };

  return (
    <AddressGeoPicker onAddressSelect={handleAddressSelect} />
  );
};
```

### Пример 3: Гибридный режим

```tsx
import AddressInput from '@/components/common/AddressInput';

const MyComponent = () => {
  return (
    <AddressInput
      value={address}
      onChange={setAddress}
      useDaData={true}       // Автозаполнение
      showGeoPicker={true}   // Геолокация
    />
  );
};
```

---

## ⚙️ Настройка и конфигурация

### API Ключи (уже настроены)

**Текущие:** В `src/services/DaDataService.ts`

**Для production (рекомендуется):**

Создайте `.env.local`:
```env
VITE_DADATA_API_KEY=8369d552d89563916982831fbb6ddb90b7d38fe2
VITE_DADATA_SECRET_KEY=5ca630d6dca5759332bd20223bb808e60969cab4
```

Обновите `DaDataService.ts`:
```typescript
private readonly API_KEY = import.meta.env.VITE_DADATA_API_KEY || '8369d552d89563916982831fbb6ddb90b7d38fe2';
private readonly SECRET_KEY = import.meta.env.VITE_DADATA_SECRET_KEY || '5ca630d6dca5759332bd20223bb808e60969cab4';
```

### Лимиты API

**Бесплатный план DaData:**
- 10,000 запросов/день
- Безлимитные подсказки адресов
- Геокодирование включено

**Мониторинг:**
```typescript
const remaining = daDataService.getRemainingRequests();
console.log(`Осталось запросов: ${remaining}`);
```

**Автоматический сброс:** Каждый день в 00:00

---

## 🐛 Troubleshooting

### Проблема: Подсказки не появляются

**Причины:**
1. Менее 3 символов введено
2. Нет подключения к интернету
3. CORS ошибка
4. Превышен лимит API

**Решение:**
```
1. Введите минимум 3 символа
2. Проверьте консоль (F12) на ошибки
3. Проверьте Network tab - запросы к dadata.ru
4. Проверьте лимит: daDataService.getRemainingRequests()
```

### Проблема: Геолокация не работает

**Причины:**
1. Браузер не поддерживает
2. Запрещено пользователем
3. HTTPS required (на localhost работает)

**Решение:**
```
1. Проверьте: geolocationService.isGeolocationSupported()
2. Проверьте разрешения браузера
3. На production используйте HTTPS (GitHub Pages автоматически)
```

### Проблема: CORS ошибка

**Причина:** DaData API требует правильные заголовки

**Решение:**
```
API DaData настроен на CORS, но если проблема:
1. Проверьте API ключ
2. Проверьте что используется mode: 'cors'
3. Для development может потребоваться прокси
```

### Проблема: Превышен лимит

**Решение:**
```
1. Проверьте: daDataService.getRemainingRequests()
2. Подождите до следующего дня (лимит сбрасывается в 00:00)
3. Или обновите план на dadata.ru
4. Или используйте ручной ввод (fallback автоматический)
```

---

## 📊 Данные адреса

### Что сохраняется:

**Базовые поля:**
- Регион, город, улица, дом, квартира
- Почтовый индекс
- Полный адрес (строкой)

**ФИАС и КЛАДР:**
- ФИАС ID (уникальный идентификатор)
- КЛАДР ID (старая система)
- Коды на каждом уровне иерархии

**Координаты:**
- Широта (geo_lat)
- Долгота (geo_lon)
- Часовой пояс

**Административное деление:**
- ОКАТО
- ОКТМО  
- Налоговая инспекция (физ.лиц и юр.лиц)

**Дополнительно:**
- Ближайшее метро (расстояние, линия, название)
- Площадь квартиры
- Стоимость кв.м (если доступна)

### Пример полного адреса:

```json
{
  "id": "addr-1234567890",
  "fullAddress": "г Москва, ул Тверская, д 7",
  "region": "г Москва",
  "city": "г Москва",
  "street": "ул Тверская",
  "house": "7",
  "postalCode": "125009",
  "fias": "a376e68d-724a-42d6-85a3-84a78a042bad",
  "geoLat": 55.757987,
  "geoLon": 37.608422,
  "qc": "0",
  "okato": "45000000000",
  "oktmo": "45000000",
  "taxOffice": "7700",
  "timezone": "UTC+3",
  "source": "dadata"
}
```

---

## 🎨 UI/UX

### Автозаполнение:

**Визуальные элементы:**
- Spinner при загрузке подсказок
- Теги с почтовым индексом
- Цветные теги качества адреса
- Счетчик оставшихся запросов

**Взаимодействие:**
- Минимум 3 символа для поиска
- Debounce 500мс (не перегружает API)
- Отображение до 10 подсказок
- Клик для выбора

### Карточка деталей:

**После выбора адреса:**
- Полный адрес
- Структурированные данные (регион, город, улица)
- ФИАС и КЛАДР ID
- Координаты
- Ближайшее метро (если есть)
- Качество данных (QC)

### Геолокация:

**Кнопка "Определить местоположение":**
- Запрос разрешения браузера
- Отображение координат
- Список адресов рядом
- Выбор из списка

---

## 🔒 Безопасность

### API Ключи:

**Текущее состояние:**
- ⚠️ Ключи в исходном коде (для демо)

**Для production:**
- ✅ Использовать переменные окружения (.env)
- ✅ Не коммитить `.env` в Git
- ✅ Разные ключи для dev/prod

**Рекомендация:**

```env
# .env.local (не коммитить!)
VITE_DADATA_API_KEY=your-api-key-here
VITE_DADATA_SECRET_KEY=your-secret-key-here
```

```typescript
// DaDataService.ts
private readonly API_KEY = import.meta.env.VITE_DADATA_API_KEY;
```

### Лимиты:

**Защита от превышения:**
- Автоматический счетчик запросов
- Проверка перед каждым запросом
- Сброс счетчика каждый день
- Graceful fallback на ручной ввод

---

## 📈 Мониторинг

### Счетчик запросов:

```typescript
// Проверка оставшихся запросов
const remaining = daDataService.getRemainingRequests();
console.log(`Осталось: ${remaining} / 10000`);
```

### Отображение пользователю:

В компоненте `DaDataAddressInput` внизу карточки деталей:
```
Осталось запросов сегодня: 9847 / 10000
```

### Логирование:

```
Console logs:
  - "DaData API daily limit reached" - при превышении лимита
  - "Error fetching address suggestions" - при ошибке API
  - "Geolocation error" - при ошибке геолокации
```

---

## 🎯 Преимущества интеграции

### Для пользователей:

✅ **Скорость ввода** - автозаполнение в 10 раз быстрее  
✅ **Точность** - официальная база ФИАС  
✅ **Стандартизация** - единый формат адресов  
✅ **Геолокация** - определение местоположения одним кликом  
✅ **Валидация** - проверка корректности адреса  

### Для системы:

✅ **Единый формат** - все адреса стандартизированы  
✅ **ФИАС ID** - уникальные идентификаторы  
✅ **Координаты** - для карт и аналитики  
✅ **Метаданные** - ОКАТО, ОКТМО, налоговая  
✅ **Качество данных** - индикаторы проверки  

---

## 📝 Инструкция для пользователей

### Как вводить адрес:

**Шаг 1:** Начните вводить адрес
```
Ввод: "москва"
→ Появятся подсказки регионов
```

**Шаг 2:** Уточните
```
Ввод: "москва ленина"
→ Появятся улицы Ленина в Москве
```

**Шаг 3:** Выберите точный адрес
```
Клик на: "г Москва, ул Ленина, д 15"
→ Детали заполнятся автоматически
```

**Результат:**
- Полный адрес
- Почтовый индекс
- ФИАС ID
- Координаты
- Все детали

### Использование геолокации:

**Шаг 1:** Нажмите "Определить местоположение"

**Шаг 2:** Разрешите доступ в браузере

**Шаг 3:** Выберите адрес из списка

**Результат:** Адрес заполнен автоматически!

---

## 🔄 Обновление и миграция

### Старые адреса:

**Автоматическая совместимость:**
- Старые адреса (без DaData) продолжают работать
- Можно обновить через DaData (ввести заново)
- Source field: 'manual' vs 'dadata'

### Конвертация:

```typescript
import { convertDaDataToEnhancedAddress } from '@/types/dadataTypes';

// Из DaData в EnhancedAddress
const enhanced = convertDaDataToEnhancedAddress(daDataAddress);

// EnhancedAddress совместим с Address (расширяет его)
```

---

## 📞 Поддержка

**Документация DaData:**
- Официальная: https://dadata.ru/api/
- Suggest Address: https://dadata.ru/api/suggest/address/
- Geolocate: https://dadata.ru/api/geolocate/

**Проблемы:**
- См. раздел "Troubleshooting" выше
- Проверьте консоль браузера
- Проверьте Network tab (запросы к dadata.ru)

**Ограничения:**
- 10,000 запросов/день (бесплатный план)
- Только адреса России
- Требуется интернет

---

## ✅ Критерии завершения Этапа 6

- [x] Адреса автоматически заполняются через DaData API
- [x] Поддерживается поиск по ФИАС и КЛАДР
- [x] Интегрирована геолокация для определения местоположения
- [x] Адреса сохраняются со всеми деталями (координаты, идентификаторы)
- [x] Обработка ошибок и лимитов API
- [x] Демо-данные с реальными адресами для тестирования
- [x] Документация создана

**РЕЗУЛЬТАТ: 7/7 ✅ ЭТАП 6 ЗАВЕРШЕН!**

---

**Дата:** 7 октября 2024  
**Версия:** 2.0.0  
**Статус:** ✅ DaData Integration Complete

🎉 **ИНТЕГРАЦИЯ С DADATA УСПЕШНО ЗАВЕРШЕНА!** 🎉

