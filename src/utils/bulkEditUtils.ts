/**
 * Утилиты для массовых изменений через XLS
 */

import * as XLSX from 'xlsx';
import extendedStorageService from '@/services/ExtendedStorageService';
import employeeService from '@/services/EmployeeService';
import referenceDataService from '@/services/ReferenceDataService';
import inspectionService from '@/services/InspectionService';
import type { ExtendedCollateralCard } from '@/types';
import type { Employee } from '@/types/employee';
import type { ReferenceDictionary } from '@/services/ReferenceDataService';
import type { Inspection } from '@/types/inspection';

export interface BulkEditRow {
  module: string;
  id?: string;
  [key: string]: any;
}

export interface BulkEditResult {
  module: string;
  updated: number;
  created: number;
  errors: string[];
}

/**
 * Экспорт модулей в один XLS файл
 */
export const exportModulesToXLS = async (modules: string[]): Promise<void> => {
  const allRows: BulkEditRow[] = [];

  // Собираем данные из всех выбранных модулей
  for (const moduleKey of modules) {
    try {
      switch (moduleKey) {
        case 'registry': {
          const cards = await extendedStorageService.getExtendedCards();
          for (const card of cards) {
            const row: BulkEditRow = {
              module: 'registry',
              id: card.id,
              number: card.number,
              name: card.name,
              mainCategory: card.mainCategory,
              status: card.status,
              cbCode: card.cbCode,
              propertyType: card.propertyType,
              reference: card.reference,
              contractNumber: card.contractNumber,
              contractId: card.contractId,
              marketValue: card.marketValue,
              pledgeValue: card.pledgeValue,
              notes: card.notes,
              suspensiveConditions: card.suspensiveConditions,
              egrnStatementDate: card.egrnStatementDate,
              // Партнеры как JSON строка
              partners: JSON.stringify(card.partners || []),
              // Адрес как JSON строка
              address: JSON.stringify(card.address || {}),
              // Характеристики как JSON строка
              characteristics: JSON.stringify(card.characteristics || {}),
              // Классификация как JSON строка
              classification: JSON.stringify(card.classification || {}),
            };
            allRows.push(row);
          }
          break;
        }

        case 'employees': {
          const employees = employeeService.getEmployees();
          for (const employee of employees) {
            const row: BulkEditRow = {
              module: 'employees',
              id: employee.id,
              firstName: employee.firstName,
              lastName: employee.lastName,
              middleName: employee.middleName,
              email: employee.email,
              phone: employee.phone,
              position: employee.position,
              department: employee.department,
              region: employee.region,
              permissions: JSON.stringify(employee.permissions || []),
              isActive: employee.isActive,
            };
            allRows.push(row);
          }
          break;
        }

        case 'reference-data': {
          const dictionaries = referenceDataService.getDictionaries();
          for (const dict of dictionaries) {
            const row: BulkEditRow = {
              module: 'reference-data',
              id: dict.id,
              code: dict.code,
              name: dict.name,
              description: dict.description,
              // Элементы как JSON строка
              items: JSON.stringify(dict.items || []),
            };
            allRows.push(row);
          }
          break;
        }

        case 'cms-check': {
          const inspections = await inspectionService.getInspections();
          for (const inspection of inspections) {
            const row: BulkEditRow = {
              module: 'cms-check',
              id: inspection.id,
              inspectionType: inspection.inspectionType,
              status: inspection.status,
              inspectionDate: inspection.inspectionDate instanceof Date 
                ? inspection.inspectionDate.toISOString() 
                : inspection.inspectionDate,
              collateralCardId: inspection.collateralCardId,
              collateralName: inspection.collateralName,
              inspectorId: inspection.inspectorId,
              inspectorName: inspection.inspectorName,
              condition: inspection.condition,
              // Остальные поля как JSON
              photos: JSON.stringify(inspection.photos || []),
              notes: inspection.notes,
              defects: JSON.stringify(inspection.defects || []),
              recommendations: JSON.stringify(inspection.recommendations || []),
            };
            allRows.push(row);
          }
          break;
        }

        // Добавить другие модули по необходимости
      }
    } catch (error) {
      console.error(`Ошибка экспорта модуля ${moduleKey}:`, error);
    }
  }

  // Создаем XLS файл
  if (allRows.length === 0) {
    throw new Error('Нет данных для экспорта');
  }

  const worksheet = XLSX.utils.json_to_sheet(allRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Массовые изменения');

  // Устанавливаем ширину столбцов
  const maxWidth = 30;
  worksheet['!cols'] = Object.keys(allRows[0] || {}).map(() => ({ wch: maxWidth }));

  // Сохраняем файл
  const filename = `bulk-edit-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

/**
 * Парсинг XLS файла для массовых изменений
 */
export const parseBulkEditXLS = async (file: File): Promise<BulkEditRow[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

  const rows: BulkEditRow[] = jsonData.map((row: any) => {
    const bulkRow: BulkEditRow = {
      module: row['Модуль'] || row['module'] || '',
      id: row['ID'] || row['id'] || undefined,
    };

    // Копируем все остальные поля
    Object.keys(row).forEach(key => {
      if (key !== 'Модуль' && key !== 'module' && key !== 'ID' && key !== 'id') {
        bulkRow[key] = row[key];
      }
    });

    return bulkRow;
  });

  return rows;
};

/**
 * Обновление или создание записи в модуле
 */
export const updateOrCreateRecord = async (
  module: string,
  row: BulkEditRow
): Promise<{ success: boolean; created: boolean; error?: string }> => {
  try {
    switch (module) {
      case 'registry': {
        // Парсим JSON поля
        const partners = row.partners ? JSON.parse(String(row.partners)) : [];
        const address = row.address ? JSON.parse(String(row.address)) : undefined;
        const characteristics = row.characteristics ? JSON.parse(String(row.characteristics)) : {};
        const classification = row.classification ? JSON.parse(String(row.classification)) : {};

        const card: ExtendedCollateralCard = {
          id: row.id || `card-${Date.now()}-${Math.random()}`,
          number: row.number || '',
          name: row.name || '',
          mainCategory: row.mainCategory || 'real_estate',
          status: row.status || 'editing',
          cbCode: row.cbCode || 0,
          propertyType: row.propertyType,
          reference: row.reference,
          contractNumber: row.contractNumber,
          contractId: row.contractId,
          marketValue: row.marketValue,
          pledgeValue: row.pledgeValue,
          notes: row.notes,
          suspensiveConditions: row.suspensiveConditions,
          egrnStatementDate: row.egrnStatementDate,
          partners,
          address,
          characteristics,
          classification,
          documents: [],
          createdAt: row.id ? new Date() : new Date(), // Будет обновлено при сохранении
          updatedAt: new Date(),
        };

        // Проверяем существование
        if (row.id) {
          const existing = await extendedStorageService.getExtendedCardById(row.id);
          if (existing) {
            // Обновляем существующую запись
            card.createdAt = existing.createdAt;
            await extendedStorageService.saveExtendedCard(card);
            return { success: true, created: false };
          }
        }

        // Создаем новую запись
        await extendedStorageService.saveExtendedCard(card);
        return { success: true, created: true };
      }

      case 'employees': {
        const permissions = row.permissions ? JSON.parse(String(row.permissions)) : [];
        const employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
          firstName: row.firstName || '',
          lastName: row.lastName || '',
          middleName: row.middleName,
          email: row.email,
          phone: row.phone,
          position: row.position || '',
          department: row.department,
          region: row.region || '',
          permissions: permissions,
          isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
        };

        if (row.id) {
          const existing = employeeService.getEmployeeById(row.id);
          if (existing) {
            employeeService.updateEmployee(row.id, employeeData);
            return { success: true, created: false };
          }
        }

        employeeService.addEmployee(employeeData);
        return { success: true, created: true };
      }

      case 'reference-data': {
        const items = row.items ? JSON.parse(String(row.items)) : [];
        const dict: ReferenceDictionary = {
          id: row.id || `dict-${Date.now()}-${Math.random()}`,
          code: row.code || '',
          name: row.name || '',
          description: row.description,
          items,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const existingDictionaries = referenceDataService.getDictionaries();
        if (row.id) {
          const existingIndex = existingDictionaries.findIndex(d => d.id === row.id);
          if (existingIndex !== -1) {
            existingDictionaries[existingIndex] = {
              ...existingDictionaries[existingIndex],
              ...dict,
              createdAt: existingDictionaries[existingIndex].createdAt,
            };
            referenceDataService.saveDictionaries(existingDictionaries);
            return { success: true, created: false };
          }
        }

        existingDictionaries.push(dict);
        referenceDataService.saveDictionaries(existingDictionaries);
        return { success: true, created: true };
      }

      case 'cms-check': {
        const photos = row.photos ? JSON.parse(String(row.photos)) : [];
        const defects = row.defects ? JSON.parse(String(row.defects)) : [];
        const recommendations = row.recommendations ? JSON.parse(String(row.recommendations)) : [];

        const inspectionDate = row.inspectionDate 
          ? (typeof row.inspectionDate === 'string' ? new Date(row.inspectionDate) : row.inspectionDate)
          : new Date();

        if (row.id) {
          const existing = await inspectionService.getInspectionById(row.id);
          if (existing) {
            const updateData: Partial<Inspection> = {
              inspectionType: row.inspectionType || existing.inspectionType,
              status: row.status || existing.status,
              inspectionDate,
              collateralCardId: row.collateralCardId || existing.collateralCardId,
              collateralName: row.collateralName || existing.collateralName,
              inspectorId: row.inspectorId || existing.inspectorId,
              inspectorName: row.inspectorName || existing.inspectorName,
              condition: row.condition || existing.condition,
              photos,
              notes: row.notes || existing.notes,
              defects,
              recommendations,
              updatedAt: new Date(),
            };
            await inspectionService.updateInspection(row.id, updateData);
            return { success: true, created: false };
          }
        }

        const newInspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'> = {
          inspectionType: row.inspectionType || 'primary',
          status: row.status || 'scheduled',
          inspectionDate,
          collateralCardId: row.collateralCardId || '',
          collateralName: row.collateralName || '',
          inspectorId: row.inspectorId || '',
          inspectorName: row.inspectorName || '',
          condition: row.condition || 'good',
          photos,
          notes: row.notes,
          defects,
          recommendations,
        };

        await inspectionService.createInspection(newInspection);
        return { success: true, created: true };
      }

      default:
        return { success: false, created: false, error: `Неизвестный модуль: ${module}` };
    }
  } catch (error) {
    return { success: false, created: false, error: String(error) };
  }
};

