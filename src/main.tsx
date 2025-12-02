import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.tsx";

// Initialize Sentry monitoring
// Only enabled when VITE_SENTRY_DSN is configured (production/staging)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE, // 'development', 'production', etc.
    // Release version for tracking deployments and source maps
    release: import.meta.env.VITE_APP_VERSION || import.meta.env.VITE_COMMIT_SHA || "dev",
    integrations: [
      // Automatic performance monitoring for page loads and navigation
      Sentry.browserTracingIntegration({
        // Trace requests to Supabase for backend correlation
        tracePropagationTargets: [
          "localhost",
          /^https:\/\/.*\.supabase\.co/,
          /^https:\/\/.*\.vercel\.app/,
        ],
      }),
      // Session replay - records user sessions when errors occur
      Sentry.replayIntegration({
        maskAllText: false, // Set to true to mask all text for privacy
        blockAllMedia: false, // Set to true to block all media (images, videos)
        // Sticky sessions help debug persistent UI issues
        stickySession: true,
      }),
    ],
    // Performance monitoring sample rate (1.0 = 100% of transactions)
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
    // Session replay sample rates
    // Temporarily higher (0.3) while debugging blank screen issues, reduce to 0.1 after
    replaysSessionSampleRate: import.meta.env.PROD ? 0.3 : 0.1,
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    /**
     * Filter out known noise before sending to Sentry
     * Returns null to drop the event, or the event to send it
     */
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Filter out ResizeObserver errors (common browser noise)
      if (error instanceof Error) {
        if (error.message?.includes("ResizeObserver loop")) {
          return null;
        }
        // Filter out chunk load failures (usually network issues, not bugs)
        if (
          error.message?.includes("Loading chunk") ||
          error.message?.includes("Failed to fetch dynamically imported module")
        ) {
          return null;
        }
        // Filter out network abort errors (user navigated away)
        if (error.name === "AbortError" || error.message?.includes("The operation was aborted")) {
          return null;
        }
      }

      // Normalize Supabase auth cancellation to warning level (not critical)
      if (error instanceof Error && error.message?.includes("Auth session missing")) {
        event.level = "warning";
      }

      return event;
    },

    /**
     * Filter breadcrumbs to reduce noise
     */
    beforeBreadcrumb(breadcrumb) {
      // Drop console.debug breadcrumbs (too noisy)
      if (breadcrumb.category === "console" && breadcrumb.level === "debug") {
        return null;
      }
      return breadcrumb;
    },
  });
}

// Create root
const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
