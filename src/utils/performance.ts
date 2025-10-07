// Утилиты для оптимизации производительности

// Дебаунс функция
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};

// Троттлинг функция
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

// Измерение производительности
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
};

// Async измерение производительности
export const measurePerformanceAsync = async (name: string, fn: () => Promise<void>) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
};

// Lazy load компонента с задержкой
export const lazyWithDelay = (
  importFunc: () => Promise<any>,
  delay: number = 300
) => {
  return React.lazy(() =>
    Promise.all([
      importFunc(),
      new Promise(resolve => setTimeout(resolve, delay))
    ]).then(([moduleExports]) => moduleExports)
  );
};

// Проверка видимости элемента
export const isElementInViewport = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// Кэш для функций
class FunctionCache {
  private cache: Map<string, { value: any; timestamp: number }> = new Map();
  private ttl: number;

  constructor(ttl: number = 5 * 60 * 1000) {
    // По умолчанию 5 минут
    this.ttl = ttl;
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Проверка срока действия
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  set(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const createCache = (ttl?: number) => new FunctionCache(ttl);

// Мемоизация функции с кэшем
export const memoizeWithCache = <T extends (...args: any[]) => any>(
  fn: T,
  cache: FunctionCache = new FunctionCache()
): T => {
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached !== null) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Batching обновлений
export class UpdateBatcher {
  private updates: Array<() => void> = [];
  private timeout: NodeJS.Timeout | null = null;
  private delay: number;

  constructor(delay: number = 100) {
    this.delay = delay;
  }

  add(update: () => void): void {
    this.updates.push(update);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush(): void {
    if (this.updates.length === 0) return;

    const updates = [...this.updates];
    this.updates = [];

    // Выполняем все обновления одним batch
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }
}

// Мониторинг памяти (если доступно)
export const getMemoryUsage = (): number | null => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize / 1048576; // В МБ
  }
  return null;
};

// Логирование производительности
export const logPerformanceMetrics = () => {
  if (typeof window === 'undefined') return;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (navigation) {
    console.group('[Performance Metrics]');
    console.log('DNS Lookup:', navigation.domainLookupEnd - navigation.domainLookupStart, 'ms');
    console.log('TCP Connection:', navigation.connectEnd - navigation.connectStart, 'ms');
    console.log('Request Time:', navigation.responseStart - navigation.requestStart, 'ms');
    console.log('Response Time:', navigation.responseEnd - navigation.responseStart, 'ms');
    console.log('DOM Processing:', navigation.domComplete - navigation.domLoading, 'ms');
    console.log('Total Load Time:', navigation.loadEventEnd - navigation.fetchStart, 'ms');
    
    const memoryUsage = getMemoryUsage();
    if (memoryUsage) {
      console.log('Memory Usage:', memoryUsage.toFixed(2), 'MB');
    }
    
    console.groupEnd();
  }
};

import React from 'react';

export { React };

