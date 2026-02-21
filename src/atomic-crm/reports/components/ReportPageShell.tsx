import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from "@/components/ra-wrappers/breadcrumb";

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

interface ReportPageShellProps {
  title: string;
  breadcrumbs: BreadcrumbEntry[];
  actions?: ReactNode;
  /** Shared filter controls rendered between section rule and tab content (e.g., ReportParameterBar) */
  filterBar?: ReactNode;
  children: ReactNode;
}

export function ReportPageShell({
  title,
  breadcrumbs,
  actions,
  filterBar,
  children,
}: ReportPageShellProps) {
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

      {filterBar && <div className="py-2">{filterBar}</div>}

      <div className="space-y-widget">{children}</div>
    </div>
  );
}
