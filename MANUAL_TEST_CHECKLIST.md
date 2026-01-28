# Task 2 Manual Test Checklist

**Print this page and check off items as you test**

---

## Pre-Flight Checks

- [ ] Supabase local stack running (`npx supabase start`)
- [ ] Dev server running (`npm run dev`)
- [ ] Browser DevTools open (Console tab visible)
- [ ] Test data seeded (`just seed-e2e`)

---

## Test 1: Product Deletion (No Phantom Reappearance)

**Goal**: Verify deleted products stay deleted and don't reappear

### Steps

1. [ ] Navigate to **Products** list page
2. [ ] Note the total product count at top of list
3. [ ] Select any product (e.g., first one in list)
4. [ ] Click **Delete** button
5. [ ] Confirm deletion in modal dialog
6. [ ] **Immediately observe** - product disappears from list
7. [ ] Wait 3 seconds without touching anything
8. [ ] Check if product count decreased by 1
9. [ ] Refresh page (`F5`)
10. [ ] Verify product still doesn't appear

### Expected Behavior

- [ ] ✅ Product disappears immediately
- [ ] ✅ Product count decreases by 1
- [ ] ✅ Product does NOT reappear after 3 seconds
- [ ] ✅ Product stays deleted after refresh
- [ ] ✅ Toast notification shows success message
- [ ] ✅ No console errors (check DevTools)

### If Failed

- [ ] ❌ Product reappears → Cache invalidation issue (check queryKeys)
- [ ] ❌ Console error → Check error message and stack trace
- [ ] ❌ Toast shows error → Check error notification details

**Notes**:

---

## Test 2: Product with Distributors Creation

**Goal**: Verify RPC call succeeds when creating products with distributor associations

### Steps

1. [ ] Navigate to **Products** → Click **Create New**
2. [ ] Fill in form:
   - Name: `Test Product RPC - [Your Initials]`
   - Principal: Select any principal
   - Distributors: Select 2-3 distributors (use Ctrl/Cmd+Click)
3. [ ] Click **Save** button
4. [ ] Watch for toast notification
5. [ ] Check browser console for errors
6. [ ] Navigate back to Products list
7. [ ] Find newly created product in list
8. [ ] Click on product to view details
9. [ ] Verify distributors are associated

### Expected Behavior

- [ ] ✅ Form submits without errors
- [ ] ✅ Toast shows "Product created successfully"
- [ ] ✅ No "rpc is not a function" error in console
- [ ] ✅ Product appears in list immediately
- [ ] ✅ Product details show correct distributors

### If Failed

- [ ] ❌ "rpc is not a function" → baseProvider mutation issue
- [ ] ❌ Distributors not saved → Check product_distributors table
- [ ] ❌ Form validation error → Check schema validation

**Console Output**:

---

## Test 3: Opportunity Product Sync

**Goal**: Verify RPC call succeeds when syncing opportunity products (critical path)

### Steps

1. [ ] Navigate to **Opportunities** list
2. [ ] Click on any opportunity to edit
3. [ ] Navigate to **Products** tab
4. [ ] Note current products (if any)
5. [ ] Add a new product OR remove existing product
6. [ ] Click **Save** button
7. [ ] Watch for toast notification
8. [ ] **CRITICAL**: Check console for errors
9. [ ] Navigate back to Opportunities list
10. [ ] Re-open same opportunity
11. [ ] Verify products saved correctly

### Expected Behavior

- [ ] ✅ Save completes without errors
- [ ] ✅ Toast shows "Opportunity updated successfully"
- [ ] ✅ No "rpc is not a function" error in console
- [ ] ✅ Products persist after re-opening
- [ ] ✅ Opportunity list shows updated info

### If Failed

- [ ] ❌ "rpc is not a function" → THIS IS THE BUG WE FIXED - baseProvider issue
- [ ] ❌ Products don't save → Check opportunity_products table
- [ ] ❌ Console shows other error → Check error details

**Console Output**:

---

## Test 4: General Console Error Check

**Goal**: Ensure no errors during normal operations

### Steps

1. [ ] Clear browser console (`Ctrl+L` or `Cmd+K`)
2. [ ] Perform these actions:
   - [ ] Create a new contact
   - [ ] Update an organization
   - [ ] Delete a task
   - [ ] Navigate between 3-4 different pages
3. [ ] Review console for any red errors
4. [ ] Note any warnings (yellow) but focus on errors (red)

### Expected Behavior

- [ ] ✅ No red error messages
- [ ] ✅ No "rpc is not a function" errors
- [ ] ✅ No "Cannot read property of undefined" errors
- [ ] ✅ No "Unhandled promise rejection" errors
- [ ] ⚠️  Yellow warnings acceptable (non-critical)

### If Found Errors

List error messages here:

---

## Test 5: Bulk Operations (Optional)

**Goal**: Verify bulk operations work with RPC

### Steps

1. [ ] Navigate to **Products** list
2. [ ] Select 3-5 products using checkboxes
3. [ ] Click **Bulk Delete** button
4. [ ] Confirm deletion
5. [ ] Check console for errors
6. [ ] Verify all selected products deleted

### Expected Behavior

- [ ] ✅ All selected products deleted
- [ ] ✅ No console errors
- [ ] ✅ Toast shows success message

**Notes**:

---

## Test 6: Rapid Mutations (Edge Case)

**Goal**: Test race conditions don't cause RPC errors

### Steps

1. [ ] Open any Opportunity → Edit
2. [ ] Go to Products tab
3. [ ] Rapidly perform: Add product → Remove product → Add product (within 2 seconds)
4. [ ] Click Save
5. [ ] Check console for errors

### Expected Behavior

- [ ] ✅ Save succeeds with final state
- [ ] ✅ No race condition errors
- [ ] ✅ No "rpc is not a function" errors

**Notes**:

---

## Final Verification Summary

### Critical Tests (Must Pass)

- [ ] ✅ Test 1: Product deletion works without phantom bug
- [ ] ✅ Test 2: Product creation with distributors succeeds
- [ ] ✅ Test 3: Opportunity product sync works (NO RPC ERROR)
- [ ] ✅ Test 4: No console errors during normal operations

### Optional Tests (Nice to Have)

- [ ] ⚪ Test 5: Bulk operations work
- [ ] ⚪ Test 6: Rapid mutations handled gracefully

### Overall Status

**Date**: _______________
**Tester**: _______________
**Result**: [ ] PASS  [ ] FAIL

**Pass Criteria**: All 4 critical tests must pass ✅

**Notes/Issues Found**:

---

## Quick Commands Reference

```bash
# Start environment
npx supabase start
npm run dev

# Run automated tests first
./verify-task2.sh

# Check database after manual tests
npx supabase db shell < verify-task2.sql

# View console errors (browser)
F12 → Console tab
```

---

## Red Flags (Stop and Investigate)

If you see ANY of these, stop and investigate:

- ❌ `rpc is not a function` in console
- ❌ Products reappear after deletion
- ❌ Opportunity products don't save
- ❌ `Cannot read property of undefined`
- ❌ Any unhandled promise rejections

---

**Do NOT claim task complete unless ALL critical tests pass**
