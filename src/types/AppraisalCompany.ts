export interface AppraisalCompany {
  id: string;
  name: string; // Наименование компании
  inn?: string; // ИНН
  ogrn?: string; // ОГРН
  address?: string; // Адрес
  phone?: string; // Телефон
  email?: string; // Email
  director?: string; // Руководитель
  licenseNumber?: string; // Номер лицензии
  licenseDate?: string; // Дата выдачи лицензии
  licenseExpiryDate?: string; // Дата окончания лицензии
  status?: 'active' | 'suspended' | 'revoked'; // Статус аккредитации
  accreditationDate?: string; // Дата аккредитации
  notes?: string; // Примечания
  documents?: string[]; // Список ID документов
  createdAt: string;
  updatedAt: string;
}

