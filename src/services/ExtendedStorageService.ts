import Dexie, { Table } from 'dexie';
import * as XLSX from 'xlsx';
import type {
  ExtendedCollateralCard,
  Partner,
  Document,
  ExtendedFilterParams,
  AppSettings,
  ExportResult,
} from '@/types';

// Расширенная схема базы данных
class ExtendedCMSDatabase extends Dexie {
  collateralCards!: Table<ExtendedCollateralCard, string>;
  partners!: Table<Partner, string>;
  documents!: Table<Document, string>;
  settings!: Table<AppSettings & { id: string }, string>;

  constructor() {
    super('CMSDatabase');
    
    // Версия 2 с расширенной схемой
    this.version(2).stores({
      collateralCards: 'id, mainCategory, status, number, name, createdAt, updatedAt, cbCode',
      partners: 'id, type, role, inn, lastName, organizationName',
      documents: 'id, name, type, category, uploadDate',
      settings: 'id'
    }).upgrade(async () => {
      // Миграция данных из версии 1
      console.log('Upgrading database to version 2...');
    });
  }
}

// Создаем экземпляр базы данных
const extendedDb = new ExtendedCMSDatabase();

class ExtendedStorageService {
  private db: ExtendedCMSDatabase;

  constructor() {
    this.db = extendedDb;
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
          sidebarCollapsed: false
        });
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // ============ Операции с расширенными карточками ============

  // Сохранение расширенной карточки
  async saveExtendedCard(card: ExtendedCollateralCard): Promise<string> {
    try {
      const now = new Date();
      const cardToSave: ExtendedCollateralCard = {
        ...card,
        updatedAt: now,
        createdAt: card.createdAt || now
      };
      
      await this.db.collateralCards.put(cardToSave);
      return cardToSave.id;
    } catch (error) {
      console.error('Failed to save collateral card:', error);
      throw error;
    }
  }

  // Получение расширенных карточек с фильтрацией
  async getExtendedCards(filters?: ExtendedFilterParams): Promise<ExtendedCollateralCard[]> {
    try {
      let collection = this.db.collateralCards.toCollection();

      if (filters) {
        if (filters.mainCategory) {
          collection = this.db.collateralCards
            .where('mainCategory')
            .equals(filters.mainCategory);
        }

        if (filters.status) {
          collection = collection.filter(card => card.status === filters.status);
        }

        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          collection = collection.filter(card =>
            card.name.toLowerCase().includes(query) ||
            card.number.toLowerCase().includes(query) ||
            card.address?.fullAddress?.toLowerCase().includes(query) ||
            card.partners?.some(p =>
              p.lastName?.toLowerCase().includes(query) ||
              p.firstName?.toLowerCase().includes(query) ||
              p.organizationName?.toLowerCase().includes(query)
            )
          );
        }

        if (filters.dateFrom) {
          collection = collection.filter(card => card.createdAt >= filters.dateFrom!);
        }

        if (filters.dateTo) {
          collection = collection.filter(card => card.createdAt <= filters.dateTo!);
        }

        if (filters.region) {
          collection = collection.filter(card =>
            Boolean(card.address?.region?.toLowerCase().includes(filters.region!.toLowerCase()))
          );
        }

        if (filters.objectType) {
          collection = collection.filter(() => {
            // Логика определения типа объекта
            return true; // Упрощенная версия
          });
        }

        if (filters.hasDocuments !== undefined) {
          collection = collection.filter(card =>
            filters.hasDocuments ? (card.documents?.length || 0) > 0 : (card.documents?.length || 0) === 0
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

      return await collection.toArray();
    } catch (error) {
      console.error('Failed to get collateral cards:', error);
      throw error;
    }
  }

  // Получение карточки по ID
  async getExtendedCardById(id: string): Promise<ExtendedCollateralCard | undefined> {
    try {
      return await this.db.collateralCards.get(id);
    } catch (error) {
      console.error('Failed to get collateral card:', error);
      throw error;
    }
  }

  // Удаление карточки
  async deleteExtendedCard(id: string): Promise<void> {
    try {
      await this.db.collateralCards.delete(id);
    } catch (error) {
      console.error('Failed to delete collateral card:', error);
      throw error;
    }
  }

  // Массовое удаление карточек
  async deleteExtendedCards(ids: string[]): Promise<void> {
    try {
      await this.db.collateralCards.bulkDelete(ids);
    } catch (error) {
      console.error('Failed to delete collateral cards:', error);
      throw error;
    }
  }

  // ============ Операции с партнерами ============

  // Сохранение партнера
  async savePartner(partner: Partner): Promise<string> {
    try {
      await this.db.partners.put(partner);
      return partner.id;
    } catch (error) {
      console.error('Failed to save partner:', error);
      throw error;
    }
  }

  // Получение всех партнеров
  async getPartners(): Promise<Partner[]> {
    try {
      return await this.db.partners.toArray();
    } catch (error) {
      console.error('Failed to get partners:', error);
      throw error;
    }
  }

  // Поиск партнеров
  async searchPartners(query: string): Promise<Partner[]> {
    try {
      const lowerQuery = query.toLowerCase();
      return await this.db.partners
        .filter(partner =>
          Boolean(partner.lastName?.toLowerCase().includes(lowerQuery) ||
          partner.firstName?.toLowerCase().includes(lowerQuery) ||
          partner.organizationName?.toLowerCase().includes(lowerQuery) ||
          partner.inn?.includes(query))
        )
        .toArray();
    } catch (error) {
      console.error('Failed to search partners:', error);
      throw error;
    }
  }

  // ============ Операции с документами ============

  // Сохранение документа
  async saveDocument(document: Document): Promise<string> {
    try {
      await this.db.documents.put(document);
      return document.id;
    } catch (error) {
      console.error('Failed to save document:', error);
      throw error;
    }
  }

  // Получение всех документов
  async getDocuments(): Promise<Document[]> {
    try {
      return await this.db.documents.toArray();
    } catch (error) {
      console.error('Failed to get documents:', error);
      throw error;
    }
  }

  // ============ Настройки ============

  // Получение настроек
  async getSettings(): Promise<AppSettings> {
    try {
      const settings = await this.db.settings.get('app-settings');
      return settings || {
        theme: 'light',
        language: 'ru',
        sidebarCollapsed: false
      };
    } catch (error) {
      console.error('Failed to get settings:', error);
      throw error;
    }
  }

  // Сохранение настроек
  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      await this.db.settings.put({
        id: 'app-settings',
        ...currentSettings,
        ...settings
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  // ============ Экспорт/Импорт ============

  // Экспорт в Excel с расширенными данными
  async exportToExcel(data: ExtendedCollateralCard[], filename: string): Promise<ExportResult> {
    try {
      const exportData = data.map(card => ({
        'ID': card.id,
        'Номер': card.number,
        'Название': card.name,
        'Категория': this.translateCategory(card.mainCategory),
        'Вид объекта': card.classification.level1,
        'Тип': card.classification.level2,
        'Код ЦБ': card.cbCode,
        'Статус': card.status === 'editing' ? 'Редактирование' : 'Утвержден',
        'Адрес': card.address?.fullAddress || '',
        'Собственники': card.partners
          ?.filter(p => p.role === 'owner')
          .map(p => this.getPartnerName(p))
          .join(', ') || '',
        'Площадь': card.characteristics?.totalArea || card.characteristics?.area || '',
        'Документов': card.documents?.length || 0,
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
        filename: `${filename}.xlsx`
      };
    } catch (error) {
      console.error('Failed to export to Excel:', error);
      return {
        success: false,
        message: 'Ошибка при экспорте данных'
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
          settings
        }
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
          card.createdAt = new Date(card.createdAt);
          card.updatedAt = new Date(card.updatedAt);
          await this.saveExtendedCard(card);
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
      'real_estate': 'Недвижимость',
      'movable': 'Движимое имущество',
      'property_rights': 'Имущественные права'
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
          property_rights: allCards.filter(c => c.mainCategory === 'property_rights').length
        },
        byStatus: {
          editing: allCards.filter(c => c.status === 'editing').length,
          approved: allCards.filter(c => c.status === 'approved').length
        },
        withDocuments: allCards.filter(c => (c.documents?.length || 0) > 0).length,
        withPartners: allCards.filter(c => (c.partners?.length || 0) > 0).length,
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }
}

// Экспортируем синглтон
export const extendedStorageService = new ExtendedStorageService();
export default extendedStorageService;

