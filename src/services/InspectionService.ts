/**
 * Сервис для работы с осмотрами CMS Check
 */

import type { Inspection, InspectionType, InspectionStatus } from '@/types/inspection';
import { extendedDb } from './ExtendedStorageService';

class InspectionService {
  private db = extendedDb;

  /**
   * Инициализация базы данных
   */
  async initDatabase(): Promise<void> {
    try {
      // База данных уже должна быть открыта через ExtendedStorageService
      // Просто проверяем, что она доступна
      if (!this.db.isOpen()) {
        await this.db.open();
      }
      console.log('Inspection database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize inspection database:', error);
      throw error;
    }
  }

  /**
   * Получить все осмотры
   */
  async getInspections(): Promise<Inspection[]> {
    try {
      return await this.db.inspections.toArray();
    } catch (error) {
      console.error('Failed to get inspections:', error);
      return [];
    }
  }

  /**
   * Получить осмотр по ID
   */
  async getInspectionById(id: string): Promise<Inspection | undefined> {
    try {
      return await this.db.inspections.get(id);
    } catch (error) {
      console.error('Failed to get inspection:', error);
      return undefined;
    }
  }

  /**
   * Получить осмотры по ID карточки залога
   */
  async getInspectionsByCardId(cardId: string): Promise<Inspection[]> {
    try {
      return await this.db.inspections
        .where('collateralCardId')
        .equals(cardId)
        .toArray();
    } catch (error) {
      console.error('Failed to get inspections by card ID:', error);
      return [];
    }
  }

  /**
   * Получить осмотры по типу
   */
  async getInspectionsByType(type: InspectionType): Promise<Inspection[]> {
    try {
      return await this.db.inspections
        .where('inspectionType')
        .equals(type)
        .toArray();
    } catch (error) {
      console.error('Failed to get inspections by type:', error);
      return [];
    }
  }

  /**
   * Получить осмотры по статусу
   */
  async getInspectionsByStatus(status: InspectionStatus): Promise<Inspection[]> {
    try {
      return await this.db.inspections
        .where('status')
        .equals(status)
        .toArray();
    } catch (error) {
      console.error('Failed to get inspections by status:', error);
      return [];
    }
  }

  /**
   * Получить осмотры по инспектору
   */
  async getInspectionsByInspector(inspectorId: string): Promise<Inspection[]> {
    try {
      return await this.db.inspections
        .where('inspectorId')
        .equals(inspectorId)
        .toArray();
    } catch (error) {
      console.error('Failed to get inspections by inspector:', error);
      return [];
    }
  }

