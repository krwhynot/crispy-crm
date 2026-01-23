---
description: Accessibility audit (ARIA, touch targets, semantic colors) with delta tracking - saves to docs/audits/
argument-hint: [--quick | --full | src/path]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), TodoWrite, Write
model: sonnet
---

# Accessibility Audit Command

You are performing an accessibility audit for Crispy CRM. This command systematically checks for WCAG 2.1 AA violations, touch target issues, semantic color violations, and ARIA attribute problems with delta tracking against previous audits.

> **SKILL ACTIVATION:** Using `accessibility` audit command with ui-ux-design-principles integration.

---

## Arguments

**$ARGUMENTS**

- `--quick` - Skip deep component analysis, run only local rg patterns (faster)
- `--full` - Run all checks including deep component analysis (default)
- `src/path` - Limit scope to specific directory

---

## Phase 1: Mode Detection and Setup

### 1.1 Parse Arguments

```
MODE = "full" (default)
SCOPE = "src/"

If $ARGUMENTS contains "--quick":
  MODE = "quick"

If $ARGUMENTS contains "--full":
  MODE = "full"

If $ARGUMENTS contains a path (e.g., "src/atomic-crm/contacts"):
  SCOPE = that path only
```

### 1.2 Get Current Date

```bash
date +%Y-%m-%d
```

Store as `AUDIT_DATE` for report naming.

---

## Tier-Based Severity Adjustment

Findings are escalated based on where violations occur in the component hierarchy. Foundation issues propagate systemically and require higher priority.

| File Location | Severity Level | Rationale |
|---------------|----------------|-----------|
| `src/components/ui/` (Tier 1) | Critical | Foundation violations propagate everywhere |
| `src/components/ra-wrappers/` (Tier 2) | High | Affects all feature consumers |
| `src/atomic-crm/` (Features) | High | Local fixes, contained scope |

**Severity Escalation Rules:**
- A "High" severity finding in Tier 1 becomes **Critical**
- A "Medium" severity finding in Tier 1 becomes **High**
- Tier 2 and Feature findings retain their base severity

---

## Phase 2: Local Accessibility Checks (Always Run)

Run these `rg` patterns and collect findings. Each finding should include:
- File path and line number
- Code snippet (context)
- Severity level
- Risk description

### Critical Severity Checks (WCAG 2.1 AA Violations)

| ID | Check | Command | Risk |
|----|-------|---------|------|
| A01 | Missing aria-invalid on error inputs | `rg "error.*&&" --type tsx -n $SCOPE` then check if same component lacks `aria-invalid` | Screen readers miss validation errors |
| A02 | Missing role="alert" on errors | `rg "error-message\|ErrorMessage\|formState\.errors" --type tsx -n $SCOPE` then check if error display lacks `role="alert"` | Error messages not announced to screen readers |
| A03 | Missing aria-describedby | `rg "<input\|<Input\|<TextField" --type tsx -n $SCOPE` then verify error fields have `aria-describedby` linking to error message | Error not associated with input |
| A04 | Focus not managed on error | Check for `focus()` or `focusOnError` in form error handlers | Users with screen readers lose context |

### High Severity Checks (Usability Barriers)

| ID | Check | Command | Risk |
|----|-------|---------|------|
| A05 | Hardcoded hex colors | `rg "#[0-9a-fA-F]{3,6}" --type tsx -n $SCOPE` excluding CSS/config files | Not in design system, inconsistent theming |
| A06 | Hardcoded Tailwind colors | `rg "bg-\w+-\d{3}\|text-\w+-\d{3}\|border-\w+-\d{3}" --type tsx -n $SCOPE` | Not semantic tokens, breaks theme consistency |
| A07 | Small touch targets (< 44px) | `rg "h-[1-9]\s\|h-10\s\|w-[1-9]\s\|w-10\s" --type tsx -n $SCOPE` | Under 44px minimum for touch accessibility |
| A08 | Pure black/white colors | `rg "#000\|#fff\|#000000\|#ffffff\|rgb\(0,\s*0,\s*0\)\|rgb\(255,\s*255,\s*255\)" --type tsx -n $SCOPE` | Accessibility contrast issues |
| A09 | Missing focus-visible | `rg "onClick\|onPress" --type tsx -n $SCOPE` then check for `focus-visible:` or `focus:` styles | Keyboard navigation broken |

