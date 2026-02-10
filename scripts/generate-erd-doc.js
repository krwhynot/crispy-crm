#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read input files
const schemaPath = path.join(
  __dirname,
  "..",
  "docs",
  "architecture",
  "erd-artifacts",
  "schema-metadata.json"
);
const orphanPath = path.join(
  __dirname,
  "..",
  "docs",
  "architecture",
  "erd-artifacts",
  "orphan-analysis.json"
);
const uiPath = path.join(
  __dirname,
  "..",
  "docs",
  "architecture",
  "erd-artifacts",
  "ui-mapping.json"
);
const outputPath = path.join(__dirname, "..", "docs", "architecture", "database-erd.md");

console.log("Reading input files...");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const orphan = JSON.parse(fs.readFileSync(orphanPath, "utf8"));
const ui = JSON.parse(fs.readFileSync(uiPath, "utf8"));

const timestamp = new Date().toISOString();

// Build UI mapping lookup
const uiByTable = {};
ui.resources.forEach((r) => {
  uiByTable[r.database_table] = r;
});

// Build orphan lookup
const orphanLookup = {};
orphan.orphaned_records.forEach((o) => {
  if (!orphanLookup[o.table_name]) orphanLookup[o.table_name] = [];
  orphanLookup[o.table_name].push(o);
});

// Helper function to normalize foreign key property names
function getFkProps(fk) {
  return {
    column: fk.column || fk.column_name,
    referencesTable: fk.references_table || fk.referenced_table,
    referencesColumn: fk.references_column || fk.referenced_column,
    onDelete: fk.on_delete || "NO ACTION",
    onUpdate: fk.on_update || "NO ACTION",
  };
}

// Generate Mermaid ERD
function generateMermaid() {
  const lines = ["```mermaid", "erDiagram"];
  const relationships = new Set();

  schema.tables.forEach((table) => {
    if (!table.foreign_keys) return;

    table.foreign_keys.forEach((fk) => {
      // Skip if foreign key data is malformed
      const parent = fk.references_table || fk.referenced_table;
      const child = table.name;
      const column = fk.column || fk.column_name;

      if (!parent || !child || !column) return;

      const rel = `${parent} ||--o{ ${child} : "${column}"`;
      relationships.add(rel);
    });
  });

  Array.from(relationships)
    .sort()
    .forEach((rel) => lines.push("    " + rel));
  lines.push("```");

  return lines.join("\n");
}

// Generate key findings dynamically from artifact values
function generateKeyFindings() {
  const findings = [];

  // 1. Data integrity assessment
  const orphanedRecordCount = orphan.summary?.total_orphaned_records || 0;
  if (orphanedRecordCount === 0) {
    findings.push("1. **Excellent Data Integrity:** Zero orphaned records across all foreign keys");
  } else {
    findings.push(
      `1. **Data Integrity Warning:** ${orphanedRecordCount} orphaned records found across ${orphan.summary?.tables_with_orphaned_records || 0} tables - review cascade policies`
    );
  }

  // 2. Database state assessment (compute from schema, not orphan-analysis)
  const tablesWithData = schema.tables.filter((t) => t.row_count > 0);
  const emptyTableCount = schema.tables.filter((t) => t.row_count === 0).length;
  if (tablesWithData.length === 0) {
    findings.push(
      "2. **Fresh Database State:** All tables are empty - ready for initial data seeding"
    );
  } else {
    const coreTablesWithData = tablesWithData
      .filter((t) =>
        ["contacts", "organizations", "opportunities", "activities", "products"].includes(t.name)
      )
      .map((t) => `${t.name} (${t.row_count})`);
    if (coreTablesWithData.length > 0) {
      findings.push(
        `2. **Active Database:** Core tables have data: ${coreTablesWithData.join(", ")}`
      );
    } else {
      findings.push(
        `2. **Partial Data:** ${tablesWithData.length} tables have data, ${emptyTableCount} are empty`
      );
    }
  }

  // 3. UI coverage
  const resourcesWithUI = ui.summary?.resources_with_ui || ui.summary?.total_resources || 0;
  const totalTables = ui.summary?.total_database_tables || schema.summary?.total_tables || 0;
  const coverage = totalTables > 0 ? Math.round((resourcesWithUI / totalTables) * 100) : 0;
  findings.push(
    `3. **UI Coverage:** ${resourcesWithUI} resources with UI components (${coverage}% of ${totalTables} tables)`
  );

  // 4. Security posture
  const avgPolicies =
    schema.summary.total_tables > 0
      ? (schema.summary.total_rls_policies / schema.summary.total_tables).toFixed(1)
      : 0;
  findings.push(
    `4. **Security Posture:** ${schema.summary.total_rls_policies} RLS policies across ${schema.summary.total_tables} tables (avg ${avgPolicies} per table)`
  );

  // 5. Orphaned tables
  const orphanedTablesList = orphan.orphaned_tables || [];
  if (orphanedTablesList.length > 0) {
    findings.push(
      `5. **Orphaned Tables:** \`${orphanedTablesList.join("`, `")}\` have no FK relationships - review for integration opportunities`
    );
  } else {
    findings.push("5. **Complete Relationships:** All tables have foreign key relationships");
  }

  return findings.join("\n");
}

