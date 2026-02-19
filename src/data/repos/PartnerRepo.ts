import type { Partner } from '@/types';
import { extendedDb, type ExtendedCMSDatabase } from '@/data/db/extendedDb';

export class PartnerRepo {
  private db: ExtendedCMSDatabase;

  constructor(db: ExtendedCMSDatabase = extendedDb) {
    this.db = db;
  }

  async save(partner: Partner): Promise<string> {
    await this.db.partners.put(partner);
    return partner.id;
  }

  async list(): Promise<Partner[]> {
    return this.db.partners.toArray();
  }

  async search(query: string): Promise<Partner[]> {
    const lowerQuery = query.toLowerCase();
    return this.db.partners
      .filter(partner =>
        Boolean(
          partner.lastName?.toLowerCase().includes(lowerQuery) ||
            partner.firstName?.toLowerCase().includes(lowerQuery) ||
            partner.organizationName?.toLowerCase().includes(lowerQuery) ||
            partner.inn?.includes(query)
        )
      )
      .toArray();
  }
}
