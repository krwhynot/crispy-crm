# Documentation as Architecture

## The Provocation

We wrote 528 lines of markdown before writing a single line of React.

Here's why that's not insane.

## The Problem: A Thousand Flowers Blooming

Every component library eventually faces the same crisis. You build a Button. Then someone needs a Button with an icon. Then someone needs a Button that looks like a link. Then someone needs a Button that submits forms.

Before you know it, you have:
- Button
- IconButton
- LinkButton
- SubmitButton
- GhostButton
- ButtonWithLoading
- ButtonThatLooksLikeALink

And the worst part? Someone just copy-pasted `Button.tsx` and made `MySpecialButton.tsx` because they didn't know `GhostButton` existed.

We had this exact problem with select inputs. Seven components. Zero guidance on which to use when.

## The Solution: Canonical Patterns

Instead of writing code first, we wrote **PATTERNS.md**—a 528-line document that defines exactly seven ways to use select inputs in our codebase.

Not suggestions. Not "best practices." **The seven patterns.**

```markdown
# Select Input Patterns

## Pattern A: Static Choices (Form Mode)
For fixed option lists inside React Admin forms.

## Pattern B: Static Choices (Controlled Mode)
For fixed options outside React Admin forms.

## Pattern C: Reference Data
For API-fetched options (organizations, contacts).

## Pattern D: Cascading Filters
For dependent dropdowns (contacts filtered by org).

## Pattern E: Simple Quick-Create
For creating simple records inline.

## Pattern F: Complex Quick-Create (Dialog)
For creating records that need full forms.

## Pattern G: List Filters
For filtering lists, not forms.
```

It's like building blueprints before construction.

## What Each Pattern Contains

Every pattern in the doc follows the same structure:

1. **When to use** (the decision criterion)
2. **Code example** (copy-paste ready)
3. **Key points** (the "don't forget" list)
4. **Real file reference** (where to find a working example)

Here's Pattern E in full:

```markdown
## Pattern E: Simple Quick-Create (emptyAction)

For creating simple records inline when no match is found.

**Use when:**
- Record has only 1-2 fields (name, label, title)
- No complex validation required
- User types a value, it doesn't exist, they want to create it immediately

**Code:**
[Working example with useCreate, useNotify, useRefresh]

**Key points:**
- `onSearchChange` captures what user typed
- `emptyAction.label` shows dynamic text
- `refresh()` makes ReferenceInput refetch
- Error handling uses `notify()` — no silent failures

**Example:** `src/atomic-crm/tags/TagQuickInput.tsx`
```

A developer can read this in 60 seconds and know exactly what to do.

## The Decision Tree

At the top of the doc, there's a decision tree:

| Situation | Pattern |
|-----------|---------|
| Static options, inside form | A |
| Static options, standalone | B |
| Options from database | C |
| Dropdown depends on another | D |
| Quick-create, 1-2 fields | E |
| Quick-create, full form | F |
| Filtering a list (not form) | G |

It's a flowchart in a hospital telling you which door to use. You don't wander around wondering—you follow the signs.

## The Searchable Threshold

One of the most useful pieces is the searchable threshold table:

| Item Count | Recommendation |
|------------|----------------|
| < 20 items | `searchable={false}` |
| ≥ 20 items | `searchable={true}` |
| > 100 items | Server-side filtering via ReferenceInput |

No more guessing. No more "I think this should be searchable?" debates in code review.

## Why This Works

Think of it like an employee handbook for components.

When a new developer joins, they don't ask "how do we do dropdowns here?" They read PATTERNS.md. In 10 minutes, they know:

- The component hierarchy
- Which pattern fits their use case
- Copy-paste code to start with
- Where to find working examples

The documentation *is* the architecture.

## The Anti-Pattern: Code as Documentation

The opposite approach—"the code is the documentation"—sounds elegant but fails in practice.

Why? Because code shows you *what* exists, not *when* to use it.

A developer looking at `GenericSelectInput.tsx` sees 100+ lines of props and handlers. They don't see: "Use Pattern A when you have static choices in a form."

That decision tree lives outside the code. If you don't write it down, every developer reinvents it.

## The Maintenance Contract

The key is treating PATTERNS.md as a living document with a maintenance contract:

1. **New pattern?** Add it to the doc first, then implement
2. **Breaking change?** Update the doc in the same PR
3. **Code review?** Check if the usage matches a documented pattern

If code doesn't match a pattern, you have two choices:
- Refactor to match an existing pattern
- Add a new pattern to the doc (and justify why)

No third option. No "this is a special case."

## The Result

Three months after writing PATTERNS.md:

| Metric | Before | After |
|--------|--------|-------|
| "Which select do I use?" Slack questions | ~2/week | 0 |
| New select components created | 3 in 6 months | 0 |
| Time to implement new dropdown | 30-60 min | 5-10 min |
| Code review comments about select usage | Frequent | Rare |

## The Takeaway

Architecture isn't just code structure.

It's the documentation that makes correct decisions *obvious*.

528 lines of markdown saved us thousands of lines of duplicated code, countless hours of "which component?" debates, and the slow accumulation of seven-become-twelve-become-twenty select implementations.

The best architecture decision we made wasn't a design pattern.

It was a markdown file.
