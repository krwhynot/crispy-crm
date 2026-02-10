#!/usr/bin/env node
/**
 * Generate UI Component Mapping
 * Maps database tables to React Admin resources and UI components
 *
 * Reads schema-metadata.json for accurate table counts.
 */

const fs = require("fs");
const path = require("path");

const BASE_PATH = path.join(__dirname, "..");
const SCHEMA_METADATA_PATH = path.join(
  BASE_PATH,
  "docs",
  "architecture",
  "erd-artifacts",
  "schema-metadata.json"
);

// Resource-to-table mapping for resources that differ from their table name
// Key = resource name, Value = actual database table/view
const TABLE_MAPPING = {
  tasks: "tasks_deprecated", // Resource 'tasks' uses 'tasks_deprecated' base table (legacy migration)
  entity_timeline: null, // VIEW, not a base table
};

// Resources from composedDataProvider.ts
const HANDLED_RESOURCES = [
  "contacts",
  "organizations",
  "opportunities",
  "activities",
  "products",
  "tasks",
  "contact_notes",
  "opportunity_notes",
  "organization_notes",
  "tags",
  "sales",
  "segments",
  "product_distributors",
  "opportunity_participants",
  "opportunity_contacts",
  "interaction_participants",
  "distributor_principal_authorizations",
  "organization_distributors",
  "user_favorites",
  "notifications",
  "entity_timeline",
];

// Feature directory mapping (some use different names)
const FEATURE_DIRS = {
  contacts: "contacts",
  organizations: "organizations",
  opportunities: "opportunities",
  activities: "activities",
  products: "products",
  tasks: "tasks",
  contact_notes: "notes",
  opportunity_notes: "notes",
  organization_notes: "notes",
  tags: "tags",
  sales: "sales",
  segments: null, // No dedicated UI
  product_distributors: "productDistributors",
  opportunity_participants: null, // Junction - no UI
  opportunity_contacts: null, // Junction - no UI
  interaction_participants: null, // Junction - no UI
  distributor_principal_authorizations: null, // Junction - no UI
  organization_distributors: null, // Junction - no UI
  user_favorites: null, // System table - no UI
  notifications: "notifications",
  entity_timeline: "timeline",
};

// Additional database tables not in HANDLED_RESOURCES
const ADDITIONAL_DB_TABLES = [
  { table: "audit_trail", reason: "System table - logging/audit trail" },
  {
    table: "contact_organizations",
    reason: "Junction table - managed via contact_organizations resource",
  },
  { table: "contact_preferred_principals", reason: "Junction table - no dedicated UI" },
  { table: "dashboard_snapshots", reason: "System table - computed dashboard data" },
  { table: "migration_history", reason: "System table - database migrations tracking" },
  { table: "opportunity_products", reason: "Junction table - no dedicated UI" },
  { table: "product_category_hierarchy", reason: "System table - product hierarchy structure" },
  { table: "product_features", reason: "Supporting table - product metadata" },
  { table: "product_pricing_models", reason: "Supporting table - pricing structure" },
  { table: "product_pricing_tiers", reason: "Supporting table - pricing tiers" },
  { table: "task_id_mapping", reason: "System table - migration tracking" },
  { table: "tutorial_progress", reason: "System table - user tutorial state" },
  { table: "test_user_metadata", reason: "Test data - not production table" },
];

function findComponentFiles(featureDir) {
  if (!featureDir) return [];

  const fullPath = path.join(BASE_PATH, "src", "atomic-crm", featureDir);
  if (!fs.existsSync(fullPath)) return [];

  try {
    const files = fs.readdirSync(fullPath);
    return files.filter(
      (f) =>
        f.endsWith(".tsx") &&
        !f.includes(".test.") &&
        !f.includes(".spec.") &&
        (f.includes("List") ||
          f.includes("Create") ||
          f.includes("Edit") ||
          f.includes("Show") ||
          f.includes("SlideOver"))
    );
  } catch (err) {
    return [];
  }
}

