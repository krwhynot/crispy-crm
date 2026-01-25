---
description: TypeScript audit (any types, strict mode, type safety) with delta tracking - saves to docs/audits/
argument-hint: [--quick | --full | src/path]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), Bash(npx tsc --noEmit:*), TodoWrite, Write
model: sonnet
---

# TypeScript Audit Command

You are performing a TypeScript audit for Crispy CRM. This command systematically checks for type safety violations, convention issues, and TypeScript best practice deviations with delta tracking against previous audits.

## Arguments

**$ARGUMENTS**

- `--quick` - Skip tsc compiler check, run only local rg patterns (faster)
- `--full` - Run all checks including full tsc analysis (default)
- `src/path` - Limit scope to specific directory

---

## Phase 1: Mode Detection and Setup

### 1.1 Parse Arguments

```
MODE = "full" (default)
SCOPE = "src/atomic-crm/ src/components/"

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

## Phase 2: Local TypeScript Checks (Always Run)

Run these `rg` patterns and collect findings. Each finding should include:
- File path and line number
- Code snippet (context)
- Severity level
- Risk description

### Critical Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| C1 | Explicit any type | `rg ": any\b" --type ts -n $SCOPE` | Type safety bypassed |
| C2 | as any cast | `rg "as any\b" --type ts -n $SCOPE` | Type safety bypassed |
| C3 | @ts-ignore comment | `rg "@ts-ignore" --type ts -n $SCOPE` | Errors hidden |
| C4 | @ts-nocheck comment | `rg "@ts-nocheck" --type ts -n $SCOPE` | File-level type checking disabled |
| C5 | @ts-expect-error without explanation | `rg "@ts-expect-error\s*$" --type ts -n $SCOPE` | Undocumented suppression |

### High Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| H1 | type for object shapes | `rg "^export type \w+ = \{" --type ts -n $SCOPE` | Convention violation (use interface) |
| H2 | Function without return type | `rg "function \w+\([^)]*\)\s*\{" --type ts -n $SCOPE` then filter lines without return type annotation | Implicit any return |
| H3 | Arrow function without return type (exported) | `rg "export const \w+ = \([^)]*\) =>" --type ts -n $SCOPE` | Implicit any return |
| H4 | Untyped catch clause | `rg "catch\s*\(\w+\)\s*\{" --type ts -n $SCOPE` | Unsafe error handling (use unknown) |
| H5 | Non-null assertion abuse | `rg "!\." --type ts -n $SCOPE` | Runtime null errors |
| H6 | Non-null assertion on optional chain | `rg "\?\.\w+!" --type ts -n $SCOPE` | Contradictory assertions |
| H7 | Database type in features | `rg "Database\['public'\]" --type ts -n src/atomic-crm/` | L1→L5 coupling (bypasses Domain layer) |
| H8 | Manual interface in types/ | `rg "export interface" --type ts -n src/atomic-crm/types/` | Schema drift (use z.infer instead) |
| H9 | Type casts in test files | `rg " as any\| as unknown as " src/**/*.test.ts* src/**/*.spec.ts* --type ts -n` | Tests pass with invalid data shapes, fail in production |

### Medium Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| M1 | useState without type | `rg "useState\(\)" --type tsx -n $SCOPE` | Implicit any state |
| M2 | useRef without type | `rg "useRef\(\)" --type tsx -n $SCOPE` | Implicit any ref |
| M3 | Loose equality | `rg "==[^=]\|!=[^=]" --type ts -n $SCOPE` | Type coercion bugs |
| M4 | Object type (uppercase) | `rg ": Object\b" --type ts -n $SCOPE` | Prefer object or specific type |
| M5 | Function type (uppercase) | `rg ": Function\b" --type ts -n $SCOPE` | Prefer specific function signature |
| M6 | Empty interface | `rg "interface \w+ \{\}" --type ts -n $SCOPE` | Likely placeholder |
| M7 | Missing typed mock factories | `rg "mockReturnValue\(\{" src/**/*.test.ts* -A 2 --type ts \| rg "as any"` | Hook mocks lack type safety, inconsistent test data |

---

## Phase 3: tsc Compiler Check (Full Mode Only)

**Skip this phase if MODE = "quick"**

### 3.1 Run TypeScript Compiler

```bash
npx tsc --noEmit 2>&1
```

Capture and parse:
- Total error count
- Total warning count
- List of specific type errors (file:line:column and message)

### 3.2 Categorize tsc Errors

Group errors by type:
- **TS2322** - Type assignment errors
- **TS2345** - Argument type mismatch
- **TS2339** - Property does not exist
- **TS7006** - Parameter implicitly has 'any' type
- **TS7031** - Binding element implicitly has 'any' type
- **TS2554** - Expected X arguments, got Y
- **Other** - Remaining errors

---

## Phase 4: Delta Tracking

### 4.1 Load Previous Baseline

```
Read: docs/audits/.baseline/typescript.json
```

Expected format:
```json
{
  "lastAuditDate": "2025-01-08",
  "mode": "full",
  "scope": "src/",
  "tscErrors": 15,
  "tscWarnings": 3,
  "findings": {
    "critical": 5,
    "high": 12,
    "medium": 20
  },
  "issues": [
    {
      "id": "C1-001",
      "severity": "critical",
      "check": "Explicit any type",
      "location": "src/atomic-crm/contacts/ContactList.tsx:45",
      "status": "open",
      "firstSeen": "2025-01-01"
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

Save to: `docs/audits/YYYY-MM-DD-typescript.md`

```markdown
# TypeScript Audit Report

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

**tsc Status:** [X errors, Y warnings] (Full mode only)

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

## tsc Compiler Results (Full Mode)

**Total Errors:** X
**Total Warnings:** Y

### Error Breakdown by Type

| Error Code | Count | Description |
|------------|-------|-------------|
| TS2322 | X | Type assignment errors |
| TS2345 | X | Argument type mismatch |
| TS7006 | X | Implicit any parameter |
| ... | ... | ... |

### Sample Errors (First 10)

```
src/file.ts:45:12 - error TS2322: Type 'string' is not assignable to type 'number'.
...
```

---

## Current Findings

### Critical (Type Safety Bypassed)

These issues MUST be fixed - they completely bypass TypeScript's type system.

#### [C1] Explicit any type

**Files Affected:**
- `src/atomic-crm/file.ts:123` - `: any` annotation
- `src/atomic-crm/file2.ts:45` - `: any` annotation

**Risk:** TypeScript provides no type checking for these values.

**Fix:** Replace with proper types. Use `unknown` if the type is truly unknown, then narrow with type guards.

```typescript
// WRONG
function process(data: any) { ... }

// CORRECT
function process(data: unknown) {
  if (typeof data === 'string') { ... }
}
```

---

#### [C2] as any cast

**Files Affected:**
- `src/file.ts:67` - `as any` cast

**Risk:** Silently converts any type, hiding real type errors.

**Fix:** Use proper type assertions or fix the underlying type mismatch.

```typescript
// WRONG
const result = fetchData() as any;

// CORRECT
const result = fetchData() as ApiResponse;
// OR fix the actual return type
```

---

### High (Convention Violations)

#### [H1] type for object shapes

**Files Affected:**
- `src/types/file.ts:10` - `type X = { ... }`

**Risk:** Project convention requires `interface` for object shapes.

**Fix:** Convert to interface syntax.

```typescript
// WRONG (per project convention)
type Contact = {
  id: string;
  name: string;
};

// CORRECT
interface Contact {
  id: string;
  name: string;
}

// type IS correct for unions/intersections
type Status = 'active' | 'inactive';
type ContactWithOrg = Contact & { orgId: string };
```

---

#### [H4] Untyped catch clause

**Files Affected:**
- `src/file.ts:89` - `catch (error) { ... }`

**Risk:** Error is implicitly `any`, bypassing type safety.

**Fix:** Type as `unknown` and use type guards.

```typescript
// WRONG
catch (error) {
  console.log(error.message); // No type safety
}

// CORRECT
catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message);
  }
}
```

---

#### [H9] Type Casts in Test Files

**Files Affected:**
- `src/atomic-crm/contacts/__tests__/ContactList.test.tsx:45` - `as any`

**Risk:** Type casts in tests bypass TypeScript's type checking, allowing tests to pass with invalid data shapes that will fail in production:
- Tests use incomplete mock data
- Missing required fields go undetected
- Type changes don't trigger test failures
- False sense of test coverage

**Fix:** Use properly typed test data from Zod schemas or typed mock factories.

```typescript
// WRONG: Type cast bypasses validation
const mockContact = {
  id: 1,
  first_name: "John",
} as any; // Missing required fields!

