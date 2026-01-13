import React from 'react';
import { Button } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Link, useOutletContext } from 'react-router-dom';
import { BRAND, HERO, SERVICES } from './marketingContent';

type OutletCtx = { onRequestAudit: () => void };

const Diagram: React.FC = () => {
  return (
    <svg className="mkt-diagram" viewBox="0 0 920 220" role="img" aria-label="Архитектура решения">
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="currentColor" />
        </marker>
      </defs>

      <g className="mkt-diagram__layer">
        <rect x="20" y="32" width="170" height="60" rx="10" />
        <text x="105" y="58" textAnchor="middle">
          Цель бизнеса
        </text>
        <text x="105" y="78" textAnchor="middle" className="mkt-diagram__muted">
          эффект / KPI
        </text>
      </g>

      <g className="mkt-diagram__layer">
        <rect x="240" y="32" width="170" height="60" rx="10" />
        <text x="325" y="58" textAnchor="middle">
          Процессы
        </text>
        <text x="325" y="78" textAnchor="middle" className="mkt-diagram__muted">
          роли / контроль
        </text>
      </g>

      <g className="mkt-diagram__layer">
        <rect x="460" y="32" width="170" height="60" rx="10" />
        <text x="545" y="58" textAnchor="middle">
          Данные
        </text>
        <text x="545" y="78" textAnchor="middle" className="mkt-diagram__muted">
          качество / витрины
        </text>
      </g>

      <g className="mkt-diagram__layer">
        <rect x="680" y="32" width="220" height="60" rx="10" />
        <text x="790" y="58" textAnchor="middle">
          Интеграции + автоматизация
        </text>
        <text x="790" y="78" textAnchor="middle" className="mkt-diagram__muted">
          RPA / AI / BI
        </text>
      </g>

      <path className="mkt-diagram__arrow" d="M200 62 L230 62" markerEnd="url(#arrow)" />
      <path className="mkt-diagram__arrow" d="M420 62 L450 62" markerEnd="url(#arrow)" />
      <path className="mkt-diagram__arrow" d="M640 62 L670 62" markerEnd="url(#arrow)" />

      <g className="mkt-diagram__caption">
        <text x="20" y="156">
          Принцип: сначала архитектура и эффект, затем инструменты.
        </text>
      </g>
    </svg>
  );
};

