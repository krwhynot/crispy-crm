import { AdminButton } from "@/components/admin/AdminButton";
import { Clock, Star, User } from "lucide-react";
import { useGetIdentity } from "ra-core";
import { addDays } from "date-fns";

import { QuickFilterGroup } from "../filters/QuickFilterGroup";
import { usePresetFilter } from "../filters/usePresetFilter";

/**
 * Quick filter presets for the Organizations sidebar.
 * Follows the same pattern as OpportunityListFilter quick filters.
 */
export const OrganizationSavedQueries = () => {
  const { data: identity } = useGetIdentity();
  const { isPresetActive, handlePresetClick } = usePresetFilter();

  const thirtyDaysAgo = addDays(new Date(), -30).toISOString().split("T")[0];

  return (
    <QuickFilterGroup label="Quick Filters">
      <AdminButton
        type="button"
        variant={
          isPresetActive({
            $or: [{ sales_id: identity?.id }, { secondary_sales_id: identity?.id }],
          })
            ? "default"
            : "outline"
        }
        size="sm"
        onClick={() =>
          handlePresetClick({
            $or: [{ sales_id: identity?.id }, { secondary_sales_id: identity?.id }],
          })
        }
        className="w-full justify-start"
        title="Organizations assigned to me"
      >
        <User className="w-3.5 h-3.5 mr-2" />
        My Accounts
      </AdminButton>

      <AdminButton
        type="button"
        variant={isPresetActive({ priority: ["A"] }) ? "default" : "outline"}
        size="sm"
        onClick={() => handlePresetClick({ priority: ["A"] })}
        className="w-full justify-start"
        title="Priority A organizations"
      >
        <Star className="w-3.5 h-3.5 mr-2" />
        Key Accounts
      </AdminButton>

      <AdminButton
        type="button"
        variant={
          isPresetActive({
            organization_type: ["prospect"],
            created_at_gte: thirtyDaysAgo,
          })
            ? "default"
            : "outline"
        }
        size="sm"
        onClick={() =>
          handlePresetClick({
            organization_type: ["prospect"],
            created_at_gte: thirtyDaysAgo,
          })
        }
        className="w-full justify-start"
        title="Prospects added in the last 30 days"
      >
        <Clock className="w-3.5 h-3.5 mr-2" />
        Recent Prospects
      </AdminButton>
    </QuickFilterGroup>
  );
};
