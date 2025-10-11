# Opportunity Stage System Research

**Date:** 2025-10-10
**Purpose:** Document the opportunity stage system, color mappings, and identify bugs for Kanban enhancement
**Status:** Analysis complete - bug identified in `stageConstants.ts`

---

## 1. Stage Constants Files

### Primary Files
- **`/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`**
  Main stage configuration file with types, constants, color mappings, and helper functions

- **`/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`**
  Stage grouping logic for Kanban board (transforms flat opportunity list into stage-based columns)

- **`/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/opportunity.ts`**
  Legacy compatibility layer for stage label lookups

### Supporting Files
- **`/home/krwhynot/Projects/atomic/src/atomic-crm/root/defaultConfiguration.ts`**
  Default stage definitions for configuration fallback

- **`/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts`**
  TypeScript type definitions including `Opportunity` interface with `stage` field

---

## 2. Opportunity Stage System

### 2.1 Stage Type Definition

**TypeScript Type:**
```typescript
export type OpportunityStageValue =
  | "new_lead"
  | "initial_outreach"
  | "sample_visit_offered"
  | "awaiting_response"
  | "feedback_logged"
  | "demo_scheduled"
  | "closed_won"
  | "closed_lost";
```

**Interface:**
```typescript
export interface OpportunityStage {
  value: string;        // Internal value (snake_case)
  label: string;        // Display name (Title Case)
  color: string;        // CSS variable for stage color
  description: string;  // Human-readable description
}
```

### 2.2 All Stages (in pipeline order)

| Order | Value | Label | Description |
|-------|-------|-------|-------------|
| 1 | `new_lead` | "New Lead" | Initial prospect identification |
| 2 | `initial_outreach` | "Initial Outreach" | First contact and follow-up |
| 3 | `sample_visit_offered` | "Sample/Visit Offered" | Product sampling and visit scheduling |
| 4 | `awaiting_response` | "Awaiting Response" | Following up after sample delivery |
| 5 | `feedback_logged` | "Feedback Logged" | Recording customer feedback |
| 6 | `demo_scheduled` | "Demo Scheduled" | Planning product demonstrations |
| 7 | `closed_won` | "Closed - Won" | Successful deal completion |
| 8 | `closed_lost` | "Closed - Lost" | Lost opportunity |

### 2.3 Environment Variable Configuration

**Variable:** `OPPORTUNITY_PIPELINE_STAGES`

**Location:** `/home/krwhynot/Projects/atomic/.env`

**Current Value:**
```bash
OPPORTUNITY_PIPELINE_STAGES=new_lead,initial_outreach,sample_visit_offered,awaiting_response,feedback_logged,demo_scheduled,closed_won,closed_lost
```

**Purpose:** Configures the pipeline stages at runtime (comma-separated list of stage values)

**Other Opportunity Environment Variables:**
```bash
OPPORTUNITY_DEFAULT_CATEGORY=new_business
OPPORTUNITY_DEFAULT_STAGE=new_lead
OPPORTUNITY_MAX_AMOUNT=1000000
OPPORTUNITY_DEFAULT_PROBABILITY=50
```

---

## 3. Stage Color Mappings

### 3.1 Full Stage-to-Color Table

| Stage Value | Color Variable | Light Mode Color | Dark Mode Color | Status |
|-------------|----------------|------------------|-----------------|--------|
| `new_lead` | `var(--info-subtle)` | `oklch(92% 0.08 230)` | `oklch(25% 0.1 230)` | ✅ Valid |
| `initial_outreach` | `var(--tag-teal-bg)` | `oklch(94.2% 0.023 196.7)` | `oklch(33% 0.07 196.7)` | ✅ Valid |
| `sample_visit_offered` | `var(--warning-subtle)` | `oklch(95% 0.08 85)` | `oklch(25% 0.09 85)` | ✅ Valid |
| `awaiting_response` | `var(--purple)` | ❌ **UNDEFINED** | ❌ **UNDEFINED** | 🐛 **BUG** |
| `feedback_logged` | `var(--blue)` | ❌ **UNDEFINED** | ❌ **UNDEFINED** | 🐛 **BUG** |
| `demo_scheduled` | `var(--success-subtle)` | `oklch(90% 0.06 145)` | `oklch(25% 0.08 145)` | ✅ Valid |
| `closed_won` | `var(--success-strong)` | `oklch(50% 0.15 145)` | `oklch(65% 0.13 145)` | ✅ Valid |
| `closed_lost` | `var(--error-subtle)` | `oklch(93% 0.09 25)` | `oklch(27% 0.11 25)` | ✅ Valid |