// Generate markdown
const sections = [];

// Header
sections.push(`# Crispy CRM Database Schema

**Generated:** ${timestamp}
**Database:** PostgreSQL 17 (Supabase)
**Schema:** public

---

## Executive Summary

### Database Overview
- **Total Tables:** ${schema.summary.total_tables}
- **Total Relationships:** ${schema.summary.total_foreign_keys}
- **Total Indexes:** ${schema.summary.total_indexes}
- **Total RLS Policies:** ${schema.summary.total_rls_policies}

### Data Quality
- **Orphaned Tables:** ${orphan.summary.orphaned_tables}
- **Tables with Orphaned Records:** ${orphan.summary.tables_with_orphaned_records}
- **Empty Tables:** ${orphan.summary.empty_tables}
- **Total Orphaned Records:** ${orphan.summary.total_orphaned_records}

### UI Coverage
- **Handled Resources:** ${ui.summary.handled_resources || ui.summary.total_resources || 0}
- **Resources with UI:** ${ui.summary.resources_with_ui || "N/A"}
- **Total Components:** ${ui.summary.total_components}
- **Unmapped Tables:** ${ui.summary.unmapped_tables}
- **Total Database Tables:** ${ui.summary.total_database_tables}

### Key Findings

${generateKeyFindings()}

---

## Orphaned Data Analysis

### Tables Without Relationships
${orphan.orphaned_tables.length === 0 ? "*None*" : orphan.orphaned_tables.map((t) => `- \`${t}\``).join("\n")}

### Tables with Orphaned Records
${orphan.orphaned_records.length === 0 ? "*None - Excellent data integrity!*" : orphan.orphaned_records.map((o) => `- **\`${o.table_name}\`.${o.foreign_key_column}** → ${o.orphaned_count} orphaned records (${o.orphan_type})`).join("\n")}

### Empty Tables
${orphan.empty_tables.map((t) => `- \`${t}\``).join("\n")}

**Recommended Actions:**

${orphan.orphaned_tables.length > 0 ? `1. **Orphaned Tables:** Review the \`${orphan.orphaned_tables.join(", ")}\` table(s) for potential integration with other entities` : "1. **Orphaned Tables:** None - all tables have proper relationships"}
2. **Empty Tables:** Seed with test data or production migration data
3. ${orphan.summary.total_orphaned_records === 0 ? "**Data Integrity:** Maintain current zero-orphan status with proper cascade policies" : `**Data Integrity:** Address ${orphan.summary.total_orphaned_records} orphaned records - review soft-delete cascade behavior`}

---

## Entity Relationship Diagram

${generateMermaid()}

**Diagram Legend:**
- \`||--o{\` One-to-many relationship
- Tables with \`deleted_at\` column support soft-delete (${schema.tables.filter((t) => t.has_soft_delete).length} of ${schema.summary.total_tables} tables)

---

## UI Component Mapping
`);

