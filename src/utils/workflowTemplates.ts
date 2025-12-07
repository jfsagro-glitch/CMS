import type { WorkflowCase, WorkflowTemplate } from '@/types/workflow';
import type { ExtendedCollateralCard } from '@/types';

export interface WorkflowTemplateContext {
  workflow: WorkflowCase & {
    createdAtFormatted?: string;
    deadlineFormatted?: string;
    salePrice?: number | string;
    conditions?: string;
  };
  object?: {
    name?: string;
    number?: string;
    address?: string;
  };
  today: string;
  custom?: Record<string, unknown>;
}

/**
 * Простой рендерер шаблонов в стиле Mustache: {{object.name}}, {{workflow.debtAmount}}, {{today}}
 */
export const renderWorkflowTemplate = (
  template: WorkflowTemplate,
  wfCase: WorkflowCase,
  card?: ExtendedCollateralCard | null,
  extra?: { salePrice?: number; conditions?: string }
): string => {
  const context: WorkflowTemplateContext = {
    workflow: {
      ...wfCase,
      createdAtFormatted: new Date(wfCase.createdAt).toLocaleDateString('ru-RU'),
      deadlineFormatted: wfCase.deadline
        ? new Date(wfCase.deadline).toLocaleDateString('ru-RU')
        : '',
      salePrice: extra?.salePrice ?? (wfCase as any).salePrice,
      conditions: extra?.conditions ?? wfCase.notes,
    },
    object: card
      ? {
          name: card.name,
          number: card.number,
          address: card.address?.fullAddress || '',
        }
      : undefined,
    today: new Date().toLocaleDateString('ru-RU'),
    custom: {},
  };

  const replacer = (_match: string, key: string) => {
    const path = key.trim().split('.');
    let value: any = context;
    for (const part of path) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return ''; // неизвестный ключ — пустая строка
      }
    }
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      return value.toLocaleString('ru-RU');
    }
    return String(value);
  };

  return template.content.replace(/{{\s*([^}]+)\s*}}/g, replacer);
};


