import React, { useEffect, useMemo, useState } from 'react';
import { Button, Segmented } from 'antd';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { RequestAuditModal } from './RequestAuditModal';
import { CONTACT_EMAIL } from './marketingContent';
import { getInitialLang, getMarketingCopy, setStoredLang, type MarketingLang } from './i18n';
import './ProjectsPortfolioPage.css';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'mkt-nav__link mkt-nav__link--active' : 'mkt-nav__link';

const ProjectsPortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [auditOpen, setAuditOpen] = useState(false);
  const [lang, setLang] = useState<MarketingLang>(() => getInitialLang());

  useEffect(() => {
    setStoredLang(lang);
  }, [lang]);

  const copy = useMemo(() => getMarketingCopy(lang), [lang]);

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
            <span className="mkt-brand__text">
              <span className="mkt-brand__name">CMS</span>
              <span className="mkt-brand__sub">Corporate Management Systems</span>
            </span>
          </button>

          <nav className="mkt-nav" aria-label="Навигация">
            <NavLink end to="/projects-portfolio" className={linkClass}>
              {copy.nav.home}
            </NavLink>
            <NavLink to="/projects-portfolio/services" className={linkClass}>
              {copy.nav.services}
            </NavLink>
            <NavLink to="/projects-portfolio/cases" className={linkClass}>
              {copy.nav.cases}
            </NavLink>
            <NavLink to="/projects-portfolio/about" className={linkClass}>
              {copy.nav.about}
            </NavLink>
          </nav>

          <div className="mkt-topbar__cta">
            <Segmented
              className="mkt-lang"
              size="small"
              value={lang}
              options={[
                { label: 'RU', value: 'ru' },
                { label: 'EN', value: 'en' },
              ]}
              onChange={(v) => setLang(v as MarketingLang)}
            />
            {!isHome && (
              <a className="mkt-link mkt-link--muted" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            )}
            <Button type="primary" onClick={() => setAuditOpen(true)}>
              {copy.cta.getAudit}
            </Button>
          </div>
        </div>
      </header>

      <main className="mkt-main">
        <Outlet context={{ onRequestAudit: () => setAuditOpen(true), lang, copy }} />
      </main>

      <footer className="mkt-footer">
        <div className="mkt-container mkt-footer__inner">
          <div className="mkt-footer__left">
            <div className="mkt-footer__brand">
              <img
                src="/brand/consulting-logo.png"
                alt="Логотип"
                className="mkt-footer__logo"
              loading="lazy"
            />
              <div>
                <div className="mkt-footer__title">{copy.footer.title}</div>
                <div className="mkt-footer__muted">
                  {copy.footer.tagline}
                </div>
              </div>
            </div>
          </div>
          <div className="mkt-footer__right">
            <a className="mkt-link" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </footer>

      <RequestAuditModal open={auditOpen} onClose={() => setAuditOpen(false)} copy={copy} />
    </div>
  );
};

export default ProjectsPortfolioPage;

