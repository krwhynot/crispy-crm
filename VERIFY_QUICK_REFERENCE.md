# Task 2 Quick Verification Reference

**30-Second Checks Before Claiming "Done"**

---

## Automated Verification (2 minutes)

```bash
# Run the automated verification script
./verify-task2.sh

# Expected: All checks pass, exit code 0
```

**Pass**: ✅ Exit code 0, all tests green
**Fail**: ❌ Any test failures, TypeScript errors, or lint errors

---

## Critical Manual Tests (5 minutes)

### Test 1: Product Deletion (No Phantom Bug)

```
1. Navigate to Products
2. Delete any product
3. Wait 3 seconds
4. Verify product STAYS deleted (doesn't reappear)
```

**Pass**: ✅ Product stays deleted
**Fail**: ❌ Product reappears

---

### Test 2: Opportunity Product Sync (RPC Call)

```
1. Navigate to any Opportunity → Edit
2. Go to Products tab
3. Add/remove a product
4. Click Save
5. Check console (DevTools)
```

**Pass**: ✅ No "rpc is not a function" error
**Fail**: ❌ Console shows RPC error

---

### Test 3: Product with Distributors (RPC Call)

```
1. Navigate to Products → Create
2. Fill name, select 2 distributors
3. Click Save
4. Check console (DevTools)
```

**Pass**: ✅ Product created, no RPC error
**Fail**: ❌ Console shows RPC error

---

## Database Verification (1 minute)

```bash
# Run SQL verification script
npx supabase db shell < verify-task2.sql

# Expected: All counts > 0, zero orphaned records
```

**Pass**: ✅ RPC function exists, no orphaned records
**Fail**: ❌ Missing RPC function or data integrity issues

---

## One-Line Sanity Checks

```bash
# Tests pass?
npm run test

# TypeScript clean?
npx tsc --noEmit

# No provider spreading?
rg "{\s*\.\.\.[a-zA-Z]+Provider" src/atomic-crm/providers/ --type ts

# Expected: 0 matches
```

---

## Console Error Keywords (Red Flags)

Watch for these in browser console:

- ❌ `rpc is not a function`
- ❌ `Cannot read property of undefined`
- ❌ `Unhandled promise rejection`
- ❌ `Invalid RPC call`

**Pass**: ✅ No red errors during normal operations
**Fail**: ❌ Any of the above errors appear

---

## Quick Rollback (If Verification Fails)

```bash
# Revert last commit
git reset --soft HEAD~1

# Or revert changes to specific file
git checkout HEAD -- src/atomic-crm/providers/supabase/composedDataProvider.ts
```

---

## Pass/Fail Decision Tree

```
┌─────────────────────────────────┐
│ Run ./verify-task2.sh           │
└────────┬────────────────────────┘
         │
         ├─✅ All pass → Continue to Manual Tests
         │
         └─❌ Any fail → FIX FIRST, don't proceed
                         │
         ┌───────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Manual Test: Product Deletion   │
└────────┬────────────────────────┘
         │
         ├─✅ No phantom → Continue
         │
         └─❌ Phantom bug → Cache invalidation issue, check queryKeys
                           │
         ┌─────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Manual Test: Opportunity Sync   │
└────────┬────────────────────────┘
         │
         ├─✅ No RPC error → Continue
         │
         └─❌ RPC error → baseProvider not mutated correctly, check composition
                         │
         ┌───────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Database Verification           │
└────────┬────────────────────────┘
         │
         ├─✅ All pass → TASK COMPLETE ✅
         │
         └─❌ Data issues → Check migrations/RLS policies
```

---

## Red Flags That Block Completion

**DO NOT claim task complete if ANY of these are true:**

- [ ] ❌ Automated tests fail
- [ ] ❌ TypeScript doesn't compile
- [ ] ❌ Product phantom bug still occurs
- [ ] ❌ "rpc is not a function" error in console
- [ ] ❌ Opportunity product sync fails
- [ ] ❌ Database has orphaned records
- [ ] ❌ RPC function missing

**ALL must be ✅ to claim completion.**

---

## Full Documentation

See `VERIFICATION_TASK2.md` for:
- Complete test checklist (30+ tests)
- SQL verification queries
- Edge case testing
- Performance checks
- Troubleshooting guide

---

**Estimated Time**: 8-10 minutes total verification
**Confidence**: High (covers critical paths and regression checks)