### 3.2 Color Categories

**Active Stage Colors:**
- **Blue tones:** `--info-subtle` (new leads)
- **Teal:** `--tag-teal-bg` (outreach)
- **Orange/Yellow:** `--warning-subtle` (sample/visit)
- **Purple:** `--tag-purple-bg` (awaiting response) - **NEEDS FIX**
- **Blue:** `--tag-blue-bg` (feedback) - **NEEDS FIX**
- **Green:** `--success-subtle` (demo scheduled)

**Closed Stage Colors:**
- **Success green:** `--success-strong` (won deals)
- **Error red:** `--error-subtle` (lost deals)

---

## 4. THE BUG: Undefined Color Variables

### 4.1 Bug Details

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`
**Lines:** 45, 51
**Severity:** High (prevents proper rendering of stage colors)

### 4.2 Current Broken Code

```typescript
export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  // ... other stages ...
  {
    value: "awaiting_response",
    label: "Awaiting Response",
    color: "var(--purple)",  // ❌ LINE 45: UNDEFINED VARIABLE
    description: "Following up after sample delivery",
  },
  {
    value: "feedback_logged",
    label: "Feedback Logged",
    color: "var(--blue)",  // ❌ LINE 51: UNDEFINED VARIABLE
    description: "Recording customer feedback",
  },
  // ... other stages ...
];
```

### 4.3 Root Cause Analysis

**Problem:** The CSS variables `--purple` and `--blue` do not exist in `/home/krwhynot/Projects/atomic/src/index.css`

**Available Color Variables in index.css:**
- ✅ `--tag-purple-bg` and `--tag-purple-fg` (light/dark mode defined)
- ✅ `--tag-blue-bg` and `--tag-blue-fg` (light/dark mode defined)
- ❌ `--purple` (not defined)
- ❌ `--blue` (not defined)

**Impact:**
- Stage colors fall back to browser default or fail to render
- No visual distinction for "Awaiting Response" and "Feedback Logged" stages
- Breaks visual hierarchy in Kanban board enhancement

### 4.4 Required Fix

```typescript
// BEFORE (BROKEN):
{
  value: "awaiting_response",
  label: "Awaiting Response",
  color: "var(--purple)",  // ❌ Undefined
  description: "Following up after sample delivery",
},
{
  value: "feedback_logged",
  label: "Feedback Logged",
  color: "var(--blue)",  // ❌ Undefined
  description: "Recording customer feedback",
},

// AFTER (FIXED):
{
  value: "awaiting_response",
  label: "Awaiting Response",
  color: "var(--tag-purple-bg)",  // ✅ Defined in index.css
  description: "Following up after sample delivery",
},
{
  value: "feedback_logged",
  label: "Feedback Logged",
  color: "var(--tag-blue-bg)",  // ✅ Defined in index.css
  description: "Recording customer feedback",
},
```

### 4.5 Why This is a Problem

1. **Engineering Constitution Violation (Rule #8 - COLORS):**
   - Must use semantic CSS variables only
   - No undefined/invalid variable references allowed
   - All colors must exist in `index.css`

2. **Visual Consistency:**
   - Stage colors won't render properly in Kanban board
   - Breaks the 2px underline accent feature in requirements

3. **WCAG Compliance:**
   - Can't validate contrast ratios with undefined colors
   - `npm run validate:colors` may fail

4. **Dark Mode Support:**
   - `var(--purple)` has no dark mode fallback
   - Proper tag color variables handle both themes

---

## 5. Helper Functions

### 5.1 `getOpportunityStageLabel(stageValue: string): string`

**Purpose:** Get display label for a stage value

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts:75`

