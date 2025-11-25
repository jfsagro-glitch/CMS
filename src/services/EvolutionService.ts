/**
 * Сервис эволюции и прогрессивного самообучения модели
 * Накопительное накопление опыта и постоянное улучшение
 */

import { feedbackStorage } from '@/utils/feedbackStorage';
import { knowledgeBase } from '@/utils/knowledgeBase';
import { documentIndexer } from '@/utils/documentIndexer';

interface EvolutionLevel {
  level: number;
  name: string;
  description: string;
  experienceRequired: number;
  specializations: string[];
}

interface ModelEvolution {
  level: number;
  totalExperience: number;
  experiencePoints: {
    assetValuation: number; // Опыт в оценке активов
    riskAnalysis: number; // Опыт в анализе рисков
    documentAnalysis: number; // Опыт в анализе документов
    consultation: number; // Опыт в консультациях
    registration: number; // Опыт в регистрации залога
    questionEnhancement: number; // Опыт в задавании уточняющих вопросов
  };
  specializations: string[];
  learnedConcepts: string[]; // Изученные концепции
  bestPractices: Map<string, string>; // Лучшие практики по категориям
  evolutionHistory: Array<{
    date: Date;
    level: number;
    milestone: string;
  }>;
  createdAt: Date;
  lastEvolution: Date;
}

class EvolutionService {
  private readonly STORAGE_KEY = 'ai_model_evolution';
  private evolution: ModelEvolution | null = null;
  
  // Уровни эволюции
  private readonly EVOLUTION_LEVELS: EvolutionLevel[] = [
    {
      level: 1,
      name: 'Новичок',
      description: 'Начальный уровень, базовая база знаний',
      experienceRequired: 0,
      specializations: [],
    },
    {
      level: 2,
      name: 'Стажер',
      description: 'Изучает основы оценки и анализа рисков',
      experienceRequired: 100,
      specializations: ['Базовая оценка'],
    },
    {
      level: 3,
      name: 'Специалист',
      description: 'Компетентен в оценке основных типов активов',
      experienceRequired: 500,
      specializations: ['Оценка недвижимости', 'Оценка движимого имущества', 'Регистрация залога'],
    },
    {
      level: 4,
      name: 'Эксперт',
      description: 'Глубокие знания в оценке и анализе рисков',
      experienceRequired: 1500,
      specializations: ['Оценка бизнеса', 'Анализ рисков', 'Оценка интеллектуальной собственности', 'Регистрация ипотеки'],
    },
    {
      level: 5,
      name: 'Старший эксперт',
      description: 'Мастер в оценке всех видов активов',
      experienceRequired: 3000,
      specializations: ['Комплексная оценка', 'Сложные риски', 'Нетиповые активы', 'Регистрация всех типов залога'],
    },
    {
      level: 6,
      name: 'Ведущий эксперт',
      description: 'Признанный авторитет в области оценки и анализа рисков',
      experienceRequired: 6000,
      specializations: ['Экспертиза', 'Методология оценки', 'Управление рисками', 'Регистрация залога', 'Уточняющие вопросы'],
    },
    {
      level: 7,
      name: 'Главный эксперт',
      description: 'Высший уровень профессионализма',
      experienceRequired: 10000,
      specializations: ['Все виды активов', 'Все типы рисков', 'Регистрация залога', 'Методология', 'Обучение', 'Профессиональные консультации'],
    },
  ];

  /**
   * Инициализация эволюции модели
   */
  initialize(): void {
    this.loadEvolution();
    if (!this.evolution) {
      this.createInitialEvolution();
    }
  }

  /**
   * Создает начальную эволюцию
   */
  private createInitialEvolution(): void {
    this.evolution = {
      level: 1,
      totalExperience: 0,
      experiencePoints: {
        assetValuation: 0,
        riskAnalysis: 0,
        documentAnalysis: 0,
        consultation: 0,
        registration: 0,
        questionEnhancement: 0,
      },
      specializations: [],
      learnedConcepts: [],
      bestPractices: new Map(),
      evolutionHistory: [{
        date: new Date(),
        level: 1,
        milestone: 'Инициализация модели',
      }],
      createdAt: new Date(),
      lastEvolution: new Date(),
    };
    this.saveEvolution();
  }

