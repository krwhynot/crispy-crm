/**
 * BranchLocationsSection Component
 *
 * Displays a table of branch organizations for a parent organization.
 * Shows nothing if the organization has no child branches.
 *
 * Features:
 * - Fetches child organizations with parent_organization_id filter
 * - Displays table with Name, City, Contacts, Opportunities columns
 * - Links branch names to organization detail pages
 * - Add Branch Location button
 * - Loading and empty states
 */

import { useEffect, useState } from "react";
import { useDataProvider } from "ra-core";
import { Link as RouterLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import type { Identifier } from "ra-core";
import type { OrganizationWithHierarchy } from "../types";

interface BranchLocationsSectionProps {
  org: OrganizationWithHierarchy;
}

interface BranchOrganization {
  id: Identifier;
  name: string;
  city?: string;
  nb_contacts?: number;
  nb_opportunities?: number;
}

export function BranchLocationsSection({ org }: BranchLocationsSectionProps) {
  const dataProvider = useDataProvider();
  const [branches, setBranches] = useState<BranchOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't fetch if org has no child branches
    if (!org.child_branch_count || org.child_branch_count === 0) {
      return;
    }

    const fetchBranches = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await dataProvider.getList("organizations", {
          filter: { parent_organization_id: org.id },
          pagination: { page: 1, perPage: 100 },
        });
        setBranches(result.data as BranchOrganization[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load branches");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [org.id, org.child_branch_count, dataProvider]);

  // Return null if org has no child branches
  if (!org.child_branch_count || org.child_branch_count === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {org.child_branch_count === 1
              ? "1 Branch Location"
              : `${org.child_branch_count} Branch Locations`}
          </h3>
          <Button asChild size="sm" variant="outline" className="h-9">
            <RouterLink
              to="/organizations/create"
              state={{
                record: { parent_organization_id: org.id },
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Branch Location
            </RouterLink>
          </Button>
        </div>

        {isLoading && (
          <div role="status" className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {error && <div className="text-red-500 text-sm p-4 bg-red-50 rounded">{error}</div>}

        {!isLoading && !error && branches.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2 font-semibold">Name</th>
                  <th className="text-left py-2 px-2 font-semibold">City</th>
                  <th className="text-center py-2 px-2 font-semibold">Contacts</th>
                  <th className="text-center py-2 px-2 font-semibold">Opportunities</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id} className="border-b hover:bg-accent/5 transition-colors">
                    <td className="py-2 px-2">
                      <RouterLink
                        to={`/organizations/${branch.id}/show`}
                        className="text-primary hover:underline font-medium"
                      >
                        {branch.name}
                      </RouterLink>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">{branch.city || "-"}</td>
                    <td className="py-2 px-2 text-center text-muted-foreground">
                      {branch.nb_contacts ?? 0}
                    </td>
                    <td className="py-2 px-2 text-center text-muted-foreground">
                      {branch.nb_opportunities ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && branches.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No branch locations found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
