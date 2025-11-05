import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initializePerformanceMonitoring } from "./lib/monitoring/performance";
import "./index.css";
import App from "./App.tsx";

// Initialize performance monitoring
initializePerformanceMonitoring();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
