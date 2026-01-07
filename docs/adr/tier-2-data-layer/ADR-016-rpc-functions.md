# ADR-016: RPC Functions for Atomic Operations

## Status

**Accepted** - 2025-12-30

## Context

Crispy CRM requires atomic operations that span multiple database tables. Without transactional guarantees, complex business operations risk data inconsistency:

1. **Create opportunity with products** - Opportunity record + multiple `opportunity_products` junction records must succeed or fail together
2. **Cascade soft deletes** - Archiving an opportunity must cascade to activities, notes, tasks, and participants atomically
3. **Activity log aggregation** - Combining events from organizations, contacts, opportunities, and notes in a single optimized query
4. **Complete task with follow-up** - Mark task complete + create activity + optionally update opportunity stage atomically

### Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **PostgreSQL RPC (chosen)** | Single transaction, SECURITY DEFINER, backend validation | SQL-only business logic, harder to unit test |
| **Multiple API calls** | Simple client code, easy debugging | No transaction guarantees, race conditions, N+1 round trips |
| **Edge Function orchestration** | TypeScript, testable, isolated | No native transactions without manual savepoints |
| **Database triggers** | Automatic, no client changes | Implicit behavior, hard to debug, less explicit |

### Decision Drivers

1. **Atomicity** - All-or-nothing semantics for multi-table operations
2. **Performance** - Single round-trip vs. N+1 API calls (5 queries → 1 for activity log)
3. **Backend validation** - Business rules enforced in SQL, not bypassable from client
4. **Security** - `SECURITY DEFINER` allows RLS bypass with explicit privilege control
5. **Existing patterns** - 171 RPC functions already defined across migrations

---

## Decision

Use **PostgreSQL RPC functions** for atomic operations, invoked through the unified data provider with Zod validation at the API boundary.

### Architecture

```
+------------------------------------------------------------------+
|                     Client (React Admin)                          |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|            Unified Data Provider (Single Entry Point)             |
|------------------------------------------------------------------|
|  dataProvider.rpc("sync_opportunity_with_products", params)       |
|                              |                                    |
|        +---------------------+---------------------+              |
|        v                                           v              |
|  +----------------+                    +------------------------+ |
|  | RPC_SCHEMAS    |                    | supabaseClient.rpc()   | |
|  | (Zod schemas)  |                    | (PostgREST call)       | |
|  +----------------+                    +------------------------+ |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                  PostgreSQL RPC Functions                         |
|------------------------------------------------------------------|
|  sync_opportunity_with_products()  - Atomic create/update         |
|  archive_opportunity_with_relations() - Cascade soft delete       |
|  get_activity_log() - Optimized aggregation query                 |
|  complete_task_with_followup() - Multi-step workflow              |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      PostgreSQL Tables                            |
|  opportunities | activities | tasks | opportunityNotes | ...      |
+------------------------------------------------------------------+
```

### RPC Invocation Pattern

**Service Layer (`customMethodsExtension.ts:477-514`)**

```typescript
rpc: async <T = unknown>(
  functionName: string,
  params: Record<string, unknown> = {}
): Promise<T> => {
  let validatedParams = params;

  // Validate params if schema exists for this RPC function
  if (functionName in RPC_SCHEMAS) {
    const schema = RPC_SCHEMAS[functionName as RPCFunctionName];
    const validationResult = schema.safeParse(params);

    if (!validationResult.success) {
      throw new Error(
        `Invalid RPC parameters for ${functionName}: ${validationResult.error.message}`
      );
    }
    validatedParams = validationResult.data as Record<string, unknown>;
  }

  const { data, error } = await supabaseClient.rpc(functionName, validatedParams);

  if (error) {
    logError("rpc", functionName, { data: validatedParams }, error);
    throw new Error(`RPC ${functionName} failed: ${error.message}`);
  }

  return data as T;
}
```

### Key RPC Functions

#### 1. `sync_opportunity_with_products` - Atomic Create/Update

**Purpose:** Upsert opportunity and manage product associations in a single transaction.

**Migration:** `20251030132011_add_rpc_backend_validation.sql`

