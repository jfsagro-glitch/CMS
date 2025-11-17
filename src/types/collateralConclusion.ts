export interface CollateralConclusion {
  id: string;
  conclusionNumber: string;
  conclusionDate: string;
  reference: string | null; // Связь с портфелем
  contractNumber: string | null; // Номер договора
  pledger: string | null; // Залогодатель
  pledgerInn: string | null; // ИНН залогодателя
  borrower: string | null; // Заемщик
  collateralType: string | null; // Тип залога
  collateralLocation: string | null; // Местоположение
  conclusionType: 'Первичное' | 'Повторное' | 'Дополнительное' | 'Переоценка';
  status: 'Черновик' | 'На согласовании' | 'Согласовано' | 'Отклонено' | 'Аннулировано';
  statusColor?: string;
  author: string; // Автор заключения
  authorDate: string; // Дата создания
  approver?: string | null; // Согласующий
  approvalDate?: string | null; // Дата согласования
  conclusionText: string; // Текст заключения
  recommendations?: string; // Рекомендации
  riskLevel?: 'Низкий' | 'Средний' | 'Высокий' | 'Критический';
  collateralValue?: number | null; // Оценочная стоимость
  marketValue?: number | null; // Рыночная стоимость
  notes?: string; // Примечания
}

