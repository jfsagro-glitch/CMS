export type MarketingLang = 'ru' | 'en';

export type MarketingCopy = {
  nav: { home: string; services: string; cases: string; about: string };
  links: { readFullLegend: string };
  cta: { getAudit: string; getOffer: string; downloadPdf: string; send: string; cancel: string };
  footer: { title: string; tagline: string };
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
    nav: { home: 'Главная', services: 'Услуги', cases: 'Кейсы', about: 'О CMS' },
    links: { readFullLegend: 'Читать полную легенду →' },
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
      ceoTitle: 'Для CEO: ключевые тезисы',
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
    nav: { home: 'Home', services: 'Services', cases: 'Cases', about: 'About CMS' },
    links: { readFullLegend: 'Read the full brand story →' },
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
      ceoTitle: 'For CEOs: key talking points',
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

