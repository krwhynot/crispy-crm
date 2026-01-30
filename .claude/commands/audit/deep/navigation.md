---
description: Deep dive into routes, modals, slide-overs, and accessibility navigation issues
argument-hint: [--from-scan <json-path>]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(jq:*), Write
model: sonnet
---

# Navigation Deep Dive

You are performing a **deep dive into navigation issues** for Crispy CRM. This command analyzes route configuration, modal/slide-over accessibility, touch targets, and focus management.

**Scope:** NAV-B001 through NAV-B008 from checks.json

---

## Phase 1: Load Context

### 1.1 Load Quick Scan Results (if available)

```
If $ARGUMENTS contains "--from-scan":
  Read JSON and extract NAV findings
Else:
  Run NAV checks from checks.json fresh
```

### 1.2 Load Inventories

Read inventory files:
1. `.claude/state/component-inventory/*.json` — layout and modal components

Build lookup:
```
MODALS = { name → { file, has_title, has_close, has_focus_trap } }
SLIDEOVERS = { name → { file, width, has_title, has_close } }
ROUTES = { path → { file, has_error_element } }
```

---

## Phase 2: Component-Level Analysis

### 2.1 Modal Accessibility Audit

For each Dialog, AlertDialog, Sheet, and Drawer component:
1. **Read the actual file**
2. Check: Is `<DialogTitle>` present? (Radix requirement)
3. Check: If no visible title desired, is `sr-only` class applied?
4. Check: Is there a close mechanism (X button, Escape key, backdrop click)?
5. Check: Does Radix handle focus trapping automatically? (Check Dialog usage)

### 2.2 Slide-Over Standards

For each SlideOver component:
1. Check: Is width set to `w-[40vw]` per design system?
2. Check: Does it have a title for screen readers?
3. Check: Is scroll behavior correct (body scroll locked)?
4. Check: Does close trigger return focus to trigger element?

### 2.3 Route Configuration

Scan for route definitions:
1. Find all `<Route>` and `<Resource>` declarations
2. Check: Does each have error handling (errorElement/ErrorBoundary)?
3. Check: Are there hardcoded route paths in `navigate()` calls?
4. Check: Do broken routes show a user-friendly error page?

### 2.4 Touch Target Audit

Scan for interactive elements with small sizing:
1. Find buttons, links, and icon buttons
2. Check: Are touch targets at least 44px (Tailwind `h-11 w-11`)?
3. Check: Do icon-only buttons have `aria-label`?
4. Focus on iPad-first — the primary device for this CRM

### 2.5 Focus Management

Check keyboard navigation:
1. Are modals trapping focus correctly?
2. Does closing a modal return focus to the trigger?
3. Are skip links available for main navigation?
4. Do slide-over panels manage focus on open/close?

---

## Phase 3: Confidence Enrichment

For each NAV finding from quick scan:
```
CONFIRM if component analysis validates the issue
DISMISS if Radix handles the concern automatically
ADD NEW issues (missing sr-only titles, small touch targets)
```

Write enriched JSON to `.claude/commands/audit/reports/deep-navigation-{DATE}.json`.

---

## Phase 4: Console Summary

```
═══════════════════════════════════════════════
  NAVIGATION DEEP DIVE — {DATE}
  Modals: {count} | SlideOvers: {count} | Routes: {count}
═══════════════════════════════════════════════

  Modal Accessibility:
    ✅ With title:   {count}
    🔴 No title:     {count} (Radix warning)
    ✅ With close:   {count}
    🔴 No close:     {count}

  Touch Targets (iPad-first):
    ✅ >= 44px:  {count} interactive elements
    🔴 < 44px:   {count} elements

  Routes:
    ✅ With error handling: {count}
    🔴 Without:            {count}

  📁 Report: .claude/commands/audit/reports/deep-navigation-{DATE}.json
═══════════════════════════════════════════════
```
