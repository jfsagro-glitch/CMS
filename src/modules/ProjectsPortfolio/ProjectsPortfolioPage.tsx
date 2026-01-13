import React, { useMemo, useState } from 'react';
import { Button } from 'antd';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { RequestAuditModal } from './RequestAuditModal';
import { CONTACT_EMAIL } from './marketingContent';
import './ProjectsPortfolioPage.css';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'mkt-nav__link mkt-nav__link--active' : 'mkt-nav__link';

const ProjectsPortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [auditOpen, setAuditOpen] = useState(false);

  const isHome = useMemo(() => {
    const p = location.pathname;
    return p === '/projects-portfolio' || p === '/projects-portfolio/';
  }, [location.pathname]);

  return (
    <div className="mkt-shell">
      <header className="mkt-topbar">
        <div className="mkt-container mkt-topbar__inner">
          <button className="mkt-brand" type="button" onClick={() => navigate('/projects-portfolio')}>
            <img src="/brand/consulting-logo.png" alt="Логотип" className="mkt-brand__logo" />
            <span className="mkt-brand__name">Automation Consulting</span>
          </button>

          <nav className="mkt-nav" aria-label="Навигация">
            <NavLink end to="/projects-portfolio" className={linkClass}>
              Главная
            </NavLink>
            <NavLink to="/projects-portfolio/services" className={linkClass}>
              Услуги
            </NavLink>
            <NavLink to="/projects-portfolio/cases" className={linkClass}>
              Кейсы
            </NavLink>
          </nav>

          <div className="mkt-topbar__cta">
            {!isHome && (
              <a className="mkt-link mkt-link--muted" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            )}
            <Button type="primary" onClick={() => setAuditOpen(true)}>
              Получить аудит процессов
            </Button>
          </div>
        </div>
      </header>

      <main className="mkt-main">
        <Outlet context={{ onRequestAudit: () => setAuditOpen(true) }} />
      </main>

      <footer className="mkt-footer">
        <div className="mkt-container mkt-footer__inner">
          <div className="mkt-footer__left">
            <div className="mkt-footer__title">Консалтинг по автоматизации процессов</div>
            <div className="mkt-footer__muted">Аудит → Архитектура → Внедрение. Фокус на эффекте.</div>
          </div>
          <div className="mkt-footer__right">
            <a className="mkt-link" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </footer>

      <RequestAuditModal open={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  );
};

export default ProjectsPortfolioPage;