```sql
CREATE OR REPLACE FUNCTION public.sync_opportunity_with_products(
  opportunity_data jsonb,
  products_to_create jsonb,
  products_to_update jsonb,
  product_ids_to_delete integer[]
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  opportunity_id BIGINT;
  updated_opportunity RECORD;
  contact_ids_array BIGINT[];
  is_new_opportunity BOOLEAN;
BEGIN
  is_new_opportunity := (opportunity_data->>'id') IS NULL;

  -- BACKEND VALIDATION FOR NEW OPPORTUNITIES
  IF is_new_opportunity THEN
    IF (opportunity_data->>'customer_organization_id') IS NULL THEN
      RAISE EXCEPTION 'customer_organization_id is required to create an opportunity';
    END IF;

    IF NOT (opportunity_data ? 'contact_ids') OR
       jsonb_array_length(opportunity_data->'contact_ids') = 0 THEN
      RAISE EXCEPTION 'At least one contact is required to create an opportunity';
    END IF;

    IF jsonb_array_length(products_to_create) = 0 THEN
      RAISE EXCEPTION 'At least one product is required to create an opportunity';
    END IF;
  END IF;

  -- Upsert opportunity record
  INSERT INTO opportunities (...) VALUES (...)
  ON CONFLICT (id) DO UPDATE SET ...
  RETURNING id INTO opportunity_id;

  -- Create new product associations
  IF JSONB_ARRAY_LENGTH(products_to_create) > 0 THEN
    INSERT INTO opportunity_products (...) SELECT ... FROM JSONB_ARRAY_ELEMENTS(products_to_create);
  END IF;

  -- Update existing product associations
  IF JSONB_ARRAY_LENGTH(products_to_update) > 0 THEN
    UPDATE opportunity_products op SET ... FROM JSONB_ARRAY_ELEMENTS(products_to_update) p WHERE ...;
  END IF;

  -- Delete removed product associations
  IF ARRAY_LENGTH(product_ids_to_delete, 1) > 0 THEN
    DELETE FROM opportunity_products WHERE id = ANY(product_ids_to_delete);
  END IF;

  RETURN jsonb_build_object('data', to_jsonb(updated_opportunity));
END;
$function$;
```

**Zod Schema (`src/atomic-crm/validation/rpc.ts:47-57`)**

```typescript
const opportunityProductItemSchema = z.strictObject({
  product_id: z.number().int().positive("Product ID must be a positive integer"),
  notes: z.string().max(2000, "Notes too long").optional().nullable(),
});

export const syncOpportunityWithProductsParamsSchema = z.strictObject({
  opportunity_data: z.unknown(),
  products_to_create: z.array(opportunityProductItemSchema).default([]),
  products_to_update: z.array(opportunityProductItemSchema).default([]),
  product_ids_to_delete: z.array(z.number().int().positive()).default([]),
});
```

#### 2. `archive_opportunity_with_relations` - Cascade Soft Delete

**Purpose:** Soft delete opportunity and all related records atomically.

**Migration:** `20251028213032_add_soft_delete_cascade_functions.sql`

```sql
CREATE OR REPLACE FUNCTION archive_opportunity_with_relations(opp_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF opp_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity ID cannot be null';
  END IF;

  -- Archive parent
  UPDATE opportunities SET deleted_at = NOW()
  WHERE id = opp_id AND deleted_at IS NULL;

  -- Cascade to children
  UPDATE activities SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE "opportunityNotes" SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE opportunity_participants SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE tasks SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;
END;
$$;
```

**Zod Schema:**

```typescript
export const archiveOpportunityWithRelationsParamsSchema = z.strictObject({
  opp_id: z.number().int().positive("Opportunity ID must be a positive integer"),
});
```

#### 3. `get_activity_log` - Optimized Aggregation Query

**Purpose:** Replace 5 separate queries with a single server-side UNION ALL.

**Migration:** `20251101231344_optimize_activity_log_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION get_activity_log(
  p_organization_id BIGINT DEFAULT NULL,
  p_sales_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 250
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    WITH activity_events AS (
      -- 1. Organization created events
      SELECT 'Organization created' AS type, o.created_at AS date, ...
      FROM organizations o WHERE o.deleted_at IS NULL AND ...

      UNION ALL

      -- 2. Contact created events
      SELECT 'Contact created' AS type, c.first_seen AS date, ...
      FROM contacts c WHERE c.deleted_at IS NULL AND ...

      UNION ALL

      -- 3. Contact note events
      SELECT 'Contact note created' AS type, cn.date, ...
      FROM "contactNotes" cn LEFT JOIN contacts c ON ... WHERE cn.deleted_at IS NULL AND ...

      UNION ALL

      -- 4. Opportunity created events
      SELECT 'Opportunity created' AS type, opp.created_at AS date, ...
      FROM opportunities opp WHERE opp.deleted_at IS NULL AND ...

      UNION ALL

      -- 5. Opportunity note events
      SELECT 'Opportunity note created' AS type, opn.date, ...
      FROM "opportunityNotes" opn LEFT JOIN opportunities opp ON ... WHERE opn.deleted_at IS NULL AND ...
    )
    SELECT json_agg(...) FROM (SELECT * FROM activity_events ORDER BY date DESC LIMIT p_limit) sorted_events
  );
END;
$$;
```

