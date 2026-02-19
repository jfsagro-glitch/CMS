import type { ExtendedCollateralCard, ExtendedFilterParams, Partner, Document } from '@/types';
import { extendedDb, type ExtendedCMSDatabase, type ExtendedCollateralCardDB } from '@/data/db/extendedDb';
import type { ExtendedCardQueryInput, ExtendedCardQueryResult } from '@/data/queries/extendedCardQuery';
import { toSafeDateString, fromSafeDateString } from '@/utils/dateSerialization';

export class VersionConflictError extends Error {
  code = 'VERSION_CONFLICT' as const;

  constructor(message: string) {
    super(message);
    this.name = 'VersionConflictError';
  }
}

export class CollateralRepo {
  private db: ExtendedCMSDatabase;

  constructor(db: ExtendedCMSDatabase = extendedDb) {
    this.db = db;
  }

  async getById(id: string): Promise<ExtendedCollateralCard | undefined> {
    const card = await this.db.collateralCards.get(id);
    return card ? this.fromDbCard(card) : undefined;
  }

  async list(filters?: ExtendedFilterParams): Promise<ExtendedCollateralCard[]> {
    const collection = this.buildCollection(filters);
    const items = await collection.toArray();
    return items.map(card => this.fromDbCard(card));
  }

  async query(input: ExtendedCardQueryInput): Promise<ExtendedCardQueryResult> {
    const page = Math.max(1, input.page);
    const pageSize = Math.max(1, input.pageSize);
    const collection = this.buildCollection(input.filters);
    const total = await collection.count();

    const offset = (page - 1) * pageSize;
    const items = await collection.offset(offset).limit(pageSize).toArray();
    let domainItems = items.map(card => this.fromDbCard(card));

    if (input.sort) {
      domainItems = [...domainItems].sort((a, b) => {
        const aValue = a[input.sort!.field as keyof ExtendedCollateralCard];
        const bValue = b[input.sort!.field as keyof ExtendedCollateralCard];

        if (aValue === undefined || bValue === undefined) return 0;
        if (aValue < bValue) return input.sort!.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return input.sort!.order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return { items: domainItems, total };
  }

  async saveCard(card: ExtendedCollateralCard, expectedVersion?: number): Promise<string> {
    const now = new Date();
    const existing = card.id ? await this.db.collateralCards.get(card.id) : undefined;
    const existingVersion = existing?.version ?? (card.version ?? 0);

    if (existing && expectedVersion !== undefined && expectedVersion !== existingVersion) {
      throw new VersionConflictError('Карточка была изменена в другой вкладке.');
    }

    const nextVersion = existing ? (existing.version ?? 1) + 1 : card.version ?? 1;
    const cardId = card.id || `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const { region, partnerIds } = this.normalizeCardIndexFields(card);

    const cardToSave: ExtendedCollateralCard = {
      ...card,
      id: cardId,
      region,
      partnerIds,
      version: nextVersion,
      updatedAt: now,
      createdAt: card.createdAt || (existing ? fromSafeDateString(existing.createdAt) : now),
    };

    const dbCard = this.toDbCard(cardToSave);

    await this.db.transaction('rw', this.db.collateralCards, this.db.partners, this.db.documents, async () => {
      await this.db.collateralCards.put(dbCard);

      if (Array.isArray(cardToSave.partners) && cardToSave.partners.length > 0) {
        const partners = cardToSave.partners.map(partner => this.normalizePartner(partner, cardId, now));
        await this.db.partners.bulkPut(partners);
      }

      if (Array.isArray(cardToSave.documents) && cardToSave.documents.length > 0) {
        const documents = cardToSave.documents.map(document => this.normalizeDocument(document, cardId, now));
        await this.db.documents.bulkPut(documents);
      }
    });

    return cardId;
  }

  async deleteCard(id: string): Promise<void> {
    await this.db.collateralCards.delete(id);
  }

  async deleteCards(ids: string[]): Promise<void> {
    await this.db.collateralCards.bulkDelete(ids);
  }

  private buildCollection(filters?: ExtendedFilterParams) {
    let collection = this.db.collateralCards.toCollection();

    if (filters) {
      if (filters.mainCategory && filters.status) {
        collection = this.db.collateralCards
          .where('[mainCategory+status]')
          .equals([filters.mainCategory, filters.status]);
      } else if (filters.mainCategory) {
        collection = this.db.collateralCards.where('mainCategory').equals(filters.mainCategory);
      } else if (filters.status) {
        collection = this.db.collateralCards.where('status').equals(filters.status);
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        collection = collection.filter(
          card =>
            card.name.toLowerCase().includes(query) ||
            card.number.toLowerCase().includes(query) ||
            card.address?.fullAddress?.toLowerCase().includes(query) ||
            card.partners?.some(
              p =>
                p.lastName?.toLowerCase().includes(query) ||
                p.firstName?.toLowerCase().includes(query) ||
                p.organizationName?.toLowerCase().includes(query)
            ) ||
            false
        );
      }

      if (filters.dateFrom) {
        collection = collection.filter(
          card => fromSafeDateString(card.createdAt) >= filters.dateFrom!
        );
      }

      if (filters.dateTo) {
        collection = collection.filter(
          card => fromSafeDateString(card.createdAt) <= filters.dateTo!
        );
      }

      if (filters.region) {
        collection = collection.filter(card =>
          Boolean(card.region?.toLowerCase().includes(filters.region!.toLowerCase()))
        );
      }

      if (filters.objectType) {
        collection = collection.filter(() => true);
      }

      if (filters.hasDocuments !== undefined) {
        collection = collection.filter(card =>
          filters.hasDocuments
            ? (card.documents?.length || 0) > 0
            : (card.documents?.length || 0) === 0
        );
      }

      if (filters.areaFrom !== undefined) {
        collection = collection.filter(card => {
          const area = card.characteristics?.totalArea || card.characteristics?.area;
          return area && area >= filters.areaFrom!;
        });
      }

      if (filters.areaTo !== undefined) {
        collection = collection.filter(card => {
          const area = card.characteristics?.totalArea || card.characteristics?.area;
          return area && area <= filters.areaTo!;
        });
      }
    }

    return collection;
  }

  private toDbCard(card: ExtendedCollateralCard): ExtendedCollateralCardDB {
    return {
      ...card,
      createdAt: toSafeDateString(card.createdAt),
      updatedAt: toSafeDateString(card.updatedAt),
    };
  }

  private fromDbCard(card: ExtendedCollateralCardDB): ExtendedCollateralCard {
    return {
      ...card,
      createdAt: fromSafeDateString(card.createdAt),
      updatedAt: fromSafeDateString(card.updatedAt),
    };
  }

  private normalizeCardIndexFields(card: ExtendedCollateralCard) {
    const region = card.region ?? card.address?.region ?? card.address?.city;
    const partnerIds = card.partners ? card.partners.map(p => p.id).filter(Boolean) : card.partnerIds;
    return { region, partnerIds };
  }

  private normalizePartner(partner: Partner, cardId: string, now: Date): Partner {
    return {
      ...partner,
      cardId,
      version: partner.version ?? 1,
      createdAt: partner.createdAt || now,
      updatedAt: now,
    };
  }

  private normalizeDocument(document: Document, cardId: string, now: Date): Document {
    return {
      ...document,
      cardId,
      version: document.version ?? 1,
      uploadDate: document.uploadDate || now,
      updatedAt: now,
    };
  }
}
