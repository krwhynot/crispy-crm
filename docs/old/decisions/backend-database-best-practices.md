# Backend & Database Best Practices Report

> **Generated:** December 3, 2025
> **Stack:** Supabase 2.75.1 (JS) / 2.63.1 (CLI) | PostgreSQL 17 | ra-supabase-core 3.5.1
> **Sources:** Supabase Docs, OWASP, Microsoft Azure PostgreSQL, JWT Security Standards

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Supabase Production Checklist](#supabase-production-checklist)
3. [PostgreSQL 17 Best Practices](#postgresql-17-best-practices)
4. [Row-Level Security (RLS) Patterns](#row-level-security-rls-patterns)
5. [JWT Authentication Best Practices](#jwt-authentication-best-practices)
6. [Realtime Subscriptions](#realtime-subscriptions)
7. [React Admin + Supabase Integration](#react-admin--supabase-integration)
8. [Backup & Recovery Strategy](#backup--recovery-strategy)
9. [Compliance Checklist](#compliance-checklist)
10. [References](#references)

---

## Executive Summary

This document consolidates industry standards and best practices for the Crispy CRM backend stack. Key areas of focus:

| Area | Priority | Status |
|------|----------|--------|
| RLS Policies | **CRITICAL** | Must enable on all public tables |
| JWT Expiry (3600s) | **GOOD** | Within recommended 1-hour default |
| SSL/TLS Enforcement | **CRITICAL** | Must enable for production |
| Daily Backups | **GOOD** | Consider PITR for RPO < 24h |
| Realtime Auth | **IMPORTANT** | Use private channels with RLS |

---

## Supabase Production Checklist

### Security (MUST-HAVES)

| Requirement | Description | Action |
|-------------|-------------|--------|
| **Enable RLS** | Tables without RLS allow any client to access/modify data | `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;` |
| **SSL Enforcement** | Encrypt data in transit | Enable in Dashboard → Database Settings |
| **Network Restrictions** | Limit database access by IP | Configure in Dashboard → Database Settings |
| **MFA for Admin** | Protect Supabase account | Enable 2FA on GitHub or Supabase account |
| **Email Confirmations** | Prevent spam signups | Enable in Settings → Auth |
| **OTP Expiry** | Limit one-time password validity | Set to ≤3600 seconds (1 hour) |
| **Custom SMTP** | Reliable auth email delivery | Configure SendGrid, AWS SES, etc. |

### Security Best Practices

```sql
-- ALWAYS enable RLS on public tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Use Security Advisor to audit
-- Dashboard → Database → Security Advisor
```

### Performance Requirements

| Requirement | Description |
|-------------|-------------|
| **Indexes** | Add indexes for columns used in RLS policies and common queries |
| **Load Testing** | Use tools like k6 before production launches |
| **PITR** | Enable Point-in-Time Recovery for databases > 4GB |
| **Performance Advisor** | Regular review via Dashboard |

### Rate Limits (Default)

| Endpoint | Limit |
|----------|-------|
| Email sending | 2 emails/hour (without custom SMTP) |
| OTP requests | 360/hour |
| Token refresh | 1800/hour per IP |
| Anonymous sign-ins | 30/hour per IP |
| MFA challenges | 15/minute per IP |

---

## PostgreSQL 17 Best Practices

### Data Protection

#### Encryption in Transit
- **MUST:** Verify TLS connections with certificate validation
- **MUST:** Use TLS 1.3 for all connections
- **MUST:** Keep client TLS certificates updated

#### Encryption at Rest
- Data automatically encrypted with service-managed keys (SMK)
- Consider customer-managed keys (CMK) for compliance requirements
- Ultra-sensitive data: implement client-side encryption

### Identity & Access Management

```sql
-- Use roles appropriately
-- 'anon' = unauthenticated requests
-- 'authenticated' = logged-in users

-- NEVER expose service_role key to clients
-- ALWAYS specify roles in policies
CREATE POLICY "auth_only" ON profiles
  FOR SELECT
  TO authenticated  -- Explicit role specification
  USING ((SELECT auth.uid()) = user_id);
```

### Performance Configuration

| Parameter | Purpose | Recommendation |
|-----------|---------|----------------|
| `pg_stat_statements` | Query analysis | Enable for hot/slow query identification |
| `track_wal_io_timing` | WAL performance | Enable for I/O monitoring |
| Indexes | Query optimization | Add for all RLS policy columns |
| Connection pooling | Resource management | Use Supabase's built-in pooler |

### Security Hardening

```sql
-- Audit database security
-- Use Supabase Security Advisor regularly

-- Never store secrets in code
-- Use Vault for sensitive data
-- Dashboard → Database → Vault
```

---

## Row-Level Security (RLS) Patterns

### CRITICAL: Always Enable RLS

```sql
-- RLS is MANDATORY for all tables in public schema
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Without RLS, ANY client can read/modify ALL data
-- This is the #1 security vulnerability in Supabase apps
```

### Policy Types

#### SELECT Policies (Read Access)

```sql
-- Users can only see their own data
CREATE POLICY "Users view own data"
  ON profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Public data visible to everyone
CREATE POLICY "Public data visible"
  ON public_content FOR SELECT
  TO anon, authenticated
  USING (true);
```

#### INSERT Policies (Create)

```sql
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

#### UPDATE Policies

```sql
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)      -- Can only update own rows
  WITH CHECK ((SELECT auth.uid()) = user_id); -- Can't change ownership
```

#### DELETE Policies

```sql
CREATE POLICY "Users can delete own data"
  ON user_data FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

### Performance Optimization (CRITICAL)

#### 1. Add Indexes on RLS Columns

```sql
-- BEFORE: 171ms query time
-- AFTER: <0.1ms (99.94% improvement)
CREATE INDEX idx_contacts_user_id
  ON contacts USING btree (user_id);
```

#### 2. Wrap Functions with SELECT

```sql
-- BAD: Calls auth.uid() for EVERY row
USING (auth.uid() = user_id)

-- GOOD: Caches result, 94.97% faster
USING ((SELECT auth.uid()) = user_id)
```

#### 3. Always Add Query Filters

```sql
-- BAD: Relies only on RLS
const { data } = supabase.from('contacts').select()

-- GOOD: Explicit filter helps query planner
const { data } = supabase
  .from('contacts')
  .select()
  .eq('organization_id', orgId)
```

#### 4. Specify Roles in Policies

```sql
-- BAD: Runs for all roles
CREATE POLICY "..." USING (...)

-- GOOD: Skips execution for anon users (99.78% faster)
CREATE POLICY "..." TO authenticated USING (...)
```

#### 5. Use Security Definer Functions

```sql
-- For complex policies, use security definer functions
CREATE FUNCTION private.user_has_access(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs as creator, bypasses RLS
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = (SELECT auth.uid())
  );
END;
$$;

-- Use in policy
CREATE POLICY "org_access" ON contacts
  TO authenticated
  USING ((SELECT private.user_has_access(organization_id)));
```

### Multi-Tenant Pattern (Crispy CRM)

```sql
-- Organization-based isolation
CREATE POLICY "org_isolation" ON contacts
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );
```

### Common Pitfalls

| Pitfall | Impact | Solution |
|---------|--------|----------|
| `auth.uid()` returns `null` when unauthenticated | Silent policy failures | Check: `auth.uid() IS NOT NULL AND auth.uid() = user_id` |
| Views bypass RLS | Data leakage | Use `security_invoker = true` (PG 15+) |
| Missing `TO` clause | Unnecessary policy execution | Always specify `TO authenticated` or `TO anon` |
| Joins in policies | Performance degradation | Rewrite to use `IN` with subquery |

---

## JWT Authentication Best Practices

### Supabase Session Management

#### Token Lifecycle

| Token Type | Default Lifetime | Purpose |
|------------|------------------|---------|
| Access Token (JWT) | 3600s (1 hour) | Short-lived, contains claims |
| Refresh Token | Indefinite (single-use) | Exchange for new token pair |

#### Recommended JWT Expiry: 3600 seconds (1 hour)

**Why 1 hour is the sweet spot:**
- Shorter (< 5 min): Increases auth server load, clock skew issues
- Longer (> 1 hour): Increased security risk from stolen tokens
- Must be longer than your longest-running request

### JWT Security Standards (OWASP + Industry)

#### MUST-HAVE Claims

| Claim | Purpose | Supabase Default |
|-------|---------|------------------|
| `exp` | Expiration time | ✅ Configurable |
| `iat` | Issued at time | ✅ Automatic |
| `sub` | Subject (user ID) | ✅ Automatic |
| `aud` | Audience | ✅ Configurable |
| `iss` | Issuer | ✅ Automatic |
| `jti` | Unique token ID | ✅ Automatic |
| `session_id` | Session reference | ✅ Automatic |

#### Refresh Token Reuse Detection

Supabase implements automatic protection:
- Tokens can be reused within 10-second window (SSR support)
- Parent token reuse returns active child token
- Violation outside exceptions: **entire session terminated**

### Session Security Configuration

```javascript
// Supabase client configuration
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,      // Recommended: true
    persistSession: true,        // Store in localStorage
    detectSessionInUrl: true,    // Handle OAuth redirects
  }
})
```

### Pro Plan Session Controls

| Feature | Purpose | Recommendation |
|---------|---------|----------------|
| Time-boxed sessions | Force re-auth after X time | Enable for compliance |
| Inactivity timeout | End idle sessions | 15-30 minutes for sensitive apps |
| Single session per user | Prevent concurrent logins | Enable for high-security |

### OWASP Session Management Requirements

| Requirement | Implementation |
|-------------|----------------|
| 64-bit entropy minimum | ✅ Supabase uses CSPRNG |
| Regenerate on privilege change | Call `supabase.auth.signOut()` then re-auth |
| Secure cookie flags | ✅ Automatic for auth cookies |
| Absolute timeout | Configure in Dashboard |
| Log session lifecycle | Enable audit logging |

### Post-Auth Security Actions

```javascript
// Regenerate session after sensitive operations
async function changePassword(newPassword) {
  await supabase.auth.updateUser({ password: newPassword })
  // Session automatically refreshed with new tokens
}

// Force sign-out on security events
async function onSecurityEvent() {
  await supabase.auth.signOut({ scope: 'global' }) // All sessions
}
```

---

## Realtime Subscriptions

### Best Practices

#### 1. Always Use Private Channels

```typescript
// GOOD: Private channel with RLS
const channel = supabase.channel('room:123:messages', {
  config: { private: true }
})

// BAD: Public channel (no authorization)
const channel = supabase.channel('public-channel')
```

#### 2. Channel Naming Convention

```
Format: scope:id:entity

Examples:
- room:123:messages     - Messages in room 123
- org:456:updates       - Updates for organization 456
- user:789:notifications - User notifications
```

#### 3. RLS for Realtime Authorization

```sql
-- Allow authenticated users to receive broadcasts
CREATE POLICY "receive_broadcasts"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to send broadcasts
CREATE POLICY "send_broadcasts"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

#### 4. Clean Up Subscriptions

```typescript
// React cleanup pattern
useEffect(() => {
  const channel = supabase.channel('room:123:messages')

  channel
    .on('broadcast', { event: 'message' }, handleMessage)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)  // CRITICAL: Prevent memory leaks
  }
}, [])
```

### Feature Selection Guide

| Feature | Use Case | Performance |
|---------|----------|-------------|
| **Broadcast** | Messaging, notifications, game state | Best for most cases |
| **Presence** | Online/offline status, active users | Higher overhead - use minimally |
| **Postgres Changes** | Dev/testing, low user count | Not for high-traffic production |

### Performance Considerations

- Broadcast: Handles high-frequency updates well
- Presence: Computational overhead - limit to essential features
- Postgres Changes: Database performance impact - prefer Broadcast with triggers

---

## React Admin + Supabase Integration

### ra-supabase-core Integration

React Admin seamlessly integrates with Supabase for:
- ✅ Authentication (JWT-based)
- ✅ Permissions (RLS-backed)
- ✅ CRUD operations (Data provider)
- ✅ Realtime updates (Subscriptions)

### Data Provider Pattern (Crispy CRM)

```typescript
// Single entry point for all database operations
// src/atomic-crm/providers/supabase/unifiedDataProvider.ts

// NEVER import Supabase directly in components
// ALWAYS go through the data provider

// Zod validation at API boundary
import { contactSchema } from '@/validation/schemas'

const dataProvider = {
  getList: async (resource, params) => {
    const { data, error } = await supabase
      .from(resource)
      .select()

    // Validate at API boundary
    const validated = z.array(contactSchema).parse(data)
    return { data: validated, total: validated.length }
  }
}
```

### Authentication Flow

```typescript
// ra-supabase handles auth automatically
import { supabaseAuthProvider } from 'ra-supabase-core'

const authProvider = supabaseAuthProvider(supabase, {
  getIdentity: async (user) => ({
    id: user.id,
    fullName: user.user_metadata?.full_name,
  })
})
```

### Realtime Data Provider

```typescript
// Enable realtime updates in React Admin
import {
  supabaseDataProvider,
  createRealtimeDataProvider
} from 'ra-supabase-core'

const realtimeProvider = createRealtimeDataProvider(
  supabaseDataProvider(supabase)
)
```

---

## Backup & Recovery Strategy

### Supabase Backup Options

| Plan | Backup Type | RPO | Retention |
|------|-------------|-----|-----------|
| Free | None (manual pg_dump) | Manual | N/A |
| Pro | Daily automated | 24 hours | 7 days |
| Pro + PITR | Continuous | Seconds | Configurable |

### Point-in-Time Recovery (PITR)

**Enable PITR when:**
- Database > 4GB
- RPO requirement < 24 hours
- Compliance requirements (SOC 2, HIPAA)

**Benefits:**
- Restore to any second within retention period
- More resource-efficient than daily backups
- Reduces performance impact during backup

### Manual Backup Strategy

```bash
# For Free Plan or additional backups
pg_dump -h db.project.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup_$(date +%Y%m%d).dump

# Restore
pg_restore -h localhost -U postgres -d mydb backup.dump
```

### High Availability

| Feature | Purpose | When to Use |
|---------|---------|-------------|
| Read Replicas | Availability resilience | High-traffic apps |
| PITR | Durability resilience | Data integrity critical |
| Multi-region | Geographic redundancy | Global apps |

### Recovery Time Objectives

| Data Size | Estimated RTO |
|-----------|---------------|
| < 1GB | Minutes |
| 1-10GB | 1-2 hours |
| 10-100GB | 2-6 hours |
| > 100GB | 6-12 hours |

---

## Compliance Checklist

### SOC 2 / HIPAA / PCI-DSS Requirements

| Requirement | Supabase Feature | Status |
|-------------|------------------|--------|
| Encryption at rest | ✅ Automatic | Enabled |
| Encryption in transit | SSL/TLS | **Enable** |
| Access control | RLS | **Enable** |
| Audit logging | Database logs | **Configure** |
| Session management | JWT + refresh tokens | ✅ Configured |
| MFA support | Auth MFA | **Enable** |
| Backup & recovery | PITR | **Enable** |

### Security Audit Checklist

- [ ] RLS enabled on ALL public tables
- [ ] SSL enforcement enabled
- [ ] Network restrictions configured
- [ ] MFA enabled for admin accounts
- [ ] Custom SMTP configured
- [ ] OTP expiry ≤ 3600 seconds
- [ ] Service role key NOT exposed to clients
- [ ] Security Advisor issues resolved
- [ ] Performance Advisor issues resolved
- [ ] Audit logging enabled

---

## References

### Official Documentation
- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase Security Guide](https://supabase.com/docs/guides/security/product-security)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Auth Sessions](https://supabase.com/docs/guides/auth/sessions)
- [Realtime Getting Started](https://supabase.com/docs/guides/realtime/getting_started)

### Security Standards
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [JWT Security Recommendations](https://github.com/web-token/jwt-doc/blob/v1.x/security-recommendations.md)
- [Azure PostgreSQL Security Overview](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/security-overview)

### Integration Guides
- [React Admin + Supabase](https://supabase.com/partners/integrations/react-admin)
- [ra-supabase Documentation](https://github.com/marmelab/ra-supabase)

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-03 | 1.0 | Initial comprehensive report |
