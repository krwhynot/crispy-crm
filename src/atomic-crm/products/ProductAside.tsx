import {
  Edit,
  Package,
  Building2,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useRecordContext,
  useReference,
  useCreatePath
} from "ra-core";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Product, Organization } from "../types";

export const ProductAside = () => {
  const record = useRecordContext<Product>();
  const createPath = useCreatePath();

  // Get principal/supplier information
  const { data: principal } = useReference<Organization>({
    reference: "organizations",
    id: record?.principal_id,
  });

  // Get distributor information
  const { data: distributor } = useReference<Organization>({
    reference: "organizations",
    id: record?.distributor_id,
  });

  if (!record) return null;

  const statusColors: Record<string, string> = {
    active: "bg-green-500",
    discontinued: "bg-red-500",
    coming_soon: "bg-blue-500",
  };

  const statusColor = record.status ? statusColors[record.status] : "bg-muted-foreground";

  return (
    <Card className="p-6 space-y-4">
      {/* Quick Actions */}
      <div className="space-y-2">
        <Link
          to={createPath({
            resource: "products",
            id: record.id,
            type: "edit",
          })}
        >
          <Button variant="outline" className="w-full justify-start">
            <Edit className="w-4 h-4 mr-2" />
            Edit Product
          </Button>
        </Link>
        <Button variant="outline" className="w-full justify-start" disabled>
          <Package className="w-4 h-4 mr-2" />
          Duplicate Product
        </Button>
      </div>

      <Separator />

      {/* Status */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-[color:var(--text-subtle)]">Status</h4>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="capitalize">{record.status || "Unknown"}</span>
        </div>
      </div>

      <Separator />

      {/* Price Summary */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-[color:var(--text-subtle)]">Pricing</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">List Price</span>
            <span className="font-medium">
              ${record.list_price?.toFixed(2) || "0.00"}
            </span>
          </div>
          {record.cost_per_unit && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Cost</span>
              <span className="text-sm text-[color:var(--text-subtle)]">
                ${record.cost_per_unit.toFixed(2)}
              </span>
            </div>
          )}
          {record.list_price && record.cost_per_unit && (
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Margin
              </span>
              <span className="text-sm font-medium text-success-default">
                {((record.list_price - record.cost_per_unit) / record.list_price * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Supplier/Principal */}
      {principal && (
        <>
          <div>
            <h4 className="text-sm font-medium mb-2 text-[color:var(--text-subtle)]">
              Supplier
            </h4>
            <Link
              to={createPath({
                resource: "organizations",
                id: principal.id,
                type: "show",
              })}
              className="hover:underline"
            >
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 mt-0.5 text-[color:var(--text-subtle)]" />
                <div>
                  <p className="text-sm font-medium">{principal.name}</p>
                  {principal.segment && (
                    <p className="text-xs text-[color:var(--text-subtle)]">
                      {principal.segment}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>
          <Separator />
        </>
      )}

      {/* Distributor */}
      {distributor && (
        <>
          <div>
            <h4 className="text-sm font-medium mb-2 text-[color:var(--text-subtle)]">
              Distributor
            </h4>
            <Link
              to={createPath({
                resource: "organizations",
                id: distributor.id,
                type: "show",
              })}
              className="hover:underline"
            >
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 mt-0.5 text-[color:var(--text-subtle)]" />
                <div>
                  <p className="text-sm font-medium">{distributor.name}</p>
                  {distributor.segment && (
                    <p className="text-xs text-[color:var(--text-subtle)]">
                      {distributor.segment}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>
          <Separator />
        </>
      )}

      {/* Metadata */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-[color:var(--text-subtle)]">
          Information
        </h4>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-0.5 text-[color:var(--text-subtle)]" />
            <div className="text-sm">
              <p className="text-[color:var(--text-subtle)]">Created</p>
              {record.created_at && (
                <p className="font-medium">
                  {formatDistanceToNow(new Date(record.created_at), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
          </div>
          {record.updated_at && record.updated_at !== record.created_at && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-0.5 text-[color:var(--text-subtle)]" />
              <div className="text-sm">
                <p className="text-[color:var(--text-subtle)]">Last Updated</p>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(record.updated_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerts/Warnings */}
      {record.status === "discontinued" && (
        <>
          <Separator />
          <div className="bg-destructive/10 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Product Discontinued
                </p>
                <p className="text-xs text-[color:var(--text-subtle)] mt-1">
                  This product is no longer available for ordering
                </p>
              </div>
            </div>
          </div>
        </>
      )}

    </Card>
  );
};