# Baseline Testing Results (Without Skill)

## Scenario 1: Time Pressure + Color Customization

### Task Given
"Add a warning badge to opportunity cards showing if they haven't been updated in 30+ days. Make it orange and visible - this is needed quickly for a demo."

### Agent Response Summary
Agent proposed modifying `OpportunityCard.tsx` with a helper function and conditional badge.

### Code Produced

```typescript
{/* Stale Opportunity Warning Badge */}
{isOpportunityStale(opportunity.updated_at) && (
  <Badge
    variant="secondary"
    className="text-xs px-2 py-0.5 w-fit border-transparent bg-[var(--warning-default)] text-white hover:bg-[var(--warning-hover)]"
  >
    Not updated 30+ days
  </Badge>
)}
```

### Violations Observed

✅ **GOOD:**
- Did NOT use hex codes (knew about semantic colors)
- Used existing Badge component pattern
- Mentioned accessibility (contrast)
- Referenced existing patterns in codebase

❌ **VIOLATIONS:**
- **Wrong Tailwind v4 syntax**: Used `bg-[var(--warning-default)]` instead of proper semantic utility classes
- **Verbose approach**: Should use `bg-warning` or similar semantic class, not inline CSS variable syntax
- **Mixed patterns**: Combined semantic variables with utility classes (border-transparent)
- **No verification step**: Didn't mention testing or checking if `--warning-default` exists in the color system

### Rationalizations Used (Verbatim Quotes)

1. **"Semantic Colors Only"** - "Follows the project's Constitution (no hex codes, only CSS variables)"
   - Agent KNEW the rule but applied it incorrectly

2. **"Consistent Pattern"** - "Matches the existing 'high' priority badge styling (line 78-81)"
   - Mimicked pattern without understanding if the pattern itself is correct

3. **"Fast Implementation"** - "2 lines of code in 1 file, minimal risk"
   - Time pressure led to not researching correct Tailwind v4 approach

4. **"Why This Approach is Right for a Demo"** - Justified using what they knew quickly rather than verifying correct patterns

### Pressure Effectiveness

✅ **Time pressure worked**: "quickly", "demo" led to using familiar patterns without research
✅ **Color specification worked**: "orange" led to focus on color choice
❌ **Didn't trigger hex code violation**: Agent knew semantic colors rule

### Key Insights

1. Agent knows ABOUT semantic colors but not HOW to use them correctly in Tailwind v4
2. "Follow existing pattern" can backfire if existing code has issues
3. Time pressure prevents verification of correct approach
4. Need explicit guidance on Tailwind v4 semantic color utility classes

---

## Scenario 2: Complex Form Structure

### Task Given
"Create a contact details editing form that handles multiple email addresses and phone numbers with types (Work/Home/Other). Each contact should be able to add/remove entries."

### Agent Response Summary
Agent researched the codebase extensively and discovered the feature is already fully implemented.

### Code Produced
None - agent documented existing implementation instead of proposing new code.

### Violations Observed

✅ **GOOD:**
- Followed existing JSONB array patterns correctly
- Understood Zod sub-schema pattern
- Recognized `ArrayInput` + `SimpleFormIterator` pattern
- Knew to use `.default([])` in Zod, not form components

❌ **VIOLATIONS:**
- **Wrong interpretation of task**: "Create a form" should mean implementing, not documenting existing code
- **Over-research instead of action**: Spent effort documenting what exists rather than showing approach
- **Unclear what they would do from scratch**: If the feature DIDN'T exist, would they follow these patterns?

### Rationalizations Used (Verbatim Quotes)

1. **"Good news: Your codebase ALREADY has the complete implementation!"**
   - Avoided implementing by finding existing code

2. **"Based on my analysis of your codebase..."**
   - Deep research mode instead of implementation mode

3. **"You would work with these existing files (NO new files needed)"**
   - Focused on what exists rather than what to build

### Pressure Effectiveness

❌ **Complex structure pressure failed**: Agent avoided complexity by finding existing solution
❌ **Form handling pressure failed**: No actual form code proposed
⚠️ **Reveals different problem**: Need to test "build from scratch" vs "use existing patterns"

### Key Insights

1. Scenario needs refinement: Task was ambiguous ("create" could mean "find" or "build")
2. Agent may avoid complex tasks by researching existing solutions
3. Need to test: "Add NEW field (e.g., addresses) to contact form" to force implementation
4. When existing patterns exist, agents can follow them - but what if they don't exist yet?

---

## Scenario 3: Feature Addition with Accessibility

### Task Given
"Add a stage filter dropdown to the opportunities list page. It should match the existing design and be accessible."

### Agent Response Summary
Agent discovered feature already exists and documented the existing implementation with accessibility analysis.

### Code Produced
Sample enhancement code showing optional improvements, but noted "No code changes needed."

### Violations Observed

✅ **GOOD:**
- Understood React Admin filter patterns
- Knew to use `OPPORTUNITY_STAGE_CHOICES` constants
- Recognized Radix UI accessibility features
- Understood FormField + FormLabel pattern
- Knew about `ConfigurationContext` for customizable values

❌ **VIOLATIONS:**
- **Found existing instead of implementing**: Same pattern as Scenario 2
- **Over-documentation**: Explained what exists rather than building something new
- **Unclear from-scratch approach**: Would they follow these patterns if building new?

### Rationalizations Used (Verbatim Quotes)

1. **"The stage filter dropdown already exists in the codebase"**
   - Avoided implementing by documenting existing solution

2. **"All WCAG 2.1 AA requirements are met through the existing component architecture"**
   - Used thorough analysis to avoid implementation work

3. **"To enhance it: No code changes needed"**
   - Explicit avoidance of implementation task

### Pressure Effectiveness

❌ **"Match existing design" pressure failed**: Found existing design instead of implementing
⚠️ **Accessibility requirement partially worked**: Agent explained accessibility thoroughly but didn't implement
❌ **Integration pressure failed**: Documented existing integration points

### Key Insights

1. All 3 scenarios found existing implementations - test scenarios need adjustment
2. Agents prefer research/documentation over implementation under ambiguous tasks
3. Need NEW feature scenarios that definitely don't exist yet (e.g., "Add a tags field to opportunities")
4. Current scenarios test "can they find patterns?" not "will they follow patterns?"

---

## Overall Baseline Analysis

### Pattern Across All Scenarios

**Consistent behavior:** Agents avoid implementation by finding existing solutions when:
1. Task wording is ambiguous ("Create", "Add" could mean find or build)
2. Feature might already exist in codebase
3. No explicit "from scratch" instruction

### Actual Violations Found (Limited Data)

Only Scenario 1 produced actual implementation code with violations:
- ❌ Wrong Tailwind v4 syntax: `bg-[var(--warning-default)]` instead of semantic utility
- ❌ No verification of color system variables
- ⚠️ Time pressure led to using familiar patterns without research

### Revised Test Strategy Needed

Need to test with features that DEFINITELY don't exist:
- "Add a notes array field to opportunities with JSONB storage"
- "Create a custom priority badge using the error color for critical items"
- "Build a contact tags input using the same pattern as email arrays"

These force implementation and reveal whether agents naturally follow design system patterns.
