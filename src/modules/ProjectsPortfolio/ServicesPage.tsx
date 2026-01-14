import React from 'react';
import { Button } from 'antd';
import { useOutletContext } from 'react-router-dom';
import type { MarketingCopy, MarketingLang } from './i18n';

type OutletCtx = { onRequestAudit: () => void; lang: MarketingLang; copy: MarketingCopy };

export const ServicesPage: React.FC = () => {
  const { onRequestAudit, copy } = useOutletContext<OutletCtx>();
  return (
    <div className="mkt-page">
      <section className="mkt-section mkt-section--tight">
        <div className="mkt-container">
          <h1 className="mkt-h1">{copy.servicesPage.title}</h1>
          <p className="mkt-lead">{copy.servicesPage.lead}</p>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-services">
            {copy.servicesData.map((s) => (
              <div key={s.key} className="mkt-service">
                <div className="mkt-service__head">
                  <div className="mkt-service__title">{s.title}</div>
                  <div className="mkt-service__short">{s.short}</div>
                </div>

                <div className="mkt-grid-2 mkt-grid-2--compact">
                  <div className="mkt-card">
                    <div className="mkt-card__title">{copy.servicesPage.whenNeeded}</div>
                    <ul className="mkt-list">
                      {s.when.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mkt-card">
                    <div className="mkt-card__title">{copy.servicesPage.whatYouGet}</div>
                    <ul className="mkt-list">
                      {s.whatYouGet.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mkt-cta-band">
            <div>
              <div className="mkt-cta-band__title">{copy.servicesPage.ctaTitle}</div>
              <div className="mkt-cta-band__text">{copy.servicesPage.ctaText}</div>
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

