# Security Model - Atomic CRM

**Last Updated:** 2025-11-08
**Status:** Phase 1 Implementation Complete
**Next Review:** 2026-02-08 (Quarterly)

---

## Architecture: Single-Tenant Trusted Team

This CRM is designed for a **single organization** where all authenticated users are trusted team members who collaborate on a shared customer base.

### Access Control Model

#### Shared Access (RLS: `USING (true)`)

The following tables use permissive RLS policies allowing all authenticated users full access:

- **Contacts** - Customer contact information
- **Organizations** - Customer organizations and principals
- **Opportunities** - Sales opportunities and deals
- **Activities** - Team activities and interactions
- **Products** - Product catalog
- **Contact Notes** - Notes attached to contacts
- **Opportunity Notes** - Notes attached to opportunities

**Rationale:** Team collaboration requires full visibility into customer relationships. Sales representatives need to see all opportunities to coordinate effectively and avoid duplicate outreach.

**Protection Layers:**
1. **Authentication Boundary** - Only employees with valid Supabase credentials can access data
2. **Audit Trail** - All modifications tracked in `audit_log` table (see migration 20251103232837)
3. **Soft Deletes** - Data never permanently deleted, uses `deleted_at` timestamp
4. **Rate Limiting** - Import operations throttled to prevent abuse
5. **Input Validation** - Zod schemas at API boundary prevent malformed data

#### Personal Access (RLS: Creator-only)

**Tasks** - Individual task management
- **Policy:** Users can only view/edit tasks where `created_by` matches their `sales.id`
- **Rationale:** Tasks are personal to-do items and shouldn't clutter team views

#### Role-Based Fields

The `sales` table includes an `is_admin` field for role-based features:
- **Current Use:** Minimal (mostly for future expansion)
- **Future Use:** Can restrict delete operations to admins only if needed
- **Example:**
  ```sql
  -- Future admin-only delete policy:
  CREATE POLICY delete_contacts_admin_only ON contacts
    FOR DELETE TO authenticated
    USING (
      (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
    );
  ```

---

## Security Boundaries

### 1. Authentication

**Primary Security Control**

Only users with valid Supabase authentication credentials can access the CRM. External users have the `anon` role and cannot access any tables with RLS enabled.

**Implementation:**
- Supabase JWT-based authentication
- Session validation on every request
- Automatic token refresh
- See `src/atomic-crm/providers/supabase/authProvider.ts`

### 2. Audit Trail

**Modification Tracking**

All create/update/delete operations are logged in the `audit_log` table.

**Captured Data:**
- User ID (who made the change)
- Timestamp (when)
- Operation type (INSERT/UPDATE/DELETE)
- Table name (what was changed)
- Record ID
- Changed values (old/new)

**Retention:** 90 days minimum (configurable)

**Implementation:** Trigger functions on all tables (see migration 20251103232837)

### 3. Soft Deletes

**Data Recovery**

No data is permanently deleted from core tables. Delete operations set `deleted_at` timestamp instead.

**Benefits:**
- Accidental deletes can be recovered
- Audit trail remains intact
- Compliance with data retention policies

**Tables with Soft Delete:**
- contacts, organizations, opportunities, activities, tasks
- products, sales, contact_preferred_principals
- segments, contactNotes, interaction_participants
- tags, opportunity_products, notifications

**Implementation:**
- Database: `deleted_at TIMESTAMPTZ` column with partial indexes
- Application: `unifiedDataProvider.ts` checks `supportsSoftDelete()`
- See migrations: 20251108051117, 20251108051154, 20251108051302

### 4. Rate Limiting

**Import Operation Throttling**

CSV import operations are rate-limited to prevent abuse:
- **Contact Imports:** 10 per 24 hours per user
- **Organization Imports:** 10 per 24 hours per user

**Benefits:**
- Prevents accidental bulk data corruption
- Limits impact of compromised accounts
- Reduces database load

