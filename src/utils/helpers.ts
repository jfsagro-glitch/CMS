// Генерация уникального ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Форматирование даты
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Форматирование даты без времени
export const formatDateOnly = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Скачивание файла
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Перевод категорий
export const translateCategory = (category: string): string => {
  const translations: Record<string, string> = {
    'real_estate': 'Недвижимость',
    'movable': 'Движимое имущество',
    'property_rights': 'Имущественные права'
  };
  return translations[category] || category;
};

// Перевод статусов
export const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    'editing': 'Редактирование',
    'approved': 'Утвержден'
  };
  return translations[status] || status;
};

// Задержка
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

