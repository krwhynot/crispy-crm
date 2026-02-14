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
  /** Inline filter header rendered between title row and children (e.g., ReportContextHeader) */
  contextHeader?: ReactNode;
  children: ReactNode;
}

export function ReportPageShell({
  title,
  breadcrumbs,
  actions,
  contextHeader,
  children,
}: ReportPageShellProps) {
  return (
    <div className="p-content md:p-widget space-y-section">
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
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        {actions && <div className="flex items-center gap-compact">{actions}</div>}
      </div>

      {/* Gap #4: Sticky context header — sits outside overflow-hidden containers
          so position:sticky works against the document viewport */}
      {contextHeader && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mx-4 px-4 py-2">
          {contextHeader}
        </div>
      )}

      <div className="space-y-widget">{children}</div>
    </div>
  );
}
