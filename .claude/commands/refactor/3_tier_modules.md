<context>
Project: Crispy CRM (React 19 + TypeScript + React Admin 5)
Task: Audit feature modules against Module Standardization Checklist
Architecture: 3-Tier Component system (Base → Admin → Feature)

Feature modules location: src/atomic-crm/
Expected structure per module:
- index.tsx (Resource definition)
- {Entity}List.tsx
- {Entity}Create.tsx
- {Entity}Edit.tsx
- {Entity}Show.tsx
- {Entity}Inputs.tsx (shared form inputs)

Checklist enforces:
- No direct Supabase imports (use React Admin hooks)
- Semantic colors only (no hex, no hardcoded Tailwind colors)
- Zod validation at boundary (not inline in forms)
- Proper component tier usage
- 44px touch targets (h-11 minimum)
</context>

<goal>
Produce a comprehensive compliance report showing:
1. Each feature module's checklist status
2. Specific violations with file:line references
3. Summary statistics (pass/fail counts)
4. Priority remediation list
</goal>

<constraints>
- READ-ONLY — do NOT modify any files
- Report ALL violations found, not just samples
- Include exact file paths and line numbers
- Flag severity: 🔴 Critical | 🟡 Medium | 🟢 Pass
- Do NOT fix anything — only report
</constraints>

<exploration_sequence>
PHASE 1: Enumerate Feature Modules
List all feature module directories:
```bash
# Find all feature module directories
fd . src/atomic-crm/ --type d --max-depth 1 | grep -v "__" | grep -v "providers" | grep -v "validation" | grep -v "hooks" | sort

# Count modules
fd . src/atomic-crm/ --type d --max-depth 1 | grep -v "__" | wc -l
```

---

