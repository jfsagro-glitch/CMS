import { AppraisalCompany } from '@/types/AppraisalCompany';

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

  // Загрузка данных из файла (если нужно)
  async loadFromFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      // Парсинг файла (формат зависит от структуры файла)
      // Здесь можно добавить логику парсинга
      console.log('Загрузка данных из файла:', text);
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      throw error;
    }
  }
}

export const appraisalCompanyService = new AppraisalCompanyService();

