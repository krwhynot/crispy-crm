import { useShowContext, RecordRepresentation } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { DateField } from "@/components/admin/date-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "../types";

/**
 * ProductShow Component
 *
 * Displays full product details in a page.
 * Shows: name, sku, description, status, principal organization, category
 */
export default function ProductShow() {
  const { record, isPending } = useShowContext<Product>();

  if (isPending || !record) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-muted-foreground">Loading product...</p>
        </CardContent>
      </Card>
    );
  }

  const statusVariant = record.status === "active" ? "default" : "secondary";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {record.name}
          <Badge variant={statusVariant}>{record.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {record.manufacturer_part_number && (
          <div>
            <h4 className="text-sm font-semibold mb-1">SKU</h4>
            <p className="text-sm text-muted-foreground">{record.manufacturer_part_number}</p>
          </div>
        )}

        {record.description && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{record.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {record.category && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Category</h4>
              <p className="text-sm">{record.category}</p>
            </div>
          )}

          {record.principal_id && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Principal</h4>
              <ReferenceField
                source="principal_id"
                reference="organizations"
                record={record}
                link="show"
              >
                <RecordRepresentation />
              </ReferenceField>
            </div>
          )}
        </div>

        {record.marketing_description && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Marketing Description</h4>
            <p className="text-sm text-muted-foreground">{record.marketing_description}</p>
          </div>
        )}

        {record.list_price && (
          <div>
            <h4 className="text-sm font-semibold mb-1">List Price</h4>
            <p className="text-sm">
              {record.currency_code || "$"}
              {record.list_price}
              {record.unit_of_measure && ` / ${record.unit_of_measure}`}
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-4 border-t">
          Created: <DateField source="created_at" record={record} showTime />
        </div>
      </CardContent>
    </Card>
  );
}

export { ProductShow };
