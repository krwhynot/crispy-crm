import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from "@/components/ra-wrappers/breadcrumb";
import { useOptionalFilterSidebarContext } from "@/components/layouts/FilterSidebarContext";
import { cn } from "@/lib/utils";

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

interface ReportPageShellProps {
  title: string;
  breadcrumbs: BreadcrumbEntry[];
  actions?: ReactNode;
  /** Filter sidebar rendered in a docked grid column (xl+) or sheet (below xl) */
  sidebar?: ReactNode;
  children: ReactNode;
}

export function ReportPageShell({
  title,
  breadcrumbs,
  actions,
  sidebar,
  children,
}: ReportPageShellProps) {
  const sidebarContext = useOptionalFilterSidebarContext();
  const isCollapsed = sidebarContext?.isCollapsed ?? false;

  return (
    <div className="paper-dashboard-surface p-content md:p-widget space-y-section rounded-xl">
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/">Home</Link>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb) =>
          crumb.href ? (
            <BreadcrumbItem key={crumb.label}>
              <Link to={crumb.href}>{crumb.label}</Link>
            </BreadcrumbItem>
          ) : (
            <BreadcrumbPage key={crumb.label}>{crumb.label}</BreadcrumbPage>
          )
        )}
      </Breadcrumb>

      <div className="flex items-center justify-between gap-content">
        <h1 className="text-lg font-semibold">{title}</h1>
        {actions && <div className="flex items-center gap-compact">{actions}</div>}
      </div>

      {sidebar ? (
        <div
          className={cn(
            "xl:grid xl:gap-content",
            isCollapsed
              ? "xl:grid-cols-[var(--list-sidebar-collapsed-width)_1fr]"
              : "xl:grid-cols-[var(--list-sidebar-width)_1fr]"
          )}
        >
          {sidebar}
          <div className="space-y-widget min-w-0">{children}</div>
        </div>
      ) : (
        <div className="space-y-widget">{children}</div>
      )}
    </div>
  );
}