PHASE 2: File Structure Audit (Rule #6)
For each module, check standard filenames:
```bash
# List files in each module
for dir in src/atomic-crm/contacts src/atomic-crm/opportunities src/atomic-crm/organizations src/atomic-crm/tasks src/atomic-crm/activities src/atomic-crm/products src/atomic-crm/sales src/atomic-crm/tags; do
  echo "=== $dir ==="
  ls -la "$dir"/*.tsx 2>/dev/null || echo "No tsx files"
done

# Check for forbidden folders (utils, components inside features)
fd -t d "utils|components" src/atomic-crm/ --max-depth 2
```

Checklist:
- [ ] index.tsx exists
- [ ] {Entity}List.tsx exists
- [ ] {Entity}Create.tsx exists
- [ ] {Entity}Edit.tsx exists
- [ ] No nested utils/ folder
- [ ] No nested components/ folder

---

PHASE 3: Data Access Audit (Rule #5)
Search for direct Supabase imports:
```bash
# CRITICAL: Find direct Supabase imports in feature modules
rg "from ['\"]@supabase|from ['\"].*supabase" src/atomic-crm/ --type ts --type tsx -n

# Find any supabase.from() calls
rg "supabase\.from\(|\.from\(['\"]" src/atomic-crm/ --type ts --type tsx -n --glob '!**/providers/**'

# Verify React Admin hooks are used instead
rg "useDataProvider|useGetList|useGetOne|useCreate|useUpdate|useDelete" src/atomic-crm/ -l --glob '!**/providers/**'
```

Checklist:
- [ ] No `import ... from '@supabase/...'`
- [ ] No `supabase.from()` calls
- [ ] Uses React Admin data hooks

---

PHASE 4: Form Architecture Audit (Rule #3)
Check validation patterns:
```bash
# Find form mode settings
rg "mode=['\"]|mode:" src/atomic-crm/ --type tsx -n -A 1

# Find inline validation (should NOT exist)
rg "validate=\{|validate:" src/atomic-crm/ --type tsx -n --glob '*Create*' --glob '*Edit*'

# Check for {Entity}Inputs.tsx files
fd "Inputs.tsx" src/atomic-crm/

# Find validation imports that should be in provider layer
rg "z\.object|z\.string|from ['\"]zod" src/atomic-crm/ --type tsx -n --glob '!**/validation/**' --glob '!**/providers/**'
```

Checklist:
- [ ] Forms use `mode="onSubmit"` or `mode="onBlur"`
- [ ] No extensive inline `validate={...}` props
- [ ] {Entity}Inputs.tsx exists for shared inputs
- [ ] No Zod imports in UI components

---

PHASE 5: Component Tiers Audit (Rule #4)
Check proper tier usage:
```bash
# Tier 1 violations: Raw shadcn in features (should use Tier 2)
rg "from ['\"]@/components/ui/button|from ['\"]@/components/ui/input" src/atomic-crm/ --type tsx -n --glob '!**/providers/**'

# Verify Tier 2 usage: React Admin components
rg "from ['\"]react-admin" src/atomic-crm/ -l

# Find business logic in components (should be in hooks)
rg "const.*=.*async|await.*supabase|\.then\(" src/atomic-crm/ --type tsx -n --glob '*List*' --glob '*Create*' --glob '*Edit*'
```

Checklist:
- [ ] Uses React Admin inputs (TextInput, DateInput, etc.)
- [ ] No raw shadcn Button/Input in feature components
- [ ] Business logic in hooks, not components

---

PHASE 6: Styling & UX Audit (Rule #8)
Check color and sizing patterns:
```bash
# CRITICAL: Find hex color codes
rg "#[0-9a-fA-F]{3,6}" src/atomic-crm/ --type tsx -n

# Find hardcoded Tailwind colors (should use semantic)
rg "red-[0-9]|blue-[0-9]|green-[0-9]|gray-[0-9]|yellow-[0-9]" src/atomic-crm/ --type tsx -n

# Verify semantic colors used
rg "text-destructive|text-primary|bg-muted|text-muted" src/atomic-crm/ --type tsx -l

# Check touch targets (should be h-11 or larger)
rg "h-[0-9]|h-10|className.*h-8|className.*h-9" src/atomic-crm/ --type tsx -n
```

Checklist:
- [ ] No hex color codes (#fff, #000, etc.)
- [ ] No hardcoded Tailwind colors (red-500, blue-600)
- [ ] Uses semantic colors (text-destructive, bg-muted)
- [ ] Touch targets ≥44px (h-11)

---

PHASE 7: Safety & Cleanup Audit (Rule #6)
Check delete patterns and imports:
```bash
# Check for custom delete logic (should use DeleteButton)
rg "\.delete\(|DELETE|delete.*async" src/atomic-crm/ --type tsx -n --glob '!**/providers/**'

# Find DeleteButton usage (correct pattern)
rg "DeleteButton|<Delete" src/atomic-crm/ --type tsx -n

# Check for unused imports (basic scan)
rg "^import.*from" src/atomic-crm/ --type tsx | head -50
```

Checklist:
- [ ] Uses standard DeleteButton (not custom delete logic)
- [ ] No manual archive/soft-delete in UI
</exploration_sequence>

<output_format>
# Module Standardization Compliance Report

**Generated:** [date]
**Modules Audited:** [N]

---

## Summary

| Category | Pass | Fail | Critical |
|----------|------|------|----------|
| 1. File Structure | [N] | [N] | [N] |
| 2. Data Access | [N] | [N] | [N] |
| 3. Form Architecture | [N] | [N] | [N] |
| 4. Component Tiers | [N] | [N] | [N] |
| 5. Styling & UX | [N] | [N] | [N] |
| 6. Safety & Cleanup | [N] | [N] | [N] |
| **TOTAL** | [N] | [N] | [N] |

---

## Module-by-Module Results

### contacts/
| Check | Status | Violation |
|-------|--------|-----------|
| Standard filenames | 🟢/🔴 | [details if fail] |
| No direct Supabase | 🟢/🔴 | [file:line if fail] |
| Semantic colors | 🟢/🔴 | [file:line if fail] |
| ... | ... | ... |

### opportunities/
[Same table structure]

### organizations/
[Same table structure]

[Repeat for each module]

---

## Critical Violations (Immediate Action)

| # | Module | Rule | File:Line | Issue |
|---|--------|------|-----------|-------|
| 1 | [module] | Data Access | `file.tsx:45` | Direct Supabase import |
| 2 | [module] | Styling | `file.tsx:89` | Hex color #f0f0f0 |
| ... | ... | ... | ... | ... |

---

## Medium Violations (Should Fix)

| # | Module | Rule | File:Line | Issue |
|---|--------|------|-----------|-------|
| 1 | [module] | File Structure | [path] | Missing {Entity}Inputs.tsx |
| ... | ... | ... | ... | ... |

---

## Passing Modules
[List modules with 100% compliance]

---

## Remediation Priority

1. **[Module]** — [N] critical, [N] medium violations
2. **[Module]** — [N] critical, [N] medium violations
3. ...

---

## Recommended Next Steps
1. [First action based on findings]
2. [Second action]
3. [Third action]
</output_format>

<success_criteria>
- [ ] All feature module directories enumerated
- [ ] File structure checked for each module
- [ ] Direct Supabase imports identified (if any)
- [ ] Inline validation patterns identified (if any)
- [ ] Hex colors and hardcoded Tailwind colors identified (if any)
- [ ] Touch target violations identified (if any)
- [ ] Custom delete logic identified (if any)
- [ ] Summary statistics calculated
- [ ] Critical violations listed with file:line
- [ ] Remediation priority established
- [ ] NO files modified — report only
</success_criteria>