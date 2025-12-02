import { AppraisalReview } from '@/types/AppraisalReview';

const STORAGE_KEY = 'cms_appraisal_reviews';

class AppraisalReviewService {
  private getReviews(): AppraisalReview[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveReviews(reviews: AppraisalReview[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  }

  getAll(): AppraisalReview[] {
    return this.getReviews();
  }

  getById(id: string): AppraisalReview | undefined {
    return this.getReviews().find(r => r.id === id);
  }

  create(review: Omit<AppraisalReview, 'id' | 'createdAt' | 'updatedAt'>): AppraisalReview {
    const reviews = this.getReviews();
    const newReview: AppraisalReview = {
      ...review,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reviews.push(newReview);
    this.saveReviews(reviews);
    return newReview;
  }

  update(id: string, updates: Partial<AppraisalReview>): AppraisalReview | undefined {
    const reviews = this.getReviews();
    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) return undefined;

    const updatedReview = {
      ...reviews[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    reviews[index] = updatedReview;
    this.saveReviews(reviews);
    return updatedReview;
  }

  delete(id: string): void {
    const reviews = this.getReviews().filter(r => r.id !== id);
    this.saveReviews(reviews);
  }

  // Generate dummy data if empty
  initializeDemoData(): void {
    if (this.getReviews().length === 0) {
      const demoReviews: AppraisalReview[] = [
        {
          id: crypto.randomUUID(),
          status: 'approved',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          appraiserName: 'ООО "Вектор Оценки"',
          hasRecommendation: true,
          reportName: 'Отчет об оценке №123/2025',
          reportNumber: '123/2025',
          appraisalDate: '2025-11-15',
          appraisalPurpose: 'Залог',
          valueType: 'Рыночная стоимость',
          marketValueWithVat: 15000000,
          objectDescription: 'Нежилое помещение, 150 кв.м., г. Москва, ул. Ленина 1',
          compliance135FZ: 'compliant',
          complianceNote: 'Нарушений не выявлено',
          comparativeMethodologyValid: 'Выбор метода сравнения продаж обоснован',
          comparativeErrors: 'Ошибок нет',
          comparativeConclusion: 'Стоимость определена корректно',
          costMethodologyValid: 'Отказ от использования обоснован',
          costErrors: '-',
          costConclusion: '-',
          incomeMethodologyValid: 'Метод прямой капитализации применен верно',
          incomeErrors: 'Ставка капитализации в пределах рынка',
          incomeConclusion: 'Результат достоверен',
          reconciliationWeightsJustification: 'Веса: Сравнительный 60%, Доходный 40%',
          marketValueCorrectness: 'Рыночная стоимость определена корректно',
          marketCorrespondence: true,
          reviewDate: '2025-11-20',
          reviewerName: 'Иванов И.И.',
          reviewerPosition: 'Главный эксперт',
        },
      ];
      this.saveReviews(demoReviews);
    }
  }
}

export const appraisalReviewService = new AppraisalReviewService();
