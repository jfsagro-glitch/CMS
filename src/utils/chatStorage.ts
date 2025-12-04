/**
 * Утилита для хранения и управления чатами
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: any[];
  rating?: 'like' | 'dislike';
  context?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'reference_chats';

/**
 * Сохраняет чаты в localStorage с автоматической очисткой при переполнении
 */
function saveChats(chats: Chat[]): void {
  try {
    const data = chats.map(chat => ({
      ...chat,
      messages: chat.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    }));
    
    let dataString = JSON.stringify(data);
    
    // Если данные слишком большие, удаляем старые чаты
    if (dataString.length > 4 * 1024 * 1024) { // 4MB лимит
      // Сортируем по дате обновления и оставляем только последние 50 чатов
      const sortedChats = [...chats].sort((a, b) => 
        b.updatedAt.getTime() - a.updatedAt.getTime()
      );
      const limitedChats = sortedChats.slice(0, 50);
      
      const limitedData = limitedChats.map(chat => ({
        ...chat,
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
      }));
      dataString = JSON.stringify(limitedData);
      
      console.warn('localStorage переполнен, удалены старые чаты. Оставлено:', limitedChats.length);
    }
    
    localStorage.setItem(STORAGE_KEY, dataString);
  } catch (error: any) {
    // Если все еще ошибка QuotaExceededError, удаляем самые старые чаты
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      try {
        // Оставляем только последние 20 чатов
        const sortedChats = [...chats].sort((a, b) => 
          b.updatedAt.getTime() - a.updatedAt.getTime()
        );
        const limitedChats = sortedChats.slice(0, 20);
        
        const limitedData = limitedChats.map(chat => ({
          ...chat,
          messages: chat.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })),
          createdAt: chat.createdAt.toISOString(),
          updatedAt: chat.updatedAt.toISOString(),
        }));
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedData));
        console.warn('localStorage переполнен, удалены старые чаты. Оставлено:', limitedChats.length);
      } catch (retryError) {
        console.error('Критическая ошибка сохранения чатов, очищаем все:', retryError);
        // В крайнем случае очищаем все
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      console.error('Ошибка сохранения чатов:', error);
    }
  }
}

/**
 * Загружает чаты из localStorage
 */
function loadChats(): Chat[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const data = JSON.parse(stored);
    return data.map((chat: any) => ({
      ...chat,
      messages: chat.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt),
    }));
  } catch (error) {
    console.error('Ошибка загрузки чатов:', error);
    return [];
  }
}

/**
 * Генерирует уникальный ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Создает новый чат
 */
export function createChat(title?: string): Chat {
  const chat: Chat = {
    id: generateId(),
    title: title || `Чат ${new Date().toLocaleString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const chats = loadChats();
  chats.unshift(chat); // Добавляем в начало
  saveChats(chats);
  
  return chat;
}

/**
 * Получает все чаты
 */
export function getAllChats(): Chat[] {
  return loadChats().sort((a, b) => 
    b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

/**
 * Получает чат по ID
 */
export function getChatById(id: string): Chat | null {
  const chats = loadChats();
  return chats.find(chat => chat.id === id) || null;
}

/**
 * Обновляет чат
 */
export function updateChat(chatId: string, updates: Partial<Chat>): void {
  const chats = loadChats();
  const index = chats.findIndex(chat => chat.id === chatId);
  
  if (index >= 0) {
    chats[index] = {
      ...chats[index],
      ...updates,
      updatedAt: new Date(),
    };
    saveChats(chats);
  }
}

/**
 * Добавляет сообщение в чат
 */
export function addMessageToChat(chatId: string, message: ChatMessage): void {
  const chats = loadChats();
  const chat = chats.find(c => c.id === chatId);
  
  if (chat) {
    chat.messages.push(message);
    chat.updatedAt = new Date();
    
    // Автоматически обновляем название чата на основе первого вопроса пользователя
    if (chat.messages.length === 1 && message.role === 'user') {
      const firstQuestion = message.content.substring(0, 50);
      chat.title = firstQuestion.length < message.content.length 
        ? `${firstQuestion}...` 
        : firstQuestion;
    }
    
    saveChats(chats);
  }
}

/**
 * Удаляет чат
 */
export function deleteChat(chatId: string): void {
  const chats = loadChats();
  const filtered = chats.filter(chat => chat.id !== chatId);
  saveChats(filtered);
}

/**
 * Переименовывает чат
 */
export function renameChat(chatId: string, newTitle: string): void {
  updateChat(chatId, { title: newTitle });
}

/**
 * Очищает все чаты
 */
export function clearAllChats(): void {
  localStorage.removeItem(STORAGE_KEY);
}

