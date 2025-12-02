import { AppraisalCompany } from '@/types/AppraisalCompany';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'cms_appraisal_companies';

class AppraisalCompanyService {
  private getCompanies(): AppraisalCompany[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveCompanies(companies: AppraisalCompany[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
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
  async loadFromExcelFile(file: File, limit: number = 20): Promise<number> {
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
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
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

      const existingCompanies = this.getCompanies();
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
            name = this.findFieldValue(row, [
              'Наименование', 'наименование',
              'Название', 'название',
              'Компания', 'компания',
              'Организация', 'организация'
            ], '');
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
            address: this.findFieldValue(row, ['Адрес', 'адрес', 'Адрес регистрации', 'адрес регистрации'], ''),
            phone: this.findFieldValue(row, ['Телефон', 'телефон', 'Тел', 'тел'], ''),
            email: this.findFieldValue(row, ['Email', 'email', 'E-mail', 'e-mail'], ''),
            director: this.findFieldValue(row, ['Руководитель', 'руководитель', 'Директор', 'директор', 'Генеральный директор', 'генеральный директор'], ''),
            accreditationDate: this.findFieldValue(row, ['Дата аккредитации', 'дата аккредитации']) 
              ? this.parseDate(this.findFieldValue(row, ['Дата аккредитации', 'дата аккредитации']))
              : undefined,
            certificateExpiryDate: this.findFieldValue(row, ['Срок действия сертификатов', 'срок действия сертификатов', 'Сертификаты до', 'сертификаты до'])
              ? this.parseDate(this.findFieldValue(row, ['Срок действия сертификатов', 'срок действия сертификатов', 'Сертификаты до', 'сертификаты до']))
              : undefined,
            insuranceExpiryDate: this.findFieldValue(row, ['Срок действия страхования', 'срок действия страхования', 'Страхование до', 'страхование до'])
              ? this.parseDate(this.findFieldValue(row, ['Срок действия страхования', 'срок действия страхования', 'Страхование до', 'страхование до']))
              : undefined,
            sroMembership: this.parseBoolean(
              this.findFieldValue(row, ['Членство в СРО', 'членство в сро', 'СРО', 'сро', 'Член СРО', 'член сро'], false)
            ),
            status: this.parseStatus(this.findFieldValue(row, ['Статус', 'статус', 'Статус аккредитации', 'статус аккредитации'], 'active')),
            notes: this.findFieldValue(row, ['Примечания', 'примечания', 'Комментарий', 'комментарий'], ''),
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
      if (newCompanies.length > 0) {
        try {
          this.saveCompanies(existingCompanies);
          console.log(`Сохранено ${newCompanies.length} компаний в localStorage`);
        } catch (error: any) {
          console.error('Ошибка сохранения в localStorage:', error);
          // Если не хватает места, очищаем и сохраняем только новые
          try {
            localStorage.removeItem(STORAGE_KEY);
            this.saveCompanies(newCompanies);
            console.log('Очищен localStorage, сохранены только новые компании');
          } catch (e) {
            console.error('Критическая ошибка сохранения:', e);
            throw e;
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

  // Загрузка начальных данных из файла reestr_otsenschikov.xls
  async loadInitialData(forceReload: boolean = false, limit: number = 20): Promise<number> {
    const alreadyLoaded = localStorage.getItem('cms_appraisal_companies_initial_data_loaded');
    if (alreadyLoaded === 'true' && !forceReload) {
      console.log('Начальные данные уже загружены, пропускаем');
      return 0;
    }

    try {
      console.log('Начинаем загрузку начальных данных из reestr_otsenschikov.xls (лимит:', limit, ')...');
      // Пытаемся загрузить файл из public
      const response = await fetch('/reestr_apr/reestr_otsenschikov.xls');
      if (!response.ok) {
        console.error(
          'Файл reestr_otsenschikov.xls не найден:',
          response.status,
          response.statusText
        );
        return 0;
      }

      const blob = await response.blob();
      console.log('Файл загружен, размер:', blob.size, 'байт');

      if (blob.size === 0) {
        console.error('Файл пуст');
        return 0;
      }

      const file = new File([blob], 'reestr_otsenschikov.xls', {
        type: 'application/vnd.ms-excel',
      });

      const imported = await this.loadFromExcelFile(file, limit);
      console.log('Импортировано компаний:', imported);

      if (imported > 0) {
        localStorage.setItem('cms_appraisal_companies_initial_data_loaded', 'true');
      }
      return imported;
    } catch (error: any) {
      console.error('Ошибка загрузки начальных данных:', error);
      console.error('Детали ошибки:', error.message, error.stack);
      return 0;
    }
  }
}

export const appraisalCompanyService = new AppraisalCompanyService();
