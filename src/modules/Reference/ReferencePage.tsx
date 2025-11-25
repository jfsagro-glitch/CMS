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
} from '@ant-design/icons';
import { documentIndexer, type DocumentChunk } from '@/utils/documentIndexer';
import { loadVNDDocuments, loadDocumentManually } from '@/utils/documentLoader';
import type { DocumentIndex } from '@/utils/documentIndexer';
import './ReferencePage.css';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: DocumentChunk[];
}

const ReferencePage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexedDocuments, setIndexedDocuments] = useState<DocumentIndex[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);

  // Загрузка документов при монтировании
  useEffect(() => {
    const loadDocuments = async () => {
      setIndexing(true);
      try {
        const documents = await loadVNDDocuments();
        setIndexedDocuments(documents);
        if (documents.length > 0) {
          message.success(`Загружено документов: ${documents.length}`);
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

  // Генерация ответа на основе документов
  const generateAIResponse = (userMessage: string): { content: string; sources: DocumentChunk[] } => {
    const lowerMessage = userMessage.toLowerCase();

    // Поиск по документам
    const searchResults = documentIndexer.search(userMessage, 5);
    
    let response = '';
    let sources: DocumentChunk[] = [];

    if (searchResults.length > 0) {
      // Формируем ответ на основе найденных фрагментов
      response = `На основе нормативных документов и справочной литературы:\n\n`;
      
      // Группируем результаты по документам
      const byDocument = new Map<string, DocumentChunk[]>();
      for (const chunk of searchResults) {
        if (!byDocument.has(chunk.documentName)) {
          byDocument.set(chunk.documentName, []);
        }
        byDocument.get(chunk.documentName)!.push(chunk);
      }

      // Формируем ответ
      for (const [docName, chunks] of byDocument.entries()) {
        response += `**${docName}**\n\n`;
        
        for (const chunk of chunks.slice(0, 2)) {
          // Очищаем текст от лишних пробелов
          const cleanText = chunk.text.replace(/\s+/g, ' ').trim();
          if (cleanText.length > 200) {
            response += `...${cleanText.slice(0, 200)}...\n\n`;
          } else {
            response += `${cleanText}\n\n`;
          }
        }
      }

      sources = searchResults;
    } else {
      // Если ничего не найдено, используем общие ответы
      if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй')) {
        response = `Здравствуйте! Я ваш помощник по вопросам работы с залоговым имуществом.

Я могу помочь вам с:
📋 Нормативными документами Банка
💰 Вопросами оценки имущества
📊 Расчетом LTV и анализом рисков
✅ Решением рабочих задач
📝 Работой с документами

Моя база знаний основана на справочной литературе по банковским залогам. Задайте вопрос, и я найду нужную информацию в документах!`;
      } else {
        response = `К сожалению, я не нашел точной информации по вашему запросу в документах.

Попробуйте переформулировать вопрос или уточнить:
- Используйте ключевые слова: залог, ипотека, оценка, LTV, договор
- Задайте более конкретный вопрос
- Укажите тип имущества или ситуацию

Я могу помочь с вопросами о:
- Банковских залогах и ипотеке
- Оценке залогового имущества
- Договорах залога
- Управлении рисками
- Нормативных требованиях`;
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
      message.success(`Документ "${file.name}" успешно проиндексирован`);
    } catch (error) {
      console.error('Ошибка индексации:', error);
      message.error('Не удалось проиндексировать документ');
    } finally {
      setIndexing(false);
    }

    return false; // Предотвращаем автоматическую загрузку
  };

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
              Консультации на основе нормативных документов и справочной литературы
            </Text>
          </div>
        </Space>
        <Space>
          {indexedDocuments.length > 0 && (
            <Tag icon={<BookOutlined />} color="blue">
              Документов: {indexedDocuments.length}
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
          message="Индексация документов..."
          description="Пожалуйста, подождите, идет обработка документов"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {indexedDocuments.length === 0 && !indexing && (
        <Alert
          message="Документы не загружены"
          description="Загрузите PDF документы для начала работы. Документы будут проиндексированы и использованы для ответов на вопросы."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card className="reference-page__card">
        <div className="reference-page__chat">
          <div className="reference-page__messages">
            {messages.length === 0 ? (
              <div className="reference-page__empty">
                <Empty
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 16 }}>
                        Задайте вопрос, и я найду ответ в документах
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
                              {Array.from(new Set(message.sources?.map(s => s.documentName) || [])).map((docName, idx) => (
                                <Tag key={idx} style={{ marginTop: 4 }}>
                                  {docName} (стр. {message.sources?.find(s => s.documentName === docName)?.page || '?'})
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
                        Ищу информацию в документах...
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
    </div>
  );
};

export default ReferencePage;
