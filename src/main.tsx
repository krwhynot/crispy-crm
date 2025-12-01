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
    integrations: [
      // Automatic performance monitoring for page loads and navigation
      Sentry.browserTracingIntegration(),
      // Session replay - records user sessions when errors occur
      Sentry.replayIntegration({
        maskAllText: false, // Set to true to mask all text for privacy
        blockAllMedia: false, // Set to true to block all media (images, videos)
      }),
    ],
    // Performance monitoring sample rate (1.0 = 100% of transactions)
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
    // Session replay sample rates
    replaysSessionSampleRate: 0.1, // 10% of normal sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  });
}

// Build: 2024-11-30-v2 - force fresh deployment
// Create root
const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
