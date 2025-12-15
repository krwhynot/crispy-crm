# Form UX Enhancement — Design Specification

> **Based on research:** `docs/architecture/form-ux-research-findings.md`
> **Created:** 2025-12-15
> **Scope:** All 5 target forms (Organizations, Contacts, Opportunities, Activities, Tasks)

---

## 1. Overview

### Problem Statement

Users feel lost when using Crispy CRM create forms:
- Too many fields without required/optional distinction
- No contextual help explaining field purpose
- No progress indication during form completion
- Validation feedback only appears at submission
- Unclear next steps after filling each field
- Collapsed sections hiding important fields

### Solution Summary

A form progress tracking system leveraging proven UX psychology:
- **Progress bar** with step numbers (not percentages)
- **Inline validation** with "reward early, punish late" pattern
- **Visual grouping** with headers (NOT collapsed accordions)
- **Multi-step wizard** for complex creates (Opportunities)
- **Field-level feedback** with success checkmarks

### Scope

| Form | Pattern | Field Count | Priority |
|------|---------|-------------|----------|
| Activities | Enhancement | ~4 | High (speed critical) |
| Tasks | Enhancement | ~5 | High (speed critical) |
| Contacts | Enhancement | ~8 | High |
| Organizations | Enhancement | ~8 | High |
| Opportunities | Multi-step Wizard | ~12 | High (complexity) |

---

## 2. UI/UX Laws Driving Design

| Law | Research Citation | Design Application |
|-----|-------------------|-------------------|
| **Goal-Gradient Effect** | Hull (1932), Loyalty card study | Progress bar starts at 10-15%, not 0%. Visual proximity to completion increases motivation. |
| **Zeigarnik Effect** | Zeigarnik (1927): 2x recall of incomplete tasks | Progress indicators mandatory. Incomplete visual state creates completion drive. |
| **Miller's Law** | Miller (1956): 7±2 items; Recent: 4±1 optimal | 5-7 fields per section maximum. Semantic grouping by category. |
| **Doherty Threshold** | Doherty & Thadani (1982): <400ms | 200-300ms for field validation feedback. Loading states for async operations. |

---

## 3. Component Architecture

```
FormProgressProvider (React Context)
├── FormProgressBar
│   └── ProgressSegment (per section)
├── FormSection
│   ├── SectionHeader
│   └── FormFieldWrapper (per field)
│       ├── Label + RequiredIndicator
│       ├── Input
│       ├── HelpTooltip (optional)
│       ├── ValidationFeedback
│       └── CompletionCheckmark
└── FormWizard (Opportunities only)
    ├── WizardStepIndicator
    ├── WizardStep
    └── WizardNavigation
```

---

## 4. Component Specifications

### 4.1 FormProgressProvider

**Purpose:** Centralized state management for form completion tracking.

**State Shape:**
```typescript
interface FormProgressState {
  totalFields: number;
  completedFields: number;
  sections: SectionProgress[];
  currentSection: number;
  validationErrors: Record<string, string>;
}

interface SectionProgress {
  id: string;
  name: string;
  fields: string[];
  completedFields: string[];
  isComplete: boolean;
}
```

**API Methods:**
- `markFieldComplete(fieldName: string): void`
- `markFieldIncomplete(fieldName: string): void`
- `setValidationError(fieldName: string, error: string): void`
- `clearValidationError(fieldName: string): void`
- `goToSection(sectionIndex: number): void`
- `getCompletionPercentage(): number`

### 4.2 FormProgressBar

**Visual Design:**
```
┌────────────────────────────────────────────────────────────┐
│  Step 2 of 4: Company Details                              │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  50%  │
└────────────────────────────────────────────────────────────┘
```

**Specifications:**
| Property | Value | Rationale |
|----------|-------|-----------|
| Height | 8px (progress track) | Touch-friendly, visible |
| Border radius | 4px | Soft edges, matches design system |
| Empty color | `bg-muted` | Semantic token |
| Fill color | `bg-primary` | Semantic token |
| Complete color | `bg-success` (or `bg-primary`) | Visual completion indicator |
| Animation | 200ms ease-out | Doherty Threshold compliant |
| Initial value | 10-15% | Goal-Gradient Effect |

