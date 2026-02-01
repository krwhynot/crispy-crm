# RAPID Framework - Complete Reference

Structured troubleshooting methodology for infrastructure-level issues. Each step builds on the previous one.

---

## R - Reproduce

Confirm the issue is reproducible and gather exact error output.

```bash
# Capture exact error
npm run build 2>&1 | tee build-error.log

# Note environment
node --version
npm --version
npx supabase --version
```

## A - Analyze

Parse error messages, identify the failing component.

```bash
# TypeScript errors - get detailed output
npx tsc --noEmit --pretty 2>&1 | head -50

# Vite build errors
npm run build -- --debug

# Dependency tree issues
npm ls --all | grep -i error
```

## P - Propose

Form a hypothesis based on the error pattern.

| Error Pattern | Likely Cause |
|---------------|--------------|
| `Cannot find module 'X'` | Missing dependency or wrong import path |
| `Type 'X' is not assignable` | Type mismatch, need cast or fix |
| `CORS error` | Missing headers in Edge Function |
| `401 Unauthorized` | Missing or expired auth token |
| `500 Internal Server Error` | Server-side crash, check logs |

## I - Implement

Apply the minimal fix for the hypothesis.

## D - Document

Record what worked for future reference.

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
