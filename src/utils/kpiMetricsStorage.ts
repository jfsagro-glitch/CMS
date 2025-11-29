import type { KPIData } from '@/types/kpi';

export const KPI_OVERRIDES_STORAGE_KEY = 'kpiMetricsOverrides';
export const KPI_LATEST_STORAGE_KEY = 'kpiMetricsLatest';

export type KPIOverrides = Partial<KPIData> & {
  workloadByPeriod?: Partial<KPIData['workloadByPeriod']>;
};

export const DEFAULT_KPI_DATA: KPIData = {
  totalPortfolioValue: 0,
  totalContracts: 0,
  activeContracts: 0,
  completedTasks: 0,
  pendingTasks: 0,
  overdueTasks: 0,
  totalConclusions: 0,
  approvedConclusions: 0,
  pendingConclusions: 0,
  totalObjects: 0,
  totalInsurance: 0,
  activeInsurance: 0,
  averageConclusionDays: 0,
  slaCompliance: 0,
  currentWorkload: 0,
  mboCompletionOverall: 0,
  workloadByPeriod: {
    last7Days: 0,
    last30Days: 0,
    last90Days: 0,
  },
};

export const cloneKpiData = (source: KPIData = DEFAULT_KPI_DATA): KPIData => ({
  ...source,
  workloadByPeriod: { ...source.workloadByPeriod },
});

export const getStoredKpiOverrides = (): KPIOverrides | null => {
  try {
    const raw = localStorage.getItem(KPI_OVERRIDES_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Не удалось загрузить корректировки KPI:', error);
    return null;
  }
};

export const saveKpiOverrides = (overrides: KPIOverrides): void => {
  try {
    localStorage.setItem(KPI_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('Не удалось сохранить корректировки KPI:', error);
  }
};

export const clearKpiOverrides = (): void => {
  try {
    localStorage.removeItem(KPI_OVERRIDES_STORAGE_KEY);
  } catch (error) {
    console.warn('Не удалось удалить корректировки KPI:', error);
  }
};

export const loadLatestKpiMetrics = (): KPIData | null => {
  try {
    const raw = localStorage.getItem(KPI_LATEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...cloneKpiData(DEFAULT_KPI_DATA),
      ...parsed,
      workloadByPeriod: {
        ...DEFAULT_KPI_DATA.workloadByPeriod,
        ...(parsed.workloadByPeriod || {}),
      },
    };
  } catch (error) {
    console.warn('Не удалось загрузить последние метрики KPI:', error);
    return null;
  }
};

export const saveLatestKpiMetrics = (data: KPIData): void => {
  try {
    localStorage.setItem(KPI_LATEST_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Не удалось сохранить последние метрики KPI:', error);
  }
};

export const applyKpiOverrides = (
  data: KPIData,
  overrides: KPIOverrides | null = getStoredKpiOverrides()
): KPIData => {
  if (!overrides) return data;

  return {
    ...data,
    ...overrides,
    workloadByPeriod: {
      ...data.workloadByPeriod,
      ...(overrides.workloadByPeriod || {}),
    },
  };
};

