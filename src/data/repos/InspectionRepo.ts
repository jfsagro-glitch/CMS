import { extendedDb, type ExtendedCMSDatabase } from '@/data/db/extendedDb';
import type { Inspection, InspectionDB, InspectionStatus, InspectionType } from '@/types/inspection';
import { toSafeDateString, fromSafeDateString } from '@/utils/dateSerialization';

export class InspectionRepo {
  private db: ExtendedCMSDatabase;

  constructor(db: ExtendedCMSDatabase = extendedDb) {
    this.db = db;
  }

  async list(): Promise<InspectionDB[]> {
    return this.db.inspections.toArray();
  }

  async getById(id: string): Promise<InspectionDB | undefined> {
    return this.db.inspections.get(id);
  }

  async byStatus(status: InspectionStatus): Promise<InspectionDB[]> {
    return this.db.inspections.where('status').equals(status).toArray();
  }

  async byType(type: InspectionType): Promise<InspectionDB[]> {
    return this.db.inspections.where('inspectionType').equals(type).toArray();
  }

  toDb(inspection: Inspection): InspectionDB {
    return {
      ...inspection,
      inspectionDate: toSafeDateString(inspection.inspectionDate),
      scheduledDate: inspection.scheduledDate ? toSafeDateString(inspection.scheduledDate) : undefined,
      completedDate: inspection.completedDate ? toSafeDateString(inspection.completedDate) : undefined,
      clientLinkExpiresAt: inspection.clientLinkExpiresAt
        ? toSafeDateString(inspection.clientLinkExpiresAt)
        : undefined,
      createdAt: toSafeDateString(inspection.createdAt),
      updatedAt: toSafeDateString(inspection.updatedAt),
      reviewedAt: inspection.reviewedAt ? toSafeDateString(inspection.reviewedAt) : undefined,
      approvedAt: inspection.approvedAt ? toSafeDateString(inspection.approvedAt) : undefined,
      revisionRequestedAt: inspection.revisionRequestedAt
        ? toSafeDateString(inspection.revisionRequestedAt)
        : undefined,
      photos: (inspection.photos || []).map(photo => ({
        ...photo,
        takenAt: toSafeDateString(photo.takenAt),
      })),
      defects: (inspection.defects || []).map(defect => ({
        ...defect,
        fixedDate: defect.fixedDate ? toSafeDateString(defect.fixedDate) : undefined,
      })),
      recommendations: (inspection.recommendations || []).map(rec => ({
        ...rec,
        deadline: rec.deadline ? toSafeDateString(rec.deadline) : undefined,
        completedDate: rec.completedDate ? toSafeDateString(rec.completedDate) : undefined,
      })),
      history: (inspection.history || []).map(item => ({
        ...item,
        date: toSafeDateString(item.date),
      })),
    };
  }

  fromDb(inspection: InspectionDB): Inspection {
    return {
      ...inspection,
      inspectionDate: fromSafeDateString(inspection.inspectionDate),
      scheduledDate: inspection.scheduledDate ? fromSafeDateString(inspection.scheduledDate) : undefined,
      completedDate: inspection.completedDate ? fromSafeDateString(inspection.completedDate) : undefined,
      clientLinkExpiresAt: inspection.clientLinkExpiresAt
        ? fromSafeDateString(inspection.clientLinkExpiresAt)
        : undefined,
      createdAt: fromSafeDateString(inspection.createdAt),
      updatedAt: fromSafeDateString(inspection.updatedAt),
      reviewedAt: inspection.reviewedAt ? fromSafeDateString(inspection.reviewedAt) : undefined,
      approvedAt: inspection.approvedAt ? fromSafeDateString(inspection.approvedAt) : undefined,
      revisionRequestedAt: inspection.revisionRequestedAt
        ? fromSafeDateString(inspection.revisionRequestedAt)
        : undefined,
      photos: (inspection.photos || []).map(photo => ({
        ...photo,
        takenAt: fromSafeDateString(photo.takenAt),
      })),
      defects: (inspection.defects || []).map(defect => ({
        ...defect,
        fixedDate: defect.fixedDate ? fromSafeDateString(defect.fixedDate) : undefined,
      })),
      recommendations: (inspection.recommendations || []).map(rec => ({
        ...rec,
        deadline: rec.deadline ? fromSafeDateString(rec.deadline) : undefined,
        completedDate: rec.completedDate ? fromSafeDateString(rec.completedDate) : undefined,
      })),
      history: (inspection.history || []).map(item => ({
        ...item,
        date: fromSafeDateString(item.date),
      })),
    };
  }
}
