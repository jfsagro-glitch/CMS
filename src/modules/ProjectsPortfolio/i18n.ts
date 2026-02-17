export type MarketingLang = 'ru' | 'en';

export type MarketingCopy = {
  nav: { home: string; services: string; cases: string; projects: string; about: string };
  links: { readFullLegend: string };
  cta: { getAudit: string; getOffer: string; downloadPdf: string; send: string; cancel: string };
  footer: { title: string; tagline: string };
  home: {
    audience: string;
    heroTitle: string;
    heroSubtitle: string;
    heroMeta: Array<{ label: string; value: string }>;
    brandTeaserLink: string;
    diagram: {
      businessGoal: string;
      businessGoalSub: string;
      processes: string;
      processesSub: string;
      data: string;
      dataSub: string;
      automation: string;
      automationSub: string;
      caption: string;
    };
    auditTitle: string;
    auditLead: string;
    auditLookTitle: string;
    auditLookBullets: string[];
    auditDeliverTitle: string;
    auditDeliverBullets: string[];
    servicesTitle: string;
    servicesAllLink: string;
    howWeWorkTitle: string;
    howWeWork: Array<{ title: string; text: string }>;
    whyTrustTitle: string;
    whyTrust: Array<{ title: string; text: string }>;
    ctaBandTitle: string;
    ctaBandText: string;
    viewCases: string;
    viewAll: string;
  };
  servicesPage: {
    title: string;
    lead: string;
    whenNeeded: string;
    whatYouGet: string;
    ctaTitle: string;
    ctaText: string;
  };
  casesPage: {
    title: string;
    lead: string;
    task: string;
    solution: string;
    result: string;
    ctaTitle: string;
    ctaText: string;
  };
  aboutPage: {
    ctaBandTitle: string;
    ctaBandText: string;
  };
  projectsPage: {
    title: string;
    lead: string;
    repo: string;
    demo: string;
    stack: string;
    highlights: string;
    capabilities: string;
  };
  projectsData: Array<{
    id: 'zadachnik' | 'cms' | 'cms-check' | 'carshop-website' | 'botvot';
    name: string;
    short: string;
    stack: string[];
    highlights: Array<{ label: string; value: string }>;
    capabilities: string[];
    githubUrl: string;
    demoUrl?: string;
  }>;
  servicesData: Array<{
    key: 'audit' | 'architecture' | 'rpa-ai' | 'bi-integrations' | 'support';
    title: string;
    short: string;
    when: string[];
    whatYouGet: string[];
  }>;
  casesData: Array<{
    id: string;
    industry: string;
    companySize: string;
    timeline: string;
    task: string;
    solution: string[];
    result: { label: string; value: string }[];
    economicEffect: string;
    note?: string;
  }>;
  offer: {
    title: string;
    subtitle: string;
    brandLine: string;
    sections: { title: string; body: Array<string | { bullets: string[] }> }[];
    strongPhraseTitle: string;
    strongPhrase: string;
  };
  brand: {
    kicker: string;
    title: string;
    story: {
      intro: string;
      paragraphs: string[];
      observedTitle: string;
      observedItems: string[];
      insight: string;
      systemTitle: string;
      systemItems: string[];
      positionParagraphs: string[];
      closing: string;
    };
    shortVersionTitle: string;
    shortVersionLines: string[];
    ceoTitle: string;
    ceoLines: string[];
  };
  auditModal: {
    title: string;
    intro: string;
    name: { label: string; placeholder: string; required: string };
    company: { label: string; placeholder: string; required: string };
    role: { label: string; placeholder: string };
    roleOptions: Array<{ value: string; label: string }>;
    email: { label: string; placeholder: string; required: string; invalid: string };
    phone: { label: string; placeholder: string };
    goal: { label: string; placeholder: string; required: string };
    direct: string;
  };
};

export const LANG_STORAGE_KEY = 'cms_mkt_lang';

export function getInitialLang(): MarketingLang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as MarketingLang | null;
    if (stored === 'ru' || stored === 'en') return stored;
  } catch {
    // ignore
  }
  const navLang = (navigator.language || '').toLowerCase();
  return navLang.startsWith('ru') ? 'ru' : 'en';
}