  /**
   * Добавляет опыт на основе обратной связи
   */
  addExperienceFromFeedback(rating: 'like' | 'dislike', category: string, question: string): void {
    if (!this.evolution) {
      this.initialize();
    }

    if (!this.evolution) return;

    const baseExperience = rating === 'like' ? 10 : 2; // Лайк дает больше опыта
    
    // Определяем тип опыта на основе категории и вопроса
    const lowerQuestion = question.toLowerCase();
    
    if (this.isAssetValuationQuestion(lowerQuestion, category)) {
      this.evolution.experiencePoints.assetValuation += baseExperience;
    }
    
    if (this.isRiskAnalysisQuestion(lowerQuestion, category)) {
      this.evolution.experiencePoints.riskAnalysis += baseExperience;
    }
    
    if (this.isRegistrationQuestion(lowerQuestion, category)) {
      this.evolution.experiencePoints.registration += baseExperience * 1.5;
    }
    
    if (category === 'appraisal' || category === 'ltv_calculation') {
      this.evolution.experiencePoints.assetValuation += baseExperience * 1.5;
    }
    
    if (category === 'risks' || category === 'monitoring') {
      this.evolution.experiencePoints.riskAnalysis += baseExperience * 1.5;
    }
    
    if (category === 'registration' || category === 'mortgage') {
      this.evolution.experiencePoints.registration += baseExperience * 1.5;
    }

    // Бонус за уточняющие вопросы (если ответ содержал вопросы)
    if (rating === 'like' && question.length > 50) {
      this.evolution.experiencePoints.questionEnhancement += 2;
    }

    this.evolution.experiencePoints.consultation += baseExperience;
    this.evolution.totalExperience += baseExperience;

    // Сохраняем изученные концепции
    this.extractConcepts(question);

    // Проверяем эволюцию уровня
    this.checkEvolution();

    this.saveEvolution();
  }

  /**
   * Добавляет опыт на основе анализа документов
   */
  addExperienceFromDocuments(): void {
    if (!this.evolution) {
      this.initialize();
    }

    if (!this.evolution) return;

    const documents = documentIndexer.getIndexedDocuments();
    const categories = knowledgeBase.getCategories();
    
    // Опыт за каждый документ (увеличено для более активного обучения)
    const docExperience = 10; // Увеличено с 5 до 10
    this.evolution.experiencePoints.documentAnalysis += documents.length * docExperience;
    this.evolution.totalExperience += documents.length * docExperience;

    // Опыт за категории знаний
    const categoryExperience = 3; // Увеличено с 2 до 3
    this.evolution.experiencePoints.consultation += categories.length * categoryExperience;
    this.evolution.totalExperience += categories.length * categoryExperience;

    // Бонусный опыт за темы в категориях
    let totalTopics = 0;
    categories.forEach(cat => {
      totalTopics += cat.topics.length;
    });
    const topicExperience = 0.5;
    this.evolution.experiencePoints.consultation += totalTopics * topicExperience;
    this.evolution.totalExperience += totalTopics * topicExperience;

    // Извлекаем концепции из документов
    let conceptsExtracted = 0;
    documents.forEach(doc => {
      doc.chunks.forEach(chunk => {
        const beforeCount = this.evolution!.learnedConcepts.length;
        this.extractConceptsFromText(chunk.text);
        if (this.evolution!.learnedConcepts.length > beforeCount) {
          conceptsExtracted++;
        }
      });
    });

    // Бонус за извлеченные концепции
    if (conceptsExtracted > 0) {
      const conceptBonus = conceptsExtracted * 2;
      this.evolution.experiencePoints.documentAnalysis += conceptBonus;
      this.evolution.totalExperience += conceptBonus;
      console.log(`📚 Извлечено новых концепций из документов: ${conceptsExtracted}`);
    }

    // Специализированный опыт на основе типов документов
    if (this.evolution) {
      documents.forEach(doc => {
        const docName = doc.documentName.toLowerCase();
        
        // Опыт за документы по оценке
        if (docName.includes('оценк') || docName.includes('fso') || docName.includes('стоимость')) {
          this.evolution!.experiencePoints.assetValuation += 5;
          this.evolution!.totalExperience += 5;
        }
        
        // Опыт за документы по рискам
        if (docName.includes('риск') || docName.includes('мониторинг')) {
          this.evolution!.experiencePoints.riskAnalysis += 5;
          this.evolution!.totalExperience += 5;
        }
        
        // Опыт за документы по регистрации
        if (docName.includes('регистрац') || docName.includes('ипотек') || docName.includes('залог')) {
          this.evolution!.experiencePoints.registration += 5;
          this.evolution!.totalExperience += 5;
        }
      });
    }

    console.log(`🎓 Модель получила опыт из документов: +${documents.length * docExperience} за документы, +${categories.length * categoryExperience} за категории, +${totalTopics * topicExperience} за темы`);

    this.checkEvolution();
    this.saveEvolution();
  }

