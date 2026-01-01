/**
 * Focused Configuration Contexts
 *
 * These contexts replace the monolithic ConfigurationContext to prevent
 * unnecessary re-renders. Each context serves a specific purpose:
 *
 * - AppBrandingContext: title, logos (rarely changes)
 * - PipelineConfigContext: stages, categories (pipeline workflow)
 * - FormOptionsContext: note statuses, task types (form inputs)
 *
 * Components should import only the context they need to minimize re-renders.
 */

export {
  AppBrandingContext,
  AppBrandingProvider,
  type AppBranding,
  type AppBrandingProviderProps,
} from "./AppBrandingContext";
export { useAppBranding } from "./useAppBranding";

export {
  PipelineConfigContext,
  PipelineConfigProvider,
  type PipelineConfig,
  type PipelineConfigProviderProps,
} from "./PipelineConfigContext";
export { usePipelineConfig } from "./usePipelineConfig";

export {
  FormOptionsContext,
  FormOptionsProvider,
  type FormOptions,
  type FormOptionsProviderProps,
} from "./FormOptionsContext";
export { useFormOptions } from "./useFormOptions";
