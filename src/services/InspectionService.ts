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
      };
      
      await this.db.inspections.add(newInspection);
      return newInspection.id;
    } catch (error) {
      console.error('Failed to create inspection:', error);
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

