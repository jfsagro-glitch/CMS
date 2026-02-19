import Dexie, { Table } from 'dexie';
import * as XLSX from 'xlsx';
import type {
  CollateralCard,
  FilterParams,
  AppSettings,
  ImportResult,
  ExportResult,
  SafeDateString,
} from '@/types';
import { toSafeDateString, fromSafeDateString } from '@/utils/dateSerialization';

type CollateralCardDB = Omit<CollateralCard, 'createdAt' | 'updatedAt'> & {
  createdAt: SafeDateString;
  updatedAt: SafeDateString;
};

// Определяем схему базы данных
class CMSDatabase extends Dexie {
  collateralCards!: Table<CollateralCardDB, string>;
  settings!: Table<AppSettings & { id: string }, string>;

  constructor() {
    super('CMSDatabase');

    this.version(1).stores({
      collateralCards: 'id, mainCategory, status, number, name, createdAt, updatedAt, cbCode',
      settings: 'id',
    });
  }
}

// Создаем экземпляр базы данных
const db = new CMSDatabase();

class StorageService {
  private db: CMSDatabase;

  constructor() {
    this.db = db;
  }

  // Инициализация базы данных
  async initDatabase(): Promise<void> {
    try {
      await this.db.open();
      console.log('Database initialized successfully');

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

  private toDbCard(card: CollateralCard): CollateralCardDB {
    return {
      ...card,
      createdAt: toSafeDateString(card.createdAt),
      updatedAt: toSafeDateString(card.updatedAt),
    };
  }

  private fromDbCard(card: CollateralCardDB): CollateralCard {
    return {
      ...card,
      createdAt: fromSafeDateString(card.createdAt),
      updatedAt: fromSafeDateString(card.updatedAt),
    };
  }

  // ============ Операции с карточками ============

  // Сохранение карточки
  async saveCollateralCard(card: CollateralCard): Promise<string> {
    try {
      const now = new Date();
      const cardToSave: CollateralCard = {
        ...card,
        updatedAt: now,
        createdAt: card.createdAt || now,
      };

      const dbCard = this.toDbCard(cardToSave);
      await this.db.collateralCards.put(dbCard);
      return dbCard.id;
    } catch (error) {
      console.error('Failed to save collateral card:', error);
      throw error;
    }
  }

  // Получение карточек с фильтрацией
  async getCollateralCards(filters?: FilterParams): Promise<CollateralCard[]> {
    try {
      let collection = this.db.collateralCards.toCollection();

      if (filters) {
        if (filters.mainCategory) {
          collection = this.db.collateralCards.where('mainCategory').equals(filters.mainCategory);
        }

        if (filters.status) {
          collection = collection.filter(card => card.status === filters.status);
        }

        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          collection = collection.filter(
            card =>
              card.name.toLowerCase().includes(query) || card.number.toLowerCase().includes(query)
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
      }

      const items = await collection.toArray();
      return items.map(card => this.fromDbCard(card));
    } catch (error) {
      console.error('Failed to get collateral cards:', error);
      throw error;
    }
  }

  // Получение карточки по ID
  async getCollateralCardById(id: string): Promise<CollateralCard | undefined> {
    try {
      const card = await this.db.collateralCards.get(id);
      return card ? this.fromDbCard(card) : undefined;
    } catch (error) {
      console.error('Failed to get collateral card:', error);
      throw error;
    }
  }

  // Удаление карточки
  async deleteCollateralCard(id: string): Promise<void> {
    try {
      await this.db.collateralCards.delete(id);
    } catch (error) {
      console.error('Failed to delete collateral card:', error);
      throw error;
    }
  }

  // Массовое удаление карточек
  async deleteCollateralCards(ids: string[]): Promise<void> {
    try {
      await this.db.collateralCards.bulkDelete(ids);
    } catch (error) {
      console.error('Failed to delete collateral cards:', error);
      throw error;
    }
  }

  // Очистка всех карточек
  async clearCollateralCards(): Promise<void> {
    try {
      await this.db.collateralCards.clear();
    } catch (error) {
      console.error('Failed to clear collateral cards:', error);
      throw error;
    }
  }

  // ============ Настройки ============

  // Получение настроек
  async getSettings(): Promise<AppSettings> {
    try {
      const settings = await this.db.settings.get('app-settings');
      return (
        settings || {
          theme: 'light',
          language: 'ru',
          sidebarCollapsed: false,
        }
      );
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
        ...settings,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  // ============ Экспорт/Импорт ============

  // Экспорт в Excel
  async exportToExcel(data: CollateralCard[], filename: string): Promise<ExportResult> {
    try {
      const exportData = data.map(card => ({
        ID: card.id,
        Номер: card.number,
        Название: card.name,
        Категория: this.translateCategory(card.mainCategory),
        'Уровень 0': card.classification.level0,
        'Уровень 1': card.classification.level1,
        'Уровень 2': card.classification.level2,
        'Код ЦБ': card.cbCode,
        Статус: card.status === 'editing' ? 'Редактирование' : 'Утвержден',
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

  // Импорт из Excel
  async importFromExcel(file: File): Promise<ImportResult> {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const errors: string[] = [];
      let importedCount = 0;

      for (const row of jsonData) {
        try {
          const card: CollateralCard = this.validateImportRow(row);
          await this.saveCollateralCard(card);
          importedCount++;
        } catch (error) {
          errors.push(`Ошибка в строке: ${JSON.stringify(row)}`);
        }
      }

      return {
        success: true,
        message: `Импортировано ${importedCount} из ${jsonData.length} записей`,
        importedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Failed to import from Excel:', error);
      return {
        success: false,
        message: 'Ошибка при импорте данных',
        errors: [String(error)],
      };
    }
  }

  // ============ Резервное копирование ============

  // Экспорт резервной копии
  async exportBackup(): Promise<Blob> {
    try {
      const cards = await this.db.collateralCards.toArray();
      const settings = await this.getSettings();

      const backup = {
        version: 1,
        timestamp: new Date().toISOString(),
        data: {
          cards,
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

      await this.db.collateralCards.clear();

      if (backup.data.cards && Array.isArray(backup.data.cards)) {
        for (const card of backup.data.cards) {
          const restored = this.fromDbCard(card as CollateralCardDB);
          await this.saveCollateralCard(restored);
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

  private validateImportRow(row: any): CollateralCard {
    if (!row['ID'] || !row['Название']) {
      throw new Error('Отсутствуют обязательные поля');
    }

    return {
      id: row['ID'],
      number: row['Номер'] || '',
      name: row['Название'],
      mainCategory: this.reverseTranslateCategory(row['Категория']),
      classification: {
        level0: row['Уровень 0'] || '',
        level1: row['Уровень 1'] || '',
        level2: row['Уровень 2'] || '',
      },
      cbCode: Number(row['Код ЦБ']) || 0,
      status: row['Статус'] === 'Утвержден' ? 'approved' : 'editing',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private reverseTranslateCategory(category: string): CollateralCard['mainCategory'] {
    const translations: Record<string, CollateralCard['mainCategory']> = {
      Недвижимость: 'real_estate',
      'Движимое имущество': 'movable',
      'Имущественные права': 'property_rights',
    };
    return translations[category] || 'real_estate';
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
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }
}

// Экспортируем синглтон
export const storageService = new StorageService();
export default storageService;
