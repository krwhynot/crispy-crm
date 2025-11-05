# Task Template & Guidelines
**Version:** 1.0
**Purpose:** Standardized format for all implementation tasks

---

## Task ID Format

```
P[Phase]-E[Epic]-S[Story]-T[Task]
```

Examples:
- `P1-E1-S1-T1` = Phase 1, Epic 1, Story 1, Task 1
- `P3-E2-S3-T4` = Phase 3, Epic 2, Story 3, Task 4
- `P4-INT-T1` = Phase 4, Integration Task 1

---

## Standard Task Template

```markdown
## Task [ID]: [Descriptive Title]

**Confidence:** [0-100]%
**Estimate:** [X] hours
**Type:** feature | bug | chore | infrastructure | spike
**Layer:** frontend | backend | database | integration
**Priority:** ⭐ Critical | High | Medium | Low

### Prerequisites
- [ ] Task ID: [Dependency description]
- [ ] Task ID: [Another dependency]

### Description
[2-3 sentences explaining what needs to be done and why]

### Implementation Steps
1. [First step with time estimate]
2. [Second step with time estimate]
3. [Third step with time estimate]

### Acceptance Criteria
- [ ] [Specific deliverable or outcome]
- [ ] [Another measurable outcome]
- [ ] Tests written and passing
- [ ] Documentation updated

### Risk Factors
- **Risk:** [What could go wrong]
- **Impact:** [What happens if it goes wrong]
- **Mitigation:** [How to prevent or handle]

### Technical Notes
- [Implementation hints]
- [Code patterns to follow]
- [Files that will be modified]

### Testing Requirements
- [ ] Unit tests for [specific functions]
- [ ] Integration test for [workflow]
- [ ] Manual test: [scenario]

### References
- PRD Section: [X.X]
- Related Tasks: [IDs]
- Documentation: [links]
```

---

## Task Sizing Guidelines

### Small (1-2 hours)
- Single file change
- Simple UI component
- Configuration update
- Documentation task

### Medium (2-4 hours)
- New feature component
- Database migration
- API endpoint
- Complex UI interaction

### Large (4-8 hours)
- Full CRUD module
- Complex integration
- Performance optimization
- Major refactoring

### Too Large (>8 hours)
- **Must be broken down**
- Create sub-tasks
- Each under 4 hours

---

## Confidence Rating Guide

### 90-100% - Very High Confidence
- Clear requirements
- Established patterns exist
- Done similar before
- No external dependencies

### 70-89% - High Confidence
- Requirements mostly clear
- Some interpretation needed
- Familiar technology
- Minor unknowns

### 50-69% - Medium Confidence
- Requirements need clarification
- New patterns required
- Some research needed
- Integration complexity

### 30-49% - Low Confidence
- Vague requirements
- Unknown technology
- Needs spike/research
- High complexity

### <30% - Very Low Confidence
- **Requires spike first**
- Major unknowns
- No clear approach
- High risk

---

## Task Type Definitions

### Feature
- User-facing functionality
- Adds business value
- Has acceptance criteria
- Requires testing

### Bug
- Fixes broken functionality
- Has reproduction steps
- Includes regression test
- Documents root cause

### Chore
- Maintenance task
- No user-facing change
- Technical improvement
- Documentation update

### Infrastructure
- Development environment
- Build configuration
- CI/CD pipeline
- Deployment setup

### Spike
- Time-boxed research
- Technical investigation
- Proof of concept
- Output is knowledge

---

## Writing Good Task Descriptions

### DO ✅
- Start with action verb
- Be specific about outcome
- Include context/why
- Reference PRD section
- List affected files

### DON'T ❌
- Be vague ("Fix stuff")
- Combine multiple tasks
- Assume context
- Skip acceptance criteria
- Forget dependencies

---

## Examples

### Good Task ✅

```markdown
## Task P3-E1-S1-T2: Create opportunities table migration

**Confidence:** 90%
**Estimate:** 2 hours
**Type:** feature
**Layer:** database

### Prerequisites
- [ ] P2-E1-S1-T1: Organizations table exists
- [ ] P2-E2-S1-T1: Contacts table exists

### Description
Create Supabase migration for opportunities table with all fields from PRD section 3.4, including three organization relationships (customer, principal, distributor) and campaign field for trade show grouping.

### Implementation Steps
1. Create migration file with `npx supabase migration new` (10 min)
2. Define table schema with constraints (45 min)
3. Add RLS policies for team access (30 min)
4. Create indexes on foreign keys (15 min)
5. Test migration locally (20 min)

### Acceptance Criteria
- [ ] Migration runs without errors
- [ ] All PRD fields included
- [ ] Foreign key constraints work
- [ ] RLS policies allow team access
- [ ] Indexes on all foreign keys
- [ ] Principal field marked NOT NULL

### Risk Factors
- **Risk:** Complex RLS policies
- **Impact:** Security issues
- **Mitigation:** Copy from organizations table

### Technical Notes
- Use BIGINT for IDs (not UUID)
- campaign field is TEXT (nullable)
- Add CHECK constraint for stage values
- Include created_by/updated_by audit fields
```

### Poor Task ❌

```markdown
## Task: Make opportunities work

Do the opportunities stuff from the PRD.

Time: Not sure, maybe a day?
```

---

## Task State Tracking

### States
1. **Backlog** - Not started, may change
2. **To Do** - Ready to start, dependencies met
3. **In Progress** - Currently working
4. **Review** - Code complete, needs review
5. **Done** - Reviewed, tested, merged

### Transitions
- Backlog → To Do: Dependencies resolved
- To Do → In Progress: Developer assigns
- In Progress → Review: PR created
- Review → Done: PR merged
- Any → Blocked: Dependency issue

---

## Daily Task Management

### Starting a Task
1. Check prerequisites met
2. Read PRD section
3. Review acceptance criteria
4. Create feature branch
5. Update task to "In Progress"

### During Work
1. Follow implementation steps
2. Write tests as you go
3. Document decisions
4. Update estimate if needed

### Completing a Task
1. Run all tests
2. Self-review changes
3. Update documentation
4. Create PR with task ID
5. Move to "Review"

---

## Task Documentation

### Required
- Task ID in commit messages
- Task ID in PR title
- Acceptance criteria checked
- Test results included

### Optional
- Screenshots for UI tasks
- Performance metrics
- Lessons learned
- Time tracking

---

*Use this template for all tasks to ensure consistency and completeness.*