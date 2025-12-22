# Form UX Research Findings

> **Research conducted:** 2025-12-15
> **Sources reviewed:** 124 documents across 4 research agents
> **Scope:** Form progress tracking, validation, field grouping, accessibility, competitor analysis, gamification

---

## Executive Summary

### Top 5 Key Findings

1. **Progress bars with step numbers outperform percentages** — Users prefer "Step 2 of 5" over "40% complete" because percentages don't convey step duration. Nielsen Norman Group found progress bars increase user satisfaction and patience by 3x.

2. **REMOVE collapsed/accordion sections** — High confidence verdict. UK Government Digital Service discontinued accordion forms entirely. NN/g: "It is easier to scroll down the page than to decide which heading to click on." For desktop-first (1440px+) CRM with 4-12 fields, accordions solve a non-existent problem.

3. **"Reward early, punish late" validation pattern** — Validate immediately when users fix errors (reward), wait for blur when modifying valid fields (punish late). Debounce async validation at 700ms. Forms validating on each keystroke "punish the user as soon as they start entering data."

4. **5-7 fields per section optimal** — Miller's Law (7±2) has been refined to 4±1 in recent research. B2B lead capture: 3-5 fields. SaaS qualification: 5-7 fields. Beyond 10-15 fields triggers intimidation and 18% abandonment.

5. **200-300ms feedback timing** — Doherty Threshold establishes 400ms as maximum acceptable response time. Modern Google INP standard: ≤200ms. One-second delay reduces conversion by 20%.

---

## 1. Progress Indicators

### Bar vs Stepper vs Checklist

| Type | Best For | Completion Impact | CRM Recommendation |
|------|----------|-------------------|-------------------|
| **Progress Bar** | Linear workflows, single-page forms | +3x user patience (NN/G), reduces anxiety | ✅ Primary choice |
| **Stepper** | 3+ high-level steps spanning pages | Reinforces step-by-step progression | ✅ For complex creates |
| **Checklist** | Non-linear processes, any-order tasks | Flexible navigation, overview benefit | ❌ Not for linear CRM forms |

**Key Research:**
- Multi-step forms "almost always increase completion rates" (Growform)
- 81% of users abandon forms without progress indicators (B2B benchmark)
- Starting progress fast and ending slower reduces drop-off rates

**Recommendation:** Progress bars with step numbers (e.g., "Step 2 of 5") + section titles. Avoid percentages which create anxiety when progress appears slow.

### Percentage Display Research

- SurveyMonkey: "Visual scale alone—without page numbers or percent complete—is best"
- Progress bars more effective at bottom of page than top
- Pre-stamped progress (10-15% on first step) increases completion via Goal-Gradient Effect
- Showing step count preferred over percentages—users estimate duration from step count

---

## 2. Collapsed Sections Verdict

### **VERDICT: REMOVE** collapsed sections
### **Confidence: HIGH**

#### Research Against Accordions (Desktop)

| Source | Finding |
|--------|---------|
| **UK Government Digital Service** | Discontinued accordion forms entirely after user research showed "disconcerting" behavior |
| **Nielsen Norman Group** | "It is easier to scroll down the page than to decide which heading to click on" |
| **Baymard Institute** | 18% abandonment from forms perceived as too long; accordions create "uncertainty about which fields will be submitted" |
| **Eye-tracking studies** | Hidden information gets ignored despite descriptive headings |

#### When Accordions DO Work

- Mobile phone screens (severe space constraints)
- Forms with 20+ fields causing genuine intimidation
- Complex branching workflows with mutually exclusive sections
- Advanced/expert features novices shouldn't see

#### Why Accordions Don't Fit Crispy CRM

1. **Form length is NOT a problem**: 4-12 fields is well below intimidation threshold
2. **Desktop space is abundant**: 1440px+ width doesn't need space-saving
3. **Interaction cost hurts speed**: Every click adds friction to <30 sec data entry goal
4. **iPad screens are large enough**: 1620-2048px wide = small desktop
5. **Visibility trumps space**: Sales reps need all required data at a glance

### Alternative Approaches

1. **Single-column vertical layout** — Eye-tracking shows fastest completion
2. **Visual grouping with headers** — Section titles WITHOUT collapse functionality
3. **Conditional field display** — Only for genuinely optional fields (<50% usage)
4. **Multi-step forms** — For 8+ field creates, NOT quick activity logging

---

## 3. Field Grouping & Cognitive Load

### Miller's Law Application

- **Original (1956)**: 7 ± 2 items in working memory
- **Recent research**: 4 ± 1 items is optimal limit
- **Chunking strategy**: Group large forms into smaller, manageable sections

