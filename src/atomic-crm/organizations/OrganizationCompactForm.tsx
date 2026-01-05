import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import {
  CompactFormRow,
  CollapsibleSection,
  FormFieldWrapper,
  FormSectionWithProgress,
} from "@/components/admin/form";
import { SegmentComboboxInput } from "@/components/admin/SegmentComboboxInput";
import { StateComboboxInput } from "@/components/admin/state-combobox-input";
import { PRIORITY_CHOICES } from "./constants";
import { saleOptionRenderer } from "../utils/saleOptionRenderer";
import { OrganizationHierarchySection } from "./OrganizationHierarchySection";
import { ParentOrganizationInput } from "./ParentOrganizationInput";
import { useCityStateMapping } from "@/hooks";
import { PrincipalAwareTypeInput } from "./PrincipalAwareTypeInput";

export const OrganizationCompactForm = () => {
  useCityStateMapping();

  return (
    <div className="space-y-6">
      <FormSectionWithProgress id="basic-info" title="Basic Information" requiredFields={["name"]}>
        <CompactFormRow>
          <div data-tutorial="org-name">
            <FormFieldWrapper name="name" isRequired>
              <TextInput
                source="name"
                label="Organization Name *"
                helperText={false}
                placeholder="Organization name"
              />
            </FormFieldWrapper>
          </div>
          <div data-tutorial="org-type">
            <FormFieldWrapper name="organization_type">
              <PrincipalAwareTypeInput />
            </FormFieldWrapper>
          </div>
        </CompactFormRow>

        <CompactFormRow>
          <FormFieldWrapper name="parent_organization_id">
            <ParentOrganizationInput />
          </FormFieldWrapper>
          <FormFieldWrapper name="priority">
            <SelectInput
              source="priority"
              label="Priority"
              choices={PRIORITY_CHOICES}
              helperText={false}
              emptyText="Select priority"
            />
          </FormFieldWrapper>
        </CompactFormRow>
      </FormSectionWithProgress>

      <FormSectionWithProgress id="account-segment" title="Account & Segment" requiredFields={[]}>
        <CompactFormRow>
          <FormFieldWrapper name="sales_id">
            <ReferenceInput
              reference="sales"
              source="sales_id"
              sort={{ field: "last_name", order: "ASC" }}
              filter={{ "disabled@neq": true, "user_id@not.is": null }}
            >
              <SelectInput
                helperText={false}
                label="Account Manager"
                optionText={saleOptionRenderer}
              />
            </ReferenceInput>
          </FormFieldWrapper>
          <FormFieldWrapper name="segment_id">
            <SegmentComboboxInput source="segment_id" label="Segment" helperText={false} />
          </FormFieldWrapper>
        </CompactFormRow>
      </FormSectionWithProgress>

      <FormSectionWithProgress id="location" title="Location" requiredFields={[]}>
        <CompactFormRow>
          <FormFieldWrapper name="address">
            <TextInput
              source="address"
              label="Street"
              helperText={false}
              autoComplete="address-line1"
            />
          </FormFieldWrapper>
          <FormFieldWrapper name="city">
            <TextInput
              source="city"
              label="City"
              helperText={false}
              autoComplete="address-level2"
            />
          </FormFieldWrapper>
        </CompactFormRow>

        <CompactFormRow>
          <FormFieldWrapper name="state">
            <StateComboboxInput source="state" label="State" />
          </FormFieldWrapper>
          <FormFieldWrapper name="postal_code">
            <TextInput
              source="postal_code"
              label="Zip Code"
              helperText={false}
              autoComplete="postal-code"
            />
          </FormFieldWrapper>
        </CompactFormRow>
      </FormSectionWithProgress>

      <CollapsibleSection title="Additional Details">
        <div className="space-y-4">
          <div data-tutorial="org-website">
            <FormFieldWrapper name="website">
              <TextInput
                source="website"
                label="Website"
                helperText="Format: https://example.com"
              />
            </FormFieldWrapper>
          </div>
          <FormFieldWrapper name="phone">
            <TextInput
              source="phone"
              label="Phone"
              helperText="Format: (555) 123-4567"
              autoComplete="tel"
              maxLength={30}
            />
          </FormFieldWrapper>
          <FormFieldWrapper name="linkedin_url">
            <TextInput
              source="linkedin_url"
              label="LinkedIn URL"
              helperText="Format: https://linkedin.com/company/name"
            />
          </FormFieldWrapper>
          <FormFieldWrapper name="description">
            <TextInput
              source="description"
              label="Description"
              multiline
              rows={3}
              helperText={false}
            />
          </FormFieldWrapper>
        </div>
      </CollapsibleSection>

      <OrganizationHierarchySection />
      {/* Status & Payment fields hidden per user feedback - defaults: status='active' */}
    </div>
  );
};
