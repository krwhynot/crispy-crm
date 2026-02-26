# WF-01: Opportunity Closure Validation Trigger

## Overview
Database-level validation that enforces business rule: opportunities closed as won/lost **must** have a corresponding reason.

## Migration Details
- **File**: `supabase/migrations/20260125041610_opportunity_closure_validation.sql`
- **Status**: ✅ Applied and tested
- **Function**: `validate_opportunity_closure()`
- **Trigger**: `trg_validate_opportunity_closure`

## Business Rule
```
IF stage = 'closed_won' THEN win_reason REQUIRED
IF stage = 'closed_lost' THEN loss_reason REQUIRED
```

## Valid ENUM Values

### win_reason
- `relationship`
- `product_quality`
- `price_competitive`
- `timing`
- `other`

### loss_reason
- `price_too_high`
- `no_authorization`
- `competitor_relationship`
- `product_fit`
- `timing`
- `no_response`
- `other`

## Test Results

### Test 1: Invalid - closed_won without win_reason ❌
```sql
UPDATE opportunities SET stage = 'closed_won' WHERE id = 32;
```
**Result**: `ERROR: win_reason is required when closing opportunity as won`

### Test 2: Invalid - closed_lost without loss_reason ❌
```sql
UPDATE opportunities SET stage = 'closed_lost' WHERE id = 32;
```
**Result**: `ERROR: loss_reason is required when closing opportunity as lost`

### Test 3: Valid - closed_won with win_reason ✅
```sql
UPDATE opportunities
SET stage = 'closed_won', win_reason = 'price_competitive'
WHERE id = 32;
```
**Result**: Success - Updated to closed_won

### Test 4: Valid - closed_lost with loss_reason ✅
```sql
UPDATE opportunities
SET stage = 'closed_lost', loss_reason = 'price_too_high'
WHERE id = 32;
```
**Result**: Success - Updated to closed_lost

## Error Messages
Frontend will receive structured PostgreSQL errors:
```json
{
  "code": "check_violation",
  "message": "win_reason is required when closing opportunity as won",
  "detail": "Opportunity stage cannot be set to closed_won without specifying a win reason",
  "hint": "Please select a reason from: relationship, product_quality, price_competitive, timing, or other"
}
```

## Trigger Configuration
```sql
CREATE TRIGGER trg_validate_opportunity_closure
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  WHEN (NEW.stage IN ('closed_won', 'closed_lost'))
  EXECUTE FUNCTION validate_opportunity_closure();
```

### Key Features
- **BEFORE UPDATE**: Validates before changes are committed
- **FOR EACH ROW**: Validates every row individually
- **WHEN clause**: Only fires when stage changes to closed_won/closed_lost (performance optimization)
- **SECURITY DEFINER**: Runs with function owner's privileges
- **search_path = public**: Prevents search path attacks

## Frontend Integration
The data provider will catch PostgreSQL exceptions and can display user-friendly messages:

```typescript
try {
  await dataProvider.update('opportunities', {
    id: opportunityId,
    data: { stage: 'closed_won' }
  });
} catch (error) {
  if (error.code === 'check_violation') {
    // Show user-friendly message from error.hint
    notify(error.hint, { type: 'error' });
  }
}
```

## Why Database-Level Validation?

### Defense in Depth
1. **Frontend validation** - UX, instant feedback
2. **Provider validation** - Zod schemas at API boundary
3. **Database validation** - Last line of defense (THIS LAYER)

### Protection Against
- API bypasses (direct SQL, Supabase client)
- Bulk updates without proper checks
- Future code changes that skip validation
- Integration bugs
- Migration scripts that update data

### Benefits
- **Guaranteed consistency**: Cannot be bypassed
- **Clear error messages**: `USING ERRCODE`, `DETAIL`, `HINT`
- **Performance**: `WHEN` clause prevents unnecessary function calls
- **Auditability**: Trigger definition visible in schema

## Maintenance Notes
- If ENUM values change, update `HINT` messages in function
- Consider adding similar triggers for other critical workflows
- Monitor error logs for validation failures (may indicate UX issues)

## Related Documentation
- `DATABASE_LAYER.md` - RLS, Views & Triggers
- `PROVIDER_RULES.md` - Validation at boundary
- `DOMAIN_INTEGRITY.md` - Schemas & Types
