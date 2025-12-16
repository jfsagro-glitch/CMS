import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  DatabaseOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  CameraOutlined,
  MailOutlined,
  PhoneOutlined,
  LinkOutlined,
  ArrowRightOutlined,
  RocketOutlined,
  CodeOutlined,
  TeamOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import './ProjectsPortfolioPage.css';

const ProjectsPortfolioPage: React.FC = () => {
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Оптимизированный обработчик движения мыши с throttle
  const handleMouseMove = useCallback((e: MouseEvent) => {
    requestAnimationFrame(() => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    });
  }, []);

  // Оптимизированный обработчик скролла
  const handleScroll = useCallback(() => {
    requestAnimationFrame(() => {
      setScrollY(window.scrollY);
    });
  }, []);

  useEffect(() => {
    // Intersection Observer для анимации при скролле
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    // Наблюдаем за всеми элементами с классом animate-on-scroll
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => {
      if (observerRef.current) {
        observerRef.current.observe(el);
      }
    });

    // Изначально видимые элементы (hero section)
    setVisibleElements((prev) => {
      const newSet = new Set(prev);
      newSet.add('hero-logo');
      newSet.add('hero-text');
      return newSet;
    });

    // Добавляем обработчики событий
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleMouseMove, handleScroll]);

  const projects = [
    {
      id: 1,
      title: 'Банковская CRM',
      description: 'Комплексная банковская CRM-система для управления залоговым имуществом. Платформа предоставляет полный функционал для ведения учета, классификации и управления объектами залога в банковской сфере.',
      icon: <DatabaseOutlined />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      url: 'https://cmsauto.ru/#/registry',
      stats: { users: '500+', objects: '10K+', uptime: '99.9%' },
      features: [
        'Управление карточками залогового имущества',
        'Расширенная классификация объектов (60+ типов)',
        'Динамические формы с 150+ полями',
        'Многостраничная форма карточки',
        'Фильтрация, поиск и сортировка',
        'Экспорт/импорт в Excel',
        'Резервное копирование',
        'Интеграция с DaData API',
      ],
    },
    {
      id: 2,
      title: 'Онлайн Автосалон',
      description: 'Интернет-магазин автомобилей с расширенным каталогом и удобной системой поиска. Платформа для продажи автомобилей из различных регионов с полным циклом оформления документов.',
      icon: <ShoppingOutlined />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      url: 'https://cmsauto.store/index.html#catalog',
      stats: { cars: '5K+', regions: '5', orders: '1K+' },
      features: [
        'Каталог автомобилей с детальной информацией',
        'Расширенный поиск и фильтрация',
        'Каталоги из разных регионов',
        'Таможенный калькулятор',
        'Заявка на подбор автомобиля',
        'Самостоятельный просчет стоимости',
        'Система оформления заказов',
        'Контактная форма',
      ],
    },
    {
      id: 3,
      title: 'Задачник',
      description: 'Система управления задачами для сотрудников с поддержкой ролевой модели, распределения по регионам и автоматизации процессов. Платформа для эффективного управления рабочими задачами.',
      icon: <CheckCircleOutlined />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      url: 'https://jfsagro-glitch.github.io/zadachnik/',
      stats: { tasks: '50K+', users: '200+', regions: '4' },
      features: [
        'Управление задачами различных типов',
        'Ролевая модель доступа',
        'Распределение по регионам',
        'Система приоритетов и статусов',
        'Аналитика и KPI',
        'Автопилот для распределения',
        'Экспорт данных в CSV',
        'Комментарии и история',
      ],
    },
    {
      id: 4,
      title: 'Система дистанционных осмотров',
      description: 'Платформа для проведения дистанционных осмотров объектов залогового имущества. Система позволяет проводить осмотры через мобильные устройства с фотофиксацией и геолокацией.',
      icon: <CameraOutlined />,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      url: 'https://jfsagro-glitch.github.io/CMS_chek/',
      stats: { inspections: '20K+', mobile: '100%', accuracy: '99%' },
      features: [
        'Мобильный интерфейс',
        'Фотофиксация объектов',
        'Структурированные чек-листы',
        'Геолокация и привязка к адресу',
        'Электронная подпись',
        'Автоматическое формирование отчетов',
        'История осмотров',
        'Интеграция с CMS',
      ],
    },
  ];

  const stats = [
    { icon: <RocketOutlined />, value: '4', label: 'Проекта', color: '#0066cc' },
    { icon: <CodeOutlined />, value: '50K+', label: 'Строк кода', color: '#0099cc' },
    { icon: <TeamOutlined />, value: '500+', label: 'Пользователей', color: '#00cc99' },
    { icon: <TrophyOutlined />, value: '99.9%', label: 'Uptime', color: '#00ff99' },
  ];

  return (
    <div className="bitrix-portfolio-page">
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-content">
          <div className="brand-container">
            <img
              src="/logo.png"
              alt="CMS AUTO Logo"
              className={`hero-logo ${visibleElements.has('hero-logo') ? 'animate-fade-in-up' : ''}`}
              id="hero-logo"
              loading="lazy"
            />
            <div
              className={`hero-text ${visibleElements.has('hero-text') ? 'animate-fade-in-up-delay' : ''}`}
              id="hero-text"
            >
              <h1 className="hero-title">
                <span className="title-gradient">CMS AUTO</span>
                <div className="ai-badge">
                  <ThunderboltOutlined className="ai-icon" />
                  <span className="ai-text">AI</span>
                  <div className="ai-pulse-ring"></div>
                  <div className="ai-pulse-ring ai-pulse-ring-delay"></div>
                </div>
              </h1>
              <p className="hero-subtitle">Профессиональные решения для бизнеса</p>
              <div className="hero-stats">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="hero-stat-item"
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <div className="stat-icon" style={{ color: stat.color }}>
                      {stat.icon}
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{stat.value}</div>
                      <div className="stat-label">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="hero-animated-bg">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
          <div
            className="mouse-follower"
            style={{
              transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            }}
          ></div>
        </div>
        <div
          className="parallax-layer"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        ></div>
      </section>

      {/* Projects Section */}
      <section className="projects-section">
        <div className="section-container">
          <div className="section-header animate-on-scroll" id={`header-${Date.now()}`}>
            <h2 className="section-title">
              <span className="title-underline">Портфолио проектов</span>
            </h2>
            <p className="section-description">
              Ознакомьтесь с реализованными проектами и решениями
            </p>
          </div>

          <div className="projects-grid">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className={`project-card animate-on-scroll ${visibleElements.has(`project-${project.id}`) ? 'animate-fade-in-up' : ''}`}
                id={`project-${project.id}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="project-icon-wrapper" style={{ background: project.gradient }}>
                  <div className="project-icon icon-pulse">{project.icon}</div>
                  <div className="gradient-overlay"></div>
                  <div className="particles">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="particle" style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}></div>
                    ))}
                  </div>
                </div>
                <div className="project-content">
                  <h3 className="project-title">{project.title}</h3>
                  <p className="project-description">{project.description}</p>
                  
                  {/* Stats */}
                  <div className="project-stats">
                    {Object.entries(project.stats).map(([key, value]) => (
                      <div key={key} className="project-stat">
                        <div className="project-stat-value">{value}</div>
                        <div className="project-stat-label">{key}</div>
                      </div>
                    ))}
                  </div>

                  <div className="project-features">
                    <h4 className="features-title">Основные возможности:</h4>
                    <ul className="features-list">
                      {project.features.map((feature, index) => (
                        <li
                          key={index}
                          className="feature-item"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="project-footer">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      <span>Открыть проект</span>
                      <ArrowRightOutlined />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacts Section */}
      <section className="contacts-section">
        <div className="section-container">
          <h2 className="section-title">
            <span className="title-underline">Контактная информация</span>
          </h2>
          <div className="contacts-grid">
            <div
              className="contact-item animate-on-scroll"
              id="contact-1"
              style={{ animationDelay: '0s' }}
            >
              <div className="contact-icon-wrapper">
                <MailOutlined className="contact-icon icon-bounce" />
              </div>
              <div className="contact-info">
                <h4 className="contact-label">Email</h4>
                <a href="mailto:cmsauto@bk.ru" className="contact-value">
                  cmsauto@bk.ru
                </a>
              </div>
            </div>
            <div
              className="contact-item animate-on-scroll"
              id="contact-2"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="contact-icon-wrapper">
                <PhoneOutlined className="contact-icon icon-bounce" />
              </div>
              <div className="contact-info">
                <h4 className="contact-label">Телефон</h4>
                <a href="tel:+79154441208" className="contact-value">
                  +7 (915) 444-12-08
                </a>
              </div>
            </div>
            <div
              className="contact-item animate-on-scroll"
              id="contact-3"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="contact-icon-wrapper">
                <PhoneOutlined className="contact-icon icon-bounce" />
              </div>
              <div className="contact-info">
                <h4 className="contact-label">WhatsApp</h4>
                <a
                  href="https://wa.me/79184140636"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-value"
                >
                  +7 (918) 414-06-36
                </a>
              </div>
            </div>
            <div
              className="contact-item animate-on-scroll"
              id="contact-4"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="contact-icon-wrapper">
                <LinkOutlined className="contact-icon icon-bounce" />
              </div>
              <div className="contact-info">
                <h4 className="contact-label">Сайт</h4>
                <a
                  href="https://cmsauto.ru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-value"
                >
                  https://cmsauto.ru
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectsPortfolioPage;
