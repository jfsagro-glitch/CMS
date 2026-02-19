import Dexie, { Table } from 'dexie';
import type {
  ExtendedCollateralCard,
  Partner,
  Document,
  AppSettings,
  SafeDateString,
} from '@/types';
import type { WorkflowCase, WorkflowTemplate } from '@/types/workflow';
import type { InspectionDB } from '@/types/inspection';

export interface DocumentIndexDB {
  documentName: string;
  totalPages: number;
  indexedAt: Date;
}

export interface DocumentChunkDB {
  id: string;
  documentName: string;
  page: number;
  text: string;
  keywords: string[];
  imageData?: string;
  isImage?: boolean;
}

export interface KnowledgeTopicDB {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  content: string;
  page: number;
  relatedTopics?: string[];
}

export interface KnowledgeCategoryDB {
  id: string;
  name: string;
  description: string;
  topicIds: string[];
}

export interface KnowledgeSearchIndexDB {
  keyword: string;
  topicIds: string[];
}

export interface TaskDB {
  id: string;
  region: string;
  type: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  status: string;
  businessUser: string;
  businessUserName: string;
  assignedTo: string[];
  currentAssignee: string | null;
  currentAssigneeName: string | null;
  employeeId?: string;
  documents: any[];
  comments: any[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  history: Array<{
    date: string;
    user: string;
    userRole: string;
    action: string;
    comment?: string;
    status: string;
  }>;
  category?: string;
  workflowCaseId?: string;
}

export type ExtendedCollateralCardDB = Omit<ExtendedCollateralCard, 'createdAt' | 'updatedAt'> & {
  createdAt: SafeDateString;
  updatedAt: SafeDateString;
};

export class ExtendedCMSDatabase extends Dexie {
  collateralCards!: Table<ExtendedCollateralCardDB, string>;
  partners!: Table<Partner, string>;
  documents!: Table<Document, string>;
  settings!: Table<AppSettings & { id: string }, string>;
  inspections!: Table<InspectionDB, string>;
  documentIndexes!: Table<DocumentIndexDB, string>;
  documentChunks!: Table<DocumentChunkDB, string>;
  knowledgeTopics!: Table<KnowledgeTopicDB, string>;
  knowledgeCategories!: Table<KnowledgeCategoryDB, string>;
  knowledgeSearchIndex!: Table<KnowledgeSearchIndexDB, string>;
  tasks!: Table<TaskDB, string>;
  workflowCases!: Table<WorkflowCase, string>;
  workflowTemplates!: Table<WorkflowTemplate, string>;