  /**
   * Проверяет, нужно ли повысить уровень
   */
  private checkEvolution(): void {
    if (!this.evolution) return;

    const currentLevelData = this.EVOLUTION_LEVELS.find(l => l.level === this.evolution!.level);
    if (!currentLevelData) return;

    const nextLevel = this.EVOLUTION_LEVELS.find(l => l.level === this.evolution!.level + 1);
    if (!nextLevel) return; // Уже максимальный уровень

    if (this.evolution.totalExperience >= nextLevel.experienceRequired) {
      // Повышаем уровень
      this.evolution.level = nextLevel.level;
      this.evolution.specializations = [...new Set([...this.evolution.specializations, ...nextLevel.specializations])];
      this.evolution.lastEvolution = new Date();
      this.evolution.evolutionHistory.push({
        date: new Date(),
        level: nextLevel.level,
        milestone: `Достигнут уровень: ${nextLevel.name}`,
      });

      console.log(`🎉 Модель эволюционировала до уровня ${nextLevel.level}: ${nextLevel.name}`);
    }
  }

  /**
   * Определяет, является ли вопрос об оценке активов
   */
  private isAssetValuationQuestion(question: string, category: string): boolean {
    const valuationKeywords = [
      'оценка', 'стоимость', 'рыночная', 'залоговая', 'кадастровая',
      'ltv', 'loan-to-value', 'оценщик', 'отчет об оценке',
      'недвижимость', 'движимое имущество', 'бизнес', 'активы',
    ];
    
    return category === 'appraisal' || 
           category === 'ltv_calculation' ||
           valuationKeywords.some(kw => question.includes(kw));
  }

  /**
   * Определяет, является ли вопрос об анализе рисков
   */
  private isRiskAnalysisQuestion(question: string, category: string): boolean {
    const riskKeywords = [
      'риск', 'риски', 'анализ рисков', 'управление рисками',
      'минимизация', 'контроль', 'мониторинг', 'проверка',
      'обременение', 'нетиповые риски',
    ];
    
    return category === 'risks' || 
           category === 'monitoring' ||
           riskKeywords.some(kw => question.includes(kw));
  }

  /**
   * Определяет, является ли вопрос о регистрации залога
   */
  private isRegistrationQuestion(question: string, category: string): boolean {
    const registrationKeywords = [
      'регистрац', 'обременен', 'росреестр', 'егрн',
      'ипотек', 'залог', 'оформлен', 'договор залога',
    ];
    
    return category === 'registration' || 
           category === 'mortgage' ||
           registrationKeywords.some(kw => question.includes(kw));
  }

  /**
   * Извлекает концепции из вопроса
   */
  private extractConcepts(question: string): void {
    if (!this.evolution) return;

    const concepts = [
      'оценка недвижимости', 'оценка бизнеса', 'оценка движимого имущества',
      'ltv расчет', 'залоговая стоимость', 'рыночная стоимость',
      'анализ рисков', 'управление рисками', 'мониторинг залога',
      'регистрация обременения', 'договор залога', 'ипотека',
      'регистрация залога', 'росреестр', 'егрн', 'кадастровый учет',
      'уточняющие вопросы', 'профессиональные консультации',
    ];

    const lowerQuestion = question.toLowerCase();
    concepts.forEach(concept => {
      if (lowerQuestion.includes(concept.toLowerCase()) && !this.evolution!.learnedConcepts.includes(concept)) {
        this.evolution!.learnedConcepts.push(concept);
      }
    });
  }

