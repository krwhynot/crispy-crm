import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { SegmentComboboxInput } from "@/components/admin/SegmentComboboxInput";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useRecordContext } from "ra-core";
import { useFormState } from "react-hook-form";
import ImageEditorField from "../misc/ImageEditorField";
import { ParentOrganizationInput } from "./ParentOrganizationInput";
// Validation removed per Engineering Constitution - single-point validation at API boundary only
import type { Company, Sale } from "../types";
import { formatName } from "../utils/formatName";

// URL validation removed - handled at API boundary
// Helper text provides format guidance instead

// Tab configuration with field mappings
type TabKey = 'general' | 'details' | 'other';

interface TabDefinition {
  key: TabKey;
  label: string;
  fields: string[];
}

const TAB_DEFINITIONS: TabDefinition[] = [
  {
    key: 'general',
    label: 'General',
    fields: ['name', 'logo', 'organization_type', 'parent_id', 'description', 'sales_id']
  },
  {
    key: 'details',
    label: 'Details',
    fields: ['segment_id', 'priority', 'address', 'city', 'postal_code', 'state', 'phone']
  },
  {
    key: 'other',
    label: 'Other',
    fields: ['website', 'linkedin_url', 'context_links']
  }
];

export const OrganizationInputs = () => {
  // Get form validation errors
  const { errors } = useFormState();
  const errorKeys = Object.keys(errors || {});

  // Calculate error counts per tab
  const errorCounts: Record<TabKey, number> = {
    general: errorKeys.filter(key => TAB_DEFINITIONS[0].fields.includes(key)).length,
    details: errorKeys.filter(key => TAB_DEFINITIONS[1].fields.includes(key)).length,
    other: errorKeys.filter(key => TAB_DEFINITIONS[2].fields.includes(key)).length
  };

  return (
    <Tabs defaultValue="general" className="w-full mt-6">
      <TabsList>
        <TabsTrigger
          value="general"
          aria-label={errorCounts.general > 0 ? `General tab, ${errorCounts.general} error${errorCounts.general > 1 ? 's' : ''}` : 'General tab'}
        >
          General
          {errorCounts.general > 0 && (
            <Badge variant="destructive" className="ml-2" aria-hidden="true">
              {errorCounts.general}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="details"
          aria-label={errorCounts.details > 0 ? `Details tab, ${errorCounts.details} error${errorCounts.details > 1 ? 's' : ''}` : 'Details tab'}
        >
          Details
          {errorCounts.details > 0 && (
            <Badge variant="destructive" className="ml-2" aria-hidden="true">
              {errorCounts.details}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="other"
          aria-label={errorCounts.other > 0 ? `Other tab, ${errorCounts.other} error${errorCounts.other > 1 ? 's' : ''}` : 'Other tab'}
        >
          Other
          {errorCounts.other > 0 && (
            <Badge variant="destructive" className="ml-2" aria-hidden="true">
              {errorCounts.other}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <OrganizationDisplayInputs />
          </div>
          <div className="lg:col-span-2">
            <SelectInput
              source="organization_type"
              label="Organization Type *"
              choices={[
                { id: "customer", name: "Customer" },
                { id: "prospect", name: "Prospect" },
                { id: "principal", name: "Principal" },
                { id: "distributor", name: "Distributor" },
                { id: "unknown", name: "Unknown" },
              ]}
              // defaultValue removed per Constitution #5 - defaults come from Zod schema via form-level defaultValues
              helperText="Required field"
              emptyText="Select organization type"
            />
          </div>
          <div className="lg:col-span-2">
            <ParentOrganizationInput />
          </div>
          <div className="lg:col-span-2">
            <TextInput source="description" multiline helperText={false} label="Description" />
          </div>
          <ReferenceInput
            source="sales_id"
            reference="sales"
            filter={{
              "disabled@neq": true,
              "user_id@not.is": null, // Only show authenticated users in dropdown
            }}
          >
            <SelectInput
              label="Account manager"
              helperText={false}
              optionText={saleOptionRenderer}
            />
          </ReferenceInput>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="details">
        <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <SegmentComboboxInput
            source="segment_id"
            label="Segment"
          />
          <SelectInput
            source="priority"
            choices={[
              { id: "A", name: "A - High Priority" },
              { id: "B", name: "B - Medium-High Priority" },
              { id: "C", name: "C - Medium Priority" },
              { id: "D", name: "D - Low Priority" },
            ]}
            helperText={false}
            emptyText="Select priority level"
          />
          <TextInput source="phone" helperText={false} label="Phone" />
          <TextInput source="address" helperText={false} label="Address" />
          <TextInput source="city" helperText={false} label="City" />
          <TextInput source="postal_code" label="Postal Code" helperText={false} />
          <TextInput source="state" label="State" helperText={false} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="other">
        <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <TextInput source="website" helperText="Format: https://example.com" label="Website" />
          <TextInput
            source="linkedin_url"
            label="LinkedIn URL"
            helperText="Format: https://linkedin.com/company/name"
          />
          <div className="lg:col-span-2">
            <ArrayInput source="context_links" helperText={false} label="Context Links">
              <SimpleFormIterator disableReordering fullWidth getItemLabel={false}>
                <TextInput
                  source=""
                  label={false}
                  helperText="Enter a valid URL"
                />
              </SimpleFormIterator>
            </ArrayInput>
          </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

const OrganizationDisplayInputs = () => {
  const record = useRecordContext<Company>();
  return (
    <div className="flex gap-4 flex-1 flex-row">
      <ImageEditorField
        source="logo"
        type="avatar"
        width={60}
        height={60}
        emptyText={record?.name.charAt(0)}
        linkPosition="bottom"
      />
      <TextInput
        source="name"
        className="w-full h-fit"
        helperText="Required field"
        placeholder="Organization name"
        label="Name *"
      />
    </div>
  );
};

const saleOptionRenderer = (choice: Sale) =>
  formatName(choice.first_name, choice.last_name);