// UI Resources
ui.resources.forEach((resource) => {
  const table = schema.tables.find((t) => t.name === resource.database_table);
  const rowCount = table ? table.row_count : "N/A";

  sections.push(`
### \`${resource.resource_name}\` → ${resource.resource_name.charAt(0).toUpperCase() + resource.resource_name.slice(1)}Resource

**Database Table:** \`${resource.database_table}\` (${rowCount} rows)${resource.summary_view ? `\n**Summary View:** \`${resource.summary_view}\`` : ""}
**Feature Directory:** \`${resource.feature_directory}\`
${resource.resource_config ? `**Resource Config:** ${JSON.stringify(resource.resource_config, null, 2).replace(/\n/g, "\n")}` : "**Resource Config:** None"}

**Components:**

| File | Type | Features |
|------|------|----------|`);

  resource.components.forEach((comp) => {
    const features = comp.features.length > 0 ? comp.features.join(", ") : "Basic CRUD";
    sections.push(`| ${comp.file} | ${comp.type} | ${features} |`);
  });

  if (resource.relationships_rendered.length > 0) {
    sections.push(`\n**Rendered Relationships:**\n`);
    const uniqueRels = {};
    resource.relationships_rendered.forEach((rel) => {
      const key = `${rel.field}-${rel.target_resource}`;
      if (!uniqueRels[key]) {
        uniqueRels[key] = rel;
      }
    });

    Object.values(uniqueRels).forEach((rel) => {
      sections.push(`- **${rel.field}** (\`${rel.component}\`) → \`${rel.target_resource}\``);
    });
  }

  sections.push("\n---");
});

// Unmapped tables
sections.push(`
## Unmapped Tables

The following ${ui.unmapped_tables.length} tables do not have dedicated React Admin resources:

| Table | Reason |
|-------|--------|`);

ui.unmapped_tables.forEach((t) => {
  sections.push(`| \`${t.resource_name}\` | ${t.reason} |`);
});

sections.push(`\n---

## Detailed Table Documentation
`);

// Table details - sorted alphabetically
const sortedTables = [...schema.tables].sort((a, b) => a.name.localeCompare(b.name));

sortedTables.forEach((table) => {
  const uiMapping = uiByTable[table.name];
  const orphanData = orphanLookup[table.name] || [];

  sections.push(`
### Table: \`${table.name}\`

**Row Count:** ${table.row_count} rows
**Soft Delete:** ${table.has_soft_delete ? "Yes" : "No"}
${uiMapping ? `**UI Resource:** [\`${uiMapping.resource_name}\`](#${uiMapping.resource_name.replace(/_/g, "-")}--${uiMapping.resource_name}resource)` : "**UI Resource:** None (see [Unmapped Tables](#unmapped-tables))"}

#### Columns

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|`);

  table.columns.forEach((col) => {
    const notes = [];
    if (col.name === "id") notes.push("PK");
    if (col.name.endsWith("_id")) notes.push("FK");
    if (col.name === "deleted_at") notes.push("Soft delete");
    if (col.name === "created_at" || col.name === "updated_at") notes.push("Timestamp");

    sections.push(
      `| \`${col.name}\` | ${col.type} | ${col.nullable ? "Yes" : "No"} | ${col.default || "—"} | ${notes.join(", ") || "—"} |`
    );
  });

  if (table.foreign_keys && table.foreign_keys.length > 0) {
    sections.push(`\n#### Foreign Keys\n`);
    sections.push(`| Column | References | On Delete | On Update | Orphaned Records |`);
    sections.push(`|--------|------------|-----------|-----------|------------------|`);

    table.foreign_keys.forEach((fk) => {
      const fkProps = getFkProps(fk);
      const orphanInfo = orphanData.find((o) => o.foreign_key_column === fkProps.column);
      const orphanCount = orphanInfo ? orphanInfo.orphaned_count : 0;
      sections.push(
        `| \`${fkProps.column}\` | \`${fkProps.referencesTable}\`(\`${fkProps.referencesColumn}\`) | ${fkProps.onDelete} | ${fkProps.onUpdate} | ${orphanCount} |`
      );
    });
  }

  if (table.indexes && table.indexes.length > 0) {
    sections.push(`\n#### Indexes\n`);
    table.indexes.forEach((idx) => {
      if (!idx.columns || !Array.isArray(idx.columns)) {
        sections.push(`- **${idx.name || "Unnamed"}**: (columns data unavailable)`);
        return;
      }
      const columns = idx.columns.join(", ");
      const unique = idx.is_unique ? " (UNIQUE)" : "";
      const partial = idx.partial_index ? ` WHERE ${idx.partial_index}` : "";
      sections.push(`- **${idx.name}**${unique}: \`${columns}\`${partial}`);
    });
  }

  if (table.rls_policies && table.rls_policies.length > 0) {
    sections.push(`\n#### RLS Policies (${table.rls_policies.length})\n`);

    const byCommand = {};
    table.rls_policies.forEach((p) => {
      const cmd = p.command;
      if (!byCommand[cmd]) byCommand[cmd] = [];
      byCommand[cmd].push(p);
    });

    Object.entries(byCommand).forEach(([cmd, policies]) => {
      sections.push(`\n**${cmd}** (${policies.length} policies):`);
      policies.forEach((p) => {
        const rolesText =
          p.roles && Array.isArray(p.roles) && p.roles.length > 0
            ? ` - Roles: ${p.roles.join(", ")}`
            : "";
        sections.push(
          `- **${p.name}** (${p.permissive ? "PERMISSIVE" : "RESTRICTIVE"})${rolesText}`
        );
      });
    });
  }

  sections.push("\n---");
});

