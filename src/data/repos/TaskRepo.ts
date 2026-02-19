import { extendedDb, type ExtendedCMSDatabase, type TaskDB } from '@/data/db/extendedDb';

export class TaskRepo {
  private db: ExtendedCMSDatabase;

  constructor(db: ExtendedCMSDatabase = extendedDb) {
    this.db = db;
  }

  async list(): Promise<TaskDB[]> {
    return this.db.tasks.toArray();
  }

  async saveAll(tasks: TaskDB[]): Promise<void> {
    await this.db.tasks.clear();
    const batchSize = 1000;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      await this.db.tasks.bulkPut(batch);
    }
  }

  async save(task: TaskDB): Promise<void> {
    await this.db.tasks.put(task);
  }

  async delete(taskId: string): Promise<void> {
    await this.db.tasks.delete(taskId);
  }

  async byEmployee(employeeId: string): Promise<TaskDB[]> {
    return this.db.tasks.where('employeeId').equals(employeeId).toArray();
  }

  async byRegion(region: string): Promise<TaskDB[]> {
    return this.db.tasks.where('region').equals(region).toArray();
  }
}
