/**
 * Tests for organizationFormConfig.ts
 * Ensures config-driven form architecture maintains schema/config alignment
 *
 * Tests verify:
 * - ORGANIZATION_FORM_VARIANTS structure is valid
 * - Required fields map to actual schema fields
 * - Preserved fields map to actual schema fields
 * - Default values don't include computed fields
 * - REQUIRED_FIELD_METADATA has entries for all required fields
 */

import { describe, it, expect } from "vitest";
import {
  ORGANIZATION_FORM_VARIANTS,
  REQUIRED_FIELD_METADATA,
  getFormVariant,
  isFieldRequired,
  isUnknownSegmentAllowed,
  validateSegmentForVariant,
  type OrganizationFormVariant,
} from "../organizationFormConfig";
import { organizationSchema } from "../organizations";
import { UNKNOWN_SEGMENT_ID, PLAYBOOK_CATEGORY_IDS } from "../segments";

/**
 * Extract valid field names from organizationSchema
 * This is our source of truth for what fields actually exist
 */
function getSchemaFields(): Set<string> {
  // organizationSchema is a z.strictObject, access shape directly
  const schemaShape = organizationSchema._def.shape;
  return new Set(Object.keys(schemaShape));
}

/**
 * Computed fields from views that should NOT appear in forms
 * These are readonly and calculated by the database
 */
const COMPUTED_FIELDS = new Set(["nb_contacts", "nb_opportunities", "nb_notes"]);