**Implementation:** Client-side rate limiter with sessionStorage tracking

### 5. Input Validation

**Zod Schemas at API Boundary**

All user input validated before database operations:
- Type safety (string, number, email, etc.)
- Required fields
- Length limits
- Enum value validation
- JSONB structure validation

**Implementation:**
- `src/atomic-crm/validation/*.ts` - Zod schemas
- `ValidationService.ts` - Centralized validation
- React Admin validators derived from Zod

---

## Risk Assessment

### Accepted Risks

These risks are accepted as part of the trusted-team model:

#### 1. Any Authenticated User Can Delete Customer Data

**Risk Level:** Medium
**Mitigation:**
- Soft-deletes prevent permanent loss
- Audit trail tracks who deleted what
- Daily backups enable recovery
- Team is trusted and trained

**Residual Risk:** Low

**When to Revisit:**
- Adding external users (contractors, clients)
- Team size exceeds 20 people
- Data breach incident occurs
- Compliance requirements change (SOC 2, ISO 27001)

#### 2. No Role-Based Write Restrictions

**Risk Level:** Medium
**Mitigation:**
- Trusted team environment with employee background checks
- Audit trail provides accountability
- Quarterly access reviews
- Can add admin-only deletes in Phase 2 if needed

**Residual Risk:** Low

**When to Revisit:**
- Team includes untrusted users
- Compliance audit requires role separation
- Incident reveals insider threat

#### 3. No Data Isolation Between Users

**Risk Level:** Low
**Mitigation:**
- Intentional for collaboration
- All users work for same company
- No competitive information shared between companies

**Residual Risk:** Very Low

**When to Revisit:**
- Expanding to multi-tenant SaaS model
- Adding external partner access

---

## Not Accepted (Phase 1 Fixes Implemented)

These risks were **not acceptable** and have been remediated:

### ✅ CSV Upload Without Validation

**Fixed:** Phase 1 - File size limits, MIME type checks, formula injection prevention

### ✅ Secrets in Logs

**Fixed:** Phase 1 - Removed environment variable logging, added secret scanning

### ✅ Auth Bypass via URL Manipulation

**Fixed:** Phase 1 - Added session validation in `checkAuth()`

### ✅ Unencrypted localStorage for Filters

**Fixed:** Phase 1 - Migrated to sessionStorage (cleared on tab close)

---

## Multi-Tenant Expansion Path

If expanding to multi-tenant SaaS in the future:

### Step 1: Add Company Isolation Column

```sql
ALTER TABLE sales ADD COLUMN company_id BIGINT REFERENCES organizations(id);
```

### Step 2: Backfill Company Assignments

```sql
-- Option A: All current users belong to company ID 1
UPDATE sales SET company_id = 1;

-- Option B: Use user metadata or migration logic
UPDATE sales s
SET company_id = (
  SELECT id FROM organizations
  WHERE name = 'Your Company Name'
  LIMIT 1
);
```

### Step 3: Update Helper Function

```sql
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS BIGINT AS $$
  SELECT company_id FROM public.sales
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;
```

### Step 4: Replace RLS Policies

```sql
-- Example: Replace contacts policy
DROP POLICY authenticated_select_contacts ON contacts;
CREATE POLICY select_contacts_same_company ON contacts
  FOR SELECT TO authenticated
  USING (
    -- Only see contacts from my company
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.user_id = auth.uid()
      AND sales.company_id = contacts.company_id
    )
  );
```

### Step 5: Add NOT NULL Constraint

```sql
ALTER TABLE sales ALTER COLUMN company_id SET NOT NULL;
```

**Effort Estimate:** 5-7 days for full multi-tenant conversion

---

## Compliance Considerations

### SOC 2 Type II

