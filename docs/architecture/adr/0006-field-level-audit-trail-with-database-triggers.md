# ADR-0006: Field-Level Audit Trail with Database Triggers

**Date:** 2025-11-02
**Status:** Accepted
**Deciders:** Product Design & Engineering Team

---

## Context

Crispy-CRM requires comprehensive audit trail functionality for compliance and operational transparency:

**Business requirements from PRD:**
- **Field-level change history:** Track "old value → new value" for all critical fields (PRD Section 3.1)
- **Who changed what:** Log user identity for every modification
- **When it changed:** Timestamp all modifications
- **Compliance:** Meet regulatory requirements for CRM data auditing
- **User-facing history:** Display change log in UI ("Priority changed from A to A+ by John Smith on 2025-01-15")

**Technical context:**
- Supabase PostgreSQL database (ADR-0001)
- Multiple tables require auditing: Organizations, Contacts, Opportunities, Products
- Users authenticate via JWT (ADR-0004) with `auth.users` → `sales` relationship
- Soft delete pattern (ADR-0005) already tracks deleted_by/deleted_at

**Problem:**
Current design only tracks WHO made the last change and WHEN, but not WHAT changed:

```sql
-- Current audit fields (insufficient for PRD requirements)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
created_by BIGINT REFERENCES sales(id)
updated_by BIGINT REFERENCES sales(id)
```

This doesn't capture:
- ❌ Which specific fields changed
- ❌ What the old values were
- ❌ What the new values became
- ❌ History of past changes (only shows last update)

**Use Cases from PRD:**
- Sales Manager reviews opportunity history to understand why deal was lost
- Admin audits user actions for compliance reporting
- User accidentally changes organization priority, needs to see what it was before
- System generates activity timeline: "5 changes in last 7 days"

## Decision

**Implement field-level audit trail using PostgreSQL triggers that write to a dedicated `audit_trail` table.**

Every UPDATE/INSERT/DELETE on audited tables automatically logs:
- Table name + record ID
- Field name + old value + new value
- User who made the change (sales.id from auth.uid())
- Timestamp of change

**Industry Standard:** This follows Salesforce's "Field History Tracking" and HubSpot's "Property History" patterns.

## Options Considered

### Option 1: Database Triggers + Audit Table (CHOSEN)

**Implementation:**
```sql
CREATE TABLE audit_trail (
  audit_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  table_name TEXT NOT NULL,
  record_id BIGINT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by BIGINT REFERENCES sales(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER audit_opportunities_changes
  AFTER INSERT OR UPDATE OR DELETE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION audit_changes('opportunity_id');
```

**Pros:**
- ✅ **Automatic** - Developers cannot forget to log changes
- ✅ **Consistent** - All tables use same audit format
- ✅ **Tamper-proof** - Triggers use SECURITY DEFINER, can't be bypassed
- ✅ **Captures everything** - Even direct SQL changes (migrations, scripts) are logged
- ✅ **Simple queries** - Easy to generate UI history views
- ✅ **Industry standard** - Salesforce, HubSpot, Dynamics use this pattern
- ✅ **Compliance-ready** - Cannot be disabled or modified by application code

**Cons:**
- ❌ **Storage overhead** - One row per field change (mitigated: cheap storage, ~$0.10/GB)
- ❌ **Write performance** - Adds ~5-10ms per INSERT/UPDATE (acceptable for CRM scale)
- ❌ **Schema coupling** - Trigger must be updated if table schema changes (mitigated: generic trigger function)

**Mitigation Strategies:**
- Partition audit_trail table by month for large datasets (PostgreSQL native partitioning)
- Index on (table_name, record_id, changed_at DESC) for fast history queries
- Archive old audit records after 2 years to separate cold storage table

### Option 2: Application-Level Logging

**Implementation:**
```typescript
// In React Query mutation
await supabase.from('opportunities').update({ priority: 'A+' });
await logChange({
  table: 'opportunities',
  field: 'priority',
  oldValue: 'A',
  newValue: 'A+',
});
```