vi.mocked(useGetList).mockReturnValue({
  data: [mockContact],
  total: 1,
} as any); // Could pass with wrong data shape

// CORRECT: Use typed test data
import type { Contact } from '@/atomic-crm/validation/contact';

const testContact: Contact = {
  id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  // ... all required fields - TypeScript enforces completeness
};

// Use generic typed factory
import { mockUseGetListReturn } from '@/tests/utils/typed-mocks';

vi.mocked(useGetList<Contact>).mockReturnValue(
  mockUseGetListReturn<Contact>({
    data: [testContact],
    total: 1
  })
);
```

---

### Medium (Best Practices)

#### [M1] useState without type

**Files Affected:**
- `src/components/file.tsx:23` - `useState()`

**Risk:** State type inferred as `undefined`, then becomes `any` on update.

**Fix:** Provide explicit type argument.

```typescript
// WRONG
const [data, setData] = useState();

// CORRECT
const [data, setData] = useState<Contact | null>(null);
```

---

#### [M7] Missing Typed Mock Factories

**Files Affected:**
- `src/atomic-crm/opportunities/__tests__/OpportunitiesList.test.tsx:67`

**Risk:** Manually mocking React Admin hooks without generic factories leads to:
- Inconsistent mock data across tests
- Repeated type casts (as any)
- Missing required hook return properties
- Tests that don't match production types

**Fix:** Use generic typed factories from `src/tests/utils/typed-mocks.ts`.

```typescript
// WRONG: Manual mock with type cast
vi.mocked(useGetList).mockReturnValue({
  data: [mockOpportunity],
  total: 1,
} as any); // Missing isLoading, error, etc.