  /**
   * Извлекает концепции из текста документа
   */
  private extractConceptsFromText(text: string): void {
    if (!this.evolution) return;

    const importantConcepts = [
      'федеральный стандарт оценки', 'фсо', 'методы оценки',
      'доходный подход', 'сравнительный подход', 'затратный подход',
      'дисконтирование', 'капитализация', 'мультипликаторы',
      'риск-менеджмент', 'кредитный риск', 'рыночный риск',
    ];

    const lowerText = text.toLowerCase();
    importantConcepts.forEach(concept => {
      if (lowerText.includes(concept.toLowerCase()) && !this.evolution!.learnedConcepts.includes(concept)) {
        this.evolution!.learnedConcepts.push(concept);
      }
    });
  }

  /**
   * Получает текущий уровень эволюции
   */
  getCurrentLevel(): EvolutionLevel | null {
    if (!this.evolution) {
      this.initialize();
    }
    if (!this.evolution) return null;

    return this.EVOLUTION_LEVELS.find(l => l.level === this.evolution!.level) || null;
  }

  /**
   * Получает прогресс до следующего уровня
   */
  getProgressToNextLevel(): { current: number; required: number; percentage: number } | null {
    if (!this.evolution) {
      this.initialize();
    }
    if (!this.evolution) return null;

    const nextLevel = this.EVOLUTION_LEVELS.find(l => l.level === this.evolution!.level + 1);
    if (!nextLevel) {
      // Максимальный уровень
      return {
        current: this.evolution.totalExperience,
        required: this.evolution.totalExperience,
        percentage: 100,
      };
    }

    const currentLevel = this.EVOLUTION_LEVELS.find(l => l.level === this.evolution!.level);
    const currentExp = this.evolution.totalExperience - (currentLevel?.experienceRequired || 0);
    const requiredExp = nextLevel.experienceRequired - (currentLevel?.experienceRequired || 0);
    const percentage = Math.min(100, Math.round((currentExp / requiredExp) * 100));

    return {
      current: currentExp,
      required: requiredExp,
      percentage,
    };
  }

  /**
   * Получает статистику эволюции
   */
  getEvolutionStats(): ModelEvolution | null {
    if (!this.evolution) {
      this.initialize();
    }
    return this.evolution;
  }

  /**
   * Получает улучшенный промпт на основе уровня эволюции
   */
  getEnhancedPrompt(basePrompt: string): string {
    if (!this.evolution) {
      this.initialize();
    }
    if (!this.evolution) return basePrompt;

    const levelData = this.getCurrentLevel();
    if (!levelData) return basePrompt;

    let enhancedPrompt = basePrompt;

    // Добавляем информацию об уровне и специализациях
    enhancedPrompt += `\n\nТВОЙ УРОВЕНЬ ЭКСПЕРТИЗЫ: ${levelData.name} (Уровень ${this.evolution.level})`;
    enhancedPrompt += `\nТвой общий опыт: ${this.evolution.totalExperience} очков опыта`;
    
    if (this.evolution.specializations.length > 0) {
      enhancedPrompt += `\nТвои специализации: ${this.evolution.specializations.join(', ')}`;
    }

    // Добавляем опыт по направлениям
    enhancedPrompt += `\n\nТВОЙ ОПЫТ:`;
    enhancedPrompt += `\n- Оценка активов: ${this.evolution.experiencePoints.assetValuation} очков`;
    enhancedPrompt += `\n- Анализ рисков: ${this.evolution.experiencePoints.riskAnalysis} очков`;
    enhancedPrompt += `\n- Регистрация залога: ${this.evolution.experiencePoints.registration} очков`;
    enhancedPrompt += `\n- Анализ документов: ${this.evolution.experiencePoints.documentAnalysis} очков`;
    enhancedPrompt += `\n- Консультации: ${this.evolution.experiencePoints.consultation} очков`;
    enhancedPrompt += `\n- Уточняющие вопросы: ${this.evolution.experiencePoints.questionEnhancement} очков`;

    // Добавляем изученные концепции
    if (this.evolution.learnedConcepts.length > 0) {
      enhancedPrompt += `\n\nИЗУЧЕННЫЕ КОНЦЕПЦИИ: ${this.evolution.learnedConcepts.slice(0, 10).join(', ')}`;
    }

    // Добавляем рекомендации на основе уровня
    if (this.evolution.level >= 4) {
      enhancedPrompt += `\n\nТы достиг высокого уровня экспертизы. Используй глубокие знания и профессиональный опыт для комплексного анализа.`;
    }

    if (this.evolution.level >= 5) {
      enhancedPrompt += `\n\nТы мастер в оценке всех видов активов. Предоставляй детальный анализ с учетом всех нюансов и рисков.`;
    }

    return enhancedPrompt;
  }

