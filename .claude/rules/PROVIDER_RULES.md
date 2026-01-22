Based on your **Engineering Constitution** and our specific strategy for the **Data Provider Migration** (Strangler Fig pattern), here are the **Golden Rules for Data Providers**.

You can paste these rules at the top of any future task or save them as `PROVIDER_RULES.md` in your project root to keep Claude Code (and human developers) aligned.

---
# 🛡️ Data Provider Golden Rules

> **Status:** Active & Enforced
> **Architecture:** Composed Proxy Pattern (No Monoliths)

These rules govern the `src/atomic-crm/providers/supabase/` subsystem.

---

### 1. Composed Architecture Only (No Monoliths)

* **The Monolith is Dead:** The old `unifiedDataProvider.ts` has been deleted. Never try to recreate it.
* **Modular Handlers:** Every resource **MUST** have its own dedicated handler file in `handlers/[resource]Handler.ts` (e.g., `contactsHandler.ts`, `tasksHandler.ts`).
* **Central Registration:** All handlers must be registered in the `composedDataProvider.ts` registry.
* **Factory Pattern:** Use factory functions (e.g., `createTasksHandler`) to build providers, not inline object literals.

### 2. View vs. Table Duality (Read/Write Separation)

* **Reads (`getList`, `getOne`):**
    * Always query the **SQL View** (e.g., `contacts_summary`, `opportunities_summary`) to fetch computed fields efficiently.
* **Writes (`create`, `update`):**
    * Always write directly to the **Base Table**.
* **The Strip Rule:**
    * You **MUST** define `COMPUTED_FIELDS` in your `callbacks/[resource]Callbacks.ts`.
    * The `withLifecycleCallbacks` wrapper will automatically strip these fields before saving to the database.

### 3. Zod at the Boundary (Validation Rule)

* **Single Source of Truth:** Never rely solely on React Admin form validation.
* **API Boundary:** Validation must happen in the Provider layer, just before the database call.
* **Implementation:**
    * Create schemas in `src/atomic-crm/validation/`.
    * Register them in `services/ValidationService.ts`.
    * The `withValidation` wrapper will automatically enforce them and throw `400` errors.

### 4. Service Layer Encapsulation (Business Logic Rule)

* **Handlers = Plumbing:** Handlers should only map React Admin parameters to Supabase parameters.
* **Services = Logic:** Complex business operations belong in **Service Classes** (`src/services/`), not handlers.
    * *Example:* "Archive Opportunity" -> `OpportunitiesService`
    * *Example:* "Create User" -> `SalesService` (Edge Functions)
* **No Raw RPCs:** Do not call `supabase.rpc()` inside a handler if it involves business logic. Delegate to a Service.

### 5. Soft Deletes Only (Data Safety Rule)

* **Never DELETE:** Unless explicitly exempted (like `Tags`), always use **Soft Deletes**.
* **Configuration:** Set `supportsSoftDelete: true` in your `createResourceCallbacks` config.
* **Enforcement:** The `withSkipDelete` wrapper intercepts delete requests and converts them to `UPDATE ... SET deleted_at = NOW()`.
* **Filtering:** Your `getList` handler must filter `deleted_at IS NULL` (usually handled automatically by the Database View).

### 6. Explicit Error Handling (DX Rule)

* **Structured Logging:** All handlers **MUST** be wrapped with `withErrorLogging`.
* **No Console Logs:** Do not use `console.log` or `console.error`. The wrapper handles Sentry reporting and context logging automatically.
* **Idempotency:** Delete operations must return **success** if the record is already deleted (handled by the wrapper).

### 7. Explicit Composition Order (Simplicity Rule)

When creating a new handler, you must compose the wrappers in this exact order (Innermost to Outermost) to ensure safety:

```typescript
// handlers/myResourceHandler.ts

export function createMyHandler(baseProvider: DataProvider): DataProvider {
  // 1. baseProvider: The raw database connection
  // 2. withValidation: Checks data validity FIRST
  // 3. withLifecycleCallbacks: Strips computed fields & runs hooks
  // 4. withErrorLogging: Catches errors from all layers below

  return withErrorLogging(
    withLifecycleCallbacks(
      withValidation(baseProvider),
      [myResourceCallbacks]
    )
  );
}

```


* **No Auto-Magic:** Do not build complex "Auto-CRUD" factories that try to guess table names. Explicitly define `contactsHandler`, `tasksHandler`, etc.

---

### 📝 Quick Checklist for Code Reviews

* [ ] File Location: Is this a new file in handlers/? (If in unifiedDataProvider -> REJECT)
* [ ] Registration: Is it added to composedDataProvider.ts?
* [ ] View Duality: Does it read from _summary view and write to base table?
* [ ] Cleanup: Are COMPUTED_FIELDS defined in the callbacks?
* [ ] Validation: Is the Zod schema registered in ValidationService?
* [ ] Safety: Is supportsSoftDelete enabled?
* [ ] Logging: Is withErrorLogging the outermost wrapper?