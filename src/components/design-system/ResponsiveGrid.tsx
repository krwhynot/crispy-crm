// src/components/design-system/ResponsiveGrid.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Grid layout variants
 *
 * Constitutional approach: Only 2 variants (dashboard, cards)
 * Don't over-engineer - other layouts can use Tailwind directly
 */
type GridVariant =
  | "dashboard" // 70/30 split (main content + sidebar)
  | "cards"; // Auto-fit responsive cards

interface ResponsiveGridProps {
  /**
   * Grid layout variant
   */
  variant: GridVariant;

  /**
   * Gap between grid items (Tailwind spacing class)
   * @default 'gap-6' (24px)
   */
  gap?: string;

  /**
   * Children elements
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Responsive grid patterns for common layouts
 *
 * Breakpoint strategy (iPad-first):
 * - Mobile (< 768px): Single column for all variants
 * - Tablet Portrait (768-1023px): md: prefix
 * - Tablet Landscape+ (1024px+): lg: prefix
 *
 * @example
 * // Dashboard layout (70% main + 30% sidebar)
 * <ResponsiveGrid variant="dashboard">
 *   <div>{/* Main content *\/}</div>
 *   <div>{/* Sidebar *\/}</div>
 * </ResponsiveGrid>
 *
 * @example
 * // Auto-fit card grid
 * <ResponsiveGrid variant="cards">
 *   {principals.map(p => <PrincipalCard key={p.id} {...p} />)}
 * </ResponsiveGrid>
 */
const gridVariants: Record<GridVariant, string> = {
  /**
   * Dashboard: Main content (70%) + Sidebar (30%)
   * Mobile: Stack vertically
   * Tablet Landscape+: 70/30 split side-by-side
   *
   * Used in: Dashboard, Opportunity detail, Reports
   */
  dashboard: "grid grid-cols-1 lg:grid-cols-[7fr_3fr]",

  /**
   * Cards: Auto-fit responsive card grid
   * Mobile: 1 column
   * Tablet Portrait: 2 columns
   * Tablet Landscape: 3 columns
   * Desktop: 4 columns
   *
   * Used in: Contact list, Organization list, Principal cards
   */
  cards: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  variant,
  gap = "gap-6",
  children,
  className,
}) => {
  return <div className={cn(gridVariants[variant], gap, className)}>{children}</div>;
};

ResponsiveGrid.displayName = "ResponsiveGrid";
