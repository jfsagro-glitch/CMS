export interface AppraisalCompany {
  id: string;
  name: string; // Наименование компании
  inn?: string; // ИНН
  ogrn?: string; // ОГРН
  address?: string; // Адрес
  phone?: string; // Телефон
  email?: string; // Email
  website?: string; // Сайт
  director?: string; // Руководитель
  status?: 'active' | 'suspended' | 'revoked'; // Статус аккредитации
  accreditationDate?: string; // Дата аккредитации
  certificateExpiryDate?: string; // Срок действия сертификатов
  insuranceExpiryDate?: string; // Срок действия страхования
  sroMembership?: boolean; // Членство в СРО (да/нет)
  notes?: string; // Примечания
  documents?: string[]; // Список ID документов
  createdAt: string;
  updatedAt: string;
}