**Performance:** Single round-trip, server-side sorting and limiting, no N+1 queries.

#### 4. `complete_task_with_followup` - Multi-Step Workflow

**Purpose:** Atomically complete task, create activity, and optionally advance opportunity stage.

**Migration:** `20251110111229_complete_task_with_followup_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION public.complete_task_with_followup(
  p_task_id BIGINT,
  p_activity_data JSONB,
  p_opportunity_stage TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_task RECORD;
  v_activity_id BIGINT;
  v_opportunity_id BIGINT;
BEGIN
  -- Input validation
  IF p_task_id IS NULL THEN
    RAISE EXCEPTION 'task_id is required';
  END IF;

  IF p_activity_data IS NULL OR p_activity_data->>'description' IS NULL THEN
    RAISE EXCEPTION 'activity description is required';
  END IF;

  -- Get task and validate state
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found or already deleted: %', p_task_id;
  END IF;
  IF v_task.completed = TRUE THEN
    RAISE EXCEPTION 'Task is already completed: %', p_task_id;
  END IF;

  -- 1. Mark task complete
  UPDATE tasks SET completed = TRUE, completed_at = NOW(), updated_at = NOW()
  WHERE id = p_task_id;

  -- 2. Create linked activity
  INSERT INTO activities (...) VALUES (...) RETURNING id INTO v_activity_id;

  -- 3. Update opportunity stage (if provided)
  IF p_opportunity_stage IS NOT NULL AND v_opportunity_id IS NOT NULL THEN
    UPDATE opportunities SET stage = p_opportunity_stage::opportunity_stage, ...
    WHERE id = v_opportunity_id AND deleted_at IS NULL;
  END IF;

  RETURN jsonb_build_object(
    'task_id', p_task_id,
    'activity_id', v_activity_id,
    'opportunity_id', v_opportunity_id,
    'success', true
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to complete task: %', SQLERRM;
END;
$$;
```

#### 5. `create_product_with_distributors` - Atomic Junction Management

**Purpose:** Create product and distributor associations atomically.

**Migration:** `20251223120100_add_create_product_with_distributors_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION public.create_product_with_distributors(
    product_data JSONB,
    distributors JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER  -- RLS policies apply
SET search_path TO 'public'
AS $$
DECLARE
    v_product_id BIGINT;
BEGIN
    -- 1. Insert the product
    INSERT INTO products (...) VALUES (...) RETURNING id INTO v_product_id;

    -- 2. Insert junction records if provided
    IF distributors IS NOT NULL AND JSONB_ARRAY_LENGTH(distributors) > 0 THEN
        INSERT INTO product_distributors (product_id, distributor_id, ...)
        SELECT v_product_id, (d->>'distributor_id')::BIGINT, ...
        FROM JSONB_ARRAY_ELEMENTS(distributors) AS d;
    END IF;

    RETURN TO_JSONB(v_created_product);
END;
$$;
```

---

## Consequences

### Positive

1. **Atomicity** - Complex operations succeed or fail as a unit; no partial state
2. **Performance** - Single round-trip reduces latency; server-side aggregation eliminates N+1
3. **Backend validation** - Business rules enforced in SQL, not bypassable from malicious clients
4. **Consistent error handling** - `RAISE EXCEPTION` with descriptive messages surfaces to client
5. **RLS compatibility** - `SECURITY INVOKER` functions respect RLS; `SECURITY DEFINER` for explicit bypass
6. **Zod integration** - Parameter validation at API boundary prevents malformed requests

### Negative

1. **SQL complexity** - Business logic in PL/pgSQL is harder to unit test than TypeScript
2. **Migration coupling** - Schema changes may require RPC function updates
3. **Debugging** - Errors in RPC functions require database logs, not browser devtools
4. **Type safety gap** - JSONB parameters lose TypeScript type checking within SQL

### Neutral

1. **171 functions defined** - Large surface area but follows established patterns
2. **Mixed security modes** - Some functions use `SECURITY DEFINER`, others `SECURITY INVOKER`
3. **Version control** - Functions defined in migrations, not application code

