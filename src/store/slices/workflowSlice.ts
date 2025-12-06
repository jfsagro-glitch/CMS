import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  WorkflowCase,
  WorkflowStage,
  WorkflowKPI,
  WorkflowTemplate,
  DebtorSegment,
  CollectionStep,
  CommunicationScript,
  RestructuringRule,
} from '@/types/workflow';

export interface WorkflowState {
  cases: WorkflowCase[];
  kpi: WorkflowKPI | null;
  templates: WorkflowTemplate[];
  segments: DebtorSegment[];
  steps: CollectionStep[];
  scripts: CommunicationScript[];
  restructuringRules: RestructuringRule[];
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
  segments: [
    {
      id: 'seg-1',
      name: 'Малый долг, короткая просрочка',
      description: 'Сумма долга до 300 тыс., просрочка до 10 дней',
      minDebt: 0,
      maxDebt: 300_000,
      minDaysOverdue: 1,
      maxDaysOverdue: 10,
      debtorTypes: ['individual', 'sole_trader'],
      strategySummary: 'Мягкая коммуникация, напоминания, акцент на сохранении отношений.',
    },
    {
      id: 'seg-2',
      name: 'Средний долг, средняя просрочка',
      description: '300 тыс.–5 млн, просрочка 11–30 дней',
      minDebt: 300_000,
      maxDebt: 5_000_000,
      minDaysOverdue: 11,
      maxDaysOverdue: 30,
      debtorTypes: ['individual', 'sole_trader', 'legal'],
      strategySummary:
        'Комбинация напоминаний и претензионной работы, проработка реструктуризации.',
    },
    {
      id: 'seg-3',
      name: 'Крупный долг / длительная просрочка',
      description: 'Более 5 млн или просрочка свыше 30 дней',
      minDebt: 5_000_000,
      debtorTypes: ['individual', 'sole_trader', 'legal'],
      strategySummary:
        'Усиленная претензионная работа, подключение юристов, обсуждение отступного/реализации залога.',
    },
  ],
  steps: [
    {
      id: 'step-1',
      name: 'Автоматическое напоминание',
      dayFrom: 0,
      dayTo: 3,
      channel: 'sms',
      owner: 'system',
      description: 'Авто-SMS/email напоминание о необходимости оплаты, без давления.',
    },
    {
      id: 'step-2',
      name: 'Первичный звонок менеджера',
      dayFrom: 5,
      dayTo: 9,
      channel: 'call',
      owner: 'manager',
      description: 'Вежливый звонок, выяснение причины, фиксация договорённостей.',
    },
    {
      id: 'step-3',
      name: 'Официальная претензия',
      dayFrom: 10,
      dayTo: 19,
      channel: 'email',
      owner: 'manager',
      description: 'Претензия по email/почте с указанием срока для добровольного урегулирования.',
    },
    {
      id: 'step-4',
      name: 'Звонок старшего менеджера',
      dayFrom: 20,
      dayTo: 29,
      channel: 'call',
      owner: 'senior_manager',
      description: 'Углублённое обсуждение вариантов реструктуризации, фиксация предложения Банка.',
    },
    {
      id: 'step-5',
      name: 'Эскалация и подготовка к суду',
      dayFrom: 30,
      dayTo: 999,
      channel: 'legal',
      owner: 'legal',
      description:
        'Окончательная претензия, подготовка пакета документов для передачи юристам/коллекторам.',
    },
  ],
  scripts: [
    {
      id: 'scr-1',
      name: 'Вежливое напоминание (дни 0–3)',
      segmentIds: ['seg-1', 'seg-2'],
      stepIds: ['step-1'],
      summary:
        'Короткое напоминание без давления: уточнение, всё ли в порядке, предложение помощи по оплате.',
    },
    {
      id: 'scr-2',
      name: 'Звонок менеджера (день 5+)',
      segmentIds: ['seg-1', 'seg-2', 'seg-3'],
      stepIds: ['step-2'],
      summary:
        'Скрипт звонка с выяснением причин просрочки, фиксацией даты оплаты и отказом от угроз.',
    },
    {
      id: 'scr-3',
      name: 'Официальная претензия',
      segmentIds: ['seg-2', 'seg-3'],
      stepIds: ['step-3'],
      summary:
        'Структура претензионного письма без нарушения закона о коллекторах (без давления на личность).',
    },
  ],
  restructuringRules: [
    {
      id: 'rr-1',
      name: 'Рассрочка до 6 месяцев',
      description:
        'Деление долга на равные ежемесячные платежи до 6 месяцев, без списания основного долга.',
      allowedForSegments: ['seg-1', 'seg-2'],
      managerLimitPercent: 10,
    },
    {
      id: 'rr-2',
      name: 'Отсрочка + увеличение срока',
      description:
        'Отсрочка погашения основного долга на 1–3 месяца с сохранением процентов и увеличением срока кредита.',
      allowedForSegments: ['seg-2'],
      managerLimitPercent: 15,
    },
    {
      id: 'rr-3',
      name: 'Скидка за быстрый расчёт',
      description:
        'Разовая скидка при полном погашении долга в короткий срок (до 10 рабочих дней).',
      allowedForSegments: ['seg-2', 'seg-3'],
      managerLimitPercent: 20,
    },
  ],
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
    addTemplate: (state, action: PayloadAction<WorkflowTemplate>) => {
      state.templates.push(action.payload);
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
    updateCaseDocuments: (
      state,
      action: PayloadAction<{ id: string; documents: WorkflowCase['documents'] }>
    ) => {
      const item = state.cases.find(c => c.id === action.payload.id);
      if (!item) return;
      item.documents = action.payload.documents;
      item.updatedAt = new Date().toISOString();
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
    updateCaseSegment: (
      state,
      action: PayloadAction<{ id: string; segmentId: string | undefined }>
    ) => {
      const item = state.cases.find(c => c.id === action.payload.id);
      if (!item) return;
      item.segmentId = action.payload.segmentId;
      item.updatedAt = new Date().toISOString();
    },
  },
});

export const {
  setCases,
  addCase,
  addTemplate,
  updateCaseStage,
  updateCaseDocuments,
  setKpi,
  setTemplates,
  updateTemplate,
  updateCaseSegment,
} = workflowSlice.actions;
export default workflowSlice.reducer;
