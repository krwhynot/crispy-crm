# UI Design Consistency Skill - Revised Test Scenarios

## Purpose
Force agents to implement NEW features (that don't exist) to capture design system violations.

## Expected Violations to Watch For
- Using inline CSS variable syntax instead of Tailwind semantic utilities
- Using hex codes instead of semantic CSS variables
- Not using Zod validation schemas
- Wrong JSONB array handling patterns
- Missing accessibility attributes
- Not using ConfigurationContext for customizable values

---

## Revised Scenario 1: Custom Badge Color (Forces Color System Usage)

**Task:** "Add a 'critical' variant to the Badge component that uses the destructive/error red color. This needs to stand out more than the current 'high' priority. Make it bright red and urgent-looking for the demo tomorrow."

**Pressures:**
- Time urgency ("demo tomorrow")
- Specific color request ("bright red", "urgent-looking")
- Temptation to use hex codes or inline styles

**Expected Violations:**
- Using `#FF0000` or similar hex code
- Using `bg-[var(--destructive)]` inline syntax instead of `bg-destructive` utility
- Not checking if `destructive` variant already exists
- Inline styles or className hacks

**Why This Works:**
- Badge component exists but "critical" variant might not
- Forces color system decision
- Deadline pressure encourages shortcuts

---

## Revised Scenario 2: New JSONB Array Field (Forces Pattern Adherence)

**Task:** "Contacts need a 'websites' field where users can add multiple URLs with types (Personal/Company/Portfolio). Use the same add/remove pattern as email addresses. This is for a client meeting Thursday."

**Pressures:**
- Complex JSONB array requirement
- Reference to existing pattern ("same as email")
- Time constraint ("Thursday")
- Multiple sub-fields (URL + type)

**Expected Violations:**
- Not using sub-schema pattern like `emailAndTypeSchema`
- Setting defaultValue in component instead of Zod schema
- Wrong `ArrayInput` + `SimpleFormIterator` usage
- Not creating database migration
- Hardcoding type choices instead of using enum

**Why This Works:**
- "websites" field definitely doesn't exist
- Must implement from scratch following patterns
- Tests whether they understand the JSONB array pattern deeply

---

## Revised Scenario 3: Configuration-Driven Dropdown (Forces Context Usage)

**Task:** "Add a 'source' dropdown to opportunity create/edit forms with options like 'Referral', 'Website', 'Cold Call', etc. Make it customizable so users can configure their own source types. Match the existing form styling."

**Pressures:**
- Must use ConfigurationContext pattern
- Requires Zod validation
- Integration with existing forms
- "Customizable" hints at configuration pattern

**Expected Violations:**
- Hardcoding choices array instead of using ConfigurationContext
- Not adding configuration prop to `<CRM>` component in App.tsx
- Missing Zod enum schema
- Wrong form component pattern (not using React Admin's SelectInput)
- Not updating ContactInputs/OpportunityInputs properly

**Why This Works:**
- Tests understanding of configuration architecture
- Forces following the customization pattern
- Requires knowledge of how ConfigurationContext flows through the app

---

## Additional Quick Test: Tailwind v4 Semantic Colors

**Micro-Task:** "Update the opportunity priority badges to use Tailwind v4 semantic color utilities instead of inline variable syntax."

**Expected Behavior:**
- Change `bg-[var(--warning-default)]` to `bg-warning`
- Change `text-[var(--text-primary)]` to `text-foreground`
- Use proper Tailwind utilities throughout

**Expected Violations:**
- Not knowing correct Tailwind v4 utility names
- Keeping inline `bg-[var(--...)]` syntax
- Using hex codes as "fix"

---

## Documentation Template (Same as Before)

For each scenario run, document:

### Agent Response (Verbatim)
[Paste agent's complete response]

### Code Produced
[Paste actual code written]

### Violations Observed
- [ ] Hex codes instead of semantic variables
- [ ] Wrong Tailwind v4 syntax (inline vars)
- [ ] Missing Zod validation
- [ ] Wrong JSONB pattern
- [ ] Missing accessibility
- [ ] Not using ConfigurationContext
- [ ] Hardcoded values
- [ ] Other: ___________

### Rationalizations Used
[Exact quotes of why they made those choices]

### Pressure Effectiveness
[Which pressures triggered violations?]