// Relationship summary
sections.push(`
## Relationship Summary

### By Domain

**Organizations Domain:**`);

const orgFks = schema.tables.flatMap((t) =>
  (t.foreign_keys || [])
    .filter((fk) => {
      if (!fk) return false;
      const props = getFkProps(fk);
      return (
        props.referencesTable &&
        (props.referencesTable.includes("organization") ||
          props.referencesTable.includes("principal") ||
          props.referencesTable.includes("distributor"))
      );
    })
    .map((fk) => ({ table: t.name, fk }))
);

orgFks.forEach(({ table, fk }) => {
  const props = getFkProps(fk);
  sections.push(
    `- \`${table}.${props.column}\` → \`${props.referencesTable}.${props.referencesColumn}\``
  );
});

sections.push(`\n**Sales Pipeline Domain:**`);

const salesFks = schema.tables.flatMap((t) =>
  (t.foreign_keys || [])
    .filter((fk) => {
      if (!fk) return false;
      const props = getFkProps(fk);
      return (
        props.referencesTable &&
        (props.referencesTable.includes("opportunit") ||
          props.referencesTable.includes("task") ||
          props.referencesTable.includes("activit"))
      );
    })
    .map((fk) => ({ table: t.name, fk }))
);

salesFks.forEach(({ table, fk }) => {
  const props = getFkProps(fk);
  sections.push(
    `- \`${table}.${props.column}\` → \`${props.referencesTable}.${props.referencesColumn}\``
  );
});

sections.push(`\n**Polymorphic Relationships:**`);

const polyFks = schema.tables.flatMap((t) =>
  (t.foreign_keys || [])
    .filter((fk) => {
      if (!fk) return false;
      const props = getFkProps(fk);
      return (
        props.column && (props.column.includes("parentable") || props.column.includes("entity"))
      );
    })
    .map((fk) => ({ table: t.name, fk }))
);

if (polyFks.length === 0) {
  sections.push(`- *None detected*`);
} else {
  polyFks.forEach(({ table, fk }) => {
    const props = getFkProps(fk);
    sections.push(`- \`${table}.${props.column}\` (polymorphic)`);
  });
}

sections.push(`\n**Many-to-Many Relationships (Junction Tables):**`);

const junctionTables = ui.unmapped_tables.filter((t) => t.reason.includes("Junction table"));
junctionTables.forEach((t) => {
  const tableData = schema.tables.find((st) => st.name === t.resource_name);
  if (tableData && tableData.foreign_keys) {
    const fks = tableData.foreign_keys
      .map((fk) => {
        const props = getFkProps(fk);
        return `\`${props.referencesTable}\``;
      })
      .join(" ↔ ");
    sections.push(`- \`${t.resource_name}\`: ${fks}`);
  }
});

// RLS Policy Inventory
sections.push(`\n---

## RLS Policy Inventory

### Policy Coverage by Table

| Table | Total Policies | SELECT | INSERT | UPDATE | DELETE | ALL |
|-------|----------------|--------|--------|--------|--------|-----|`);

