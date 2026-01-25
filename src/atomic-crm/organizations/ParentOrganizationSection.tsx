import { useState } from "react";
import { useGetOne, useGetList, useRecordContext, useCreatePath } from "react-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { DEFAULT_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";
import type { Company } from "../types";

/**
 * Component displaying parent organization and sister branches
 * Shows the parent organization link and other branches of the same parent
 * Used in the organization sidebar to show hierarchy relationships
 */
export const ParentOrganizationSection = () => {
  const record = useRecordContext<Company>();
  const createPath = useCreatePath();
  const [showAllSisters, setShowAllSisters] = useState(false);

  // Fetch parent organization if it exists
  const { data: parent, isLoading: parentLoading } = useGetOne<Company>(
    "organizations",
    { id: record?.parent_organization_id },
    { enabled: !!record?.parent_organization_id }
  );

  // Fetch sister branches (other children of the same parent)
  const { data: sisters, isLoading: sistersLoading } = useGetList<Company>(
    "organizations",
    {
      filter: {
        parent_organization_id: record?.parent_organization_id,
        "id@neq": record?.id, // Exclude current organization
      },
      sort: { field: "name", order: "ASC" },
      pagination: { page: 1, perPage: 100 },
    },
    {
      enabled: !!record?.parent_organization_id,
    }
  );

  if (!record || !record.parent_organization_id || parentLoading || sistersLoading) {
    return null;
  }

  if (!parent) {
    return null;
  }

  const sisterCount = sisters?.length || 0;
  const visibleSisters = showAllSisters ? sisters : sisters?.slice(0, 3);
  const hasMoreSisters = sisterCount > 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          Organization Hierarchy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parent Organization */}
        <div>
          <div className="text-sm text-muted-foreground mb-2">Parent Organization</div>
          <Link
            to={createPath({
              resource: "organizations",
              type: "edit",
              id: parent.id,
            })}
            className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{parent.name}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Sister Branches */}
        {sisterCount > 0 && (
          <div>
            <div className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
              <span>Sister Branches</span>
              <Badge variant="secondary" className="text-xs">
                {sisterCount}
              </Badge>
            </div>
            <div className="space-y-1">
              {visibleSisters?.map((sister) => (
                <Link
                  key={sister.id}
                  to={createPath({
                    resource: "organizations",
                    type: "edit",
                    id: sister.id,
                  })}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{sister.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {sister.city && (
                      <span className="text-xs text-muted-foreground">
                        {sister.city}
                        {sister.state && `, ${sister.state}`}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>

            {hasMoreSisters && !showAllSisters && (
              <button
                onClick={() => setShowAllSisters(true)}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Show all {sisterCount} sister branches
              </button>
            )}

            {hasMoreSisters && showAllSisters && (
              <button
                onClick={() => setShowAllSisters(false)}
                className="mt-2 text-sm text-muted-foreground hover:text-primary"
              >
                Show less
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
