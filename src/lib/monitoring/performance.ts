/**
 * Performance Monitoring Utility
 *
 * Tracks Core Web Vitals and sends metrics to analytics service without impacting performance.
 * Uses requestIdleCallback to report metrics during browser idle time.
 *
 * Core Web Vitals tracked:
 * - LCP (Largest Contentful Paint): Loading performance
 * - INP (Interaction to Next Paint): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Rendering performance
 * - TTFB (Time to First Byte): Server response time
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Performance budget thresholds (in milliseconds, except CLS which is a score)
export const PERFORMANCE_BUDGETS = {
  LCP: 2500,    // Good: <2.5s, Needs improvement: 2.5-4s, Poor: >4s
  INP: 200,     // Good: <200ms, Needs improvement: 200-500ms, Poor: >500ms
  CLS: 0.1,     // Good: <0.1, Needs improvement: 0.1-0.25, Poor: >0.25
  FCP: 1800,    // Good: <1.8s, Needs improvement: 1.8-3s, Poor: >3s
  TTFB: 800,    // Good: <800ms, Needs improvement: 800-1800ms, Poor: >1800ms
} as const;

// Alert thresholds (when to trigger alerts)
export const ALERT_THRESHOLDS = {
  LCP: 4000,    // Alert if LCP > 4s (poor performance)
  INP: 500,     // Alert if INP > 500ms (poor interactivity)
  CLS: 0.25,    // Alert if CLS > 0.25 (poor visual stability)
  FCP: 3000,    // Alert if FCP > 3s (poor rendering)
  TTFB: 1800,   // Alert if TTFB > 1.8s (slow server response)
} as const;

// Interface for performance analytics service
interface PerformanceMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  url: string;
  userAgent: string;
}

/**
 * Determines performance rating based on metric name and value
 */
function getPerformanceRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'LCP':
      return value <= PERFORMANCE_BUDGETS.LCP ? 'good' : value <= ALERT_THRESHOLDS.LCP ? 'needs-improvement' : 'poor';
    case 'INP':
      return value <= PERFORMANCE_BUDGETS.INP ? 'good' : value <= ALERT_THRESHOLDS.INP ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= PERFORMANCE_BUDGETS.CLS ? 'good' : value <= ALERT_THRESHOLDS.CLS ? 'needs-improvement' : 'poor';
    case 'FCP':
      return value <= PERFORMANCE_BUDGETS.FCP ? 'good' : value <= ALERT_THRESHOLDS.FCP ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= PERFORMANCE_BUDGETS.TTFB ? 'good' : value <= ALERT_THRESHOLDS.TTFB ? 'needs-improvement' : 'poor';
    default:
      return 'needs-improvement';
  }
}

/**
 * Sends performance metric to analytics service during idle time
 * Uses requestIdleCallback to avoid impacting user experience
 */
function sendMetricToAnalytics(metric: PerformanceMetric): void {
  const scheduleReport = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback, { timeout: 5000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(callback, 0);
    }
  };

  scheduleReport(() => {
    try {
      // Check if we should alert on poor performance
      if (metric.rating === 'poor') {
        console.warn(`🚨 Performance Alert: ${metric.name} is ${metric.value}${metric.name === 'CLS' ? '' : 'ms'} (threshold: ${ALERT_THRESHOLDS[metric.name as keyof typeof ALERT_THRESHOLDS]}${metric.name === 'CLS' ? '' : 'ms'})`);
      }

      // Log metric for development (replace with actual analytics service in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Performance Metric: ${metric.name}`, {
          value: `${metric.value}${metric.name === 'CLS' ? '' : 'ms'}`,
          rating: metric.rating,
          delta: metric.delta,
          timestamp: new Date(metric.timestamp).toISOString(),
        });
      }

      // In production, send to analytics service (e.g., Google Analytics, DataDog, New Relic)
      // Example for Google Analytics 4:
      // gtag('event', 'web_vital', {
      //   event_category: 'Web Vitals',
      //   event_label: metric.id,
      //   value: Math.round(metric.value),
      //   custom_parameter_1: metric.name,
      //   custom_parameter_2: metric.rating,
      // });

      // Example for custom analytics endpoint:
      // fetch('/api/analytics/web-vitals', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metric),
      // }).catch(error => {
      //   console.error('Failed to send performance metric:', error);
      // });

    } catch (error) {
      console.error('Error processing performance metric:', error);
    }
  });
}

/**
 * Processes a Web Vitals metric and sends it to analytics
 */
function handleMetric(metric: Metric): void {
  const performanceMetric: PerformanceMetric = {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'navigate',
    timestamp: Date.now(),
    rating: getPerformanceRating(metric.name, metric.value),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  sendMetricToAnalytics(performanceMetric);
}

/**
 * Initializes Web Vitals performance monitoring
 * Safe to call multiple times - will only initialize once
 */
let isInitialized = false;

export function initializePerformanceMonitoring(): void {
  if (isInitialized) {
    console.warn('Performance monitoring already initialized');
    return;
  }

  try {
    // Track Core Web Vitals
    onLCP(handleMetric);
    onINP(handleMetric);
    onCLS(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);

    isInitialized = true;

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Performance monitoring initialized - tracking Core Web Vitals');
      console.log('📏 Performance budgets:', PERFORMANCE_BUDGETS);
      console.log('🔔 Alert thresholds:', ALERT_THRESHOLDS);
    }
  } catch (error) {
    console.error('Failed to initialize performance monitoring:', error);
  }
}

/**
 * Manually track custom performance metrics
 */
export function trackCustomMetric(name: string, value: number, details?: Record<string, any>): void {
  const scheduleReport = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback, { timeout: 5000 });
    } else {
      setTimeout(callback, 0);
    }
  };

  scheduleReport(() => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📈 Custom Performance Metric: ${name}`, {
          value: `${value}ms`,
          details,
          timestamp: new Date().toISOString(),
        });
      }

      // Send to analytics service in production
      // This allows tracking of custom application-specific metrics
      // like route transition times, API response times, etc.

    } catch (error) {
      console.error('Error tracking custom metric:', error);
    }
  });
}

/**
 * Get current performance budget status
 */
export function getPerformanceBudgetStatus(): Record<string, boolean> {
  const performance = window.performance;
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  if (!navigation) {
    return {};
  }

  const ttfb = navigation.responseStart - navigation.requestStart;
  const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;

  return {
    TTFB: ttfb <= PERFORMANCE_BUDGETS.TTFB,
    FCP: fcp <= PERFORMANCE_BUDGETS.FCP,
    // LCP, INP, CLS are only available through web-vitals library callbacks
  };
}

// PERFORMANCE_BUDGETS and ALERT_THRESHOLDS are already exported above