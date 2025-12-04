import { useEffect, useState } from "react";

/** Chart color palette derived from CSS custom properties */
interface ChartColors {
  primary: string;
  brand700: string;
  brand600: string;
  success: string;
  warning: string;
  destructive: string;
  muted: string;
}

/** Chart font configuration */
interface ChartFont {
  family: string;
  size: number;
}

/** Complete chart theme configuration */
export interface ChartTheme {
  colors: ChartColors;
  font: ChartFont;
}

/**
 * Fail-fast error for missing CSS variables
 *
 * Engineering Constitution #1: Fail-fast error handling (no silent fallbacks)
 * Engineering Constitution #8: Semantic colors only (never hex codes)
 *
 * @throws Error if CSS custom properties are not available
 */
function throwMissingCssVarError(varName: string): never {
  throw new Error(
    `[ChartTheme] CSS custom property "${varName}" is not defined. ` +
      `Ensure design system is loaded before rendering charts. ` +
      `Constitution #8: Never use hex fallback colors.`
  );
}

/**
 * Default theme values using CSS variable references
 *
 * These are only used during initial render before useEffect runs.
 * If CSS vars are missing, the hook will fail-fast with an error.
 */
const DEFAULT_THEME: ChartTheme = {
  colors: {
    // Use var() directly - CSS variables contain OKLCH values, not HSL channels
    primary: "var(--primary)",
    brand700: "var(--brand-700)",
    brand600: "var(--brand-600)",
    success: "var(--success)",
    warning: "var(--warning)",
    destructive: "var(--destructive)",
    muted: "var(--muted)",
  },
  font: {
    family: "var(--font-sans, system-ui)",
    size: 12,
  },
};

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(DEFAULT_THEME);

  useEffect(() => {
    const root = document.documentElement;
    const computedStyles = getComputedStyle(root);

    /**
     * Get CSS custom property value with fail-fast validation
     *
     * @param varName - CSS custom property name (without --)
     * @returns Resolved CSS value
     * @throws Error if CSS variable is not defined
     */
    const getCssVar = (varName: string): string => {
      const value = computedStyles.getPropertyValue(`--${varName}`).trim();
      if (!value) {
        throwMissingCssVarError(`--${varName}`);
      }
      return value;
    };

    setTheme({
      colors: {
        // Semantic color variables (Constitution #8)
        primary: getCssVar("primary"),
        brand700: getCssVar("brand-700"),
        brand600: getCssVar("brand-600"),
        success: getCssVar("success"),
        warning: getCssVar("warning"),
        destructive: getCssVar("destructive"),
        muted: getCssVar("muted"),
      },
      font: {
        // Font variable with system-ui fallback (safe fallback for non-color)
        family: computedStyles.getPropertyValue("--font-sans").trim() || "system-ui",
        size: 12,
      },
    });
  }, []);

  return theme;
}
