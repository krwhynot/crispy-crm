import { useEffect, useState } from "react";

export function useChartTheme() {
  const [theme, setTheme] = useState({
    colors: {
      primary: "#000",
      brand700: "#1a1a1a",
      brand600: "#2a2a2a",
      success: "#10b981",
      warning: "#f59e0b",
      destructive: "#ef4444",
      muted: "#6b7280",
    },
    font: {
      family: "system-ui",
      size: 12,
    },
  });

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
