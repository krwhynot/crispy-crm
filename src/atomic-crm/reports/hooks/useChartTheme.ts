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
    primary: "hsl(var(--primary))",
    brand700: "hsl(var(--brand-700))",
    brand600: "hsl(var(--brand-600))",
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    destructive: "hsl(var(--destructive))",
    muted: "hsl(var(--muted))",
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

    setTheme({
      colors: {
        primary: computedStyles.getPropertyValue("--primary") || "#000",
        brand700: computedStyles.getPropertyValue("--brand-700") || "#1a1a1a",
        brand600: computedStyles.getPropertyValue("--brand-600") || "#2a2a2a",
        success: computedStyles.getPropertyValue("--success") || "#10b981",
        warning: computedStyles.getPropertyValue("--warning") || "#f59e0b",
        destructive: computedStyles.getPropertyValue("--destructive") || "#ef4444",
        muted: computedStyles.getPropertyValue("--muted") || "#6b7280",
      },
      font: {
        family: computedStyles.getPropertyValue("--font-sans") || "system-ui",
        size: 12,
      },
    });
  }, []);

  return theme;
}
