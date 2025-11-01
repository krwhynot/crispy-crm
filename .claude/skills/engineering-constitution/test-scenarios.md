# Engineering Constitution Skill - Test Scenarios

## Purpose
Test whether agents naturally follow Atomic CRM's Engineering Constitution principles without explicit guidance.

## Expected Violations to Watch For
- Over-engineering (adding retry logic, circuit breakers, fallbacks)
- Multiple validation sources (validating outside Zod schemas)
- Hardcoded form defaults (not using `zodSchema.partial().parse({})`)
- Wrong TypeScript patterns (`type` for objects, `interface` for unions)
- Using raw HTML inputs instead of React Admin components

---

## Scenario 1: Error Handling - Tests "NO OVER-ENGINEERING" Principle

**Task:** "The Supabase API occasionally returns 429 rate limit errors. Add error handling to the contact creation flow to make it more resilient. This is critical for production."

**Pressures:**
- Production context ("critical for production")
- Real problem (rate limit errors)
- Temptation to add retry logic
- Desire to be "production-ready"

**Expected Violations:**
- Adding retry logic with exponential backoff
- Circuit breaker pattern
- Fallback data or graceful degradation
- Complex error handling state machine

**Constitution says:** Fail fast. No circuit breakers. Let it throw.

---

## Scenario 2: Form Validation - Tests "SINGLE SOURCE OF TRUTH" Principle

**Task:** "Add email validation to the contact form. Make sure invalid emails can't be submitted - check format before the form submits."

**Pressures:**
- Explicit request for validation
- "Before form submits" hints at client-side validation
- Temptation to add inline validation logic

**Expected Violations:**
- Adding `isValidEmail()` utility function in component
- Inline regex validation in form submit handler
- Custom validation logic outside Zod schema
- Duplicate validation (UI + Zod)

**Constitution says:** Zod schema at API boundary only (`src/atomic-crm/validation/`).

---

## Scenario 3: Form Defaults - Tests "FORM STATE DERIVED FROM TRUTH" Principle

**Task:** "Create a new opportunity form. Default values should be: stage='new_lead', priority='medium', probability=50. Make it work quickly."

**Pressures:**
- Explicit default values given
- Time pressure ("quickly")
- Temptation to hardcode in component

**Expected Violations:**
- Hardcoding defaults in `useForm({ defaultValues: { stage: 'new_lead' } })`
- Using `defaultValue` prop on form inputs
- Not using `zodSchema.partial().parse({})`
- Defaults in component, not schema

**Constitution says:** Must use `opportunityCreateSchema.partial().parse({})` for defaults.

---

## Scenario 4: TypeScript Types - Tests "TYPESCRIPT" Convention

**Task:** "Create types for the opportunity status values and the opportunity data structure. We need proper TypeScript for the refactor."

**Pressures:**
- General request (no specific pattern guidance)
- Natural tendency to use `type` for everything

**Expected Violations:**
- `type` for object shapes (should be `interface`)
- `interface` for unions (should be `type`)
- Inconsistent naming conventions

**Constitution says:** `interface` for objects/classes, `type` for unions/intersections.

---

## Scenario 5: Boy Scout Rule - Tests Code Cleanup Discipline

**Task:** "Add a 'website' field to the contact edit form in ContactInputs.tsx."

**File Context:** ContactInputs.tsx has:
- Unused imports
- Inconsistent spacing
- Missing type annotation on a prop
- Commented-out code block

**Pressures:**
- Simple task (just add one field)
- Temptation to ignore existing issues
- "I'll fix that later" mindset

**Expected Violations:**
- Adding new field without cleaning up file
- Leaving unused imports
- Ignoring inconsistent formatting
- Not adding missing type annotations

**Constitution says:** Fix inconsistencies when editing files (Boy Scout Rule).

---

## Documentation Template

For each scenario run, document:

### Agent Response (Verbatim)
[Paste agent's complete response]

### Code Produced
[Paste actual code written]

### Violations Observed
- [ ] Over-engineering (retry logic, circuit breakers)
- [ ] Multiple validation sources (not using Zod)
- [ ] Hardcoded form defaults (not using schema.partial().parse({}))
- [ ] Wrong TypeScript pattern (type for objects)
- [ ] Boy Scout violations (not fixing nearby issues)
- [ ] Other: ___________

### Rationalizations Used
[Exact quotes of why they made those choices]

### Pressure Effectiveness
[Which pressures triggered violations?]

---

## Baseline Testing Strategy

1. Run each scenario WITHOUT the Engineering Constitution skill
2. Document exact code violations and rationalizations
3. Identify patterns across scenarios
4. Write skill addressing observed violations
5. Re-test with skill to verify compliance
