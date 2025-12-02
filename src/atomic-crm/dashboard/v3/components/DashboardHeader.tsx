interface DashboardHeaderProps {
  /** Page title displayed as h1 */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Optional action buttons (right side) */
  children?: React.ReactNode;
}

/**
 * DashboardHeader - Reusable dashboard page header
 *
 * Provides consistent styling for dashboard headers with:
 * - Title (h1) and optional subtitle
 * - Actions slot on the right (for buttons, search, etc.)
 * - Border bottom for visual separation
 * - Semantic HTML (header element)
 *
 * @example
 * ```tsx
 * <DashboardHeader title="Principal Dashboard" subtitle="Track your pipeline">
 *   <Button>Log Activity</Button>
 * </DashboardHeader>
 * ```
 */
export function DashboardHeader({ title, subtitle, children }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-content lg:px-widget">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-content">{children}</div>
        )}
      </div>
    </header>
  );
}