### Medium Severity Checks (Best Practices)

| ID | Check | Command | Risk |
|----|-------|---------|------|
| A10 | Raw OKLCH values | `rg "oklch\(" --type tsx -n $SCOPE` not in CSS variable definition | Not tokenized, hard to maintain |
| A11 | Images without alt | `rg "<img\|<Image" --type tsx -n $SCOPE` then check for `alt` prop | Screen reader issues |
| A12 | Buttons without accessible name | `rg "<button\|<Button" --type tsx -n $SCOPE` without text content or `aria-label` | Screen readers announce "button" with no context |
| A13 | Links without href | `rg "<a\s" --type tsx -n $SCOPE` without `href` | Keyboard inaccessible |
| A14 | Missing form labels | `rg "<input\|<select\|<textarea" --type tsx -n $SCOPE` without associated `<label>` or `aria-label` | Form fields unlabeled for screen readers |

---

## Phase 3: Deep Component Analysis (Full Mode Only)

**Skip this phase if MODE = "quick"**

### 3.1 Form Component Analysis

For each form component found:

1. **Read the full component file**
2. **Check for ARIA error pattern:**
   ```tsx
   // REQUIRED pattern for form fields with validation
   <input
     aria-invalid={!!error}
     aria-describedby={`${id}-error`}
   />
   {error && <p id={`${id}-error`} role="alert">{error}</p>}
   ```
3. **Flag components missing any part of this pattern**

### 3.2 Interactive Element Analysis

For each button/link/interactive element:

1. **Check touch target size** - Must have `h-11 w-11` or `min-h-[44px] min-w-[44px]`
2. **Check focus styles** - Must have `focus-visible:` or `focus:` with visible outline/ring
3. **Check accessible name** - Must have text content, `aria-label`, or `aria-labelledby`

### 3.3 Color Token Verification

1. **Extract all color classes from component files**
2. **Verify against allowed semantic tokens:**

**Allowed Semantic Tokens (from design system):**
```
// Backgrounds
bg-background, bg-card, bg-muted, bg-primary, bg-secondary
bg-destructive, bg-accent, bg-popover

// Text
text-foreground, text-muted-foreground, text-primary, text-secondary
text-destructive, text-accent-foreground, text-card-foreground

// Borders
border-border, border-input, border-primary, border-destructive
```

3. **Flag any non-semantic color usage** (e.g., `bg-gray-100`, `text-blue-500`)

---

## Phase 4: Load Baseline

Read the baseline file if it exists:

```
Read: docs/audits/.baseline/accessibility.json
```

**Baseline Schema:**
```json
{
  "lastAuditDate": "2025-01-08",
  "lastAuditMode": "full",
  "scope": "src/",
  "findings": {
    "critical": [
      {
        "id": "A01-001",
        "check": "A01",
        "file": "src/atomic-crm/contacts/ContactEdit.tsx",
        "line": 45,
        "description": "Missing aria-invalid on email input",
        "tier": "feature",
        "firstSeen": "2025-01-08",
        "status": "open"
      }
    ],
    "high": [],
    "medium": []
  },
  "counts": {
    "critical": 1,
    "high": 0,
    "medium": 0
  },
  "byTier": {
    "tier1": { "critical": 0, "high": 0, "medium": 0 },
    "tier2": { "critical": 0, "high": 0, "medium": 0 },
    "feature": { "critical": 1, "high": 0, "medium": 0 }
  }
}
```

If baseline does not exist or is empty, treat as first audit (no delta).

### 4.1 Compare Findings

For each current finding:
1. Check if it exists in baseline by `file` + `line` + `check` type
2. If NOT in baseline -> Mark as **NEW**
3. If in baseline -> Mark as **EXISTING**

