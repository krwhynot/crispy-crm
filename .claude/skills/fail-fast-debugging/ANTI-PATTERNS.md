# Debugging Anti-Patterns

## Table of Contents
1. [Quick Fix Impulse](#quick-fix-impulse)
2. [Shotgun Debugging](#shotgun-debugging)
3. [Retry/Fallback Addition](#retryfallback-addition)
4. [Hope-Based Debugging](#hope-based-debugging)
5. [Blame Shifting](#blame-shifting)
6. [Cognitive Patterns to Watch](#cognitive-patterns-to-watch)

---

## Quick Fix Impulse

### The Pattern
Proposing solutions before understanding the problem.

### Warning Signs (thoughts to catch)
- "Let me just try adding..."
- "This should fix it..."
- "I'll quickly change..."
- "The obvious fix is..."

### Why It's Dangerous
- Treats symptoms, not causes
- Creates technical debt
- Often introduces new bugs
- Wastes time when it doesn't work

### The Correction
**STOP.** Return to Phase 1. Ask yourself:
- What is the EXACT error message?
- Where does this error ORIGINATE?
- What changed recently that could cause this?

---

## Shotgun Debugging

### The Pattern
Making multiple changes simultaneously hoping one fixes the issue.

### Warning Signs
- "I'll update A, B, and C together"
- "Let me also fix this while I'm here"
- "These are probably related"
- Editing multiple files in one "fix" attempt

### Why It's Dangerous
- Can't identify which change helped (or hurt)
- Masks the true root cause
- Creates confusion for future debugging
- Often introduces regressions

### The Correction
**ONE change at a time.** If you feel the urge to change multiple things:
1. Write them all down as separate todos
2. Test each individually
3. Document which one actually fixed the issue

---

## Retry/Fallback Addition

### The Pattern
Adding error handling, retries, or fallbacks to mask errors instead of fixing root causes.

### Warning Signs
- "Let me add a try/catch around this"
- "We should add retry logic here"
- "Let's add a fallback value"
- "We can default to an empty array"

### Why It's Dangerous
**This directly violates the fail-fast principle:**
- Hides the real problem from users AND developers
- Makes debugging harder later
- Error still exists, just hidden
- Data integrity issues become invisible

### The Correction
Let errors throw. Ask:
- Why is this error happening?
- What's the root cause?
- How do we prevent it, not catch it?

**Exception:** Only add error handling AFTER understanding the root cause AND determining the error is truly unpreventable (external API failures, network issues, etc.)

---

## Hope-Based Debugging

### The Pattern
Making changes based on intuition without evidence.

### Warning Signs
- "Maybe this will work"
- "Let's see if this helps"
- "I think the problem might be..."
- "Worth a try"

### Why It's Dangerous
- Wastes time on unlikely causes
- Creates false confidence when coincidentally successful
- Doesn't build understanding
- Same bug will return

### The Correction
Form a **specific, testable hypothesis:**
- BAD: "Maybe it's a timing issue"
- GOOD: "The component renders before `useQuery` completes because there's no loading state check at line 45"

---

## Blame Shifting

### The Pattern
Attributing bugs to external factors before investigating your own code.

### Warning Signs
- "Must be a React Admin bug"
- "Supabase RLS is broken"
- "The library has a bug"
- "TypeScript is wrong"

### Why It's Dangerous
- 95%+ of bugs are in YOUR code, not libraries
- Prevents finding the real issue
- Creates adversarial relationship with tools
- Wastes time investigating the wrong things

### The Correction
Assume YOUR code is wrong until proven otherwise:
1. Can you reproduce with minimal code?
2. Does the library's documentation cover this case?
3. Are you using it as intended?
4. Have others reported this exact issue?

---

## Cognitive Patterns to Watch

### The Sunk Cost Trap
"I've spent so much time on this approach, I can't abandon it now."

**Reality:** Time spent doesn't make an approach correct. Cut losses early.

### The Pressure Rationalization
"We need this fixed TODAY, so I'll skip the investigation."

**Reality:** Rushed fixes take LONGER when they don't work. The systematic approach is faster.

### The Familiarity Bias
"This looks like that bug we fixed last month."

**Reality:** Similar symptoms can have completely different causes. Investigate anyway.

### The Expertise Assumption
"I know this codebase well, so I know what's wrong."

**Reality:** Expertise increases speed but doesn't eliminate the need for evidence.

---

## Self-Check Questions

Before ANY fix attempt, ask yourself:

1. **Do I have evidence or am I guessing?**
   - Evidence: error message, stack trace, reproduction steps
   - Guessing: "probably," "maybe," "might be"

2. **Am I fixing the cause or the symptom?**
   - Cause: "The query returns null because the RLS policy blocks it"
   - Symptom: "I'll add a null check to prevent the error"

3. **Is this one change or multiple?**
   - If multiple, break them apart
   - Test each separately

4. **Am I adding complexity or removing it?**
   - Good fixes usually simplify code
   - If you're adding try/catch, retries, or fallbacks, reconsider

5. **Will I understand this fix in a month?**
   - If not, you don't understand the problem well enough
