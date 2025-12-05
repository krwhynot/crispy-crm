import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SettingsPage } from "./SettingsPage";
import { SettingsLayout } from "./SettingsLayout";

/**
 * Settings Feature Entry Point
 *
 * Provides error boundary wrapper and re-exports for the settings feature.
 * Unlike React Admin resources (contacts, opportunities), settings is a custom
 * page component that requires generic error boundary handling.
 */

export function Settings() {
  return (
    <ErrorBoundary feature="settings">
      <SettingsPage />
    </ErrorBoundary>
  );
}

// Re-export for direct access if needed
export { SettingsPage } from "./SettingsPage";
export { SettingsLayout } from "./SettingsLayout";
