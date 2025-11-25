import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Layout,
  List,
  Badge,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  BulbOutlined,
  UploadOutlined,
  BookOutlined,
  SearchOutlined,
  FolderOutlined,
  LikeOutlined,
  DislikeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { documentIndexer } from '@/utils/documentIndexer';
import { loadVNDDocuments, loadDocumentManually, reindexAllDocuments } from '@/utils/documentLoader';
import { knowledgeBase, type KnowledgeTopic, type KnowledgeCategory } from '@/utils/knowledgeBase';
import { learningService } from '@/services/LearningService';
import { deepSeekService } from '@/services/DeepSeekService';
import { feedbackStorage } from '@/utils/feedbackStorage';
import type { DocumentIndex } from '@/utils/documentIndexer';
import './ReferencePage.css';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Sider, Content } = Layout;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: KnowledgeTopic[];
  rating?: 'like' | 'dislike';
  context?: string; // Контекст из базы знаний для сохранения обратной связи
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);

  // Загрузка документов и построение базы знаний при монтировании
  useEffect(() => {
    const loadDocuments = async () => {
      setIndexing(true);
      try {
        // Инициализируем систему самообучения
        learningService.initialize();
        
        // Загружаем индексы
        documentIndexer.loadFromStorage();
        knowledgeBase.loadFromStorage();
        
        const documents = await loadVNDDocuments();
        setIndexedDocuments(documents);
        
        // Загружаем категории из базы знаний
        const loadedCategories = knowledgeBase.getCategories();
        console.log('Загружено категорий:', loadedCategories.length);
        setCategories(loadedCategories);
        
        // Если категории пустые, но есть документы, перестраиваем базу знаний
        if (loadedCategories.length === 0 && documents.length > 0) {
          console.log('Категории пустые, перестраиваю базу знаний...');
          await knowledgeBase.buildFromDocuments();
          const rebuiltCategories = knowledgeBase.getCategories();
          console.log('Перестроено категорий:', rebuiltCategories.length);
          setCategories(rebuiltCategories);
        }
        
        // Анализируем документы для самообучения
        if (documents.length > 0) {
          console.log('Анализирую документы для самообучения...');
          learningService.analyzeDocuments();
          console.log('✅ Анализ документов завершен');
        }
        
        // Анализируем обратную связь для самообучения
        console.log('Анализирую обратную связь для самообучения...');
        learningService.analyzeFeedback();
        console.log('✅ Анализ обратной связи завершен');
        
        // Показываем статистику обучения
        const stats = learningService.getLearningStats();
        if (stats.patternsCount > 0) {
          console.log(`📊 Статистика самообучения: ${stats.patternsCount} паттернов, средняя успешность ${(stats.averageSuccessRate * 100).toFixed(1)}%`);
        }
        
        if (documents.length > 0) {
          message.success(`Загружено документов: ${documents.length}. База знаний готова к использованию.`);
        }
      } catch (error) {
        console.error('Ошибка загрузки документов:', error);
        message.warning('Не удалось загрузить документы из VND. Вы можете загрузить их вручную.');
      } finally {
        setIndexing(false);
      }
    };

    loadDocuments();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Поиск по базе знаний с debounce
  useEffect(() => {
    if (searchQuery.trim().length <= 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        const results = knowledgeBase.search(searchQuery, 10);
        setSearchResults(results);
      } catch (error) {
        console.error('Ошибка поиска:', error);
        setSearchResults([]);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Генерация ответа с использованием DeepSeek AI (мемоизировано)
  const generateAIResponse = useCallback(async (userMessage: string): Promise<{ content: string; sources: KnowledgeTopic[]; context: string }> => {
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

    try {
      // Используем DeepSeek AI для генерации ответа
      if (knowledgeContext) {
        // Если есть контекст из базы знаний, используем его
        response = await deepSeekService.generateResponse(userMessage, knowledgeContext);
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
          const fallbackContext = `База знаний содержит информацию о банковских залогах, ипотеке, оценке имущества, LTV, договорах залога, нормативных требованиях и регистрации залогов. Доступные категории: ${categories.map(c => c.name).join(', ')}.`;
          response = await deepSeekService.generateResponse(userMessage, fallbackContext);
          knowledgeContext = fallbackContext;
        }
      }
    } catch (error) {
      console.error('Ошибка запроса к DeepSeek API:', error);
      
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
        response = `Извините, произошла ошибка при обращении к ИИ. Попробуйте переформулировать вопрос или использовать поиск по категориям слева.`;
        knowledgeContext = 'Ошибка';
      }
    }

    return { content: response, sources, context: knowledgeContext };
  }, [categories]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const question = inputValue.trim();
    setInputValue('');
    setLoading(true);

    // Генерация ответа с использованием DeepSeek AI
    try {
      const { content, sources, context } = await generateAIResponse(question);
      
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        sources: sources.length > 0 ? sources : undefined,
        context, // Сохраняем контекст для обратной связи
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Ошибка генерации ответа:', error);
      const errorResponse: Message = {
        id: `ai-error-${Date.now()}`,
        role: 'assistant',
        content: 'Извините, произошла ошибка при генерации ответа. Попробуйте еще раз или переформулируйте вопрос.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, generateAIResponse]);

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
      
      // Сбрасываем кэш обратной связи в DeepSeekService
      deepSeekService.invalidateFeedbackCache();

      if (rating === 'like') {
        message.success('Спасибо за оценку! Модель обучилась на вашем примере.');
      } else {
        message.success('Спасибо за обратную связь. Модель проанализирует и улучшит ответы.');
      }
    } catch (error) {
      console.error('Ошибка сохранения обратной связи:', error);
      message.error('Не удалось сохранить оценку');
    }
  }, [messages]);

  const handleFileUpload = useCallback(async (file: File) => {
    const fileName = file.name.toLowerCase();
    const supportedFormats = ['.pdf', '.docx', '.xlsx', '.xls'];
    const isSupported = supportedFormats.some(format => fileName.endsWith(format));
    
    if (!isSupported) {
      message.error('Поддерживаются только файлы: PDF, DOCX, XLSX');
      return false;
    }

    // Проверяем размер файла (максимум 50MB)
    if (file.size > 50 * 1024 * 1024) {
      message.error('Размер файла не должен превышать 50MB');
      return false;
    }

    setIndexing(true);
    try {
      const index = await loadDocumentManually(file);
      setIndexedDocuments(prev => {
        // Проверяем, не был ли документ уже проиндексирован
        const exists = prev.some(doc => doc.documentName === index.documentName);
        return exists ? prev : [...prev, index];
      });
      
      // Обновляем категории после индексации
      const updatedCategories = knowledgeBase.getCategories();
      console.log('Обновлено категорий после индексации:', updatedCategories.length);
      setCategories(updatedCategories);
      
      // Если категории все еще пустые, перестраиваем базу знаний
      if (updatedCategories.length === 0) {
        console.log('Категории пустые после индексации, перестраиваю базу знаний...');
        await knowledgeBase.buildFromDocuments();
        const rebuiltCategories = knowledgeBase.getCategories();
        console.log('Перестроено категорий:', rebuiltCategories.length);
        setCategories(rebuiltCategories);
      }
      
      message.success(`Документ "${file.name}" успешно проиндексирован. База знаний обновлена.`);
    } catch (error) {
      console.error('Ошибка индексации:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error(`Не удалось проиндексировать документ: ${errorMessage}`);
    } finally {
      setIndexing(false);
    }

    return false;
  }, []);

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
      
      message.success(`Переиндексация завершена. Обработано документов: ${documents.length}. Категорий: ${updatedCategories.length}.`);
    } catch (error) {
      console.error('Ошибка переиндексации:', error);
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

        generateAIResponse(question.trim())
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
            console.error('Ошибка генерации ответа:', error);
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
  }, [loading, generateAIResponse]);

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
  }, []);


  const quickQuestions = [
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
  ];

  const handleQuickQuestion = useCallback((query: string) => {
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    generateAIResponse(query.trim())
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
        console.error('Ошибка генерации ответа:', error);
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
  }, [loading, generateAIResponse]);

  return (
    <div className="reference-page">
      <div className="reference-page__header">
        <Space>
          <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Справочная с ИИ
            </Title>
            <Text type="secondary">
              База знаний на основе справочной литературы по банковским залогам
            </Text>
          </div>
        </Space>
        <Space>
          {indexedDocuments.length > 0 && (
            <Tag icon={<BookOutlined />} color="blue">
              Документов: {indexedDocuments.length}
            </Tag>
          )}
          {categories.length > 0 && (
            <Tag icon={<FolderOutlined />} color="green">
              Тем: {categories.reduce((sum, c) => sum + c.topics.length, 0)}
            </Tag>
          )}
          <Space>
            <Upload
              accept=".pdf,.docx,.xlsx,.xls"
              beforeUpload={handleFileUpload}
              showUploadList={false}
              disabled={indexing}
            >
              <Button icon={<UploadOutlined />} loading={indexing}>
                Загрузить документ (PDF/DOCX/XLSX)
              </Button>
            </Upload>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReindexAll}
              loading={indexing}
              title="Переиндексировать все документы из папки VND"
            >
              Обновить базу
            </Button>
          </Space>
        </Space>
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

      <Layout style={{ background: 'transparent', minHeight: 'calc(100vh - 200px)' }}>
        <Sider
          width={300}
          style={{
            background: '#fff',
            marginRight: 16,
            borderRadius: 8,
            padding: 16,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 200px)',
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
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
                    <Space>
                      <FolderOutlined />
                      <Text>{category.name}</Text>
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
                        onClick={() => handleTopicClick(topic)}
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
          </Space>
        </Sider>

        <Content>
          <Card className="reference-page__card">
            <div className="reference-page__chat">
              {/* Поле ввода - основное, всегда видимое и по центру */}
              <div className="reference-page__input-container">
                <div className="reference-page__input-wrapper">
                  <TextArea
                    ref={textAreaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Задайте вопрос о залогах, ипотеке, оценке..."
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    disabled={loading || indexing}
                    className="reference-page__main-input"
                    style={{
                      fontSize: '16px',
                      padding: '16px',
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

              <div className="reference-page__messages">
                {messages.length === 0 ? (
                  <div className="reference-page__empty">
                    <div className="reference-page__welcome">
                      <RobotOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
                      <Title level={3} style={{ marginBottom: 8 }}>
                        Справочная с ИИ
                      </Title>
                      <Text type="secondary" style={{ fontSize: 16, marginBottom: 24, display: 'block' }}>
                        Задайте вопрос выше, и я найду ответ в базе знаний
                      </Text>
                      <Divider style={{ margin: '16px 0' }} />
                      <div className="reference-page__quick-questions">
                        <Text strong style={{ marginBottom: 12, display: 'block', fontSize: 14 }}>
                          Популярные вопросы:
                        </Text>
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
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
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
                                {message.timestamp.toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
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
                                  {message.sources.map((topic, idx) => (
                                    <Tag
                                      key={idx}
                                      style={{ marginTop: 4, cursor: 'pointer' }}
                                      onClick={() => handleTopicClick(topic)}
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
                                    onClick={() => handleRating(message.id, 'like')}
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
                                    onClick={() => handleRating(message.id, 'dislike')}
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
              </div>
            </div>
          </Card>
        </Content>
      </Layout>
    </div>
  );
};

export default ReferencePage;
