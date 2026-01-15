import React from 'react';
import { Button, Card, Tag, Typography } from 'antd';
import { GithubOutlined, LinkOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import type { MarketingCopy, MarketingLang } from './i18n';

type OutletCtx = { onRequestAudit: () => void; lang: MarketingLang; copy: MarketingCopy };

export const ITProjectsPage: React.FC = () => {
  const { copy } = useOutletContext<OutletCtx>();

  return (
    <div className="mkt-page">
      <section className="mkt-section mkt-section--tight">
        <div className="mkt-container">
          <h1 className="mkt-h1">{copy.projectsPage.title}</h1>
          <p className="mkt-lead">{copy.projectsPage.lead}</p>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-projects">
            {copy.projectsData.map((p) => (
              <Card key={p.id} className="mkt-card mkt-project" bordered>
                <div className="mkt-project__head">
                  <div>
                    <div className="mkt-project__title">{p.name}</div>
                    <div className="mkt-project__desc">{p.short}</div>
                  </div>
                  <div className="mkt-project__actions">
                    <Button
                      icon={<GithubOutlined />}
                      href={p.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {copy.projectsPage.repo}
                    </Button>
                    {p.demoUrl && (
                      <Button
                        icon={<LinkOutlined />}
                        href={p.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {copy.projectsPage.demo}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mkt-project__grid">
                  <div className="mkt-project__block">
                    <div className="mkt-card__title">{copy.projectsPage.stack}</div>
                    <div className="mkt-tags">
                      {p.stack.map((s) => (
                        <Tag key={s}>{s}</Tag>
                      ))}
                    </div>
                  </div>

                  <div className="mkt-project__block">
                    <div className="mkt-card__title">{copy.projectsPage.highlights}</div>
                    <div className="mkt-kpis">
                      {p.highlights.map((h) => (
                        <div key={h.label} className="mkt-kpi">
                          <div className="mkt-kpi__label">{h.label}</div>
                          <div className="mkt-kpi__value">{h.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mkt-project__block mkt-project__block--wide">
                    <div className="mkt-card__title">{copy.projectsPage.capabilities}</div>
                    <ul className="mkt-list">
                      {p.capabilities.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <Typography.Paragraph style={{ color: 'rgba(0,0,0,0.62)', marginBottom: 0 }}>
              {copy.cta.getAudit}
            </Typography.Paragraph>
          </div>
        </div>
      </section>
    </div>
  );
};

