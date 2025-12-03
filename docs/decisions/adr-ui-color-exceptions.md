# ADR: UI Color Exceptions

**Status:** Accepted
**Date:** 2025-12-03
**Context:** UI & Styling Best Practices Audit

## Decision

The following files are **intentionally exempt** from the semantic color token requirement:

### 1. Email Templates

**Files:**
- `src/emails/daily-digest.generator.ts`
- `src/emails/daily-digest.types.ts`
- `supabase/functions/digest-opt-out/index.ts`

**Reason:** Email clients do not support CSS variables. Inline styles with literal hex values are required for email compatibility.

### 2. Color Types Mapping

**File:** `src/lib/color-types.ts`

**Reason:** This file maps legacy hex colors to semantic color names for data migration and backward compatibility with existing records.

### 3. Theme-Defined Variables (NOT Exceptions)

The following are **compliant** because they're defined in `src/index.css`:

| Class Pattern | Theme Definition |
|---------------|------------------|
| `brand-100` to `brand-800` | Lines 576-583 |
| `neutral-50` to `neutral-950` | Lines 563-573 |

Files using these (e.g., `text-brand-600`, `bg-neutral-800`) are following the design system correctly.

## Consequences

### Positive
- Email templates work across all email clients
- Legacy data migration is supported
- Clear documentation of what's allowed and why

### Negative
- Email template colors must be manually kept in sync with theme
- Developers must check this ADR when unsure about color usage

## Mitigation
- ESLint rule configured to ignore email template directories
- Color constants in `daily-digest.types.ts` are centralized (EMAIL_COLORS)