---

## Anti-Patterns

### 1. Client-Side Transaction Emulation

```typescript
// WRONG: No atomicity - partial failure leaves inconsistent state
async function createOpportunityWithProducts(data, products) {
  const opp = await dataProvider.create("opportunities", { data });
  // If this fails, opportunity exists without products!
  for (const product of products) {
    await dataProvider.create("opportunity_products", {
      data: { opportunity_id: opp.id, ...product }
    });
  }
}

// CORRECT: Single atomic RPC call
async function createOpportunityWithProducts(data, products) {
  return dataProvider.rpc("sync_opportunity_with_products", {
    opportunity_data: data,
    products_to_create: products,
    products_to_update: [],
    product_ids_to_delete: [],
  });
}
```

### 2. Missing Backend Validation

```sql
-- WRONG: Trust client-provided data blindly
CREATE FUNCTION create_opportunity(data JSONB)
AS $$
BEGIN
  INSERT INTO opportunities SELECT * FROM jsonb_populate_record(...);
END;

-- CORRECT: Validate business rules in SQL
CREATE FUNCTION create_opportunity(data JSONB)
AS $$
BEGIN
  IF (data->>'customer_organization_id') IS NULL THEN
    RAISE EXCEPTION 'customer_organization_id is required';
  END IF;
  -- Then insert...
END;
```

### 3. Bypassing the Data Provider

```typescript
// WRONG: Direct Supabase RPC call bypasses Zod validation
const { data } = await supabase.rpc("archive_opportunity_with_relations", {
  opp_id: opportunityId,
});

// CORRECT: Use data provider for validation and error handling
const data = await dataProvider.rpc("archive_opportunity_with_relations", {
  opp_id: opportunityId,
});
```

### 4. SECURITY DEFINER Without Validation

```sql
-- WRONG: SECURITY DEFINER bypasses RLS with no input validation
CREATE FUNCTION dangerous_delete(id BIGINT)
SECURITY DEFINER AS $$
BEGIN
  DELETE FROM sensitive_table WHERE id = $1;  -- No auth check!
END;

-- CORRECT: Validate caller permissions explicitly
CREATE FUNCTION safe_archive(id BIGINT)
SECURITY DEFINER AS $$
BEGIN
  -- Verify caller has access to this record
  IF NOT EXISTS (SELECT 1 FROM opportunities WHERE id = $1 AND sales_id = current_sales_id()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE opportunities SET deleted_at = NOW() WHERE id = $1;
END;
```

### 5. Retry Logic in RPC Consumers

```typescript
// WRONG: Violates fail-fast principle
async function safeRpc(fn: string, params: object) {
  for (let i = 0; i < 3; i++) {
    try {
      return await dataProvider.rpc(fn, params);
    } catch (e) {
      await sleep(1000);
    }
  }
}

// CORRECT: Fail fast, surface errors immediately
async function callRpc(fn: string, params: object) {
  return dataProvider.rpc(fn, params);  // Let error propagate
}
```

---

## Key Migrations

| Migration | Purpose |
|-----------|---------|
| `20251028213032_add_soft_delete_cascade_functions.sql` | `archive_opportunity_with_relations`, `unarchive_opportunity_with_relations` |
| `20251030132011_add_rpc_backend_validation.sql` | `sync_opportunity_with_products` with business rule validation |
| `20251101231344_optimize_activity_log_rpc.sql` | `get_activity_log` (5 queries → 1 CTE) |
| `20251110111229_complete_task_with_followup_rpc.sql` | `complete_task_with_followup` multi-step workflow |
| `20251223120100_add_create_product_with_distributors_rpc.sql` | `create_product_with_distributors` junction management |

---

## Related ADRs

- **[ADR-001: Unified Data Provider](../tier-1-foundations/ADR-001-unified-data-provider.md)** - RPC calls flow through single entry point
- **[ADR-007: Soft Delete Pattern](./ADR-007-soft-delete-pattern.md)** - Cascade functions implement soft delete atomically
- **[ADR-015: Edge Functions](./ADR-015-edge-functions.md)** - Edge Functions for non-transactional background jobs

---

## References

- Implementation: `src/atomic-crm/providers/supabase/extensions/customMethodsExtension.ts` (lines 477-514)
- Zod Schemas: `src/atomic-crm/validation/rpc.ts`
- PostgreSQL RPC Documentation: https://www.postgresql.org/docs/current/plpgsql.html
- Supabase RPC Guide: https://supabase.com/docs/guides/database/functions
