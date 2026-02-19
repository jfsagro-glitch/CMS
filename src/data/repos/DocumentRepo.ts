import type { Document } from '@/types';
import { extendedDb, type ExtendedCMSDatabase } from '@/data/db/extendedDb';

export class DocumentRepo {
  private db: ExtendedCMSDatabase;

  constructor(db: ExtendedCMSDatabase = extendedDb) {
    this.db = db;
  }

  async save(document: Document): Promise<string> {
    await this.db.documents.put(document);
    return document.id;
  }

  async list(): Promise<Document[]> {
    return this.db.documents.toArray();
  }
}