For each baseline finding:
1. If NOT in current findings -> Mark as **FIXED**

---

## Phase 5: Generate Report

### 5.1 Create Markdown Report

Save to: `docs/audits/YYYY-MM-DD-accessibility.md`

```markdown
# Accessibility Audit Report

**Date:** [AUDIT_DATE]
**Mode:** [Quick/Full]
**Scope:** [SCOPE]
**Auditor:** Claude Code (automated)

---

## Executive Summary

| Severity | Previous | Current | Delta |
|----------|----------|---------|-------|
| Critical | X | Y | +Z/-W |
| High | X | Y | +Z/-W |
| Medium | X | Y | +Z/-W |
| **Total** | X | Y | +Z/-W |

### Findings by Tier (Layer 4 Architecture)

| Tier | Scope | Issues | Severity | Blast Radius |
|------|-------|--------|----------|--------------|
| **Tier 1** | `src/components/ui/` | X | Critical | All components |
| **Tier 2** | `src/components/ra-wrappers/` | Y | High | All features |
| **Features** | `src/atomic-crm/` | Z | High | Local only |

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical** | Users may lose data, see incorrect information, or have their accounts compromised. The app may crash or behave unpredictably. These issues directly harm the user experience. |
| **High** | Users may encounter frustrating bugs, slow performance, or inconsistent behavior. Features may not work as expected, leading to confusion or wasted time. |
| **Medium** | Users won't notice these immediately, but they make the app harder to improve. Future features will take longer to build and may introduce new bugs. |

**Status:** [PASS if 0 Critical, WARN if Critical exists]

---

## Delta from Last Audit

### New Issues (Introduced Since Last Audit)

| ID | Severity | Check | Location | Risk |
|----|----------|-------|----------|------|
| [ID] | [sev] | [check] | [file:line] | [risk] |

### Fixed Issues (Resolved Since Last Audit)

| ID | Severity | Check | Location | Resolution Date |
|----|----------|-------|----------|-----------------|
| [ID] | [sev] | [check] | [file:line] | [AUDIT_DATE] |

---

## Current Findings

### Tier 1 Violations (CRITICAL) - Foundation Issues

**Scope:** `src/components/ui/` - Systemic issues that propagate to all consumers.

> These violations affect EVERY component built on top of Tier 1. Fix immediately as they have maximum blast radius.

#### Foundation WCAG Violations

| ID | Check | Location | Risk |
|----|-------|----------|------|
| [ID] | [check] | [file:line] | [risk description] |

#### Foundation Color/Token Violations

| ID | Check | Location | Risk |
|----|-------|----------|------|
| [ID] | [check] | [file:line] | [risk description] |

**Example Fix Pattern (Tier 1):**
\`\`\`tsx
// src/components/ui/input.tsx - CORRECT
<input
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
  className="focus-visible:ring-2 focus-visible:ring-ring"
  {...props}
/>
\`\`\`

---

### Tier 2 Violations (HIGH) - Wrapper Issues

**Scope:** `src/components/ra-wrappers/` - Issues affecting all feature consumers.

> These violations affect all features using React Admin wrappers. High priority as they multiply across modules.

#### Wrapper ARIA/Accessibility Issues

| ID | Check | Location | Risk |
|----|-------|----------|------|
| [ID] | [check] | [file:line] | [risk description] |

---

### Feature Violations (HIGH) - Local Issues

**Scope:** `src/atomic-crm/` - Contained issues with local fixes.

> These violations are scoped to individual features. Still high priority but fixes are isolated.

#### [A01] Missing aria-invalid on Error Inputs

**Files Affected:**
- `src/atomic-crm/contacts/ContactEdit.tsx:123` - Input field lacks `aria-invalid={!!error}`

**Risk:** Screen readers do not announce validation errors to users.

**Fix Pattern:**
\`\`\`tsx
<input
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
  {...register('fieldName')}
/>
{error && (
  <p id={`${id}-error`} role="alert" className="text-destructive">
    {error.message}
  </p>
)}
\`\`\`

#### [A05] Hardcoded Hex Colors

**Files Affected:**
- `src/atomic-crm/contacts/ContactList.tsx:45` - Uses `#3B82F6` instead of semantic token

