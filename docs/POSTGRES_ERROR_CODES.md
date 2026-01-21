# PostgreSQL Error Codes Reference for Crispy CRM

**Version:** 1.0
**Last Updated:** January 21, 2026
**Scope:** Errors likely to appear in Crispy CRM operations

---

## Quick Reference Table

| Code | Class | Error Name | Common in Crispy | Example Scenario | User Message |
|------|-------|-----------|------------------|------------------|---|
| **23502** | Integrity | NOT NULL Constraint | HIGH | Missing required field in form | "[Field Name] is required." |
| **23503** | Integrity | Foreign Key Constraint | VERY HIGH | Delete principal with opportunities | "Cannot delete — other records depend on this." |
| **23505** | Integrity | Unique Constraint | HIGH | Duplicate contact email/org name | "This [name/email] is already in use." |
| **23514** | Integrity | Check Constraint | MEDIUM | Invalid enum/stage value | "Invalid value provided. Please check your input." |
| **28P01** | Auth | Invalid Password | LOW | Wrong password in service account | "Invalid credentials. Please try again." |
| **42501** | Auth | Insufficient Privilege | MEDIUM | RLS deny on update | "You don't have permission for this action." |
| **PGRST202** | Supabase | RLS Violation | MEDIUM | User without access tries to read | "You don't have access to this record." |
| **PGRST301** | Supabase | JWT Expired | MEDIUM | Session timeout | "Your session expired. Please sign in again." |
| **NETWORK** | Client | Connection Failed | MEDIUM | Internet down during sync | "Connection issue. Please check your internet and try again." |
| **TIMEOUT** | Client | Request Timeout | LOW | Very slow network | "Request timed out. Please try again." |

---

## Detailed Error Codes

### Integrity Constraint Violations (Class 23)

#### 23502 - NOT NULL Constraint Violation

**PostgreSQL Message Pattern:**
```
null value in column 'X' of relation 'Y' violates not-null constraint
```

**Crispy CRM Occurrence:** Creating/updating records with missing required fields
- Contact: `first_name`, `last_name`, `email`
- Organization: `name`
- Opportunity: `organization_id`, `stage`

**Field Extraction:** YES (extracts from `column 'X'`)
```typescript
// In errorMapper.ts
const match = message.match(/column ['"](\w+)['"]/i);
// Extracts field name: "first_name" → displays as "First Name"
```

**User Message:**
```
[Field Name] is required.
```

**Example Handling:**
```typescript
try {
  await create("contacts", {
    data: {
      last_name: "Doe",
      email: "john@example.com"
      // Missing: first_name
    }
  });
} catch (err) {
  error(err);
  // Shows: "First Name is required."
}
```

---

#### 23503 - Foreign Key Constraint Violation

**PostgreSQL Message Pattern:**
```
insert or update on table "X" violates foreign key constraint "Y"
DETAIL:  Key (Z)=(value) is not present in table "Y".
```

**Most Common Scenarios in Crispy CRM:**
1. **Delete with dependent records** (MOST COMMON)
   - Deleting principal with active opportunities
   - Deleting organization with contacts
   - Deleting contact with notes/activities

2. **Invalid reference on create/update**
   - Creating contact with non-existent `organization_id`
   - Creating opportunity with deleted principal

**Field Extraction:** YES (extracts from constraint details)

**User Message:**
```
// For DELETE operations:
"Cannot delete — other records depend on this."

// For CREATE/UPDATE with invalid reference:
"Invalid selection — referenced record not found."
```

**Example Handling:**
```typescript
// Scenario 1: User tries to delete principal
try {
  await delete("principals", { id: "principal-123" });
} catch (err) {
  error(err);
  // Shows: "Cannot delete — other records depend on this."
  // (because principal has opportunities)
}

// Scenario 2: User tries to create contact with invalid org
try {
  await create("contacts", {
    data: {
      first_name: "John",
      organization_id: "invalid-org-id" // doesn't exist
    }
  });
} catch (err) {
  error(err);
  // Shows: "Invalid selection — referenced record not found."
}
```

**Prevention:** Use ReferenceInput/ReferenceField to ensure valid selections

---

#### 23505 - Unique Constraint Violation

**PostgreSQL Message Pattern:**
```
duplicate key value violates unique constraint "X"
DETAIL:  Key (Y)=(value) already exists.
```

**Crispy CRM Occurrence:** Most common constraint violation
- Email duplicates (contacts, sales users)
- Organization names (in some cases)
- Unique combinations (e.g., contact + organization)

**Field Extraction:** YES (via constraint name analysis)

**User Messages:**
```typescript
// For "email" field
"This email is already in use."

// For "name" field
"This name is already in use. Please choose a different name."

// Generic fallback
"This already exists. Please use a different value."
```

**Example Handling:**
```typescript
try {
  await create("contacts", {
    data: {
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com" // Already exists
    }
  });
} catch (err) {
  error(err);
  // Shows: "This email is already in use."
}
```