describe("OrganizationFormConfig Structure", () => {
  const variants: OrganizationFormVariant["variant"][] = ["create", "edit", "quickCreate"];
  const schemaFields = getSchemaFields();

  describe("ORGANIZATION_FORM_VARIANTS - Basic Structure", () => {
    it("should have exactly 3 variants (create, edit, quickCreate)", () => {
      expect(Object.keys(ORGANIZATION_FORM_VARIANTS)).toHaveLength(3);
      expect(ORGANIZATION_FORM_VARIANTS).toHaveProperty("create");
      expect(ORGANIZATION_FORM_VARIANTS).toHaveProperty("edit");
      expect(ORGANIZATION_FORM_VARIANTS).toHaveProperty("quickCreate");
    });

    variants.forEach((variant) => {
      describe(`${variant} variant`, () => {
        const config = ORGANIZATION_FORM_VARIANTS[variant];

        it("should have valid variant identifier", () => {
          expect(config.variant).toBe(variant);
        });

        it("should have requiredFields array", () => {
          expect(Array.isArray(config.requiredFields)).toBe(true);
          expect(config.requiredFields.length).toBeGreaterThan(0);
        });

        it("should have defaultValues object", () => {
          expect(typeof config.defaultValues).toBe("object");
        });

        it("should have allowUnknownSegment boolean", () => {
          expect(typeof config.allowUnknownSegment).toBe("boolean");
        });

        it("should have preserveFields array", () => {
          expect(Array.isArray(config.preserveFields)).toBe(true);
        });
      });
    });
  });

  describe("Required Fields Validation", () => {
    variants.forEach((variant) => {
      describe(`${variant} variant`, () => {
        const config = ORGANIZATION_FORM_VARIANTS[variant];

        it("all requiredFields should be valid schema fields", () => {
          config.requiredFields.forEach((field) => {
            expect(
              schemaFields.has(field),
              `Required field "${field}" in ${variant} variant does not exist in organizationSchema`
            ).toBe(true);
          });
        });

        it("requiredFields should not include computed fields", () => {
          config.requiredFields.forEach((field) => {
            expect(
              COMPUTED_FIELDS.has(field),
              `Required field "${field}" in ${variant} variant is a computed field and should not be required`
            ).toBe(false);
          });
        });

        it("requiredFields should not contain duplicates", () => {
          const unique = new Set(config.requiredFields);
          expect(unique.size).toBe(config.requiredFields.length);
        });
      });
    });

    it("create variant should require name, organization_type, sales_id, segment_id, priority, status", () => {
      const createConfig = ORGANIZATION_FORM_VARIANTS.create;
      expect(createConfig.requiredFields).toContain("name");
      expect(createConfig.requiredFields).toContain("organization_type");
      expect(createConfig.requiredFields).toContain("sales_id");
      expect(createConfig.requiredFields).toContain("segment_id");
      expect(createConfig.requiredFields).toContain("priority");
      expect(createConfig.requiredFields).toContain("status");
    });

    it("edit variant should require name, organization_type, priority, status", () => {
      const editConfig = ORGANIZATION_FORM_VARIANTS.edit;
      expect(editConfig.requiredFields).toContain("name");
      expect(editConfig.requiredFields).toContain("organization_type");
      expect(editConfig.requiredFields).toContain("priority");
      expect(editConfig.requiredFields).toContain("status");
    });

    it("quickCreate variant should require name, organization_type, segment_id, priority", () => {
      const quickCreateConfig = ORGANIZATION_FORM_VARIANTS.quickCreate;
      expect(quickCreateConfig.requiredFields).toContain("name");
      expect(quickCreateConfig.requiredFields).toContain("organization_type");
      expect(quickCreateConfig.requiredFields).toContain("segment_id");
      expect(quickCreateConfig.requiredFields).toContain("priority");
    });
  });

  describe("Preserved Fields Validation", () => {
    variants.forEach((variant) => {
      describe(`${variant} variant`, () => {
        const config = ORGANIZATION_FORM_VARIANTS[variant];

        it("all preserveFields should be valid schema fields", () => {
          config.preserveFields.forEach((field) => {
            expect(
              schemaFields.has(field),
              `Preserved field "${field}" in ${variant} variant does not exist in organizationSchema`
            ).toBe(true);
          });
        });

        it("preserveFields should not contain duplicates", () => {
          const unique = new Set(config.preserveFields);
          expect(unique.size).toBe(config.preserveFields.length);
        });
      });
    });

    it("create variant should preserve parent_organization_id, organization_type, sales_id for Save & Add Another", () => {
      const createConfig = ORGANIZATION_FORM_VARIANTS.create;
      expect(createConfig.preserveFields).toContain("parent_organization_id");
      expect(createConfig.preserveFields).toContain("organization_type");
      expect(createConfig.preserveFields).toContain("sales_id");
    });

    it("edit variant should preserve system metadata fields", () => {
      const editConfig = ORGANIZATION_FORM_VARIANTS.edit;
      expect(editConfig.preserveFields).toContain("id");
      expect(editConfig.preserveFields).toContain("created_at");
      expect(editConfig.preserveFields).toContain("created_by");
      expect(editConfig.preserveFields).toContain("updated_at");
      expect(editConfig.preserveFields).toContain("updated_by");
      expect(editConfig.preserveFields).toContain("deleted_at");
    });

    it("edit variant should preserve computed fields", () => {
      const editConfig = ORGANIZATION_FORM_VARIANTS.edit;
      expect(editConfig.preserveFields).toContain("nb_contacts");
      expect(editConfig.preserveFields).toContain("nb_opportunities");
      expect(editConfig.preserveFields).toContain("nb_notes");
    });

    it("quickCreate variant should have no preserved fields", () => {
      const quickCreateConfig = ORGANIZATION_FORM_VARIANTS.quickCreate;
      expect(quickCreateConfig.preserveFields).toHaveLength(0);
    });
  });

  describe("Default Values Validation", () => {
    variants.forEach((variant) => {
      describe(`${variant} variant`, () => {
        const config = ORGANIZATION_FORM_VARIANTS[variant];

        it("all defaultValues keys should be valid schema fields", () => {
          Object.keys(config.defaultValues).forEach((field) => {
            expect(
              schemaFields.has(field),
              `Default value field "${field}" in ${variant} variant does not exist in organizationSchema`
            ).toBe(true);
          });
        });

        it("defaultValues should not include computed fields", () => {
          Object.keys(config.defaultValues).forEach((field) => {
            expect(
              COMPUTED_FIELDS.has(field),
              `Default value field "${field}" in ${variant} variant is a computed field and should not have defaults`
            ).toBe(false);
          });
        });

        it("defaultValues should not include system-managed fields", () => {
          const systemFields = [
            "id",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
            "deleted_at",
          ];
          Object.keys(config.defaultValues).forEach((field) => {
            expect(
              systemFields.includes(field),
              `Default value field "${field}" in ${variant} variant is system-managed and should not have defaults`
            ).toBe(false);
          });
        });
      });
    });

    it("create variant should have sensible business defaults", () => {
      const createConfig = ORGANIZATION_FORM_VARIANTS.create;
      expect(createConfig.defaultValues.organization_type).toBe("prospect");
      expect(createConfig.defaultValues.priority).toBe("C");
      expect(createConfig.defaultValues.status).toBe("active");
      expect(createConfig.defaultValues.status_reason).toBe("prospect");
      expect(createConfig.defaultValues.is_operating_entity).toBe(true);
      expect(createConfig.defaultValues.billing_country).toBe("US");
      expect(createConfig.defaultValues.shipping_country).toBe("US");
      expect(createConfig.defaultValues.needs_review).toBe(false);
    });

    it("edit variant should have no defaults (preserve existing values)", () => {
      const editConfig = ORGANIZATION_FORM_VARIANTS.edit;
      expect(Object.keys(editConfig.defaultValues)).toHaveLength(0);
    });

    it("quickCreate variant should have same defaults as create", () => {
      const quickCreateConfig = ORGANIZATION_FORM_VARIANTS.quickCreate;
      const createConfig = ORGANIZATION_FORM_VARIANTS.create;

      // Quick create should have same defaults as create for common fields
      expect(quickCreateConfig.defaultValues.organization_type).toBe(
        createConfig.defaultValues.organization_type
      );
      expect(quickCreateConfig.defaultValues.priority).toBe(createConfig.defaultValues.priority);
      expect(quickCreateConfig.defaultValues.status).toBe(createConfig.defaultValues.status);
      expect(quickCreateConfig.defaultValues.status_reason).toBe(
        createConfig.defaultValues.status_reason
      );
    });
  });

  describe("Unknown Segment Validation", () => {
    it("create variant should NOT allow Unknown segment", () => {
      expect(ORGANIZATION_FORM_VARIANTS.create.allowUnknownSegment).toBe(false);
    });

    it("edit variant should allow Unknown segment", () => {
      expect(ORGANIZATION_FORM_VARIANTS.edit.allowUnknownSegment).toBe(true);
    });

    it("quickCreate variant should allow Unknown segment", () => {
      expect(ORGANIZATION_FORM_VARIANTS.quickCreate.allowUnknownSegment).toBe(true);
    });
  });
});

