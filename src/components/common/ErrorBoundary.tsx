import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography } from 'antd';
import { BugOutlined, ReloadOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логирование ошибки
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Здесь можно отправить ошибку в систему мониторинга
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Сохранение в localStorage для анализа
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };

      const existingLogs = localStorage.getItem('error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(errorLog);

      // Храним только последние 50 ошибок
      if (logs.length > 50) {
        logs.shift();
      }

      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Перезагрузка страницы
    window.location.reload();
  };

  handleResetWithoutReload = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '50px', maxWidth: '800px', margin: '0 auto' }}>
          <Result
            status="error"
            icon={<BugOutlined />}
            title="Произошла ошибка"
            subTitle="К сожалению, что-то пошло не так. Попробуйте перезагрузить страницу или вернуться на главную."
            extra={[
              <Button type="primary" key="reload" icon={<ReloadOutlined />} onClick={this.handleReset}>
                Перезагрузить страницу
              </Button>,
              <Button key="reset" onClick={this.handleResetWithoutReload}>
                Попробовать снова
              </Button>,
              <Button key="home" onClick={() => (window.location.href = '/')}>
                Вернуться на главную
              </Button>,
            ]}
          >
            {import.meta.env.MODE === 'development' && this.state.error && (
              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <Paragraph>
                  <Text strong style={{ fontSize: '16px' }}>
                    Детали ошибки (только в режиме разработки):
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text code style={{ color: '#ff4d4f' }}>
                    {this.state.error.message}
                  </Text>
                </Paragraph>
                {this.state.error.stack && (
                  <Paragraph>
                    <Text code style={{ fontSize: '12px', whiteSpace: 'pre-wrap', display: 'block' }}>
                      {this.state.error.stack}
                    </Text>
                  </Paragraph>
                )}
                {this.state.errorInfo && (
                  <Paragraph>
                    <Text strong>Component Stack:</Text>
                    <Text code style={{ fontSize: '11px', whiteSpace: 'pre-wrap', display: 'block' }}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </Paragraph>
                )}
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

