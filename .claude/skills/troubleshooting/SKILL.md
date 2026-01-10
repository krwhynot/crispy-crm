---
name: troubleshooting
description: Diagnose and resolve build failures, performance issues, and deployment problems using the RAPID framework. Covers TypeScript/build errors, performance bottlenecks, Edge Functions, environment configs. Parallel specialist to fail-fast-debugging (bugs) and root-cause-tracing (code investigation).
---

# Troubleshooting Guide

## Purpose

Systematic diagnosis and resolution of infrastructure-level issues: build failures, performance problems, deployment errors, and environment misconfigurations. Uses the RAPID framework for structured troubleshooting.

## When to Use

Activate this skill for:
- Build/compile errors (TypeScript, Vite, webpack)
- Performance issues (slow queries, memory leaks, N+1)
- Deployment failures (Edge Functions, production errors)
- Environment problems (missing env vars, CORS, auth errors)
- Dependency conflicts (npm, peer dependencies)

## When NOT to Use (Handoffs)

| Symptom | Hand Off To |
|---------|-------------|
| Code bugs (logic errors, wrong behavior) | **fail-fast-debugging** |
| Call chain investigation (where is X set?) | **root-cause-tracing** |
| Code changes after diagnosis | **enforcing-principles** |

---

## RAPID Framework

### R - Reproduce
Confirm the issue is reproducible and gather exact error output.

```bash
# Capture exact error
npm run build 2>&1 | tee build-error.log

# Note environment
node --version
npm --version
npx supabase --version
```

### A - Analyze
Parse error messages, identify the failing component.

```bash
# TypeScript errors - get detailed output
npx tsc --noEmit --pretty 2>&1 | head -50

# Vite build errors
npm run build -- --debug

# Dependency tree issues
npm ls --all | grep -i error
```

### P - Propose
Form a hypothesis based on the error pattern.

| Error Pattern | Likely Cause |
|---------------|--------------|
| `Cannot find module 'X'` | Missing dependency or wrong import path |
| `Type 'X' is not assignable` | Type mismatch, need cast or fix |
| `CORS error` | Missing headers in Edge Function |
| `401 Unauthorized` | Missing or expired auth token |
| `500 Internal Server Error` | Server-side crash, check logs |

### I - Implement
Apply the minimal fix for the hypothesis.

### D - Document
Record what worked for future reference.

---

## Common Build Errors

### TypeScript Errors

```bash
# Check types without building
npx tsc --noEmit

# Find specific error location
npx tsc --noEmit 2>&1 | grep -A 3 "error TS"
```

**Common Fixes:**

| Error | Fix |
|-------|-----|
| `TS2307: Cannot find module` | Check import path, run `npm install` |
| `TS2322: Type 'X' is not assignable` | Fix type or add assertion |
| `TS7006: Parameter implicitly has 'any'` | Add explicit type annotation |
| `TS2339: Property does not exist` | Check object shape, add optional chaining |

### Vite Build Errors

```bash
# Debug build
npm run build -- --debug

# Check for circular dependencies
npx madge --circular src/
```

**Common Issues:**

| Error | Fix |
|-------|-----|
| `Failed to resolve import` | Check file exists, correct extension |
| `Circular dependency` | Refactor to break the cycle |
| `out of memory` | Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096` |

### Dependency Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for peer dependency issues
npm ls 2>&1 | grep "peer dep"

# Force resolution
npm install --legacy-peer-deps
```

---

## Performance Troubleshooting

### Identifying Slow Queries

```typescript
// Add timing to Supabase queries
const start = performance.now();
const { data, error } = await supabase.from('contacts').select('*');
console.log(`Query took ${performance.now() - start}ms`);
```

### N+1 Query Detection

```typescript
// BAD - N+1 pattern
const contacts = await supabase.from('contacts').select('*');
for (const contact of contacts.data) {
  const notes = await supabase
    .from('notes')
    .select('*')
    .eq('contact_id', contact.id); // N queries!
}

// GOOD - Single query with join
const contacts = await supabase
  .from('contacts')
  .select('*, notes(*)');
```

### Memory Leak Detection

```bash
# Check heap usage over time
node --expose-gc -e "
  setInterval(() => {
    global.gc();
    console.log(process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
  }, 1000);
"
```

### React Performance

```typescript
// Use React DevTools Profiler
// Or add console timing:
console.time('render');
// ... component renders
console.timeEnd('render');
```

---

## Deployment Troubleshooting

### Edge Function Errors

```bash
# Check function logs
npx supabase functions logs my-function --local

# Test locally first
npx supabase functions serve my-function --env-file .env.local

# Deploy with debug output
npx supabase functions deploy my-function --debug
```

**Common Edge Function Issues:**

| Error | Cause | Fix |
|-------|-------|-----|
| `CORS error` | Missing headers | Add `corsHeaders` to response |
| `TypeError: fetch failed` | Network/DNS issue | Check URL, use full domain |
| `ReferenceError: X is not defined` | Missing import | Add Deno import |
| Timeout | Function too slow | Optimize or increase timeout |

### CORS Configuration

```typescript
// Required headers for Edge Functions
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Handle preflight
if (req.method === "OPTIONS") {
  return new Response("ok", { headers: corsHeaders });
}

// Include in all responses
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});
```

### Environment Variables

```bash
# Check which env vars are set
env | grep SUPABASE

# Verify .env file is loaded
cat .env.local

# Set secrets for Edge Functions
npx supabase secrets set MY_SECRET=value
npx supabase secrets list
```

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

## Quick Diagnostic Commands

```bash
# Full system check
npm run build && npx tsc --noEmit && npm test

# Database connection test
npx supabase db reset --dry-run

# Local stack health
npx supabase status

# Dependency audit
npm audit
npm outdated
```

---

## Escalation Path

If troubleshooting fails after 2 attempts:

1. **Document findings** - What was tried, what failed
2. **Use mcp__zen__thinkdeep** - For architectural analysis
3. **Check if it's a code bug** - Hand off to fail-fast-debugging
4. **Check if it needs tracing** - Hand off to root-cause-tracing

---

## Related Skills

- **fail-fast-debugging** - For code bugs (logic errors)
- **root-cause-tracing** - For call chain investigation
- **supabase-cli** - For Supabase CLI commands
- **supabase-crm** - For database/RLS patterns
- **verification-before-completion** - Run before claiming "fixed"
