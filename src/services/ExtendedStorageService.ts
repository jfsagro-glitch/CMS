import * as XLSX from 'xlsx';
import type {
  ExtendedCollateralCard,
  Partner,
  Document,
  ExtendedFilterParams,
  AppSettings,
  ExportResult,
} from '@/types';
import { perfMark, perfMeasure } from '@/utils/performance';
import { fromSafeDateString } from '@/utils/dateSerialization';
import type { WorkflowCase, WorkflowTemplate } from '@/types/workflow';
import {
  extendedDb,
  type ExtendedCMSDatabase,
  type ExtendedCollateralCardDB,
  type TaskDB,
} from '@/data/db/extendedDb';
import type {
  ExtendedCardSort,
  ExtendedCardSortField,
  ExtendedCardQueryInput,
  ExtendedCardQueryResult,
} from '@/data/queries/extendedCardQuery';
import { CollateralRepo, VersionConflictError } from '@/data/repos/CollateralRepo';
import { PartnerRepo } from '@/data/repos/PartnerRepo';
import { DocumentRepo } from '@/data/repos/DocumentRepo';
import { SettingsRepo } from '@/data/repos/SettingsRepo';
import { TaskRepo } from '@/data/repos/TaskRepo';
import { WorkflowRepo } from '@/data/repos/WorkflowRepo';

export type { ExtendedCardSort, ExtendedCardSortField, ExtendedCardQueryInput, ExtendedCardQueryResult };

class ExtendedStorageService {
  private db: ExtendedCMSDatabase;
  private cardsRepo: CollateralRepo;
  private partnerRepo: PartnerRepo;
  private documentRepo: DocumentRepo;
  private settingsRepo: SettingsRepo;
  private taskRepo: TaskRepo;
  private workflowRepo: WorkflowRepo;

  constructor() {
    this.db = extendedDb;
    this.cardsRepo = new CollateralRepo(this.db);
    this.partnerRepo = new PartnerRepo(this.db);
    this.documentRepo = new DocumentRepo(this.db);
    this.settingsRepo = new SettingsRepo(this.db);
    this.taskRepo = new TaskRepo(this.db);
    this.workflowRepo = new WorkflowRepo(this.db);
  }

