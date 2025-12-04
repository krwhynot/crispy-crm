import { Package, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useCreatePath, useRecordContext, useListContext } from "ra-core";
import { formatDistanceToNow } from "date-fns";
import type { VariantProps } from "class-variance-authority";
import { parseDateSafely } from "@/lib/date-utils";

import { Card } from "@/components/ui/card";
import type { badgeVariants } from "@/components/ui/badge.constants";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Product } from "../types";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export const ProductCard = (props: { record?: Product }) => {
  const createPath = useCreatePath();
  const record = useRecordContext<Product>(props);
  const { selectedIds, onToggleItem } = useListContext();
  if (!record) return null;

  const statusColors: Record<string, BadgeVariant> = {
    active: "default",
    discontinued: "destructive",
    coming_soon: "secondary",
  };

  return (
    <div className="relative">
      {/* Checkbox positioned absolutely in top-left corner */}
      <Checkbox
        checked={selectedIds.includes(record.id)}
        onCheckedChange={() => onToggleItem(record.id)}
        aria-label={`Select ${record.name}`}
        className="absolute top-2 left-2 z-10"
        onClick={(e) => e.stopPropagation()}
      />

      <Link
        to={createPath({
          resource: "products",
          id: record.id,
          type: "show",
        })}
        className="no-underline group"
      >
        <Card className="h-[200px] flex flex-col justify-between p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] hover:border-primary/20">
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center mt-1">
              <h3 className="text-sm font-medium line-clamp-1 group-hover:text-foreground transition-colors">
                {record.name}
              </h3>
              <p className="text-xs text-muted-foreground">SKU: {record.sku}</p>
              <div className="flex gap-1 mt-1 justify-center flex-wrap">
                {record.status && (
                  <Badge variant={statusColors[record.status]} className="text-xs px-1 py-0">
                    {record.status.replace(/_/g, " ")}
                  </Badge>
                )}
                {record.principal_name && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {record.principal_name}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {record.last_promoted_at && parseDateSafely(record.last_promoted_at) && (
              <div className="flex items-center justify-center gap-0.5">
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(parseDateSafely(record.last_promoted_at)!, {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </div>
  );
};
