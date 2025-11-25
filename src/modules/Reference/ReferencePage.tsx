import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Avatar,
  Spin,
  Empty,
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
} from '@ant-design/icons';
import { documentIndexer } from '@/utils/documentIndexer';
import { loadVNDDocuments, loadDocumentManually } from '@/utils/documentLoader';
import { knowledgeBase, type KnowledgeTopic, type KnowledgeCategory } from '@/utils/knowledgeBase';
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
        // Загружаем индексы
        documentIndexer.loadFromStorage();
        knowledgeBase.loadFromStorage();
        
        const documents = await loadVNDDocuments();
        setIndexedDocuments(documents);
        
        // Загружаем категории из базы знаний
        const loadedCategories = knowledgeBase.getCategories();
        setCategories(loadedCategories);
        
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

  // Поиск по базе знаний
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const results = knowledgeBase.search(searchQuery, 10);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Генерация ответа на основе базы знаний
  const generateAIResponse = (userMessage: string): { content: string; sources: KnowledgeTopic[] } => {
    const lowerMessage = userMessage.toLowerCase();

    // Поиск по базе знаний
    const topics = knowledgeBase.search(userMessage, 5);
    
    let response = '';
    let sources: KnowledgeTopic[] = [];

    if (topics.length > 0) {
      // Формируем структурированный ответ на основе найденных тем
      response = `На основе справочной литературы по банковским залогам:\n\n`;
      
      // Группируем по категориям
      const byCategory = new Map<string, KnowledgeTopic[]>();
      for (const topic of topics) {
        if (!byCategory.has(topic.category)) {
          byCategory.set(topic.category, []);
        }
        byCategory.get(topic.category)!.push(topic);
      }

      // Формируем ответ
      for (const [categoryId, categoryTopics] of byCategory.entries()) {
        const categoryName = categories.find(c => c.id === categoryId)?.name || categoryId;
        response += `**${categoryName}**\n\n`;
        
        for (const topic of categoryTopics.slice(0, 2)) {
          response += `*${topic.title}*\n\n`;
          
          // Берем первые 300 символов содержимого
          const content = topic.content.length > 300 
            ? topic.content.slice(0, 300) + '...'
            : topic.content;
          response += `${content}\n\n`;
        }
      }

      sources = topics;
    } else {
      // Если ничего не найдено
      if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй')) {
        response = `Здравствуйте! Я ваш помощник по вопросам работы с залоговым имуществом.

Моя база знаний основана на справочной литературе "Залоговik. Все о банковских залогах".

Я могу помочь вам с:
📋 Ипотекой и залоговым кредитованием
💰 Оценкой залогового имущества
📊 Расчетом LTV и анализом рисков
📝 Договорами залога
⚖️ Нормативными требованиями
📑 Регистрацией залогов

Задайте вопрос, и я найду нужную информацию в базе знаний!`;
      } else {
        response = `К сожалению, я не нашел точной информации по вашему запросу в базе знаний.

Попробуйте:
- Использовать ключевые слова: залог, ипотека, оценка, LTV, договор
- Задать более конкретный вопрос
- Выбрать категорию из списка слева
- Использовать поиск по темам

Доступные категории:
${categories.map(c => `- ${c.name}`).join('\n')}`;
      }
    }

    return { content: response, sources };
  };

  const handleSend = async () => {
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

    // Генерация ответа с задержкой
    setTimeout(() => {
      const { content, sources } = generateAIResponse(question);
      
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        sources: sources.length > 0 ? sources : undefined,
      };

      setMessages(prev => [...prev, aiResponse]);
      setLoading(false);
    }, 800 + Math.random() * 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      message.error('Поддерживаются только PDF файлы');
      return false;
    }

    setIndexing(true);
    try {
      const index = await loadDocumentManually(file);
      setIndexedDocuments(prev => [...prev, index]);
      
      // Обновляем категории
      const updatedCategories = knowledgeBase.getCategories();
      setCategories(updatedCategories);
      
      message.success(`Документ "${file.name}" успешно проиндексирован. База знаний обновлена.`);
    } catch (error) {
      console.error('Ошибка индексации:', error);
      message.error('Не удалось проиндексировать документ');
    } finally {
      setIndexing(false);
    }

    return false;
  };

  const handleTopicClick = (topic: KnowledgeTopic) => {
    setInputValue(topic.title);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
  };

  const displayedTopics = selectedCategory
    ? knowledgeBase.getTopicsByCategory(selectedCategory)
    : searchResults.length > 0
    ? searchResults
    : [];

  const quickQuestions = [
    { icon: <FileTextOutlined />, text: 'Что такое залог?', query: 'Что такое залог и залоговое имущество?' },
    { icon: <CalculatorOutlined />, text: 'Расчет LTV', query: 'Как рассчитывается LTV залогового имущества?' },
    { icon: <BulbOutlined />, text: 'Вопросы оценки', query: 'Как проводится оценка залогового имущества?' },
    { icon: <QuestionCircleOutlined />, text: 'Договор залога', query: 'Что такое договор залога и его особенности?' },
  ];

  const handleQuickQuestion = (query: string) => {
    setInputValue(query);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

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
          <Upload
            accept=".pdf"
            beforeUpload={handleFileUpload}
            showUploadList={false}
            disabled={indexing}
          >
            <Button icon={<UploadOutlined />} loading={indexing}>
              Загрузить документ
            </Button>
          </Upload>
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

            {displayedTopics.length > 0 && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text strong>
                    {selectedCategory ? 'Темы в категории' : 'Результаты поиска'} ({displayedTopics.length})
                  </Text>
                  <List
                    size="small"
                    dataSource={displayedTopics.slice(0, 20)}
                    style={{ marginTop: 8, maxHeight: 400, overflow: 'auto' }}
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
              <div className="reference-page__messages">
                {messages.length === 0 ? (
                  <div className="reference-page__empty">
                    <Empty
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: 16 }}>
                            Задайте вопрос, и я найду ответ в базе знаний
                          </Text>
                          <Divider />
                          <div className="reference-page__quick-questions">
                            <Text strong style={{ marginBottom: 12, display: 'block' }}>
                              Популярные вопросы:
                            </Text>
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              {quickQuestions.map((q, index) => (
                                <Button
                                  key={index}
                                  type="default"
                                  icon={q.icon}
                                  onClick={() => handleQuickQuestion(q.query)}
                                  style={{ width: '100%', textAlign: 'left', height: 'auto', padding: '8px 16px' }}
                                >
                                  {q.text}
                                </Button>
                              ))}
                            </Space>
                          </div>
                        </div>
                      }
                    />
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

              <div className="reference-page__input">
                <Space.Compact style={{ width: '100%' }}>
                  <TextArea
                    ref={textAreaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Задайте вопрос о залогах, ипотеке, оценке..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    disabled={loading || indexing}
                    style={{ resize: 'none' }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={loading}
                    disabled={!inputValue.trim() || indexing}
                    style={{ height: 'auto' }}
                  >
                    Отправить
                  </Button>
                </Space.Compact>
              </div>
            </div>
          </Card>
        </Content>
      </Layout>
    </div>
  );
};

export default ReferencePage;
