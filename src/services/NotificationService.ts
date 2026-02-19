/**
 * Notification utility
 * Provides centralized notification display with consistent UX
 */

import { message, notification } from 'antd';

export interface NotificationConfig {
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

class NotificationService {
  private config: NotificationConfig = {
    duration: 3,
    placement: 'topRight',
  };

  /**
   * Show success notification
   */
  success(title: string, description?: string, config?: NotificationConfig): void {
    const cfg = { ...this.config, ...config };

    if (description) {
      notification.success({
        message: title,
        description,
        duration: cfg.duration,
        placement: cfg.placement,
      });
    } else {
      message.success({
        content: title,
        duration: cfg.duration,
      });
    }
  }

  /**
   * Show error notification
   */
  error(title: string, description?: string, config?: NotificationConfig): void {
    const cfg = { ...this.config, ...config };

    if (description) {
      notification.error({
        message: title,
        description,
        duration: cfg.duration,
        placement: cfg.placement,
      });
    } else {
      message.error({
        content: title,
        duration: cfg.duration,
      });
    }
  }

  /**
   * Show warning notification
   */
  warning(title: string, description?: string, config?: NotificationConfig): void {
    const cfg = { ...this.config, ...config };

    if (description) {
      notification.warning({
        message: title,
        description,
        duration: cfg.duration,
        placement: cfg.placement,
      });
    } else {
      message.warning({
        content: title,
        duration: cfg.duration,
      });
    }
  }

  /**
   * Show info notification
   */
  info(title: string, description?: string, config?: NotificationConfig): void {
    const cfg = { ...this.config, ...config };

    if (description) {
      notification.info({
        message: title,
        description,
        duration: cfg.duration,
        placement: cfg.placement,
      });
    } else {
      message.info({
        content: title,
        duration: cfg.duration,
      });
    }
  }

  /**
   * Show loading message
   */
  loading(content: string): string {
    const key = `loading_${Date.now()}`;
    message.loading({
      content,
      key,
      duration: 0, // Don't auto-close
    });
    return key;
  }

  /**
   * Close a notification by key
   */
  close(key: string): void {
    message.destroy(key);
  }

  /**
   * Update notification by key (useful for progress updates)
   */
  update(key: string, title: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    message.open({
      key,
      type,
      content: title,
      duration: 3,
    });
  }

  /**
   * Bulk operation notification
   */
  bulkOperationSuccess(itemsCount: number, operation: string): void {
    this.success(
      `${operation} выполнен`,
      `Успешно обработано ${itemsCount} элемент${this.getPluralSuffix(itemsCount)}`
    );
  }

  /**
   * Set default config
   */
  setConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get plural suffix for Russian language
   */
  private getPluralSuffix(count: number): string {
    if (count % 10 === 1 && count % 100 !== 11) return '';
    if (count % 10 === 2 && count % 100 !== 12) return 'а';
    return 'ов';
  }
}

export default new NotificationService();
