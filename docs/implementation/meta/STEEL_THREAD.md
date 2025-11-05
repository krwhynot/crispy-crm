# Steel Thread Implementation Guide
**Purpose:** Prove the architecture works end-to-end with minimal functionality
**Target:** Complete in Week 1 to validate all layers
**Confidence:** 95% (well-established pattern)

---

## What is a Steel Thread?

A steel thread is the thinnest possible implementation that touches every layer of your architecture. It proves your stack works before building features.

**Why "Steel"?** Strong enough to pull everything together, thin enough to build quickly.

---

## CRM Steel Thread: Contact CRUD

The simplest complete feature that validates all layers:

```
User → UI → Validation → API → Database → UI → User
```

### Why Contacts First?
- Simpler than Organizations (no complex relationships)
- Simpler than Opportunities (no multiple foreign keys)
- Still requires JSONB arrays (email, phone)
- Tests all authentication flows
- Validates RLS policies

---

## Implementation Sequence (P1-E5-S1)

### Phase 1: Database Layer (1 hour)
```sql
-- Already exists from Phase 1
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email JSONB DEFAULT '[]',
  phone JSONB DEFAULT '[]'
);

-- Test: Can insert/query via Supabase UI
```

### Phase 2: Validation Layer (1 hour)
```typescript
// src/atomic-crm/validation/contacts.ts
const contactSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.array(emailSchema).default([]),
  phone: z.array(phoneSchema).default([])
});

// Test: Schema validates sample data
```

### Phase 3: Data Provider (2 hours)
```typescript
// Extend unifiedDataProvider.ts
case 'contacts':
  return handleContactsCRUD(params);

// Test: Provider returns data
```

### Phase 4: List View (2 hours)
```typescript
// src/atomic-crm/contacts/ContactList.tsx
export const ContactList = () => (
  <List>
    <Datagrid>
      <TextField source="first_name" />
      <TextField source="last_name" />
    </Datagrid>
  </List>
);

// Test: List displays contacts
```

### Phase 5: Create Form (2 hours)
```typescript
// src/atomic-crm/contacts/ContactCreate.tsx
export const ContactCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="first_name" />
      <TextInput source="last_name" />
    </SimpleForm>
  </Create>
);

// Test: Can create new contact
```

### Phase 6: Edit Form (1 hour)
```typescript
// Copy Create, change to Edit component
// Test: Can modify existing contact
```

### Phase 7: Delete Action (30 min)
```typescript
// Add delete button to list
// Test: Can remove contact
```

---

## Success Criteria

The steel thread is complete when:

- [ ] User can log in
- [ ] User sees contact list (even if empty)
- [ ] User can create a contact
- [ ] Contact appears in list
- [ ] User can edit the contact
- [ ] Changes persist
- [ ] User can delete contact
- [ ] Contact disappears from list
- [ ] Logout/login preserves data
- [ ] JSONB arrays work (email/phone)

---

## Validation Points

### 1. Authentication Flow
- Login works
- Session persists
- Logout works
- Protected routes redirect

### 2. Database Connection
- Queries execute
- Mutations work
- RLS policies apply
- Transactions complete

### 3. State Management
- TanStack Query caches
- Optimistic updates work
- Invalidation triggers
- Error states display

### 4. UI Rendering
- Components load
- Forms validate
- Feedback shows
- Navigation works

### 5. Error Handling
- Network failures caught
- Validation errors display
- User messages clear
- Recovery possible

---

## Common Issues & Solutions

### Issue: "Permission denied for table"
**Cause:** Missing GRANT permissions
**Fix:** Add GRANT statements to migration
```sql
GRANT ALL ON contacts TO authenticated;
GRANT USAGE ON SEQUENCE contacts_id_seq TO authenticated;
```

### Issue: JSONB arrays not saving
**Cause:** Data format mismatch
**Fix:** Ensure array structure:
```javascript
email: [{ email: "test@example.com", type: "Work" }]
// NOT: email: ["test@example.com"]
```

### Issue: Create form doesn't appear
**Cause:** Lazy loading not configured
**Fix:** Check index.ts exports
```typescript
const ContactCreate = React.lazy(() => import("./ContactCreate"));
```

### Issue: Changes don't persist
**Cause:** Missing await or wrong return
**Fix:** Check data provider returns
```typescript
return { data: result[0] }; // Must return data key
```

---

## Time Investment vs Value

**Time:** ~10 hours total
**Value:**
- Validates entire stack
- Finds integration issues early
- Creates working reference code
- Builds team confidence

**ROI:** Finding one architecture issue now saves days of refactoring later

---

## After Steel Thread Success

With contacts working end-to-end:

1. **Copy patterns** to Organizations (P2-E1)
2. **Add complexity** gradually (relationships)
3. **Reference working code** when stuck
4. **Keep steel thread** as test baseline

---

## Steel Thread Anti-Patterns

### ❌ DON'T
- Add fancy features (search, filters)
- Optimize performance
- Handle edge cases
- Build reusable components
- Add complex validation

### ✅ DO
- Prove the stack works
- Keep it absolutely minimal
- Document issues found
- Create reference patterns
- Build confidence

---

## Measuring Success

The steel thread succeeds when a non-technical user can:

1. Open the app
2. Log in with test credentials
3. Create a contact named "Test User"
4. See it in the list
5. Edit it to "Test User 2"
6. Delete it
7. Confirm it's gone

**If this works, your architecture is sound.**

---

## Quick Commands

```bash
# Reset and start fresh
npm run db:local:reset
npm run dev

# Test auth
# Login: admin@test.com / password123

# Verify database
npx supabase db query "SELECT * FROM contacts"

# Check logs if issues
docker logs crispy-crm_supabase_db_1
```

---

## Next Steps After Steel Thread

1. ✅ Steel thread complete
2. → Build Organizations module (P2-E1)
3. → Add Contacts-Orgs relationship (P2-E5)
4. → Build Opportunities with FKs (P3-E1)
5. → Add complex features incrementally

---

*The steel thread is your North Star - if something breaks later, compare it to this working reference.*