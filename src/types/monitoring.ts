export type MonitoringTimeframe = 'overdue' | 'week' | 'month' | 'quarter' | 'later';

export interface MonitoringPlanEntry {
  reference?: string | number | null;
  borrower?: string | null;
  pledger?: string | null;
  segment?: string | null;
  group?: string | null;
  collateralType?: string | null;
  baseType: string;
  frequencyMonths: number;
  monitoringType?: string | null;
  monitoringMethod: string;
  lastMonitoringDate: string;
  plannedDate: string;
  timeframe: MonitoringTimeframe;
  owner: string;
  priority?: string | null;
  liquidity?: string | null;
  collateralValue?: number | null;
}

export interface RevaluationPlanEntry {
  reference?: string | number | null;
  borrower?: string | null;
  pledger?: string | null;
  segment?: string | null;
  group?: string | null;
  collateralType?: string | null;
  baseType: string;
  frequencyMonths: number;
  lastRevaluationDate: string;
  plannedDate: string;
  timeframe: MonitoringTimeframe;
  owner: string;
  priority?: string | null;
  collateralValue?: number | null;
  marketValue?: number | null;
  revaluationMethod?: string | null;
}
