import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ReportPageShellProps {
  title: string;
  breadcrumbs: Breadcrumb[];
  actions?: ReactNode;
  children: ReactNode;
}

export function ReportPageShell({ title, breadcrumbs, actions, children }: ReportPageShellProps) {
  return (
    <div className="p-content lg:p-widget space-y-section">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-center justify-between gap-content">
        <h1 className="text-3xl font-bold">{title}</h1>
        {actions && <div className="flex items-center gap-compact">{actions}</div>}
      </div>

      <div className="space-y-section">{children}</div>
    </div>
  );
}
