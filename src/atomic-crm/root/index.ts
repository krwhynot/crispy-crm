// Root configuration barrel exports
export { CRM } from "./CRM";
export {
  ConfigurationContext,
  useConfigurationContext,
  // Focused hooks for better performance (P2-1 fix)
  useAppBranding,
  usePipelineConfig,
  useFormOptions,
} from "./ConfigurationContext";
export type { CRMConfiguration } from "./ConfigurationContext";
export { defaultConfiguration } from "./defaultConfiguration";
export { i18nProvider } from "./i18nProvider";

// Re-export focused context types and providers
export type { AppBranding, AppBrandingProviderProps } from "../contexts/AppBrandingContext";
export type {
  PipelineConfig,
  PipelineConfigProviderProps,
} from "../contexts/PipelineConfigContext";
export type { FormOptions, FormOptionsProviderProps } from "../contexts/FormOptionsContext";