  /**
   * Сохраняет эволюцию
   */
  private saveEvolution(): void {
    if (!this.evolution) return;

    try {
      const data = {
        ...this.evolution,
        bestPractices: Array.from(this.evolution.bestPractices.entries()),
        evolutionHistory: this.evolution.evolutionHistory.map(h => ({
          ...h,
          date: h.date.toISOString(),
        })),
        createdAt: this.evolution.createdAt.toISOString(),
        lastEvolution: this.evolution.lastEvolution.toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка сохранения эволюции:', error);
    }
  }

  /**
   * Загружает эволюцию
   */
  private loadEvolution(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.evolution = {
          ...data,
          bestPractices: new Map(data.bestPractices || []),
          evolutionHistory: (data.evolutionHistory || []).map((h: any) => ({
            ...h,
            date: new Date(h.date),
          })),
          createdAt: new Date(data.createdAt),
          lastEvolution: new Date(data.lastEvolution),
        };
      }
    } catch (error) {
      console.error('Ошибка загрузки эволюции:', error);
    }
  }

  /**
   * Добавляет пассивный опыт (даже без обратной связи)
   * Вызывается при каждом использовании модели
   */
  addPassiveExperience(question: string, answerLength: number): void {
    if (!this.evolution) {
      this.initialize();
    }
    if (!this.evolution) return;

    const lowerQuestion = question.toLowerCase();
    const category = this.detectCategoryFromQuestion(question);
    
    // Небольшой опыт за каждое использование (0.5 очков)
    const passiveExp = 0.5;
    
    if (this.isAssetValuationQuestion(lowerQuestion, category)) {
      this.evolution.experiencePoints.assetValuation += passiveExp;
    }
    
    if (this.isRiskAnalysisQuestion(lowerQuestion, category)) {
      this.evolution.experiencePoints.riskAnalysis += passiveExp;
    }
    
    if (this.isRegistrationQuestion(lowerQuestion, category)) {
      this.evolution.experiencePoints.registration += passiveExp;
    }

    // Опыт за длинные ответы (больше информации)
    if (answerLength > 500) {
      this.evolution.experiencePoints.consultation += passiveExp;
    }

    this.evolution.experiencePoints.consultation += passiveExp;
    this.evolution.totalExperience += passiveExp;

    // Проверяем эволюцию (реже, чтобы не спамить)
    if (Math.random() < 0.1) { // 10% вероятность проверки
      this.checkEvolution();
      this.saveEvolution();
    } else {
      // Сохраняем без проверки эволюции
      this.saveEvolution();
    }
  }

  /**
   * Принудительно обновляет опыт на основе текущих данных
   */
  updateExperienceFromCurrentData(): void {
    if (!this.evolution) {
      this.initialize();
    }
    if (!this.evolution) return;

    // Обновляем опыт на основе документов
    this.addExperienceFromDocuments();

    // Обновляем опыт на основе обратной связи
    const allFeedbacks = feedbackStorage.getAllFeedbacks();
    allFeedbacks.forEach(feedback => {
      const category = this.detectCategoryFromQuestion(feedback.question);
      this.addExperienceFromFeedback(feedback.rating, category, feedback.question);
    });

    this.saveEvolution();
  }

  /**
   * Определяет категорию из вопроса
   */
  private detectCategoryFromQuestion(question: string): string {
    const lower = question.toLowerCase();
    
    if (lower.includes('ltv') || lower.includes('залоговая стоимость')) return 'ltv_calculation';
    if (lower.includes('оценк') || lower.includes('оценщик')) return 'appraisal';
    if (lower.includes('риск')) return 'risks';
    if (lower.includes('регистрац') || lower.includes('росреестр')) return 'registration';
    if (lower.includes('осмотр') || lower.includes('мониторинг')) return 'monitoring';
    if (lower.includes('ипотек')) return 'mortgage';
    if (lower.includes('договор')) return 'pledge_contract';
    
    return 'general';
  }
}

export const evolutionService = new EvolutionService();
export default evolutionService;

