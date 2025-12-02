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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const companies = this.getCompanies();
      let imported = 0;

      for (const row of jsonData as any[]) {
        try {
          // Маппинг полей из Excel на структуру AppraisalCompany
          const companyData: Partial<AppraisalCompany> = {
            name: row['Наименование'] || row['Название'] || row['Компания'] || '',
            inn: String(row['ИНН'] || row['ИНН/КПП'] || '')
              .split('/')[0]
              .trim(),
            ogrn: String(row['ОГРН'] || ''),
            address: row['Адрес'] || row['Адрес регистрации'] || '',
            phone: row['Телефон'] || row['Тел'] || '',
            email: row['Email'] || row['E-mail'] || '',
            director: row['Руководитель'] || row['Директор'] || row['Генеральный директор'] || '',
            accreditationDate: row['Дата аккредитации']
              ? this.parseDate(row['Дата аккредитации'])
              : undefined,
            certificateExpiryDate: row['Срок действия сертификатов'] || row['Сертификаты до']
              ? this.parseDate(row['Срок действия сертификатов'] || row['Сертификаты до'])
              : undefined,
            insuranceExpiryDate: row['Срок действия страхования'] || row['Страхование до']
              ? this.parseDate(row['Срок действия страхования'] || row['Страхование до'])
              : undefined,
            sroMembership: this.parseBoolean(
              row['Членство в СРО'] || row['СРО'] || row['Член СРО'] || false
            ),
            status: this.parseStatus(row['Статус'] || row['Статус аккредитации'] || 'active'),
            notes: row['Примечания'] || row['Комментарий'] || '',
          };

          if (companyData.name) {
            // Проверяем, не существует ли уже компания с таким ИНН или названием
            const exists = companies.some(
              c =>
                (c.inn && companyData.inn && c.inn === companyData.inn) ||
                c.name === companyData.name
            );
            if (!exists) {
              this.create(companyData as Omit<AppraisalCompany, 'id' | 'createdAt' | 'updatedAt'>);
              imported++;
            }
          }
        } catch (error) {
          console.warn('Ошибка обработки строки:', row, error);
        }
      }

      return imported;
    } catch (error) {
      console.error('Ошибка загрузки Excel файла:', error);
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
      return lower === 'да' || lower === 'yes' || lower === 'true' || lower === '1' || lower === '✓';
    }
    if (typeof value === 'number') return value === 1;
    return false;
  }

  // Загрузка начальных данных из файла reestr_otsenschikov.xls
  async loadInitialData(): Promise<number> {
    const alreadyLoaded = localStorage.getItem('cms_appraisal_companies_initial_data_loaded');
    if (alreadyLoaded === 'true') {
      return 0;
    }

    try {
      // Пытаемся загрузить файл из public
      const response = await fetch('/reestr_apr/reestr_otsenschikov.xls');
      if (!response.ok) {
        console.warn('Файл reestr_otsenschikov.xls не найден, пропускаем начальную загрузку');
        return 0;
      }

      const blob = await response.blob();
      const file = new File([blob], 'reestr_otsenschikov.xls', { type: 'application/vnd.ms-excel' });
      const imported = await this.loadFromExcelFile(file);
      
      localStorage.setItem('cms_appraisal_companies_initial_data_loaded', 'true');
      return imported;
    } catch (error) {
      console.warn('Ошибка загрузки начальных данных:', error);
      return 0;
    }
  }
}

export const appraisalCompanyService = new AppraisalCompanyService();