For SOC 2 certification, ensure:
- [ ] Employee background checks documented
- [ ] Quarterly access reviews conducted
- [ ] Audit log retention policy (minimum 90 days)
- [ ] Incident response procedures defined
- [ ] Data backup and recovery tested quarterly
- [ ] Soft-delete recovery procedures documented

### GDPR / CCPA

For data privacy compliance:
- [ ] Data subject access request (DSAR) procedures
- [ ] Right to deletion (hard delete after soft-delete retention)
- [ ] Data processing agreements with Supabase
- [ ] Privacy policy documents shared-access model
- [ ] User consent for data collection

### ISO 27001

For information security management:
- [ ] Risk assessment includes shared-access model
- [ ] Access control policy documents trusted team
- [ ] Security awareness training for all users
- [ ] Regular vulnerability assessments
- [ ] Penetration testing annually

---

## Monitoring & Alerting

### Recommended Monitoring

1. **Failed Login Attempts**
   - Alert after 5 failed attempts in 10 minutes
   - Indicates potential brute force attack

2. **Bulk Delete Operations**
   - Alert if user deletes >50 records in 1 hour
   - May indicate compromised account or malicious insider

3. **CSV Import Failures**
   - Alert if validation rejects >10 files per day
   - May indicate attack or user confusion

4. **Rate Limit Hits**
   - Alert if user hits rate limit >3 times per day
   - May indicate abuse or workflow issue

5. **Session Anomalies**
   - Alert if user accesses from multiple IPs simultaneously
   - May indicate session hijacking

### Implementation

Use Supabase Logs or external monitoring:
- **Supabase Dashboard:** Logs → Auth → Failed logins
- **Sentry:** Error tracking and user monitoring
- **LogRocket:** Session replay for debugging
- **Custom Alerting:** Supabase Edge Functions monitoring audit_log

---

## Incident Response

### Suspected Compromised Account

1. **Immediate Actions** (within 15 minutes)
   - Disable user account: `UPDATE sales SET disabled = true WHERE id = ?`
   - Rotate Supabase anon key (if service role exposed)
   - Review audit log for unauthorized changes

2. **Investigation** (within 24 hours)
   - Check audit_log for all operations by user
   - Review IP addresses and session locations
   - Interview user about account access
   - Scan for malware on user's device

3. **Remediation** (within 48 hours)
   - Restore data from soft-delete if needed
   - Re-enable account with new password (if user not malicious)
   - Update security training
   - Document incident in security log

### Data Breach

Follow organizational incident response plan. Key CRM-specific steps:

1. **Containment:** Disable all user accounts pending investigation
2. **Assessment:** Review audit_log to determine scope
3. **Notification:** Notify affected customers per GDPR/CCPA requirements
4. **Recovery:** Restore from backups if data corrupted
5. **Lessons Learned:** Update security model based on findings

---

## Training & Awareness

### New User Onboarding

All new users must complete security training covering:
- [ ] Shared-access model and responsibilities
- [ ] Audit trail and accountability
- [ ] CSV import security (file validation, rate limits)
- [ ] Password security and 2FA setup
- [ ] Phishing awareness
- [ ] Incident reporting procedures

### Ongoing Training

- **Quarterly:** Security awareness refresher
- **Annually:** Full security training update
- **Ad-hoc:** After security incidents or policy changes

---

## Document Maintenance

This security model document should be reviewed:
- **Quarterly:** By security team or responsible engineer
- **After incidents:** Update based on lessons learned
- **Before expansion:** Review before multi-tenant conversion
- **Compliance audits:** Update per auditor recommendations

**Responsible:** Security Team / Engineering Lead
**Approver:** CTO / VP Engineering

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- Engineering Constitution: `.claude/engineering-constitution.md`
- Security Audit: `docs/SECURITY_AUDIT_2025-11-08.md`
- RLS Policies: `supabase/migrations/20251029024045_fix_rls_policies_company_isolation.sql`
- Audit Trail: `supabase/migrations/20251103232837_create_audit_trail_system.sql`
