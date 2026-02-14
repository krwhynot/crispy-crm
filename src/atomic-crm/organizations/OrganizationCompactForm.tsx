import { TextInput } from "@/components/ra-wrappers/text-input";
import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import {
  CompactFormRow,
  CollapsibleSection,
  FormFieldWrapper,
  FormSectionWithProgress,
} from "@/components/ra-wrappers/form";
import { SegmentComboboxInput } from "@/components/ra-wrappers/SegmentComboboxInput";
import { StateComboboxInput } from "@/components/ra-wrappers/state-combobox-input";
import { PRIORITY_CHOICES } from "./constants";
import { saleOptionRenderer } from "../utils/saleOptionRenderer";
import { OrganizationHierarchySection } from "./OrganizationHierarchySection";
import { useCityStateMapping } from "@/hooks";
import { useRecordContext } from "ra-core";
import { PrincipalAwareTypeInput } from "./PrincipalAwareTypeInput";
import { useOrganizationVariant } from "./hooks/useOrganizationVariant";

interface OrganizationCompactFormProps {
  isRep?: boolean;
}

export const OrganizationCompactForm = ({ isRep }: OrganizationCompactFormProps) => {
  useCityStateMapping();

  // Detect edit mode - allow Unknown segment for existing orgs
  // useRecordContext returns undefined in create mode (no throw), populated record in edit mode
  const record = useRecordContext();
  const _isEditMode = !!record;

  const { isRequired, variant } = useOrganizationVariant();

  return (
    <div className="space-y-6">
      <FormSectionWithProgress
        id="basic-info"
        title="Company Profile"
        requiredFields={["name", "organization_type", "segment_id"]}
      >
        <CompactFormRow>
          <div data-tutorial="org-name">
            <FormFieldWrapper name="name" isRequired={isRequired("name")}>
              <TextInput
                source="name"
                label="Company Name *"
                helperText={false}
                placeholder="Organization name"
              />
            </FormFieldWrapper>
          </div>
          <div data-tutorial="org-type">
            <FormFieldWrapper
              name="organization_type"
              isRequired={isRequired("organization_type")}
              countDefaultAsFilled
            >
              <PrincipalAwareTypeInput />
            </FormFieldWrapper>
          </div>
        </CompactFormRow>

        <FormFieldWrapper name="segment_id" isRequired={isRequired("segment_id")}>
          <SegmentComboboxInput
            source="segment_id"
            label="Segment"
            helperText={false}
            allowUnknown={variant.allowUnknownSegment}
          />
        </FormFieldWrapper>
      </FormSectionWithProgress>

      <FormSectionWithProgress
        id="account"
        title="Account Details"
        requiredFields={["sales_id", "priority"]}
      >
        <CompactFormRow>
          <FormFieldWrapper
            name="sales_id"
            isRequired={isRequired("sales_id")}
            countDefaultAsFilled
          >
            <ReferenceInput
              reference="sales"
              source="sales_id"
              sort={{ field: "last_name", order: "ASC" }}
              filter={{ "disabled@neq": true, "user_id@not.is": null }}
            >
              <SelectInput
                helperText={isRep ? "Assigned to you" : false}
                label="Primary Account Manager *"
                optionText={saleOptionRenderer}
                disabled={isRep}
              />
            </ReferenceInput>
          </FormFieldWrapper>
          <FormFieldWrapper
            name="priority"
            isRequired={isRequired("priority")}
            countDefaultAsFilled
          >
            <SelectInput
              source="priority"
              label="Priority *"
              choices={PRIORITY_CHOICES}
              helperText={false}
            />
          </FormFieldWrapper>
        </CompactFormRow>

        {/* Secondary Account Manager - optional */}
        <FormFieldWrapper name="secondary_sales_id">
          <ReferenceInput
            reference="sales"
            source="secondary_sales_id"
            sort={{ field: "last_name", order: "ASC" }}
            filter={{ "disabled@neq": true, "user_id@not.is": null }}
          >
            <SelectInput
              helperText={false}
              label="Secondary Account Manager"
              optionText={saleOptionRenderer}
            />
          </ReferenceInput>
        </FormFieldWrapper>
      </FormSectionWithProgress>

      <CollapsibleSection title="Location">
        <div className="space-y-4">
          <CompactFormRow>
            <FormFieldWrapper name="address">
              <TextInput
                source="address"
                label="Street Address"
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
                label="ZIP Code"
                helperText="US ZIP: 12345 or 12345-6789"
                autoComplete="postal-code"
              />
            </FormFieldWrapper>
          </CompactFormRow>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Contact & Web">
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
              label="Phone Number"
              helperText="At least 10 digits"
              autoComplete="tel"
              maxLength={30}
            />
          </FormFieldWrapper>
          <FormFieldWrapper name="linkedin_url">
            <TextInput
              source="linkedin_url"
              label="LinkedIn"
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
