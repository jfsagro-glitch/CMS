import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Avatar,
  Spin,
  Divider,
  Alert,
  Tag,
  Upload,
  message,
  List,
  Badge,
  Modal,
  Collapse,
  Form,
  Select,
  InputNumber,
  Row,
  Col,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  BulbOutlined,
  BookOutlined,
  SearchOutlined,
  FolderOutlined,
  LikeOutlined,
  DislikeOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  PaperClipOutlined,
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoreOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { documentIndexer } from '@/utils/documentIndexer';
import { loadVNDDocuments, loadDocumentManually, reindexAllDocuments } from '@/utils/documentLoader';
import { knowledgeBase, type KnowledgeTopic, type KnowledgeCategory } from '@/utils/knowledgeBase';
import { learningService } from '@/services/LearningService';
import { evolutionService } from '@/services/EvolutionService';
import { deepSeekService } from '@/services/DeepSeekService';
import { feedbackStorage } from '@/utils/feedbackStorage';
import { Progress } from 'antd';
import type { DocumentIndex } from '@/utils/documentIndexer';
import { 
  createChat, 
  getAllChats, 
  getChatById, 
  updateChat, 
  addMessageToChat,
  type Chat,
  type ChatMessage 
} from '@/utils/chatStorage';
import { getAppraisalGroups } from '@/utils/appraisalTaxonomy';
import AppraisalAIService, { type AppraisalEstimate } from '@/services/AppraisalAIService';
import './ReferencePage.css';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: KnowledgeTopic[];
  rating?: 'like' | 'dislike';
  context?: string; // Контекст из базы знаний для сохранения обратной связи
}