**Risk:** Color not in design system, breaks theme consistency.

**Fix:** Replace with semantic token:
- `#3B82F6` -> `text-primary` or `bg-primary`

#### [A07] Small Touch Targets

**Files Affected:**
- `src/atomic-crm/opportunities/OpportunityEdit.tsx:78` - Button uses `h-8 w-8` (32px)

**Risk:** Touch target under 44px minimum for accessibility.

**Fix:** Use `h-11 w-11` or `min-h-[44px] min-w-[44px]`

---

### Medium Severity (Best Practices)

#### [A11] Images Without Alt Text

**Files Affected:**
- `src/path/Component.tsx:23` - `<img>` without `alt` attribute

**Risk:** Screen readers cannot describe image to users.

**Fix:** Add descriptive `alt` text or `alt=""` for decorative images.

---

## Correct Pattern Reference

### ARIA Error Handling (Required for All Form Fields)

\`\`\`tsx
// CORRECT: Full ARIA error pattern
const { register, formState: { errors } } = useForm()
const fieldId = useId()

<div>
  <label htmlFor={fieldId}>Email</label>
  <input
    id={fieldId}
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? `${fieldId}-error` : undefined}
    {...register('email')}
  />
  {errors.email && (
    <p id={`${fieldId}-error`} role="alert" className="text-destructive text-sm">
      {errors.email.message}
    </p>
  )}
</div>
\`\`\`

### Semantic Color Tokens (Required)

\`\`\`tsx
// CORRECT: Semantic tokens
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Secondary text</p>
  <button className="bg-primary text-primary-foreground">Action</button>
  <span className="text-destructive">Error message</span>
</div>

// WRONG: Hardcoded colors
<div className="bg-white text-gray-900">
  <p className="text-gray-500">Secondary text</p>
  <button className="bg-blue-600 text-white">Action</button>
  <span className="text-red-500">Error message</span>
</div>
\`\`\`

### Touch Targets (44px Minimum)

\`\`\`tsx
// CORRECT: 44px touch targets
<button className="h-11 w-11 p-2">
  <Icon />
</button>

<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Click me
</button>

// WRONG: Too small
<button className="h-8 w-8 p-1">
  <Icon />
</button>
\`\`\`

### Focus States (Required for All Interactive Elements)

\`\`\`tsx
// CORRECT: Visible focus states
<button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Click me
</button>

// WRONG: No focus state
<button className="hover:bg-gray-100">
  Click me
</button>
\`\`\`

---

## Recommendations

### Immediate Actions (Critical)
1. [Action 1]
2. [Action 2]

### Short-Term (High)
1. [Action 1]

### Technical Debt (Medium)
1. [Action 1]

---

## Appendix: Check Definitions

| ID | Check | Pattern | Severity |
|----|-------|---------|----------|
| A01 | Missing aria-invalid | Form input without `aria-invalid` on error | Critical |
| A02 | Missing role="alert" | Error message without `role="alert"` | Critical |
| A03 | Missing aria-describedby | Input not linked to error message | Critical |
| A04 | Focus not managed on error | No focus management in error handler | Critical |
| A05 | Hardcoded hex colors | `#XXXXXX` in TSX files | High |
| A06 | Hardcoded Tailwind colors | `bg-gray-500`, `text-blue-600`, etc. | High |
| A07 | Small touch targets | Under 44px (h-10 or smaller) | High |
| A08 | Pure black/white | `#000`, `#fff`, `rgb(0,0,0)` | High |
| A09 | Missing focus-visible | Interactive without focus styles | High |
| A10 | Raw OKLCH values | `oklch()` not in CSS variable | Medium |
| A11 | Images without alt | `<img>` without `alt` attribute | Medium |
| A12 | Buttons without name | Button without text or aria-label | Medium |
| A13 | Links without href | `<a>` without `href` attribute | Medium |
| A14 | Missing form labels | Input without label or aria-label | Medium |

