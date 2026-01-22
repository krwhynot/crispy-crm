import { useState } from "react";
import { useGetList, useCreatePath, useRecordContext, AdminButton } from "react-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Store, MapPin, Phone, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { Company } from "../types";

/**
 * Component displaying branch locations for a parent organization
 * Shows child organizations in a table with location and contact info
 */
export const BranchLocationsSection = () => {
  const record = useRecordContext<Company>();
  const createPath = useCreatePath();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch branches for this organization
  const { data: branches, isLoading } = useGetList("organizations", {
    filter: { parent_organization_id: record?.id },
    sort: { field: "name", order: "ASC" },
    pagination: { page: 1, perPage: 100 },
  });

  if (!record || isLoading) {
    return null;
  }

  const branchCount = branches?.length || 0;

  // Don't show the section if there are no branches
  if (branchCount === 0) {
    return null;
  }

  const visibleBranches = isExpanded ? branches : branches?.slice(0, 3);
  const hasMore = branchCount > 3;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Branch Locations</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {branchCount} {branchCount === 1 ? "Branch" : "Branches"}
          </Badge>
        </div>
        <AdminButton
          size="sm"
          variant="outline"
          onClick={() => {
            const createUrl = createPath({
              resource: "organizations",
              type: "create",
            });
            // Navigate with parent_organization_id pre-filled
            window.location.href = `${createUrl}?source=${JSON.stringify({
              parent_organization_id: record.id,
              organization_type: record.organization_type,
            })}`;
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Branch
        </AdminButton>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visibleBranches?.map((branch) => (
            <div
              key={branch.id}
              className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={createPath({
                      resource: "organizations",
                      type: "edit",
                      id: branch.id,
                    })}
                    className="font-medium text-primary hover:underline"
                  >
                    {branch.name}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {branch.organization_type}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {(branch.city || branch.state) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{[branch.city, branch.state].filter(Boolean).join(", ")}</span>
                    </div>
                  )}

                  {branch.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{branch.phone}</span>
                    </div>
                  )}

                  {branch.website && (
                    <a
                      href={branch.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Website</span>
                    </a>
                  )}
                </div>

                {/* Show contact and opportunity counts if available */}
                {(branch.nb_contacts > 0 || branch.nb_opportunities > 0) && (
                  <div className="flex gap-3 mt-2 text-sm">
                    {branch.nb_contacts > 0 && (
                      <span className="text-muted-foreground">
                        {branch.nb_contacts} contact{branch.nb_contacts !== 1 && "s"}
                      </span>
                    )}
                    {branch.nb_opportunities > 0 && (
                      <span className="text-muted-foreground">
                        {branch.nb_opportunities} opportunit
                        {branch.nb_opportunities === 1 ? "y" : "ies"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasMore && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="mt-3 text-sm text-primary hover:underline"
          >
            Show all {branchCount} branches
          </button>
        )}

        {hasMore && isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="mt-3 text-sm text-muted-foreground hover:text-primary"
          >
            Show less
          </button>
        )}
      </CardContent>
    </Card>
  );
};
