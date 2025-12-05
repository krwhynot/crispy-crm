# Contextual Onboarding Design

**Date:** 2025-12-05
**Status:** Validated
**Author:** Brainstorming session with Claude

## Problem Statement

MFB Account Managers (6 users) are transitioning from Excel to Crispy CRM. Per the **Paradox of the Active User**, they will not read documentation but will start using the software immediately. Without contextual guidance, new users:

1. Don't know what "needs attention" on the dashboard
2. Don't understand the workflow (Contacts → Opportunities → Activities)
3. Get lost after completing forms ("What do I do next?")

**Goal:** 100% adoption within 30 days by providing in-context guidance that teaches while users work.

## Decision

**Hybrid Approach A+B: Attention Badges + AttentionCard + Post-Submit Toasts**

A lightweight, principle-compliant system that:
- Shows **activity staleness** per principal on dashboard (badges + card)
- Provides **workflow guidance** after form submissions (toasts with "next step")
- **Fades automatically** after user demonstrates understanding (5 submissions or opt-out)

## UX Principles Applied

| Principle | Application |
|-----------|-------------|
| **Paradox of Active User** | Guidance appears while doing tasks, not before |
| **Choice Overload** | AttentionCard shows max 3 principals, not all 9 |
| **Chunking** | Toasts show one next step, not full workflow |
| **Cognitive Load** | Smart contextual = minimal UI chrome when not needed |
| **Mental Model** | "What needs attention?" aligns with sales thinking |
| **Selective Attention** | Only stale principals highlighted; OK ones fade |

## Alternatives Considered

| Approach | Why Not Chosen |
|----------|----------------|
| **Onboarding Context (C)** | Over-engineered for MVP; requires DB schema change |
| **Empty State Only (D)** | Only helps when data is missing; no active guidance |
| **User-Triggered Help (?)** | Paradox of Active User - they won't click help icons |
| **Always Visible Hints** | Adds visual noise for expert users |

## Design Details

### Architecture Overview

```
DATA LAYER
└── unifiedDataProvider.ts
    └── getPrincipalsWithActivityStaleness()

UI LAYER
├── AttentionCard (new)
├── StalenessIndicator badge (new)
└── PrincipalPipelineTable (enhanced)

GUIDANCE LAYER
├── WorkflowToast.tsx (new)
└── useOnboardingProgress.ts (new)
```

### New Files

| File | Purpose |
|------|---------|
| `src/atomic-crm/onboarding/AttentionCard.tsx` | Dashboard widget showing top 3 stale principals |
| `src/atomic-crm/onboarding/AttentionCardItem.tsx` | Single principal row in card |
| `src/atomic-crm/onboarding/AttentionCardProgress.tsx` | "X of Y contacted" progress bar |
| `src/atomic-crm/onboarding/StalenessIndicator.tsx` | Badge showing days since activity |
| `src/atomic-crm/onboarding/WorkflowToast.tsx` | Post-submit guidance with opt-out |
| `src/atomic-crm/onboarding/useOnboardingProgress.ts` | localStorage tracking hook |
| `src/atomic-crm/onboarding/useAttentionCardState.ts` | Collapsed/expanded state logic |
| `src/atomic-crm/onboarding/constants.ts` | Thresholds and limits |

### Data Model

**Staleness Calculation (in unifiedDataProvider):**
```sql
SELECT
  p.id, p.name,
  COALESCE(EXTRACT(DAY FROM NOW() - MAX(a.created_at)), 999) as days_since_last_activity
FROM principals p
LEFT JOIN opportunities o ON o.principal_id = p.id
LEFT JOIN activities a ON a.opportunity_id = o.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name
```

**Staleness Thresholds:**
- OK: < 5 days (no indicator)
- Warning: 5-9 days (yellow badge)
- Critical: 10+ days (red badge)

**localStorage Schema:**
```typescript
interface OnboardingProgress {
  opportunity_create_count: number;
  activity_create_count: number;
  contact_create_count: number;
  task_create_count: number;
  attention_card_dismissed: boolean;
  attention_card_dismissed_principals: string[];
  workflow_hints_disabled: boolean;
  last_updated: string;
}
```

