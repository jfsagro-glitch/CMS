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
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import './ReferencePage.css';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ReferencePage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Имитация ответа ИИ
  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Ответы по нормативным документам
    if (lowerMessage.includes('норматив') || lowerMessage.includes('документ') || lowerMessage.includes('регламент')) {
      return `Согласно нормативным документам Банка:

1. **Регламент работы с залоговым имуществом** (РД-2021-001):
   - Все операции с залоговым имуществом должны быть задокументированы
   - Обязательное проведение оценки не реже одного раза в год
   - Требуется согласование с кредитным комитетом при изменении условий залога

2. **Политика управления рисками** (ПР-2020-015):
   - Максимальный LTV не должен превышать 80%
   - Обязательное страхование залогового имущества
   - Регулярный мониторинг состояния залога

Если нужна более подробная информация по конкретному документу, уточните, пожалуйста, какой именно раздел вас интересует.`;
    }

    // Ответы по оценке
    if (lowerMessage.includes('оценк') || lowerMessage.includes('стоимость') || lowerMessage.includes('цена')) {
      return `По вопросам оценки залогового имущества:

**Методы оценки:**
1. **Сравнительный подход** - используется для недвижимости и транспортных средств
2. **Затратный подход** - применяется для оборудования и техники
3. **Доходный подход** - используется для коммерческой недвижимости

**Требования к оценщикам:**
- Оценщик должен иметь действующий квалификационный аттестат
- Минимальный опыт работы - 3 года
- Обязательное членство в СРО оценщиков

**Сроки действия отчета об оценке:**
- Для недвижимости - 6 месяцев
- Для транспортных средств - 3 месяца
- Для оборудования - 6 месяцев

**Частота переоценки:**
- При изменении рыночной ситуации
- При существенном изменении состояния объекта
- Не реже одного раза в год

Могу помочь с расчетом стоимости конкретного объекта или подобрать подходящего оценщика.`;
    }

    // Ответы по LTV
    if (lowerMessage.includes('ltv') || lowerMessage.includes('залог') || lowerMessage.includes('обеспечение')) {
      return `**LTV (Loan-to-Value)** - соотношение суммы задолженности к рыночной стоимости залогового имущества.

**Формула расчета:**
LTV = (Сумма задолженности / Рыночная стоимость залогового имущества) × 100%

**Нормативные ограничения:**
- Максимальный LTV для недвижимости: 80%
- Максимальный LTV для транспортных средств: 70%
- Максимальный LTV для оборудования: 60%

**Действия при превышении LTV:**
1. Требовать дополнительное обеспечение
2. Провести переоценку имущества
3. Рассмотреть возможность частичного погашения задолженности

**Мониторинг LTV:**
- Проверка при каждом изменении задолженности
- Ежемесячный контроль для проблемных кредитов
- Автоматический расчет в системе

Нужна помощь с расчетом LTV для конкретной сделки?`;
    }

    // Ответы по задачам
    if (lowerMessage.includes('задач') || lowerMessage.includes('сделать') || lowerMessage.includes('как')) {
      return `Помогу вам решить задачу. Вот общий алгоритм работы:

**1. Анализ задачи:**
   - Определите тип задачи (оценка, осмотр, регистрация, мониторинг)
   - Проверьте наличие всех необходимых документов
   - Уточните сроки выполнения

**2. Выполнение:**
   - Следуйте регламенту для данного типа задач
   - Заполните все обязательные поля в системе
   - Прикрепите необходимые документы

**3. Контроль:**
   - Проверьте корректность заполненных данных
   - Убедитесь, что все документы загружены
   - Отправьте на согласование

**Частые задачи:**
- Создание карточки залога: Реестр → Создать карточку
- Проведение осмотра: CMS Check → Создать осмотр
- Заказ выписки ЕГРН: ЕГРН → Выписки ЕГРН → Создать запрос
- Расчет LTV: Залоговый портфель → Карточка договора

Опишите конкретную задачу, и я дам более детальную инструкцию.`;
    }

    // Общие ответы
    if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй')) {
      return `Здравствуйте! Я ваш помощник по вопросам работы с залоговым имуществом.

Я могу помочь вам с:
📋 Нормативными документами Банка
💰 Вопросами оценки имущества
📊 Расчетом LTV и анализом рисков
✅ Решением рабочих задач
📝 Работой с документами

Задайте вопрос, и я постараюсь помочь!`;
    }

    // Дефолтный ответ
    return `Спасибо за ваш вопрос. Я консультирую по вопросам:

**Нормативные документы:**
- Регламенты работы с залоговым имуществом
- Политики управления рисками
- Инструкции по оформлению документов

**Оценка:**
- Методы оценки различных типов имущества
- Требования к оценщикам
- Сроки действия отчетов об оценке

**Рабочие вопросы:**
- Работа с системой
- Оформление документов
- Решение типовых задач

Уточните, пожалуйста, что именно вас интересует, и я дам более подробный ответ.`;
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
    setInputValue('');
    setLoading(true);

    // Имитация задержки ответа ИИ
    setTimeout(() => {
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: generateAIResponse(userMessage.content),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      setLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    { icon: <FileTextOutlined />, text: 'Нормативные документы', query: 'Расскажи о нормативных документах Банка' },
    { icon: <CalculatorOutlined />, text: 'Расчет LTV', query: 'Как рассчитывается LTV?' },
    { icon: <BulbOutlined />, text: 'Вопросы оценки', query: 'Расскажи о требованиях к оценке имущества' },
    { icon: <QuestionCircleOutlined />, text: 'Решение задач', query: 'Как решить типовую задачу?' },
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
              Консультации по нормативным документам, оценке и рабочим вопросам
            </Text>
          </div>
        </Space>
      </div>

      <Card className="reference-page__card">
        <div className="reference-page__chat">
          <div className="reference-page__messages">
            {messages.length === 0 ? (
              <div className="reference-page__empty">
                <Empty
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 16 }}>
                        Задайте вопрос, и я помогу вам
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
                        ИИ думает...
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
                placeholder="Задайте вопрос..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={loading}
                style={{ resize: 'none' }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={loading}
                disabled={!inputValue.trim()}
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