// Мемоизированный компонент сообщения для оптимизации рендеринга
interface MessageItemProps {
  message: Message;
  onRating: (messageId: string, rating: 'like' | 'dislike') => void;
  onTopicClick: (topic: KnowledgeTopic) => void;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({ message, onRating, onTopicClick }) => {
  // Мемоизируем форматирование времени
  const timeString = useMemo(() => {
    return message.timestamp.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [message.timestamp]);

  return (
    <div
      className={`reference-page__message reference-page__message--${message.role}`}
    >
      <div className="reference-page__message-content">
        <Avatar
          icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
          style={{
            backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a',
            marginRight: 12,
          }}
        />
        <div className="reference-page__message-text">
          <div className="reference-page__message-header">
            <Text strong>
              {message.role === 'user' ? 'Вы' : 'ИИ Помощник'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
              {timeString}
            </Text>
          </div>
          <Paragraph
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </Paragraph>
          {message.sources && message.sources.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Источники:
              </Text>
              <div style={{ marginTop: 4 }}>
                {message.sources.map((topic) => (
                  <Tag
                    key={`${topic.id || topic.title}-${topic.page}`}
                    style={{ marginTop: 4, cursor: 'pointer' }}
                    onClick={() => onTopicClick(topic)}
                  >
                    {topic.title} (стр. {topic.page})
                  </Tag>
                ))}
              </div>
            </div>
          )}
          {message.role === 'assistant' && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={<LikeOutlined />}
                  onClick={() => onRating(message.id, 'like')}
                  style={{
                    color: message.rating === 'like' ? '#52c41a' : undefined,
                  }}
                >
                  Полезно
                </Button>
                <Button
                  type="text"
                  size="small"
                  icon={<DislikeOutlined />}
                  onClick={() => onRating(message.id, 'dislike')}
                  style={{
                    color: message.rating === 'dislike' ? '#ff4d4f' : undefined,
                  }}
                >
                  Не полезно
                </Button>
              </Space>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

const ReferencePage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexedDocuments, setIndexedDocuments] = useState<DocumentIndex[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeTopic[]>([]);
  const [learningIndex, setLearningIndex] = useState<number>(0);
  const [evolutionLevel, setEvolutionLevel] = useState<number>(1);
  const [evolutionProgress, setEvolutionProgress] = useState<{ current: number; required: number; percentage: number } | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [appraisalSkill, setAppraisalSkill] = useState(0);
  const appraisalGroups = useMemo(() => getAppraisalGroups(), []);
  const [appraisalMode, setAppraisalMode] = useState(false);
  const [appraisalEstimate, setAppraisalEstimate] = useState<AppraisalEstimate | null>(null);
  const [appraisalLoading, setAppraisalLoading] = useState(false);
  const [appraisalForm] = Form.useForm();
  const handleToggleAppraisalMode = useCallback(() => {
    setAppraisalMode((prev) => {
      if (prev) {
        setAppraisalEstimate(null);
      }
      return !prev;
    });
  }, []);
  const buildAppraisalContext = useCallback(() => {
    const values = appraisalForm.getFieldsValue();
    if (!values || !values.assetGroup || !values.assetType) return '';

    const parts: string[] = [];
    const groupMeta = appraisalGroups.find(group => group.key === values.assetGroup);
    const typeMeta = groupMeta?.types.find(type => type.key === values.assetType);
    parts.push(`Категория: ${groupMeta?.label || values.assetGroup}`);
    parts.push(`Тип актива: ${typeMeta?.label || values.assetType}`);
    if (values.location) parts.push(`Локация: ${values.location}`);
    if (values.area) parts.push(`Площадь/объем: ${values.area}${values.areaUnit || ' м²'}`);
    if (values.condition) parts.push(`Состояние: ${values.condition}`);
    if (values.incomePerYear) parts.push(`Чистый доход: ${values.incomePerYear} ₽/год`);
    if (values.purpose) parts.push(`Цель: ${values.purpose}`);
    if (values.additionalFactors) parts.push(`Особенности: ${values.additionalFactors}`);

    return parts.join('\n');
  }, [appraisalForm, appraisalGroups]);
  // Загружаем состояние сворачивания из localStorage
  const [chatsVisible, setChatsVisible] = useState(() => {
    const saved = localStorage.getItem('reference_chats_visible');
    return saved !== null ? saved === 'true' : true;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);

  // Сохраняем состояние сворачивания в localStorage
  useEffect(() => {
    localStorage.setItem('reference_chats_visible', String(chatsVisible));
  }, [chatsVisible]);

  // Логотип робота (AI Assistant) - размер зависит от уровня опыта
  // Базовый размер: 32px, максимальный: 80px
  // Размер увеличивается с каждым уровнем: 32 + (уровень - 1) * 6
  const robotSize = Math.min(32 + (evolutionLevel - 1) * 6, 80);
  
  const RobotIcon = ({ size = robotSize }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        display: 'inline-block', 
        verticalAlign: 'middle', 
        marginRight: '8px',
        transition: 'width 0.5s ease-in-out, height 0.5s ease-in-out',
      }}
      className="robot-icon"
    >
      {/* Голова робота */}
      <rect
        x="156"
        y="120"
        width="200"
        height="180"
        rx="20"
        fill="#1890ff"
        stroke="#0050b3"
        strokeWidth="8"
      />
      {/* Экран/лицо */}
      <rect
        x="176"
        y="160"
        width="160"
        height="100"
        rx="10"
        fill="#e6f7ff"
        stroke="#40a9ff"
        strokeWidth="4"
      />
      {/* Глаза */}
      <circle cx="216" cy="200" r="12" fill="#1890ff" />
      <circle cx="296" cy="200" r="12" fill="#1890ff" />
      <circle cx="216" cy="200" r="6" fill="#fff" />
      <circle cx="296" cy="200" r="6" fill="#fff" />
      {/* Рот/индикатор */}
      <rect
        x="236"
        y="240"
        width="40"
        height="8"
        rx="4"
        fill="#1890ff"
      />
      {/* Антенна */}
      <circle cx="256" cy="100" r="8" fill="#ff4d4f" />
      <line
        x1="256"
        y1="100"
        x2="256"
        y2="120"
        stroke="#1890ff"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Тело робота */}
      <rect
        x="176"
        y="300"
        width="160"
        height="120"
        rx="15"
        fill="#1890ff"
        stroke="#0050b3"
        strokeWidth="8"
      />
      {/* Панель управления */}
      <rect
        x="196"
        y="320"
        width="120"
        height="60"
        rx="8"
        fill="#e6f7ff"
        stroke="#40a9ff"
        strokeWidth="3"
      />
      {/* Кнопки */}
      <circle cx="226" cy="350" r="6" fill="#52c41a" />
      <circle cx="256" cy="350" r="6" fill="#faad14" />
      <circle cx="286" cy="350" r="6" fill="#ff4d4f" />
      {/* Руки */}
      <rect
        x="116"
        y="320"
        width="40"
        height="80"
        rx="20"
        fill="#1890ff"
        stroke="#0050b3"
        strokeWidth="6"
      />
      <rect
        x="356"
        y="320"
        width="40"
        height="80"
        rx="20"
        fill="#1890ff"
        stroke="#0050b3"
        strokeWidth="6"
      />
      {/* Кисти */}
      <circle cx="136" cy="420" r="12" fill="#1890ff" stroke="#0050b3" strokeWidth="4" />
      <circle cx="376" cy="420" r="12" fill="#1890ff" stroke="#0050b3" strokeWidth="4" />
      {/* Ноги */}
      <rect
        x="196"
        y="420"
        width="50"
        height="60"
        rx="10"
        fill="#1890ff"
        stroke="#0050b3"
        strokeWidth="6"
      />
      <rect
        x="266"
        y="420"
        width="50"
        height="60"
        rx="10"
        fill="#1890ff"
        stroke="#0050b3"
        strokeWidth="6"
      />
      {/* Ступни */}
      <ellipse cx="221" cy="490" rx="20" ry="8" fill="#0050b3" />
      <ellipse cx="291" cy="490" rx="20" ry="8" fill="#0050b3" />
      {/* Декоративные элементы - линии на теле */}
      <line x1="196" y1="340" x2="316" y2="340" stroke="#40a9ff" strokeWidth="2" opacity="0.5" />
      <line x1="196" y1="360" x2="316" y2="360" stroke="#40a9ff" strokeWidth="2" opacity="0.5" />
    </svg>
  );

  // Загрузка документов и построение базы знаний при монтировании (оптимизировано)
  useEffect(() => {
    let isMounted = true;
    
    const loadDocuments = async () => {
      setIndexing(true);
      try {
        // Инициализируем систему самообучения и эволюции (синхронно, быстро)
        learningService.initialize();
        evolutionService.initialize();
        
        // Загружаем индексы из IndexedDB (асинхронно)
        await documentIndexer.loadFromStorage();
        await knowledgeBase.loadFromStorage();
        
        // Загружаем категории из базы знаний (быстро)
        const loadedCategories = knowledgeBase.getCategories();
        if (isMounted) {
          setCategories(loadedCategories);
        }
        
        // Обновляем статистику сразу (быстро)
        const stats = learningService.getLearningStats();
        const evolutionStats = evolutionService.getEvolutionStats();
        const progress = evolutionService.getProgressToNextLevel();
        
        if (isMounted && evolutionStats) {
          setEvolutionLevel(evolutionStats.level);
          setEvolutionProgress(progress);
        }
        
        // Вычисляем индекс самообучаемости
        if (isMounted) {
          const patternsWeight = Math.min(stats.patternsCount * 5, 30);
          const successWeight = stats.averageSuccessRate * 25;
          const usageWeight = Math.min(stats.totalUsage / 10, 15);
          const insightsWeight = Math.min(stats.insightsCount * 2, 10);
          const evolutionBonus = evolutionStats ? Math.min(evolutionStats.level * 2, 20) : 0;
          setLearningIndex(Math.round(patternsWeight + successWeight + usageWeight + insightsWeight + evolutionBonus));
          setAppraisalSkill(learningService.getCategorySkill('appraisal'));
        }
        
        // Загружаем документы из VND асинхронно (не блокируя UI)
        const loadDocumentsAsync = async () => {
          try {
            console.log('🔄 Загружаю документы из VND...');
            const documents = await loadVNDDocuments(false);
            
            if (!isMounted) return;
            
            setIndexedDocuments(documents);
            console.log(`✅ Загружено документов: ${documents.length}`);
            
            // Если категории пустые, но есть документы, перестраиваем базу знаний
            if (loadedCategories.length === 0 && documents.length > 0) {
              console.log('Категории пустые, перестраиваю базу знаний...');
              await knowledgeBase.buildFromDocuments();
              if (isMounted) {
                const rebuiltCategories = knowledgeBase.getCategories();
                setCategories(rebuiltCategories);
              }
            }
            
            // Анализируем документы для самообучения (асинхронно, не блокируя)
            if (documents.length > 0) {
              setTimeout(() => {
                if (!isMounted) return;
                console.log('🧠 Анализирую документы для обучения модели...');
                learningService.analyzeDocuments();
                evolutionService.addExperienceFromDocuments();
                console.log('✅ Анализ документов завершен');
              }, 100);
            }
            
            if (documents.length > 0 && isMounted) {
              message.success(`Загружено документов: ${documents.length}. База знаний готова к использованию.`);
            }
          } catch (error) {
            if (isMounted) {
              if (import.meta.env.MODE === 'development') {
                console.error('Ошибка загрузки документов:', error);
              }
              message.warning('Не удалось загрузить документы из VND. Вы можете загрузить их вручную.');
            }
          } finally {
            if (isMounted) {
              setIndexing(false);
            }
          }
        };
        
        // Запускаем асинхронную загрузку документов
        loadDocumentsAsync();
        
        // Анализируем обратную связь асинхронно (не блокируя UI)
        setTimeout(() => {
          if (!isMounted) return;
          learningService.analyzeFeedback();
          evolutionService.updateExperienceFromCurrentData();
        }, 50);
        
      } catch (error) {
        if (isMounted) {
          if (import.meta.env.MODE === 'development') {
            console.error('Ошибка инициализации:', error);
          }
          setIndexing(false);
        }
      }
    };

    loadDocuments();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!appraisalMode) return;
    const currentValues = appraisalForm.getFieldsValue();
    if (!currentValues.assetGroup && appraisalGroups.length > 0) {
      const firstGroup = appraisalGroups.find(group => group.types.length > 0) || appraisalGroups[0];
      appraisalForm.setFieldsValue({
        assetGroup: firstGroup?.key,
        assetType: firstGroup?.types[0]?.key,
      });
    }
  }, [appraisalMode, appraisalGroups, appraisalForm]);

  // Загрузка чатов при монтировании
  useEffect(() => {
    const loadedChats = getAllChats();
    setChats(loadedChats);
  }, []);

  // Загрузка сообщений чата при смене текущего чата
  useEffect(() => {
    if (currentChatId) {
      const chat = getChatById(currentChatId);
      if (chat) {
        setMessages(chat.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
        })));
      }
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  // Сохранение сообщений в чат
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      const chat = getChatById(currentChatId);
      if (chat) {
        // Обновляем чат с текущими сообщениями
        updateChat(currentChatId, { messages: messages as ChatMessage[] });
        // Обновляем список чатов
        setChats(getAllChats());
      }
    }
  }, [messages, currentChatId]);

  // Оптимизированный скролл (только при добавлении новых сообщений)
  const scrollToBottom = useCallback(() => {
    // Находим контейнер сообщений
    const messagesContainer = document.querySelector('.reference-page__messages') as HTMLElement;
    if (messagesContainer) {
      // Используем scrollTo для более надежного скроллинга
      requestAnimationFrame(() => {
        messagesContainer.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
    
    // Также прокручиваем к элементу messagesEndRef, если он существует
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      });
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      // Добавляем небольшую задержку для гарантии, что DOM обновлен
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages.length, scrollToBottom]);

  // Поиск по базе знаний с debounce (оптимизировано)
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    
    if (trimmedQuery.length <= 2) {
      setSearchResults([]);
      return;
    }

    // Увеличиваем debounce для лучшей производительности
    const timeoutId = setTimeout(() => {
      try {
        // Ограничиваем количество результатов для производительности
        const results = knowledgeBase.search(trimmedQuery, 10);
        setSearchResults(results);
      } catch (error) {
        if (import.meta.env.MODE === 'development') {
          console.error('Ошибка поиска:', error);
        }
        setSearchResults([]);
      }
    }, 400); // Debounce 400ms для лучшей производительности

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Мемоизируем список названий категорий
  const categoryNames = useMemo(() => {
    return categories.map(c => c.name).join(', ');
  }, [categories]);

  // Генерация ответа с использованием DeepSeek AI (мемоизировано)
  // chatHistory - история сообщений для контекста
  const generateAIResponse = useCallback(async (userMessage: string, chatHistory: Message[] = [], extraContext?: string): Promise<{ content: string; sources: KnowledgeTopic[]; context: string }> => {
    const lowerMessage = userMessage.toLowerCase();

    // Поиск по базе знаний для контекста
    const topics = knowledgeBase.search(userMessage, 5);
    
    let response = '';
    let sources: KnowledgeTopic[] = [];

    // Формируем контекст из найденных тем
    let knowledgeContext = '';
    if (topics.length > 0) {
      const contextParts: string[] = [];
      for (const topic of topics) {
        contextParts.push(`Тема: ${topic.title}\nСодержание: ${topic.content}\nСтраница: ${topic.page}`);
      }
      knowledgeContext = contextParts.join('\n\n---\n\n');
      sources = topics;
    }
    if (extraContext) {
      knowledgeContext = `${knowledgeContext || ''}\n\n[Дополнительный контекст задания]\n${extraContext}`;
    }

    try {
      // Используем DeepSeek AI для генерации ответа с учетом истории чата
      if (chatHistory.length > 0) {
        // Если есть история чата, используем метод chat() с полной историей для сохранения контекста
        const chatMessages = chatHistory.slice(-10).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));
        
        // Добавляем текущий вопрос пользователя
        chatMessages.push({
          role: 'user',
          content: userMessage,
        });
        
        // Формируем контекст из базы знаний для системного промпта
        const systemContext = knowledgeContext || `База знаний содержит информацию о банковских залогах, ипотеке, оценке имущества, LTV, договорах залога, нормативных требованиях и регистрации залогов. Доступные категории: ${categoryNames}.`;
        
        // Используем метод chat() с полной историей для сохранения контекста
        response = await deepSeekService.chat(chatMessages, systemContext);
        
        // Добавляем пассивный опыт за использование модели (асинхронно, не блокируя)
        setTimeout(() => {
          evolutionService.addPassiveExperience(userMessage, response.length);
        }, 0);
      } else if (knowledgeContext) {
        // Если нет истории, но есть контекст из базы знаний, используем его
        response = await deepSeekService.generateResponse(userMessage, knowledgeContext);
        
        // Добавляем пассивный опыт за использование модели (асинхронно, не блокируя)
        setTimeout(() => {
          evolutionService.addPassiveExperience(userMessage, response.length);
        }, 0);
      } else {
        // Если контекста нет, используем общий запрос
        if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй')) {
          response = await deepSeekService.chat([
            { 
              role: 'user', 
              content: 'Поприветствуй пользователя и расскажи, что ты эксперт по банковским залогам и можешь помочь с вопросами об ипотеке, оценке, LTV, договорах залога и других аспектах залогового кредитования. База знаний основана на справочной литературе "Залоговik. Все о банковских залогах".' 
            }
          ]);
          knowledgeContext = 'Приветствие';
        } else {
          const fallbackContext = `База знаний содержит информацию о банковских залогах, ипотеке, оценке имущества, LTV, договорах залога, нормативных требованиях и регистрации залогов. Доступные категории: ${categoryNames}.`;
          response = await deepSeekService.generateResponse(userMessage, fallbackContext);
          knowledgeContext = fallbackContext;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (import.meta.env.MODE === 'development') {
        console.error('Ошибка запроса к DeepSeek API:', error);
      }
      
      // Проверяем, не связана ли ошибка с API ключом или сетью
      if (errorMessage.includes('API ключ') || errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error('Проблема с доступом к AI сервису. Проверьте настройки API.');
      }
      
      // Fallback на локальную генерацию ответа
      if (topics.length > 0) {
        response = `На основе справочной литературы по банковским залогам:\n\n`;
        
        const byCategory = new Map<string, KnowledgeTopic[]>();
        for (const topic of topics) {
          if (!byCategory.has(topic.category)) {
            byCategory.set(topic.category, []);
          }
          byCategory.get(topic.category)!.push(topic);
        }

        for (const [categoryId, categoryTopics] of byCategory.entries()) {
          const categoryName = categories.find(c => c.id === categoryId)?.name || categoryId;
          response += `**${categoryName}**\n\n`;
          
          for (const topic of categoryTopics.slice(0, 2)) {
            response += `*${topic.title}*\n\n${topic.content.slice(0, 300)}...\n\n`;
          }
        }
        knowledgeContext = knowledgeContext || 'Локальная генерация';
      } else {
        response = `Извините, произошла ошибка при обращении к ИИ. Попробуйте переформулировать вопрос или использовать поиск по категориям.`;
        knowledgeContext = 'Ошибка';
      }
    }

    return { content: response, sources, context: knowledgeContext };
  }, [categoryNames, categories]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || loading) return;

    // Создаем новый чат, если его нет
    let chatId = currentChatId;
    if (!chatId) {
      const newChat = createChat();
      chatId = newChat.id;
      setCurrentChatId(chatId);
      setChats(getAllChats());
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // Добавляем сообщение в чат
    if (chatId) {
      addMessageToChat(chatId, userMessage as ChatMessage);
    }

    setMessages(prev => [...prev, userMessage]);
    const question = inputValue.trim();
    setInputValue('');
    setLoading(true);

    // Генерация ответа с использованием DeepSeek AI (передаем полную историю чата)
    try {
      // Получаем полную историю чата из хранилища
      const chat = chatId ? getChatById(chatId) : null;
      const chatHistory = chat ? chat.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
      })) : messages;
      
      const appraisalExtra = appraisalMode ? buildAppraisalContext() : '';
      const { content, sources, context } = await generateAIResponse(
        question,
        chatHistory,
        appraisalExtra || undefined
      );
      
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        sources: sources.length > 0 ? sources : undefined,
        context, // Сохраняем контекст для обратной связи
      };

      // Добавляем ответ в чат
      if (chatId) {
        addMessageToChat(chatId, aiResponse as ChatMessage);
        setChats(getAllChats()); // Обновляем список чатов
      }

      setMessages(prev => [...prev, aiResponse]);
      
      // Автоматическая прокрутка после добавления ответа
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Всегда логируем ошибки для отладки
      console.error('Ошибка генерации ответа:', error);
      console.error('Детали ошибки:', {
        message: errorMessage,
        question: question,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Более информативное сообщение об ошибке
      let errorContent = 'Извините, произошла ошибка при генерации ответа. ';
      
      if (errorMessage.includes('API ключ') || errorMessage.includes('401') || errorMessage.includes('403')) {
        errorContent += 'Проблема с доступом к AI сервису. Проверьте настройки API ключа.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
        errorContent += 'Проблема с подключением к интернету. Проверьте соединение и попробуйте еще раз.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('время ожидания')) {
        errorContent += 'Превышено время ожидания ответа (30 секунд). Попробуйте еще раз или упростите вопрос.';
      } else if (errorMessage.includes('429') || errorMessage.includes('лимит')) {
        errorContent += 'Превышен лимит запросов к API. Подождите немного и попробуйте позже.';
      } else if (errorMessage.includes('CORS')) {
        errorContent += 'Ошибка CORS. Проблема с настройками сервера.';
      } else {
        errorContent += `Попробуйте еще раз или переформулируйте вопрос. (Ошибка: ${errorMessage.substring(0, 100)})`;
      }
      
      // Показываем сообщение пользователю
      message.error('Не удалось получить ответ от AI помощника. Проверьте консоль браузера для деталей.');
      
      const errorResponse: Message = {
        id: `ai-error-${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, generateAIResponse, currentChatId, messages, scrollToBottom, appraisalMode, buildAppraisalContext]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Обработка оценки ответа (оптимизировано - один проход по массиву)
  const handleRating = useCallback((messageId: string, rating: 'like' | 'dislike') => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const msg = messages[messageIndex];
    if (!msg || msg.role !== 'assistant') return;

    // Находим вопрос пользователя, на который был дан этот ответ
    const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
    const question = userMessage?.content || '';

    try {
      // Сохраняем обратную связь
      feedbackStorage.saveFeedback({
        messageId,
        question,
        answer: msg.content,
        rating,
        timestamp: new Date(),
        context: msg.context,
      });

      // Обновляем оценку в сообщении
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, rating } : m
        )
      );

      // Анализируем обратную связь для самообучения
      learningService.analyzeFeedback();
      
      // Добавляем опыт в систему эволюции
      const category = msg.context?.toLowerCase().includes('ltv') ? 'ltv_calculation' :
                      msg.context?.toLowerCase().includes('оценк') ? 'appraisal' :
                      msg.context?.toLowerCase().includes('риск') ? 'risks' : 'general';
      evolutionService.addExperienceFromFeedback(rating, category, question);
      
      // Сбрасываем кэш обратной связи в DeepSeekService
      deepSeekService.invalidateFeedbackCache();

      // Обновляем индекс самообучаемости и эволюцию
      const stats = learningService.getLearningStats();
      const evolutionStats = evolutionService.getEvolutionStats();
      const currentLevel = evolutionService.getCurrentLevel();
      const progress = evolutionService.getProgressToNextLevel();
      
      if (evolutionStats) {
        setEvolutionLevel(evolutionStats.level);
        setEvolutionProgress(progress);
      }
      
      const calculateLearningIndex = () => {
        const patternsWeight = Math.min(stats.patternsCount * 5, 30);
        const successWeight = stats.averageSuccessRate * 25;
        const usageWeight = Math.min(stats.totalUsage / 10, 15);
        const insightsWeight = Math.min(stats.insightsCount * 2, 10);
        const evolutionBonus = evolutionStats ? Math.min(evolutionStats.level * 2, 20) : 0;
        return Math.round(patternsWeight + successWeight + usageWeight + insightsWeight + evolutionBonus);
      };
      setLearningIndex(calculateLearningIndex());
      setAppraisalSkill(learningService.getCategorySkill('appraisal'));
      
      // Проверяем, произошла ли эволюция
      if (currentLevel && evolutionStats && evolutionStats.level > 1) {
        const levelData = evolutionService.getCurrentLevel();
        if (levelData) {
          message.success(`🎉 Модель достигла уровня: ${levelData.name}! Опыт: ${evolutionStats.totalExperience}`);
        }
      }

      if (rating === 'like') {
        message.success('Спасибо за оценку! Модель обучилась на вашем примере.');
      } else {
        message.success('Спасибо за обратную связь. Модель проанализирует и улучшит ответы.');
      }
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('Ошибка сохранения обратной связи:', error);
      }
      message.error('Не удалось сохранить оценку');
    }
  }, [messages]);

  const handleFileUpload = useCallback(async (file: File) => {
    const fileName = file.name.toLowerCase();
    const supportedFormats = ['.pdf', '.docx', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const isSupported = supportedFormats.some(format => fileName.endsWith(format));
    
    if (!isSupported) {
      message.error('Поддерживаются только файлы: PDF, DOCX, XLSX, XLS, JPG, JPEG, PNG, GIF, BMP, WEBP');
      return false;
    }

    // Проверяем размер файла (максимум 50MB для документов, 10MB для изображений)
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].some(ext => fileName.endsWith(ext));
    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    
    if (file.size > maxSize) {
      message.error(`Размер файла не должен превышать ${isImage ? '10MB' : '50MB'}`);
      return false;
    }

    setIndexing(true);
    try {
      let index;
      
      if (isImage) {
        // Для изображений индексируем и анализируем через AI
        message.info('Анализирую изображение через ИИ...');
        index = await documentIndexer.indexDocument(file);
        
        // Анализируем изображение через AI для создания описания
        if (index.chunks.length > 0 && index.chunks[0].imageData) {
          try {
            const imageDescription = await deepSeekService.analyzeImage(
              index.chunks[0].imageData,
              file.name
            );
            
            // Обновляем текст чанка с описанием от AI
            index.chunks[0].text = `[Изображение: ${file.name}]\n\nОписание от ИИ:\n${imageDescription}`;
            
            // Обновляем ключевые слова на основе описания
            const descriptionKeywords = documentIndexer.extractKeywordsPublic(imageDescription);
            index.chunks[0].keywords = [
              ...new Set([...index.chunks[0].keywords, ...descriptionKeywords])
            ];
            
            // Сохраняем обновленный индекс
            documentIndexer.updateDocumentIndex(index);
            
            message.success('Изображение проанализировано ИИ');
          } catch (aiError) {
            if (import.meta.env.MODE === 'development') {
              console.error('Ошибка анализа изображения через AI:', aiError);
            }
            message.warning('Изображение загружено, но не удалось проанализировать через ИИ');
          }
        }
      } else {
        // Для документов используем стандартную индексацию
        index = await loadDocumentManually(file);
      }
      
      setIndexedDocuments(prev => {
        // Проверяем, не был ли документ уже проиндексирован
        const exists = prev.some(doc => doc.documentName === index.documentName);
        return exists ? prev : [...prev, index];
      });
      
      // Обновляем категории после индексации
      const updatedCategories = knowledgeBase.getCategories();
      // Категории обновлены
      setCategories(updatedCategories);
      
      // Если категории все еще пустые, перестраиваем базу знаний
      if (updatedCategories.length === 0) {
        await knowledgeBase.buildFromDocuments();
        const rebuiltCategories = knowledgeBase.getCategories();
        setCategories(rebuiltCategories);
      }
      
      message.success(`${isImage ? 'Изображение' : 'Документ'} "${file.name}" успешно ${isImage ? 'проанализирован' : 'проиндексирован'}. База знаний обновлена.`);
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('Ошибка индексации:', error);
      }
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error(`Не удалось ${isImage ? 'проанализировать изображение' : 'проиндексировать документ'}: ${errorMessage}`);
    } finally {
      setIndexing(false);
    }

    return false;
  }, []);

  const handleGenerateAppraisalEstimate = useCallback(async () => {
    try {
      const values = await appraisalForm.validateFields();
      setAppraisalLoading(true);
      const groupMeta = appraisalGroups.find(group => group.key === values.assetGroup);
      const typeMeta = groupMeta?.types.find(type => type.key === values.assetType);

      const estimate = await AppraisalAIService.generateEstimate({
        objectName: values.objectName || typeMeta?.label || groupMeta?.label || 'Объект оценки',
        assetGroup: values.assetGroup,
        assetType: values.assetType,
        location: values.location,
        area: values.area ? Number(values.area) : undefined,
        areaUnit: values.areaUnit,
        condition: values.condition,
        incomePerYear: values.incomePerYear ? Number(values.incomePerYear) : undefined,
        occupancy: values.occupancy,
        purpose: values.purpose,
        additionalFactors: values.additionalFactors,
        card: null,
      });

      setAppraisalEstimate(estimate);
      setAppraisalSkill(learningService.getCategorySkill('appraisal'));
      message.success('AI помощник подготовил оценку объекта');
    } catch (error: any) {
      if (error && error.errorFields) {
        return;
      }
      console.error('Ошибка запроса оценки ИИ:', error);
      message.error('Не удалось получить оценку. Проверьте заполненные данные.');
    } finally {
      setAppraisalLoading(false);
    }
  }, [appraisalForm, appraisalGroups]);

  // Обработчик принудительной переиндексации всех документов
  const handleReindexAll = useCallback(async () => {
    setIndexing(true);
    try {
      message.info('Начинаю переиндексацию всех документов...');
      const documents = await reindexAllDocuments();
      setIndexedDocuments(documents);
      
      // Обновляем категории
      const updatedCategories = knowledgeBase.getCategories();
      setCategories(updatedCategories);
      
      // Обновляем данные для самообучения
      // Обновляем данные для самообучения
      learningService.forceUpdate();
      
      // Обновляем опыт на основе документов
      evolutionService.addExperienceFromDocuments();
      
      // Обновляем индекс самообучаемости и эволюцию
      const stats = learningService.getLearningStats();
      const evolutionStats = evolutionService.getEvolutionStats();
      const progress = evolutionService.getProgressToNextLevel();
      
      if (evolutionStats) {
        setEvolutionLevel(evolutionStats.level);
        setEvolutionProgress(progress);
      }
      
      const calculateLearningIndex = () => {
        const patternsWeight = Math.min(stats.patternsCount * 5, 30);
        const successWeight = stats.averageSuccessRate * 25;
        const usageWeight = Math.min(stats.totalUsage / 10, 15);
        const insightsWeight = Math.min(stats.insightsCount * 2, 10);
        const evolutionBonus = evolutionStats ? Math.min(evolutionStats.level * 2, 20) : 0;
        return Math.round(patternsWeight + successWeight + usageWeight + insightsWeight + evolutionBonus);
      };
      setLearningIndex(calculateLearningIndex());
      
      message.success(`Переиндексация завершена. Обработано документов: ${documents.length}. Категорий: ${updatedCategories.length}. Данные для самообучения обновлены.`);
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('Ошибка переиндексации:', error);
      }
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error(`Ошибка переиндексации: ${errorMessage}`);
    } finally {
      setIndexing(false);
    }
  }, []);

  const handleTopicClick = useCallback((topic: KnowledgeTopic) => {
    setInputValue(topic.title);
    // Используем requestAnimationFrame для более плавного обновления
    requestAnimationFrame(() => {
      // Небольшая задержка для обновления состояния inputValue
      setTimeout(() => {
        const question = topic.title;
        if (!question.trim() || loading) return;

        const userMessage: Message = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: question.trim(),
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);

        generateAIResponse(question.trim(), [], appraisalMode ? buildAppraisalContext() || undefined : undefined)
          .then(({ content, sources, context }) => {
            const aiResponse: Message = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content,
              timestamp: new Date(),
              sources: sources.length > 0 ? sources : undefined,
              context,
            };
            setMessages(prev => [...prev, aiResponse]);
          })
          .catch((error) => {
            if (import.meta.env.MODE === 'development') {
          console.error('Ошибка генерации ответа:', error);
        }
            const errorResponse: Message = {
              id: `ai-error-${Date.now()}`,
              role: 'assistant',
              content: 'Извините, произошла ошибка при генерации ответа. Попробуйте еще раз или переформулируйте вопрос.',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorResponse]);
          })
          .finally(() => {
            setLoading(false);
          });
      }, 50);
    });
  }, [loading, generateAIResponse, appraisalMode, buildAppraisalContext]);

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
  }, []);


  // Мемоизируем популярные вопросы
  const quickQuestions = useMemo(() => [
    { 
      icon: <CalculatorOutlined />, 
      text: 'Расчет LTV и залоговая стоимость', 
      query: 'Как правильно рассчитать LTV (loan-to-value) для залогового имущества? Какие факторы влияют на залоговую стоимость?' 
    },
    { 
      icon: <FileTextOutlined />, 
      text: 'Оценка залогового имущества', 
      query: 'Какие требования к независимой оценке залогового имущества? Как выбрать оценщика и проверить отчет об оценке?' 
    },
    { 
      icon: <BulbOutlined />, 
      text: 'Анализ рисков залога', 
      query: 'Какие основные риски при принятии имущества в залог? Как оценить и минимизировать риски по залоговому обеспечению?' 
    },
    { 
      icon: <QuestionCircleOutlined />, 
      text: 'Регистрация обременения в Росреестре', 
      query: 'Как зарегистрировать обременение в Росреестре? Какие документы необходимы для регистрации залога недвижимости?' 
    },
    { 
      icon: <FileTextOutlined />, 
      text: 'Визуальный осмотр залогового имущества', 
      query: 'Как провести визуальный осмотр залогового имущества? На что обратить внимание при проверке наличия и состояния залога?' 
    },
    { 
      icon: <BulbOutlined />, 
      text: 'Обращение взыскания на залог', 
      query: 'В каких случаях можно обратить взыскание на залоговое имущество? Каков порядок реализации залога?' 
    },
  ], []);

  const handleQuickQuestion = useCallback((query: string) => {
    if (!query.trim() || loading) return;

    // Создаем новый чат, если его нет
    let chatId = currentChatId;
    if (!chatId) {
      const newChat = createChat();
      chatId = newChat.id;
      setCurrentChatId(chatId);
      setChats(getAllChats());
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    // Добавляем сообщение в чат
    if (chatId) {
      addMessageToChat(chatId, userMessage as ChatMessage);
    }

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    // Получаем полную историю чата из хранилища
    const chat = chatId ? getChatById(chatId) : null;
    const chatHistory = chat ? chat.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
    })) : messages;

    generateAIResponse(
      query.trim(),
      chatHistory,
      appraisalMode ? buildAppraisalContext() || undefined : undefined
    )
      .then(({ content, sources, context }) => {
        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content,
          timestamp: new Date(),
          sources: sources.length > 0 ? sources : undefined,
          context,
        };

        // Добавляем ответ в чат
        if (chatId) {
          addMessageToChat(chatId, aiResponse as ChatMessage);
          setChats(getAllChats());
        }

        setMessages(prev => [...prev, aiResponse]);
        
        // Автоматическая прокрутка после добавления ответа
        setTimeout(() => {
          scrollToBottom();
        }, 150);
      })
      .catch((error) => {
        if (import.meta.env.MODE === 'development') {
          console.error('Ошибка генерации ответа:', error);
        }
        const errorResponse: Message = {
          id: `ai-error-${Date.now()}`,
          role: 'assistant',
          content: 'Извините, произошла ошибка при генерации ответа. Попробуйте еще раз или переформулируйте вопрос.',
          timestamp: new Date(),
        };

        // Добавляем ошибку в чат
        if (chatId) {
          addMessageToChat(chatId, errorResponse as ChatMessage);
          setChats(getAllChats());
        }

        setMessages(prev => [...prev, errorResponse]);
        
        // Автоматическая прокрутка после добавления ошибки
        setTimeout(() => {
          scrollToBottom();
        }, 150);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loading, generateAIResponse, currentChatId, messages, scrollToBottom, appraisalMode, buildAppraisalContext]);

  // Группировка чатов по датам
  const groupedChats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const groups: { [key: string]: Chat[] } = {
      today: [],
      yesterday: [],
      week: [],
      month: [],
    };

    chats.forEach(chat => {
      const updatedAt = new Date(chat.updatedAt);
      updatedAt.setHours(0, 0, 0, 0);

      if (updatedAt.getTime() === today.getTime()) {
        groups.today.push(chat);
      } else if (updatedAt.getTime() === yesterday.getTime()) {
        groups.yesterday.push(chat);
      } else if (updatedAt >= weekAgo) {
        groups.week.push(chat);
      } else if (updatedAt >= monthAgo) {
        groups.month.push(chat);
      }
    });

    return groups;
  }, [chats]);

  // Обработчик создания нового чата (мемоизировано)
  const handleCreateNewChat = useCallback(() => {
    const newChat = createChat();
    setCurrentChatId(newChat.id);
    setChats(getAllChats());
    setMessages([]);
    message.success('Создан новый чат');
  }, []);

  // Обработчик выбора чата (мемоизировано)
  const handleChatSelect = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  return (
    <div className="reference-page">
      {/* Боковая панель чатов */}
      <div className={`reference-page__sidebar ${chatsVisible ? 'reference-page__sidebar--visible' : ''}`}>
        <div className="reference-page__sidebar-header">
          <Space>
            <RobotIcon size={24} />
            <Text strong style={{ color: '#fff', fontSize: '16px' }}>Чаты</Text>
          </Space>
          <Button
            type="text"
            icon={chatsVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={() => setChatsVisible(!chatsVisible)}
            style={{ color: '#fff' }}
            title={chatsVisible ? 'Свернуть панель чатов' : 'Развернуть панель чатов'}
          />
        </div>

        {chatsVisible && (
          <>
            <div className="reference-page__sidebar-content">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateNewChat}
                block
                style={{ marginBottom: 16 }}
              >
                Новый чат
              </Button>

              <div className="reference-page__chats-list">
                {groupedChats.today.length > 0 && (
                  <div className="reference-page__chats-group">
                    <Text type="secondary" style={{ fontSize: 12, color: '#8c8c8c', padding: '8px 16px', display: 'block' }}>
                      Сегодня
                    </Text>
                    {groupedChats.today.map(chat => (
                      <div
                        key={chat.id}
                        className={`reference-page__chat-item ${currentChatId === chat.id ? 'reference-page__chat-item--active' : ''}`}
                        onClick={() => handleChatSelect(chat.id)}
                      >
                        <Text ellipsis style={{ flex: 1, color: '#fff' }}>
                          {chat.title}
                        </Text>
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Показываем меню действий
                          }}
                          style={{ color: '#8c8c8c' }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {groupedChats.yesterday.length > 0 && (
                  <div className="reference-page__chats-group">
                    <Text type="secondary" style={{ fontSize: 12, color: '#8c8c8c', padding: '8px 16px', display: 'block' }}>
                      Вчера
                    </Text>
                    {groupedChats.yesterday.map(chat => (
                      <div
                        key={chat.id}
                        className={`reference-page__chat-item ${currentChatId === chat.id ? 'reference-page__chat-item--active' : ''}`}
                        onClick={() => handleChatSelect(chat.id)}
                      >
                        <Text ellipsis style={{ flex: 1, color: '#fff' }}>
                          {chat.title}
                        </Text>
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          size="small"
                          style={{ color: '#8c8c8c' }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {groupedChats.week.length > 0 && (
                  <div className="reference-page__chats-group">
                    <Text type="secondary" style={{ fontSize: 12, color: '#8c8c8c', padding: '8px 16px', display: 'block' }}>
                      7 дней
                    </Text>
                    {groupedChats.week.map(chat => (
                      <div
                        key={chat.id}
                        className={`reference-page__chat-item ${currentChatId === chat.id ? 'reference-page__chat-item--active' : ''}`}
                        onClick={() => handleChatSelect(chat.id)}
                      >
                        <Text ellipsis style={{ flex: 1, color: '#fff' }}>
                          {chat.title}
                        </Text>
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          size="small"
                          style={{ color: '#8c8c8c' }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {groupedChats.month.length > 0 && (
                  <div className="reference-page__chats-group">
                    <Text type="secondary" style={{ fontSize: 12, color: '#8c8c8c', padding: '8px 16px', display: 'block' }}>
                      30 дней
                    </Text>
                    {groupedChats.month.map(chat => (
                      <div
                        key={chat.id}
                        className={`reference-page__chat-item ${currentChatId === chat.id ? 'reference-page__chat-item--active' : ''}`}
                        onClick={() => handleChatSelect(chat.id)}
                      >
                        <Text ellipsis style={{ flex: 1, color: '#fff' }}>
                          {chat.title}
                        </Text>
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          size="small"
                          style={{ color: '#8c8c8c' }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {chats.length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center' }}>
                    <Text type="secondary" style={{ color: '#8c8c8c' }}>
                      Нет сохраненных чатов
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {appraisalMode && (
        <Card size="small" className="reference-page__appraisal-panel">
          <Form layout="vertical" form={appraisalForm}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space size="middle" wrap>
                <Form.Item
                  label="Категория"
                  name="assetGroup"
                  rules={[{ required: true, message: 'Выберите категорию' }]}
                >
                  <Select
                    style={{ minWidth: 220 }}
                    options={appraisalGroups.map(group => ({
                      value: group.key,
                      label: group.label,
                    }))}
                    onChange={() => appraisalForm.setFieldsValue({ assetType: undefined })}
                  />
                </Form.Item>
                <Form.Item
                  label="Тип актива"
                  name="assetType"
                  dependencies={['assetGroup']}
                  rules={[{ required: true, message: 'Выберите тип актива' }]}
                >
                  <Select
                    style={{ minWidth: 260 }}
                    placeholder="Выберите тип"
                    options={appraisalGroups
                      .find(group => group.key === appraisalForm.getFieldValue('assetGroup'))?.types.map(type => ({
                        value: type.key,
                        label: type.label,
                      })) || []}
                  />
                </Form.Item>
                <Form.Item label="Наименование" name="objectName">
                  <Input placeholder="Например, складской комплекс на МКАД" />
                </Form.Item>
              </Space>
              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Form.Item label="Локация" name="location">
                    <Input placeholder="Регион, город, адрес" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Площадь / объем" name="area">
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="Например, 1500" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Единица измерения" name="areaUnit" initialValue="м²">
                    <Input placeholder="м², га, шт." />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Form.Item label="Состояние" name="condition">
                    <Input placeholder="Например, хорошее, требуется ремонт" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Чистый доход (₽/год)" name="incomePerYear">
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Заполняемость / загрузка" name="occupancy">
                    <Input placeholder="Например, 90% арендаторов" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item label="Цель оценки" name="purpose">
                    <Input placeholder="Например, взыскание, кредитование" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Особенности / комментарии" name="additionalFactors">
                    <Input placeholder="Земля в аренде, есть обременения..." />
                  </Form.Item>
                </Col>
              </Row>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text type="secondary">
                  После заполнения полей AI помощник выполнит экспресс-оценку и учтёт данные в самообучении.
                </Text>
                <Button
                  type="primary"
                  icon={<CalculatorOutlined />}
                  loading={appraisalLoading}
                  onClick={handleGenerateAppraisalEstimate}
                >
                  Получить оценку ИИ
                </Button>
              </Space>
              {appraisalEstimate && (
                <Alert
                  type="success"
                  showIcon
                  message={`Рыночная стоимость: ${appraisalEstimate.marketValue.toLocaleString('ru-RU')} ₽ · Залоговая: ${appraisalEstimate.collateralValue.toLocaleString('ru-RU')} ₽`}
                  description={
                    <div>
                      <Text strong>Методология:</Text> {appraisalEstimate.methodology}
                      <br />
                      <Text strong>Ключевые риски:</Text> {appraisalEstimate.riskFactors.join('; ') || 'не выявлены'}
                      <br />
                      <Text strong>Рекомендации:</Text> {appraisalEstimate.recommendedActions.join('; ') || '—'}
                    </div>
                  }
                />
              )}
            </Space>
          </Form>
        </Card>
      )}

      {/* Основной контент */}
      <div className={`reference-page__main-content ${chatsVisible ? 'reference-page__main-content--with-sidebar' : ''}`}>
      <div className="reference-page__header">
        <div className="reference-page__header-left">
          <RobotIcon size={robotSize} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Space align="center" style={{ marginBottom: 4 }} size="small">
              <Title level={2} style={{ margin: 0, fontSize: '22px', lineHeight: '1.2' }}>
                Справочная с ИИ
              </Title>
              <Tag
                color={learningIndex >= 70 ? 'success' : learningIndex >= 40 ? 'processing' : 'default'}
                icon={<ThunderboltOutlined />}
                style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontWeight: 600,
                  height: 'auto',
                  lineHeight: '1.5',
                }}
              >
                Индекс самообучаемости: {learningIndex}%
              </Tag>
            </Space>
            {evolutionProgress && (
              <div style={{ marginBottom: 4, maxWidth: 500 }}>
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Space size="small">
                    <Text strong style={{ fontSize: '12px' }}>
                      Уровень: {evolutionService.getCurrentLevel()?.name || 'Новичок'} ({evolutionLevel})
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      Опыт: {evolutionService.getEvolutionStats()?.totalExperience || 0}
                    </Text>
                  </Space>
                  <Progress
                    percent={evolutionProgress.percentage}
                    status={evolutionProgress.percentage >= 90 ? 'active' : 'normal'}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    format={() => `${evolutionProgress.current}/${evolutionProgress.required} опыта`}
                    size="small"
                    style={{ marginTop: 2 }}
                    showInfo={false}
                  />
                </Space>
              </div>
            )}
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                База знаний на основе справочной литературы по банковским залогам
              </Text>
              <Space align="center" wrap size="small">
                <Tag
                  color={appraisalSkill >= 70 ? 'success' : appraisalSkill >= 40 ? 'processing' : 'default'}
                  icon={<CalculatorOutlined />}
                  style={{ margin: 0 }}
                >
                  Скилл оценки: {appraisalSkill}%
                </Tag>
                <Button
                  size="small"
                  type={appraisalMode ? 'primary' : 'default'}
                  icon={<CalculatorOutlined />}
                  onClick={handleToggleAppraisalMode}
                >
                  Режим оценки
                </Button>
              </Space>
            </Space>
          </div>
        </div>
        <div className="reference-page__header-right">
          {indexedDocuments.length > 0 && (
            <Tag icon={<BookOutlined />} color="blue" style={{ margin: 0, padding: '4px 12px' }}>
              Документов: {indexedDocuments.length}
            </Tag>
          )}
          <Button 
            icon={<HistoryOutlined />} 
            onClick={() => setChatsVisible(!chatsVisible)}
            size="middle"
            type={chatsVisible ? 'primary' : 'default'}
            style={{ marginRight: 8 }}
            title={chatsVisible ? 'Скрыть историю чатов' : 'Показать историю чатов'}
          >
            Чаты {chats.length > 0 && <Badge count={chats.length} size="small" style={{ marginLeft: 4 }} />}
          </Button>
          <Button 
            icon={<SettingOutlined />} 
            onClick={() => setSettingsVisible(true)}
            size="middle"
          >
            Настройки
          </Button>
        </div>
      </div>

      {indexing && (
        <Alert
          message="Индексация документов и построение базы знаний..."
          description="Пожалуйста, подождите, идет обработка документов"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card className="reference-page__card">
            <div className="reference-page__chat">
              <div className="reference-page__messages">
                {messages.length === 0 ? (
                  <div className="reference-page__empty">
                    <div className="reference-page__welcome">
                      <RobotOutlined style={{ fontSize: 40, color: '#1890ff', marginBottom: 8 }} />
                      <Title level={4} style={{ marginBottom: 4, fontSize: '18px' }}>
                        Справочная с ИИ
                      </Title>
                      <Text type="secondary" style={{ fontSize: 13, marginBottom: 12, display: 'block' }}>
                        Задайте вопрос ниже, и я найду ответ в базе знаний
                      </Text>
                      <Divider style={{ margin: '8px 0' }} />
                      <div className="reference-page__quick-questions">
                        <Collapse
                          ghost
                          items={[
                            {
                              key: '1',
                              label: <Text strong style={{ fontSize: 14 }}>Популярные вопросы</Text>,
                              children: (
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                  {quickQuestions.map((q, index) => (
                                    <Button
                                      key={index}
                                      type="default"
                                      icon={q.icon}
                                      onClick={() => handleQuickQuestion(q.query)}
                                      style={{ 
                                        width: '100%', 
                                        textAlign: 'left', 
                                        height: 'auto', 
                                        padding: '10px 16px',
                                        fontSize: '14px',
                                      }}
                                    >
                                      {q.text}
                                    </Button>
                                  ))}
                                </Space>
                              ),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                        onRating={handleRating}
                        onTopicClick={handleTopicClick}
                      />
                    ))}
                    {loading && (
                      <div className="reference-page__message reference-page__message--assistant">
                        <div className="reference-page__message-content">
                          <Avatar
                            icon={<RobotOutlined />}
                            style={{ backgroundColor: '#52c41a', marginRight: 12 }}
                          />
                          <Spin size="small" />
                          <Text type="secondary" style={{ marginLeft: 12 }}>
                            Ищу информацию в базе знаний...
                          </Text>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
                
                {/* Поле ввода - появляется после сообщений */}
                <div className="reference-page__input-container">
                  <div className="reference-page__input-wrapper">
                    <div style={{ position: 'relative', width: '100%' }}>
                      <TextArea
                        ref={textAreaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={messages.length === 0 ? "Задайте вопрос о залогах, ипотеке, оценке..." : "Задайте уточняющий вопрос..."}
                        autoSize={{ minRows: 3, maxRows: 6 }}
                        disabled={loading || indexing}
                        className="reference-page__main-input"
                        style={{
                          fontSize: '16px',
                          padding: '16px 50px 16px 16px',
                          borderRadius: '12px',
                          border: '2px solid #d9d9d9',
                          transition: 'all 0.3s',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1890ff';
                          e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d9d9d9';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <Upload
                        accept=".pdf,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                        beforeUpload={handleFileUpload}
                        showUploadList={false}
                        disabled={indexing}
                      >
                        <Button
                          type="text"
                          icon={<PaperClipOutlined />}
                          loading={indexing}
                          disabled={indexing}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '8px',
                            zIndex: 1,
                            color: '#8c8c8c',
                            fontSize: '18px',
                            width: '32px',
                            height: '32px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Приложить документ или изображение"
                        />
                      </Upload>
                    </div>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSend}
                      loading={loading}
                      disabled={!inputValue.trim() || indexing}
                      size="large"
                      className="reference-page__send-button"
                      style={{
                        height: 'auto',
                        padding: '12px 24px',
                        fontSize: '16px',
                        marginTop: '12px',
                        borderRadius: '8px',
                      }}
                    >
                      Отправить вопрос
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

        {/* Модальное окно настроек */}
        <Modal
          title={
            <Space>
              <SettingOutlined />
              <span>Настройки</span>
            </Space>
          }
          open={settingsVisible}
          onCancel={() => setSettingsVisible(false)}
          footer={null}
          width={600}
          style={{ top: 20 }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>Поиск по темам</Text>
              <Input
                placeholder="Поиск..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginTop: 8 }}
                allowClear
              />
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div>
              <Space style={{ marginBottom: 8 }}>
                <Text strong>Категории</Text>
                {selectedCategory && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleCategorySelect(null)}
                  >
                    Сбросить
                  </Button>
                )}
              </Space>
              
              <List
                size="small"
                dataSource={categories}
                style={{ maxHeight: 400, overflow: 'auto' }}
                renderItem={(category) => (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedCategory === category.id ? '#e6f7ff' : 'transparent',
                      borderRadius: 4,
                      padding: '8px 12px',
                    }}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <FolderOutlined />
                        <Text>{category.name}</Text>
                      </Space>
                      <Badge count={category.topics.length} showZero style={{ backgroundColor: '#52c41a' }} />
                    </Space>
                  </List.Item>
                )}
              />
            </div>

            {searchResults.length > 0 && !selectedCategory && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text strong>
                    Результаты поиска ({searchResults.length})
                  </Text>
                  <List
                    size="small"
                    dataSource={searchResults.slice(0, 10)}
                    style={{ marginTop: 8, maxHeight: 300, overflow: 'auto' }}
                    renderItem={(topic) => (
                      <List.Item
                        style={{
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: 4,
                        }}
                        onClick={() => {
                          handleTopicClick(topic);
                          setSettingsVisible(false);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Text ellipsis style={{ fontSize: 12 }}>
                          {topic.title}
                        </Text>
                      </List.Item>
                    )}
                  />
                </div>
              </>
            )}

            <Divider style={{ margin: '8px 0' }} />

            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Управление базой знаний
              </Text>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReindexAll}
                loading={indexing}
                title="Переиндексировать все документы из папки VND"
                block
                style={{ marginTop: 8 }}
              >
                Обновить базу знаний
              </Button>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Переиндексирует все документы из папки VND и обновит базу знаний
              </Text>
            </div>
          </Space>
        </Modal>
      </div>
    </div>
  );
};

export default ReferencePage;