  // Инициализация базы данных
  async initDatabase(): Promise<void> {
    try {
      await this.db.open();
      console.log('Extended database initialized successfully');

      // Инициализация настроек по умолчанию
      const existingSettings = await this.db.settings.get('app-settings');
      if (!existingSettings) {
        await this.db.settings.add({
          id: 'app-settings',
          theme: 'light',
          language: 'ru',
          sidebarCollapsed: false,
        });
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private fromDbCard(card: ExtendedCollateralCardDB): ExtendedCollateralCard {
    return {
      ...card,
      createdAt: fromSafeDateString(card.createdAt),
      updatedAt: fromSafeDateString(card.updatedAt),
    };
  }

  // ============ Операции с расширенными карточками ============

  // Сохранение расширенной карточки
  async saveExtendedCard(card: ExtendedCollateralCard): Promise<string> {
    try {
      return await this.cardsRepo.saveCard(card, card.version);
    } catch (error) {
      if (error instanceof VersionConflictError) {
        throw error;
      }
      console.error('Failed to save collateral card:', error);
      throw error;
    }
  }

  // Получение расширенных карточек с фильтрацией
  async getExtendedCards(filters?: ExtendedFilterParams): Promise<ExtendedCollateralCard[]> {
    try {
      return await this.cardsRepo.list(filters);
    } catch (error) {
      console.error('Failed to get collateral cards:', error);
      throw error;
    }
  }

  // Запрос карточек с пагинацией (query-driven UI)
  async queryExtendedCards(input: ExtendedCardQueryInput): Promise<ExtendedCardQueryResult> {
    try {
      perfMark('registry:query:start');
      const result = await this.cardsRepo.query(input);
      perfMark('registry:query:end');
      perfMeasure('registry:query', 'registry:query:start', 'registry:query:end');
      return result;
    } catch (error) {
      console.error('Failed to query collateral cards:', error);
      throw error;
    }
  }

  // Получение карточки по ID
  async getExtendedCardById(id: string): Promise<ExtendedCollateralCard | undefined> {
    try {
      return await this.cardsRepo.getById(id);
    } catch (error) {
      console.error('Failed to get collateral card:', error);
      throw error;
    }
  }

  // Удаление карточки
  async deleteExtendedCard(id: string): Promise<void> {
    try {
      await this.cardsRepo.deleteCard(id);
    } catch (error) {
      console.error('Failed to delete collateral card:', error);
      throw error;
    }
  }

  // Массовое удаление карточек
  async deleteExtendedCards(ids: string[]): Promise<void> {
    try {
      await this.cardsRepo.deleteCards(ids);
    } catch (error) {
      console.error('Failed to delete collateral cards:', error);
      throw error;
    }
  }

  // ============ Операции с партнерами ============

  // Сохранение партнера
  async savePartner(partner: Partner): Promise<string> {
    try {
      return await this.partnerRepo.save(partner);
    } catch (error) {
      console.error('Failed to save partner:', error);
      throw error;
    }
  }

  // Получение всех партнеров
  async getPartners(): Promise<Partner[]> {
    try {
      return await this.partnerRepo.list();
    } catch (error) {
      console.error('Failed to get partners:', error);
      throw error;
    }
  }

  // Поиск партнеров
  async searchPartners(query: string): Promise<Partner[]> {
    try {
      return await this.partnerRepo.search(query);
    } catch (error) {
      console.error('Failed to search partners:', error);
      throw error;
    }
  }

  // ============ Операции с документами ============

  // Сохранение документа
  async saveDocument(document: Document): Promise<string> {
    try {
      return await this.documentRepo.save(document);
    } catch (error) {
      console.error('Failed to save document:', error);
      throw error;
    }
  }

  // Получение всех документов
  async getDocuments(): Promise<Document[]> {
    try {
      return await this.documentRepo.list();
    } catch (error) {
      console.error('Failed to get documents:', error);
      throw error;
    }
  }

  // ============ Настройки ============

  // Получение настроек
  async getSettings(): Promise<AppSettings> {
    try {
      return await this.settingsRepo.get();
    } catch (error) {
      console.error('Failed to get settings:', error);
      throw error;
    }
  }

  // Сохранение настроек
  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      await this.settingsRepo.save(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  // ============ Задачи (Zadachnik) ============

  // Получить все задачи
  async getTasks(): Promise<TaskDB[]> {
    try {
      return await this.taskRepo.list();
    } catch (error) {
      console.error('Failed to get tasks:', error);
      throw error;
    }
  }

  // Сохранить задачи (батчами)
  async saveTasks(tasks: TaskDB[]): Promise<void> {
    try {
      await this.taskRepo.saveAll(tasks);
    } catch (error) {
      console.error('Failed to save tasks:', error);
      throw error;
    }
  }

  // Добавить или обновить задачу
  async saveTask(task: TaskDB): Promise<void> {
    try {
      await this.taskRepo.save(task);
    } catch (error) {
      console.error('Failed to save task:', error);
      throw error;
    }
  }

  // Удалить задачу
  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.taskRepo.delete(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  // Получить задачи по employeeId
  async getTasksByEmployeeId(employeeId: string): Promise<TaskDB[]> {
    try {
      return await this.taskRepo.byEmployee(employeeId);
    } catch (error) {
      console.error('Failed to get tasks by employeeId:', error);
      throw error;
    }
  }

  // Получить задачи по региону
  async getTasksByRegion(region: string): Promise<TaskDB[]> {
    try {
      return await this.taskRepo.byRegion(region);
    } catch (error) {
      console.error('Failed to get tasks by region:', error);
      throw error;
    }
  }

  // ============ Экспорт/Импорт ============

  // Экспорт в Excel с расширенными данными
  async exportToExcel(data: ExtendedCollateralCard[], filename: string): Promise<ExportResult> {
    try {
      const exportData = data.map(card => ({
        ID: card.id,
        Номер: card.number,
        Название: card.name,
        Категория: this.translateCategory(card.mainCategory),
        'Вид объекта': card.classification.level1,
        Тип: card.classification.level2,
        'Код ЦБ': card.cbCode,
        Статус: card.status === 'editing' ? 'Редактирование' : 'Утвержден',
        Адрес: card.address?.fullAddress || '',
        Собственники:
          card.partners
            ?.filter(p => p.role === 'owner')
            .map(p => this.getPartnerName(p))
            .join(', ') || '',
        Площадь: card.characteristics?.totalArea || card.characteristics?.area || '',
        Документов: card.documents?.length || 0,
        'Дата создания': new Date(card.createdAt).toLocaleString('ru-RU'),
        'Дата обновления': new Date(card.updatedAt).toLocaleString('ru-RU'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Карточки');

      const maxWidth = 30;
      worksheet['!cols'] = Object.keys(exportData[0] || {}).map(() => ({ wch: maxWidth }));

      XLSX.writeFile(workbook, `${filename}.xlsx`);

      return {
        success: true,
        message: `Экспортировано ${data.length} записей`,
        filename: `${filename}.xlsx`,
      };
    } catch (error) {
      console.error('Failed to export to Excel:', error);
      return {
        success: false,
        message: 'Ошибка при экспорте данных',
      };
    }
  }

  // Экспорт резервной копии
  async exportBackup(): Promise<Blob> {
    try {
      const cards = await this.db.collateralCards.toArray();
      const partners = await this.db.partners.toArray();
      const documents = await this.db.documents.toArray();
      const settings = await this.getSettings();

      const backup = {
        version: 2,
        timestamp: new Date().toISOString(),
        data: {
          cards,
          partners,
          documents,
          settings,
        },
      };

      return new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    } catch (error) {
      console.error('Failed to export backup:', error);
      throw error;
    }
  }

  // Импорт резервной копии
  async importBackup(file: File): Promise<void> {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.version || !backup.data) {
        throw new Error('Некорректный формат файла резервной копии');
      }

      // Очистка текущих данных
      await this.db.collateralCards.clear();
      await this.db.partners.clear();
      await this.db.documents.clear();

      // Импорт данных
      if (backup.data.cards && Array.isArray(backup.data.cards)) {
        for (const card of backup.data.cards) {
          const restored = this.fromDbCard(card as ExtendedCollateralCardDB);
          await this.saveExtendedCard(restored);
        }
      }

      if (backup.data.partners && Array.isArray(backup.data.partners)) {
        for (const partner of backup.data.partners) {
          await this.savePartner(partner);
        }
      }

      if (backup.data.documents && Array.isArray(backup.data.documents)) {
        for (const document of backup.data.documents) {
          await this.saveDocument(document);
        }
      }

      if (backup.data.settings) {
        await this.saveSettings(backup.data.settings);
      }

      console.log('Backup imported successfully');
    } catch (error) {
      console.error('Failed to import backup:', error);
      throw error;
    }
  }

  // ============ Вспомогательные методы ============

  private translateCategory(category: string): string {
    const translations: Record<string, string> = {
      real_estate: 'Недвижимость',
      movable: 'Движимое имущество',
      property_rights: 'Имущественные права',
    };
    return translations[category] || category;
  }

  private getPartnerName(partner: Partner): string {
    if (partner.type === 'individual') {
      return [partner.lastName, partner.firstName, partner.middleName].filter(Boolean).join(' ');
    }
    return partner.organizationName || '';
  }

  // Получение статистики
  async getStatistics() {
    try {
      const allCards = await this.db.collateralCards.toArray();

      return {
        total: allCards.length,
        byCategory: {
          real_estate: allCards.filter(c => c.mainCategory === 'real_estate').length,
          movable: allCards.filter(c => c.mainCategory === 'movable').length,
          property_rights: allCards.filter(c => c.mainCategory === 'property_rights').length,
        },
        byStatus: {
          editing: allCards.filter(c => c.status === 'editing').length,
          approved: allCards.filter(c => c.status === 'approved').length,
        },
        withDocuments: allCards.filter(c => (c.documents?.length || 0) > 0).length,
        withPartners: allCards.filter(c => (c.partners?.length || 0) > 0).length,
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }

  // ============ Workflow ============

  async getWorkflowCases(): Promise<WorkflowCase[]> {
    return await this.workflowRepo.getCases();
  }

  async saveWorkflowCases(cases: WorkflowCase[]): Promise<void> {
    await this.workflowRepo.saveCases(cases);
  }

  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return await this.workflowRepo.getTemplates();
  }

  async saveWorkflowTemplates(templates: WorkflowTemplate[]): Promise<void> {
    await this.workflowRepo.saveTemplates(templates);
  }

  async ensureDefaultWorkflowTemplates(defaultTemplates: WorkflowTemplate[]): Promise<void> {
    const existing = await this.workflowRepo.getTemplates();
    if (!existing || existing.length === 0) {
      await this.saveWorkflowTemplates(defaultTemplates);
    }
  }
}

// Экспортируем синглтон
export const extendedStorageService = new ExtendedStorageService();
export default extendedStorageService;
