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
    // В production base может быть '/cms/' или './', в dev - '/'
    const base = import.meta.env.BASE_URL ?? './';
    // Убираем хеш из пути, так как он может вызывать проблемы при первой загрузке
    // Если base заканчивается на '/', не добавляем еще один '/'
    const basePath = base.endsWith('/') ? base : `${base}/`;
    const cmsCheckPath = `${basePath}cms-check/index.html`;
    
    try {
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
      {!error && !loading && (
        <Alert
          message="Информация"
          description="CMS Check загружен. Приложение может показывать ошибки API, так как оно рассчитано на работу с backend сервером. Для полной функциональности требуется настройка backend API."
          type="info"
          showIcon
          closable
          style={{ margin: '20px' }}
        />
      )}
      <iframe
        ref={iframeRef}
        className="cms-check-iframe"
        title="CMS Check - Система дистанционных осмотров"
        style={{ display: loading || error ? 'none' : 'block' }}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      />
    </div>
  );
};

export default CMSCheckPage;

