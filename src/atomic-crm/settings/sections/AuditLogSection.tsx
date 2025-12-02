import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetList, useGetIdentity } from "ra-core";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";

export function AuditLogSection() {
  const { data: identity } = useGetIdentity();

  // Always call hooks unconditionally (React hooks rules)
  const { data: auditEntries, isLoading } = useGetList(
    "audit_trail",
    {
      pagination: { page: 1, perPage: 50 },
      sort: { field: "changed_at", order: "DESC" },
    },
    {
      enabled: identity?.role === "admin", // Only fetch if admin
    }
  );

  if (identity?.role !== "admin") {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Activity log is only available to administrators.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {auditEntries?.map((entry: any) => (
                <div key={entry.audit_id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{entry.table_name}</Badge>
                    <span className="font-medium">{entry.field_name}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="line-through">{entry.old_value || "(empty)"}</span>
                    {" → "}
                    <span className="text-foreground">{entry.new_value || "(empty)"}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
