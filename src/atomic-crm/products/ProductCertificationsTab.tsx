import { useState } from "react";
import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { Form, ArrayInput, SimpleFormIterator } from "react-admin";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AsideSection } from "../misc/AsideSection";

interface Product {
  id: number;
  name: string;
  certifications?: string[] | null;
  allergens?: string[] | null;
  ingredients?: string | null;
  nutritional_info?: Record<string, any> | null;
  marketing_description?: string | null;
}

interface ProductCertificationsTabProps {
  record: Product;
  mode: "view" | "edit";
  onModeToggle?: () => void;
}

/**
 * Certifications tab for ProductSlideOver.
 *
 * **View Mode**: Displays food safety and health information:
 * - Certifications (badges): Organic, Non-GMO, Gluten-Free, etc.
 * - Allergens (badges): Dairy, Nuts, Soy, etc.
 * - Ingredients (text)
 * - Marketing Description (text)
 * - Nutritional Info (key-value display)
 *
 * **Edit Mode**: Full form with ArrayInput for certifications and allergens (TEXT[] arrays)
 *
 * Note: Products use TEXT[] for certifications and allergens (not JSONB arrays)
 */
export function ProductCertificationsTab({
  record,
  mode,
  onModeToggle,
}: ProductCertificationsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const [isSaving, setIsSaving] = useState(false);

  // Handle save in edit mode
  const handleSave = async (data: Partial<Product>) => {
    setIsSaving(true);
    try {
      await update("products", {
        id: record.id,
        data,
        previousData: record,
      });
      notify("Product updated successfully", { type: "success" });
      onModeToggle?.(); // Return to view mode after successful save
    } catch (error) {
      notify("Error updating product", { type: "error" });
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === "edit") {
    return (
      <RecordContextProvider value={record}>
        <Form onSubmit={handleSave} record={record}>
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Certifications Array */}
              <div>
                <span className="block text-sm font-medium mb-2">Certifications</span>
                <ArrayInput source="certifications" label="">
                  <SimpleFormIterator inline disableReordering>
                    <TextInput source="" label="Certification" helperText={false} />
                  </SimpleFormIterator>
                </ArrayInput>
              </div>

              {/* Allergens Array */}
              <div>
                <span className="block text-sm font-medium mb-2">Allergens</span>
                <ArrayInput source="allergens" label="">
                  <SimpleFormIterator inline disableReordering>
                    <TextInput source="" label="Allergen" helperText={false} />
                  </SimpleFormIterator>
                </ArrayInput>
              </div>

              {/* Ingredients */}
              <TextInput
                source="ingredients"
                label="Ingredients"
                multiline
                rows={3}
                helperText="List of ingredients"
              />

              {/* Marketing Description */}
              <TextInput
                source="marketing_description"
                label="Marketing Description"
                multiline
                rows={3}
                helperText="Customer-facing product description"
              />

              {/* Nutritional Info - simplified text input for now */}
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Nutritional Info (JSONB)</p>
                <p>
                  Edit nutritional information in the main product form for advanced JSONB editing.
                </p>
              </div>
            </div>

            {/* Save button - Cancel handled by slide-over header */}
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button type="submit" disabled={isSaving} className="h-11 px-4">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </Form>
      </RecordContextProvider>
    );
  }

  // View mode - display certifications and food info
  return (
    <RecordContextProvider value={record}>
      <div className="space-y-6">
        {/* Certifications Section */}
        {record.certifications && record.certifications.length > 0 && (
          <AsideSection title="Certifications">
            <div className="flex flex-wrap gap-2">
              {record.certifications.map((cert, index) => (
                <Badge key={index} variant="secondary">
                  {cert}
                </Badge>
              ))}
            </div>
          </AsideSection>
        )}

        {!record.certifications ||
          (record.certifications.length === 0 && (
            <AsideSection title="Certifications">
              <div className="text-sm text-muted-foreground">No certifications listed.</div>
            </AsideSection>
          ))}

        {/* Allergens Section */}
        {record.allergens && record.allergens.length > 0 && (
          <AsideSection title="Allergens">
            <div className="flex flex-wrap gap-2">
              {record.allergens.map((allergen, index) => (
                <Badge key={index} variant="destructive">
                  {allergen}
                </Badge>
              ))}
            </div>
          </AsideSection>
        )}

        {!record.allergens ||
          (record.allergens.length === 0 && (
            <AsideSection title="Allergens">
              <div className="text-sm text-muted-foreground">No allergens listed.</div>
            </AsideSection>
          ))}

        {/* Ingredients Section */}
        {record.ingredients && (
          <AsideSection title="Ingredients">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm whitespace-pre-wrap">{record.ingredients}</p>
              </CardContent>
            </Card>
          </AsideSection>
        )}

        {/* Marketing Description */}
        {record.marketing_description && (
          <AsideSection title="Marketing Description">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm whitespace-pre-wrap">{record.marketing_description}</p>
              </CardContent>
            </Card>
          </AsideSection>
        )}

        {/* Nutritional Info */}
        {record.nutritional_info && Object.keys(record.nutritional_info).length > 0 && (
          <AsideSection title="Nutritional Information">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {Object.entries(record.nutritional_info).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AsideSection>
        )}
      </div>
    </RecordContextProvider>
  );
}
