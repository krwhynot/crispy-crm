/**
 * Theme Mode Toggle Component
 *
 * Three-way toggle (Light/Dark/System) with proper hydration safety.
 * Uses mounted check to prevent hydration mismatch between server and client.
 *
 * @see docs/decisions/dark-mode-best-practices.md - Hydration Safety section
 */

import { useState, useEffect } from "react";
import { Check, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeModeToggle() {
  // MUST: Delay theme-dependent UI until mounted to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return skeleton placeholder during SSR/initial hydration
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="hidden sm:inline-flex"
        aria-label="Loading theme toggle"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Loading theme toggle</span>
      </Button>
    );
  }

  // Determine which icon to show based on resolved theme
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex"
          aria-label={`Toggle theme (current: ${theme === "system" ? `system - ${resolvedTheme}` : theme})`}
        >
          <Sun
            className={cn(
              "h-[1.2rem] w-[1.2rem] transition-all",
              isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
            )}
          />
          <Moon
            className={cn(
              "absolute h-[1.2rem] w-[1.2rem] transition-all",
              isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
            )}
          />
          <span className="sr-only">
            Toggle theme (current: {theme === "system" ? `system preference (${resolvedTheme})` : theme})
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          <Check className={cn("ml-auto h-4 w-4", theme !== "light" && "opacity-0")} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          <Check className={cn("ml-auto h-4 w-4", theme !== "dark" && "opacity-0")} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {theme === "system" && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({resolvedTheme})
            </span>
          )}
          <Check className={cn("ml-auto h-4 w-4", theme !== "system" && "opacity-0")} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
