import * as React from "react";
import { cn } from "@/lib/utils.ts";

export interface TopToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * TopToolbar - Standardized toolbar for list view actions
 *
 * Provides a consistent layout for list-level actions like sort, filter,
 * import/export, and create. Includes keyboard shortcut hints by default.
 *
 * @example
 * ```tsx
 * <TopToolbar>
 *   <SortButton fields={["name", "created_at"]} />
 *   <ExportButton />
 *   <CreateButton />
 * </TopToolbar>
 * ```
 */
export const TopToolbar = (inProps: TopToolbarProps) => {
  const { className, children, ...props } = inProps;

  return (
    <div
      className={cn("flex flex-auto justify-end items-center gap-2 whitespace-nowrap", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default TopToolbar;