### Enterprise Form Recommendations

| Form Type | Optimal Fields | Sections |
|-----------|---------------|----------|
| B2B lead capture | 3-5 | 1-2 |
| SaaS qualification | 5-7 | 2-3 |
| High-commitment (trials) | 5-7 | 2-3 |
| Complex creates | 8-12 | 3-4 (multi-step) |

**Key Principle**: Chunking should ease information processing, not simply declutter design. Group by semantic similarity (Contact Info, Company Details, Opportunity Details).

---

## 4. Validation Timing

### "Reward Early, Punish Late" Pattern (Mihael Konjević)

| Scenario | Validation Timing | Rationale |
|----------|-------------------|-----------|
| User fixing error | **Immediate** (onChange) | Rapid feedback rewards correction |
| User modifying valid field | **onBlur** | Don't interrupt typing |
| Empty required field | **onSubmit only** | Don't flag before user starts |
| Async validation (API) | **700ms debounce** | Balance UX vs server load |

### When Real-Time (onChange) Is Appropriate

- Password strength meters
- Username availability checks
- Character count limits
- Severe format violations (non-numeric in number field)

**Anti-pattern**: Forms validating on each keystroke "punish the user as soon as they start entering data"

---

## 5. Multi-Step Wizard Patterns

### When to Use Multi-Step

| Condition | Single-Step | Multi-Step |
|-----------|-------------|------------|
| Field count | 1-7 | 8+ |
| Form complexity | Simple data entry | Logical progression |
| Time sensitivity | <30 sec target | 2+ minutes acceptable |
| User expertise | Trained users | Mixed/new users |

### Multi-Step Best Practices

- Break forms exceeding 8 fields into logical steps
- Display "Step 2 of 4" with progress bar
- Multi-step forms convert 86% higher than single-step
- "Next" buttons for progression, "Submit" on final step only
- Navigation buttons right-aligned (HubSpot pattern)

---

## 6. React Admin Capabilities

### Built-in Features

| Feature | Available | How to Use |
|---------|-----------|------------|
| Progress indicator | ❌ No native | Custom component with Material UI |
| Multi-step wizard | ✅ Enterprise only | `<WizardForm>` |
| Custom toolbar | ✅ Yes | `toolbar` prop on SimpleForm |
| Real-time validation | ✅ Yes | `mode="onBlur"` or `mode="onChange"` |

### Recommendation for Crispy CRM

**Use SimpleForm with custom progress component** (not Enterprise WizardForm)

**Rationale:**
- Pre-launch velocity > Enterprise licensing cost
- Full control over layout and validation
- Custom-built accessibility meeting exact WCAG requirements

### Custom Components Needed

1. **FormProgressBar** — ARIA-compliant progress indicator
2. **Custom Toolbar** — Previous/Next navigation buttons
3. **Section Wrapper** — Conditional section rendering with proper headings

---

## 7. Accessibility Requirements

### Progress Bar ARIA (WCAG 2.1)

```jsx
// Required attributes
<div
  role="progressbar"
  aria-valuenow={33}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Form completion progress"
  aria-valuetext="Step 1 of 3: Contact Information"
>
```

### Multi-Step Form ARIA

- `aria-current="true"` on current step indicator
- Explicit `<h2>`/`<h3>` headings for each step (labels insufficient)
- `aria-live="polite"` region to announce step changes
- Focus first input in new step on navigation

### Validation Messages

- `aria-invalid={hasError}` on input when validation fails
- `aria-describedby="error-id"` linking input to error message
- `role="alert"` on error message for screen reader announcement
- **Timing critical**: Set aria-invalid only AFTER validation, never before user input

### Focus Management

| Event | Focus Target |
|-------|--------------|
| Step change | First input in new section |
| Validation error | First invalid field OR error summary |
| Form completion | Confirmation message with `role="status"` |

---

## 8. Competitor Analysis

### Common Patterns Across Major CRMs

| Pattern | Salesforce | HubSpot | Crispy CRM |
|---------|------------|---------|------------|
| Single-column layout | ✅ Best practice | ✅ Mandatory | ✅ Adopt |
| Progress indicators | ✅ Via SLDS | ✅ Multi-step | ✅ Implement |
| Inline validation | ✅ Real-time | ✅ Recommended | ✅ Adopt |
| Required indicators | ✅ Form elements | ✅ Design system | ✅ Adopt |
| Vertical stacking | ✅ Component arch | ✅ Explicit req | ✅ Adopt |

### Key Insights

**Salesforce**: "Good design builds on habit" — Consistent patterns create "muscle memory." One organization reported users "came back to Sales Cloud to populate information" after implementing consistent templates.