**Pros:**
- ✅ **Flexible** - Can log only important fields
- ✅ **No database overhead** - Triggers don't slow down writes
- ✅ **Rich context** - Can log business-level actions ("Deal won") not just field changes

**Cons:**
- ❌ **Unreliable** - Developers must remember to call logChange()
- ❌ **Inconsistent** - Different developers log differently
- ❌ **Incomplete** - Direct database changes (SQL scripts, migrations) are not logged
- ❌ **Bypassable** - Malicious code could skip logging
- ❌ **Not compliance-ready** - Auditors want tamper-proof logs

**Why rejected:** The PRD requirement is "must track all changes" - application-level logging cannot guarantee this.

### Option 3: Event Sourcing (Store All Events)

**Implementation:**
```sql
-- Store every state change as immutable event
CREATE TABLE events (
  event_id BIGINT PRIMARY KEY,
  aggregate_id BIGINT,
  event_type TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ
);
```

**Pros:**
- ✅ **Complete history** - Can reconstruct state at any point in time
- ✅ **Time travel** - Replay events to see historical state
- ✅ **Audit trail** - Every change is an event

**Cons:**
- ❌ **Massive complexity** - Requires event store, CQRS architecture, projection system
- ❌ **Overkill for CRM** - Event sourcing best for financial systems, not sales CRM
- ❌ **Performance overhead** - Must replay events to get current state
- ❌ **Team unfamiliar** - Learning curve incompatible with 20-week MVP timeline
- ❌ **Storage explosion** - All events forever (expensive at scale)

**Why rejected:** Event sourcing is overkill for CRM audit requirements. Triggers provide 90% of the value at 10% of the complexity.

### Option 4: PostgreSQL Logical Replication (wal2json)

**Implementation:**
Use PostgreSQL's Write-Ahead Log (WAL) to stream changes to external system.

**Pros:**
- ✅ **Zero application overhead** - No triggers or code changes
- ✅ **Complete capture** - Every database change logged

**Cons:**
- ❌ **Complex setup** - Requires WAL configuration, replication slots, external consumer
- ❌ **Supabase limitations** - Limited control over WAL configuration in hosted environment
- ❌ **Difficult queries** - WAL format not optimized for "show history of opportunity #123"
- ❌ **Operational burden** - Requires monitoring replication lag, managing consumers

**Why rejected:** Logical replication is designed for database-to-database replication, not user-facing audit trails.

## Consequences

### Positive Consequences

**Compliance & Auditing:**
- ✅ **Complete audit trail** - Every field change logged automatically
- ✅ **Tamper-proof** - Triggers run as SECURITY DEFINER, can't be bypassed by app code
- ✅ **Historical accuracy** - Can answer "what was priority on Jan 15?" instantly
- ✅ **Regulatory compliance** - Meets SOX, HIPAA, GDPR audit requirements

**User Experience:**
- ✅ **Change history UI** - Display "Priority changed from A to A+ by John Smith on 2025-01-15"
- ✅ **Activity timeline** - Show recent changes for any entity
- ✅ **Undo confidence** - Users can see exact changes before reverting

**Operational Benefits:**
- ✅ **Debugging** - Trace data inconsistencies to specific changes
- ✅ **Data recovery** - Reconstruct accidentally modified records
- ✅ **Blame analysis** - Identify who made problematic changes

**Specific CRM Use Cases:**
- Sales Manager: "Show me who changed this deal's status and when"
- Admin: "Generate report of all priority changes in last month"
- User: "I accidentally changed organization name, what was it before?"

### Negative Consequences

**Performance Impact:**
- ❌ **Write slowdown** - Triggers add ~5-10ms per INSERT/UPDATE
  - **Mitigation:** CRM write volume low (~100s of writes/day), not millions/second
  - **Benchmark:** Supabase PostgreSQL can handle 1000+ writes/sec with triggers
- ❌ **Storage growth** - One audit row per field change
  - **Mitigation:** Storage is cheap (~$0.10/GB/month), audit records are small (~200 bytes)
  - **Cleanup:** Archive audit_trail records older than 2 years to cold storage

**Query Complexity:**
- ❌ **Join overhead** - Displaying history requires JOIN to sales table
  - **Mitigation:** Materialize sales.full_name in audit_trail for common queries (denormalization)