export const ConsultingHomePage: React.FC = () => {
  const { onRequestAudit } = useOutletContext<OutletCtx>();
  return (
    <div className="mkt-page">
      <section className="mkt-hero">
        <div className="mkt-container">
          <div className="mkt-hero__kicker">{HERO.audience}</div>
          <h1 className="mkt-hero__title">{HERO.title}</h1>
          <p className="mkt-hero__subtitle">{HERO.subtitle}</p>

          <div className="mkt-hero__brand">
            <div className="mkt-kicker">{BRAND.shortKicker}</div>
            <div className="mkt-brandline">
              <b>{BRAND.shortTitle}</b> — {BRAND.shortText}
            </div>
            <Link className="mkt-link mkt-link--muted" to="/projects-portfolio/about">
              Читать полную легенду →
            </Link>
          </div>

          <div className="mkt-hero__cta">
            <Button type="primary" size="large" onClick={onRequestAudit}>
              Получить аудит процессов
            </Button>
            <Link className="mkt-link" to="/projects-portfolio/cases">
              Смотреть кейсы <ArrowRightOutlined />
            </Link>
          </div>

          <div className="mkt-hero__meta">
            <div className="mkt-meta">
              <div className="mkt-meta__label">Фокус</div>
              <div className="mkt-meta__value">Бизнес‑результат</div>
            </div>
            <div className="mkt-meta">
              <div className="mkt-meta__label">Формат</div>
              <div className="mkt-meta__value">Аудит → Архитектура → Внедрение</div>
            </div>
            <div className="mkt-meta">
              <div className="mkt-meta__label">Результат</div>
              <div className="mkt-meta__value">Метрики, план, расчёт эффекта</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-grid-2">
            <div>
              <h2 className="mkt-h2">Аудит процессов — основной продукт</h2>
              <p className="mkt-lead">
                Вы получаете управленческий документ: что менять, в каком порядке и какой эффект это
                даст. Технологии — вторичны.
              </p>

              <div className="mkt-cards">
                <div className="mkt-card">
                  <div className="mkt-card__title">Что смотрим</div>
                  <ul className="mkt-list">
                    <li>сквозные процессы и точки контроля</li>
                    <li>данные: качество, источники, “разрывы”</li>
                    <li>стоимость операции и потери времени</li>
                    <li>риски: ошибки, комплаенс, зависимость от людей</li>
                  </ul>
                </div>
                <div className="mkt-card">
                  <div className="mkt-card__title">Что отдаём</div>
                  <ul className="mkt-list">
                    <li>AS‑IS / TO‑BE + метрики и владельцы</li>
                    <li>реестр инициатив с приоритетами</li>
                    <li>архитектурные принципы и контуры</li>
                    <li>roadmap и финансовая модель эффекта</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mkt-figure">
              <Diagram />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--alt">
        <div className="mkt-container">
          <div className="mkt-section__header">
            <h2 className="mkt-h2">Услуги</h2>
            <Link className="mkt-link" to="/projects-portfolio/services">
              Смотреть все <ArrowRightOutlined />
            </Link>
          </div>

          <div className="mkt-services-preview">
            {SERVICES.slice(0, 3).map((s) => (
              <div key={s.key} className="mkt-card">
                <div className="mkt-card__title">{s.title}</div>
                <div className="mkt-card__text">{s.short}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-grid-2">
            <div>
              <h2 className="mkt-h2">Как работаем</h2>
              <ol className="mkt-steps">
                <li>
                  <div className="mkt-steps__title">Диагностика</div>
                  <div className="mkt-steps__text">Интервью, данные, факты, карта AS‑IS.</div>
                </li>
                <li>
                  <div className="mkt-steps__title">Модель эффекта</div>
                  <div className="mkt-steps__text">
                    Где экономия/рост, какие KPI меняем, какие риски закрываем.
                  </div>
                </li>
                <li>
                  <div className="mkt-steps__title">Архитектура</div>
                  <div className="mkt-steps__text">
                    TO‑BE, данные, интеграции, автоматизация, эксплуатация.
                  </div>
                </li>
                <li>
                  <div className="mkt-steps__title">Пилот → масштаб</div>
                  <div className="mkt-steps__text">Быстрые результаты и контроль качества.</div>
                </li>
              </ol>
            </div>

            <div>
              <h2 className="mkt-h2">Почему доверяют</h2>
              <div className="mkt-cards">
                <div className="mkt-card">
                  <div className="mkt-card__title">Прозрачность</div>
                  <div className="mkt-card__text">
                    Фиксируем цель, KPI, критерии приёмки и “что будет считаться успехом”.
                  </div>
                </div>
                <div className="mkt-card">
                  <div className="mkt-card__title">Архитектура</div>
                  <div className="mkt-card__text">
                    Не “прикручиваем роботов”, а строим устойчивую систему: данные, роли, контроль.
                  </div>
                </div>
                <div className="mkt-card">
                  <div className="mkt-card__title">Передача знаний</div>
                  <div className="mkt-card__text">
                    Документация и обучение, чтобы снижать зависимость от подрядчика.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mkt-cta-band">
            <div>
              <div className="mkt-cta-band__title">Готовы начать с аудита?</div>
              <div className="mkt-cta-band__text">
                Опишите цель — предложим формат, сроки и ожидаемый экономический эффект.
              </div>
            </div>
            <Button type="primary" size="large" onClick={onRequestAudit}>
              Получить аудит процессов
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

