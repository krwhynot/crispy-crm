---
description: Error handling audit (fail-fast violations, retry logic, silent catches) with delta tracking - saves to docs/audits/
argument-hint: [--quick | --full | src/path]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), TodoWrite, Write
model: sonnet
---

# Error Handling Audit Command

You are performing an error handling audit for Crispy CRM. This command systematically checks for fail-fast violations, retry logic, silent catches, and error swallowing patterns with delta tracking against previous audits.

**Core Principle:** In pre-launch, let errors throw. No retry logic, no circuit breakers, no graceful fallbacks. Velocity over resilience.

---

## Arguments

**$ARGUMENTS**

- `--quick` - Skip error boundary analysis, run only rg pattern checks (faster)
- `--full` - Run all checks including error boundary analysis (default)
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

If $ARGUMENTS contains a path (e.g., "src/atomic-crm/"):
  SCOPE = that path only
```

### 1.2 Get Current Date

```bash
date +%Y-%m-%d
```

Store as `AUDIT_DATE` for report naming.

---

## Phase 2: Pattern Detection (Always Run)

Run these `rg` patterns and collect findings. Each finding should include:
- File path and line number
- Code snippet (context)
- Severity level
- Risk description

### Critical Severity (Fail-Fast Violations)

These patterns DIRECTLY VIOLATE the fail-fast principle and must be removed.

| ID | Check | Command | Risk |
|----|-------|---------|------|
| C1 | Retry logic constants | `rg "MAX_RETRIES\|maxRetries\|RETRY_COUNT\|retryCount\|numRetries\|retries\s*=" --type ts -n $SCOPE` | Masks root cause, hides bugs |
| C2 | Retry function calls | `rg "retry\(\|withRetry\|retryAsync\|retryWithBackoff" --type ts -n $SCOPE` | Retry wrappers mask failures |
| C3 | Circuit breakers | `rg "CircuitBreaker\|circuitBreaker\|circuit_breaker\|CIRCUIT_" --type ts -n $SCOPE` | Over-engineering for pre-launch |
| C4 | Exponential backoff | `rg "exponentialBackoff\|backoff\|BACKOFF_" --type ts -n $SCOPE` | Pre-launch complexity |
| C5 | Graceful fallbacks (return default) | `rg "catch.*return.*\[\]" --type ts -n $SCOPE` | Silent failures (empty array) |
| C6 | Graceful fallbacks (return null) | `rg "catch.*return.*null" --type ts -n $SCOPE` | Silent failures (null) |
| C7 | Graceful fallbacks (return cache) | `rg "catch.*return.*cache\|catch.*\.cache" --type ts -n $SCOPE` | Silent failures (stale data) |
| C8 | Graceful fallbacks (default value) | `rg "catch.*return.*default\|catch.*return.*fallback" --type ts -n $SCOPE` | Silent failures |
| C9 | Fire-and-forget void without catch | `rg "void [a-zA-Z_]+\([^)]*\);?\s*$" src/atomic-crm/providers/ --type ts -n` | Side-effects fail silently, no logging, orphaned resources |
| C10 | Unawaited async in lifecycle hooks | `rg "async function (before\|after)(Create\|Update\|Delete)" src/atomic-crm/providers/supabase/callbacks/ -A 5 --type ts \| rg "^\s+[a-zA-Z_]+\(" \| rg -v "await\|void"` | Race conditions, operations complete out of order |
| C11 | Raw Supabase outside providers | `rg "supabase\." --type ts -n src/atomic-crm/ --glob '!**/providers/**'` | Bypasses error transformation |

### High Severity (Error Swallowing)

These patterns hide errors from developers and users.

| ID | Check | Command | Risk |
|----|-------|---------|------|
| H1 | Empty catch blocks | `rg "catch\s*\([^)]*\)\s*\{\s*\}" --type ts -n $SCOPE` | Completely swallowed errors |
| H2 | Catch with only comment | `rg "catch\s*\([^)]*\)\s*\{\s*//.*\s*\}" --type ts -n $SCOPE` | Error ignored with excuse |
| H3 | console.error only (no throw) | Requires multiline check - see Phase 2.1 | Logged but not surfaced |
| H4 | Generic error throw | `rg "throw new Error\(['\"]Failed" --type ts -n $SCOPE` | No context for debugging |
| H5 | Catch returns undefined | `rg "catch.*return undefined\|catch.*return;" --type ts -n $SCOPE` | Silent failure |
| H6 | Swallowed Promise rejection | `rg "\.catch\(\s*\(\)\s*=>\s*\{\s*\}\s*\)" --type ts -n $SCOPE` | Ignored async errors |

### Medium Severity (Best Practices)

These patterns could lead to harder debugging.

| ID | Check | Command | Risk |
|----|-------|---------|------|
| M1 | Untyped catch | `rg "catch\s*\(e\)" --type ts -n $SCOPE` | Should use `catch (error: unknown)` |
| M2 | Promise without catch | `rg "\.then\([^)]+\)(?!\.catch)" --type ts -n $SCOPE` | Potential unhandled rejection |
| M3 | console.log in catch | `rg "catch.*console\.log" --type ts -n $SCOPE` | Should use console.error |
| M4 | Any type in catch | `rg "catch\s*\(.*:\s*any\)" --type ts -n $SCOPE` | Should type-narrow errors |
| M5 | Missing error boundary check | See Phase 3 | Poor UX for React errors |

### 2.1 Special Check: console.error Without Re-throw

This requires reading file content to verify if throw follows console.error:

```bash
# Find files with console.error in catch blocks
rg -l "catch.*console\.error" --type ts $SCOPE
```

For each file found, read the catch block context to verify if error is re-thrown.

---

## Phase 3: Error Boundary Analysis (Full Mode Only)

**Skip this phase if MODE = "quick"**

### 3.1 Find React Components Without Error Boundaries

Check for top-level page/feature components that don't have error boundary wrappers:

```bash
# Find page-level components
rg "export (default function|const) \w+(Page|View|List|Create|Edit|Show)" --type tsx $SCOPE -l
```

For each page component found:
1. Read the file
2. Check if it's wrapped in `<ErrorBoundary>` or uses error boundary HOC
3. If not wrapped, flag as Medium severity

### 3.2 Verify Error Boundary Imports

```bash
rg "import.*ErrorBoundary" --type tsx $SCOPE -l
```

Compare against list of page components - any page without import is a finding.

---

## Phase 4: Load Baseline

### 4.1 Read Previous Baseline

```bash
cat docs/audits/.baseline/error-handling.json
```

Expected format:
```json
{
  "lastAuditDate": "2024-01-15",
  "mode": "full",
  "scope": "src/",
  "findings": {
    "critical": 2,
    "high": 5,
    "medium": 10
  },
  "issues": [
    {
      "id": "C1-001",
      "severity": "critical",
      "check": "Retry logic constants",
      "location": "src/providers/api.ts:45",
      "firstSeen": "2024-01-10",
      "status": "open"
    }
  ]
}
```

If file doesn't exist or is empty, treat as first audit (no delta).

### 4.2 Compare Findings

For each current finding:
1. Check if it exists in baseline by location + check type
2. If NOT in baseline -> Mark as **NEW**
3. If in baseline -> Mark as **EXISTING**

For each baseline finding:
1. If NOT in current findings -> Mark as **FIXED**

---

## Phase 5: Generate Report

### 5.1 Create Markdown Report

Save to: `docs/audits/YYYY-MM-DD-error-handling.md`

### 5.2 Report Template

```markdown
# Error Handling Audit Report

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