**Implementation:**
```typescript
export function getOpportunityStageLabel(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.label || stageValue;
}
```

**Example Usage:**
```typescript
getOpportunityStageLabel("new_lead") // Returns: "New Lead"
getOpportunityStageLabel("demo_scheduled") // Returns: "Demo Scheduled"
getOpportunityStageLabel("unknown") // Returns: "unknown" (fallback)
```

**Used In:**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx` (line 16)
- Stage header rendering in Kanban columns

### 5.2 `getOpportunityStageColor(stageValue: string): string`

**Purpose:** Get CSS color variable for a stage value

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts:80`

**Implementation:**
```typescript
export function getOpportunityStageColor(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.color || "var(--muted)";
}
```

**Example Usage:**
```typescript
getOpportunityStageColor("new_lead") // Returns: "var(--info-subtle)"
getOpportunityStageColor("awaiting_response") // Returns: "var(--purple)" ❌ BUG!
getOpportunityStageColor("unknown") // Returns: "var(--muted)" (fallback)
```

**Intended Usage in Kanban Enhancement:**
```tsx
<h3
  className="px-3 py-2 text-sm font-semibold uppercase tracking-wide"
  style={{ borderBottom: `2px solid ${getOpportunityStageColor(stage)}` }}
>
  {getOpportunityStageLabel(stage)}
</h3>
```

**Note:** This function is referenced in requirements.md but currently **NOT imported** in `OpportunityColumn.tsx`. The requirements specify adding:
```typescript
import { getOpportunityStageColor } from "./stageConstants";
```

### 5.3 `getOpportunityStageDescription(stageValue: string): string`

**Purpose:** Get human-readable description for a stage

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts:85`

**Implementation:**
```typescript
export function getOpportunityStageDescription(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.description || "";
}
```

**Example Usage:**
```typescript
getOpportunityStageDescription("new_lead")
// Returns: "Initial prospect identification"

getOpportunityStageDescription("closed_won")
// Returns: "Successful deal completion"
```

**Current Usage:** Not actively used in UI (could be used for tooltips)

### 5.4 `isActiveStage(stageValue: string): boolean`

**Purpose:** Check if stage is active (not closed)

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts:90`

**Implementation:**
```typescript
export function isActiveStage(stageValue: string): boolean {
  return !["closed_won", "closed_lost"].includes(stageValue);
}
```

**Example Usage:**
```typescript
isActiveStage("new_lead") // true
isActiveStage("demo_scheduled") // true
isActiveStage("closed_won") // false
isActiveStage("closed_lost") // false
```

**Use Case:** Filtering active vs. closed opportunities, applying opacity to closed stages

### 5.5 `isClosedStage(stageValue: string): boolean`

**Purpose:** Check if stage is closed (won or lost)

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts:94`

**Implementation:**
```typescript
export function isClosedStage(stageValue: string): boolean {
  return ["closed_won", "closed_lost"].includes(stageValue);
}
```

**Example Usage:**
```typescript
isClosedStage("closed_won") // true
isClosedStage("closed_lost") // true
isClosedStage("demo_scheduled") // false
```

**Use Case:** Applying 40% opacity to closed stage indicators (per requirements.md)

### 5.6 Legacy Functions

**`findOpportunityLabel()`** - Backward compatibility wrapper
**`OPPORTUNITY_STAGE_CHOICES`** - React Admin SelectInput format
**`OPPORTUNITY_STAGES_LEGACY`** - Legacy format (value/label only)

All delegate to centralized `getOpportunityStageLabel()` for single source of truth.

---

## 6. Stage Grouping Logic

### 6.1 `getOpportunitiesByStage()` Function

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`

**Purpose:** Transform flat opportunity list into stage-grouped columns for Kanban board

**Signature:**
```typescript
export const getOpportunitiesByStage = (
  unorderedOpportunities: Opportunity[],
  opportunityStages?: { value: string; label: string }[],
): Record<Opportunity["stage"], Opportunity[]>
```

