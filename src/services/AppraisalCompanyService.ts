import { AppraisalCompany } from '@/types/AppraisalCompany';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'cms_appraisal_companies';

class AppraisalCompanyService {
  private getCompanies(): AppraisalCompany[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveCompanies(companies: AppraisalCompany[]): void {
    try {
      // Сначала удаляем старый ключ, чтобы освободить место
      localStorage.removeItem(STORAGE_KEY);
      // Теперь сохраняем новые данные
      localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
    } catch (error: any) {
      // Если все еще ошибка, пробуем очистить все связанные ключи
      if (error.name === 'QuotaExceededError') {
        console.warn('Очищаем localStorage для освобождения места...');
        // Удаляем все ключи, связанные с appraisal companies
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('appraisal') || key.includes('cms_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        // Пробуем снова
        localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
      } else {
        throw error;
      }
    }
  }

  getAll(): AppraisalCompany[] {
    return this.getCompanies();
  }

  getById(id: string): AppraisalCompany | undefined {
    return this.getCompanies().find(c => c.id === id);
  }

  create(company: Omit<AppraisalCompany, 'id' | 'createdAt' | 'updatedAt'>): AppraisalCompany {
    const companies = this.getCompanies();
    const newCompany: AppraisalCompany = {
      ...company,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    companies.push(newCompany);
    this.saveCompanies(companies);
    return newCompany;
  }

  update(id: string, updates: Partial<AppraisalCompany>): AppraisalCompany | undefined {
    const companies = this.getCompanies();
    const index = companies.findIndex(c => c.id === id);
    if (index === -1) return undefined;

    const updatedCompany = {
      ...companies[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    companies[index] = updatedCompany;
    this.saveCompanies(companies);
    return updatedCompany;
  }

  delete(id: string): void {
    const companies = this.getCompanies().filter(c => c.id !== id);
    this.saveCompanies(companies);
  }

  // Загрузка данных из Excel файла
  async loadFromExcelFile(
    file: File,
    limit: number = 20,
    clearExisting: boolean = false
  ): Promise<number> {
    try {
      console.log('Парсинг Excel файла:', file.name, file.size);
      const data = await file.arrayBuffer();
      console.log('Размер данных:', data.byteLength);

      const workbook = XLSX.read(data, { type: 'array' });
      console.log('Листы в файле:', workbook.SheetNames);

      if (workbook.SheetNames.length === 0) {
        console.error('В файле нет листов');
        return 0;
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Пробуем найти строку с заголовками (ищем строку с текстом "Наименование" или похожим)
      let headerRow = 0;
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

      // Ищем строку заголовка (первые 10 строк)
      for (let row = 0; row < Math.min(10, range.e.r + 1); row++) {
        const rowData: any[] = [];
        for (let col = 0; col <= Math.min(20, range.e.c); col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          if (cell && cell.v) {
            rowData.push(String(cell.v).toLowerCase());
          }
        }
        // Проверяем, есть ли в строке ключевые слова заголовков
        const headerKeywords = ['наименование', 'инн', 'огрн', 'адрес', 'руководитель'];
        if (rowData.some(val => headerKeywords.some(keyword => val.includes(keyword)))) {
          headerRow = row;
          console.log(`Найдена строка заголовка: ${row + 1}`);
          break;
        }
      }

      // Парсим с учетом найденной строки заголовка
      // Если нашли заголовок не в первой строке, создаем новый диапазон
      let jsonData: any[];
      if (headerRow > 0) {
        // Создаем новый диапазон, начиная с найденной строки заголовка
        const newRange = XLSX.utils.encode_range({
          s: { r: headerRow, c: 0 },
          e: range.e,
        });
        worksheet['!ref'] = newRange;
        jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        // Восстанавливаем оригинальный диапазон
        worksheet['!ref'] = XLSX.utils.encode_range(range);
      } else {
        jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      }
      console.log('Всего строк в файле:', jsonData.length);

      if (jsonData.length === 0) {
        console.warn('Файл не содержит данных');
        return 0;
      }

      // Выводим первую строку для отладки
      if (jsonData.length > 0) {
        const firstRow = jsonData[0] as any;
        console.log('Ключи первой строки:', Object.keys(firstRow));
        console.log('Первая строка (первые 5 полей):', Object.entries(firstRow).slice(0, 5));
      }

      // Ограничиваем количество строк
      const rowsToProcess = jsonData.slice(0, limit);
      console.log(`Обрабатываем первые ${rowsToProcess.length} строк из ${jsonData.length}`);

      // Если нужно очистить существующие данные, делаем это перед импортом
      if (clearExisting) {
        console.log('Очищаем существующие данные перед импортом...');
        localStorage.removeItem(STORAGE_KEY);
      }
      const existingCompanies = clearExisting ? [] : this.getCompanies();
      const newCompanies: AppraisalCompany[] = [];
      let imported = 0;
      let skipped = 0;

      for (const row of rowsToProcess as any[]) {
        try {
          // Получаем все ключи строки для отладки
          const rowKeys = Object.keys(row);

          // Пробуем найти название компании - ищем первую колонку с текстом
          let name = '';
          for (const key of rowKeys) {
            const value = row[key];
            if (value && typeof value === 'string' && value.trim().length > 3) {
              // Проверяем, не является ли это числом (ИНН, ОГРН и т.д.)
              if (!/^\d+$/.test(value.trim())) {
                name = value.trim();
                break;
              }
            }
          }

          // Если не нашли, пробуем стандартные названия колонок
          if (!name) {
            name = this.findFieldValue(
              row,
              [
                'Наименование',
                'наименование',
                'Название',
                'название',
                'Компания',
                'компания',
                'Организация',
                'организация',
              ],
              ''
            );
          }

          if (!name || name.trim().length === 0) {
            console.warn('Пропущена строка без названия:', rowKeys);
            skipped++;
            continue;
          }

          // Маппинг полей из Excel - используем все возможные варианты названий колонок
          const companyData: Partial<AppraisalCompany> = {
            name: String(name).trim(),
            inn: this.findFieldValue(row, ['ИНН', 'инн', 'ИНН/КПП', 'инн/кпп'], ''),
            ogrn: this.findFieldValue(row, ['ОГРН', 'огрн'], ''),
            address: this.findFieldValue(
              row,
              ['Адрес', 'адрес', 'Адрес регистрации', 'адрес регистрации'],
              ''
            ),
            phone: this.findFieldValue(row, ['Телефон', 'телефон', 'Тел', 'тел'], ''),
            email: this.findFieldValue(row, ['Email', 'email', 'E-mail', 'e-mail'], ''),
            director: this.findFieldValue(
              row,
              [
                'Руководитель',
                'руководитель',
                'Директор',
                'директор',
                'Генеральный директор',
                'генеральный директор',
              ],
              ''
            ),
            accreditationDate: this.findFieldValue(row, ['Дата аккредитации', 'дата аккредитации'])
              ? this.parseDate(this.findFieldValue(row, ['Дата аккредитации', 'дата аккредитации']))
              : undefined,
            certificateExpiryDate: this.findFieldValue(row, [
              'Срок действия сертификатов',
              'срок действия сертификатов',
              'Сертификаты до',
              'сертификаты до',
            ])
              ? this.parseDate(
                  this.findFieldValue(row, [
                    'Срок действия сертификатов',
                    'срок действия сертификатов',
                    'Сертификаты до',
                    'сертификаты до',
                  ])
                )
              : undefined,
            insuranceExpiryDate: this.findFieldValue(row, [
              'Срок действия страхования',
              'срок действия страхования',
              'Страхование до',
              'страхование до',
            ])
              ? this.parseDate(
                  this.findFieldValue(row, [
                    'Срок действия страхования',
                    'срок действия страхования',
                    'Страхование до',
                    'страхование до',
                  ])
                )
              : undefined,
            sroMembership: this.parseBoolean(
              this.findFieldValue(
                row,
                ['Членство в СРО', 'членство в сро', 'СРО', 'сро', 'Член СРО', 'член сро'],
                false
              )
            ),
            status: this.parseStatus(
              this.findFieldValue(
                row,
                ['Статус', 'статус', 'Статус аккредитации', 'статус аккредитации'],
                'active'
              )
            ),
            notes: this.findFieldValue(
              row,
              ['Примечания', 'примечания', 'Комментарий', 'комментарий'],
              ''
            ),
          };

          // Очищаем пустые строки и обрабатываем ИНН
          if (companyData.inn) {
            companyData.inn = String(companyData.inn).split('/')[0].trim();
          }
          if (companyData.ogrn) companyData.ogrn = String(companyData.ogrn).trim();
          if (companyData.address) companyData.address = String(companyData.address).trim();
          if (companyData.phone) companyData.phone = String(companyData.phone).trim();
          if (companyData.email) companyData.email = String(companyData.email).trim();
          if (companyData.director) companyData.director = String(companyData.director).trim();
          if (companyData.notes) companyData.notes = String(companyData.notes).trim();

          // Проверяем, не существует ли уже компания с таким ИНН или названием
          const exists = existingCompanies.some(
            c =>
              (c.inn && companyData.inn && c.inn === companyData.inn) ||
              (companyData.name && c.name.toLowerCase() === companyData.name.toLowerCase())
          );

          if (!exists) {
            const newCompany: AppraisalCompany = {
              ...companyData,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as AppraisalCompany;
            newCompanies.push(newCompany);
            existingCompanies.push(newCompany);
            imported++;
          } else {
            skipped++;
          }
        } catch (error: any) {
          console.warn('Ошибка обработки строки:', error?.message);
          skipped++;
        }
      }

      // Сохраняем все компании одним батчем
      if (newCompanies.length > 0 || clearExisting) {
        try {
          // Сохраняем только новые компании, если не очищаем существующие
          const companiesToSave = clearExisting ? newCompanies : existingCompanies;

          // Проверяем размер данных перед сохранением
          const dataToSave = JSON.stringify(companiesToSave);
          const dataSize = new Blob([dataToSave]).size;
          console.log(`Размер данных для сохранения: ${(dataSize / 1024).toFixed(2)} KB`);

          // Всегда сохраняем через saveCompanies, который сам обработает очистку
          this.saveCompanies(companiesToSave);
          console.log(`Сохранено ${companiesToSave.length} компаний в localStorage`);
        } catch (error: any) {
          console.error('Ошибка сохранения в localStorage:', error);
          // Если не хватает места, пробуем очистить все связанные ключи и сохранить только новые
          try {
            console.warn('Пробуем очистить localStorage и сохранить только новые компании...');
            // Очищаем все ключи, связанные с appraisal
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.includes('appraisal')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => {
              console.log(`Удаляем ключ: ${key}`);
              localStorage.removeItem(key);
            });
            
            // Пробуем сохранить только новые компании
            this.saveCompanies(newCompanies);
            console.log('Очищен localStorage, сохранены только новые компании');
          } catch (e: any) {
            console.error('Критическая ошибка сохранения:', e);
            // Последняя попытка - сохраняем только первые 10 компаний
            try {
              console.warn('Пробуем сохранить только первые 10 компаний...');
              // Полная очистка всех ключей с appraisal
              for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.includes('appraisal')) {
                  localStorage.removeItem(key);
                }
              }
              this.saveCompanies(newCompanies.slice(0, 10));
              console.log('Сохранены только первые 10 компаний из-за ограничений localStorage');
            } catch (finalError) {
              console.error('Невозможно сохранить данные:', finalError);
              // Показываем информацию о занятом месте
              let totalSize = 0;
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                  const value = localStorage.getItem(key) || '';
                  totalSize += key.length + value.length;
                }
              }
              console.error(`Общий размер localStorage: ${(totalSize / 1024).toFixed(2)} KB`);
              throw finalError;
            }
          }
        }
      }

      console.log(`Импорт завершен: импортировано ${imported}, пропущено ${skipped}`);
      return imported;
    } catch (error: any) {
      console.error('Ошибка загрузки Excel файла:', error);
      console.error('Детали ошибки:', error.message, error.stack);
      throw error;
    }
  }

  // Парсинг даты из различных форматов
  private parseDate(value: any): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'number') {
      // Excel дата (число дней с 1900-01-01)
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      return date.toISOString();
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return undefined;
  }

  // Вспомогательная функция для поиска значения поля по разным вариантам названий
  private findFieldValue(row: any, fieldNames: string[], defaultValue: any = ''): any {
    for (const fieldName of fieldNames) {
      if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
        return row[fieldName];
      }
    }
    return defaultValue;
  }

