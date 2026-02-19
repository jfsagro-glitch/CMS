import type { AppSettings } from '@/types';
import { extendedDb, type ExtendedCMSDatabase } from '@/data/db/extendedDb';

export class SettingsRepo {
  private db: ExtendedCMSDatabase;

  constructor(db: ExtendedCMSDatabase = extendedDb) {
    this.db = db;
  }

  async get(): Promise<AppSettings> {
    const settings = await this.db.settings.get('app-settings');
    return (
      settings || {
        theme: 'light',
        language: 'ru',
        sidebarCollapsed: false,
      }
    );
  }

  async save(settings: Partial<AppSettings>): Promise<void> {
    const currentSettings = await this.get();
    await this.db.settings.put({
      id: 'app-settings',
      ...currentSettings,
      ...settings,
    });
  }
}