// CORRECT: Generic typed factory
import { mockUseGetListReturn } from '@/tests/utils/typed-mocks';
import type { Opportunity } from '@/atomic-crm/validation/opportunity';

vi.mocked(useGetList<Opportunity>).mockReturnValue(
  mockUseGetListReturn<Opportunity>({
    data: [testOpportunity],
    total: 1
    // Factory provides all required properties with correct types
  })
);
```

**Available Factories:**
- `mockUseGetListReturn<T>()` - For useGetList hooks
- `mockUseGetOneReturn<T>()` - For useGetOne hooks
- `mockUseGetManyReturn<T>()` - For useGetMany hooks

**Location:** `src/tests/utils/typed-mocks.ts`

---

## TypeScript Best Practices Reference

### Object Types

```typescript
// CORRECT: interface for object shapes
interface Contact {
  id: string;
  name: string;
  email?: string;
}

// CORRECT: type for unions/intersections
type Status = 'active' | 'inactive' | 'pending';
type ContactWithOrg = Contact & { organizationId: string };

// CORRECT: type for mapped/conditional types
type Readonly<T> = { readonly [K in keyof T]: T[K] };
```

### Function Types

```typescript
// CORRECT: Explicit return type for exported functions
export function getContact(id: string): Promise<Contact> {
  return fetch(`/api/contacts/${id}`).then(r => r.json());
}

// CORRECT: Explicit return type for complex functions
function processData(input: RawData): ProcessedData | null {
  // ...
}

// OK: Inferred return for simple functions
const double = (n: number) => n * 2;
```

### Error Handling

```typescript
// CORRECT: Typed error handling
try {
  await riskyOperation();
} catch (error: unknown) {
  if (error instanceof Error) {
    logger.error(error.message);
  } else {
    logger.error('Unknown error occurred');
  }
}
```

### Avoiding any

```typescript
// WRONG
function parse(data: any): any { ... }

// CORRECT: Use generics
function parse<T>(data: string): T { ... }

