import { useShowContext, RecordRepresentation } from "ra-core";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { DateField } from "@/components/ra-wrappers/date-field";
import { Badge } from "@/components/ui/badge";
import type { ProductDistributor } from "../validation/productDistributors";

/**
 * ProductDistributorShow Component
 *
 * Displays full product-distributor authorization details in a read-only view.
 * Shows: product, distributor, DOT number, status, validity dates, notes
 */
export default function ProductDistributorShow() {
  const { record, isPending } = useShowContext<ProductDistributor & { id: string }>();

  if (isPending || !record) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-muted-foreground">Loading authorization...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "inactive":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Product-Distributor Authorization
          <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product and Distributor */}
        <div className="grid grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg">
          <div>
            <h4 className="text-sm font-semibold mb-1 text-muted-foreground">Product</h4>
            <ReferenceField source="product_id" reference="products" record={record} link="show">
              <RecordRepresentation />
            </ReferenceField>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1 text-muted-foreground">Distributor</h4>
            <ReferenceField
              source="distributor_id"
              reference="organizations"
              record={record}
              link="show"
            >
              <RecordRepresentation />
            </ReferenceField>
          </div>
        </div>

        {/* DOT Number */}
        {record.vendor_item_number && (
          <div>
            <h4 className="text-sm font-semibold mb-1">DOT Number (Vendor Item #)</h4>
            <p className="text-sm text-muted-foreground">{record.vendor_item_number}</p>
          </div>
        )}

        {/* Validity Period */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">Valid From</h4>
            <p className="text-sm">
              <DateField source="valid_from" record={record} />
            </p>
          </div>
          {record.valid_to && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Valid To</h4>
              <p className="text-sm">
                <DateField source="valid_to" record={record} />
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        {record.notes && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground pt-4 border-t space-y-1">
          {record.created_at && (
            <div>
              Created: <DateField source="created_at" record={record} showTime />
            </div>
          )}
          {record.updated_at && (
            <div>
              Updated: <DateField source="updated_at" record={record} showTime />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { ProductDistributorShow };
