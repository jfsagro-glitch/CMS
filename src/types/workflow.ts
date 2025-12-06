export type WorkflowStage =
  | 'ANALYSIS'
  | 'PREPARATION'
  | 'NEGOTIATION'
  | 'APPROVAL'
  | 'AGREEMENT'
  | 'SALE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface WorkflowStageMeta {
  key: WorkflowStage;
  title: string;
  description: string;
  checklist: string[];
}

export interface WorkflowHistoryItem {
  id: string;
  stage: WorkflowStage;
  user: string;
  comment?: string;
  createdAt: string;
}

export interface WorkflowDocument {
  id: string;
  name: string;
  type: string;
  url?: string;
  createdAt: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'notification' | 'claim' | 'agreement' | 'sale-contract' | 'other';
  updatedAt: string;
}

export type DebtorType = 'individual' | 'sole_trader' | 'legal';

export interface DebtorSegment {
  id: string;
  name: string;
  description: string;
  minDebt?: number;
  maxDebt?: number;
  minDaysOverdue?: number;
  maxDaysOverdue?: number;
  debtorTypes: DebtorType[];
  strategySummary: string;
}

export interface CollectionStep {
  id: string;
  name: string;
  dayFrom: number;
  dayTo: number;
  channel: 'sms' | 'email' | 'call' | 'letter' | 'legal';
  owner: 'system' | 'manager' | 'senior_manager' | 'legal';
  description: string;
}

export interface CommunicationScript {
  id: string;
  name: string;
  segmentIds: string[];
  stepIds: string[];
  summary: string;
}

export interface RestructuringRule {
  id: string;
  name: string;
  description: string;
  allowedForSegments: string[];
  managerLimitPercent?: number;
}

export interface WorkflowCase {
  id: string;
  objectId: string;
  objectName: string;
  assetType: string;
  debtAmount?: number;
  appraisedValue?: number;
  debtorType?: DebtorType;
  daysOverdue?: number;
  segmentId?: string;
  stage: WorkflowStage;
  manager?: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  history: WorkflowHistoryItem[];
  documents: WorkflowDocument[];
  notes?: string;
}

export interface WorkflowKPI {
  avgDurationDays: number;
  conversionRate: number;
  totalRecovered: number;
  efficiencyPercent: number;
  activeCases: number;
  byStage: Record<WorkflowStage, number>;
}