describe("REQUIRED_FIELD_METADATA", () => {
  it("should have entries for all fields that appear in any requiredFields array", () => {
    const allRequiredFields = new Set<string>();

    Object.values(ORGANIZATION_FORM_VARIANTS).forEach((config) => {
      config.requiredFields.forEach((field) => allRequiredFields.add(field));
    });

    allRequiredFields.forEach((field) => {
      expect(
        REQUIRED_FIELD_METADATA,
        `Missing metadata entry for required field "${field}"`
      ).toHaveProperty(field);
    });
  });

  it("all metadata entries should have reason and forms", () => {
    Object.entries(REQUIRED_FIELD_METADATA).forEach(([field, metadata]) => {
      expect(metadata.reason, `Field "${field}" missing reason`).toBeTruthy();
      expect(Array.isArray(metadata.forms), `Field "${field}" forms is not an array`).toBe(true);
      expect(metadata.forms.length, `Field "${field}" has no forms`).toBeGreaterThan(0);
    });
  });

  it("forms arrays should only reference valid variant names", () => {
    const validVariants = ["create", "edit", "quickCreate"];

    Object.entries(REQUIRED_FIELD_METADATA).forEach(([field, metadata]) => {
      metadata.forms.forEach((form) => {
        expect(
          validVariants.includes(form),
          `Field "${field}" references invalid form variant "${form}"`
        ).toBe(true);
      });
    });
  });

  it("segment_id metadata should have validation differences documented", () => {
    expect(REQUIRED_FIELD_METADATA.segment_id.validation).toBeDefined();
    expect(REQUIRED_FIELD_METADATA.segment_id.validation?.create).toMatch(/not.*unknown/i);
    expect(REQUIRED_FIELD_METADATA.segment_id.validation?.quickCreate).toMatch(/can.*unknown/i);
    expect(REQUIRED_FIELD_METADATA.segment_id.validation?.edit).toMatch(/can.*unknown/i);
  });
});