### Component Behavior

**AttentionCard:**
- Shows top 3 stale principals sorted by urgency
- Dismissible → collapses to "X principals need attention"
- Re-expands if NEW principal becomes stale
- Hidden entirely when all principals OK

**WorkflowToast:**
- Appears after successful create/edit
- Shows entity-specific "next step" action
- Checkbox: "Don't show workflow tips" → permanent opt-out
- Auto-fades after 5 submissions per entity type
- Auto-dismisses after 8 seconds

**StalenessIndicator:**
- Returns null for < 5 days
- Yellow badge for 5-9 days
- Red badge for 10+ days

### Error Handling

| Component | Error Type | Handling |
|-----------|------------|----------|
| Data fetch | Query failure | **Throw** → ErrorBoundary |
| localStorage | Read/write failure | **Log + safe default** (show all hints) |
| Toast | Render failure | **Log + continue** (entity saved) |
| AttentionCard | Empty/invalid data | **Graceful render** (hide or celebrate) |

## Engineering Principles Applied

- [x] **Fail-fast** - No retry logic; query errors throw to ErrorBoundary
- [x] **Single source of truth** - Staleness computed in unifiedDataProvider only
- [x] **Zod at API boundary only** - Onboarding is UI-only, no validation changes
- [x] **interface for objects** - `PrincipalWithStaleness`, `OnboardingProgress`
- [x] **Form mode onSubmit** - No form changes, toasts trigger in onSuccess callback

## Testing Strategy

**Unit Tests (Vitest):**
- `useOnboardingProgress` - count limits, opt-out, localStorage fallback
- `AttentionCard` - filtering, limiting, dismiss state
- `StalenessIndicator` - threshold logic

**E2E Tests (Playwright):**
- Workflow toast appears after opportunity creation
- Toast stops after 5 submissions
- Opt-out checkbox disables all hints
- AttentionCard shows stale principals
- Dismiss collapses card
- Quick action navigates with principal prefilled

**POMs:**
- `OnboardingPOM` - AttentionCard, toast, checkbox selectors
- Semantic selectors only (`getByRole`, `getByText`)

## Visual Mockups

### Dashboard with AttentionCard
```
┌─────────────────────────────────────────────────────────────────┐
│ [KPI Row]                                                       │
├─────────────────────────────────────────────────────────────────┤
│ NEEDS ATTENTION THIS WEEK                              [×]      │
│ 🔴 Acme Foods     12 days    [Log Activity →]                   │
│ 🟡 Best Bites      6 days    [Log Activity →]                   │
│ 🟡 Chef's Choice   5 days    [Log Activity →]                   │
│ ──────────────────────────────────────────────────────────────  │
│ ✅ 6 of 9 principals contacted  ████████░░░░ 67%                │
└─────────────────────────────────────────────────────────────────┘
│ [Pipeline Table with staleness badges per row]                  │
```

### Post-Submit Toast
```
┌────────────────────────────────────────────────┐
│ ✅ Opportunity created for Acme Foods          │
│ 📋 Next step: Log your first activity          │
│ [Log Activity →]              [Dismiss]        │
│ ☐ Don't show workflow tips                     │
└────────────────────────────────────────────────┘
```

## Open Questions

1. **Staleness threshold tuning** - Are 5/10 days the right thresholds for MFB's workflow? May need adjustment after user feedback.

2. **Cross-device sync** - localStorage means progress resets on new device. Acceptable for MVP, but may want to persist to user profile later.

3. **AttentionCard position** - Above tabs or within Pipeline tab? Current design: above tabs for maximum visibility.

## Implementation Estimate

| Component | Complexity |
|-----------|------------|
| Data provider staleness query | Low |
| StalenessIndicator badge | Low |
| AttentionCard + subcomponents | Medium |
| WorkflowToast with opt-out | Medium |
| useOnboardingProgress hook | Low |
| PipelineTable integration | Low |
| Unit tests | Medium |
| E2E tests | Medium |

**Suggested implementation order:**
1. Data layer (staleness query)
2. StalenessIndicator badge
3. PipelineTable integration
4. useOnboardingProgress hook
5. WorkflowToast
6. AttentionCard
7. Tests
