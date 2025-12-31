# PATTERNS.md Generation Template

This is the master template for generating PATTERNS.md files. Each prompt in this directory follows this structure.

---

## Prompt Structure

Each generation prompt includes:
1. **YAML Frontmatter** - Metadata about the target directory
2. **Context Section** - What the directory contains and why it matters
3. **Phase 1: Exploration** - Specific files to read with purpose
4. **Phase 2: Pattern Identification** - What patterns to look for
5. **Phase 3: Generate PATTERNS.md** - The output structure
6. **Phase 4: Write the File** - Where to save the result

---

## PATTERNS.md Output Structure

When generating a PATTERNS.md file, use this structure:

```markdown
# {Directory Name} Patterns

{Brief 1-2 sentence description of directory purpose}

## Architecture Overview

```
{ASCII diagram showing relationships between files/components}
{Use → for data flow, │ for hierarchy, ├ └ for tree structure}
```

---

## Pattern A: {Pattern Name}

{1-2 sentence description of what this pattern solves}

**When to use**: {Specific scenarios or decision criteria}

### {Subsection if needed}

```typescript
// {Actual file path from codebase}
{Real code example - not pseudo-code}
```

**Key points:**
- {Technical detail or gotcha}
- {Common mistake to avoid}
- {Performance or security consideration}

**Example:** `{path/to/file.tsx}`

---

{Repeat for Patterns B, C, D, E...}

---

## Pattern Comparison Table

| Aspect | Pattern A | Pattern B | Pattern C |
|--------|-----------|-----------|-----------|
| **Purpose** | | | |
| **When to use** | | | |
| **Key method/file** | | | |
| **Complexity** | | | |

---

## Anti-Patterns to Avoid

### 1. {Anti-Pattern Name}

```typescript
// BAD: {Why this is wrong}
{Bad code example}

// GOOD: {The correct approach}
{Good code example}
```

### 2. {Another Anti-Pattern}

{Repeat structure}

---

## {Feature} Checklist

When adding/modifying {feature type}:

1. [ ] {First step with file path}
2. [ ] {Second step with specific detail}
3. [ ] {Verification step}
4. [ ] Verify: `{verification command}`

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: {Name}** | `{file1.ts}`, `{file2.tsx}` |
| **B: {Name}** | `{file3.ts}` |
```

---

## Style Guidelines

### Code Examples
- Always use real code from the codebase, not pseudo-code
- Include actual file paths as comments: `// src/path/to/file.ts`
- Show imports when relevant to the pattern
- Include 2-3 related examples showing variations

### Writing Style
- Professional, imperative tone: "When to use", "Key points"
- Brevity with precision: 1-3 sentences max, then code
- Prescriptive: "Always do X", "Never do Y"
- Focus on WHY, not just WHAT

### ASCII Diagrams
- Use Unicode box-drawing characters: `│ ├ └ ─ ┌ ┐ └ ┘ ┬ ┴ ┼`
- Use arrows for data flow: `→ ← ↓ ↑`
- Keep diagrams under 80 characters wide
- Show relationships, not just lists

### Pattern Naming
- Sequential: Pattern A, B, C, D, E...
- Descriptive names: "Global Mock Setup", not just "Setup"
- 3-6 patterns per PATTERNS.md file

### Key Points Format
- 3-5 bullet points per pattern
- Technical details developers need to remember
- Gotchas and common mistakes
- Never paragraphs - short, punchy notes

---

## Quality Checklist

Before finalizing a generated PATTERNS.md:

- [ ] All code examples reference files that actually exist
- [ ] ASCII diagram accurately reflects current architecture
- [ ] Pattern names are descriptive and unique
- [ ] Anti-patterns are real issues (not hypothetical)
- [ ] Checklist covers common developer scenarios
- [ ] File Reference table lists all key files
- [ ] No placeholder text remains

---

## Reference Files

These existing PATTERNS.md files demonstrate the standard:

| File | Patterns | Good Example Of |
|------|----------|-----------------|
| `src/atomic-crm/validation/PATTERNS.md` | 10 | Comprehensive coverage, security focus |
| `supabase/migrations/PATTERNS.md` | 5 | Infrastructure patterns, SQL examples |
| `src/components/admin/PATTERNS.md` | 6 | Component patterns, React Admin focus |
| `src/atomic-crm/providers/supabase/PATTERNS.md` | 10 | Data layer, middleware patterns |