  // Парсинг статуса
  private parseStatus(value: string): 'active' | 'suspended' | 'revoked' {
    if (!value) return 'active';
    const lower = value.toLowerCase();
    if (lower.includes('актив') || lower.includes('действ')) return 'active';
    if (lower.includes('приостанов') || lower.includes('приост')) return 'suspended';
    if (lower.includes('отозван') || lower.includes('аннул')) return 'revoked';
    return 'active';
  }

  // Парсинг булевого значения
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      return (
        lower === 'да' || lower === 'yes' || lower === 'true' || lower === '1' || lower === '✓'
      );
    }
    if (typeof value === 'number') return value === 1;
    return false;
  }

  // Создание демо-компаний напрямую
  private createDemoCompanies(count: number = 20): number {
    const existingCompanies = this.getCompanies();
    const demoCompanies: AppraisalCompany[] = [
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценка-Профи"',
        inn: '7701234567',
        ogrn: '1027701234567',
        address: 'г. Москва, ул. Тверская, д. 10, офис 101',
        phone: '+7 (495) 123-45-67',
        email: 'info@ocenka-profi.ru',
        director: 'Иванов Иван Иванович',
        accreditationDate: '2020-01-15T00:00:00.000Z',
        certificateExpiryDate: '2025-12-31T00:00:00.000Z',
        insuranceExpiryDate: '2025-12-31T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Эксперт-Оценка"',
        inn: '7702345678',
        ogrn: '1027702345678',
        address: 'г. Москва, ул. Ленинградская, д. 25, офис 205',
        phone: '+7 (495) 234-56-78',
        email: 'contact@expert-ocenka.ru',
        director: 'Петрова Мария Сергеевна',
        accreditationDate: '2019-03-20T00:00:00.000Z',
        certificateExpiryDate: '2025-06-30T00:00:00.000Z',
        insuranceExpiryDate: '2025-06-30T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Независимая оценка"',
        inn: '7703456789',
        ogrn: '1027703456789',
        address: 'г. Санкт-Петербург, Невский пр., д. 50, офис 301',
        phone: '+7 (812) 345-67-89',
        email: 'info@nezavisimaya-ocenka.ru',
        director: 'Сидоров Петр Александрович',
        accreditationDate: '2021-05-10T00:00:00.000Z',
        certificateExpiryDate: '2026-05-10T00:00:00.000Z',
        insuranceExpiryDate: '2026-05-10T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Центр оценки недвижимости"',
        inn: '7704567890',
        ogrn: '1027704567890',
        address: 'г. Москва, ул. Арбат, д. 15, офис 402',
        phone: '+7 (495) 456-78-90',
        email: 'office@centr-ocenki.ru',
        director: 'Козлова Анна Владимировна',
        accreditationDate: '2018-07-15T00:00:00.000Z',
        certificateExpiryDate: '2024-12-31T00:00:00.000Z',
        insuranceExpiryDate: '2024-12-31T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценочная компания Альфа"',
        inn: '7705678901',
        ogrn: '1027705678901',
        address: 'г. Екатеринбург, ул. Ленина, д. 30, офис 501',
        phone: '+7 (343) 567-89-01',
        email: 'info@alfa-ocenka.ru',
        director: 'Морозов Дмитрий Николаевич',
        accreditationDate: '2020-09-01T00:00:00.000Z',
        certificateExpiryDate: '2025-09-01T00:00:00.000Z',
        insuranceExpiryDate: '2025-09-01T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Профессиональная оценка"',
        inn: '7706789012',
        ogrn: '1027706789012',
        address: 'г. Новосибирск, ул. Красный проспект, д. 20, офис 102',
        phone: '+7 (383) 678-90-12',
        email: 'contact@prof-ocenka.ru',
        director: 'Волкова Елена Игоревна',
        accreditationDate: '2019-11-20T00:00:00.000Z',
        certificateExpiryDate: '2025-11-20T00:00:00.000Z',
        insuranceExpiryDate: '2025-11-20T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценка-Сервис"',
        inn: '7707890123',
        ogrn: '1027707890123',
        address: 'г. Казань, ул. Баумана, д. 40, офис 203',
        phone: '+7 (843) 789-01-23',
        email: 'info@ocenka-service.ru',
        director: 'Новиков Сергей Викторович',
        accreditationDate: '2021-02-14T00:00:00.000Z',
        certificateExpiryDate: '2026-02-14T00:00:00.000Z',
        insuranceExpiryDate: '2026-02-14T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Экспертиза и оценка"',
        inn: '7708901234',
        ogrn: '1027708901234',
        address: 'г. Нижний Новгород, ул. Покровка, д. 12, офис 304',
        phone: '+7 (831) 890-12-34',
        email: 'office@expertiza-ocenka.ru',
        director: 'Смирнова Ольга Петровна',
        accreditationDate: '2020-06-25T00:00:00.000Z',
        certificateExpiryDate: '2025-06-25T00:00:00.000Z',
        insuranceExpiryDate: '2025-06-25T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценочное агентство Бета"',
        inn: '7709012345',
        ogrn: '1027709012345',
        address: 'г. Челябинск, ул. Кирова, д. 100, офис 405',
        phone: '+7 (351) 901-23-45',
        email: 'info@beta-ocenka.ru',
        director: 'Лебедев Андрей Михайлович',
        accreditationDate: '2019-08-10T00:00:00.000Z',
        certificateExpiryDate: '2025-08-10T00:00:00.000Z',
        insuranceExpiryDate: '2025-08-10T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценка-Консалт"',
        inn: '7710123456',
        ogrn: '1027710123456',
        address: 'г. Ростов-на-Дону, ул. Большая Садовая, д. 55, офис 506',
        phone: '+7 (863) 012-34-56',
        email: 'contact@ocenka-konsult.ru',
        director: 'Федорова Татьяна Алексеевна',
        accreditationDate: '2021-04-05T00:00:00.000Z',
        certificateExpiryDate: '2026-04-05T00:00:00.000Z',
        insuranceExpiryDate: '2026-04-05T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Стандарт-Оценка"',
        inn: '7711234567',
        ogrn: '1027711234567',
        address: 'г. Уфа, ул. Ленина, д. 70, офис 107',
        phone: '+7 (347) 123-45-67',
        email: 'info@standart-ocenka.ru',
        director: 'Кузнецов Игорь Сергеевич',
        accreditationDate: '2020-10-12T00:00:00.000Z',
        certificateExpiryDate: '2025-10-12T00:00:00.000Z',
        insuranceExpiryDate: '2025-10-12T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценочная группа Гамма"',
        inn: '7712345678',
        ogrn: '1027712345678',
        address: 'г. Воронеж, пр. Революции, д. 33, офис 208',
        phone: '+7 (473) 234-56-78',
        email: 'office@gamma-ocenka.ru',
        director: 'Орлова Наталья Дмитриевна',
        accreditationDate: '2019-12-18T00:00:00.000Z',
        certificateExpiryDate: '2025-12-18T00:00:00.000Z',
        insuranceExpiryDate: '2025-12-18T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценка-Трейд"',
        inn: '7713456789',
        ogrn: '1027713456789',
        address: 'г. Краснодар, ул. Красная, д. 22, офис 309',
        phone: '+7 (861) 345-67-89',
        email: 'info@ocenka-trade.ru',
        director: 'Соколов Владимир Анатольевич',
        accreditationDate: '2021-01-30T00:00:00.000Z',
        certificateExpiryDate: '2026-01-30T00:00:00.000Z',
        insuranceExpiryDate: '2026-01-30T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценочное бюро Дельта"',
        inn: '7714567890',
        ogrn: '1027714567890',
        address: 'г. Самара, ул. Московское шоссе, д. 18, офис 410',
        phone: '+7 (846) 456-78-90',
        email: 'contact@delta-ocenka.ru',
        director: 'Попова Светлана Валерьевна',
        accreditationDate: '2020-03-22T00:00:00.000Z',
        certificateExpiryDate: '2025-03-22T00:00:00.000Z',
        insuranceExpiryDate: '2025-03-22T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Профессиональная экспертиза"',
        inn: '7715678901',
        ogrn: '1027715678901',
        address: 'г. Омск, ул. Ленина, д. 45, офис 511',
        phone: '+7 (381) 567-89-01',
        email: 'info@prof-expertiza.ru',
        director: 'Васильев Роман Олегович',
        accreditationDate: '2019-07-08T00:00:00.000Z',
        certificateExpiryDate: '2025-07-08T00:00:00.000Z',
        insuranceExpiryDate: '2025-07-08T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценка-Инвест"',
        inn: '7716789012',
        ogrn: '1027716789012',
        address: 'г. Пермь, ул. Ленина, д. 60, офис 112',
        phone: '+7 (342) 678-90-12',
        email: 'office@ocenka-invest.ru',
        director: 'Михайлова Екатерина Сергеевна',
        accreditationDate: '2021-06-15T00:00:00.000Z',
        certificateExpiryDate: '2026-06-15T00:00:00.000Z',
        insuranceExpiryDate: '2026-06-15T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценочная компания Эпсилон"',
        inn: '7717890123',
        ogrn: '1027717890123',
        address: 'г. Волгоград, пр. Ленина, д. 28, офис 213',
        phone: '+7 (844) 789-01-23',
        email: 'info@epsilon-ocenka.ru',
        director: 'Тарасов Алексей Владимирович',
        accreditationDate: '2020-08-20T00:00:00.000Z',
        certificateExpiryDate: '2025-08-20T00:00:00.000Z',
        insuranceExpiryDate: '2025-08-20T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценка-Плюс"',
        inn: '7718901234',
        ogrn: '1027718901234',
        address: 'г. Красноярск, ул. Мира, д. 35, офис 314',
        phone: '+7 (391) 890-12-34',
        email: 'contact@ocenka-plus.ru',
        director: 'Романова Ирина Николаевна',
        accreditationDate: '2019-09-25T00:00:00.000Z',
        certificateExpiryDate: '2025-09-25T00:00:00.000Z',
        insuranceExpiryDate: '2025-09-25T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценочное агентство Зета"',
        inn: '7719012345',
        ogrn: '1027719012345',
        address: 'г. Саратов, ул. Московская, д. 50, офис 415',
        phone: '+7 (845) 901-23-45',
        email: 'info@zeta-ocenka.ru',
        director: 'Борисов Денис Игоревич',
        accreditationDate: '2021-03-10T00:00:00.000Z',
        certificateExpiryDate: '2026-03-10T00:00:00.000Z',
        insuranceExpiryDate: '2026-03-10T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценка-Менеджмент"',
        inn: '7720123456',
        ogrn: '1027720123456',
        address: 'г. Тюмень, ул. Республики, д. 40, офис 516',
        phone: '+7 (345) 012-34-56',
        email: 'office@ocenka-management.ru',
        director: 'Григорьева Марина Александровна',
        accreditationDate: '2020-11-05T00:00:00.000Z',
        certificateExpiryDate: '2025-11-05T00:00:00.000Z',
        insuranceExpiryDate: '2025-11-05T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'ООО "Оценочная компания Эта"',
        inn: '7721234567',
        ogrn: '1027721234567',
        address: 'г. Ижевск, ул. Пушкинская, д. 25, офис 117',
        phone: '+7 (341) 123-45-67',
        email: 'info@eta-ocenka.ru',
        director: 'Комаров Павел Викторович',
        accreditationDate: '2019-05-14T00:00:00.000Z',
        certificateExpiryDate: '2025-05-14T00:00:00.000Z',
        insuranceExpiryDate: '2025-05-14T00:00:00.000Z',
        sroMembership: true,
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Берем только нужное количество
    const companiesToAdd = demoCompanies.slice(0, count);

    // Фильтруем, чтобы не добавлять дубликаты
    const newCompanies = companiesToAdd.filter(
      demo =>
        !existingCompanies.some(
          existing =>
            existing.inn === demo.inn || existing.name.toLowerCase() === demo.name.toLowerCase()
        )
    );

    if (newCompanies.length > 0) {
      const allCompanies = [...existingCompanies, ...newCompanies];
      this.saveCompanies(allCompanies);
      console.log(`Создано ${newCompanies.length} демо-компаний`);
    }

    return newCompanies.length;
  }

  // Загрузка начальных данных из файла reestr_otsenschikov.xls
  async loadInitialData(forceReload: boolean = false, limit: number = 20): Promise<number> {
    const alreadyLoaded = localStorage.getItem('cms_appraisal_companies_initial_data_loaded');
    if (alreadyLoaded === 'true' && !forceReload) {
      console.log('Начальные данные уже загружены, пропускаем');
      return 0;
    }

    try {
      console.log(
        'Начинаем загрузку начальных данных из reestr_otsenschikov.xls (лимит:',
        limit,
        ')...'
      );
      // Пытаемся загрузить файл из public
      const response = await fetch('/reestr_apr/reestr_otsenschikov.xls');
      if (!response.ok) {
        console.warn(
          'Файл reestr_otsenschikov.xls не найден, создаем демо-данные:',
          response.status,
          response.statusText
        );
        // Создаем демо-компании, если файл недоступен
        const created = this.createDemoCompanies(limit);
        if (created > 0) {
          localStorage.setItem('cms_appraisal_companies_initial_data_loaded', 'true');
        }
        return created;
      }

      const blob = await response.blob();
      console.log('Файл загружен, размер:', blob.size, 'байт');

      if (blob.size === 0) {
        console.warn('Файл пуст, создаем демо-данные');
        const created = this.createDemoCompanies(limit);
        if (created > 0) {
          localStorage.setItem('cms_appraisal_companies_initial_data_loaded', 'true');
        }
        return created;
      }

      const file = new File([blob], 'reestr_otsenschikov.xls', {
        type: 'application/vnd.ms-excel',
      });

      const imported = await this.loadFromExcelFile(file, limit);
      console.log('Импортировано компаний:', imported);

      // Если из файла ничего не импортировалось, создаем демо-данные
      if (imported === 0) {
        console.warn('Из файла ничего не импортировано, создаем демо-данные');
        const created = this.createDemoCompanies(limit);
        if (created > 0) {
          localStorage.setItem('cms_appraisal_companies_initial_data_loaded', 'true');
        }
        return created;
      }

      if (imported > 0) {
        localStorage.setItem('cms_appraisal_companies_initial_data_loaded', 'true');
      }
      return imported;
    } catch (error: any) {
      console.error('Ошибка загрузки начальных данных:', error);
      console.error('Детали ошибки:', error.message, error.stack);
      // При ошибке создаем демо-данные
      console.warn('Создаем демо-данные из-за ошибки загрузки файла');
      const created = this.createDemoCompanies(limit);
      if (created > 0) {
        localStorage.setItem('cms_appraisal_companies_initial_data_loaded', 'true');
      }
      return created;
    }
  }
}

export const appraisalCompanyService = new AppraisalCompanyService();
