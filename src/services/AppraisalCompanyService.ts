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
  async loadFromExcelFile(file: File): Promise<number> {
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
        console.log('Пример первой строки:', Object.keys(jsonData[0] as any));
        console.log('Первая строка:', jsonData[0]);
      }

      const companies = this.getCompanies();
      let imported = 0;
      let skipped = 0;

      for (const row of jsonData as any[]) {
        try {
          // Пробуем найти название компании в разных вариантах колонок
          const name = 
            row['Наименование'] || 
            row['наименование'] ||
            row['Название'] || 
            row['название'] ||
            row['Компания'] || 
            row['компания'] ||
            row['Организация'] ||
            row['организация'] ||
            Object.values(row).find((v: any) => typeof v === 'string' && v.trim().length > 0) as string || 
            '';
          
          if (!name || name.trim().length === 0) {
            skipped++;
            continue;
          }

          // Маппинг полей из Excel на структуру AppraisalCompany
          const companyData: Partial<AppraisalCompany> = {
            name: String(name).trim(),
            inn: String(row['ИНН'] || row['инн'] || row['ИНН/КПП'] || row['инн/кпп'] || '')
              .split('/')[0]
              .trim(),
            ogrn: String(row['ОГРН'] || row['огрн'] || '').trim(),
            address: String(row['Адрес'] || row['адрес'] || row['Адрес регистрации'] || row['адрес регистрации'] || '').trim(),
            phone: String(row['Телефон'] || row['телефон'] || row['Тел'] || row['тел'] || '').trim(),
            email: String(row['Email'] || row['email'] || row['E-mail'] || row['e-mail'] || '').trim(),
            director: String(row['Руководитель'] || row['руководитель'] || row['Директор'] || row['директор'] || row['Генеральный директор'] || row['генеральный директор'] || '').trim(),
            accreditationDate: (row['Дата аккредитации'] || row['дата аккредитации'])
              ? this.parseDate(row['Дата аккредитации'] || row['дата аккредитации'])
              : undefined,
            certificateExpiryDate:
              (row['Срок действия сертификатов'] || row['срок действия сертификатов'] || row['Сертификаты до'] || row['сертификаты до'])
                ? this.parseDate(row['Срок действия сертификатов'] || row['срок действия сертификатов'] || row['Сертификаты до'] || row['сертификаты до'])
                : undefined,
            insuranceExpiryDate:
              (row['Срок действия страхования'] || row['срок действия страхования'] || row['Страхование до'] || row['страхование до'])
                ? this.parseDate(row['Срок действия страхования'] || row['срок действия страхования'] || row['Страхование до'] || row['страхование до'])
                : undefined,
            sroMembership: this.parseBoolean(
              row['Членство в СРО'] || row['членство в сро'] || row['СРО'] || row['сро'] || row['Член СРО'] || row['член сро'] || false
            ),
            status: this.parseStatus(row['Статус'] || row['статус'] || row['Статус аккредитации'] || row['статус аккредитации'] || 'active'),
            notes: String(row['Примечания'] || row['примечания'] || row['Комментарий'] || row['комментарий'] || '').trim(),
          };

          // Проверяем, не существует ли уже компания с таким ИНН или названием
          const exists = companies.some(
            c =>
              (c.inn && companyData.inn && c.inn === companyData.inn) ||
              (companyData.name && c.name.toLowerCase() === companyData.name.toLowerCase())
          );
          if (!exists) {
            this.create(companyData as Omit<AppraisalCompany, 'id' | 'createdAt' | 'updatedAt'>);
            imported++;
          } else {
            skipped++;
          }
        } catch (error: any) {
          console.warn('Ошибка обработки строки:', row, error?.message);
          skipped++;
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
  async loadInitialData(forceReload: boolean = false): Promise<number> {
    const alreadyLoaded = localStorage.getItem('cms_appraisal_companies_initial_data_loaded');
    if (alreadyLoaded === 'true' && !forceReload) {
      console.log('Начальные данные уже загружены, пропускаем');
      return 0;
    }

    try {
      console.log('Начинаем загрузку начальных данных из reestr_otsenschikov.xls...');
      // Пытаемся загрузить файл из public
      const response = await fetch('/reestr_apr/reestr_otsenschikov.xls');
      if (!response.ok) {
        console.error('Файл reestr_otsenschikov.xls не найден:', response.status, response.statusText);
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
      
      const imported = await this.loadFromExcelFile(file);
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