---

*Generated by /audit/accessibility command*
*Report location: docs/audits/YYYY-MM-DD-accessibility.md*
```

### 5.2 Update Baseline JSON

Write to: `docs/audits/.baseline/accessibility.json`

```json
{
  "lastAuditDate": "[AUDIT_DATE]",
  "lastAuditMode": "[MODE]",
  "scope": "[SCOPE]",
  "findings": {
    "critical": [
      {
        "id": "[unique-id]",
        "check": "[A01-A14]",
        "file": "[file path]",
        "line": [line number],
        "description": "[description]",
        "firstSeen": "[date first detected]",
        "status": "open"
      }
    ],
    "high": [...],
    "medium": [...]
  },
  "counts": {
    "critical": [count],
    "high": [count],
    "medium": [count]
  }
}
```

---

## Phase 6: Create Action Items

### 6.1 TodoWrite for Critical/High Findings

Create todos for all Critical and High severity findings:

```typescript
TodoWrite([
  // Critical findings
  {
    content: "[Critical] A01: Add aria-invalid to ContactEdit.tsx:45",
    status: "pending",
    activeForm: "Adding aria-invalid to ContactEdit"
  },
  {
    content: "[Critical] A02: Add role=\"alert\" to error message in ContactEdit.tsx:52",
    status: "pending",
    activeForm: "Adding role=alert to error message"
  },
  // High findings
  {
    content: "[High] A05: Replace hardcoded #3B82F6 with semantic token in Header.tsx:23",
    status: "pending",
    activeForm: "Replacing hardcoded color with semantic token"
  },
  {
    content: "[High] A07: Increase touch target to 44px in IconButton.tsx:15",
    status: "pending",
    activeForm: "Increasing touch target size"
  }
  // Medium findings NOT added to todos (fix when convenient)
])
```

### 6.2 Summary Output

Display summary to user:

```markdown
## Accessibility Audit Complete

**Date:** [AUDIT_DATE]
**Mode:** [MODE]
**Report:** docs/audits/[AUDIT_DATE]-accessibility.md
**Baseline:** docs/audits/.baseline/accessibility.json (updated)

### Results

| Severity | Count | Action Required |
|----------|-------|-----------------|
| Critical | X | WCAG 2.1 AA VIOLATION |
| High | Y | Fix for accessibility compliance |
| Medium | Z | Fix when convenient |

### Delta Summary
- **New issues:** X
- **Fixed issues:** Y
- **Net change:** +/-Z

### Next Steps
[List recommended actions based on findings]
```

---

## Severity Definitions

| Level | Definition | Impact | Examples |
|-------|------------|--------|----------|
| **Critical** | WCAG 2.1 AA violation that excludes users | Accessibility lawsuit risk, users cannot complete tasks | Missing ARIA on errors, no screen reader support |
| **High** | Usability barrier that degrades experience | Users struggle to interact, theme inconsistency | Small touch targets, hardcoded colors, missing focus |
| **Medium** | Best practice violation | Minor UX issues, maintenance burden | Missing alt text, unlabeled buttons |

---

## Quick Reference

### Run Full Audit
```
/audit/accessibility
/audit/accessibility --full
```

### Run Quick Audit (Local Only)
```
/audit/accessibility --quick
```

### Audit Specific Directory
```
/audit/accessibility src/atomic-crm/contacts/
/audit/accessibility --quick src/components/
```

---

## Related Commands

- `/audit/security` - Security patterns and validation
- `/audit/deep` - Full codebase audit (architecture + security + UI/UX)
- `/code-review` - Deep dive code review with parallel agents

## Related Skills

- `ui-ux-design-principles` - Full design system and accessibility guidelines
- `crispy-design-system` - Tailwind v4, semantic colors, touch targets