export function setStoredLang(lang: MarketingLang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export function getMarketingCopy(lang: MarketingLang): MarketingCopy {
  const ru: MarketingCopy = {
    nav: { home: 'Главная', services: 'Услуги', cases: 'Кейсы', projects: 'IT проекты', about: 'О CMS' },
    links: { readFullLegend: 'Подробнее →' },
    cta: {
      getAudit: 'Получить аудит процессов',
      getOffer: 'Получить коммерческое предложение',
      downloadPdf: 'Скачать PDF',
      send: 'Отправить',
      cancel: 'Отмена',
    },
    footer: {
      title: 'CMS (Corporate Management Systems)',
      tagline: 'Digital agency for business process automation & RPA',
    },
    home: {
      audience: 'Для собственников, CEO/COO компаний 20–300+ сотрудников',
      heroTitle: 'Digital agency for business process automation & RPA',
      heroSubtitle:
        'Начинаем с аудита процессов, проектируем архитектуру автоматизации и внедряем решения так, чтобы вы получили измеримый бизнес‑результат.',
      heroMeta: [
        { label: 'Фокус', value: 'Бизнес‑результат' },
        { label: 'Формат', value: 'Аудит → Архитектура → Внедрение' },
        { label: 'Результат', value: 'Метрики, план, расчёт эффекта' },
      ],
      brandTeaserLink: 'Подробнее →',
      diagram: {
        businessGoal: 'Цель бизнеса',
        businessGoalSub: 'эффект / KPI',
        processes: 'Процессы',
        processesSub: 'роли / контроль',
        data: 'Данные',
        dataSub: 'качество / витрины',
        automation: 'Интеграции + автоматизация',
        automationSub: 'RPA / AI / BI',
        caption: 'Принцип: сначала архитектура и эффект, затем инструменты.',
      },
      auditTitle: 'Аудит процессов — основной продукт',
      auditLead:
        'Вы получаете управленческий документ: что менять, в каком порядке и какой эффект это даст. Технологии — вторичны.',
      auditLookTitle: 'Что смотрим',
      auditLookBullets: [
        'сквозные процессы и точки контроля',
        'данные: качество, источники, “разрывы”',
        'стоимость операции и потери времени',
        'риски: ошибки, комплаенс, зависимость от людей',
      ],
      auditDeliverTitle: 'Что отдаём',
      auditDeliverBullets: [
        'AS‑IS / TO‑BE + метрики и владельцы',
        'реестр инициатив с приоритетами',
        'архитектурные принципы и контуры',
        'roadmap и финансовая модель эффекта',
      ],
      servicesTitle: 'Услуги',
      servicesAllLink: 'Смотреть все',
      howWeWorkTitle: 'Как работаем',
      howWeWork: [
        { title: 'Диагностика', text: 'Интервью, данные, факты, карта AS‑IS.' },
        {
          title: 'Модель эффекта',
          text: 'Где экономия/рост, какие KPI меняем, какие риски закрываем.',
        },
        {
          title: 'Архитектура',
          text: 'TO‑BE, данные, интеграции, автоматизация, эксплуатация.',
        },
        { title: 'Пилот → масштаб', text: 'Быстрые результаты и контроль качества.' },
      ],
      whyTrustTitle: 'Почему доверяют',
      whyTrust: [
        {
          title: 'Прозрачность',
          text: 'Фиксируем цель, KPI, критерии приёмки и “что будет считаться успехом”.',
        },
        {
          title: 'Архитектура',
          text: 'Не “прикручиваем роботов”, а строим устойчивую систему: данные, роли, контроль.',
        },
        {
          title: 'Передача знаний',
          text: 'Документация и обучение, чтобы снижать зависимость от подрядчика.',
        },
      ],
      ctaBandTitle: 'Готовы начать с аудита?',
      ctaBandText: 'Опишите цель — предложим формат, сроки и ожидаемый экономический эффект.',
      viewCases: 'Смотреть кейсы',
      viewAll: 'Смотреть все',
    },
    servicesPage: {
      title: 'Услуги',
      lead:
        'Мы работаем как консалтинг и архитекторы решений: начинаем с диагностики и эффекта, затем проектируем архитектуру и внедряем изменения.',
      whenNeeded: 'Когда нужно',
      whatYouGet: 'Что вы получаете',
      ctaTitle: 'Нужна отправная точка?',
      ctaText: 'Аудит процессов поможет зафиксировать цели, KPI и план действий.',
    },
    casesPage: {
      title: 'Кейсы',
      lead:
        'Формат: Задача → Решение → Результат. Акцент — на экономический эффект, метрики и управляемость изменений.',
      task: 'Задача',
      solution: 'Решение',
      result: 'Результат',
      ctaTitle: 'Хотите такой же разбор для вашей компании?',
      ctaText: 'Начнём с аудита: зафиксируем цели, измерим потери и составим roadmap внедрения.',
    },
    aboutPage: {
      ctaBandTitle: 'Нужен “взгляд со стороны”?',
      ctaBandText: 'Начнём с аудита: зафиксируем цель, измерим потери и соберём архитектуру решений.',
    },
    projectsPage: {
      title: 'IT проекты',
      lead:
        'Подборка наших продуктовых и прикладных решений. Ниже — краткое описание функционала, особенности реализации и характеристики.',
      repo: 'GitHub',
      demo: 'Демо',
      stack: 'Стек',
      highlights: 'Характеристики',
      capabilities: 'Функциональность',
    },
    projectsData: [
      {
        id: 'zadachnik',
        name: 'Задачник — Pipeline',
        short:
          'Рабочий конвейер по распределению задач: роли, статусы, регионы, приоритеты и контроль исполнения.',
        stack: ['JavaScript', 'SPA', 'Local storage / IndexedDB'],
        highlights: [
          { label: 'Тип', value: 'таск‑менеджмент / операционный pipeline' },
          { label: 'Фокус', value: 'скорость распределения и прозрачность исполнения' },
        ],
        capabilities: [
          'Ролевая модель доступа',
          'Распределение по регионам',
          'Статусы/приоритеты, история и комментарии',
          'KPI/аналитика по задачам и исполнителям',
        ],
        githubUrl: 'https://github.com/jfsagro-glitch/zadachnik',
        demoUrl: 'https://jfsagro-glitch.github.io/zadachnik/',
      },
      {
        id: 'botvot',
        name: 'BOTVOT — Платформа для продажи и проведения курса в Telegram',
        short:
          'Платформа для продажи и проведения курса в Telegram на Python. Два бота: sales_bot для воронки/тарифов/оплаты/доступа и course_bot для уроков/навигации/общения.',
        stack: ['Python', 'Telegram Bot API', 'SQLite/aiosqlite', 'Docker', 'Railway'],
        highlights: [
          { label: 'Тип', value: 'платформа онлайн‑обучения / два бота' },
          { label: 'Архитектура', value: 'модульная (sales_bot + course_bot + сервисный слой)' },
        ],
        capabilities: [
          'Два бота: sales_bot (воронка/тарифы/оплата/доступ) и course_bot (уроки/навигация/общение)',
          'Контент и прогресс: БД (SQLite/aiosqlite) + сервисный слой (пользователи, уроки, задания, рефералы, доступ в группы)',
          'Домашки и фидбек: прием заданий, маршрутизация админам, отправка обратной связи (по тарифу)',
          'Платежи: плагинная архитектура (payment/), мок для dev, инструкции по деплою (Docker/Railway/Procfile)',
        ],
        githubUrl: 'https://github.com/jfsagro-glitch/botvot',
      },
      {
        id: 'cms',
        name: 'CMS — Система управления залогами',
        short:
          'Корпоративная веб‑система для управления залоговым имуществом банков и финансовых организаций. 18 модулей: реестры, досье, оценка с ИИ, мониторинг, задачи, аналитика и отчётность.',
        stack: [
          'TypeScript',
          'React 18',
          'Ant Design 5',
          'Redux Toolkit',
          'Dexie (IndexedDB)',
          'Vite',
          'AI (DeepSeek)',
        ],
        highlights: [
          { label: 'Тип', value: 'корпоративная система / управление залогами' },
          { label: 'Архитектура', value: 'offline-first (IndexedDB) / 18 модулей / AI‑оценка' },
        ],
        capabilities: [
          'Реестр объектов: 60+ типов залогов с 3-уровневой классификацией, динамические формы (150+ полей), многостраничные карточки, иерархический ввод адресов',
          'AI‑оценка: автоматическая оценка с методами доходного/сравнительного/затратного подходов, расчёт LTV и залоговой стоимости, экспорт PDF отчётов',
          'Модули: портфель, досье, задачи (Zadachnik), KPI/аналитика, отчёты, страхование, ФНП, мониторинг, дистанционные осмотры (CMS_check), ЕГРН',
          'Справочная с ИИ: консультации на базе DeepSeek, база знаний (VND), режим экспертизы, самообучение системы, история чатов',
          'Данные: экспорт/импорт Excel, массовые операции, резервное копирование, миграция данных, валидация и история изменений',
        ],
        githubUrl: 'https://github.com/jfsagro-glitch/CMS',
        demoUrl: 'https://cmsauto.ru/cms',
      },
      {
        id: 'cms-check',
        name: 'CMS_check — Дистанционные осмотры',
        short:
          'Сервис дистанционных осмотров объектов: чек‑листы, фотофиксация, геолокация, отчёты и контроль качества.',
        stack: ['TypeScript', 'React', 'Mobile-first'],
        highlights: [
          { label: 'Тип', value: 'мобильный сервис осмотров' },
          { label: 'Каналы', value: 'фото + геометки + структурированные проверки' },
        ],
        capabilities: [
          'Мобильный интерфейс и чек‑листы',
          'Фотофиксация и геолокация',
          'История осмотров и формирование отчётов',
          'Интеграция с основной CMS',
        ],
        githubUrl: 'https://github.com/jfsagro-glitch/CMS_chek',
        demoUrl: 'https://jfsagro-glitch.github.io/CMS_chek/',
      },
      {
        id: 'carshop-website',
        name: 'CarExport — Авто из Грузии',
        short:
          'Маркетинговый сайт для сервиса подбора и доставки автомобилей: каталог, фильтры, формы заявок и калькуляторы.',
        stack: ['HTML', 'CSS', 'JavaScript'],
        highlights: [
          { label: 'Тип', value: 'маркетинговый сайт / лидогенерация' },
          { label: 'Фокус', value: 'конверсия в заявку и удобный каталог' },
        ],
        capabilities: [
          'Каталог и фильтры',
          'Формы заявок и обратной связи',
          'Калькуляторы/информационные блоки',
          'Адаптивная верстка',
        ],
        githubUrl: 'https://github.com/jfsagro-glitch/carshop-website',
        demoUrl: 'https://cmsauto.store/index.html#catalog',
      },
    ],
    servicesData: [
      {
        key: 'audit',
        title: 'Аудит процессов',
        short:
          'Находим узкие места, потери и риски. Даём карту процессов, список приоритетов и расчёт экономического эффекта.',
        when: [
          'Нет прозрачной картины “где теряем деньги и время”',
          'Автоматизация стартует “с инструментов”, а не с цели',
          'Сильно зависит от ключевых сотрудников',
        ],
        whatYouGet: [
          'Карта процессов AS‑IS / TO‑BE (с метриками и владельцами)',
          'Реестр проблем/потерь + приоритизация по эффекту/сложности',
          'Roadmap 6–12 недель (что делать первым, что позже)',
          'Финансовая модель эффекта (экономия/рост/риски)',
        ],
      },
      {
        key: 'architecture',
        title: 'Архитектура автоматизации',
        short:
          'Проектируем целевую архитектуру: роли, данные, интеграции, безопасность и эксплуатацию. Чтобы внедрение не “рассыпалось”.',
        when: [
          'Есть разрозненные решения и ручные “костыли”',
          'Нужны интеграции и единые правила данных',
          'Важно снижение рисков и управляемость изменений',
        ],
        whatYouGet: [
          'Целевая архитектура (данные → интеграции → автоматизация)',
          'Контуры безопасности и контроля доступа',
          'Техническое и процессное ТЗ для внедрения',
          'План внедрения по этапам с KPI',
        ],
      },
      {
        key: 'rpa-ai',
        title: 'RPA и AI',
        short:
          'Убираем ручные операции, ускоряем обработку, повышаем качество данных. AI — там, где он даёт эффект, а не “для галочки”.',
        when: [
          'Много повторяемых операций и “копипаста”',
          'Нужно быстрее обрабатывать заявки/документы',
          'Качество данных страдает из‑за ручного ввода',
        ],
        whatYouGet: [
          'Роботы/агенты для регламентных операций',
          'AI‑помощники (классификация/извлечение/подсказки)',
          'Контроль качества и журналирование',
          'Метрики: скорость, качество, стоимость операции',
        ],
      },
      {
        key: 'bi-integrations',
        title: 'BI и интеграции',
        short:
          'Сквозная аналитика и “единая версия правды”: данные, витрины, отчётность, интеграции между системами и командами.',
        when: [
          'Сложно ответить “что происходит в бизнесе сейчас”',
          'Отчёты собираются вручную и расходятся',
          'Системы не “разговаривают” между собой',
        ],
        whatYouGet: [
          'Карта данных и источников + правила качества',
          'Интеграции и витрины данных под управленческие решения',
          'Набор KPI/дашбордов для собственника/CEO/COO',
          'Регламент обновления и ответственности',
        ],
      },
      {
        key: 'support',
        title: 'Сопровождение',
        short:
          'Не бросаем после запуска: SLA/качество, улучшения, контроль эффективности, обучение и передача знаний команде.',
        when: [
          'Нужно поддерживать стабильность и качество',
          'Требуются регулярные улучшения процесса',
          'Важно снижение зависимости от подрядчика',
        ],
        whatYouGet: [
          'Поддержка и развитие по согласованному плану',
          'Мониторинг KPI эффекта и качества',
          'Документация, обучение и передача компетенций',
          'Прозрачная очередь задач и регулярные отчёты',
        ],
      },
    ],
    casesData: [
      {
        id: 'ops-cycle',
        industry: 'B2B‑сервис',
        companySize: '80 сотрудников',
        timeline: '8 недель',
        task:
          'Сократить цикл обработки заявки и убрать ручные операции между отделами без потери качества и контроля.',
        solution: [
          'Аудит “сквозного” процесса от лида до акта',
          'Целевая архитектура: данные, роли, точки контроля',
          'Автоматизация согласований + интеграции между системами',
          'Единый контур KPI по этапам',
        ],
        result: [
          { label: 'Время обработки', value: '−35–45%' },
          { label: 'Доля возвратов на доработку', value: '−20–30%' },
          { label: 'Прозрачность статуса для руководства', value: 'в режиме “сейчас”' },
        ],
        economicEffect: 'Экономия 0.8–1.5 млн ₽/квартал за счёт снижения трудозатрат и простоев.',
        note: 'Пример обезличен, цифры — из расчёта модели эффекта и факта пилота.',
      },
      {
        id: 'finance-docs',
        industry: 'Финансы',
        companySize: '200+ сотрудников',
        timeline: '10 недель',
        task:
          'Ускорить обработку документов и снизить операционные риски: ошибки, ручные правки, отсутствие трассировки решений.',
        solution: [
          'Нормализация данных и правила качества',
          'RPA для регламентных операций',
          'AI‑извлечение ключевых полей + валидации',
          'Журналирование и контроль доступа',
        ],
        result: [
          { label: 'Скорость обработки', value: '×1.6–2.1' },
          { label: 'Ошибки ручного ввода', value: '−50–70%' },
          { label: 'Аудит‑след', value: '100% операций' },
        ],
        economicEffect:
          'Снижение операционных потерь и рисков на 1.2–2.4 млн ₽/квартал (по модели + контрольным замерам).',
      },
      {
        id: 'bi-owner',
        industry: 'Производство/дистрибуция',
        companySize: '120 сотрудников',
        timeline: '6 недель',
        task:
          'Собственнику и COO нужен единый набор управленческих KPI: продажи, маржинальность, производство, просрочки — без ручных Excel.',
        solution: [
          'Карта данных + единые определения показателей',
          'Интеграции и витрина данных',
          'Дашборды под роли: собственник / CEO / COO',
          'Регламент обновления и ответственности',
        ],
        result: [
          { label: 'Сбор отчётности', value: 'с дней до часов' },
          { label: 'Согласованность цифр', value: 'единая “версия правды”' },
          { label: 'Скорость управленческих решений', value: 'выше за счёт актуальности данных' },
        ],
        economicEffect: 'Ускорение реакции на отклонения и снижение потерь от “слепых зон”.',
      },
    ],
    offer: {
      title: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ',
      subtitle: 'Аудит бизнес-процессов и точек автоматизации',
      brandLine: 'CMS — Corporate Management Systems',
      sections: [
        {
          title: '1. ЗАЧЕМ ЭТО НУЖНО БИЗНЕСУ (ВСТУПЛЕНИЕ)',
          body: [
            'В большинстве компаний проблемы управления проявляются не сразу. Они накапливаются в виде:',
            { bullets: ['ручных операций,', 'несогласованных процессов,', 'зависимости от ключевых сотрудников,', 'разрозненных IT-систем,', 'управленческих решений, принимаемых «вслепую».'] },
            'Автоматизация без предварительного анализа часто усиливает хаос, а не устраняет его.',
            'Аудит CMS — это управленческая диагностика, цель которой:',
            { bullets: ['увидеть бизнес как систему,', 'выявить точки потерь и рисков,', 'сформировать архитектуру автоматизации с измеримым эффектом.'] },
          ],
        },
        {
          title: '2. ЧТО ТАКОЕ АУДИТ CMS',
          body: [
            'Аудит бизнес-процессов и точек автоматизации — это структурированный анализ ключевых процессов, данных и управленческих контуров компании с последующим формированием:',
            { bullets: ['карты процессов «как есть»,', 'карты потерь и ограничений,', 'целевой архитектуры «как должно быть»,', 'пошагового плана автоматизации и роботизации.'] },
            'Аудит не предполагает внедрение. Он создаёт основу для управляемых решений.',
          ],
        },
        {
          title: '3. КАК МЫ РАБОТАЕМ (ЭТАПЫ)',
          body: [
            'Этап 1. Системная диагностика',
            { bullets: ['интервью с собственником / топ-менеджментом', 'анализ ключевых бизнес-процессов', 'анализ управленческой модели и данных'] },
            'Цель: понять реальную логику работы бизнеса, а не формальные регламенты.',
            'Этап 2. Выявление потерь и рисков',
            { bullets: ['ручные и дублирующие операции', 'зависимость от людей', 'узкие места в процессах', 'зоны управленческой непрозрачности'] },
            'Цель: зафиксировать, где бизнес теряет деньги, время и контроль.',
            'Этап 3. Архитектура автоматизации',
            { bullets: ['какие процессы автоматизировать', 'какие решения действительно нужны', 'приоритеты внедрения', 'где автоматизация даст эффект, а где — риск'] },
            'Цель: не «оцифровать», а выстроить управляемую систему.',
            'Этап 4. Экономический эффект',
            { bullets: ['оценка потенциального ROI', 'снижение операционных издержек', 'эффект на масштабируемость и контроль'] },
            'Этап 5. Итоговый отчёт',
            'Вы получаете:',
            { bullets: ['визуальную схему процессов', 'карту потерь и рисков', 'целевую архитектуру', 'roadmap внедрения (этапы, сроки, логика)'] },
          ],
        },
        {
          title: '4. ЧТО ПОЛУЧАЕТ КЛИЕНТ',
          body: [
            'По итогам аудита у вас есть:',
            { bullets: ['✔ прозрачная картина бизнеса', '✔ понимание, что мешает росту', '✔ чёткий план автоматизации', '✔ основа для принятия управленческих решений', '✔ возможность привлекать подрядчиков без потери контроля'] },
          ],
        },
        {
          title: '5. ДЛЯ КОГО ЭТО ПОДХОДИТ',
          body: [
            { bullets: ['компании от 20 до 300+ сотрудников', 'бизнес с оборотом от 150 млн ₽', 'собственники и CEO, которым важны:', 'контроль,', 'предсказуемость,', 'снижение рисков,', 'масштабируемость'] },
          ],
        },
        {
          title: '6. ФОРМАТ И СРОКИ',
          body: [{ bullets: ['Срок: 2–4 недели', 'Формат: интервью + анализ + отчёт', 'Участие клиента: минимальное, точечное'] }],
        },
        {
          title: '7. СТОИМОСТЬ',
          body: [
            'Стоимость аудита формируется индивидуально и зависит от:',
            { bullets: ['масштаба бизнеса,', 'количества процессов,', 'глубины анализа.'] },
            'Ориентир: 👉 от 300 000 ₽',
            '(Стоимость всегда ниже потенциального эффекта от внедрения.)',
          ],
        },
        {
          title: '8. ЧТО ДАЛЬШЕ',
          body: [
            'По результатам аудита вы можете:',
            { bullets: ['реализовать roadmap самостоятельно,', 'привлечь подрядчиков,', 'продолжить работу с CMS в формате сопровождения.'] },
            '👉 Аудит не создаёт обязательств, но даёт контроль.',
          ],
        },
      ],
      strongPhraseTitle: '',
      strongPhrase:
        'Мы не продаём автоматизацию. Мы помогаем бизнесу увидеть себя таким, какой он есть, и выстроить управляемую архитектуру роста.',
    },
    brand: {
      kicker: '',
      title: 'CMS — Corporate Management Systems',
      story: {
        intro:
          'CMS сформировалась не из операционного управления отдельным бизнесом, а из длительного системного анализа того, как бизнесы работают, развиваются и терпят неудачи.',
        paragraphs: [
          'Более 20 лет практики анализа корпоративных и средних бизнесов в банковской и финансовой среде позволили нам увидеть бизнес на уровне структуры, процессов и рисков, а не только с позиции собственника или линейного менеджмента.',
          'Через наши оценки, модели и решения прошли сотни компаний разных отраслей и масштабов — от быстрорастущих до тех, кто не выдержал нагрузки и ушёл с рынка.',
        ],
        observedTitle: 'Мы наблюдали бизнесы:',
        observedItems: [
          'в фазах активного роста,',
          'при масштабировании,',
          'в периодах турбулентности,',
          'на грани финансовых и операционных разрывов,',
          'в ситуациях реструктуризации и банкротства.',
        ],
        insight:
          'Этот опыт дал нам редкое понимание того, какие управленческие и процессные решения действительно работают, а какие создают иллюзию контроля.',
        systemTitle: 'CMS работает с бизнесом как с системой, где:',
        systemItems: [
          'процессы связаны между собой,',
          'ошибки накапливаются незаметно,',
          'автоматизация без архитектуры усиливает хаос.',
        ],
        positionParagraphs: [
          'Мы не внедряем технологии ради цифровизации.',
          'Мы анализируем логику процессов, точки риска и потерь, и только после этого проектируем архитектуру автоматизации — от регламентов и данных до IT-решений.',
          'Автоматизация, RPA, BI и AI для нас — инструменты повышения управляемости, а не цель.',
          'Наша задача — помочь собственникам и управленческим командам видеть бизнес целиком, принимать решения на основе данных и снижать системные риски.',
        ],
        closing:
          'CMS — это партнёр для компаний, которым нужен взгляд со стороны, опыт системной оценки и архитектура устойчивого развития.',
      },
      shortVersionTitle: '',
      shortVersionLines: [
        'CMS — Corporate Management Systems',
        'Системный анализ бизнес-процессов и архитектура автоматизации.',
        'Основано на 20+ годах практики оценки, анализа и сопровождения бизнесов в финансовой и корпоративной среде.',
      ],
      ceoTitle: 'Ключевые тезисы CMS',
      ceoLines: [
        'Мы не управляли бизнесами вместо собственников.',
        'Мы 20 лет наблюдали, анализировали и оценивали, какие бизнесы выживают, масштабируются или рушатся — и почему.',
        'Этот опыт мы переводим в управляемую архитектуру процессов и автоматизацию.',
      ],
    },
    auditModal: {
      title: 'Получить аудит процессов',
      intro:
        'Коротко опишите ситуацию — мы вернёмся с вопросами и предложим формат аудита, сроки и ожидаемый эффект.',
      name: { label: 'Имя', placeholder: 'Иван', required: 'Укажите имя' },
      company: { label: 'Компания', placeholder: 'ООО «Компания»', required: 'Укажите компанию' },
      role: { label: 'Роль', placeholder: 'Выберите' },
      roleOptions: [
        { value: 'owner', label: 'Собственник' },
        { value: 'ceo', label: 'CEO' },
        { value: 'coo', label: 'COO / операционный директор' },
        { value: 'cfo', label: 'CFO / финдиректор' },
        { value: 'it', label: 'IT / Digital' },
        { value: 'other', label: 'Другое' },
      ],
      email: {
        label: 'Email',
        placeholder: 'name@company.ru',
        required: 'Укажите email',
        invalid: 'Некорректный email',
      },
      phone: { label: 'Телефон', placeholder: '+7 ...' },
      goal: {
        label: 'Что хотите улучшить (цель, процесс, боль)',
        placeholder:
          'Например: сократить цикл обработки заявок, снизить ручной ввод, получить прозрачные KPI для COO...',
        required: 'Опишите цель',
      },
      direct: 'Если удобнее — напишите напрямую:',
    },
  };

  const en: MarketingCopy = {
    nav: { home: 'Home', services: 'Services', cases: 'Cases', projects: 'IT Projects', about: 'About CMS' },
    links: { readFullLegend: 'Learn more →' },
    cta: {
      getAudit: 'Get a process audit',
      getOffer: 'Get a commercial proposal',
      downloadPdf: 'Download PDF',
      send: 'Send',
      cancel: 'Cancel',
    },
    footer: {
      title: 'CMS (Corporate Management Systems)',
      tagline: 'Digital agency for business process automation & RPA',
    },
    home: {
      audience: 'For owners and CEO/COO teams in companies of 20–300+ employees',
      heroTitle: 'Digital agency for business process automation & RPA',
      heroSubtitle:
        'We start with a process audit, design an automation architecture, and deliver measurable business outcomes.',
      heroMeta: [
        { label: 'Focus', value: 'Business outcomes' },
        { label: 'Approach', value: 'Audit → Architecture → Delivery' },
        { label: 'Output', value: 'KPIs, plan, impact model' },
      ],
      brandTeaserLink: 'Learn more →',
      diagram: {
        businessGoal: 'Business goal',
        businessGoalSub: 'impact / KPI',
        processes: 'Processes',
        processesSub: 'roles / control',
        data: 'Data',
        dataSub: 'quality / marts',
        automation: 'Integrations + automation',
        automationSub: 'RPA / AI / BI',
        caption: 'Principle: architecture & impact first, tools second.',
      },
      auditTitle: 'Process audit is the core product',
      auditLead:
        'You receive an executive document: what to change, in what order, and what impact it will produce. Tools come second.',
      auditLookTitle: 'What we assess',
      auditLookBullets: [
        'end-to-end processes and control points',
        'data: quality, sources, gaps',
        'unit economics of operations and time losses',
        'risks: errors, compliance, people dependency',
      ],
      auditDeliverTitle: 'What you get',
      auditDeliverBullets: [
        'AS‑IS / TO‑BE with metrics and owners',
        'initiative backlog with priorities',
        'architecture principles and contours',
        'roadmap and financial impact model',
      ],
      servicesTitle: 'Services',
      servicesAllLink: 'View all',
      howWeWorkTitle: 'How we work',
      howWeWork: [
        { title: 'Diagnostics', text: 'Interviews, data, facts, AS‑IS map.' },
        { title: 'Impact model', text: 'Where savings/growth are, which KPIs change, which risks close.' },
        { title: 'Architecture', text: 'TO‑BE, data, integrations, automation, operations.' },
        { title: 'Pilot → scale', text: 'Fast outcomes and quality control.' },
      ],
      whyTrustTitle: 'Why executives trust us',
      whyTrust: [
        { title: 'Transparency', text: 'We define the goal, KPIs and acceptance criteria up front.' },
        { title: 'Architecture', text: 'We build a sustainable system: data, roles, control — not just “bots”.' },
        { title: 'Knowledge transfer', text: 'Documentation and training to reduce vendor dependency.' },
      ],
      ctaBandTitle: 'Ready to start with an audit?',
      ctaBandText: 'Describe your goal — we’ll propose the format, timeline, and expected economic impact.',
      viewCases: 'View cases',
      viewAll: 'View all',
    },
    servicesPage: {
      title: 'Services',
      lead:
        'We work as consultants and solution architects: start with diagnosis and impact, then design architecture and deliver change.',
      whenNeeded: 'When it’s needed',
      whatYouGet: 'What you get',
      ctaTitle: 'Need a starting point?',
      ctaText: 'A process audit helps you define goals, KPIs, and an actionable plan.',
    },
    casesPage: {
      title: 'Cases',
      lead: 'Format: Task → Solution → Result. Focus on economic impact, metrics, and controllability.',
      task: 'Task',
      solution: 'Solution',
      result: 'Result',
      ctaTitle: 'Want the same analysis for your company?',
      ctaText: 'We’ll start with an audit: define goals, quantify losses, and produce an implementation roadmap.',
    },
    aboutPage: {
      ctaBandTitle: 'Need an outside perspective?',
      ctaBandText: 'Start with an audit: define the goal, quantify losses, and build solution architecture.',
    },
    projectsPage: {
      title: 'IT Projects',
      lead:
        'A selection of our product and delivery work. Below are concise descriptions of functionality, implementation highlights, and key characteristics.',
      repo: 'GitHub',
      demo: 'Demo',
      stack: 'Stack',
      highlights: 'Highlights',
      capabilities: 'Capabilities',
    },
    projectsData: [
      {
        id: 'zadachnik',
        name: 'Zadachnik — Pipeline',
        short:
          'An operational task distribution pipeline: roles, statuses, regions, priorities, and execution control.',
        stack: ['JavaScript', 'SPA', 'Local storage / IndexedDB'],
        highlights: [
          { label: 'Type', value: 'task management / operations pipeline' },
          { label: 'Focus', value: 'fast assignment and execution visibility' },
        ],
        capabilities: [
          'Role-based access model',
          'Region-based distribution',
          'Statuses/priorities, history and comments',
          'KPI/analytics by tasks and executors',
        ],
        githubUrl: 'https://github.com/jfsagro-glitch/zadachnik',
        demoUrl: 'https://jfsagro-glitch.github.io/zadachnik/',
      },
      {
        id: 'botvot',
        name: 'BOTVOT — Telegram Course Platform',
        short:
          'Platform for selling and conducting courses in Telegram on Python. Two bots: sales_bot for funnel/tariffs/payment/access and course_bot for lessons/navigation/communication.',
        stack: ['Python', 'Telegram Bot API', 'SQLite/aiosqlite', 'Docker', 'Railway'],
        highlights: [
          { label: 'Type', value: 'online learning platform / two bots' },
          { label: 'Architecture', value: 'modular (sales_bot + course_bot + service layer)' },
        ],
        capabilities: [
          'Two bots: sales_bot (funnel/tariffs/payment/access) and course_bot (lessons/navigation/communication)',
          'Content and progress: DB (SQLite/aiosqlite) + service layer (users, lessons, assignments, referrals, group access)',
          'Homework and feedback: assignment submission, admin routing, feedback delivery (by tariff)',
          'Payments: plugin architecture (payment/), mock for dev, deployment instructions (Docker/Railway/Procfile)',
        ],
        githubUrl: 'https://github.com/jfsagro-glitch/botvot',
      },
      {
        id: 'cms',
        name: 'CMS — Collateral Management System',
        short:
          'Corporate web system for managing collateral assets for banks and financial institutions. 18 modules: registries, dossiers, AI appraisal, monitoring, tasks, analytics, and reporting.',
        stack: [
          'TypeScript',
          'React 18',
          'Ant Design 5',
          'Redux Toolkit',
          'Dexie (IndexedDB)',
          'Vite',
          'AI (DeepSeek)',
        ],
        highlights: [
          { label: 'Type', value: 'corporate system / collateral management' },
          { label: 'Architecture', value: 'offline-first (IndexedDB) / 18 modules / AI appraisal' },
        ],
        capabilities: [
          'Object registry: 60+ collateral types with 3-level classification, dynamic forms (150+ fields), multi-page cards, hierarchical address input',
          'AI appraisal: automated valuation with income/comparative/cost approaches, LTV calculation, collateral value assessment, PDF report export',
          'Modules: portfolio, dossiers, tasks (Zadachnik), KPI/analytics, reports, insurance, FNP, monitoring, remote inspections (CMS_check), EGRN',
          'AI reference: DeepSeek-based consultations, knowledge base (VND), expertise mode, system self-learning, chat history',
          'Data: Excel import/export, bulk operations, backup/restore, data migration, validation, and change history',
        ],
        githubUrl: 'https://github.com/jfsagro-glitch/CMS',
        demoUrl: 'https://cmsauto.ru/cms',
      },
      {
        id: 'cms-check',
        name: 'CMS_check — Remote inspections',
        short:
          'Remote inspection service: checklists, photo evidence, geolocation, reports, and quality control.',
        stack: ['TypeScript', 'React', 'Mobile-first'],
        highlights: [
          { label: 'Type', value: 'mobile inspection service' },
          { label: 'Signals', value: 'photos + geo tags + structured checks' },
        ],
        capabilities: [
          'Mobile UI and checklists',
          'Photo capture and geolocation',
          'Inspection history and reporting',
          'Integration with the main CMS',
        ],
        githubUrl: 'https://github.com/jfsagro-glitch/CMS_chek',
        demoUrl: 'https://jfsagro-glitch.github.io/CMS_chek/',
      },
      {
        id: 'carshop-website',
        name: 'CarExport — Cars from Georgia',
        short:
          'Marketing website for car sourcing and delivery: catalog, filters, request forms, and calculators.',
        stack: ['HTML', 'CSS', 'JavaScript'],
        highlights: [
          { label: 'Type', value: 'marketing site / lead generation' },
          { label: 'Focus', value: 'conversion to request and usable catalog' },
        ],
        capabilities: [
          'Catalog and filters',
          'Lead forms and contact flows',
          'Calculators / informational blocks',
          'Responsive layout',
        ],
        githubUrl: 'https://github.com/jfsagro-glitch/carshop-website',
        demoUrl: 'https://cmsauto.store/index.html#catalog',
      },
    ],
    servicesData: [
      {
        key: 'audit',
        title: 'Process audit',
        short:
          'We identify bottlenecks, losses, and risks. You get a process map, prioritized initiatives, and an impact model.',
        when: [
          'No clear view of where money and time are lost',
          'Automation starts from tools, not from goals',
          'High dependency on key employees',
        ],
        whatYouGet: [
          'AS‑IS / TO‑BE maps (with metrics and owners)',
          'Loss/risk register + prioritization by impact/effort',
          '6–12 week roadmap (what first, what later)',
          'Financial impact model (savings/growth/risks)',
        ],
      },
      {
        key: 'architecture',
        title: 'Automation architecture',
        short:
          'We design the target architecture: roles, data, integrations, security and operations — so delivery doesn’t “fall apart”.',
        when: [
          'Fragmented solutions and manual workarounds',
          'Need integrations and consistent data rules',
          'Risk reduction and change controllability matter',
        ],
        whatYouGet: [
          'Target architecture (data → integrations → automation)',
          'Security and access control contours',
          'Technical & process requirements for delivery',
          'Phased implementation plan with KPIs',
        ],
      },
      {
        key: 'rpa-ai',
        title: 'RPA & AI',
        short:
          'We remove manual operations, speed up processing, and improve data quality. AI is used only where it produces impact.',
        when: [
          'Many repetitive operations',
          'Need faster document/application processing',
          'Data quality suffers due to manual entry',
        ],
        whatYouGet: [
          'Bots/agents for routine operations',
          'AI assistants (classification/extraction/suggestions)',
          'Quality control and logging',
          'Metrics: speed, quality, cost per operation',
        ],
      },
      {
        key: 'bi-integrations',
        title: 'BI & integrations',
        short:
          'End-to-end analytics and a single source of truth: data, marts, reporting, and integrations across systems and teams.',
        when: [
          'Hard to answer “what is happening right now”',
          'Reports are manual and inconsistent',
          'Systems don’t “talk” to each other',
        ],
        whatYouGet: [
          'Data/source map + data quality rules',
          'Integrations and data marts for executive decisions',
          'KPI dashboards for owner/CEO/COO',
          'Update/ownership governance',
        ],
      },
      {
        key: 'support',
        title: 'Support',
        short:
          'We stay after launch: SLA/quality, improvements, effectiveness control, training and knowledge transfer.',
        when: [
          'Need stable operations and quality',
          'Continuous process improvements required',
          'Reducing vendor dependency is important',
        ],
        whatYouGet: [
          'Support and development under an agreed plan',
          'Monitoring of KPIs and quality',
          'Documentation, training and capability transfer',
          'Transparent backlog and regular reporting',
        ],
      },
    ],
    casesData: [
      {
        id: 'ops-cycle',
        industry: 'B2B services',
        companySize: '80 employees',
        timeline: '8 weeks',
        task:
          'Reduce request processing lead time and remove manual handoffs between teams without losing quality and control.',
        solution: [
          'End-to-end audit from lead to delivery',
          'Target architecture: data, roles, control points',
          'Approval automation + system integrations',
          'Unified KPI loop across stages',
        ],
        result: [
          { label: 'Lead time', value: '−35–45%' },
          { label: 'Rework share', value: '−20–30%' },
          { label: 'Executive visibility', value: 'real-time' },
        ],
        economicEffect: 'Savings of 0.8–1.5M ₽ per quarter by reducing labor and idle time.',
        note: 'Example is anonymized; figures are based on the impact model and pilot measurements.',
      },
      {
        id: 'finance-docs',
        industry: 'Finance',
        companySize: '200+ employees',
        timeline: '10 weeks',
        task:
          'Speed up document processing and reduce operational risks: errors, manual edits, lack of traceability.',
        solution: [
          'Data normalization and quality rules',
          'RPA for routine operations',
          'AI extraction of key fields + validations',
          'Logging and access control',
        ],
        result: [
          { label: 'Processing speed', value: '×1.6–2.1' },
          { label: 'Manual entry errors', value: '−50–70%' },
          { label: 'Audit trail', value: '100% of operations' },
        ],
        economicEffect: 'Reduced losses and risks by 1.2–2.4M ₽ per quarter (model + control measures).',
      },
      {
        id: 'bi-owner',
        industry: 'Manufacturing / distribution',
        companySize: '120 employees',
        timeline: '6 weeks',
        task:
          'Owner and COO needed a single set of executive KPIs: sales, margin, production, overdue — without manual spreadsheets.',
        solution: [
          'Data map + unified metric definitions',
          'Integrations and data mart',
          'Dashboards by role: owner / CEO / COO',
          'Update and ownership governance',
        ],
        result: [
          { label: 'Reporting', value: 'from days to hours' },
          { label: 'Consistency', value: 'single source of truth' },
          { label: 'Decision speed', value: 'higher due to fresh data' },
        ],
        economicEffect: 'Faster reaction to deviations and reduced losses from blind spots.',
      },
    ],
    offer: {
      title: 'COMMERCIAL PROPOSAL',
      subtitle: 'Business process audit & automation opportunities',
      brandLine: 'CMS — Corporate Management Systems',
      sections: [
        {
          title: '1. WHY YOUR BUSINESS NEEDS THIS',
          body: [
            'In most companies, management issues do not appear instantly. They accumulate as:',
            {
              bullets: [
                'manual operations,',
                'misaligned processes,',
                'dependency on key employees,',
                'fragmented IT systems,',
                'management decisions made “blind”.',
              ],
            },
            'Automation without prior analysis often amplifies chaos instead of eliminating it.',
            'CMS Audit is an executive diagnostic aimed to:',
            { bullets: ['see the business as a system,', 'identify points of loss and risk,', 'build an automation architecture with measurable impact.'] },
          ],
        },
        {
          title: '2. WHAT CMS AUDIT IS',
          body: [
            'A structured analysis of key processes, data and governance loops resulting in:',
            { bullets: ['AS‑IS process map,', 'losses & constraints map,', 'TO‑BE target architecture,', 'step-by-step automation & RPA roadmap.'] },
            'The audit does not include implementation. It creates a foundation for controlled decisions.',
          ],
        },
        {
          title: '3. HOW WE WORK (STAGES)',
          body: [
            'Stage 1. System diagnostics',
            { bullets: ['owner / top-management interviews', 'analysis of key business processes', 'analysis of operating model and data'] },
            'Goal: understand how the business really works, not formal regulations.',
            'Stage 2. Losses & risks',
            { bullets: ['manual and duplicate operations', 'people dependency', 'process bottlenecks', 'zones of management opacity'] },
            'Goal: document where you lose money, time and control.',
            'Stage 3. Automation architecture',
            { bullets: ['what to automate', 'what solutions are actually needed', 'implementation priorities', 'where automation helps vs creates risk'] },
            'Goal: build a manageable system, not just “digitize”.',
            'Stage 4. Economic impact',
            { bullets: ['ROI potential', 'operating cost reduction', 'impact on scalability and control'] },
            'Stage 5. Final report',
            'You receive:',
            { bullets: ['visual process scheme', 'losses & risks map', 'target architecture', 'implementation roadmap (stages, timelines, logic)'] },
          ],
        },
        {
          title: '4. WHAT YOU GET',
          body: [
            { bullets: ['clear picture of operations', 'what blocks growth', 'a concrete automation plan', 'basis for executive decisions', 'ability to engage vendors without losing control'] },
          ],
        },
        {
          title: '5. WHO IT FITS',
          body: [{ bullets: ['companies 20–300+ employees', 'revenue from ~150M ₽ equivalent', 'owners and CEOs who value control, predictability, risk reduction and scalability'] }],
        },
        {
          title: '6. FORMAT & TIMELINE',
          body: [{ bullets: ['Timeline: 2–4 weeks', 'Format: interviews + analysis + report', 'Client involvement: minimal and focused'] }],
        },
        {
          title: '7. PRICING',
          body: [
            'Pricing depends on scope, number of processes and depth of analysis.',
            'Reference point: from 300,000 ₽',
            '(Always below the potential implementation effect.)',
          ],
        },
        {
          title: '8. WHAT’S NEXT',
          body: [
            { bullets: ['implement the roadmap in-house', 'engage external vendors', 'continue with CMS in support mode'] },
            'The audit creates no obligations — it gives you control.',
          ],
        },
      ],
      strongPhraseTitle: '',
      strongPhrase:
        'We do not sell automation. We help a business see itself as it is and build a manageable architecture for growth.',
    },
    brand: {
      kicker: '',
      title: 'CMS — Corporate Management Systems',
      story: {
        intro:
          'CMS was not born from operational management of a single business, but from long-term, systematic analysis of how businesses operate, grow, and fail.',
        paragraphs: [
          'Over 20 years of analyzing corporate and mid-sized businesses in banking and finance allowed us to see a business through the lens of structure, processes, and risks — not only from the viewpoint of an owner or a line manager.',
          'Hundreds of companies across industries and sizes passed through our assessments, models, and solutions — from fast-growing businesses to those that could not withstand the load and exited the market.',
        ],
        observedTitle: 'We observed businesses:',
        observedItems: [
          'during periods of rapid growth,',
          'while scaling,',
          'in times of turbulence,',
          'on the edge of financial and operational gaps,',
          'during restructuring and bankruptcy situations.',
        ],
        insight:
          'This experience gave us a rare understanding of which managerial and process decisions truly work — and which only create an illusion of control.',
        systemTitle: 'CMS works with a business as a system, where:',
        systemItems: [
          'processes are interconnected,',
          'errors accumulate unnoticed,',
          'automation without architecture amplifies chaos.',
        ],
        positionParagraphs: [
          'We do not implement technology for the sake of “digitalization”.',
          'We analyze process logic, points of risk and loss, and only then design the automation architecture — from regulations and data to IT solutions.',
          'Automation, RPA, BI and AI are tools to increase manageability, not an end goal.',
          'Our task is to help owners and executive teams see the business as a whole, make decisions based on data, and reduce systemic risks.',
        ],
        closing:
          'CMS is a partner for companies that need an outside perspective, system-level assessment experience, and an architecture for sustainable growth.',
      },
      shortVersionTitle: '',
      shortVersionLines: [
        'CMS — Corporate Management Systems',
        'Systemic analysis of business processes and automation architecture.',
        'Built on 20+ years of assessment, analysis, and support in financial and corporate environments.',
      ],
      ceoTitle: 'CMS Key Points',
      ceoLines: [
        'We did not run businesses instead of owners.',
        'For 20 years we have observed, analyzed, and assessed which businesses survive, scale, or collapse — and why.',
        'We turn that experience into a manageable process architecture and automation.',
      ],
    },
    auditModal: {
      title: 'Get a process audit',
      intro:
        'Briefly describe your situation — we’ll follow up with questions and propose the audit format, timeline, and expected impact.',
      name: { label: 'Name', placeholder: 'John', required: 'Please enter your name' },
      company: { label: 'Company', placeholder: 'Company LLC', required: 'Please enter your company' },
      role: { label: 'Role', placeholder: 'Select' },
      roleOptions: [
        { value: 'owner', label: 'Owner' },
        { value: 'ceo', label: 'CEO' },
        { value: 'coo', label: 'COO / Operations' },
        { value: 'cfo', label: 'CFO / Finance' },
        { value: 'it', label: 'IT / Digital' },
        { value: 'other', label: 'Other' },
      ],
      email: {
        label: 'Email',
        placeholder: 'name@company.com',
        required: 'Please enter your email',
        invalid: 'Invalid email',
      },
      phone: { label: 'Phone', placeholder: '+1 ...' },
      goal: {
        label: 'What do you want to improve (goal, process, pain)',
        placeholder:
          'Example: reduce lead time, eliminate manual data entry, get transparent KPIs for COO...',
        required: 'Please describe your goal',
      },
      direct: 'Or email us directly:',
    },
  };

  return lang === 'ru' ? ru : en;
}

