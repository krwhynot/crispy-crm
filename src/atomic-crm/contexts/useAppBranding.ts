/**
 * Hook to access app branding (title, logos)
 *
 * Use this when you only need branding info - prevents re-renders
 * when pipeline or form configuration changes.
 */
import { useContext } from "react";
import { AppBrandingContext } from "./AppBrandingContext";

export const useAppBranding = () => useContext(AppBrandingContext);
