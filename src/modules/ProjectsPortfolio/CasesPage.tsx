import React from 'react';
import { Button } from 'antd';
import { useOutletContext } from 'react-router-dom';
import type { MarketingCopy, MarketingLang } from './i18n';

type OutletCtx = { onRequestAudit: () => void; lang: MarketingLang; copy: MarketingCopy };

export const CasesPage: React.FC = () => {
  const { onRequestAudit, copy } = useOutletContext<OutletCtx>();
  return (
    <div className="mkt-page">
      <section className="mkt-section mkt-section--tight">
        <div className="mkt-container">
          <h1 className="mkt-h1">{copy.casesPage.title}</h1>
          <p className="mkt-lead">{copy.casesPage.lead}</p>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-cases">
            {copy.casesData.map((c) => (
              <article key={c.id} className="mkt-case">
                <header className="mkt-case__header">
                  <div className="mkt-case__meta">
                    <span className="mkt-chip">{c.industry}</span>
                    <span className="mkt-chip">{c.companySize}</span>
                    <span className="mkt-chip">{c.timeline}</span>
                  </div>
                </header>

                <div className="mkt-grid-3">
                  <div className="mkt-card">
                    <div className="mkt-card__title">{copy.casesPage.task}</div>
                    <div className="mkt-card__text">{c.task}</div>
                  </div>
                  <div className="mkt-card">
                    <div className="mkt-card__title">{copy.casesPage.solution}</div>
                    <ul className="mkt-list">
                      {c.solution.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mkt-card">
                    <div className="mkt-card__title">{copy.casesPage.result}</div>
                    <div className="mkt-kpis">
                      {c.result.map((r) => (
                        <div key={r.label} className="mkt-kpi">
                          <div className="mkt-kpi__label">{r.label}</div>
                          <div className="mkt-kpi__value">{r.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mkt-case__effect">{c.economicEffect}</div>
                    {c.note && <div className="mkt-case__note">{c.note}</div>}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mkt-cta-band">
            <div>
              <div className="mkt-cta-band__title">{copy.casesPage.ctaTitle}</div>
              <div className="mkt-cta-band__text">{copy.casesPage.ctaText}</div>
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