**Logic:**
1. Use `OPPORTUNITY_STAGES` from `stageConstants.ts` if no stages provided
2. Create empty arrays for each stage
3. Group opportunities by `opportunity.stage` field
4. Sort opportunities within each column by `index` field (ascending)
5. Return stage-keyed object with sorted opportunity arrays

**Example Output:**
```typescript
{
  "new_lead": [
    { id: 1, name: "Acme Corp", index: 0, stage: "new_lead", ... },
    { id: 5, name: "Beta Inc", index: 1, stage: "new_lead", ... }
  ],
  "initial_outreach": [
    { id: 3, name: "Gamma LLC", index: 0, stage: "initial_outreach", ... }
  ],
  "sample_visit_offered": [],
  // ... etc for all 8 stages
}
```

**Key Feature:** The `index` field controls card ordering within each column (drag-and-drop order preservation)

---

## 7. Current Component Usage

### 7.1 OpportunityColumn.tsx

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`

**Current Implementation:**
```tsx
import { getOpportunityStageLabel } from "./stageConstants";

export const OpportunityColumn = ({
  stage,
  opportunities,
}: {
  stage: string;
  opportunities: Opportunity[];
}) => {
  return (
    <div className="flex-1 pb-8 min-w-[160px] max-w-[220px]">
      <div className="flex flex-col items-center">
        <h3 className="text-base font-medium">
          {getOpportunityStageLabel(stage)}
        </h3>
      </div>
      <div className="flex flex-col rounded-2xl mt-2 gap-2">
        {opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
    </div>
  );
};
```

**Status:**
- ✅ Uses `getOpportunityStageLabel()` for stage display names
- ❌ Does NOT use `getOpportunityStageColor()` for stage color underline (needs implementation per requirements)

### 7.2 Requirements.md Planned Usage

**Planned Import:**
```typescript
import { getOpportunityStageLabel, getOpportunityStageColor } from "./stageConstants";
```

**Planned Header Implementation:**
```tsx
<h3
  className="px-3 py-2 text-sm font-semibold uppercase tracking-wide"
  style={{ borderBottom: `2px solid ${getOpportunityStageColor(stage)}` }}
>
  {getOpportunityStageLabel(stage)}
</h3>
```

**Blocker:** `getOpportunityStageColor()` will return undefined variables for two stages until bug is fixed.

---

## 8. Color System Integration

### 8.1 Available Semantic Color Variables

**From `/home/krwhynot/Projects/atomic/src/index.css`:**

**State Colors:**
- `--success-subtle`, `--success-default`, `--success-strong` (green)
- `--warning-subtle`, `--warning-default`, `--warning-strong` (orange/yellow)
- `--info-subtle`, `--info-default`, `--info-strong` (blue)
- `--error-subtle`, `--error-default`, `--error-strong` (red)

**Tag Colors (used for stage indicators):**
- `--tag-warm-bg` / `--tag-warm-fg` (warm orange)
- `--tag-green-bg` / `--tag-green-fg` (green)
- `--tag-teal-bg` / `--tag-teal-fg` (teal/cyan)
- `--tag-blue-bg` / `--tag-blue-fg` (blue)
- `--tag-purple-bg` / `--tag-purple-fg` (purple)
- `--tag-yellow-bg` / `--tag-yellow-fg` (yellow)
- `--tag-gray-bg` / `--tag-gray-fg` (gray)
- `--tag-pink-bg` / `--tag-pink-fg` (pink)

**All have light and dark mode variants with WCAG AA contrast ratios (4.5:1).**

### 8.2 Missing Variables (Bug Source)

❌ `--purple` (not defined in index.css)
❌ `--blue` (not defined in index.css)

**These MUST be replaced with:**
- ✅ `--tag-purple-bg` (defined)
- ✅ `--tag-blue-bg` (defined)

### 8.3 Elevation Variables (for Kanban enhancement)

**Note:** The requirements.md references these elevation variables, but they are **NOT currently defined** in `index.css`:

❌ `--background-alt` (not found)
❌ `--background-elevated` (not found)
❌ `--border-muted` (not found)
❌ `--border-subtle` (not found)
❌ `--surface-variant` (not found)

**Impact:** These will need to be added to `index.css` for the Kanban depth enhancement to work, OR the requirements should be updated to use existing variables like:
- `--background` / `--card` (existing surface colors)
- `--border` / `--input` (existing border colors)
- `--muted` (existing muted backgrounds)

---

## 9. Stage System Architecture Insights

### 9.1 Single Source of Truth

**Primary Definition:** `OPPORTUNITY_STAGES` array in `stageConstants.ts`

**All other stage references derive from this:**
- `getOpportunityStageLabel()` → searches `OPPORTUNITY_STAGES`
- `getOpportunityStageColor()` → searches `OPPORTUNITY_STAGES`
- `OPPORTUNITY_STAGE_CHOICES` → mapped from `OPPORTUNITY_STAGES`
- `stages.ts` grouping logic → imports from `stageConstants.ts`

**Rationale:** Engineering Constitution Rule #2 (SINGLE SOURCE OF TRUTH)

### 9.2 Centralization Benefits

1. **No duplicate stage definitions** across components
2. **Type safety** via `OpportunityStageValue` union type
3. **Easy to extend** (add new stage = modify one array)
4. **Validation integration** (Zod schemas can reference type)
5. **Consistent labeling** (no typos across UI)

### 9.3 Configuration Layer

**Environment Variable Override:** `OPPORTUNITY_PIPELINE_STAGES`

**Default Fallback:** `defaultOpportunityStages` in `defaultConfiguration.ts`

**Order of Precedence:**
1. Environment variable (`.env` file)
2. Default configuration (hardcoded fallback)

**Why Environment Variable:**
- Allows per-deployment stage customization
- No code changes for pipeline variations
- Testable via `vitest.config.ts` overrides

---

## 10. Testing Implications

### 10.1 Test Files

**Location:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/opportunityUtils.spec.ts`

**Coverage:** Likely tests stage grouping and helper functions

**Bug Impact:** Tests may pass despite color bug (color rendering not tested in unit tests)

### 10.2 Color Validation

**Command:** `npm run validate:colors`

**Purpose:** WCAG AA contrast ratio validation

**Expected Behavior:**
- Should validate all `--tag-*-bg` and semantic state colors
- May NOT catch undefined variable references (depends on implementation)
- Post-fix validation MUST still pass

### 10.3 Visual Regression Testing

**Requirements.md Section 5.4:** Before/after screenshots needed

**Bug Impact:** Before-fix screenshots will show missing/incorrect colors for:
- "Awaiting Response" stage column
- "Feedback Logged" stage column

---

## 11. Remediation Plan

### Phase 1: Fix the Bug (Immediate - 5 minutes)

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`

**Changes:**
```typescript
// Line 45:
- color: "var(--purple)",
+ color: "var(--tag-purple-bg)",

// Line 51:
- color: "var(--blue)",
+ color: "var(--tag-blue-bg)",
```

**Validation:**
1. Save file
2. Run `npm run build` (TypeScript check)
3. Run `npm run lint` (ESLint check)
4. Run `npm run validate:colors` (contrast check)
5. Visual test: View Kanban board, check stage headers render colors

### Phase 2: Implement Stage Color Underlines (Per Requirements)

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`

**Changes:**
1. Add import: `getOpportunityStageColor`
2. Update header with inline style for 2px border-bottom
3. Test in light and dark mode

**Depends On:** Phase 1 bug fix (otherwise two stages will have undefined colors)

### Phase 3: Add Missing Elevation Variables (If Needed)

**File:** `/home/krwhynot/Projects/atomic/src/index.css`

**Decision Required:** Either:
- Add the 5 elevation variables to `:root` and `.dark` blocks
- OR update requirements.md to use existing variables

**Engineering Constitution Impact:** Must maintain Rule #2 (SINGLE SOURCE OF TRUTH) and Rule #8 (COLORS)

---

## 12. Key Findings Summary

### Stage System
- **8 stages total** (6 active + 2 closed)
- **Centralized definition** in `stageConstants.ts` (single source of truth)
- **Environment configurable** via `OPPORTUNITY_PIPELINE_STAGES`
- **Type-safe** via `OpportunityStageValue` union type

### Color Mappings
- **6 valid stage colors** using semantic CSS variables
- **2 broken colors** (`var(--purple)`, `var(--blue)`) - undefined in index.css
- **Fix required:** Change to `var(--tag-purple-bg)` and `var(--tag-blue-bg)`
- **All tag colors have light/dark mode variants** with WCAG AA compliance

### Helper Functions
- **5 utility functions** for stage management
- **`getOpportunityStageColor()`** is key for Kanban enhancement
- **Currently NOT used** in `OpportunityColumn.tsx` (planned for implementation)
- **Bug impacts 2 of 8 stages** (awaiting_response, feedback_logged)

### Bug Severity
- **High priority** - blocks Kanban visual enhancement feature
- **Easy fix** - 2 line changes in `stageConstants.ts`
- **Zero breaking changes** - purely corrects undefined references
- **Constitution compliant** - fixes Rule #8 violation (semantic colors only)

---

## 13. Code Snippets for Implementation

### Bug Fix (stageConstants.ts)

```typescript
// FULL CORRECTED ARRAY (lines 23-72)
export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  {
    value: "new_lead",
    label: "New Lead",
    color: "var(--info-subtle)",
    description: "Initial prospect identification",
  },
  {
    value: "initial_outreach",
    label: "Initial Outreach",
    color: "var(--tag-teal-bg)",
    description: "First contact and follow-up",
  },
  {
    value: "sample_visit_offered",
    label: "Sample/Visit Offered",
    color: "var(--warning-subtle)",
    description: "Product sampling and visit scheduling",
  },
  {
    value: "awaiting_response",
    label: "Awaiting Response",
    color: "var(--tag-purple-bg)",  // ✅ FIXED (was var(--purple))
    description: "Following up after sample delivery",
  },
  {
    value: "feedback_logged",
    label: "Feedback Logged",
    color: "var(--tag-blue-bg)",  // ✅ FIXED (was var(--blue))
    description: "Recording customer feedback",
  },
  {
    value: "demo_scheduled",
    label: "Demo Scheduled",
    color: "var(--success-subtle)",
    description: "Planning product demonstrations",
  },
  {
    value: "closed_won",
    label: "Closed - Won",
    color: "var(--success-strong)",
    description: "Successful deal completion",
  },
  {
    value: "closed_lost",
    label: "Closed - Lost",
    color: "var(--error-subtle)",
    description: "Lost opportunity",
  },
];
```

### Stage Color Underline Implementation (OpportunityColumn.tsx)

```tsx
import type { Opportunity } from "../types";
import { OpportunityCard } from "./OpportunityCard";
import {
  getOpportunityStageLabel,
  getOpportunityStageColor  // ✅ ADD THIS IMPORT
} from "./stageConstants";

export const OpportunityColumn = ({
  stage,
  opportunities,
}: {
  stage: string;
  opportunities: Opportunity[];
}) => {
  return (
    <div className="flex-1 pb-8 min-w-[160px] max-w-[220px]">
      <div className="flex flex-col items-center">
        <h3
          className="px-3 py-2 text-sm font-semibold uppercase tracking-wide"
          style={{ borderBottom: `2px solid ${getOpportunityStageColor(stage)}` }}
        >
          {getOpportunityStageLabel(stage)}
        </h3>
      </div>
      <div className="flex flex-col rounded-2xl mt-2 gap-2">
        {opportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## 14. References

### Files Analyzed
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/opportunity.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/defaultConfiguration.ts`
- `/home/krwhynot/Projects/atomic/src/index.css`
- `/home/krwhynot/Projects/atomic/.env`

### Related Documentation
- `.docs/plans/kanban-depth-enhancement/requirements.md` (feature specification)
- `CLAUDE.md` (Engineering Constitution - Rules #2, #8)

### Commands for Validation
```bash
npm run build              # TypeScript compilation check
npm run lint               # ESLint + Prettier check
npm run validate:colors    # WCAG AA contrast validation
npm run dev                # Visual testing
```

---

**Document Version:** 1.0
**Author:** Claude Code (research analysis)
**Next Steps:** Fix bug in Phase 1, then proceed with Kanban enhancement implementation
