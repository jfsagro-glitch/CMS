import React, { useEffect, useRef, useState } from 'react';
import { Spin, Alert } from 'antd';
import './CMSCheckPage.css';

const CMSCheckPage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setLoading(false);
      setError(null);
      
      // Пытаемся перейти на страницу inspections после загрузки
      try {
        const iframeWindow = iframe.contentWindow;
        if (iframeWindow) {
          // Используем setTimeout для навигации после полной загрузки
          setTimeout(() => {
            try {
              iframeWindow.location.hash = '#/inspections';
            } catch (e) {
              // Игнорируем ошибки CORS при попытке доступа к iframe
              console.log('Не удалось установить хеш в iframe (возможно, CORS ограничение)');
            }
          }, 500);
        }
      } catch (e) {
        console.log('Не удалось получить доступ к окну iframe');
      }
    };

    const handleError = () => {
      setLoading(false);
      setError('Не удалось загрузить систему дистанционных осмотров. Проверьте, что файлы CMS Check доступны.');
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    // Устанавливаем путь к CMS Check
    // Используем относительный путь от текущего местоположения
    // В production на GitHub Pages путь будет /cms/cms-check/index.html
    // В dev будет ./cms-check/index.html
    const base = import.meta.env.BASE_URL ?? './';
    let cmsCheckPath: string;
    
    // Определяем текущий путь страницы
    const currentPath = window.location.pathname;
    
    if (base === './' || base === '/') {
      // Для относительных путей используем относительный путь от текущей директории
      // Если мы на /registry#/cms-check, то путь должен быть ./cms-check/index.html
      cmsCheckPath = './cms-check/index.html';
    } else {
      // Для абсолютных путей (например /cms/) используем абсолютный путь
      const basePath = base.endsWith('/') ? base : `${base}/`;
      cmsCheckPath = `${basePath}cms-check/index.html`;
    }
    
    console.log('Loading CMS Check:', {
      base,
      currentPath,
      cmsCheckPath,
      fullUrl: new URL(cmsCheckPath, window.location.origin).href
    });
    
    try {
      // Устанавливаем src напрямую
      iframe.src = cmsCheckPath;
      
      // Таймаут на случай, если iframe не загрузится
      const timeout = setTimeout(() => {
        if (loading) {
          setLoading(false);
          // Проверяем, загрузился ли iframe, но просто не сработал событие load
          try {
            const iframeWindow = iframe.contentWindow;
            if (iframeWindow && iframeWindow.location) {
              setError(null); // Если iframe загрузился, убираем ошибку
            } else {
              setError('Таймаут загрузки. Проверьте доступность системы CMS Check.');
            }
          } catch (e) {
            // CORS может блокировать доступ к location
            setError(null); // Предполагаем, что загрузка прошла успешно
          }
        }
      }, 10000); // 10 секунд

      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        clearTimeout(timeout);
      };
    } catch (err) {
      console.error('Ошибка установки пути к CMS Check:', err);
      setError('Ошибка при загрузке системы дистанционных осмотров.');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="cms-check-page">
      {loading && (
        <div className="cms-check-loading">
          <Spin size="large" tip="Загрузка системы дистанционных осмотров..." />
        </div>
      )}
      {error && (
        <Alert
          message="Ошибка загрузки"
          description={error}
          type="error"
          showIcon
          style={{ margin: '20px' }}
        />
      )}
      <iframe
        ref={iframeRef}
        className="cms-check-iframe"
        title="CMS Check - Система дистанционных осмотров"
        style={{ display: loading || error ? 'none' : 'block' }}
        // Убираем sandbox, так как он может блокировать работу приложения
        // и вызывать предупреждения о безопасности
      />
    </div>
  );
};

export default CMSCheckPage;

