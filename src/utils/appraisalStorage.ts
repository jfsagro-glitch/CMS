import type { AppraisalEstimate, AppraisalRequestInput } from '@/services/AppraisalAIService';

export interface StoredAIAppraisal {
  id: string;
  cardId?: string;
  objectId?: string;
  objectName: string;
  createdAt: string;
  estimate: AppraisalEstimate;
  input: AppraisalRequestInput;
}

const STORAGE_KEY = 'ai_appraisal_results';

const loadStorage = (): StoredAIAppraisal[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as StoredAIAppraisal[];
  } catch (error) {
    console.error('Ошибка загрузки AI оценок:', error);
    return [];
  }
};

const saveStorage = (items: StoredAIAppraisal[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Ошибка сохранения AI оценок:', error);
  }
};

export const appraisalStorage = {
  getAll(): StoredAIAppraisal[] {
    return loadStorage();
  },

  getByCard(cardId: string): StoredAIAppraisal[] {
    return loadStorage().filter(item => item.cardId === cardId);
  },

  getLatestByCard(cardId: string): StoredAIAppraisal | null {
    const records = appraisalStorage.getByCard(cardId);
    if (records.length === 0) return null;
    return records.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))[0];
  },

  add(entry: Omit<StoredAIAppraisal, 'id' | 'createdAt'>): StoredAIAppraisal {
    const records = loadStorage();
    const newEntry: StoredAIAppraisal = {
      ...entry,
      id: `ai-appraisal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    records.push(newEntry);
    saveStorage(records);
    return newEntry;
  },

  clear(): void {
    saveStorage([]);
  },
};

export default appraisalStorage;