**Accessibility (ARIA):**
```jsx
<div
  role="progressbar"
  aria-valuenow={completionPercentage}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Form completion progress"
  aria-valuetext={`Step ${currentStep} of ${totalSteps}: ${sectionName}`}
>
```

### 4.3 FormSection

**Visual Design:**
```
┌────────────────────────────────────────────────────────────┐
│  ✓ Contact Information                           Complete  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  First Name *                                              │
│  ┌──────────────────────────────────────────┐  ✓          │
│  │ John                                      │              │
│  └──────────────────────────────────────────┘              │
│                                                            │
│  Last Name *                                               │
│  ┌──────────────────────────────────────────┐  ✓          │
│  │ Smith                                     │              │
│  └──────────────────────────────────────────┘              │
│                                                            │
│  Email                                                     │
│  ┌──────────────────────────────────────────┐  ○          │
│  │                                           │  (optional) │
│  └──────────────────────────────────────────┘              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Specifications:**
| Property | Value | Rationale |
|----------|-------|-----------|
| Layout | Single-column vertical | Eye-tracking research: fastest completion |
| Max fields | 5-7 per section | Miller's Law |
| Header style | `text-lg font-semibold text-foreground` | Clear visual hierarchy |
| Spacing | `space-y-4` between fields | Breathing room |
| Section indicator | Checkmark + "Complete" when all required fields valid | Goal-Gradient feedback |

**Collapsed Sections:** ❌ **REMOVED** per research findings

### 4.4 FormFieldWrapper

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  Organization Name *                               ⓘ Help  │
│  ┌──────────────────────────────────────────┐              │
│  │ Acme Corporation                          │  ✓          │
│  └──────────────────────────────────────────┘              │
│  ✓ Looks good!                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Email Address *                                   ⓘ Help  │
│  ┌──────────────────────────────────────────┐              │
│  │ invalid-email                             │  ✗          │
│  └──────────────────────────────────────────┘              │
│  ✗ Please enter a valid email address                      │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**

| Element | Required Style | Optional Style |
|---------|---------------|----------------|
| Label | `font-medium text-foreground` | `font-medium text-muted-foreground` |
| Required indicator | `*` in `text-destructive` | "(optional)" in `text-muted-foreground` |
| Input border (default) | `border-input` | Same |
| Input border (focus) | `ring-2 ring-ring` | Same |
| Input border (error) | `border-destructive` | Same |
| Input border (valid) | `border-primary` or `border-input` | Same |

**Completion Checkmark:**
| State | Icon | Color | Timing |
|-------|------|-------|--------|
| Empty | None | — | — |
| Valid | ✓ checkmark | `text-success` (green) | 100ms after validation |
| Invalid | ✗ or ⚠ | `text-destructive` | Immediate on blur |
| Loading | Spinner | `text-muted-foreground` | During async validation |

**Help Tooltip:**
- Trigger: Hover or focus on ⓘ icon
- Delay: 200ms (Doherty compliant)
- Position: Right or above field
- Content: 1-2 sentences explaining field purpose

### 4.5 FormWizard (Opportunities Only)

**Visual Design:**
```
┌────────────────────────────────────────────────────────────┐
│  Create Opportunity                                        │
│                                                            │
│  ● Basic Info  ─────  ○ Principal  ─────  ○ Details  ───  ○ Notes │
│                                                            │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  25%  │
└────────────────────────────────────────────────────────────┘
│                                                            │
│  Step 1 of 4: Basic Information                            │
│                                                            │
│  Opportunity Name *                                        │
│  ┌──────────────────────────────────────────┐              │
│  │                                           │              │
│  └──────────────────────────────────────────┘              │
│                                                            │
│  ... more fields ...                                       │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                          [Cancel]  [Next →]│
└────────────────────────────────────────────────────────────┘
```

**Step Structure for Opportunities:**

| Step | Name | Fields | Required |
|------|------|--------|----------|
| 1 | Basic Information | Name, Stage, Expected Close | 2 |
| 2 | Principal | Principal (lookup), Products | 1 |
| 3 | Details | Value, Probability, Distributor | 0 |
| 4 | Notes | Description, Next Steps | 0 |

**Navigation Behavior:**
- **Next**: Validate current step → Focus first field in next step
- **Back**: No validation → Return to previous step
- **Submit**: Only on final step → Full form validation
- **Button alignment**: Right-aligned (HubSpot pattern)

**Step Indicator ARIA:**
```jsx
<ol aria-label="Progress steps">
  <li aria-current={step === 1 ? "step" : undefined}>
    <span className={step > 1 ? "sr-only" : ""}>
      {step > 1 && "completed"}
    </span>
    Basic Info
  </li>
  // ... more steps
