import { Package, DollarSign, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useCreatePath, useRecordContext } from "ra-core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

import type { Product } from "../types";

export const ProductCard = (props: { record?: Product }) => {
  const createPath = useCreatePath();
  const record = useRecordContext<Product>(props);
  if (!record) return null;

  const statusColors: Record<string, string> = {
    active: "default",
    discontinued: "destructive",
    seasonal: "outline",
    coming_soon: "secondary",
    limited_availability: "warning", // Custom orange variant
  };

  return (
    <Link
      to={createPath({
        resource: "products",
        id: record.id,
        type: "show",
      })}
      className="no-underline group"
    >
      <Card className="h-[200px] flex flex-col justify-between p-4
                       bg-card border border-border rounded-xl
                       shadow-sm hover:shadow-md
                       transition-shadow duration-200
                       motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]
                       hover:border-primary/20">
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center mt-1">
            <h6 className="text-sm font-medium line-clamp-1 group-hover:text-foreground transition-colors">{record.name}</h6>
            <p className="text-xs text-[color:var(--text-subtle)]">SKU: {record.sku}</p>
            <div className="flex gap-1 mt-1 justify-center flex-wrap">
              {record.status && (
                <Badge
                  variant={statusColors[record.status] === "warning" ? "outline" : statusColors[record.status] as any}
                  className={cn(
                    "text-xs px-1 py-0",
                    statusColors[record.status] === "warning" && "border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                  )}
                >
                  {record.status.replace(/_/g, ' ')}
                </Badge>
              )}
              {record.brand && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {record.brand}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {record.list_price && (
            <div className="flex items-center justify-center gap-0.5">
              <DollarSign className="w-3 h-3 text-[color:var(--text-subtle)]" />
              <span className="text-sm font-medium">
                ${record.list_price.toFixed(2)}
              </span>
            </div>
          )}
          {record.last_promoted_at && (
            <div className="flex items-center justify-center gap-0.5">
              <TrendingUp className="w-3 h-3 text-[color:var(--text-subtle)]" />
              <span className="text-xs text-[color:var(--text-subtle)]">
                {formatDistanceToNow(new Date(record.last_promoted_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};