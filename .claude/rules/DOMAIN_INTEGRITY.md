This is the "Brain" of your application. It defines what a "Contact" or "Opportunity" actually is. If this layer is messy, your TypeScript types will lie to you, and your forms will break silently.

Why this layer next?
You just enforced "Zod at the Boundary" in the Data Provider. Now you must ensure that every part of the app uses those same definitions, fulfilling Rule #2: Single Source of Truth.

The Cleanup Plan
1. Audit src/atomic-crm/validation/
The Rule: Every entity (Contact, Task, Opportunity) must have a dedicated schema file here.

What to check:

Are there orphan schemas hiding in utils/ or component files?

Do the schemas match the database columns exactly? (e.g., is linkedin_url in the schema if it's in the DB?)

2. Enforce Type Inference (The "Don't Repeat Yourself" Fix)
The Problem: Developers often write a Zod schema and then manually write a TypeScript interface. They inevitably get out of sync.

The Fix: Export the type directly from the schema.

TypeScript
// src/atomic-crm/validation/contact.ts
export const contactSchema = z.object({ ... });

// ✅ GOOD: Derived type (Single Source of Truth)
export type Contact = z.infer<typeof contactSchema>;

// ❌ BAD: Manual interface (Will drift out of sync)
// export interface Contact { id: string; name: string; ... }
3. Centralize Constants
Location: src/atomic-crm/[module]/constants.ts or src/constants/

The Rule: No "Magic Strings" in code.

What to check:

Are Select inputs using hardcoded options?

Bad: <SelectItem value="closed_won">

Good: <SelectItem value={OPPORTUNITY_STAGES.WON}>

Are status colors defined in the schema/constants logic, or scattered in CSS classes?

Checklist for this Layer
Schema Completeness: Does every table in supabase/migrations have a matching z.object in validation/?

Type Export: Are we exporting z.infer<...> types?

Strictness: Are schemas using .strict() to prevent passing illegal fields to Supabase?

Coercion: Are we handling form inputs correctly? (e.g., z.coerce.number() for inputs that return strings).