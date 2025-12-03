# UI/UX Decision Matrix Guide

Systematic framework for evaluating and comparing design decisions using weighted criteria scoring.

## Table of Contents

1. [How to Use the Matrix](#how-to-use-the-matrix)
2. [Criteria Deep Dive](#criteria-deep-dive)
3. [Scoring Examples](#scoring-examples)
4. [Strategy Selection Guide](#strategy-selection-guide)
5. [Case Studies](#case-studies)

---

## How to Use the Matrix

### Step 1: Identify the Decision

Define what you're evaluating:
- A new component design
- A redesign of existing UI
- Comparison between two approaches
- Validation of a proposed change

### Step 2: Score Each Criterion

Rate each criterion from 1-5:

| Score | Meaning |
|-------|---------|
| 1 | Poor - Major problems |
| 2 | Below average - Notable issues |
| 3 | Average - Acceptable but room for improvement |
| 4 | Good - Meets expectations |
| 5 | Excellent - Exceeds expectations |

### Step 3: Apply Weights

Multiply scores by weights:

| Criterion | Weight | Your Score | Weighted |
|-----------|--------|------------|----------|
| Usability | ×3 | ___ | ___ |
| Speed | ×3 | ___ | ___ |
| Accessibility | ×3 | ___ | ___ |
| Familiarity | ×2 | ___ | ___ |
| Cognitive Load | ×2 | ___ | ___ |
| Visual Clarity | ×2 | ___ | ___ |
| Feedback | ×2 | ___ | ___ |
| Adaptability | ×2 | ___ | ___ |
| **Total** | | | ___/95 |

### Step 4: Interpret Results

| Score Range | Rating | Action |
|-------------|--------|--------|
| 85-95 | Excellent | Ship it |
| 70-84 | Good | Ship with minor improvements |
| 55-69 | Acceptable | Address weak areas before shipping |
| 40-54 | Poor | Significant redesign needed |
| <40 | Failing | Complete rethink required |

---

## Criteria Deep Dive

### Usability (Weight: ×3)

**What it measures:** Can users complete their task successfully?

| Score | Description |
|-------|-------------|
| 1 | Users cannot complete task; confused about purpose |
| 2 | Users struggle significantly; many errors |
| 3 | Users complete with some difficulty; minor confusion |
| 4 | Users complete smoothly; intuitive flow |
| 5 | Users complete effortlessly; delightful experience |

**Key Questions:**
- Can users achieve their goal without training?
- Is the purpose immediately clear?
- Are error states recoverable?
- Do form labels and buttons make sense?

---

### Speed (Weight: ×3)

**What it measures:** How quickly can users complete their task?

| Score | Description |
|-------|-------------|
| 1 | Painfully slow; users will abandon |
| 2 | Noticeably slow; users frustrated |
| 3 | Acceptable speed; no major complaints |
| 4 | Fast; users appreciate the efficiency |
| 5 | Near-instant; exceeds expectations |

**Key Questions:**
- How many clicks/taps to complete?
- Is there unnecessary navigation?
- Are common actions prioritized?
- Does the UI respond quickly (<400ms)?

---

### Accessibility (Weight: ×3)

**What it measures:** Can all users access and use this interface?

| Score | Description |
|-------|-------------|
| 1 | Fails WCAG completely; unusable for many |
| 2 | Multiple WCAG AA violations |
| 3 | Meets minimum WCAG AA |
| 4 | Exceeds WCAG AA; good keyboard/screen reader support |
| 5 | WCAG AAA; exemplary inclusive design |

**Checklist:**
- [ ] Touch targets ≥44px
- [ ] Color contrast ≥4.5:1 (text), ≥3:1 (UI)
- [ ] All inputs have labels
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Screen reader compatible
- [ ] Respects prefers-reduced-motion

---

### Familiarity (Weight: ×2)

**What it measures:** Does this follow conventions users know?

| Score | Description |
|-------|-------------|
| 1 | Completely novel; users lost |
| 2 | Unusual patterns; learning curve |
| 3 | Some conventions; some novelty |
| 4 | Follows platform conventions; intuitive |
| 5 | Perfectly matches user mental models |

**Key Questions:**
- Does navigation match common patterns?
- Are icons universally recognized?
- Do interactions work as expected?
- Will CRM/Excel users recognize patterns?

---

### Cognitive Load (Weight: ×2)

**What it measures:** How much mental effort is required?

| Score | Description |
|-------|-------------|
| 1 | Overwhelming; too much to process |
| 2 | Heavy load; requires concentration |
| 3 | Moderate; some mental juggling |
| 4 | Light; information well-chunked |
| 5 | Minimal; flows naturally |

**Key Questions:**
- Are there >7 visible choices? (Hick's Law)
- Must users remember information across screens?
- Is progressive disclosure used appropriately?
- Are defaults smart?

---

### Visual Clarity (Weight: ×2)

**What it measures:** Is the visual hierarchy clear?

| Score | Description |
|-------|-------------|
| 1 | Cluttered; no hierarchy; confusing |
| 2 | Unclear priorities; visual noise |
| 3 | Acceptable; hierarchy present but weak |
| 4 | Clear; easy to scan; good hierarchy |
| 5 | Excellent; effortless visual parsing |

**Key Questions:**
- Is the primary action obvious?
- Does spacing group related elements?
- Is typography hierarchy clear?
- Are colors used meaningfully (not decoratively)?

---

### Feedback (Weight: ×2)

**What it measures:** Does the UI respond to user actions appropriately?

| Score | Description |
|-------|-------------|
| 1 | No feedback; users uncertain if actions worked |
| 2 | Delayed or unclear feedback |
| 3 | Basic feedback present |
| 4 | Clear, timely feedback for all actions |
| 5 | Delightful feedback with positive reinforcement |

**Key Questions:**
- Do buttons show pressed/loading states?
- Are errors clearly communicated?
- Are successes confirmed?
- Does feedback appear <400ms? (Doherty)

---

### Adaptability (Weight: ×2)

**What it measures:** Does it work across devices and contexts?

| Score | Description |
|-------|-------------|
| 1 | Broken on non-primary devices |
| 2 | Functional but poor on secondary devices |
| 3 | Works on all devices; some compromises |
| 4 | Good experience on all target devices |
| 5 | Optimized for each device context |

**Key Questions:**
- Does it work on desktop (primary)?
- Does it work on tablet (secondary)?
- Are touch targets adequate on all sizes?
- Does layout adapt appropriately?

---

## Scoring Examples

### Example 1: Filter Sidebar Redesign

**Context:** Sales CRM filter panel for desktop and iPad users

**Current Design:**
- 15 filters visible at once
- 32px buttons
- Gray text on white background

**Scoring:**

| Criterion | Score | Reasoning | Weighted |
|-----------|-------|-----------|----------|
| Usability | 3 | Users can filter, but overwhelmed | 9 |
| Speed | 3 | Too many options slows decisions | 9 |
| Accessibility | 2 | Buttons too small, contrast issues | 6 |
| Familiarity | 4 | Standard filter panel pattern | 8 |
| Cognitive Load | 2 | 15 options violates Hick's Law | 4 |
| Visual Clarity | 3 | No grouping or hierarchy | 6 |
| Feedback | 4 | Filters update list immediately | 8 |
| Adaptability | 2 | Too cramped on tablet | 4 |
| **Total** | | | **54/95** |

**Verdict:** Poor (54/95) - Needs redesign focusing on accessibility, cognitive load, and adaptability.

---

### Example 2: Proposed Filter Sidebar Redesign

**Changes:**
- Grouped into 4 collapsible sections
- 44px touch targets
- High contrast text
- Responsive collapse for tablet

**Scoring:**

| Criterion | Score | Reasoning | Weighted |
|-----------|-------|-----------|----------|
| Usability | 4 | Clear groups, easy to use | 12 |
| Speed | 4 | Quick to find filters | 12 |
| Accessibility | 5 | 44px targets, good contrast | 15 |
| Familiarity | 4 | Accordion pattern is standard | 8 |
| Cognitive Load | 4 | 4 groups, progressive disclosure | 8 |
| Visual Clarity | 4 | Clear hierarchy and grouping | 8 |
| Feedback | 4 | Active filters shown | 8 |
| Adaptability | 5 | Collapses well on tablet | 10 |
| **Total** | | | **85/95** |

**Verdict:** Excellent (85/95) - Ready to ship.

---

## Strategy Selection Guide

The four strategies from the Sienna Protocol:

### Strategy A: Familiar Efficiency

**Best for:** Power users, desktop-primary, time-critical tasks

**Characteristics:**
- Relies heavily on Jakob's Law
- Information-dense layouts
- Keyboard shortcuts
- Minimal handholding

**Typical Scores:**
- Familiarity: 5
- Speed: 5
- Cognitive Load: 3 (accepts higher load for experts)
- Accessibility: 4

---

### Strategy B: Progressive Clarity

**Best for:** New users, complex workflows, onboarding

**Characteristics:**
- Step-by-step guidance
- Generous whitespace
- Inline help and tooltips
- Simplified choices

**Typical Scores:**
- Cognitive Load: 5
- Visual Clarity: 5
- Usability: 4
- Speed: 3 (trades speed for clarity)

---

### Strategy C: Hybrid Field Resilience

**Best for:** Field workers, tablet users, challenging environments

**Characteristics:**
- Large touch targets (48-56px)
- High contrast
- Immediate feedback
- Graceful offline support

**Typical Scores:**
- Accessibility: 5
- Adaptability: 5
- Feedback: 5
- Familiarity: 4

**Recommended as default** for business applications.

---

### Strategy D: Behavioral Momentum

**Best for:** Repetitive tasks, gamification, habit building

**Characteristics:**
- Celebration of milestones
- Progress indicators
- Streak/achievement systems
- Emotional reinforcement

**Typical Scores:**
- Feedback: 5
- Usability: 4
- Visual Clarity: 4
- Cognitive Load: 4

---

## Case Studies

### Case Study 1: Contact List Redesign

**Before:**
```
Problem: Contact list with 20 columns, tiny text, no mobile support
Matrix Score: 48/95 (Failing)

Key Issues:
- Accessibility: 1 (10px text, no touch targets)
- Adaptability: 1 (broken on tablet)
- Cognitive Load: 2 (too many columns)
```

**After:**
```
Solution: 5 key columns, expandable row details, responsive layout
Matrix Score: 82/95 (Good)

Improvements:
- Accessibility: 5 (14px text, 44px rows)
- Adaptability: 5 (tablet-optimized)
- Cognitive Load: 4 (progressive disclosure for details)
```

---

### Case Study 2: Opportunity Create Form

**Before:**
```
Problem: 25 fields on single page, no defaults, unclear required fields
Matrix Score: 52/95 (Poor)

Key Issues:
- Cognitive Load: 2 (25 fields visible)
- Visual Clarity: 2 (wall of text)
- Speed: 2 (too many required fields)
```

**After:**
```
Solution: 3 tabs, 5-7 fields each, smart defaults, clear required indicators
Matrix Score: 86/95 (Excellent)

Improvements:
- Cognitive Load: 5 (chunked into tabs)
- Visual Clarity: 5 (clear sections)
- Speed: 4 (defaults reduce input time)
```

---

## Quick Reference Card

### Red Flags (Score Immediately)

| Issue | Automatic Score |
|-------|-----------------|
| Touch targets <44px | Accessibility ≤2 |
| Contrast <4.5:1 | Accessibility ≤2 |
| >10 visible choices | Cognitive Load ≤2 |
| No loading states | Feedback ≤2 |
| Broken on tablet | Adaptability ≤2 |

### Green Flags (Bonus Points)

| Feature | Bonus |
|---------|-------|
| Keyboard shortcuts documented | Usability +1 |
| Skeleton loaders | Feedback +1 |
| Smart defaults | Speed +1 |
| Collapsible sections | Cognitive Load +1 |
| Focus management | Accessibility +1 |

---

## Using the Matrix in Reviews

### Code Review Checklist

```markdown
## UI/UX Matrix Quick Check

- [ ] **Accessibility**: Touch targets ≥44px, contrast passes
- [ ] **Speed**: Loading states present, optimistic updates where appropriate
- [ ] **Cognitive Load**: ≤7 visible options per section
- [ ] **Feedback**: All actions have visible response
- [ ] **Adaptability**: Tested on desktop + tablet

**Estimated Score:** ___/95
**Blocking Issues:** ___
```

### Design Review Template

```markdown
## Design Matrix Evaluation

**Component:** ___
**Strategy Applied:** A / B / C / D
**Target Score:** ≥70

| Criterion | Score | Notes |
|-----------|-------|-------|
| Usability | /5 | |
| Speed | /5 | |
| Accessibility | /5 | |
| Familiarity | /5 | |
| Cognitive Load | /5 | |
| Visual Clarity | /5 | |
| Feedback | /5 | |
| Adaptability | /5 | |

**Total:** ___/95
**Verdict:** Ship / Iterate / Redesign
```