### Critical (Fail-Fast Violations)

These patterns MUST be removed. They violate the core fail-fast principle.

#### [C1] Retry Logic - Masks Root Cause

**Files Affected:**
- `src/path/file.ts:123` - `MAX_RETRIES = 3`

**Risk:** Retry logic hides intermittent failures, making root causes invisible. When errors are retried, developers never learn about the underlying issue.

**Fix:** Remove retry logic entirely. Let the error throw and fix the root cause.

```typescript
// WRONG: Masks the real problem
async function fetchWithRetry(url: string, retries = 3) {
  try {
    return await fetch(url);
  } catch (e) {
    if (retries > 0) return fetchWithRetry(url, retries - 1);
    throw e;
  }
}

// CORRECT: Let it fail, fix the root cause
async function fetchData(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  return response;
}
```

---

#### [C5-C8] Graceful Fallbacks - Silent Failures

**Files Affected:**
- `src/path/file.ts:45` - `catch (e) { return [] }`

**Risk:** Returning default values in catch blocks hides errors from users and developers. The application appears to work but is silently broken.

**Fix:** Let errors propagate. Add error boundaries at the UI layer to show meaningful error states.

```typescript
// WRONG: Silent failure
async function getContacts() {
  try {
    return await api.fetchContacts();
  } catch (e) {
    console.error(e);
    return []; // User sees empty list, never knows there's a bug
  }
}

// CORRECT: Let it throw, handle at boundary
async function getContacts() {
  const data = await api.fetchContacts();
  if (data.error) throw data.error;
  return data;
}
```

