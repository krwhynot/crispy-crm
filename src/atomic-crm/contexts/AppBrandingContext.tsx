/**
 * AppBrandingContext - Application branding configuration
 *
 * This context holds rarely-changing branding values (logo, title) that are
 * set once at app initialization. By separating these from frequently-accessed
 * pipeline/form configuration, we prevent unnecessary re-renders in components
 * that only need branding info.
 *
 * Part of P2-1 fix: ConfigurationContext split into focused contexts
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  defaultTitle,
  defaultDarkModeLogo,
  defaultLightModeLogo,
} from "../root/defaultConfiguration";

export interface AppBranding {
  /** Application title displayed in header and login page */
  title: string;
  /** Logo path for dark mode theme */
  darkModeLogo: string;
  /** Logo path for light mode theme */
  lightModeLogo: string;
}

const defaultAppBranding: AppBranding = {
  title: defaultTitle,
  darkModeLogo: defaultDarkModeLogo,
  lightModeLogo: defaultLightModeLogo,
};

export const AppBrandingContext = createContext<AppBranding>(defaultAppBranding);

export interface AppBrandingProviderProps extends Partial<AppBranding> {
  children: ReactNode;
}

export const AppBrandingProvider = ({
  children,
  title = defaultTitle,
  darkModeLogo = defaultDarkModeLogo,
  lightModeLogo = defaultLightModeLogo,
}: AppBrandingProviderProps) => {
  const value = useMemo(
    () => ({ title, darkModeLogo, lightModeLogo }),
    [title, darkModeLogo, lightModeLogo]
  );

  return (
    <AppBrandingContext.Provider value={value}>
      {children}
    </AppBrandingContext.Provider>
  );
};

/**
 * Hook to access app branding (title, logos)
 *
 * Use this when you only need branding info - prevents re-renders
 * when pipeline or form configuration changes.
 */
export const useAppBranding = () => useContext(AppBrandingContext);
