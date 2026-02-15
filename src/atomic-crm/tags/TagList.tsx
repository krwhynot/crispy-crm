import { TextField, FunctionField } from "react-admin";
import { List } from "@/components/ra-wrappers/list";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { UnifiedListPageLayout } from "@/components/layouts/UnifiedListPageLayout";
import { CreateButton } from "@/components/ra-wrappers/create-button";
import { cn } from "@/lib/utils";
import { getTagColorClass } from "./tag-colors";
import type { Tag } from "../types";

/**
 * TagList - Admin management view for tags
 * Simple datagrid with name and color columns
 */
export const TagList = () => {
  return (
    <List
      title={false}
      actions={false}
      perPage={25}
      sort={{ field: "name", order: "ASC" }}
      exporter={false}
    >
      <UnifiedListPageLayout
        resource="tags"
        showFilterSidebar={false}
        sortFields={["name", "color"]}
        searchPlaceholder="Search tags..."
        primaryAction={<CreateButton />}
      >
        <PremiumDatagrid rowClick="edit" bulkActionButtons={false}>
          {/* Name column - primary identifier */}
          <TextField source="name" label="Tag Name" />

          {/* Color preview - shows the tag as it appears in the UI */}
          <FunctionField
            label="Preview"
            render={(record: Tag) => (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-1 text-xs rounded-md",
                  "border border-black/20",
                  getTagColorClass(record.color)
                )}
              >
                {record.name}
              </span>
            )}
          />

          {/* Color name for clarity */}
          <FunctionField
            label="Color"
            render={(record: Tag) => (
              <span className="text-muted-foreground capitalize">{record.color}</span>
            )}
          />
        </PremiumDatagrid>
      </UnifiedListPageLayout>
    </List>
  );
};

export default TagList;