**User Experience:**
- Form should highlight the duplicate field
- Show a link to "View existing record"
- Suggest using a different email or linking to existing contact

---

#### 23514 - Check Constraint Violation

**PostgreSQL Message Pattern:**
```
new row for relation "X" violates check constraint "Y"
```

**Crispy CRM Occurrence:** Invalid enum values or domain constraints
- Invalid opportunity stage
- Invalid activity type
- Invalid contact department

**Field Extraction:** PARTIAL (constraint name gives hint, not the value)

**User Message:**
```
"Invalid value provided. Please check your input."
```

**Example Handling:**
```typescript
try {
  await update("opportunities", {
    id: "opp-123",
    data: {
      stage: "invalid_stage" // Must be from enum
    }
  });
} catch (err) {
  error(err);
  // Shows: "Invalid value provided. Please check your input."
}
```

**Prevention:** Use SelectInput with enum validation

---

### Authentication Errors (Class 28, 42)

#### 28P01 - Invalid Password

**PostgreSQL Message Pattern:**
```
password authentication failed for user "X"
```

**Crispy CRM Occurrence:** Service account connection issues (rare in UI)
- Usually indicates infrastructure problem
- May appear in Edge Functions that use service role

**User Message:**
```
"Invalid credentials. Please try again."
```

**Handling:**
```typescript
if (msg.includes("28p01") || msg.includes("password")) {
  return "Invalid credentials. Please try again.";
}
```

---

#### 42501 - Insufficient Privilege

**PostgreSQL Message Pattern:**
```
permission denied for schema "public"
permission denied for table "X"
```

**Crispy CRM Occurrence:** RLS policy deny (should be caught by PGRST202 first)
- User role lacks column-level grants
- Schema-level permission issue

**User Message:**
```
"You don't have permission for this action."
```

---

### Supabase/PostgREST Errors

#### PGRST202 - Row Level Security Policy Violation

**Supabase Message Pattern:**
```
new row violates row-level security policy for table "X"
```

**Crispy CRM Occurrence:** RLS policy deny
- Manager tries to read rep-only data
- Rep tries to update another rep's opportunity
- User without access to record

**User Message:**
```
"You don't have access to this record."
```

**Example:**
```typescript
// User tries to edit another user's contact
try {
  await update("contacts", {
    id: "contact-456",
    data: { notes: "..." }
  });
} catch (err) {
  error(err);
  // Shows: "You don't have access to this record."
}
```

**Debug Note:** Check RLS policies in Supabase console if this appears unexpectedly

---

#### PGRST301 - JWT Token Expired

**Supabase Message Pattern:**
```
JWT token has expired
invalid token
```

**Crispy CRM Occurrence:** Session timeout during long operations
- User leaves app open > 1 hour
- Long import/export operation
- Network latency causing timeout

**User Message:**
```
"Your session expired. Please sign in again."
```

**Handling Strategy:**
```typescript
if (isAuthErrorType(err)) {
  // Redirect to login
  logout();
  navigate("/login");

  // Also show notification
  error(err);
  // Shows: "Your session expired. Please sign in again."
}
```

**Prevention:**
- Refresh token automatically
- Show "Session ending in X minutes" warning
- Save form state before redirect

---

### Network & Client Errors

#### Network Errors

**JavaScript/Fetch Message Patterns:**
```
Failed to fetch
NetworkError
Connection refused
getaddrinfo ENOTFOUND hostname
ECONNABORTED
```

**Crispy CRM Occurrence:** Common during slow/unstable networks
- Mobile users on cellular
- WiFi disconnects during import
- Proxy timeouts

**User Message:**
```
"Connection issue. Please check your internet and try again."
```

**Handling:**
```typescript
if (isNetworkErrorType(err)) {
  // Show retry button
  error(err);
  // Shows: "Connection issue. Please check your internet..."

  // Optionally, retry automatically
  setTimeout(() => retry(), 2000);
}
```

---

#### Timeout Errors

**Message Patterns:**
```
timeout
timed out
Request timeout
ETIMEDOUT
```

**Crispy CRM Occurrence:** Slow network or server
- Large import/export (slow query)
- High server load
- Mobile on slow connection

**User Message:**
```
"Request timed out. Please try again."
```

**Handling:**
```typescript
try {
  await importLargeFile(file);
} catch (err) {
  if (msg.includes("timeout")) {
    error(err);
    // Shows: "Request timed out. Please try again."
    showRetryButton(true);
  } else {
    error(err);
  }
}
```

**Prevention:**
- Break large imports into batches
- Show progress indicator
- Implement exponential backoff retry

---

## Error Code by Feature

### Contact Management

| Error | Most Likely Cause | Recovery |
|-------|------------------|----------|
| 23503 | Delete contact with activities | Show "can't delete" message |
| 23505 | Duplicate email | Suggest merging contacts |
| 23502 | Missing first/last name | Highlight required fields |
| PGRST202 | Viewing other rep's contact | Show access denied |

### Organization Management