- ❌ **Large result sets** - Opportunities with 100+ changes return many rows
  - **Mitigation:** Pagination in UI, limit to last 50 changes by default

**Schema Maintenance:**
- ❌ **Trigger updates** - Adding/removing table columns may require trigger updates
  - **Mitigation:** Generic trigger function handles all columns automatically via JSONB introspection
  - **Process:** Test trigger on staging after schema changes before production deploy

### Neutral Consequences

- **Trigger function reusable** - Same `audit_changes()` function works for all tables
- **Audit records immutable** - Once written, never modified (INSERT-only table)
- **Selective auditing** - Can choose which tables to audit (not forced to audit everything)

## Implementation Notes

**Complete Implementation:** See [Migration Strategy Section 2.10](../../database/MIGRATION_STRATEGY.md#210-audit-trail-field-level-change-tracking)

**Quick Reference:**

```sql
-- 1. Create audit_trail table
CREATE TABLE audit_trail (
  audit_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  table_name TEXT,
  record_id BIGINT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by BIGINT REFERENCES sales(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create generic trigger function
CREATE FUNCTION audit_changes() RETURNS TRIGGER AS $$ ... $$;

-- 3. Attach trigger to table
CREATE TRIGGER audit_opportunities_changes
  AFTER INSERT OR UPDATE OR DELETE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION audit_changes('opportunity_id');
```

**Query Pattern (UI History View):**

```typescript
// Fetch change history for opportunity #123
const { data: history } = useQuery({
  queryKey: ['audit', 'opportunities', 123],
  queryFn: async () => {
    const { data } = await supabase
      .from('audit_trail')
      .select('field_name, old_value, new_value, changed_at, sales:changed_by(full_name)')
      .eq('table_name', 'opportunities')
      .eq('record_id', 123)
      .order('changed_at', { ascending: false })
      .limit(50);
    return data;
  },
});

// Display in UI
{history?.map((change) => (
  <HistoryItem>
    <strong>{change.field_name}</strong>: {change.old_value} → {change.new_value}
    <span>by {change.sales.full_name} on {formatDate(change.changed_at)}</span>
  </HistoryItem>
))}
```

**Performance Optimization:**

```sql
-- Index for fast history queries
CREATE INDEX idx_audit_trail_table_record
  ON audit_trail(table_name, record_id, changed_at DESC);

-- Partition by month (for large datasets)
CREATE TABLE audit_trail_2025_01 PARTITION OF audit_trail
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

**Security Pattern:**

```sql
-- RLS: All users can view audit trail (transparency)
CREATE POLICY authenticated_select_audit_trail ON audit_trail
  FOR SELECT TO authenticated
  USING (true);

-- No INSERT policy - only triggers can write (tamper-proof)
-- Triggers run as SECURITY DEFINER, bypass RLS
```

**Tables to Audit:**
- ✅ Organizations (priority_level, segment, account managers)
- ✅ Contacts (email, phone, organization)
- ✅ Opportunities (status, stage, probability, deal_owner)
- ⏸️ Products (less critical, can add later)
- ⏸️ Activity Log (already an audit trail, don't audit the audit)

## References

- **PRD Section 3.1:** User actions and audit requirements - "must track who changed what"
- **Industry Research:** [Perplexity search on CRM audit patterns](https://www.perplexity.ai) - Salesforce, HubSpot practices
- **PostgreSQL Triggers:** https://www.postgresql.org/docs/current/trigger-definition.html
- **Audit Table Pattern:** https://wiki.postgresql.org/wiki/Audit_trigger_91plus
- **Related ADR:** ADR-0001 (Supabase Backend - trigger implementation)
- **Related ADR:** ADR-0004 (JWT Auth - auth.uid() in triggers)
- **Related ADR:** ADR-0005 (Soft Delete - audit deleted_by field)
- **Implementation:** [Migration Strategy Section 2.10](../../database/MIGRATION_STRATEGY.md#210-audit-trail-field-level-change-tracking)

---

## Supersedes

None (initial decision)

## Superseded By

None (current)
