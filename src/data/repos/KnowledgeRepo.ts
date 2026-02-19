import {
  extendedDb,
  type ExtendedCMSDatabase,
  type KnowledgeCategoryDB,
  type KnowledgeTopicDB,
  type KnowledgeSearchIndexDB,
} from '@/data/db/extendedDb';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class KnowledgeRepo {
  private db: ExtendedCMSDatabase;
  private topicsCache: CacheEntry<KnowledgeTopicDB[]> | null = null;
  private readonly ttlMs = 5 * 60 * 1000;

  constructor(db: ExtendedCMSDatabase = extendedDb) {
    this.db = db;
  }

  async getTopics(): Promise<KnowledgeTopicDB[]> {
    if (this.topicsCache && this.topicsCache.expiresAt > Date.now()) {
      return this.topicsCache.value;
    }
    const topics = await this.db.knowledgeTopics.toArray();
    this.topicsCache = { value: topics, expiresAt: Date.now() + this.ttlMs };
    return topics;
  }

  async saveTopics(topics: KnowledgeTopicDB[]): Promise<void> {
    await this.db.knowledgeTopics.clear();
    await this.db.knowledgeTopics.bulkPut(topics);
    this.topicsCache = { value: topics, expiresAt: Date.now() + this.ttlMs };
  }

  async saveCategories(categories: KnowledgeCategoryDB[]): Promise<void> {
    await this.db.knowledgeCategories.clear();
    await this.db.knowledgeCategories.bulkPut(categories);
  }

  async saveSearchIndex(index: KnowledgeSearchIndexDB[]): Promise<void> {
    await this.db.knowledgeSearchIndex.clear();
    await this.db.knowledgeSearchIndex.bulkPut(index);
  }

  invalidateCache(): void {
    this.topicsCache = null;
  }
}
