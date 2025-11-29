import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.tsx";
import { initSentry } from "./lib/sentry";

// Initialize Sentry as early as possible
initSentry();

// Create root with React 19 error hooks for Sentry integration
const container = document.getElementById("root")!;
const root = createRoot(container, {
  // Callback called when an error is thrown and not caught by an ErrorBoundary
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.error("Uncaught error:", error, errorInfo.componentStack);
  }),
  // Callback called when React catches an error in an ErrorBoundary
  onCaughtError: Sentry.reactErrorHandler(),
  // Callback called when React automatically recovers from errors
  onRecoverableError: Sentry.reactErrorHandler(),
});

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