| Error | Most Likely Cause | Recovery |
|-------|------------------|----------|
| 23503 | Delete org with contacts | Show dependent records |
| 23505 | Duplicate org name | Suggest merge or rename |
| NETWORK | Large CSV import | Show batch progress, allow retry |

### Opportunity Management

| Error | Most Likely Cause | Recovery |
|-------|------------------|----------|
| 23503 | Delete opportunity with activities | Show "can't delete" message |
| 23514 | Invalid stage value | Show available stages |
| 23502 | Missing organization | Require org selection |

### Data Import/Export

| Error | Most Likely Cause | Recovery |
|-------|------------------|----------|
| TIMEOUT | Large CSV file (>5000 rows) | Split into batches |
| NETWORK | Connection lost during upload | Show resume option |
| 23505 | Duplicate records in CSV | Show conflict resolution |

---

## Testing Error Codes

### Mock Error for Testing

```typescript
// 23503: Foreign Key Violation
const fkError = new Error(
  'insert or update on table "opportunities" violates foreign key constraint'
);

// 23505: Unique Constraint
const uniqueError = new Error(
  'duplicate key value violates unique constraint "contacts_email_key"'
);

// 23502: Not Null Constraint
const notNullError = new Error(
  "null value in column 'first_name' of relation 'contacts' violates not-null constraint"
);

// PGRST301: JWT Expired
const jwtError = new Error("JWT token has expired");

// Network Error
const networkError = new Error("Failed to fetch");
```

### Test Template

```typescript
describe("Error Code Handling", () => {
  it("handles 23505 (unique constraint)", () => {
    const error = new Error(
      'duplicate key value violates unique constraint "email"'
    );
    const msg = mapErrorToUserMessage(error);
    expect(msg).toContain("already in use");
  });

  it("handles 23503 (foreign key on delete)", () => {
    const error = new Error(
      'delete on table "principals" violates foreign key constraint'
    );
    const msg = mapErrorToUserMessage(error, { operation: "delete" });
    expect(msg).toContain("Cannot delete");
  });

  it("handles PGRST301 (JWT expired)", () => {
    const error = new Error("JWT token has expired");
    const msg = mapErrorToUserMessage(error);
    expect(msg).toContain("session expired");
  });

  it("handles network errors", () => {
    const error = new Error("Failed to fetch");
    const msg = mapErrorToUserMessage(error);
    expect(msg).toContain("Connection issue");
  });
});
```

---

## Debugging Guide

### How to Find the Error Code

**In Browser Console:**
```javascript
// Look for error objects with these properties
error.code        // "23503" or "PGRST301"
error.message     // Full message
error.details     // Postgres DETAIL field
error.hint        // Postgres HINT field (useful!)
```

**In Server Logs:**
```
[DataProvider Error] {
  error: "violates foreign key constraint",
  code: "23503",
  details: "Key (principal_id)=(xyz) is not present in table \"principals\"."
}
```

**In Supabase Dashboard:**
1. Go to SQL Editor
2. Run query that causes error
3. Check error message in console
4. Note the code and pattern

### Common Debugging Mistakes

❌ **Mistake:** Ignoring the DETAIL field
```
DETAIL: Key (organization_id)=(invalid-id) is not present in table "organizations".
```
✅ **Fix:** The DETAIL tells you EXACTLY what the problem is!

❌ **Mistake:** Not checking constraint name
```
constraint "contacts_email_key"
```
✅ **Fix:** Constraint name tells you which field has the issue!

❌ **Mistake:** Thinking 23505 errors are always the same
```
- Email duplicate: "This email is already in use."
- Name duplicate: "This name is already in use."
- Generic duplicate: "This already exists."
```
✅ **Fix:** Context matters! Our mapErrorToUserMessage() handles this.

---

## Production Monitoring

### Sentry/Error Tracking Setup

Configure your error tracking to watch for:

```javascript
// Alert on unexpected technical errors (should be caught by mapping)
if (error.message.includes("violates") &&
    !error.message.includes("Cannot delete")) {
  // Technical error slipped through sanitization
  Sentry.captureException(error, {
    tags: {
      errorHandling: "unmapped",
      type: "constraint_violation"
    }
  });
}
```

### Metrics to Track

1. **Error frequency by code**
   - 23503 = too many delete attempts on used records?
   - 23505 = data quality issues?
   - PGRST301 = session timeout frequency?

2. **User-visible errors**
   - Are sanitized messages appearing?
   - Are any raw technical errors visible?

3. **Error recovery**
   - Do users retry after network errors?
   - What % complete their operation after error?

---

## Reference Implementation

See:
- **Error Mapper:** `/src/utils/errorMapper.ts`
- **Error Patterns:** `/src/atomic-crm/ERROR_PATTERNS.md`
- **Strategy:** `/docs/ERROR_HANDLING_STRATEGY.md`
- **Quick Start:** `/docs/ERROR_HANDLING_QUICK_START.md`

---

**Last Updated:** January 21, 2026
**Maintained By:** Engineering Team
**Feedback:** Update when new error codes appear in production
