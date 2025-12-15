import { CollapsibleSection } from "@/components/admin/form/CollapsibleSection";
import { ProductDistributorInput } from "./ProductDistributorInput";

/**
 * Distribution tab for ProductCreate/ProductEdit forms.
 *
 * Contains:
 * - ProductDistributorInput (multi-select distributors with DOT# codes)
 * - CollapsibleSection for future additional settings
 */
export const ProductDistributionTab = () => {
  return (
    <div className="space-y-6">
      <ProductDistributorInput />

      <CollapsibleSection title="Additional Settings" defaultOpen={false}>
        <p className="text-sm text-muted-foreground">
          Additional distribution settings will appear here.
        </p>
      </CollapsibleSection>
    </div>
  );
};
