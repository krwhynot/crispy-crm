# Security: SQL Injection Prevention

## Purpose

Document SQL injection prevention patterns using parameterized queries and Zod validation.

## Pattern: Parameterized Queries (Supabase)

```typescript
// ✅ CORRECT - Supabase client uses parameterized queries
const { data, error } = await supabase
  .from('contacts')
  .select('*')
  .eq('email', userInput); // Safe - parameterized

// ✅ CORRECT - Multiple conditions
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('organization_id', orgId)
  .ilike('name', `%${searchTerm}%`); // Safe - parameterized

// ❌ WRONG - Raw SQL with string interpolation
const query = `SELECT * FROM contacts WHERE email = '${userInput}'`; // SQL injection!
await supabase.rpc('unsafe_query', { query });
```

## Pattern: Zod Validation (API Boundary)

```typescript
// Zod schema validates input BEFORE database query
const contactSchema = z.object({
  email: z.string().email(), // Validates email format
  phone: z.string().regex(/^\d{3}-\d{4}$/), // Validates phone format
  organization_id: z.number().int().positive(), // Validates ID
});

// Validate before query
try {
  const validated = contactSchema.parse(userInput);
  // Safe to use validated.email, validated.phone
  await supabase.from('contacts').insert(validated);
} catch (error) {
  // Invalid input rejected before reaching database
}
```

## Pattern: RPC Function Validation

```typescript
// Define RPC schema
const createContactRpcSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
});

// Validate RPC input
export async function createContactRpc(params: unknown) {
  const validated = createContactRpcSchema.parse(params);

  const { data, error } = await supabase.rpc('create_contact', validated);

  if (error) throw error;
  return data;
}
```

## Quick Reference

| Pattern | Safe | Why |
|---------|------|-----|
| Supabase `.eq()`, `.ilike()` | ✅ | Parameterized |
| Zod validation before query | ✅ | Validates input |
| String interpolation in SQL | ❌ | SQL injection |
| User input in raw SQL | ❌ | SQL injection |

## Related Resources

- [security-csv.md](security-csv.md) - CSV upload validation
- [security-rls.md](security-rls.md) - RLS policies
- [validation-basics.md](validation-basics.md) - Zod patterns

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
