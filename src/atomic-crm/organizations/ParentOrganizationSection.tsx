import { useState, useEffect } from "react";
import { useRecordContext, useDataProvider, useNotify } from "ra-core";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AsideSection } from "../misc/AsideSection";
import type { Organization } from "../types";

/**
 * ParentOrganizationSection
 *
 * Displays parent organization and sister branches in the organization sidebar.
 * Shows:
 * - Parent organization link (if exists)
 * - Sister branches (same parent, excluding self) - first 3 with "show all X more" option
 * - Change Parent button (edit link)
 * - Remove Parent button (with confirmation)
 */
export const ParentOrganizationSection = () => {
  const record = useRecordContext<Organization>();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const navigate = useNavigate();

  const [sisters, setSisters] = useState<Organization[]>([]);
  const [showAllSisters, setShowAllSisters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch sister branches on mount
  useEffect(() => {
    if (!record || !record.parent_organization_id) {
      return;
    }

    const fetchSisters = async () => {
      setLoading(true);
      try {
        const result = await dataProvider.getList("organizations", {
          filter: {
            parent_organization_id: record.parent_organization_id,
          },
          pagination: { page: 1, perPage: 100 },
          sort: { field: "name", order: "ASC" },
        });

        // Filter out self
        const filteredSisters = (result.data || []).filter(
          (org: Organization) => org.id !== record.id
        );
        setSisters(filteredSisters);
      } catch (error) {
        console.error("Failed to fetch sister organizations:", error);
        notify("Failed to load sister organizations", { type: "warning" });
      } finally {
        setLoading(false);
      }
    };

    fetchSisters();
  }, [record, dataProvider, notify]);

  // If no parent, render nothing
  if (!record || !record.parent_organization_id) {
    return null;
  }

  const handleRemoveParent = async () => {
    if (!window.confirm("Remove parent organization? This action cannot be undone.")) {
      return;
    }

    try {
      await dataProvider.update("organizations", {
        id: record.id,
        data: { parent_organization_id: null },
        previousData: record,
      });
      notify("Parent organization removed", { type: "success" });
      // Refresh page to reload updated data
      window.location.reload();
    } catch (error) {
      console.error("Failed to remove parent organization:", error);
      notify("Failed to remove parent organization", { type: "error" });
    }
  };

  // Get the display values
  const displayedSisters = showAllSisters ? sisters : sisters.slice(0, 3);
  const remainingSistersCount = sisters.length - 3;

  return (
    <AsideSection title="Organization Hierarchy">
      {/* Parent Organization */}
      <div className="text-sm mb-3">
        <div className="font-medium mb-1">Parent Organization:</div>
        <a
          href={`/organizations/${record.parent_organization_id}/show`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/organizations/${record.parent_organization_id}/show`);
          }}
          className="text-[color:var(--primary)] hover:underline"
        >
          {record.parent_organization_name || `Organization #${record.parent_organization_id}`}
        </a>
      </div>

      {/* Sister Branches */}
      {sisters.length > 0 && (
        <div className="text-sm mb-3">
          <div className="font-medium mb-1">Sister Branches:</div>
          <ul className="flex flex-col gap-1">
            {displayedSisters.map((sister) => (
              <li key={sister.id}>
                <a
                  href={`/organizations/${sister.id}/show`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/organizations/${sister.id}/show`);
                  }}
                  className="text-[color:var(--primary)] hover:underline"
                >
                  {sister.name}
                </a>
              </li>
            ))}
          </ul>

          {/* Show All More */}
          {!showAllSisters && remainingSistersCount > 0 && (
            <button
              onClick={() => setShowAllSisters(true)}
              className="text-xs text-[color:var(--primary)] hover:underline mt-1"
            >
              Show all {remainingSistersCount} more
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-4">
        <Button variant="outline" size="sm" className="h-9 w-full" asChild>
          <a href={`/organizations/${record.id}/edit`}>Change Parent</a>
        </Button>

        <Button
          variant="destructive"
          size="sm"
          className="h-9 w-full"
          onClick={handleRemoveParent}
          disabled={loading}
        >
          Remove Parent
        </Button>
      </div>
    </AsideSection>
  );
};