function analyzeComponent(featureDir, filename) {
  const filePath = path.join(BASE_PATH, "src", "atomic-crm", featureDir, filename);

  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Determine component type
    let type = "unknown";
    if (filename.includes("List")) type = "list";
    else if (filename.includes("Create")) type = "create";
    else if (filename.includes("Edit")) type = "edit";
    else if (filename.includes("Show")) type = "show";
    else if (filename.includes("SlideOver")) type = "slideOver";

    // Extract exports
    const exportMatches = content.match(/^export (const|function) (\w+)/gm) || [];
    const exports = exportMatches.map((m) => m.split(" ")[2]);

    // Detect features
    const features = [];
    if (content.includes("PremiumDatagrid")) features.push("PremiumDatagrid");
    if (content.includes("<Datagrid") && !content.includes("PremiumDatagrid"))
      features.push("Datagrid");
    if (content.includes("TabbedForm")) features.push("TabbedForm");
    if (content.includes("SimpleForm")) features.push("SimpleForm");
    if (content.includes("FilterSidebar") || content.includes("Filter")) features.push("Filters");
    if (content.includes("BulkActions")) features.push("BulkActions");
    if (content.includes("DeleteButton")) features.push("DeleteButton");
    if (content.includes("EditButton")) features.push("EditButton");
    if (content.includes("ExportButton")) features.push("ExportButton");
    if (content.includes("ReferenceManyField")) features.push("ReferenceManyField");
    if (content.includes("ReferenceField")) features.push("ReferenceField");

    return {
      file: filename,
      type,
      exports,
      features: [...new Set(features)],
    };
  } catch (err) {
    return {
      file: filename,
      type: "unknown",
      exports: [],
      features: [],
    };
  }
}

function findRelationships(featureDir) {
  if (!featureDir) return [];

  const fullPath = path.join(BASE_PATH, "src", "atomic-crm", featureDir);
  if (!fs.existsSync(fullPath)) return [];

  const relationships = [];

  try {
    const files = fs.readdirSync(fullPath);
    const componentFiles = files.filter(
      (f) => f.endsWith(".tsx") && !f.includes(".test.") && !f.includes(".spec.")
    );

    for (const file of componentFiles) {
      const content = fs.readFileSync(path.join(fullPath, file), "utf8");

      // Find ReferenceManyField patterns
      const refManyMatches = content.matchAll(/<ReferenceManyField[^>]*reference="([^"]+)"[^>]*>/g);
      for (const match of refManyMatches) {
        relationships.push({
          field: match[1],
          component: "ReferenceManyField",
          target_resource: match[1],
          file,
        });
      }

      // Find ReferenceField patterns
      const refMatches = content.matchAll(/<ReferenceField[^>]*reference="([^"]+)"[^>]*>/g);
      for (const match of refMatches) {
        relationships.push({
          field: match[1],
          component: "ReferenceField",
          target_resource: match[1],
          file,
        });
      }
    }
  } catch (err) {
    // Ignore errors
  }

  return relationships;
}

function getResourceConfig(featureDir) {
  if (!featureDir) return null;

  const resourcePath = path.join(BASE_PATH, "src", "atomic-crm", featureDir, "resource.tsx");
  if (!fs.existsSync(resourcePath)) return null;

  try {
    const content = fs.readFileSync(resourcePath, "utf8");

    const config = {};

    // Extract recordRepresentation pattern
    if (content.includes("recordRepresentation")) {
      const match = content.match(/recordRepresentation[:\s=]+\(?(\w+)\)?/);
      if (match) config.recordRepresentation = match[1];
    }

    return config;
  } catch (err) {
    return null;
  }
}

