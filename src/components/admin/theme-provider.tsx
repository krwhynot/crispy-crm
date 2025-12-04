/**
 * Theme Provider using next-themes
 *
 * Replaces custom implementation with battle-tested library that provides:
 * - Automatic FOUC prevention (inline script injection)
 * - System theme detection with live updates
 * - Cross-tab synchronization
 * - Transition disabling during theme switch
 * - color-scheme CSS property management
 *
 * @see docs/decisions/dark-mode-best-practices.md
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark" | "system";
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class" // Use 'class' for Tailwind dark mode
      defaultTheme={defaultTheme}
      enableSystem={true} // Detect prefers-color-scheme
      enableColorScheme={true} // Set CSS color-scheme property
      disableTransitionOnChange // Prevent jarring transitions during switch
      storageKey={storageKey}
    >
      {children}
    </NextThemesProvider>
  );
}

// Re-export useTheme from next-themes for convenience
export { useTheme } from "next-themes";