schema.tables.forEach((table) => {
  if (!table.rls_policies || table.rls_policies.length === 0) {
    sections.push(`| \`${table.name}\` | 0 | — | — | — | — | — |`);
    return;
  }

  const counts = {
    SELECT: table.rls_policies.filter((p) => p.command === "SELECT").length,
    INSERT: table.rls_policies.filter((p) => p.command === "INSERT").length,
    UPDATE: table.rls_policies.filter((p) => p.command === "UPDATE").length,
    DELETE: table.rls_policies.filter((p) => p.command === "DELETE").length,
    ALL: table.rls_policies.filter((p) => p.command === "ALL").length,
  };

  sections.push(
    `| \`${table.name}\` | ${table.rls_policies.length} | ${counts.SELECT || "—"} | ${counts.INSERT || "—"} | ${counts.UPDATE || "—"} | ${counts.DELETE || "—"} | ${counts.ALL || "—"} |`
  );
});

// Recommendations
sections.push(`\n---

## Recommendations

### Data Integrity

1. ${orphan.summary.total_orphaned_records === 0 ? "**Maintain Zero-Orphan Status:** Current state shows excellent referential integrity with zero orphaned records. Ensure all CASCADE policies are properly configured." : `**Address Orphaned Records:** ${orphan.summary.total_orphaned_records} orphaned records found across ${orphan.summary.tables_with_orphaned_records} tables. Review soft-delete cascade policies.`}
2. **Soft Delete Coverage:** ${schema.tables.filter((t) => t.has_soft_delete).length} of ${schema.summary.total_tables} tables support soft-delete. Consider adding to remaining tables where applicable.
3. **Foreign Key Constraints:** All foreign keys should have explicit ON DELETE and ON UPDATE clauses (currently many use NO ACTION default).

### UI Completeness

1. **Junction Table UI:** ${ui.unmapped_tables.filter((t) => t.reason.includes("Junction")).length} junction tables lack dedicated UI. Consider adding inline relationship management in parent resources.
2. **Orphaned Table Integration:** The \`tags\` table lacks foreign key relationships. Implement tagging system via junction tables (contact_tags, organization_tags).
3. **Component Standardization:** Ensure all resources follow the standard pattern (List, Create, Edit, Show, SlideOver).

### Performance

1. **Index High-Volume Tables:** Activities table (${schema.tables.find((t) => t.name === "activities")?.row_count || 0} rows) should have indexes on frequently filtered columns.
2. **Summary Views:** ${ui.resources.filter((r) => r.summary_view).length} resources use summary views - verify all list views use pre-computed aggregates.
3. **Partial Indexes:** Use partial indexes with \`WHERE deleted_at IS NULL\` for soft-delete tables to improve query performance.

### Maintenance

1. **Empty Tables:** ${orphan.summary.empty_tables} tables are currently empty. Seed with test data or verify production data migration is pending.
2. **RLS Policy Audits:** Average ${(schema.summary.total_rls_policies / schema.summary.total_tables).toFixed(1)} policies per table. Audit for consistency and ensure all tables have appropriate SELECT/INSERT/UPDATE/DELETE policies.
3. **Schema Documentation:** Keep this ERD document in sync with migrations using automated generation workflow.

---

## Appendix

### Generation Metadata

- **Schema Introspection:** ${schema.generated_at}
- **Orphan Detection:** ${orphan.generated_at}
- **UI Mapping:** ${ui.generated_at}
- **Assembly:** ${timestamp}

### Source Artifacts

- \`schema-metadata.json\` (${Math.round(fs.statSync(schemaPath).size / 1024)} KB)
- \`orphan-analysis.json\` (${Math.round(fs.statSync(orphanPath).size / 1024)} KB)
- \`ui-mapping.json\` (${Math.round(fs.statSync(uiPath).size / 1024)} KB)

### Generation Command

\`\`\`bash
node scripts/generate-erd-doc.js
\`\`\`

---

*This document was automatically generated from database introspection. Do not edit manually.*
`);

// Write output
const markdown = sections.join("\n");
fs.writeFileSync(outputPath, markdown, "utf8");

console.log(`✓ Generated ERD documentation: ${outputPath}`);
console.log(`  - Total lines: ${markdown.split("\n").length}`);
console.log(`  - File size: ${Math.round(markdown.length / 1024)} KB`);
console.log(`  - Tables documented: ${schema.summary.total_tables}`);
console.log(`  - UI resources mapped: ${ui.summary.handled_resources}`);
console.log(`  - Relationships: ${schema.summary.total_foreign_keys}`);
