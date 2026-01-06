Based on your **Engineering Constitution** and our specific strategy for the **Data Provider Migration** (Strangler Fig pattern), here are the **Golden Rules for Data Providers**.

You can paste these rules at the top of any future task or save them as `PROVIDER_RULES.md` in your project root to keep Claude Code (and human developers) aligned.

---

# 🛡️ Data Provider Golden Rules

*For the React Admin + Supabase Architecture*

### 1. The "Strangler Fig" Strategy (Migration Rule)

* **Existing Resources:** Do **NOT** refactor existing resources in `unifiedDataProvider.ts` unless you are specifically assigned a "Migration Task." If fixing a bug, apply the **minimal patch** to the existing file.
* **New Resources:** **NEVER** add new resources to `unifiedDataProvider.ts`. All new resources must be built using the **Composed Handler Pattern** in `src/providers/supabase/handlers/`.
* **Goal:** The `unifiedDataProvider.ts` should only shrink, never grow.

### 2. View vs. Table Duality (Read/Write Rule)

* **Reads (`getList`, `getOne`):** Query the **SQL View** (e.g., `*_summary`) to get computed fields (counts, joined names) efficiently.
* **Writes (`create`, `update`):** Write directly to the **Base Table**.
* **The Transform:** You **MUST** strip "View-Only" fields (like `customer_organization_name` or `nb_notes`) before sending data back to the Base Table. Use the `TransformService` for this.

### 3. Zod at the Boundary (Validation Rule)

* **Single Source of Truth:** Do not rely on React Admin form validation alone.
* **Mandatory Validation:** Every `create` and `update` method in a Handler **MUST** validate inputs using the schemas in `src/atomic-crm/validation/`.
* **Fail Fast:** If Zod fails, throw an `HttpError` with the `body: { errors: ... }` payload so the UI highlights the specific fields.

### 4. Service Layer Encapsulation (Business Logic Rule)

* **Provider = Translator:** The Data Provider is for **Translation Only** (React Admin params  Supabase params).
* **Services = Logic:** Complex operations (e.g., "Create Opportunity AND sync Products AND update status") belong in a **Service Class** (e.g., `OpportunitiesService`), not inside the Handler/Provider.
* **No Raw Supabase Calls:** Handlers should generally not call `supabase.from()` directly for complex logic; they should delegate to a Service.

### 5. Soft Deletes Only (Data Safety Rule)

* **Never DELETE:** Unless explicitly instructed (e.g., for `Tags`), always use `update({ deleted_at: new Date() })`.
* **Filter Automatically:** Ensure all `getList` queries automatically append `.is('deleted_at', null)` unless the user specifically asks for "Archived" records.

### 6. Explicit Error Handling (DX Rule)

* **No Generic Errors:** Never throw `new Error("Failed")`.
* **Catch & Map:** Always catch errors and map them to:
* **Validation:** `400` + Field Errors
* **Foreign Key:** `409` + "This record is used by another resource"
* **RLS/Auth:** `403` + "You do not have permission"



### 7. No Magic, Just Handlers (Simplicity Rule)

* **Explicit Composition:** When creating a new Handler, explicitly compose the wrappers:
```typescript
// Correct Order: Validation -> Lifecycle (stripping) -> Error Logging
return withErrorLogging(
   withLifecycleCallbacks(
      withValidation(baseHandler), 
      callbacks
   )
);

```


* **No Auto-Magic:** Do not build complex "Auto-CRUD" factories that try to guess table names. Explicitly define `contactsHandler`, `tasksHandler`, etc.

---

### 📝 Quick Checklist for Code Reviews

* [ ] Did I add code to `unifiedDataProvider.ts`? (If YES -> **STOP**. Is this a bug fix? If not, move to a Handler.)
* [ ] Am I writing to a View? (If YES -> **STOP**. Write to the Base Table.)
* [ ] Did I use Zod validation?
* [ ] Did I put business logic (like sending emails) in the Provider? (If YES -> **STOP**. Move to a Service.)