---

#### [C9] Fire-and-Forget Void Without Catch - Silent Side-Effect Failures

**Files Affected:**
- `src/atomic-crm/providers/supabase/callbacks/organizationsCallbacks.ts:45` - `void deleteStorageFiles(filePaths);`

**Risk:** Side-effects are fired without error handling. When they fail:
- No error logging occurs
- Developers are unaware of the failure
- Resources may be orphaned (storage files, webhooks not sent)
- Silent data inconsistencies accumulate

**Fix:** Add explicit error handling with structured logging for non-critical side-effects.

```typescript
// WRONG: Fire-and-forget - errors vanish
if (filePaths.length > 0) {
  void deleteStorageFiles(filePaths);
}

// CORRECT: Explicit error handling with logging
if (filePaths.length > 0) {
  void deleteStorageFiles(filePaths).catch((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.warn('Storage cleanup failed after organization archive', {
      organizationId: params.id,
      fileCount: filePaths.length,
      error: errorMessage,
      operation: 'organizationsBeforeDelete',
      note: 'Archive succeeded - orphaned files can be cleaned up later',
    });
  });
}
```

---

#### [C10] Unawaited Async in Lifecycle Hooks - Race Conditions

**Files Affected:**
- `src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts:78` - `sendNotification(params.id);` (missing await)

**Risk:** Async operations in lifecycle hooks that aren't awaited cause:
- Race conditions (operation completes after function returns)
- Unpredictable order of operations
- Silent failures if the promise rejects
- Incorrect assumptions about operation completion

**Fix:** Either await critical operations or explicitly void with error handling for non-critical side-effects.

```typescript
// WRONG: Unawaited promise - may not complete before return
async function beforeDelete(params: DeleteParams) {
  deleteStorageFiles(params.id); // Missing await - caller doesn't know it failed
  return params;
}

// CORRECT Option 1: Await critical operations
async function beforeDelete(params: DeleteParams) {
  // Critical: Must succeed before returning
  await supabase.rpc('archive_organization_with_relations', { org_id: params.id });

  // Non-critical cleanup: Log failures but don't block
  void cleanupStorage(params.id).catch(logError);

  return params;
}

// CORRECT Option 2: Fire-and-forget ONLY for non-critical, with error handling
async function afterCreate(record: RaRecord, dataProvider: DataProvider) {
  // Non-critical: Send email in background, log failures
  void sendWelcomeEmail(record.email).catch((err: unknown) => {
    logger.warn('Welcome email failed', {
      userId: record.id,
      email: record.email,
      error: err instanceof Error ? err.message : String(err),
      note: 'User created successfully - email can be resent manually',
    });
  });
  return record;
}
```

---

#### [C11] Raw Supabase Outside Providers - Bypassed Error Handling

**Files Affected:**
- `src/atomic-crm/contacts/ContactList.tsx:42` - `supabase.from('contacts').select()`

**Risk:** Direct Supabase calls outside the provider layer bypass:
- Error transformation to user-friendly messages
- ValidationService at API boundary
- Centralized logging/monitoring via withErrorLogging wrapper

**Fix:** Use React Admin hooks (`useDataProvider`, `useGetList`, `useGetOne`) which route through the provider layer.

```typescript
// WRONG: Direct Supabase call bypasses error handling
import { supabase } from '@/lib/supabase';

async function getContacts() {
  const { data, error } = await supabase.from('contacts').select();
  if (error) throw error; // Raw Supabase error, no transformation
  return data;
}

// CORRECT: Use React Admin hooks via provider
import { useGetList } from 'react-admin';

function ContactsList() {
  const { data, isLoading, error } = useGetList('contacts');
  // Error already transformed by provider layer
  // Logging already captured by withErrorLogging wrapper
}
```

---

### High (Error Swallowing)

#### [H1] Empty Catch Blocks - Completely Hidden Errors

**Files Affected:**
- `src/path/file.ts:78` - `catch (e) { }`

**Risk:** Errors are completely invisible. No logging, no surfacing, no debugging possible.

**Fix:** Either re-throw the error or add proper error handling with user feedback.

```typescript
// WRONG: Error vanishes
try {
  await saveContact(data);
} catch (e) {
  // Error swallowed entirely
}

// CORRECT: Re-throw for boundary handling
try {
  await saveContact(data);
} catch (error: unknown) {
  if (error instanceof ZodError) {
    throw new HttpError(400, { errors: error.flatten() });
  }
  throw error; // Re-throw unknown errors
}
```

