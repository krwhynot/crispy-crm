/**
 * Sentry Integration Configuration
 *
 * Provides client-side error tracking, structured logging, and performance monitoring.
 * Configured with:
 * - Error boundaries for React components
 * - Breadcrumb trail for debugging context
 * - Session replay for error reproduction (production only)
 * - Performance tracing for slow operations
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/react/
 */

import * as Sentry from "@sentry/react";

/**
 * Environment configuration for Sentry
 * DSN should be set via VITE_SENTRY_DSN environment variable
 */
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEVELOPMENT = import.meta.env.DEV;

/**
 * Sample rates configuration
 * - Traces: 100% in dev, 20% in production (cost optimization)
 * - Replays: 10% sessions, 100% on error (for debugging)
 */
const TRACES_SAMPLE_RATE = IS_PRODUCTION ? 0.2 : 1.0;
const REPLAYS_SESSION_SAMPLE_RATE = IS_PRODUCTION ? 0.1 : 0;
const REPLAYS_ON_ERROR_SAMPLE_RATE = IS_PRODUCTION ? 1.0 : 0;

/**
 * Initialize Sentry SDK
 * Should be called as early as possible in main.tsx
 */
export function initSentry(): void {
  // Skip initialization if no DSN configured
  if (!SENTRY_DSN) {
    if (IS_DEVELOPMENT) {
      console.info("[Sentry] Skipped initialization - no DSN configured");
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment identification
    environment: IS_PRODUCTION ? "production" : "development",
    release: `crispy-crm@${import.meta.env.VITE_APP_VERSION || "0.1.0"}`,

    // Enable PII for user context (email, IP for support)
    sendDefaultPii: true,

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration(),

      // Session replay for error reproduction (production only)
      ...(IS_PRODUCTION
        ? [
            Sentry.replayIntegration({
              // Mask all text and block all media for privacy
              maskAllText: false,
              blockAllMedia: false,
            }),
          ]
        : []),
    ],

    // Performance monitoring sample rate
    tracesSampleRate: TRACES_SAMPLE_RATE,

    // Session replay sample rates
    replaysSessionSampleRate: REPLAYS_SESSION_SAMPLE_RATE,
    replaysOnErrorSampleRate: REPLAYS_ON_ERROR_SAMPLE_RATE,

    // Trace propagation for distributed tracing with Supabase
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/.*\.supabase\.co/,
      /^https:\/\/.*\.supabase\.in/,
    ],

    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // Network errors that are expected
      "Network request failed",
      "Failed to fetch",
      // User-initiated cancellations
      "AbortError",
      // React Admin internals
      "ra.notification.logged_out",
    ],

    // Limit breadcrumbs to reduce payload size
    maxBreadcrumbs: 50,

    // Before send hook for additional filtering
    beforeSend(event, _hint) {
      // Skip errors in development unless explicitly enabled
      if (IS_DEVELOPMENT && !import.meta.env.VITE_SENTRY_DEV_ENABLED) {
        console.info("[Sentry] Would send event:", event.exception?.values?.[0]?.value);
        return null;
      }

      // Add custom context
      event.tags = {
        ...event.tags,
        app: "crispy-crm",
        browser: navigator.userAgent.includes("Mobile") ? "mobile" : "desktop",
      };

      return event;
    },

    // Before breadcrumb hook for filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out verbose console logs
      if (breadcrumb.category === "console" && breadcrumb.level === "log") {
        return null;
      }
      return breadcrumb;
    },
  });

  if (IS_DEVELOPMENT) {
    console.info("[Sentry] Initialized successfully");
  }
}

/**
 * Set user context for error tracking
 * Call this after successful authentication
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  role?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Clear user context on logout
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(
  message: string,
  category: "navigation" | "user" | "api" | "error" | "info",
  data?: Record<string, unknown>,
  level: "debug" | "info" | "warning" | "error" = "info"
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture a custom exception with context
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: "fatal" | "error" | "warning" | "info" | "debug";
  }
): string {
  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || "error",
  });
}

/**
 * Capture a custom message
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
  context?: Record<string, unknown>
): string {
  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set custom tags for filtering
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set multiple tags at once
 */
export function setTags(tags: Record<string, string>): void {
  Sentry.setTags(tags);
}

/**
 * Set extra context data
 */
export function setExtra(key: string, value: unknown): void {
  Sentry.setExtra(key, value);
}

/**
 * Create a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

// Re-export Sentry for direct access when needed
export { Sentry };
