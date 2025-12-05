import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkflowCase, WorkflowStage, WorkflowKPI, WorkflowTemplate } from '@/types/workflow';

export interface WorkflowState {
  cases: WorkflowCase[];
  kpi: WorkflowKPI | null;
  templates: WorkflowTemplate[];
}

const sampleCases: WorkflowCase[] = [
  {
    id: 'wf-1',
    objectId: 'card-101',
    objectName: 'Офисное помещение, Москва, 450 м²',
    assetType: 'Недвижимость',
    debtAmount: 120_000_000,
    appraisedValue: 150_000_000,
    stage: 'ANALYSIS',
    manager: 'Иванов И.И.',
    deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: 'h-1',
        stage: 'ANALYSIS',
        user: 'Иванов И.И.',
        comment: 'Старт анализа внесудебной реализации',
        createdAt: new Date().toISOString(),
      },
    ],
    documents: [],
    notes: 'Проверить актуальность оценки и запросить выписку ЕГРН',
  },
  {
    id: 'wf-2',
    objectId: 'card-202',
    objectName: 'Спецтехника: автокран Liebherr',
    assetType: 'Движимое имущество',
    debtAmount: 35_000_000,
    appraisedValue: 42_000_000,
    stage: 'NEGOTIATION',
    manager: 'Петрова А.А.',
    deadline: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: 'h-2',
        stage: 'ANALYSIS',
        user: 'Петрова А.А.',
        createdAt: new Date().toISOString(),
        comment: 'Проведен анализ возможности внесудебной реализации',
      },
      {
        id: 'h-3',
        stage: 'PREPARATION',
        user: 'Петрова А.А.',
        createdAt: new Date().toISOString(),
        comment: 'Подготовлен пакет уведомлений',
      },
      {
        id: 'h-4',
        stage: 'NEGOTIATION',
        user: 'Петрова А.А.',
        createdAt: new Date().toISOString(),
        comment: 'Начаты переговоры с залогодателем',
      },
    ],
    documents: [],
    notes: 'Нужно согласовать скидку и рассрочку',
  },
];

export const DEFAULT_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Уведомление о намерении реализовать залог',
    type: 'notification',
    description: 'Базовое уведомление о старте внесудебной реализации',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-2',
    name: 'Претензионное письмо',
    type: 'claim',
    description: 'Претензия с указанием задолженности и сроков',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-3',
    name: 'Соглашение об отступном',
    type: 'agreement',
    description: 'Шаблон соглашения об отступном',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-4',
    name: 'Договор купли-продажи залогового имущества',
    type: 'sale-contract',
    description: 'Шаблон ДКП для внесудебной реализации',
    updatedAt: new Date().toISOString(),
  },
];

const initialState: WorkflowState = {
  cases: sampleCases,
  kpi: null,
  templates: DEFAULT_WORKFLOW_TEMPLATES,
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setCases: (state, action: PayloadAction<WorkflowCase[]>) => {
      state.cases = action.payload;
    },
    addCase: (state, action: PayloadAction<WorkflowCase>) => {
      state.cases.push(action.payload);
    },
    updateCaseStage: (
      state,
      action: PayloadAction<{ id: string; stage: WorkflowStage; comment?: string; user?: string }>
    ) => {
      const item = state.cases.find(c => c.id === action.payload.id);
      if (!item) return;
      item.stage = action.payload.stage;
      item.updatedAt = new Date().toISOString();
      item.history = [
        {
          id: `h-${Date.now()}`,
          stage: action.payload.stage,
          user: action.payload.user || 'Система',
          comment: action.payload.comment,
          createdAt: item.updatedAt,
        },
        ...item.history,
      ];
    },
    setKpi: (state, action: PayloadAction<WorkflowKPI | null>) => {
      state.kpi = action.payload;
    },
    setTemplates: (state, action: PayloadAction<WorkflowTemplate[]>) => {
      state.templates = action.payload;
    },
    updateTemplate: (state, action: PayloadAction<WorkflowTemplate>) => {
      const idx = state.templates.findIndex(t => t.id === action.payload.id);
      if (idx >= 0) state.templates[idx] = action.payload;
    },
  },
});

export const { setCases, addCase, updateCaseStage, setKpi, setTemplates, updateTemplate } =
  workflowSlice.actions;
export default workflowSlice.reducer;
