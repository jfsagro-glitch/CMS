import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import './CMSCheckPage.css';

const CMSCheckPage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setLoading(false);
    };

    iframe.addEventListener('load', handleLoad);

    // Устанавливаем путь к CMS Check
    const base = import.meta.env.BASE_URL ?? '/';
    const cmsCheckPath = `${base}cms-check/index.html#/inspections`;
    iframe.src = cmsCheckPath;

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, []);

  return (
    <div className="cms-check-page">
      {loading && (
        <div className="cms-check-loading">
          <Spin size="large" tip="Загрузка системы дистанционных осмотров..." />
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="cms-check-iframe"
        title="CMS Check - Система дистанционных осмотров"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default CMSCheckPage;