describe("Helper Functions", () => {
  describe("getFormVariant", () => {
    it("should return correct config for create variant", () => {
      const variant = getFormVariant("create");
      expect(variant.variant).toBe("create");
      expect(variant.allowUnknownSegment).toBe(false);
    });

    it("should return correct config for edit variant", () => {
      const variant = getFormVariant("edit");
      expect(variant.variant).toBe("edit");
      expect(variant.allowUnknownSegment).toBe(true);
    });

    it("should return correct config for quickCreate variant", () => {
      const variant = getFormVariant("quickCreate");
      expect(variant.variant).toBe("quickCreate");
      expect(variant.allowUnknownSegment).toBe(true);
    });
  });

  describe("isFieldRequired", () => {
    it("should return true for name in all variants", () => {
      expect(isFieldRequired("create", "name")).toBe(true);
      expect(isFieldRequired("edit", "name")).toBe(true);
      expect(isFieldRequired("quickCreate", "name")).toBe(true);
    });

    it("should return true for sales_id only in create variant", () => {
      expect(isFieldRequired("create", "sales_id")).toBe(true);
      expect(isFieldRequired("edit", "sales_id")).toBe(false);
      expect(isFieldRequired("quickCreate", "sales_id")).toBe(false);
    });

    it("should return false for optional fields", () => {
      expect(isFieldRequired("create", "website")).toBe(false);
      expect(isFieldRequired("edit", "phone")).toBe(false);
      expect(isFieldRequired("quickCreate", "description")).toBe(false);
    });
  });

  describe("isUnknownSegmentAllowed", () => {
    it("should return false for create variant", () => {
      expect(isUnknownSegmentAllowed("create")).toBe(false);
    });

    it("should return true for edit variant", () => {
      expect(isUnknownSegmentAllowed("edit")).toBe(true);
    });

    it("should return true for quickCreate variant", () => {
      expect(isUnknownSegmentAllowed("quickCreate")).toBe(true);
    });
  });

  describe("validateSegmentForVariant", () => {
    const validSegmentId = PLAYBOOK_CATEGORY_IDS["Major Broadline"];

    it("should return error for missing segment_id", () => {
      expect(validateSegmentForVariant("create", null)).toMatch(/select a segment/i);
      expect(validateSegmentForVariant("create", undefined)).toMatch(/select a segment/i);
    });

    it("should return error for Unknown segment in create variant", () => {
      const error = validateSegmentForVariant("create", UNKNOWN_SEGMENT_ID);
      expect(error).toMatch(/select a specific segment/i);
      expect(error).toMatch(/not.*unknown/i);
    });

    it("should return undefined for Unknown segment in edit variant", () => {
      expect(validateSegmentForVariant("edit", UNKNOWN_SEGMENT_ID)).toBeUndefined();
    });

    it("should return undefined for Unknown segment in quickCreate variant", () => {
      expect(validateSegmentForVariant("quickCreate", UNKNOWN_SEGMENT_ID)).toBeUndefined();
    });

    it("should return undefined for valid segment in all variants", () => {
      expect(validateSegmentForVariant("create", validSegmentId)).toBeUndefined();
      expect(validateSegmentForVariant("edit", validSegmentId)).toBeUndefined();
      expect(validateSegmentForVariant("quickCreate", validSegmentId)).toBeUndefined();
    });
  });
});

describe("Config Consistency", () => {
  it("required fields should not overlap with preserved fields except for Save & Add Another workflow", () => {
    // Exception: create variant can have required+preserved fields for "Save & Add Another" workflow
    // User must provide value on first create, then it's preserved for subsequent creates
    const SAVE_AND_ADD_ANOTHER_EXCEPTIONS = new Set(["organization_type", "sales_id"]);

    Object.entries(ORGANIZATION_FORM_VARIANTS).forEach(([variant, config]) => {
      const preservedSet = new Set(config.preserveFields);

      config.requiredFields.forEach((field) => {
        // Allow overlap for Save & Add Another fields in create variant
        const isAllowedException =
          variant === "create" && SAVE_AND_ADD_ANOTHER_EXCEPTIONS.has(field);

        if (!isAllowedException) {
          expect(
            preservedSet.has(field),
            `${variant} variant: field "${field}" is both required and preserved (potential logic error)`
          ).toBe(false);
        }
      });
    });
  });

  it("default values should not be provided for required fields without defaults", () => {
    // If a field is required and has no default, user MUST provide it
    // Create variant: sales_id is required with no default (user must select)
    const createConfig = ORGANIZATION_FORM_VARIANTS.create;
    expect(createConfig.requiredFields).toContain("sales_id");
    expect(createConfig.defaultValues).not.toHaveProperty("sales_id");

    // Name is always required with no default
    expect(createConfig.requiredFields).toContain("name");
    expect(createConfig.defaultValues).not.toHaveProperty("name");
  });

  it("all variants should use consistent field types for common defaults", () => {
    // organization_type should always default to "prospect" when provided
    const createDefaults = ORGANIZATION_FORM_VARIANTS.create.defaultValues;
    const quickCreateDefaults = ORGANIZATION_FORM_VARIANTS.quickCreate.defaultValues;

    if (createDefaults.organization_type && quickCreateDefaults.organization_type) {
      expect(quickCreateDefaults.organization_type).toBe(createDefaults.organization_type);
    }

    if (createDefaults.priority && quickCreateDefaults.priority) {
      expect(quickCreateDefaults.priority).toBe(createDefaults.priority);
    }
  });
});
