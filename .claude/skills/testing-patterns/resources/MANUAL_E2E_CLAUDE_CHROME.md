# Manual E2E Testing with Claude Chrome

## Purpose

Guide for writing effective prompts for manual E2E testing using Claude Chrome browser automation.

**Architecture Note:** Claude Code runs in WSL2 and cannot directly control browsers. These prompts are:
1. **Written/generated** by Claude Code as markdown documentation
2. **Copied by the user** into Claude Chrome (browser extension)
3. **Executed** by Claude Chrome which has browser access

Unlike Playwright automated tests, manual tests provide:
- **Visual verification** - Screenshots and real-time observation
- **Adaptive testing** - Claude Chrome can respond to unexpected states
- **Production-safe options** - Read-only mode for live environments
- **Human-in-the-loop** - User initiates each test session

## When to Use

| Use Manual E2E (Claude Chrome) | Use Playwright |
|--------------------------------|----------------|
| Visual/UI verification | Regression testing in CI/CD |
| Production smoke tests (read-only) | Automated assertions |
| Exploratory testing | Repeatable test suites |
| Complex workflows needing judgment | Simple CRUD operations |
| One-off verification after changes | Cross-browser testing |

## Prompt Template

```markdown
# [Feature/Area] Manual E2E Test

> **Test ID:** [Unique identifier like SMOKE-001, WG-001, CRUD-OPP-001]
> **Priority:** [Critical/High/Medium]
> **Environment:** Local | Production (read-only)

## Prerequisites

- [ ] Dev server running (`just dev`)
- [ ] Database seeded (`just seed-e2e`)
- [ ] Logged in as: `admin@test.com`
- [ ] DevTools Console open (F12)

## Test Context

[1-2 sentences explaining what this tests and why it matters]

---

## Steps

### Step 1: [Description]

1. Navigate to `http://localhost:5173/#/[route]`
2. [Specific action with exact labels/buttons]
3. **VERIFY:** [Expected outcome]
   - [Specific check 1]
   - [Specific check 2]

### Step 2: [Description]

1. [Action]
2. **VERIFY:** [Expected outcome]

---

## Console Monitoring

Watch for during entire test:
- **RLS errors:** "permission denied", "42501"
- **React errors:** "Uncaught", "Error boundary"
- **Network errors:** 500, 403, 401 status codes

---

## On Failure

If any step fails:
1. Screenshot the current state
2. Copy console errors (red text)
3. Note the current URL
4. Report in this format:

```
[TEST-ID]: FAIL
Step: [number]
Expected: [what should happen]
Actual: [what happened]
Console: [errors if any]
Screenshot: [description]
```

---

## Pass Criteria

All steps must complete with no console errors for PASS.

---

## Report Format

After testing, report results:

```
[TEST-ID]: PASS/FAIL - [optional notes]
```
```

## Best Practices

### 1. Be Explicit with Selectors

Claude Chrome interacts with the browser visually. Be specific:

| Bad | Good |
|-----|------|
| "Click the button" | "Click the 'Save & Close' button" |
| "Go to contacts" | "Navigate to `http://localhost:5173/#/contacts`" |
| "Fill in the form" | "Fill First Name field with 'John'" |
| "Select an option" | "Click the 'Type' dropdown, select 'Principal'" |

### 2. Include VERIFY Checkpoints

Every significant action should have an explicit verification:

```markdown
3. Fill email field with "test@example.com"
4. **VERIFY:** Email field shows "test@example.com"

5. Click "Save" button
6. **VERIFY:** Success notification appears with text "Contact saved"
```

### 3. Console Monitoring Instructions

Always include console monitoring. Categorize errors:

```markdown
## Console Monitoring

Keep DevTools Console open (F12) throughout testing.

**Watch for these error patterns:**

| Error Type | Patterns | Meaning |
|------------|----------|---------|
| **RLS** | "permission denied", "42501", "row-level security" | Database access blocked |
| **React** | "Uncaught", "Error boundary", "Cannot read property" | Frontend crash |
| **Network** | 500, 403, 401, "Failed to fetch" | API/auth issues |
| **Validation** | "Zod", "validation failed", "required" | Schema rejection |

**Safe to ignore:**
- `ResizeObserver loop` (browser quirk)
- Warnings (yellow) unless specifically testing for them
```

### 4. Structured Reporting with Test IDs

Use consistent test IDs for traceability:

```markdown
## Report Results

```
WG-001 (Sample follow-up): PASS - Validation triggered as expected
WG-002 (Win/loss reason): PASS - Modal requires reason before save
SS-001 (Cache invalidation): FAIL - Title didn't update until refresh
Dashboard: PASS - No console errors
```
```

**Test ID Conventions:**
- `SMOKE-###` - Basic functionality checks
- `WG-###` - Workflow Gap tests
- `SS-###` - Stale State tests
- `CRUD-[ENTITY]-###` - Entity CRUD tests
- `A11Y-###` - Accessibility tests
- `PERF-###` - Performance tests

### 5. Copy-Paste Friendly Design

Since users must copy prompts from docs to Claude Chrome:

- **Self-contained** - Include all context in the prompt (no "see other file")
- **Markdown works** - Claude Chrome renders markdown, so use headers/lists
- **Quick Version section** - Provide shorter version for time-limited testing
- **Clear delimiters** - Use `---` to separate prompt from surrounding docs
- **No WSL paths** - Use `localhost:5173` not `/mnt/c/...` paths
- **Include credentials** - Don't assume Claude Chrome knows the login

### 6. Include Report Template

End every prompt with a copy-paste result format:

```markdown
---

## Report Results

After testing, report results in this format:

```
TEST-001: PASS/FAIL - [notes]
TEST-002: PASS/FAIL - [notes]
```
```

