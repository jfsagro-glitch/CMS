export interface TimelineEvent {
  id: string;
  date: string;
  time?: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  status?: string;
  responsible?: string;
  metadata?: Record<string, any>;
}

export type TimelineEventType =
  | 'documents_received'
  | 'task_created'
  | 'task_assigned'
  | 'task_in_progress'
  | 'task_approved'
  | 'contract_signed'
  | 'contract_registered'
  | 'off_balance'
  | 'insurance_issued'
  | 'monitoring'
  | 'other';

export interface TimelineEventTypeConfig {
  label: string;
  icon: string;
  color: string;
}

export const TIMELINE_EVENT_TYPES: Record<TimelineEventType, TimelineEventTypeConfig> = {
  documents_received: {
    label: 'Получены документы',
    icon: '📄',
    color: 'blue',
  },
  task_created: {
    label: 'Создана задача',
    icon: '📋',
    color: 'cyan',
  },
  task_assigned: {
    label: 'Задача распределена',
    icon: '👤',
    color: 'orange',
  },
  task_in_progress: {
    label: 'Задача в работе',
    icon: '⚙️',
    color: 'purple',
  },
  task_approved: {
    label: 'Задача согласована',
    icon: '✅',
    color: 'green',
  },
  contract_signed: {
    label: 'Договор подписан',
    icon: '✍️',
    color: 'green',
  },
  contract_registered: {
    label: 'Договор зарегистрирован',
    icon: '📝',
    color: 'blue',
  },
  off_balance: {
    label: 'Поставлен на внебаланс',
    icon: '📊',
    color: 'geekblue',
  },
  insurance_issued: {
    label: 'Залог застрахован',
    icon: '🛡️',
    color: 'green',
  },
  monitoring: {
    label: 'Мониторинг',
    icon: '🔍',
    color: 'orange',
  },
  other: {
    label: 'Прочее',
    icon: '📌',
    color: 'default',
  },
};