</ol>
```

---

## 5. Form-Specific Configurations

### Activities (Enhancement Pattern)

| Setting | Value |
|---------|-------|
| Pattern | Single-step with progress bar |
| Sections | 2 (Type Selection, Details) |
| Required fields | Activity Type, Related Contact/Org |
| Progress bar | Yes (simple) |
| Validation timing | onBlur |
| Target completion | <30 seconds |

**Section Layout:**
1. **What** — Activity Type, Date, Duration
2. **Who/What** — Related Contact, Organization, Opportunity

### Tasks (Enhancement Pattern)

| Setting | Value |
|---------|-------|
| Pattern | Single-step with progress bar |
| Sections | 3 (What, When, Who) |
| Required fields | Title, Due Date |
| Progress bar | Yes (simple) |
| Validation timing | onBlur |
| Target completion | <30 seconds |

**Section Layout:**
1. **What** — Title, Description
2. **When** — Due Date, Reminder
3. **Who** — Assigned To, Related Record

### Contacts (Enhancement Pattern)

| Setting | Value |
|---------|-------|
| Pattern | Single-step with progress bar |
| Sections | 4 (Name, Contact Info, Organization, Notes) |
| Required fields | First Name, Last Name |
| Progress bar | Yes (section-based) |
| Validation timing | onBlur, 700ms debounce for email |

**Section Layout:**
1. **Name** — First Name*, Last Name*, Title
2. **Contact Info** — Email, Phone, Mobile
3. **Organization** — Organization (lookup), Role
4. **Additional** — Notes, Tags

### Organizations (Enhancement Pattern)

| Setting | Value |
|---------|-------|
| Pattern | Single-step with progress bar |
| Sections | 4 (Basic, Type, Location, Notes) |
| Required fields | Name, Type |
| Progress bar | Yes (section-based) |
| Validation timing | onBlur |

**Section Layout:**
1. **Basic** — Name*, Website, Phone
2. **Type** — Organization Type* (Principal/Distributor/Operator), Industry
3. **Location** — Address, City, State, Territory
4. **Additional** — Notes, Tags

### Opportunities (Wizard Pattern)

| Setting | Value |
|---------|-------|
| Pattern | Multi-step wizard (4 steps) |
| Total fields | ~12 |
| Required fields | Name, Principal, Stage, Expected Close |
| Progress bar | Yes (step-based) |
| Validation timing | Per-step on Next click |
| Target completion | 2-3 minutes |

**Step Configuration:** See Section 4.5 above

---

## 6. Visual Design Tokens

**Use Tailwind v4 semantic colors ONLY:**

```css
/* Form Progress System Tokens */
--form-progress-track: var(--muted);           /* bg-muted */
--form-progress-fill: var(--primary);          /* bg-primary */
--form-progress-complete: var(--primary);      /* or var(--success) if defined */

--form-field-valid: var(--primary);            /* text-primary for checkmarks */
--form-field-invalid: var(--destructive);      /* text-destructive */
--form-field-optional: var(--muted-foreground); /* text-muted-foreground */

--form-section-header: var(--foreground);      /* text-foreground */
--form-help-text: var(--muted-foreground);     /* text-muted-foreground */

/* Animation Timing */
--form-transition-fast: 100ms;                 /* Field checkmarks */
--form-transition-normal: 200ms;               /* Progress bar, section complete */
--form-transition-slow: 300ms;                 /* Step transitions */
```

**Touch Targets:**
- All interactive elements: minimum `h-11 w-11` (44x44px)
- Checkmarks/icons: `h-5 w-5` within larger touch target
- Help tooltips: trigger area `h-11 w-11`

---

## 7. Interaction Patterns

### Field Completion Flow

```
User focuses field
        │
        ▼
User types/selects value
        │
        ▼
