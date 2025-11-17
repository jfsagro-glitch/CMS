import type { TimelineEvent } from '@/types/timeline';
import type { CollateralPortfolioEntry } from '@/types/portfolio';

/**
 * Получение хронологии событий по сделке
 */
export function getDealTimeline(deal: CollateralPortfolioEntry): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const reference = String(deal.reference ?? deal.contractNumber ?? '');

  // 1. Получены документы от клиента (дата открытия сделки)
  if (deal.openDate) {
    events.push({
      id: `doc-${reference}`,
      date: deal.openDate,
      type: 'documents_received',
      title: 'Получен пакет документов от клиента',
      description: `Сделка открыта: ${deal.openDate}`,
      responsible: deal.borrower || deal.pledger || undefined,
    });
  }

  // 2. Задачи из Задачника
  const zadachnikTasks = getZadachnikTasks(reference);
  zadachnikTasks.forEach(task => {
    // Создание задачи
    if (task.createdAt) {
      events.push({
        id: `task-created-${task.id}`,
        date: task.createdAt.split('T')[0],
        time: task.createdAt.split('T')[1]?.split('.')[0],
        type: 'task_created',
        title: `Создана задача: ${task.title}`,
        description: `Тип: ${task.type || 'Не указан'}`,
        responsible: task.businessUserName || undefined,
        metadata: { taskId: task.id },
      });
    }

    // Распределение задачи
    if (task.assignedTo && task.assignedTo.length > 0 && task.assignedAt) {
      events.push({
        id: `task-assigned-${task.id}`,
        date: task.assignedAt.split('T')[0],
        time: task.assignedAt.split('T')[1]?.split('.')[0],
        type: 'task_assigned',
        title: `Задача распределена: ${task.title}`,
        description: `Исполнитель: ${task.currentAssigneeName || task.assignedTo[0]}`,
        responsible: task.currentAssigneeName || undefined,
        metadata: { taskId: task.id },
      });
    }

    // Задача в работе
    if (task.status === 'in-progress' && task.statusHistory) {
      const inProgressHistory = task.statusHistory.find((h: any) => h.status === 'in-progress');
      if (inProgressHistory) {
        events.push({
          id: `task-in-progress-${task.id}`,
          date: inProgressHistory.date.split('T')[0],
          time: inProgressHistory.date.split('T')[1]?.split('.')[0],
          type: 'task_in_progress',
          title: `Задача взята в работу: ${task.title}`,
          description: `Исполнитель: ${task.currentAssigneeName || 'Не указан'}`,
          responsible: task.currentAssigneeName || undefined,
          metadata: { taskId: task.id },
        });
      }
    }

    // Согласование задачи
    if (task.status === 'approved' && task.statusHistory) {
      const approvedHistory = task.statusHistory.find((h: any) => h.status === 'approved');
      if (approvedHistory) {
        events.push({
          id: `task-approved-${task.id}`,
          date: approvedHistory.date.split('T')[0],
          time: approvedHistory.date.split('T')[1]?.split('.')[0],
          type: 'task_approved',
          title: `Задача согласована: ${task.title}`,
          description: `Согласовал: ${approvedHistory.userName || 'Не указан'}`,
          responsible: approvedHistory.userName || undefined,
          metadata: { taskId: task.id },
        });
      }
    }
  });

  // 3. Подписание договора
  if (deal.contractDate) {
    events.push({
      id: `contract-signed-${reference}`,
      date: deal.contractDate,
      type: 'contract_signed',
      title: 'Договор заключен и подписан',
      description: `Номер договора: ${deal.contractNumber || 'Не указан'}`,
      responsible: deal.owner || undefined,
    });
  }

  // 4. Регистрация договора залога
  if (deal.registrationDate) {
    events.push({
      id: `contract-registered-${reference}`,
      date: deal.registrationDate,
      type: 'contract_registered',
      title: 'Договор залога зарегистрирован',
      description: `Номер договора залога: ${deal.collateralContractNumber || 'Не указан'}`,
      responsible: deal.owner || undefined,
    });
  }

  // 5. Поставлен на внебаланс (если есть дата закрытия и счет 9131)
  if (deal.closeDate && deal.account9131) {
    events.push({
      id: `off-balance-${reference}`,
      date: deal.closeDate,
      type: 'off_balance',
      title: 'Поставлен на внебаланс',
      description: `Счет 9131: ${deal.account9131}`,
      responsible: deal.owner || undefined,
    });
  }

  // 6. Страхование (проверяем данные из Insurance)
  const insuranceData = getInsuranceData(reference);
  if (insuranceData && insuranceData.startDate) {
    events.push({
      id: `insurance-${reference}`,
      date: insuranceData.startDate,
      type: 'insurance_issued',
      title: 'Залог застрахован',
      description: `Полис: ${insuranceData.policyNumber || 'Не указан'}, Страховая компания: ${insuranceData.insuranceCompany || 'Не указана'}`,
      responsible: insuranceData.insurer || undefined,
      metadata: { policyNumber: insuranceData.policyNumber },
    });
  }

  // 7. Мониторинг
  if (deal.lastMonitoringDate) {
    events.push({
      id: `monitoring-${reference}`,
      date: deal.lastMonitoringDate,
      type: 'monitoring',
      title: 'Проведен мониторинг',
      description: `Вид мониторинга: ${deal.monitoringType || 'Не указан'}`,
      responsible: deal.owner || undefined,
    });
  }

  // Сортируем по дате (от старых к новым)
  return events.sort((a, b) => {
    const dateA = new Date(a.date + (a.time ? `T${a.time}` : '')).getTime();
    const dateB = new Date(b.date + (b.time ? `T${b.time}` : '')).getTime();
    return dateA - dateB;
  });
}

/**
 * Получение задач из Задачника по REFERENCE сделки
 */
function getZadachnikTasks(reference: string): any[] {
  try {
    const tasksData = localStorage.getItem('zadachnik_tasks');
    if (!tasksData) return [];

    const tasks = JSON.parse(tasksData);
    // Ищем задачи, которые связаны с этой сделкой по REFERENCE в названии или описании
    return tasks.filter((task: any) => {
      const refStr = String(reference).toLowerCase();
      const title = String(task.title || '').toLowerCase();
      const description = String(task.description || '').toLowerCase();
      return title.includes(refStr) || description.includes(refStr);
    });
  } catch (error) {
    console.error('Ошибка получения задач из Задачника:', error);
    return [];
  }
}

/**
 * Получение данных страхования по REFERENCE сделки
 */
function getInsuranceData(reference: string): any | null {
  try {
    // Пытаемся получить данные из загруженных данных Insurance
    // Проверяем, есть ли данные в sessionStorage или localStorage
    const insuranceDataStr = sessionStorage.getItem('insurance_data') || localStorage.getItem('insurance_data');
    if (insuranceDataStr) {
      const insuranceData = JSON.parse(insuranceDataStr);
      // Ищем полис по REFERENCE сделки
      const policy = Array.isArray(insuranceData)
        ? insuranceData.find((p: any) => String(p.reference) === String(reference))
        : null;
      return policy || null;
    }
    return null;
  } catch (error) {
    console.error('Ошибка получения данных страхования:', error);
    return null;
  }
}

