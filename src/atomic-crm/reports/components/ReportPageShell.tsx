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
  children: ReactNode;
}

export function ReportPageShell({ title, breadcrumbs, actions, children }: ReportPageShellProps) {
  return (
    <div className="p-content lg:p-widget space-y-section">
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
        <h1 className="text-3xl font-bold">{title}</h1>
        {actions && <div className="flex items-center gap-compact">{actions}</div>}
      </div>

      <div className="space-y-section">{children}</div>
    </div>
  );
}
