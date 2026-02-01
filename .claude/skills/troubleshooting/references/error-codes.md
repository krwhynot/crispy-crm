# Error Code Reference and Resolution Patterns

Common HTTP errors, Supabase-specific errors, and their resolution patterns.

---

## Error Pattern Quick Reference

| Error Pattern | Likely Cause |
|---------------|--------------|
| `Cannot find module 'X'` | Missing dependency or wrong import path |
| `Type 'X' is not assignable` | Type mismatch, need cast or fix |
| `CORS error` | Missing headers in Edge Function |
| `401 Unauthorized` | Missing or expired auth token |
| `500 Internal Server Error` | Server-side crash, check logs |

---

## HTTP Error Codes

### 401 Unauthorized

```typescript
// Check auth header is present
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response("Missing Authorization header", { status: 401 });
}

// Verify token
const { data: { user }, error } = await supabase.auth.getUser(
  authHeader.replace("Bearer ", "")
);
```

### 403 Forbidden

Usually an RLS policy issue:

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'contacts';

-- Test as authenticated user
SET request.jwt.claim.role = 'authenticated';
SELECT * FROM contacts;
```

### 500 Internal Server Error

```bash
# Check Supabase logs
npx supabase logs --type api

# Check Edge Function logs
npx supabase functions logs <function-name>

# Enable verbose logging in code
console.error("Full error:", JSON.stringify(error, null, 2));
```

---

## Common Edge Function Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `CORS error` | Missing headers | Add `corsHeaders` to response |
| `TypeError: fetch failed` | Network/DNS issue | Check URL, use full domain |
| `ReferenceError: X is not defined` | Missing import | Add Deno import |
| Timeout | Function too slow | Optimize or increase timeout |
