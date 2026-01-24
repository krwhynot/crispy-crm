# Architectural Decisions & Rules
**Last Updated:** 2026-01-24
**Status:** Constitution (Immutable unless via RFC)
**Context:** Crispy CRM (React Admin + Supabase)

---

## 1. Security & Permissions (RBAC)

### Delete Permissions
**Policy:** Hybrid Model
- **Admins:** Can delete ANY record (except audit logs/users).
- **Managers:** Can delete ANY record (except sales/users).
- **Creators:** Can soft-delete their own records (tasks, notes).
- **Reps:** Cannot delete shared resources (contacts, organizations, opportunities).
- **Rationale:** Balances team empowerment with data safety. Reduces admin bottlenecks.

### Field-Level Security
**Policy:** Team Trust Model
- All authenticated users can view/edit all business fields.
- No field-level RLS policies.
- **Rationale:** Current team size (6) does not justify the complexity of field-level grants.

### Role Scope
**Policy:** Manager = "Operational Admin"
- Managers inherit all Admin privileges EXCEPT:
  - User management (sales table mutations).
  - System configuration.
- **Rationale:** Reduces friction; `sales.disabled` flag handles termination security.

---

## 2. Business Logic & Relationships

### Account Assignment
**Policy:** Hybrid Creation
- **Reps:** Can only create records assigned to themselves (`sales_id = auth.uid()`).
- **Managers/Admins:** Can create records assigned to anyone.
- **Transfers:** Managers/Admins can reassign `sales_id` post-creation.

### Activities vs. Tasks
**Policy:** Workflow Separation
- **Tasks:** Future-focused workflow items (To-Do).
  - *Constraint:* Unlinked tasks are personal.
  - *Type Enum:* Includes workflow steps (Proposal, Follow-up).
- **Activities:** Historical record of interactions (Done).
  - *Constraint:* Team-shared (anyone can edit/correct).
  - *Type Enum:* Interaction types only (Call, Meeting).
- **Automation:** Tasks LINKED to customer entities (Contact/Org/Opp) auto-convert to Activities upon completion.

### Entity Relationships
- **Contact -> Organization:** `Belongs-To` (FK: `organization_id`). One active employer at a time.
- **Opportunity -> Principal:** `Single` (FK: `principal_organization_id`). Multi-principal deals require split opportunities.
- **Opportunity -> Contact:** `Single Primary` (FK: `primary_contact_id`). Influencers tracked in notes.
- **Activities:** `Polymorphic` (Nullable FKs: `contact_id`, `opportunity_id`, `organization_id`). Can link multiple context entities simultaneously.
- **Distributor Authorization:** A registry table determines which Distributors can sell which Principal's products.

---

## 3. Data Integrity & Defaults

### Source of Truth
**Policy:** Defense in Depth (Option C)
- **Validation:** Zod schemas enforce business rules (e.g., `priority='medium'`) in the app.
- **Storage:** Database constraints (`NOT NULL`, `DEFAULT`) enforce structural integrity.
- **Timestamps:** Database Triggers (`created_at`, `updated_at`) are the absolute authority. Application inputs for these are ignored.

### Audit Trails
**Policy:** Critical Path Auditing
- **Scope:** Log changes to High-Value fields only (Stage, Status, Owner, Amount).
- **Immutability:** DB Triggers prevent updates to `created_by`/`created_at`.
- **Visibility:** Admins can view deleted records via "Trash" filter.
- **Rationale:** High-signal debugging without log noise.

### Enums vs. Reference Tables
**Policy:** Stability-Based Split
- **Stable Values:** Use PostgreSQL ENUM types (e.g., `win_reason`, `user_role`).
- **Volatile Values:** Use Reference Tables (e.g., `product_categories`, `segments`).

---

## 4. Soft Delete Protocol

**Policy:** Safety First
- **Mechanism:** `deleted_at` column (universal).
- **Cascade Behavior:**
  - **Revenue Entities (Opp/Org):** BLOCK delete if children exist (Protect Revenue).
  - **Context Entities (Notes/Tasks):** CASCADE delete (Clean Context).
- **Recovery:** No UI currently. SQL recovery via Admin runbook.