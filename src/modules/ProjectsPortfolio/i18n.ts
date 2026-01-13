export type MarketingLang = 'ru' | 'en';

export type MarketingCopy = {
  nav: { home: string; services: string; cases: string; about: string };
  links: { readFullLegend: string };
  cta: { getAudit: string; send: string; cancel: string };
  footer: { title: string; tagline: string };
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
    cta: { getAudit: 'Получить аудит процессов', send: 'Отправить', cancel: 'Отмена' },
    footer: {
      title: 'CMS (Corporate Management Systems)',
      tagline: 'Digital agency for business process automation & RPA',
    },
    brand: {
      kicker: 'ОБНОВЛЁННАЯ ЛЕГЕНДА БРЕНДА CMS',
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
      shortVersionTitle: 'КОРОТКАЯ ВЕРСИЯ (ДЛЯ ПЕРВОГО ЭКРАНА)',
      shortVersionLines: [
        'CMS — Corporate Management Systems',
        'Системный анализ бизнес-процессов и архитектура автоматизации.',
        'Основано на 20+ годах практики оценки, анализа и сопровождения бизнесов в финансовой и корпоративной среде.',
      ],
      ceoTitle: 'ВЕРСИЯ ДЛЯ ПЕРЕГОВОРОВ С CEO',
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
    cta: { getAudit: 'Get a process audit', send: 'Send', cancel: 'Cancel' },
    footer: {
      title: 'CMS (Corporate Management Systems)',
      tagline: 'Digital agency for business process automation & RPA',
    },
    brand: {
      kicker: 'UPDATED CMS BRAND STORY',
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
      shortVersionTitle: 'SHORT VERSION (FOR THE FIRST SCREEN)',
      shortVersionLines: [
        'CMS — Corporate Management Systems',
        'Systemic analysis of business processes and automation architecture.',
        'Built on 20+ years of assessment, analysis, and support in financial and corporate environments.',
      ],
      ceoTitle: 'VERSION FOR CEO CONVERSATIONS',
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

