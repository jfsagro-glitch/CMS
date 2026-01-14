import React from 'react';
import { Button } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Link, useOutletContext } from 'react-router-dom';
import type { MarketingCopy, MarketingLang } from './i18n';

type OutletCtx = { onRequestAudit: () => void; lang: MarketingLang; copy: MarketingCopy };

const Diagram: React.FC<{ copy: MarketingCopy }> = ({ copy }) => {
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
          {copy.home.diagram.businessGoal}
        </text>
        <text x="105" y="78" textAnchor="middle" className="mkt-diagram__muted">
          {copy.home.diagram.businessGoalSub}
        </text>
      </g>

      <g className="mkt-diagram__layer">
        <rect x="240" y="32" width="170" height="60" rx="10" />
        <text x="325" y="58" textAnchor="middle">
          {copy.home.diagram.processes}
        </text>
        <text x="325" y="78" textAnchor="middle" className="mkt-diagram__muted">
          {copy.home.diagram.processesSub}
        </text>
      </g>

      <g className="mkt-diagram__layer">
        <rect x="460" y="32" width="170" height="60" rx="10" />
        <text x="545" y="58" textAnchor="middle">
          {copy.home.diagram.data}
        </text>
        <text x="545" y="78" textAnchor="middle" className="mkt-diagram__muted">
          {copy.home.diagram.dataSub}
        </text>
      </g>

      <g className="mkt-diagram__layer">
        <rect x="680" y="32" width="220" height="60" rx="10" />
        <text x="790" y="58" textAnchor="middle">
          {copy.home.diagram.automation}
        </text>
        <text x="790" y="78" textAnchor="middle" className="mkt-diagram__muted">
          {copy.home.diagram.automationSub}
        </text>
      </g>

      <path className="mkt-diagram__arrow" d="M200 62 L230 62" markerEnd="url(#arrow)" />
      <path className="mkt-diagram__arrow" d="M420 62 L450 62" markerEnd="url(#arrow)" />
      <path className="mkt-diagram__arrow" d="M640 62 L670 62" markerEnd="url(#arrow)" />

      <g className="mkt-diagram__caption">
        <text x="20" y="156">
          {copy.home.diagram.caption}
        </text>
      </g>
    </svg>
  );
};

export const ConsultingHomePage: React.FC = () => {
  const { onRequestAudit, copy } = useOutletContext<OutletCtx>();
  return (
    <div className="mkt-page">
      <section className="mkt-hero">
        <div className="mkt-container">
          <div className="mkt-hero__kicker">{copy.home.audience}</div>
          <h1 className="mkt-hero__title">{copy.home.heroTitle}</h1>
          <p className="mkt-hero__subtitle">{copy.home.heroSubtitle}</p>

          <div className="mkt-hero__brand">
            <div className="mkt-brandline">
              <div className="mkt-brandline__title">{copy.brand.shortVersionLines[0]}</div>
              <div>{copy.brand.shortVersionLines[1]}</div>
              <div>{copy.brand.shortVersionLines[2]}</div>
            </div>
            <Link className="mkt-link mkt-link--muted" to="/projects-portfolio/about">
              {copy.home.brandTeaserLink}
            </Link>
          </div>

          <div className="mkt-hero__cta">
            <Button type="primary" size="large" onClick={onRequestAudit}>
              {copy.cta.getAudit}
            </Button>
            <Link className="mkt-link" to="/projects-portfolio/offer">
              {copy.cta.getOffer}
            </Link>
            <Link className="mkt-link" to="/projects-portfolio/cases">
              {copy.home.viewCases} <ArrowRightOutlined />
            </Link>
          </div>

          <div className="mkt-hero__meta">
            {copy.home.heroMeta.map((m) => (
              <div key={m.label} className="mkt-meta">
                <div className="mkt-meta__label">{m.label}</div>
                <div className="mkt-meta__value">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-grid-2">
            <div>
              <h2 className="mkt-h2">{copy.home.auditTitle}</h2>
              <p className="mkt-lead">{copy.home.auditLead}</p>

              <div className="mkt-cards">
                <div className="mkt-card">
                  <div className="mkt-card__title">{copy.home.auditLookTitle}</div>
                  <ul className="mkt-list">
                    {copy.home.auditLookBullets.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="mkt-card">
                  <div className="mkt-card__title">{copy.home.auditDeliverTitle}</div>
                  <ul className="mkt-list">
                    {copy.home.auditDeliverBullets.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mkt-figure">
              <Diagram copy={copy} />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--alt">
        <div className="mkt-container">
          <div className="mkt-section__header">
            <h2 className="mkt-h2">{copy.home.servicesTitle}</h2>
            <Link className="mkt-link" to="/projects-portfolio/services">
              {copy.home.servicesAllLink} <ArrowRightOutlined />
            </Link>
          </div>

          <div className="mkt-services-preview">
            {copy.servicesData.slice(0, 3).map((s) => (
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
              <h2 className="mkt-h2">{copy.home.howWeWorkTitle}</h2>
              <ol className="mkt-steps">
                {copy.home.howWeWork.map((s) => (
                  <li key={s.title}>
                    <div className="mkt-steps__title">{s.title}</div>
                    <div className="mkt-steps__text">{s.text}</div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h2 className="mkt-h2">{copy.home.whyTrustTitle}</h2>
              <div className="mkt-cards">
                {copy.home.whyTrust.map((c) => (
                  <div key={c.title} className="mkt-card">
                    <div className="mkt-card__title">{c.title}</div>
                    <div className="mkt-card__text">{c.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mkt-cta-band">
            <div>
              <div className="mkt-cta-band__title">{copy.home.ctaBandTitle}</div>
              <div className="mkt-cta-band__text">{copy.home.ctaBandText}</div>
            </div>
            <Button type="primary" size="large" onClick={onRequestAudit}>
              {copy.cta.getAudit}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

