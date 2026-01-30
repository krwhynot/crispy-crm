---
description: Deep dive into form submission, validation, and field binding issues
argument-hint: [--from-scan <json-path>]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(jq:*), Write
model: sonnet
---

# Forms Deep Dive

You are performing a **deep dive into form issues** for Crispy CRM. This command enriches quick scan findings with component-level analysis, cross-referencing forms inventory against Zod schemas and React Admin resolver patterns.

**Scope:** FORM-B001 through FORM-B010 from checks.json

---

## Phase 1: Load Context

### 1.1 Load Quick Scan Results (if available)

```
If $ARGUMENTS contains "--from-scan":
  Read the JSON file path provided
  Extract all FORM-category findings
  Use as starting point for verification
Else:
  Run FORM checks from checks.json fresh
```

### 1.2 Load Inventories

Read these inventory files:
1. `.claude/state/forms-inventory.json` — all form components with their sources
2. `.claude/state/schemas-inventory/*.json` — all Zod schemas
3. `.claude/state/hooks-inventory/*.json` — custom hooks used in forms

Build a lookup table:
```
FORMS = { component_name → { file, has_resolver, schema_name, mode } }
SCHEMAS = { schema_name → { file, has_strict, has_passthrough, fields } }
```

---

## Phase 2: Component-Level Analysis

### 2.1 Form ↔ Schema Coverage

For each form component in FORMS:
1. **Read the actual file** (not just inventory metadata)
2. Check: Does it import a Zod schema from `validation/`?
3. Check: Does it use `createFormResolver()` (not raw `zodResolver`)?
4. Check: What `mode` is configured? (`onSubmit`, `onBlur`, or `onChange`)
5. Check: Are all required fields marked with `required` prop or `validate={required()}`?

Classification:
- ✅ **Covered:** Has schema + resolver + correct mode
- ⚠️ **Partial:** Has schema but missing resolver or wrong mode
- 🔴 **Uncovered:** No schema or uses raw zodResolver

### 2.2 Schema Quality Check

For each Zod schema in SCHEMAS:
1. Check: Does it use `z.coerce` for numeric fields?
2. Check: Does the create variant use `.strict()`?
3. Check: Does the update variant use `.passthrough()`?
4. Check: Are all DB columns covered (compare against types)?
5. Check: Does it use `z.enum()` for stage/status fields?

### 2.3 Form Field Binding

For each form with issues:
1. Check: Are `source=` props on inputs matching schema field names?
2. Check: Do numeric inputs have `z.coerce.number()` in schema?
3. Check: Are date inputs using proper date coercion?
4. Check: Is there a `defaultValues` prop preventing uncontrolled→controlled warnings?

---

## Phase 3: Confidence Enrichment

### 3.1 Upgrade/Downgrade Quick Scan Findings

For each FORM finding from quick scan:
```
If component-level analysis CONFIRMS the pattern match is a real issue:
  confidence += 0.10 (upgrade toward blocker)
  Add enriched evidence with component context

If component-level analysis shows the match is a FALSE POSITIVE:
  confidence -= 0.15 (downgrade below threshold)
  Mark as "verified: false_positive"

If analysis reveals NEW issues not caught by patterns:
  Add as new findings with confidence_base from checks.json
```

### 3.2 Generate Enriched Report

Write enriched JSON to `.claude/commands/audit/reports/deep-forms-{DATE}.json`:

```json
{
  "meta": {
    "deep_dive": "forms",
    "timestamp": "ISO-8601",
    "forms_analyzed": <count>,
    "schemas_analyzed": <count>
  },
  "coverage": {
    "covered": ["FormA", "FormB"],
    "partial": ["FormC"],
    "uncovered": ["FormD"]
  },
  "findings": [
    {
      "id": "FORM-B001",
      "file": "path.tsx",
      "line": 42,
      "check": "Missing form resolver",
      "evidence": "Enriched evidence with component context (max 200 chars)",
      "user_impact": "What user experiences (max 100 chars)",
      "confidence": 0.95,
      "enrichment": "Verified by reading component — no resolver import found",
      "original_confidence": 0.85
    }
  ],
  "recommendations": [
    "Add createFormResolver(contactSchema) to ContactCreate.tsx",
    "Switch QuickAddForm from onChange to onSubmit mode"
  ]
}
```

---

## Phase 4: Console Summary

Print a focused summary (max 30 lines):

```
═══════════════════════════════════════════════
  FORMS DEEP DIVE — {DATE}
  Forms: {total} | Schemas: {total}
═══════════════════════════════════════════════

  Coverage:
    ✅ Covered:   {count} forms with schema + resolver
    ⚠️ Partial:   {count} forms missing resolver or mode
    🔴 Uncovered: {count} forms without schema

  Findings upgraded:   {count} (pattern → confirmed)
  False positives:     {count} (pattern → dismissed)
  New issues found:    {count}

  📁 Report: .claude/commands/audit/reports/deep-forms-{DATE}.json
═══════════════════════════════════════════════
```
