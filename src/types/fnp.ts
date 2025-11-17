/**
 * Типы для сервиса регистрации залога движимого имущества ФНП
 * (Федеральная нотариальная палата)
 */

export interface FNPRegistration {
  id: string;
  registrationNumber?: string; // Номер регистрации в реестре ФНП
  registrationDate?: string; // Дата регистрации (YYYY-MM-DD)
  status: 'draft' | 'submitted' | 'registered' | 'rejected' | 'cancelled';
  statusText: string; // Текст статуса для отображения

  // Связь с портфелем
  reference?: string; // REFERENCE сделки из портфеля
  contractNumber?: string; // Номер договора залога

  // Залогодатель
  pledgerName: string; // Наименование залогодателя
  pledgerInn?: string; // ИНН залогодателя
  pledgerOgrn?: string; // ОГРН залогодателя
  pledgerAddress?: string; // Адрес залогодателя
  pledgerType: 'individual' | 'legal'; // Тип залогодателя (физ.лицо / юр.лицо)

  // Заемщик
  borrowerName?: string; // Наименование заемщика
  borrowerInn?: string; // ИНН заемщика

  // Предмет залога (движимое имущество)
  collateralType: string; // Тип движимого имущества
  collateralName: string; // Наименование предмета залога
  collateralDescription?: string; // Описание предмета залога

  // Для транспортных средств
  vehicleBrand?: string; // Марка ТС
  vehicleModel?: string; // Модель ТС
  vehicleYear?: number; // Год выпуска
  vehicleVin?: string; // VIN номер
  vehicleRegistrationNumber?: string; // Гос. номер
  vehicleBodyNumber?: string; // Номер кузова
  vehicleChassisNumber?: string; // Номер шасси
  vehicleFrameNumber?: string; // Номер рамы

  // Для оборудования и техники
  equipmentName?: string; // Наименование оборудования
  equipmentManufacturer?: string; // Производитель
  equipmentModel?: string; // Модель
  equipmentSerialNumber?: string; // Серийный номер
  equipmentInventoryNumber?: string; // Инвентарный номер
  equipmentYear?: number; // Год выпуска

  // Для товаров в обороте
  goodsDescription?: string; // Описание товаров
  goodsQuantity?: number; // Количество
  goodsUnit?: string; // Единица измерения

  // Оценка
  marketValue?: number; // Рыночная стоимость
  collateralValue?: number; // Залоговая стоимость

  // Договор залога
  pledgeContractNumber?: string; // Номер договора залога
  pledgeContractDate?: string; // Дата договора залога (YYYY-MM-DD)
  pledgeAmount?: number; // Сумма обязательства, обеспеченного залогом

  // Нотариус
  notaryName?: string; // ФИО нотариуса
  notaryRegion?: string; // Регион нотариуса
  notaryOffice?: string; // Нотариальная контора

  // Документы
  documents?: FNPDocument[]; // Список документов

  // Комментарии и примечания
  comments?: string; // Комментарии
  rejectionReason?: string; // Причина отклонения (если статус rejected)

  // Метаданные
  createdAt: string; // Дата создания (ISO)
  updatedAt: string; // Дата обновления (ISO)
  createdBy?: string; // Создал
  updatedBy?: string; // Обновил
}

export interface FNPDocument {
  id: string;
  name: string; // Название документа
  type: string; // Тип документа
  fileUrl?: string; // URL файла
  uploadDate?: string; // Дата загрузки
  description?: string; // Описание
}

export interface FNPNotification {
  id: string;
  registrationId: string; // ID регистрации
  notificationType: 'registration' | 'rejection' | 'cancellation' | 'update';
  notificationDate: string; // Дата уведомления (ISO)
  notificationText: string; // Текст уведомления
  read: boolean; // Прочитано
}