User leaves field (blur)
        │
        ▼
    ┌───────────────────┐
    │  Validate field   │──────────────────────────┐
    └───────────────────┘                          │
        │                                          │
        ▼                                          ▼
    ┌───────────────────┐                  ┌───────────────────┐
    │  Field VALID      │                  │  Field INVALID    │
    └───────────────────┘                  └───────────────────┘
        │                                          │
        ▼ (100ms)                                  ▼ (immediate)
    ┌───────────────────┐                  ┌───────────────────┐
    │  Show ✓ checkmark │                  │  Show error msg   │
    │  Update progress  │                  │  Set aria-invalid │
    └───────────────────┘                  └───────────────────┘
```

### Section Completion Flow

```
All required fields in section valid
        │
        ▼ (200ms)
┌───────────────────────────────────────┐
│  Section header shows ✓ "Complete"    │
│  Progress bar advances                │
│  aria-live announces "Section X done" │
└───────────────────────────────────────┘
```

### Wizard Navigation Flow

```
User clicks "Next"
        │
        ▼
┌───────────────────────────────────────┐
│  Validate all fields in current step  │
└───────────────────────────────────────┘
        │
    ┌───┴───┐
    ▼       ▼
  Valid   Invalid
    │       │
    │       ▼
    │   Focus first invalid field
    │   Show error messages
    │   aria-live: "X errors found"
    │
    ▼
┌───────────────────────────────────────┐
│  Transition to next step (300ms)      │
│  Update step indicator                │
│  Focus first field in new step        │
│  aria-live: "Step X of Y: [name]"     │
└───────────────────────────────────────┘
```

---

## 8. Accessibility Checklist

### Progress Bar
- [ ] `role="progressbar"` present
- [ ] `aria-valuenow` updates with completion %
- [ ] `aria-valuemin="0"` and `aria-valuemax="100"` present
- [ ] `aria-label` provides context
- [ ] `aria-valuetext` announces step info (not just percentage)

### Form Fields
- [ ] `aria-invalid={!!error}` set on validation failure
- [ ] `aria-describedby` links to error message
- [ ] Error messages have `role="alert"`
- [ ] Required fields indicated via `aria-required="true"`
- [ ] Labels properly associated via `htmlFor`/`id`

### Multi-Step Wizard
- [ ] `aria-current="step"` on current step indicator
- [ ] Each step has explicit heading (`<h2>` or `<h3>`)
- [ ] Step changes announced via `aria-live="polite"`
- [ ] Focus moves to first field on step change
- [ ] Completed steps indicated (visually + screen reader)

### Focus Management
- [ ] Tab order follows visual order
- [ ] Focus visible on all interactive elements
- [ ] Focus trapped within modal forms
- [ ] Focus moves appropriately on validation errors

---

## 9. Implementation Priority

### Phase 1: Core Infrastructure (Week 1)
1. `FormProgressProvider` context
2. `FormProgressBar` component
3. `FormFieldWrapper` with checkmarks
4. Integration with existing forms (Activities, Tasks)

### Phase 2: Section Enhancement (Week 2)
1. `FormSection` component with headers
2. Remove existing collapsed sections
3. Apply to Contacts, Organizations forms
4. Section-level completion indicators

### Phase 3: Wizard Implementation (Week 3)
1. `FormWizard` component
2. `WizardStep` and `WizardNavigation`
3. Apply to Opportunities form
4. Step-level validation

### Phase 4: Polish & Testing (Week 4)
1. Animation refinement
2. Accessibility audit
3. iPad testing
4. User feedback collection

---

## 10. Open Questions

| Question | Options | Decision Deferred To |
|----------|---------|---------------------|
| Show percentage or step count? | Step count recommended per research | Implementation review |
| Success color token | `text-primary` vs new `text-success` | Design system update |
| Help tooltip trigger | Hover only vs hover + focus | Accessibility testing |
| Wizard: allow step skip? | Strict linear vs allow skip to incomplete | User testing |
| Activity form: add progress? | Yes (simple) vs No (speed priority) | User feedback |

---

**Specification based on:**
- `docs/architecture/form-ux-research-findings.md`
- `docs/research/agent-1-form-design.md`
- `docs/research/agent-2-collapsed-sections.md`
- `docs/research/agent-3-react-admin-a11y.md`
- `docs/research/agent-4-competitor-gamification.md`
