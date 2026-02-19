import type { WorkflowCase, WorkflowTemplate } from '@/types/workflow';
import { extendedDb, type ExtendedCMSDatabase } from '@/data/db/extendedDb';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class WorkflowRepo {
  private db: ExtendedCMSDatabase;
  private templatesCache: CacheEntry<WorkflowTemplate[]> | null = null;
  private readonly templatesTtlMs = 5 * 60 * 1000;

  constructor(db: ExtendedCMSDatabase = extendedDb) {
    this.db = db;
  }

  async getCases(): Promise<WorkflowCase[]> {
    return this.db.workflowCases.toArray();
  }

  async saveCases(cases: WorkflowCase[]): Promise<void> {
    await this.db.workflowCases.clear();
    await this.db.workflowCases.bulkPut(cases);
  }

  async getTemplates(): Promise<WorkflowTemplate[]> {
    if (this.templatesCache && this.templatesCache.expiresAt > Date.now()) {
      return this.templatesCache.value;
    }

    const templates = await this.db.workflowTemplates.toArray();
    this.templatesCache = {
      value: templates,
      expiresAt: Date.now() + this.templatesTtlMs,
    };
    return templates;
  }

  async saveTemplates(templates: WorkflowTemplate[]): Promise<void> {
    await this.db.workflowTemplates.clear();
    await this.db.workflowTemplates.bulkPut(templates);
    this.templatesCache = {
      value: templates,
      expiresAt: Date.now() + this.templatesTtlMs,
    };
  }

  invalidateTemplatesCache(): void {
    this.templatesCache = null;
  }
}