// CORRECT: Use unknown with type guards
function parse(data: unknown): ParsedResult {
  if (isValidInput(data)) {
    return processValid(data);
  }
  throw new Error('Invalid input');
}
```

---

## Recommendations

### Immediate Actions (Critical)
1. [List critical fixes with file references]

### Short-Term (High)
1. [List high-priority fixes]

### Technical Debt (Medium)
1. [List medium fixes to schedule]

### Compiler Health
- [If tsc errors exist: "Fix X tsc errors to ensure type safety"]
- [If clean: "tsc passes with no errors"]

---

## Appendix: Check Definitions

| ID | Check | Pattern | Severity |
|----|-------|---------|----------|
| C1 | Explicit any type | `: any\b` | Critical |
| C2 | as any cast | `as any\b` | Critical |
| C3 | @ts-ignore | `@ts-ignore` | Critical |
| C4 | @ts-nocheck | `@ts-nocheck` | Critical |
| C5 | @ts-expect-error (unexplained) | `@ts-expect-error\s*$` | Critical |
| H1 | type for object shapes | `^export type \w+ = \{` | High |
| H2 | Function without return type | `function \w+\([^)]*\)\s*\{` | High |
| H3 | Arrow function without return type | `export const \w+ = \([^)]*\) =>` | High |
| H4 | Untyped catch clause | `catch\s*\(\w+\)\s*\{` | High |
| H5 | Non-null assertion abuse | `!\.` | High |
| H6 | Non-null assertion on optional chain | `\?\.\w+!` | High |
| H7 | Database type in features | `Database\['public'\]` | High |
| H8 | Manual interface in types/ | `export interface` (in types/) | High |
| M1 | useState without type | `useState\(\)` | Medium |
| M2 | useRef without type | `useRef\(\)` | Medium |
| M3 | Loose equality | `==[^=]\|!=[^=]` | Medium |
| M4 | Object type | `: Object\b` | Medium |
| M5 | Function type | `: Function\b` | Medium |
| M6 | Empty interface | `interface \w+ \{\}` | Medium |

---

*Generated by /audit/typescript command*
*Report location: docs/audits/YYYY-MM-DD-typescript.md*
```

### 5.2 Update Baseline JSON

Write to: `docs/audits/.baseline/typescript.json`

```json
{
  "lastAuditDate": "[AUDIT_DATE]",
  "mode": "[MODE]",
  "scope": "[SCOPE]",
  "tscErrors": [count or null if quick mode],
  "tscWarnings": [count or null if quick mode],
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
      "firstSeen": "[date first detected]",
      "status": "open"
    }
  ]
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
    content: "[Critical] Fix explicit any type in src/file.ts:45",
    status: "pending",
    activeForm: "Fixing explicit any type"
  },
  {
    content: "[Critical] Remove @ts-ignore in src/api.ts:12",
    status: "pending",
    activeForm: "Removing @ts-ignore comment"
  },
  // High findings
  {
    content: "[High] Add return type to function in src/utils.ts:67",
    status: "pending",
    activeForm: "Adding return type annotation"
  },
  {
    content: "[High] Type catch clause as unknown in src/service.ts:89",
    status: "pending",
    activeForm: "Typing catch clause"
  },
  // ...
])
```

### 6.2 Summary Output

Display summary to user:

```markdown
## TypeScript Audit Complete

**Date:** [AUDIT_DATE]
**Mode:** [MODE]
**Report:** docs/audits/[AUDIT_DATE]-typescript.md
**Baseline:** docs/audits/.baseline/typescript.json (updated)

### Results

| Severity | Count | Action Required |
|----------|-------|-----------------|
| Critical | X | FIX IMMEDIATELY |
| High | Y | Fix before PR merge |
| Medium | Z | Fix when convenient |

### tsc Status (Full Mode)
- **Errors:** X
- **Warnings:** Y

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
| **Critical** | Type safety completely bypassed | Types provide no protection | any, @ts-ignore, @ts-nocheck |
| **High** | Convention violation or implicit any | Inconsistent codebase, hidden any | type for objects, untyped catch, missing return types |
| **Medium** | Best practice deviation | Suboptimal code, potential issues | loose equality, empty interfaces, untyped hooks |

---

## Quick Reference

### Run Full Audit
```
/audit/typescript
/audit/typescript --full
```

### Run Quick Audit (No tsc)
```
/audit/typescript --quick
```

### Audit Specific Directory
```
/audit/typescript src/atomic-crm/validation/
/audit/typescript --quick src/atomic-crm/contacts/
```

---

## Related Commands

- `/audit/security` - Security audit (RLS, validation, auth)
- `/audit/data-integrity` - Data provider and soft delete audit
- `/code-review` - Deep dive code review with parallel agents