**HubSpot**: Explicit guidance against horizontal field stacking: "most people are used to a vertical scroll and may not have wide enough screens."

### Patterns to Adopt

- Repeatable templates across all features
- Component-based reusable form architecture
- Single-column vertical stacking (never horizontal)
- One primary action button per surface
- Real-time inline validation with field-level success indicators

### Patterns to Avoid

- Horizontal field layouts
- Optional fields (increase cognitive load)
- Multiple primary buttons
- Validation errors only at submission
- More than 10 fields in single-step forms

---

## 9. Gamification Findings

### Effective B2B Patterns

| Pattern | Research Support | Application |
|---------|-----------------|-------------|
| Progress bar fill | Zeigarnik: 2x recall of incomplete tasks | "Form 65% complete" creates completion drive |
| Completion checkmarks | NN/G trigger-feedback pairs | Green check as fields validate |
| Section completion | Reduces abandonment | Mark sections complete before next step |
| Initial endowment | Loyalty card study | Start at 10-15% (not 0%) |
| Step counters | 15.65% completion increase | "Step 2 of 4" with visual indicator |

### Zeigarnik Effect Application

**Research**: Incomplete tasks create "task-specific tension" improving cognitive accessibility until finished. Users 2x more likely to remember interrupted tasks.

**How to Apply:**
1. Progress indicators are mandatory (visual incompleteness)
2. Front-load progress (10-15% credit upfront)
3. Break into logical sections (mini-completion moments)
4. Use incomplete circles/bars visually (triggers closure need)

**Critical Caveat**: Focus on ONE primary incomplete task at a time. "Having twenty things to finish is exhaustive."

### Micro-Interaction Timing

| Interaction | Timing | Purpose |
|-------------|--------|---------|
| Field checkmark | Immediate | Positive reinforcement |
| Error indicator | Real-time | Prevent rework |
| Section complete | 200-300ms | Celebrate milestone |
| Form submit confirmation | ~500ms | Reward completion |
| Button loading state | Immediate | Processing feedback |

### Patterns to AVOID (Gimmicky)

- Excessive celebration animations
- Audible feedback for every action
- Gamification scores/leaderboards
- Point systems for form fields
- Confetti or party effects
- Progress bars that lie

**B2B Rule**: If you wouldn't explain the gamification to a CFO, don't implement it.

---

## 10. UI/UX Laws Application Summary

| Law | Research Support | Crispy CRM Application |
|-----|-----------------|------------------------|
| **Goal-Gradient Effect** | Hull (1932): Effort increases approaching goal. Loyalty card study: pre-stamped progress completes faster. | Start progress at 10-15% on first step. Show proximity to completion prominently. |
| **Zeigarnik Effect** | Zeigarnik (1927): Incomplete tasks 2x more memorable. Creates cognitive tension until resolved. | Progress indicators mandatory. Visual incompleteness triggers closure need. |
| **Miller's Law** | Miller (1956): 7±2 items. Recent research: 4±1 optimal. | 5-7 fields per section. Semantic grouping (Contact Info, Company Details). |
| **Doherty Threshold** | Doherty & Thadani (1982): <400ms response time. Modern: 200ms (Google INP). | 200-300ms for field feedback. Loading states for >400ms operations. |

---

## Sources

### Form Design & Progress (50 sources from Agent 1)
See: `docs/research/agent-1-form-design.md`

Key sources:
- Nielsen Norman Group: Progress Indicators
- Smashing Magazine: Live Validation UX
- Laws of UX: Goal-Gradient, Miller's Law, Doherty Threshold
- Baymard Institute: Form field research

### Collapsed Sections (20 sources from Agent 2)
See: `docs/research/agent-2-collapsed-sections.md`

Key sources:
- UK Government Digital Service: "No More Accordions"
- Nielsen Norman Group: Accordions on Desktop/Mobile
- Baymard Institute: Accordion checkout usability
- Luke Wroblewski: Eye-tracking form research

### React Admin & Accessibility (22 sources from Agent 3)
See: `docs/research/agent-3-react-admin-a11y.md`

Key sources:
- React Admin official documentation
- MDN: ARIA progressbar role
- W3C: ARIA21 technique
- Smashing Magazine: Accessible form validation

### Competitor & Gamification (32 sources from Agent 4)
See: `docs/research/agent-4-competitor-gamification.md`

Key sources:
- Salesforce Lightning Design System
- HubSpot Developer Docs
- Nielsen Norman Group: Microinteractions
- LogRocket: Zeigarnik Effect in UX

---

**Document synthesized from 4 parallel research agents**
**Total unique sources: ~124**
**Research date: 2025-12-15**
