import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/admin/AdminButton";
import { Download } from "lucide-react";

interface ReportLayoutProps {
  title: string;
  children: ReactNode;
  onExport?: () => void;
  actions?: ReactNode;
}

/**
 * ReportLayout Component
 *
 * Consistent layout wrapper for all reports:
 * - Title with export button
 * - Custom actions slot
 * - Semantic spacing
 */
export function ReportLayout({ title, children, onExport, actions }: ReportLayoutProps) {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          {actions}
          {onExport && (
            <AdminButton onClick={onExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </AdminButton>
          )}
        </div>
      </div>
      <Card>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );
}