  constructor() {
    super('CMSDatabase');

    this.version(2)
      .stores({
        collateralCards: 'id, mainCategory, status, number, name, createdAt, updatedAt, cbCode',
        partners: 'id, type, role, inn, lastName, organizationName',
        documents: 'id, name, type, category, uploadDate',
        settings: 'id',
      })
      .upgrade(async () => {
        console.log('Upgrading database to version 2...');
      });

    this.version(3)
      .stores({
        collateralCards: 'id, mainCategory, status, number, name, createdAt, updatedAt, cbCode',
        partners: 'id, type, role, inn, lastName, organizationName',
        documents: 'id, name, type, category, uploadDate',
        settings: 'id',
        inspections:
          'id, inspectionType, status, inspectionDate, collateralCardId, inspectorId, condition, createdAt, updatedAt',
      })
      .upgrade(async () => {
        console.log('Upgrading database to version 3...');
      });

    this.version(4)
      .stores({
        collateralCards: 'id, mainCategory, status, number, name, createdAt, updatedAt, cbCode',
        partners: 'id, type, role, inn, lastName, organizationName',
        documents: 'id, name, type, category, uploadDate',
        settings: 'id',
        inspections:
          'id, inspectionType, status, inspectionDate, collateralCardId, inspectorId, condition, createdAt, updatedAt',
        documentIndexes: 'documentName',
        documentChunks: 'id, documentName, page',
      })
      .upgrade(async () => {
        console.log('Upgrading database to version 4...');
      });

    this.version(5)
      .stores({
        collateralCards: 'id, mainCategory, status, number, name, createdAt, updatedAt, cbCode',
        partners: 'id, type, role, inn, lastName, organizationName',
        documents: 'id, name, type, category, uploadDate',
        settings: 'id',
        inspections:
          'id, inspectionType, status, inspectionDate, collateralCardId, inspectorId, condition, createdAt, updatedAt',
        documentIndexes: 'documentName',
        documentChunks: 'id, documentName, page',
        knowledgeTopics: 'id, category',
        knowledgeCategories: 'id',
        knowledgeSearchIndex: 'keyword',
      })
      .upgrade(async () => {
        console.log('Upgrading database to version 5...');
      });

    this.version(6)
      .stores({
        collateralCards: 'id, mainCategory, status, number, name, createdAt, updatedAt, cbCode',
        partners: 'id, type, role, inn, lastName, organizationName',
        documents: 'id, name, type, category, uploadDate',
        settings: 'id',
        inspections:
          'id, inspectionType, status, inspectionDate, collateralCardId, inspectorId, condition, createdAt, updatedAt',
        documentIndexes: 'documentName',
        documentChunks: 'id, documentName, page',
        knowledgeTopics: 'id, category',
        knowledgeCategories: 'id',
        knowledgeSearchIndex: 'keyword',
        tasks: 'id, employeeId, region, status, type, dueDate, createdAt',
      })
      .upgrade(async tx => {
        console.log('Upgrading database to version 6: migrating tasks from localStorage...');
        try {
          let tasksJson: string | null = null;
          try {
            tasksJson = localStorage.getItem('zadachnik_tasks');
          } catch (error) {
            console.warn(
              'Не удалось прочитать задачи из localStorage (возможно, данные слишком большие), пропускаем миграцию'
            );
            return;
          }

          if (tasksJson) {
            try {
              const tasks = JSON.parse(tasksJson);
              if (Array.isArray(tasks) && tasks.length > 0) {
                const batchSize = 1000;
                for (let i = 0; i < tasks.length; i += batchSize) {
                  const batch = tasks.slice(i, i + batchSize);
                  await tx.table('tasks').bulkPut(batch);
                }
                console.log(`✅ Мигрировано ${tasks.length} задач из localStorage в IndexedDB`);
                try {
                  localStorage.removeItem('zadachnik_tasks');
                } catch (e) {
                  console.warn('Не удалось удалить задачи из localStorage (не критично)');
                }
              }
            } catch (parseError) {
              console.error('Ошибка парсинга задач из localStorage:', parseError);
              try {
                localStorage.removeItem('zadachnik_tasks');
              } catch (e) {
                // ignore
              }
            }
          }
        } catch (error) {
          console.error('Ошибка миграции задач:', error);
        }
      });

    this.version(7)
      .stores({
        collateralCards: 'id, mainCategory, status, number, name, createdAt, updatedAt, cbCode',
        partners: 'id, type, role, inn, lastName, organizationName',
        documents: 'id, name, type, category, uploadDate',
        settings: 'id',
        inspections:
          'id, inspectionType, status, inspectionDate, collateralCardId, inspectorId, condition, createdAt, updatedAt',
        documentIndexes: 'documentName',
        documentChunks: 'id, documentName, page',
        knowledgeTopics: 'id, category',
        knowledgeCategories: 'id',
        knowledgeSearchIndex: 'keyword',
        tasks: 'id, employeeId, region, status, type, dueDate, createdAt',
        workflowCases: 'id, objectId, stage, updatedAt',
        workflowTemplates: 'id, type, updatedAt',
      })
      .upgrade(async () => {
        console.log('Upgrading database to version 7: adding workflow tables');
      });

    this.version(8)
      .stores({
        collateralCards:
          'id, mainCategory, status, number, name, createdAt, updatedAt, cbCode, region, *partnerIds, [mainCategory+status], [status+updatedAt], [mainCategory+updatedAt]',
        partners: 'id, type, role, inn, lastName, organizationName',
        documents: 'id, name, type, category, uploadDate',
        settings: 'id',
        inspections:
          'id, inspectionType, status, inspectionDate, collateralCardId, inspectorId, condition, createdAt, updatedAt',
        documentIndexes: 'documentName',
        documentChunks: 'id, documentName, page',
        knowledgeTopics: 'id, category',
        knowledgeCategories: 'id',
        knowledgeSearchIndex: 'keyword',
        tasks: 'id, employeeId, region, status, type, dueDate, createdAt',
        workflowCases: 'id, objectId, stage, updatedAt',
        workflowTemplates: 'id, type, updatedAt',
      })
      .upgrade(async tx => {
        console.log('Upgrading database to version 8: adding card indexes');
        await tx.table('collateralCards').toCollection().modify(card => {
          const regionFromAddress = card.address?.region || card.address?.city;
          card.region = card.region || regionFromAddress;
          if (Array.isArray(card.partners)) {
            card.partnerIds = card.partners.map((p: { id?: string }) => p.id).filter(Boolean);
          }
        });
      });
  }
}

export const extendedDb = new ExtendedCMSDatabase();
