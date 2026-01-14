import React from 'react';
import { Button, Collapse, Typography } from 'antd';
import { useOutletContext } from 'react-router-dom';
import type { MarketingCopy, MarketingLang } from './i18n';

type OutletCtx = { onRequestAudit: () => void; lang: MarketingLang; copy: MarketingCopy };

export const BrandStoryPage: React.FC = () => {
  const { onRequestAudit, copy } = useOutletContext<OutletCtx>();
  const b = copy.brand;

  return (
    <div className="mkt-page">
      <section className="mkt-section mkt-section--tight">
        <div className="mkt-container">
          <h1 className="mkt-h1">{b.title}</h1>

          <div className="mkt-card" style={{ marginTop: 14 }}>
            <div className="mkt-card__text" style={{ lineHeight: 1.75 }}>
              {b.shortVersionLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <Button type="primary" onClick={onRequestAudit}>
              {copy.cta.getAudit}
            </Button>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-prose">
            <Typography.Paragraph>{b.story.intro}</Typography.Paragraph>
            {b.story.paragraphs.map((p) => (
              <Typography.Paragraph key={p}>{p}</Typography.Paragraph>
            ))}

            <Typography.Title level={3} style={{ marginTop: 22 }}>
              {b.story.observedTitle}
            </Typography.Title>
            <ul className="mkt-list">
              {b.story.observedItems.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>

            <Typography.Paragraph style={{ marginTop: 16 }}>
              {b.story.insight}
            </Typography.Paragraph>

            <Typography.Title level={3} style={{ marginTop: 22 }}>
              {b.story.systemTitle}
            </Typography.Title>
            <ul className="mkt-list">
              {b.story.systemItems.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>

            {b.story.positionParagraphs.map((p) => (
              <Typography.Paragraph key={p}>{p}</Typography.Paragraph>
            ))}

            <Typography.Paragraph>
              <b>{b.story.closing}</b>
            </Typography.Paragraph>
          </div>

          <div style={{ marginTop: 18 }}>
            <Collapse
              items={[
                {
                  key: 'ceo',
                  label: b.ceoTitle,
                  children: (
                    <div className="mkt-prose">
                      {b.ceoLines.map((p) => (
                        <Typography.Paragraph key={p} style={{ marginTop: 0 }}>
                          {p}
                        </Typography.Paragraph>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <div className="mkt-cta-band">
            <div>
              <div className="mkt-cta-band__title">{copy.aboutPage.ctaBandTitle}</div>
              <div className="mkt-cta-band__text">{copy.aboutPage.ctaBandText}</div>
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