### 7. Provide Quick Version

For time-limited testing, include a condensed version:

```markdown
---

## Quick Version (if time is limited):

Test just these critical validations:

1. **Sample follow-up**: Create activity with type="sample", status="sent", follow_up=false
   - Should fail validation

2. **Win/loss reason**: Drag opportunity to Closed Won without reason
   - Should require win_reason before save
```

## Anti-Patterns

| Anti-Pattern | Why Bad | Fix |
|--------------|---------|-----|
| Vague selectors | Claude may click wrong element | Use exact button text, labels |
| No VERIFY points | Silent failures go unnoticed | Add VERIFY: after each action |
| Giant 50+ step prompts | Cognitive overload, lost context | Split into 5-10 step focused tests |
| No prerequisites | Test fails from setup issues | List dev server, seed, login needs |
| Missing on-failure | Unclear how to debug | Add failure reporting template |
| External references | "See SETUP.md for credentials" | Include all info in prompt |
| Modal dialog triggers | `alert()` blocks Claude Chrome | Avoid or warn about blocking dialogs |
| WSL paths | `/mnt/c/...` won't work in browser | Use `localhost:5173` |

## Environment Setup

### Local Environment (Full Testing)

```markdown
## Environment
- **Target URL:** http://localhost:5173
- **Mode:** Full testing (create, update, delete allowed)
- **Prerequisites:**
  - Dev server: `just dev`
  - Database seeded: `just seed-e2e`
  - Credentials: admin@test.com / password123
```

### Production Environment (Read-Only)

```markdown
## Environment
- **Target URL:** https://crm.kjrcloud.com
- **Mode:** Read-only (NO creates, updates, deletes!)
- **Prerequisites:**
  - Production credentials
  - Skip tests marked [DESTRUCTIVE]
```

**Production Safety Rules:**
- **DO:** Run smoke tests, verify UI rendering, check navigation
- **DO:** Test read-only workflows (viewing, filtering, searching)
- **DO NOT:** Create, update, or delete any records
- **DO NOT:** Run seed scripts
- **DO NOT:** Test bulk operations, archive, delete

## Example Prompts

### Example 1: Validation Test (from existing docs)

```markdown
# Sample Follow-up Validation Test (WG-001)

> **Test ID:** WG-001
> **Priority:** Critical
> **Environment:** Local

## Prerequisites

- [ ] Dev server running (`just dev`)
- [ ] Logged in as admin@test.com
- [ ] DevTools Console open (F12)

## Test Context

Verifies that sample activities require follow-up scheduling per business rules.

---

## Steps

### Step 1: Navigate to Activity Create

1. Go to http://localhost:5173/#/activities/create
2. **VERIFY:** Form loads with "New Activity" header

### Step 2: Fill Required Fields

1. Fill Subject = "Test Sample Activity"
2. Set Activity Date = today
3. Select any Contact from dropdown
4. **VERIFY:** Fields populated correctly

### Step 3: Configure Sample Without Follow-up (Should Fail)

1. Set Type = "sample"
2. Set Sample Status = "sent"
3. Set Follow-up Required = unchecked (false)
4. Click "Save" button
5. **VERIFY:** Error message appears: "Sample activities require follow-up"
6. **VERIFY:** Form does NOT submit (stays on create page)

### Step 4: Add Follow-up and Save (Should Pass)

1. Check Follow-up Required = true
2. Set Follow-up Date = tomorrow
3. Click "Save" button
4. **VERIFY:** Success notification appears
5. **VERIFY:** Navigates to activity list or detail page

---

## Console Monitoring

Watch for: "permission denied", "Uncaught", 500 errors

---

## Report Results

```
WG-001 (Sample follow-up): PASS/FAIL - [notes]
```
```

### Example 2: Smoke Test (condensed)

```markdown
# Dashboard Smoke Test

> **Test ID:** SMOKE-001
> **Priority:** Critical
> **Environment:** Local or Production

## Prerequisites

- [ ] Server running
- [ ] Logged in

---

## Steps

1. Navigate to http://localhost:5173/#/dashboard
2. **VERIFY:** Page loads within 10 seconds
3. **VERIFY:** Dashboard header visible
4. **VERIFY:** No red console errors
5. Open DevTools Network tab
6. **VERIFY:** No failed (red) requests

---

## Report

```
SMOKE-001 (Dashboard load): PASS/FAIL - [notes]
```
```

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `verification-before-completion` | Use manual E2E to verify changes before claiming done |
| `fail-fast-debugging` | Use console errors from manual tests to trace root cause |
| `ui-ux-design-principles` | Manual tests verify touch targets, accessibility |
| `troubleshooting` | Manual E2E can diagnose issues automated tests miss |

## Documentation Locations

- **Prompt templates:** `docs/tests/e2e/` (create new .md files here)
- **Existing examples:**
  - `docs/tests/e2e/claude-code-e2e-prompt.md` - Audit remediation tests
  - `docs/tests/e2e/01-smoke-tests.md` - Smoke test checklist
  - `docs/tests/e2e/ui-ux-consistency-manual-test.md` - UI verification

## Sources

- [Claude Computer Use Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool)
- [AI E2E Testing Guide](https://medium.com/@itsmo93/automating-e2e-ui-testing-with-claudes-computer-use-feature-c9f516bbbb66)
- [Prompt Engineering for Testers 2025](https://aqua-cloud.io/prompt-engineering-for-testers/)
- [Claude Chrome Browser Automation Prompts](https://github.com/Piebald-AI/claude-code-system-prompts)

---

**Last Updated:** 2026-01-10
**Version:** 1.0.0
