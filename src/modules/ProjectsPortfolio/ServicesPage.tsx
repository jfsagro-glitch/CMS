import React from 'react';
import { Button } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { SERVICES } from './marketingContent';

type OutletCtx = { onRequestAudit: () => void };

export const ServicesPage: React.FC = () => {
  const { onRequestAudit } = useOutletContext<OutletCtx>();
  return (
    <div className="mkt-page">
      <section className="mkt-section mkt-section--tight">
        <div className="mkt-container">
          <h1 className="mkt-h1">Услуги</h1>
          <p className="mkt-lead">
            Мы работаем как консалтинг и архитекторы решений: начинаем с диагностики и эффекта, затем
            проектируем архитектуру и внедряем изменения.
          </p>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-services">
            {SERVICES.map((s) => (
              <div key={s.key} className="mkt-service">
                <div className="mkt-service__head">
                  <div className="mkt-service__title">{s.title}</div>
                  <div className="mkt-service__short">{s.short}</div>
                </div>

                <div className="mkt-grid-2 mkt-grid-2--compact">
                  <div className="mkt-card">
                    <div className="mkt-card__title">Когда нужно</div>
                    <ul className="mkt-list">
                      {s.when.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mkt-card">
                    <div className="mkt-card__title">Что вы получаете</div>
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
              <div className="mkt-cta-band__title">Нужна отправная точка?</div>
              <div className="mkt-cta-band__text">
                Аудит процессов поможет зафиксировать цели, KPI и план действий.
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

