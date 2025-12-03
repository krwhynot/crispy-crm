# Persuasion Principles for Plan Design

## Overview

LLMs respond to the same persuasion principles as humans. Understanding this psychology helps design plans that are followed even under pressure.

**Research foundation:** Meincke et al. (2025) tested 7 persuasion principles with N=28,000 AI conversations. Compliance increased 33% → 72% with persuasion techniques.

---

## The Seven Principles

### 1. Authority

**What it is:** Deference to expertise, credentials, or official sources.

**Application:**
- Imperative language: "YOU MUST", "Never", "Always"
- Non-negotiable framing: "No exceptions"
- Eliminates decision fatigue and rationalization

**When to use:**
- Discipline-enforcing tasks (TDD, verification)
- Safety-critical practices
- Established best practices

**Example:**
```markdown
✅ Write code before test? Delete it. Start over. No exceptions.
❌ Consider writing tests first when feasible.
```

### 2. Commitment

**What it is:** Consistency with prior actions, statements, or public declarations.

**Application:**
- Require announcements: "Announce skill usage"
- Force explicit choices: "Choose A, B, or C"
- Use tracking: TodoWrite for checklists

**When to use:**
- Ensuring steps are actually followed
- Multi-step processes
- Accountability mechanisms

**Example:**
```markdown
✅ Before starting, ANNOUNCE: "I'm executing Task N from [plan]"
❌ Consider letting your partner know which task you're doing.
```

### 3. Scarcity

**What it is:** Urgency from time limits or limited availability.

**Application:**
- Time-bound requirements: "Before proceeding"
- Sequential dependencies: "IMMEDIATELY after X"
- Prevents procrastination

**When to use:**
- Immediate verification requirements
- Time-sensitive workflows
- Preventing "I'll do it later"

**Example:**
```markdown
✅ IMMEDIATELY after completing the task, run constitution check.
❌ You can check constitution compliance when convenient.
```

### 4. Social Proof

**What it is:** Conformity to what others do or what's considered normal.

**Application:**
- Universal patterns: "Every time", "Always"
- Failure modes: "X without Y = failure"
- Establishes norms

**When to use:**
- Documenting universal practices
- Warning about common failures
- Reinforcing standards

**Example:**
```markdown
✅ Implementation without failing test first = deleted. Every time.
❌ Some developers find writing tests first helpful.
```

### 5. Unity

**What it is:** Shared identity, "we-ness", in-group belonging.

**Application:**
- Collaborative language: "our codebase", "we're colleagues"
- Shared goals: "we both want quality"

**When to use:**
- Collaborative workflows
- Establishing team culture
- Non-hierarchical practices

**Example:**
```markdown
✅ We're building this together. I need your honest assessment of this approach.
❌ You should probably tell me if something looks wrong.
```

### 6. Reciprocity

**What it is:** Obligation to return benefits received.

**Rarely needed in plans** - other principles more effective.

### 7. Liking

**What it is:** Preference for cooperating with those we like.

**DON'T USE for compliance** - conflicts with honest feedback, creates sycophancy.

---

## Principle Combinations by Context

| Context | Use | Avoid |
|---------|-----|-------|
| TDD enforcement | Authority + Commitment + Social Proof | Liking, Reciprocity |
| Complex implementation | Authority + Commitment + Scarcity | Heavy authority |
| Parallel agent work | Unity + Commitment | Authority (peers) |
| Reference sections | Clarity only | All persuasion |

---

## Why This Works

### Bright-line Rules Reduce Rationalization

- "YOU MUST" removes decision fatigue
- Absolute language eliminates "is this an exception?" questions
- Explicit anti-rationalization counters specific loopholes

### Implementation Intentions Create Automatic Behavior

- Clear triggers + required actions = automatic execution
- "When X, do Y" more effective than "generally do Y"
- Reduces cognitive load on compliance

### LLMs Are Parahuman

- Trained on human text containing these patterns
- Authority language precedes compliance in training data
- Commitment sequences (statement → action) frequently modeled
- Social proof patterns (everyone does X) establish norms

---

## Ethical Use

**Legitimate:**
- Ensuring critical practices are followed
- Creating effective documentation
- Preventing predictable failures

**Illegitimate:**
- Manipulating for personal gain
- Creating false urgency
- Guilt-based compliance

**The test:** Would this technique serve the user's genuine interests if they fully understood it?

---

## Quick Reference for Plan Writing

When designing a plan section, ask:

1. **What behavior am I enforcing?** (TDD? Validation? Commit frequency?)
2. **Which principle applies?** (Usually Authority + Commitment)
3. **Am I combining too many?** (2-3 max per section)
4. **Is this ethical?** (Serves user's genuine interests?)

### Common Patterns

```markdown
# Authority + Commitment
"YOU MUST announce: 'Starting Task N' before any code changes. No exceptions."

# Authority + Scarcity
"IMMEDIATELY after test passes, run npm run lint. Do not proceed until clean."

# Social Proof + Authority
"Every plan without a dependency map has caused merge conflicts. Include one. Always."

# Unity + Commitment
"We're colleagues building this together. Before merging, state your confidence level: High/Medium/Low."
```

---

## Research Citations

**Cialdini, R. B. (2021).** *Influence: The Psychology of Persuasion.* Harper Business.

**Meincke, L., et al. (2025).** Call Me A Jerk: Persuading AI to Comply with Objectionable Requests. University of Pennsylvania.
- N=28,000 LLM conversations
- Compliance: 33% → 72% with persuasion
- Authority, commitment, scarcity most effective