  /**
   * Создать осмотр
   */
  async createInspection(inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const newInspection: Inspection = {
        ...inspection,
        id: `insp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
        history: inspection.history || [],
      };
      
      await this.db.inspections.add(newInspection);
      return newInspection.id;
    } catch (error) {
      console.error('Failed to create inspection:', error);
      throw error;
    }
  }

  /**
   * Генерировать ссылку для клиента
   */
  async generateClientLink(inspectionId: string): Promise<string> {
    try {
      const inspection = await this.getInspectionById(inspectionId);
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      const token = `${inspectionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Ссылка действительна 7 дней

      const base = import.meta.env.BASE_URL ?? './';
      const basePath = base.endsWith('/') ? base : `${base}/`;
      const link = `${window.location.origin}${basePath}#/inspection/${token}`;

      await this.updateInspection(inspectionId, {
        clientLink: link,
        clientLinkExpiresAt: expiresAt,
        status: 'sent_to_client',
        history: [
          ...(inspection.history || []),
          {
            id: `hist-${Date.now()}`,
            date: new Date(),
            action: 'sent_to_client',
            user: inspection.createdByUser || 'Система',
            userRole: 'creator',
            comment: 'Ссылка отправлена клиенту',
            status: 'sent_to_client',
          },
        ],
      });

      // Сохраняем токен в localStorage для проверки
      const tokens = JSON.parse(localStorage.getItem('inspection_tokens') || '{}');
      tokens[token] = { inspectionId, expiresAt: expiresAt.toISOString() };
      localStorage.setItem('inspection_tokens', JSON.stringify(tokens));

      return link;
    } catch (error) {
      console.error('Failed to generate client link:', error);
      throw error;
    }
  }

  /**
   * Получить осмотр по токену клиента
   */
  async getInspectionByToken(token: string): Promise<Inspection | null> {
    try {
      const tokens = JSON.parse(localStorage.getItem('inspection_tokens') || '{}');
      const tokenData = tokens[token];
      
      if (!tokenData) {
        return null;
      }

      const expiresAt = new Date(tokenData.expiresAt);
      if (expiresAt < new Date()) {
        return null; // Ссылка истекла
      }

      return await this.getInspectionById(tokenData.inspectionId) || null;
    } catch (error) {
      console.error('Failed to get inspection by token:', error);
      return null;
    }
  }

  /**
   * Отправить осмотр на проверку
   */
  async submitForReview(inspectionId: string, submittedBy: string): Promise<void> {
    try {
      const inspection = await this.getInspectionById(inspectionId);
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      await this.updateInspection(inspectionId, {
        status: 'submitted_for_review',
        history: [
          ...(inspection.history || []),
          {
            id: `hist-${Date.now()}`,
            date: new Date(),
            action: 'submitted',
            user: submittedBy,
            userRole: 'inspector',
            comment: 'Осмотр отправлен на проверку',
            status: 'submitted_for_review',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to submit for review:', error);
      throw error;
    }
  }

  /**
   * Согласовать осмотр
   */
  async approveInspection(inspectionId: string, approvedBy: string): Promise<void> {
    try {
      const inspection = await this.getInspectionById(inspectionId);
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      await this.updateInspection(inspectionId, {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        history: [
          ...(inspection.history || []),
          {
            id: `hist-${Date.now()}`,
            date: new Date(),
            action: 'approved',
            user: approvedBy,
            userRole: 'approver',
            comment: 'Осмотр согласован',
            status: 'approved',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to approve inspection:', error);
      throw error;
    }
  }

  /**
   * Запросить доработку
   */
  async requestRevision(inspectionId: string, requestedBy: string, comment: string): Promise<void> {
    try {
      const inspection = await this.getInspectionById(inspectionId);
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      await this.updateInspection(inspectionId, {
        status: 'needs_revision',
        revisionRequestedBy: requestedBy,
        revisionRequestedAt: new Date(),
        revisionComment: comment,
        history: [
          ...(inspection.history || []),
          {
            id: `hist-${Date.now()}`,
            date: new Date(),
            action: 'revision_requested',
            user: requestedBy,
            userRole: 'reviewer',
            comment: comment || 'Требуется доработка',
            status: 'needs_revision',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to request revision:', error);
      throw error;
    }
  }

  /**
   * Добавить фотографию к осмотру
   */
  async addPhoto(inspectionId: string, photo: {
    url: string;
    description?: string;
    location?: string;
    step?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  }): Promise<void> {
    try {
      const inspection = await this.getInspectionById(inspectionId);
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      const newPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...photo,
        takenAt: new Date(),
      };

      await this.updateInspection(inspectionId, {
        photos: [...(inspection.photos || []), newPhoto],
      });
    } catch (error) {
      console.error('Failed to add photo:', error);
      throw error;
    }
  }

  /**
   * Обновить осмотр
   */
  async updateInspection(id: string, updates: Partial<Inspection>): Promise<void> {
    try {
      const inspection = await this.db.inspections.get(id);
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      await this.db.inspections.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to update inspection:', error);
      throw error;
    }
  }

  /**
   * Удалить осмотр
   */
  async deleteInspection(id: string): Promise<void> {
    try {
      await this.db.inspections.delete(id);
    } catch (error) {
      console.error('Failed to delete inspection:', error);
      throw error;
    }
  }

  /**
   * Удалить осмотры по ID карточки залога
   */
  async deleteInspectionsByCardId(cardId: string): Promise<void> {
    try {
      await this.db.inspections
        .where('collateralCardId')
        .equals(cardId)
        .delete();
    } catch (error) {
      console.error('Failed to delete inspections by card ID:', error);
      throw error;
    }
  }

  /**
   * Получить статистику осмотров
   */
  async getInspectionStats(): Promise<{
    total: number;
    byType: Record<InspectionType, number>;
    byStatus: Record<InspectionStatus, number>;
    byCondition: Record<string, number>;
  }> {
    try {
      const inspections = await this.db.inspections.toArray();
      
      const stats = {
        total: inspections.length,
        byType: {} as Record<InspectionType, number>,
        byStatus: {} as Record<InspectionStatus, number>,
        byCondition: {} as Record<string, number>,
      };

      inspections.forEach((inspection) => {
        // По типам
        stats.byType[inspection.inspectionType] = (stats.byType[inspection.inspectionType] || 0) + 1;
        
        // По статусам
        stats.byStatus[inspection.status] = (stats.byStatus[inspection.status] || 0) + 1;
        
        // По состоянию
        stats.byCondition[inspection.condition] = (stats.byCondition[inspection.condition] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get inspection stats:', error);
      return {
        total: 0,
        byType: {} as Record<InspectionType, number>,
        byStatus: {} as Record<InspectionStatus, number>,
        byCondition: {},
      };
    }
  }
}

const inspectionService = new InspectionService();
export default inspectionService;

