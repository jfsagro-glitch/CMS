import React from 'react';
import { Button, Collapse, Typography } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { BRAND } from './marketingContent';

type OutletCtx = { onRequestAudit: () => void };

export const BrandStoryPage: React.FC = () => {
  const { onRequestAudit } = useOutletContext<OutletCtx>();

  return (
    <div className="mkt-page">
      <section className="mkt-section mkt-section--tight">
        <div className="mkt-container">
          <div className="mkt-kicker">{BRAND.shortKicker}</div>
          <h1 className="mkt-h1">{BRAND.shortTitle}</h1>
          <p className="mkt-lead" style={{ marginTop: 10 }}>
            {BRAND.shortText}
          </p>

          <div style={{ marginTop: 18 }}>
            <Button type="primary" onClick={onRequestAudit}>
              Получить аудит процессов
            </Button>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-prose">
            <Typography.Paragraph>{BRAND.storyIntro}</Typography.Paragraph>
            {BRAND.storyBody.map((p) => (
              <Typography.Paragraph key={p}>{p}</Typography.Paragraph>
            ))}

            <Typography.Title level={3} style={{ marginTop: 22 }}>
              {BRAND.observedTitle}
            </Typography.Title>
            <ul className="mkt-list">
              {BRAND.observed.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>

            <Typography.Paragraph style={{ marginTop: 16 }}>
              Этот опыт дал нам редкое понимание того, какие управленческие и процессные решения
              действительно работают, а какие создают иллюзию контроля.
            </Typography.Paragraph>

            <Typography.Title level={3} style={{ marginTop: 22 }}>
              {BRAND.principlesTitle}
            </Typography.Title>
            <ul className="mkt-list">
              {BRAND.principles.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>

            {BRAND.position.map((p) => (
              <Typography.Paragraph key={p}>{p}</Typography.Paragraph>
            ))}

            <Typography.Paragraph>
              <b>{BRAND.closing}</b>
            </Typography.Paragraph>
          </div>

          <div style={{ marginTop: 18 }}>
            <Collapse
              items={[
                {
                  key: 'ceo',
                  label: BRAND.ceoTitle,
                  children: (
                    <div className="mkt-prose">
                      {BRAND.ceoText.map((p) => (
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
              <div className="mkt-cta-band__title">Нужен “взгляд со стороны”?</div>
              <div className="mkt-cta-band__text">
                Начнём с аудита: зафиксируем цель, измерим потери и соберём архитектуру решений.
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

