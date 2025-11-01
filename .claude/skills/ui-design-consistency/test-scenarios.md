# UI Design Consistency Skill - Test Scenarios

## Purpose
Test whether agents follow Atomic CRM design system patterns without the skill.

## Expected Violations to Watch For
- Using hex codes instead of semantic CSS variables
- Not using Zod validation schemas
- Wrong JSONB array handling patterns
- Missing accessibility attributes
- Not following React Admin patterns
- Skipping form state initialization with `zodSchema.partial().parse({})`

---

## Scenario 1: Time Pressure + Color Customization

**Task:** "Add a warning badge to opportunity cards showing if they haven't been updated in 30+ days. Make it orange and visible - this is needed quickly for a demo."

**Pressures:**
- Time urgency ("quickly", "demo")
- Specific color request (tempts hex codes)
- Visual prominence requirement

**Expected Violations:**
- Using `#FF6600` or `orange` instead of `--accent-clay-600` or `--destructive`
- Inline styles instead of Tailwind classes with CSS variables
- Skipping accessibility (no aria-label, bad color contrast)

---

## Scenario 2: Complex Form Structure

**Task:** "Create a contact details editing form that handles multiple email addresses and phone numbers with types (Work/Home/Other). Each contact should be able to add/remove entries."

**Pressures:**
- Complex JSONB array handling
- Multiple related form inputs
- Dynamic add/remove functionality

**Expected Violations:**
- Not using established `emailAndTypeSchema` / `phoneNumberAndTypeSchema` patterns
- Missing Zod validation setup
- Not using `ArrayInput` + `SimpleFormIterator` pattern from React Admin
- Setting `defaultValue` in form components instead of Zod schema
- Wrong form state initialization (not using `zodSchema.partial().parse({})`)

---

## Scenario 3: Feature Addition with Accessibility

**Task:** "Add a stage filter dropdown to the opportunities list page. It should match the existing design and be accessible."

**Pressures:**
- "Match existing design" (vague - which patterns?)
- Accessibility requirement (but not specific)
- Integration with existing list view

**Expected Violations:**
- Not using React Admin's `<FilterList>` or `<SelectInput>` components
- Inconsistent styling (not following established filter patterns)
- Missing aria-label or role attributes
- Not using configuration context for `opportunityStages` values
- Hardcoding values instead of using `ConfigurationContext`

---

## Documentation Template

For each scenario run, document:

### Agent Response (Verbatim)
[Paste agent's complete response]

### Code Produced
[Paste actual code written]

### Violations Observed
- [ ] Hex codes instead of semantic variables
- [ ] Missing Zod validation
- [ ] Wrong JSONB pattern
- [ ] Missing accessibility
- [ ] Wrong React Admin pattern
- [ ] Hardcoded values instead of context
- [ ] Other: ___________

### Rationalizations Used
[Exact quotes of why they made those choices]

### Pressure Effectiveness
[Which pressures triggered violations?]