function generateMapping() {
  // Read schema-metadata.json for actual table count
  let schemaMetadata = null;
  try {
    schemaMetadata = JSON.parse(fs.readFileSync(SCHEMA_METADATA_PATH, "utf8"));
  } catch (err) {
    console.warn("⚠️  Could not read schema-metadata.json, using fallback counts");
  }

  const mapping = {
    generated_at: new Date().toISOString(),
    summary: {
      handled_resources: HANDLED_RESOURCES.length,
      resources_with_ui: 0, // Will be computed after processing
      total_components: 0,
      unmapped_tables: 0,
      total_database_tables: schemaMetadata?.summary?.total_tables || 0,
    },
    resources: [],
    unmapped_tables: [],
  };

  // Process each resource
  for (const resource of HANDLED_RESOURCES) {
    const featureDir = FEATURE_DIRS[resource];

    if (!featureDir) {
      // Junction tables or system tables without UI
      mapping.unmapped_tables.push({
        resource_name: resource,
        reason:
          resource.includes("_") &&
          ![
            "contact_notes",
            "opportunity_notes",
            "organization_notes",
            "product_distributors",
            "user_favorites",
            "entity_timeline",
          ].includes(resource)
            ? "Junction table - no dedicated UI"
            : resource === "segments"
              ? "Configuration resource - managed via settings"
              : "System resource - no dedicated UI",
      });
      continue;
    }

    const componentFiles = findComponentFiles(featureDir);
    const components = componentFiles.map((f) => analyzeComponent(featureDir, f));
    const relationships = findRelationships(featureDir);
    const resourceConfig = getResourceConfig(featureDir);

    mapping.summary.total_components += components.length;

    // Determine actual database table (may differ from resource name)
    const databaseTable = TABLE_MAPPING.hasOwnProperty(resource)
      ? TABLE_MAPPING[resource]
      : resource;

    // Determine summary view
    const summaryViewResources = [
      "contacts",
      "organizations",
      "opportunities",
      "activities",
      "products",
      "tasks",
      "product_distributors",
    ];
    const summaryView = summaryViewResources.includes(resource) ? `${resource}_summary` : null;

    const resourceEntry = {
      resource_name: resource,
      database_table: databaseTable,
      summary_view: summaryView,
      feature_directory: `src/atomic-crm/${featureDir}`,
      components,
      relationships_rendered: relationships,
      resource_config: resourceConfig,
    };

    // Add note for resources with table name mapping
    if (TABLE_MAPPING.hasOwnProperty(resource) && TABLE_MAPPING[resource]) {
      resourceEntry.base_table_note = `Resource '${resource}' uses '${TABLE_MAPPING[resource]}' base table`;
    } else if (TABLE_MAPPING.hasOwnProperty(resource) && TABLE_MAPPING[resource] === null) {
      resourceEntry.base_table_note = `Resource '${resource}' is a VIEW, not a base table`;
    }

    mapping.resources.push(resourceEntry);
  }

  // Add additional database tables not in HANDLED_RESOURCES
  for (const { table, reason } of ADDITIONAL_DB_TABLES) {
    mapping.unmapped_tables.push({
      resource_name: table,
      reason,
    });
  }

  mapping.summary.unmapped_tables = mapping.unmapped_tables.length;

  // Compute resources_with_ui (resources that have at least one component)
  mapping.summary.resources_with_ui = mapping.resources.filter(
    (r) => r.components && r.components.length > 0
  ).length;

  // If we couldn't read schema-metadata.json, use fallback
  if (!mapping.summary.total_database_tables) {
    mapping.summary.total_database_tables = HANDLED_RESOURCES.length + ADDITIONAL_DB_TABLES.length;
    mapping.summary.total_database_tables_note =
      "Fallback count (schema-metadata.json not available)";
  }

  return mapping;
}

// Generate and write the mapping
const mapping = generateMapping();
const outputPath = path.join(BASE_PATH, "docs", "architecture", "erd-artifacts", "ui-mapping.json");

fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2), "utf8");

console.log("✅ UI mapping generated successfully");
console.log(`📊 Summary:`);
console.log(`   - Total database tables: ${mapping.summary.total_database_tables}`);
console.log(`   - Handled resources: ${mapping.summary.handled_resources}`);
console.log(`   - Resources with UI: ${mapping.summary.resources_with_ui}`);
console.log(`   - Total UI components: ${mapping.summary.total_components}`);
console.log(`   - Unmapped tables: ${mapping.summary.unmapped_tables}`);
console.log(`📁 Output: ${outputPath}`);
