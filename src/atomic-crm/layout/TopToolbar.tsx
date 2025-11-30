import * as React from "react";
import { cn } from "@/lib/utils.ts";
import { KeyboardShortcutHints } from "@/components/admin/KeyboardShortcutHints";

export interface TopToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /**
   * Whether to show keyboard shortcut hints button
   * @default true
   */
  showKeyboardHints?: boolean;
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
  const { className, children, showKeyboardHints = true, ...props } = inProps;

  return (
    <div
      className={cn("flex flex-auto justify-end items-center gap-2 whitespace-nowrap", className)}
      {...props}
    >
      {showKeyboardHints && <KeyboardShortcutHints />}
      {children}
    </div>
  );
};

export default TopToolbar;