---

#### [H4] Generic Error Messages - No Debug Context

**Files Affected:**
- `src/path/file.ts:92` - `throw new Error("Failed")`

**Risk:** When debugging, "Failed" tells you nothing. Include context about WHAT failed and WHY.

**Fix:** Include descriptive error messages with relevant context.

```typescript
// WRONG: Useless for debugging
throw new Error("Failed");

// CORRECT: Contextual error
throw new Error(`Failed to save contact ${contactId}: ${error.message}`);
```

---

### Medium (Best Practices)

#### [M1] Untyped Catch Parameters

**Files Affected:**
- `src/path/file.ts:110` - `catch (e)`

**Fix:** Use `catch (error: unknown)` and type-narrow appropriately.

```typescript
// WRONG: Untyped, unsafe access
catch (e) {
  console.error(e.message); // Might crash if e isn't an Error
}

// CORRECT: Type-safe error handling
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
  throw error;
}
```

---

## Error Boundary Status

*(Skipped in quick mode)*

### Components Without Error Boundaries

| Component | File | Recommendation |
|-----------|------|----------------|
| [ComponentName] | src/path/file.tsx | Wrap in `<ErrorBoundary>` |

### Recommended Pattern

```tsx
// src/atomic-crm/contacts/index.tsx
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ContactsError } from './ContactsError';

export default function Contacts() {
  return (
    <ErrorBoundary fallback={<ContactsError />}>
      <ContactsList />
    </ErrorBoundary>
  );
}
```

---

## Fail-Fast Principle Reference

### Why Fail-Fast?

1. **Bugs Surface Immediately** - No hidden failures accumulating
2. **Root Causes Are Visible** - Errors point to the actual problem
3. **Faster Debugging** - Stack traces lead directly to issues
4. **Data Integrity** - No silent data corruption
5. **User Trust** - Errors with clear messages > mysterious broken states

### Correct Patterns

```typescript
// CORRECT: Let errors throw (fail-fast)
const data = await supabase.from('contacts').select();
if (data.error) throw data.error; // Don't retry, don't cache fallback

// CORRECT: Specific error handling with re-throw
catch (error: unknown) {
  if (error instanceof ZodError) {
    throw new HttpError(400, { errors: error.flatten() });
  }
  throw error; // Re-throw unknown errors
}

// CORRECT: Error boundary at feature level
<ErrorBoundary fallback={<ContactsError />}>
  <ContactsList />
</ErrorBoundary>
```

### Anti-Patterns to Remove

```typescript
// REMOVE: Retry logic
const MAX_RETRIES = 3;
async function fetchWithRetry() { ... }

// REMOVE: Circuit breakers
const circuitBreaker = new CircuitBreaker();

// REMOVE: Silent fallbacks
catch (e) { return []; }
catch (e) { return null; }
catch (e) { return cache.get(key); }

// REMOVE: Empty catches
catch (e) { }

// REMOVE: Log without throw
catch (e) { console.error(e); }
```

---

## Recommendations

### Immediate Actions (Critical)
1. [List specific files and changes for Critical findings]

### Short-Term (High)
1. [List specific files and changes for High findings]

### Technical Debt (Medium)
1. [List improvements for Medium findings]

---

## Appendix: Check Definitions

| ID | Check | Pattern | Severity | Rationale |
|----|-------|---------|----------|-----------|
| C1 | Retry logic constants | `MAX_RETRIES\|maxRetries` | Critical | Masks intermittent failures |
| C2 | Retry function calls | `retry\(\|withRetry` | Critical | Retry wrappers hide bugs |
| C3 | Circuit breakers | `CircuitBreaker` | Critical | Pre-launch over-engineering |
| C4 | Exponential backoff | `exponentialBackoff\|backoff` | Critical | Pre-launch complexity |
| C5-8 | Graceful fallbacks | `catch.*return.*\[\]\|null\|cache\|default` | Critical | Silent failures |
| C9 | Raw Supabase outside providers | `supabase\.` (outside providers) | Critical | Bypasses error transformation |
| H1 | Empty catch | `catch\s*\([^)]*\)\s*\{\s*\}` | High | Complete error swallowing |
| H2 | Comment-only catch | `catch.*\{.*//.*\}` | High | Ignored with excuse |
| H3 | Log without throw | `catch.*console\.error` (no throw) | High | Logged but hidden |
| H4 | Generic error | `throw new Error\("Failed"` | High | No debug context |
| H5 | Return undefined | `catch.*return undefined` | High | Silent failure |
| H6 | Swallowed Promise | `.catch\(\(\)\s*=>\s*\{\}` | High | Async error ignored |
| M1 | Untyped catch | `catch\s*\(e\)` | Medium | Type safety |
| M2 | Promise no catch | `.then\(` without `.catch` | Medium | Unhandled rejection |
| M3 | console.log in catch | `catch.*console\.log` | Medium | Should use error level |
| M4 | Any in catch | `catch.*:\s*any` | Medium | Should narrow types |
| M5 | Missing boundary | Page without ErrorBoundary | Medium | Poor error UX |

