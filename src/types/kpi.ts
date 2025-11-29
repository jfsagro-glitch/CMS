export interface KPIWorkloadByPeriod {
  last7Days: number;
  last30Days: number;
  last90Days: number;
}

export interface KPIData {
  totalPortfolioValue: number;
  totalContracts: number;
  activeContracts: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalConclusions: number;
  approvedConclusions: number;
  pendingConclusions: number;
  totalObjects: number;
  totalInsurance: number;
  activeInsurance: number;
  averageConclusionDays: number;
  slaCompliance: number;
  currentWorkload: number;
  mboCompletionOverall: number;
  workloadByPeriod: KPIWorkloadByPeriod;
}

