import { useState } from "react";
import { useGetList } from "react-admin";
import { format } from "date-fns";
import { parseDateSafely } from "@/lib/date-utils";
import {
  Building2,
  Trash2,
  Calendar,
  MapPin,
  FileText,
  ChevronDown,
  ChevronRight,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import type {
  AuthorizationCardProps,
  AuthorizationWithPrincipal,
  PrincipalOrganization,
  Product,
  ProductAuthorization,
} from "./authorization-types";
import { ProductExceptionsSection } from "./ProductExceptionsSection";

export function AuthorizationCard({ authorization, distributorId, onRemove }: AuthorizationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: principal } = useGetList<PrincipalOrganization>("organizations", {
    filter: { id: authorization.principal_id },
    pagination: { page: 1, perPage: 1 },
  });

  const { data: productAuths, isPending: productAuthsLoading } = useGetList<ProductAuthorization>(
    "product_distributor_authorizations",
    {
      filter: { distributor_id: distributorId, deleted_at: null },
      sort: { field: "created_at", order: "DESC" },
      pagination: { page: 1, perPage: 50 },
    },
    { enabled: isExpanded }
  );

  const { data: principalProducts } = useGetList<Product>(
    "products",
    {
      filter: { principal_id: authorization.principal_id, deleted_at: null },
      sort: { field: "name", order: "ASC" },
      pagination: { page: 1, perPage: 100 },
    },
    { enabled: isExpanded }
  );

  const principalName = principal?.[0]?.name || `Principal #${authorization.principal_id}`;
  const expirationDate = authorization.expiration_date
    ? parseDateSafely(authorization.expiration_date)
    : null;
  const isExpired = expirationDate && expirationDate < new Date();
  const isActive = authorization.is_authorized && !isExpired;

  const principalProductIds = new Set(principalProducts?.map((p) => Number(p.id)) || []);
  const relevantProductAuths =
    productAuths?.filter((pa) => principalProductIds.has(pa.product_id)) || [];

  const exceptionCount = relevantProductAuths.length;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border border-border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex gap-4 p-4">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0 flex-shrink-0 mt-0.5"
              aria-label={isExpanded ? "Collapse product exceptions" : "Expand product exceptions"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{principalName}</span>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "Active" : isExpired ? "Expired" : "Inactive"}
                </Badge>
                {exceptionCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    {exceptionCount} exception{exceptionCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-11 w-11 p-0 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                title="Remove authorization"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
              {authorization.authorization_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Since{" "}
                    {format(
                      parseDateSafely(authorization.authorization_date) ?? new Date(),
                      "MMM d, yyyy"
                    )}
                  </span>
                </div>
              )}
              {authorization.expiration_date && expirationDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className={isExpired ? "text-destructive" : ""}>
                    {isExpired ? "Expired" : "Expires"} {format(expirationDate, "MMM d, yyyy")}
                  </span>
                </div>
              )}
              {authorization.territory_restrictions &&
                authorization.territory_restrictions.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{authorization.territory_restrictions.join(", ")}</span>
                  </div>
                )}
            </div>

            {authorization.notes && (
              <div className="flex items-start gap-1 mt-2 text-sm">
                <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                <span className="text-foreground/80">{authorization.notes}</span>
              </div>
            )}
          </div>
        </div>

        <CollapsibleContent>
          <ProductExceptionsSection
            authorization={authorization}
            distributorId={distributorId}
            products={principalProducts || []}
            productAuths={relevantProductAuths}
            isLoading={productAuthsLoading}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