---

*Generated by /audit/error-handling command*
*Report location: docs/audits/YYYY-MM-DD-error-handling.md*
```

---

## Phase 6: Update Baseline JSON

Write to: `docs/audits/.baseline/error-handling.json`

```json
{
  "lastAuditDate": "[AUDIT_DATE]",
  "mode": "[MODE]",
  "scope": "[SCOPE]",
  "findings": {
    "critical": [count],
    "high": [count],
    "medium": [count]
  },
  "issues": [
    {
      "id": "[unique-id]",
      "severity": "[critical|high|medium]",
      "check": "[check name]",
      "location": "[file:line]",
      "firstSeen": "[date first detected or from baseline]",
      "status": "open"
    }
  ]
}
```

Ensure directory exists:
```bash
mkdir -p docs/audits/.baseline
```

---

## Phase 7: Create TodoWrite Tasks

Create todos for Critical and High severity findings only:

```typescript
TodoWrite([
  // Critical findings (Fail-Fast Violations)
  {
    content: "[Critical] C1: Remove retry logic in src/path/file.ts:45",
    status: "pending",
    activeForm: "Removing retry logic"
  },
  {
    content: "[Critical] C5: Remove fallback return in src/path/file.ts:78",
    status: "pending",
    activeForm: "Removing fallback return"
  },
  // High findings (Error Swallowing)
  {
    content: "[High] H1: Add error re-throw in empty catch at src/path/file.ts:92",
    status: "pending",
    activeForm: "Adding error re-throw"
  },
  // ...
])
```

**Rules:**
- Only create todos for Critical and High findings
- Include file:line in task
- Use actionable language ("Remove", "Add", "Replace")
- Critical tasks should focus on REMOVING patterns, not adding handling

---

## Phase 8: Summary Output

Display summary to user:

```markdown
## Error Handling Audit Complete

**Date:** [AUDIT_DATE]
**Mode:** [MODE]
**Report:** docs/audits/[AUDIT_DATE]-error-handling.md
**Baseline:** docs/audits/.baseline/error-handling.json (updated)

### Results

| Severity | Count | Action Required |
|----------|-------|-----------------|
| Critical | X | REMOVE IMMEDIATELY (fail-fast violations) |
| High | Y | Fix before PR merge (error swallowing) |
| Medium | Z | Fix when convenient (best practices) |

### Delta Summary
- **New issues:** X
- **Fixed issues:** Y
- **Net change:** +/-Z

### Fail-Fast Compliance
- [ ] No retry logic found
- [ ] No circuit breakers found
- [ ] No silent fallbacks found
- [ ] All catch blocks re-throw or handle specifically

### Next Steps
[List recommended actions based on findings - prioritize REMOVAL of anti-patterns]
```

---

## Severity Definitions

| Level | Definition | Impact | Examples |
|-------|------------|--------|----------|
| **Critical** | Fail-fast principle violation - patterns that mask errors | REMOVE IMMEDIATELY | Retry logic, circuit breakers, silent fallbacks, graceful degradation |
| **High** | Error swallowing - patterns that hide errors from developers | Fix before PR merge | Empty catches, log-only catches, generic throws |
| **Medium** | Best practice deviation - patterns that make debugging harder | Fix when convenient | Untyped catches, missing boundaries, console.log in catch |

---

## Quick Reference

### Run Full Audit
```
/audit/error-handling
/audit/error-handling --full
```

### Run Quick Audit (Pattern Detection Only)
```
/audit/error-handling --quick
```

### Audit Specific Directory
```
/audit/error-handling src/atomic-crm/providers/
/audit/error-handling --quick src/atomic-crm/
```

---

## Related Resources

- **Fail-Fast Debugging Skill:** `.claude/skills/fail-fast-debugging/SKILL.md`
- **Anti-Patterns Reference:** `.claude/skills/fail-fast-debugging/ANTI-PATTERNS.md`
- **Security Audit:** `/audit/security`
- **Full Code Review:** `/code-review`
