import { List, TextField, FunctionField } from "react-admin";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { cn } from "@/lib/utils";
import { getTagColorClass } from "./tag-colors";
import type { Tag } from "../types";

/**
 * TagList - Admin management view for tags
 * Simple datagrid with name and color columns
 */
export const TagList = () => {
  return (
    <List title="Tags" perPage={25} sort={{ field: "name", order: "ASC" }} exporter={false}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
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
      </Datagrid>
    </List>
  );
};

export default TagList;
