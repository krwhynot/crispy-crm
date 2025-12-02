# Complete `.claude` Directory Report

> **Generated:** 2025-12-02
> **Scope:** Full context analysis of the Claude Code automation system for Crispy-CRM (Atomic CRM)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Directory Structure](#directory-structure)
3. [Core Configuration Files](#core-configuration-files)
4. [Hook System (Automated Triggers)](#hook-system-automated-triggers)
5. [Skill Activation Engine](#skill-activation-engine)
6. [Agent System](#agent-system)
7. [Skills Deep Dive](#skills-deep-dive)
8. [Skill Interactions & Coordination](#skill-interactions--coordination)
9. [Real Codebase Examples](#real-codebase-examples)
10. [From Theory to Practice](#from-theory-to-practice)
11. [How It All Works Together](#how-it-all-works-together)

---

## Executive Summary

The `.claude` directory is the **nervous system** of your development environment. It provides:

| Capability | Description |
|------------|-------------|
| **Automatic Skill Activation** | Prompts are analyzed and skills auto-activate without asking |
| **Enforced Consistency** | Engineering Constitution prevents architectural drift |
| **Safety Nets** | Automatic git checkpoints after every file change |
| **Observable Operations** | Every tool use is logged and tracked |
| **Scalable Governance** | Skills compose together - new patterns apply automatically |

**Key Insight:** This isn't just configuration—it's a **self-aware development environment** that makes the right patterns the easy patterns.

---

## Directory Structure

```
.claude/
├── settings.json                 # Master hook configuration
├── settings.local.json          # Local overrides & permissions (63+ allowed tools)
├── checkpoint-state             # Git checkpoint state tracking
├── engineering-constitution.md  # Core development doctrine
│
├── agents/                      # Specialized agent definitions
│   ├── code-finder.md          # Code discovery agent
│   └── task-implementor.md     # Implementation specialist
│
├── hooks/                       # Automated triggers & scripts
│   ├── README.md               # Hook system documentation
│   ├── skill-activation-prompt.sh   # Skill activation shell wrapper
│   ├── skill-activation-prompt.ts   # Core prompt analysis engine (TypeScript)
│   ├── checkpoint-trigger.sh        # Auto git checkpoints
│   ├── file-track.sh               # File change logging
│   ├── memory-capture.sh           # Context memory capture
│   └── post-tool-use-tracker.sh    # Tool usage analytics
│
└── skills/                      # Domain-specific knowledge systems
    ├── skill-rules.json         # Master activation configuration
    │
    ├── engineering-constitution/
    │   ├── SKILL.md            # Core principles (fail-fast, Zod, forms)
    │   └── resources/
    │       ├── error-handling.md
    │       ├── validation-patterns.md
    │       ├── form-state-management.md
    │       ├── database-patterns.md
    │       ├── security-patterns.md
    │       ├── testing-patterns.md
    │       └── anti-patterns.md
    │
    ├── crispy-design-system/
    │   ├── SKILL.md            # UI/UX patterns (Tailwind v4, colors)
    │   └── resources/
    │       ├── component-architecture.md
    │       ├── color-system.md
    │       ├── typography.md
    │       ├── form-patterns.md
    │       ├── data-tables.md
    │       └── [20+ more files...]
    │
    ├── supabase-crm/
    │   ├── SKILL.md            # Backend patterns (RLS, Edge Functions)
    │   └── resources/
    │       ├── rls-policies.md
    │       ├── validation-patterns.md
    │       ├── edge-functions.md
    │       └── service-layer.md
    │
    └── skill-developer/
        ├── SKILL.md            # Meta-skill for creating skills
        └── resources/
            ├── ADVANCED.md
            ├── TRIGGER_TYPES.md
            └── HOOK_MECHANISMS.md
```

---

## Core Configuration Files

### `settings.json` — Master Hook Configuration

**Location:** `.claude/settings.json`

**Purpose:** Defines which hooks run and when they trigger.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "type": "command",
        "command": "./.claude/hooks/skill-activation-prompt.sh"
      }
    ],
    "PostToolUse": [
      {
        "type": "command",
        "command": "./.claude/hooks/file-track.sh",
        "matcher": { "tool_name": ["Write", "Edit", "MultiEdit"] }
      },
      {
        "type": "command",
        "command": "./.claude/hooks/checkpoint-trigger.sh",
        "matcher": { "tool_name": ["Write", "Edit", "MultiEdit"] }
      }
    ]
  }
}
```

**Hook Types:**
- `UserPromptSubmit` — Runs before Claude Code processes your prompt
- `PostToolUse` — Runs after specific tools execute

---

### `settings.local.json` — Permissions & Local Overrides

**Location:** `.claude/settings.local.json`

**Purpose:** Security boundary for tool execution and MCP server configuration.

**Key Sections:**

```json
{
  "permissions": {
    "allow": [
      "Bash(git log:*)",
      "Bash(npm run build)",
      "mcp__supabase__execute_sql",
      "mcp__zen__chat",
      "WebSearch",
      // ... 63+ allowed tools
    ]
  },
  "mcpServers": {
    "enableAllProjectMcpServers": true,
    "enabledMcpjsonServers": ["sequential-thinking"]
  },
  "outputStyle": "Explanatory"
}
```

**What This Controls:**
- Which bash commands can execute without asking
- Which MCP servers are active
- Output verbosity level

---

### `checkpoint-state` — Git Checkpoint Tracking

**Location:** `.claude/checkpoint-state`

**Purpose:** Tracks automatic checkpoint state to prevent duplicates.

```
last_checkpoint=1764701708     # Unix timestamp
file_count=1                   # Files since last checkpoint
last_trigger=1764701833        # Last hook trigger
```

---

### `engineering-constitution.md` — Development Doctrine

**Location:** `.claude/engineering-constitution.md`

**Purpose:** The foundational principles that guide ALL development decisions.

**Core Principles:**

| # | Principle | What It Means |
|---|-----------|---------------|
| 1 | **NO OVER-ENGINEERING** | No retry logic, circuit breakers, or graceful fallbacks. Fail fast. |
| 2 | **SINGLE COMPOSABLE ENTRY POINT** | One data provider, one validation layer (Zod at API boundary) |
| 3 | **THREE-TIER COMPONENTS** | Base → Admin → Feature component hierarchy |
| 4 | **UNIFIED DATA PROVIDER** | Single Supabase provider for all data access |
| 5 | **FORM STATE FROM SCHEMA** | Use `zodSchema.partial().parse({})` for form defaults |
| 6 | **BOY SCOUT RULE** | Fix inconsistencies while editing (type→interface, hex→semantic) |
| 7 | **TYPESCRIPT CONVENTIONS** | `interface` for objects, `type` for unions |
| 8 | **SEMANTIC COLORS ONLY** | CSS variables only, never hex codes |
| 9 | **SOFT DELETES** | Use `deleted_at` timestamp, never hard delete |

---

## Hook System (Automated Triggers)

Hooks are shell scripts that execute automatically in response to Claude Code events.

### Hook Execution Flow

```
User submits prompt
         ↓
┌─────────────────────────────────────┐
│  UserPromptSubmit Hook Fires        │
│  └─ skill-activation-prompt.sh      │
│     └─ Runs skill-activation-prompt.ts
│        └─ Analyzes prompt keywords  │
│        └─ Matches against skill-rules.json
│        └─ Outputs skill recommendations
└─────────────────────────────────────┘
         ↓
Claude Code processes prompt
         ↓
Write/Edit/MultiEdit tool executes
         ↓
┌─────────────────────────────────────┐
│  PostToolUse Hooks Fire (parallel)  │
│  ├─ file-track.sh                   │
│  │  └─ Logs: [MODIFY:Edit] file.tsx │
│  ├─ checkpoint-trigger.sh           │
│  │  └─ Creates git commit           │
│  └─ post-tool-use-tracker.sh        │
│     └─ Records analytics            │
└─────────────────────────────────────┘
```

---

### `skill-activation-prompt.ts` — The Prompt Analysis Engine

**Location:** `.claude/hooks/skill-activation-prompt.ts`

**This is the core intelligence** that decides which skills to activate.

```typescript
interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  prompt: string;  // <-- Your actual prompt text
}

interface SkillRule {
  type: "guardrail" | "domain";
  enforcement: "block" | "suggest" | "warn";
  priority: "critical" | "high" | "medium" | "low";
  promptTriggers?: {
    keywords?: string[];        // Simple word matching
    intentPatterns?: string[];  // Regex patterns
  };
}

async function main() {
  // 1. Read input from stdin (JSON payload from Claude Code)
  const input = readFileSync(0, "utf-8");
  const data: HookInput = JSON.parse(input);
  const prompt = data.prompt.toLowerCase();

  // 2. Load skill rules from skill-rules.json
  const rulesPath = join(projectDir, ".claude", "skills", "skill-rules.json");
  const rules: SkillRules = JSON.parse(readFileSync(rulesPath, "utf-8"));

  // 3. Check each skill for matches
  for (const [skillName, config] of Object.entries(rules.skills)) {
    const triggers = config.promptTriggers;

    // Keyword matching (simple contains)
    if (triggers.keywords?.some(kw => prompt.includes(kw.toLowerCase()))) {
      matchedSkills.push({ name: skillName, matchType: "keyword", config });
    }

    // Intent pattern matching (regex)
    if (triggers.intentPatterns?.some(pattern => new RegExp(pattern, "i").test(prompt))) {
      matchedSkills.push({ name: skillName, matchType: "intent", config });
    }
  }

  // 4. Generate output grouped by priority
  if (matchedSkills.length > 0) {
    // CRITICAL SKILLS (REQUIRED)
    // RECOMMENDED SKILLS
    // SUGGESTED SKILLS
    // OPTIONAL SKILLS
    console.log(output);
  }
}
```

**Example Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SKILL ACTIVATION CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 RECOMMENDED SKILLS:
  → engineering-constitution
  → crispy-design-system

ACTION: Use Skill tool BEFORE responding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### `checkpoint-trigger.sh` — Auto Git Checkpoints

**Purpose:** Creates automatic git commits after file modifications.

```bash
#!/bin/bash
# Parse tool payload for modified file path
FILE_PATH=$(echo "$HOOK_PAYLOAD" | jq -r '.file_path // .path // empty')

# Call the checkpoint manager
"${HOME}/.claude/checkpoint-manager.sh" "$FILE_PATH"
```

**Result:** After every file change, you get a git commit like:
```
checkpoint: Automatic save of 1 file(s)
```

---

### `file-track.sh` — Change Logging

**Purpose:** Logs all file modifications to a central log file.

```bash
#!/bin/bash
# Parse file path and action type
FILE_PATH=$(echo "$HOOK_PAYLOAD" | jq -r '.file_path')
ACTION=$(test -f "$FILE_PATH" && echo "MODIFY" || echo "CREATE")
SIZE=$(stat -c%s "$FILE_PATH" 2>/dev/null || echo "new")

# Log to ~/.claude/changes.log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$USER@$HOSTNAME] [$ACTION:$TOOL_NAME] $FILE_PATH ($SIZE bytes)" >> "$LOG_FILE"
```

**Example Log Entry:**
```
[2025-12-02 14:35:22] [krwhynot@laptop] [CREATE:Write] src/components/Contact.tsx (2843 bytes)
[2025-12-02 14:36:15] [krwhynot@laptop] [MODIFY:Edit] src/services/contacts.ts (5421 bytes)
```

---

## Skill Activation Engine

### `skill-rules.json` — Master Configuration

**Location:** `.claude/skills/skill-rules.json`

This file defines ALL skill activation rules:

```json
{
  "version": "1.0",
  "skills": {
    "engineering-constitution": {
      "type": "guardrail",
      "enforcement": "suggest",
      "priority": "high",
      "promptTriggers": {
        "keywords": [
          "implement", "create", "add", "build", "form",
          "validation", "error", "database", "migration"
        ],
        "intentPatterns": [
          "add.*feature",
          "implement.*component",
          "create.*form",
          "handle.*error"
        ]
      },
      "fileTriggers": {
        "pathPatterns": ["src/**/*.tsx", "src/**/*.ts"],
        "contentPatterns": ["import.*zod", "useForm"]
      }
    },

    "crispy-design-system": {
      "type": "domain",
      "enforcement": "suggest",
      "priority": "high",
      "promptTriggers": {
        "keywords": [
          "component", "ui", "design", "color", "button",
          "form", "layout", "table", "card"
        ],
        "intentPatterns": [
          "style.*component",
          "add.*button",
          "create.*list"
        ]
      },
      "fileTriggers": {
        "pathPatterns": ["src/components/**/*.tsx"],
        "contentPatterns": ["className=", "tailwind"]
      }
    },

    "supabase-crm": {
      "type": "domain",
      "enforcement": "suggest",
      "priority": "high",
      "promptTriggers": {
        "keywords": [
          "database", "supabase", "rls", "migration",
          "query", "edge function"
        ]
      },
      "fileTriggers": {
        "pathPatterns": [
          "supabase/migrations/**",
          "supabase/functions/**",
          "src/services/**"
        ]
      }
    }
  }
}
```

**Trigger Types:**

| Type | Description | Example |
|------|-------------|---------|
| `keywords` | Simple word matching (case-insensitive) | "form", "validation" |
| `intentPatterns` | Regex patterns for intent | `add.*feature` |
| `pathPatterns` | File path globs | `src/components/**/*.tsx` |
| `contentPatterns` | Content inside files | `className=` |

---

## Agent System

Agents are specialized tools launched via the `Task` tool with a specific `subagent_type`.

### `code-finder.md` — Code Discovery Agent

**Purpose:** Find specific code files, functions, classes, or patterns.

**When to Use:**
- "Where is X implemented?"
- "Find all usages of Y"
- "Show me the function that does Z"

**Search Methodology:**
1. **Intent Analysis** — Determine if searching for definitions, usage, patterns, or architecture
2. **Systematic Search** — Execute multiple strategies in parallel (exact matches, partial matches, patterns)
3. **Complete Results** — Present ALL findings with file paths, line numbers, and context

---

### `task-implementor.md` — Implementation Specialist

**Purpose:** Implement specific tasks from a master plan.

**When to Use:**
- Implementing tasks broken out from a larger plan
- Specific, well-defined coding tasks
- Pattern-following implementations

**Implementation Process:**
1. **Context Assembly** — Read all provided files and surrounding code
2. **Strategic Implementation** — Write code matching existing patterns
3. **Verification** — Run diagnostics to ensure no errors
4. **Report Results** — Document what was changed

---

## Skills Deep Dive

### Engineering Constitution Skill

**Main File:** `.claude/skills/engineering-constitution/SKILL.md`

**Self-Check Before Writing Code:**
```
- [ ] Error handling: Am I adding retry logic? (NO - fail fast)
- [ ] Validation: Am I validating in component? (NO - Zod at API boundary)
- [ ] Form defaults: Am I hardcoding? (NO - use zodSchema.partial().parse({}))
- [ ] Data access: Am I using Supabase client directly? (NO - use DataProvider)
- [ ] Colors: Am I using hex codes? (NO - semantic tokens only)
- [ ] Types: Am I using `type` for objects? (NO - use `interface`)
```

**Resource Files (with patterns):**

#### `error-handling.md`
```typescript
// ❌ WRONG - Over-engineered
try {
  await fetchWithRetry(url, { retries: 3, backoff: 'exponential' });
} catch (error) {
  await fallbackToCache();
  notifyAdmin(error);
}

// ✅ CORRECT - Fail fast
const { data, error } = await supabase.from('contacts').select();
if (error) throw error; // Operator sees error immediately
```

#### `validation-patterns.md`
```typescript
// Define schema ONCE at API boundary
const contactSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  email: z.string().email("Invalid email"),
  phone: z.array(z.object({
    number: z.string(),
    type: z.enum(["Work", "Mobile", "Home"]).default("Work"),
  })).default([]),
});

// Component uses schema (no duplicate validation)
function ContactForm() {
  return <TextInput source="email" />; // Validation from schema
}
```

#### `form-state-management.md`
```typescript
// ✅ CORRECT - Defaults from schema
const formDefaults = {
  ...opportunitySchema.partial().parse({}), // Extracts .default() values
  opportunity_owner_id: identity?.id,       // Merge runtime values
  products_to_sync: [],                     // Initialize arrays explicitly
};

return <Form defaultValues={formDefaults}>...</Form>;
```

#### `security-patterns.md`
```typescript
// CSV Upload Security (Defense in Depth)
export async function validateCsvFile(file: File): Promise<CsvValidationResult> {
  // 1. File size check (DoS prevention)
  if (file.size > 10 * 1024 * 1024) return { valid: false, errors: [{code: 'SIZE'}] };

  // 2. Binary detection (magic bytes)
  if (isBinaryFile(await file.slice(0, 1024).text())) return { valid: false, errors: [{code: 'BINARY'}] };

  // 3. Formula injection prevention
  // Sanitize cells starting with = + - @ | %
}

// SQL Injection Prevention (Supabase parameterized)
const { data, error } = await supabase
  .from('contacts')
  .select('*')
  .eq('email', userInput); // Safe - parameterized
```

#### `anti-patterns.md`
Top 10 mistakes to avoid:
1. Over-engineering (circuit breakers)
2. Multiple validation sources
3. Hardcoded form defaults
4. RLS without GRANT
5. Promise.all() for bulk operations (use Promise.allSettled)
6. Skipping CSV validation
7. Testing implementation details
8. Ignoring enum migration complexity
9. Skipping error logging context
10. Migrations without verification blocks

---

### Crispy Design System Skill

**Main File:** `.claude/skills/crispy-design-system/SKILL.md`

**Core Principles:**

| Principle | Rule |
|-----------|------|
| **Tailwind v4 Semantic** | Use `bg-primary`, never `bg-[#FF6600]` |
| **Desktop-First** | Optimize for 1440px+, then scale down |
| **44px Touch Targets** | Minimum across ALL screen sizes |
| **OKLCH Colors** | Perceptually uniform, accessibility built-in |
| **Three Layouts** | StandardListLayout, ResourceSlideOver, Create Forms |

**Color System (OKLCH):**
```css
/* Brand Colors - Forest Green (Hue 142°) */
--primary: oklch(38% 0.085 142);     /* Garden to Table theme */
--primary-foreground: oklch(99% 0 0); /* White text on green = 10.8:1 contrast */

/* Semantic Usage */
✅ bg-primary text-primary-foreground
❌ bg-[#336600] text-white
```

**Component Architecture:**
```typescript
// Compound components pattern
<Card>
  <CardHeader>
    <CardTitle>Opportunities by Principal</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Three unified admin components
<StandardListLayout filterComponent={<ContactFilters />}>
  <PremiumDatagrid>...</PremiumDatagrid>
</StandardListLayout>

<ResourceSlideOver resource="contacts" mode="edit" tabs={[...]} />
```

**Typography Scale:**
```tsx
// Heading hierarchy
<h1 className="text-xl font-semibold text-primary">Page Title</h1>
<h2 className="text-lg font-semibold text-foreground">Section</h2>
<p className="text-base text-foreground">Body text</p>
<span className="text-xs text-muted-foreground">Metadata</span>
```

---

### Supabase CRM Skill

**Main File:** `.claude/skills/supabase-crm/SKILL.md`

**Core Patterns:**

#### RLS Policies
```sql
-- Standard policy template for shared team resources
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Step 1: GRANT (without this, RLS is useless!)
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT USAGE ON SEQUENCE contacts_id_seq TO authenticated;

-- Step 2: CREATE POLICIES
CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);  -- Soft delete filter

CREATE POLICY authenticated_insert_contacts ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Service role for Edge Functions
CREATE POLICY service_full_access ON contacts
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

#### Edge Functions
```typescript
// Deno.serve pattern for Edge Functions
Deno.serve(async (req: Request) => {
  // 1. Validate input with Zod
  const body = await req.json();
  const validated = requestSchema.parse(body);

  // 2. Use service role for elevated access
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 3. Execute operation
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: validated.userId, message: validated.message });

  if (error) throw error;
  return new Response(JSON.stringify(data), { status: 200 });
});
```

---

## Skill Interactions & Coordination

### How Skills Work Together

When you write code, multiple skills may activate simultaneously. Here's how they coordinate:

```
User Prompt: "Add a contact creation form with validation"
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SKILL ACTIVATION                             │
├─────────────────────────────────────────────────────────────────┤
│ ✅ engineering-constitution (matches: "form", "validation")     │
│    → Enforces: Zod at API boundary, schema.partial().parse({}) │
│                                                                 │
│ ✅ crispy-design-system (matches: "form", "component")          │
│    → Enforces: Full-page create form, semantic colors, 44px    │
│                                                                 │
│ ✅ supabase-crm (matches: "contact", database implied)          │
│    → Enforces: RLS policies, soft deletes, service layer       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Combined Guidance:
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. Create Zod schema in src/atomic-crm/validation/contacts.ts  │
│ 2. Form defaults from contactSchema.partial().parse({})        │
│ 3. Use <Form> with zodResolver, not inline validation          │
│ 4. Full-page layout with max-w-4xl mx-auto create-form-card    │
│ 5. Semantic colors: bg-muted for page, bg-card for form        │
│ 6. 44px minimum button heights: size="default" (h-12)          │
│ 7. Ensure RLS policies exist for contacts table                │
└─────────────────────────────────────────────────────────────────┘
```

### Priority Resolution

When skills provide conflicting guidance, priority determines which wins:

| Priority | Skills | Takes Precedence |
|----------|--------|------------------|
| Critical | (none currently) | Always wins |
| High | engineering-constitution, crispy-design-system, supabase-crm | Core patterns |
| Medium | skill-developer | Meta-guidance |
| Low | (none currently) | Suggestions only |

---

## Real Codebase Examples

### Example 1: OpportunityCreate.tsx

**Location:** `src/atomic-crm/opportunities/OpportunityCreate.tsx`

This file demonstrates ALL constitutional principles in action:

```typescript
import { CreateBase, Form, useGetIdentity } from "ra-core";
import { opportunitySchema } from "../validation/opportunities";

const OpportunityCreate = () => {
  const { data: identity } = useGetIdentity();

  // ✅ CONSTITUTION #5: Form state from schema
  // Use .partial() to make all fields optional during default generation
  // This extracts fields with .default() (stage, priority, estimated_close_date)
  const formDefaults = {
    ...opportunitySchema.partial().parse({}),  // ← Schema-derived defaults
    opportunity_owner_id: identity?.id,        // ← Runtime merge
    contact_ids: [],                           // ← Explicit array init
    products_to_sync: [],
  };

  return (
    <CreateBase redirect="show">
      {/* ✅ DESIGN SYSTEM: Full-page create form layout */}
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <Form defaultValues={formDefaults}>
            {/* ✅ DESIGN SYSTEM: Card container */}
            <Card>
              <CardContent>
                <OpportunityInputs mode="create" />
                <FormToolbar>
                  <div className="flex flex-row gap-2 justify-end">
                    <CancelButton />
                    <OpportunityCreateSaveButton ... />
                  </div>
                </FormToolbar>
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
};
```

**Patterns Applied:**
- `opportunitySchema.partial().parse({})` — Form defaults from schema
- `bg-muted` — Semantic page background
- `create-form-card` — Premium elevation utility
- `max-w-4xl mx-auto` — Constrained width for forms
- No hardcoded defaults — All from schema
- No inline validation — Zod at API boundary

---

### Example 2: Zod Schema with Defaults

**Location:** `src/atomic-crm/validation/opportunities.ts`

```typescript
export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
]);

export const opportunitySchema = z.object({
  name: z.string().min(1, "Name is required"),

  // ✅ Default values in schema (not component)
  stage: opportunityStageSchema.default("new_lead"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),

  estimated_close_date: z.string().default(() => {
    // 30 days from now
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }),

  // Arrays initialized as empty
  products_to_sync: z.array(productSchema).default([]),
});

// Type inference from schema
export type Opportunity = z.infer<typeof opportunitySchema>;
```

**Why This Works:**
- `.default()` on schema fields → extracted by `.partial().parse({})`
- Type safety via `z.infer<typeof opportunitySchema>`
- Single source of truth (no duplicate defaults in component)

---

### Example 3: RLS Policy Pattern

**Location:** `supabase/migrations/YYYYMMDDHHMMSS_notifications.sql`

```sql
-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Step 1: Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 2: GRANT table access (REQUIRED or policies are useless!)
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT INSERT, DELETE ON notifications TO service_role;

-- Step 3: Create policies

-- Users can only see their own notifications
CREATE POLICY authenticated_select_own_notifications ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- System creates notifications for any user
CREATE POLICY service_insert_notifications ON notifications
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Users can mark their own as read
CREATE POLICY authenticated_update_own_notifications ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Only service role can delete (auto-cleanup)
CREATE POLICY service_delete_old_notifications ON notifications
  FOR DELETE TO service_role
  USING (true);

-- =====================================================
-- Verification Block (REQUIRED)
-- =====================================================
DO $$
BEGIN
  -- Verify RLS is enabled
  PERFORM 1 FROM pg_tables
  WHERE tablename = 'notifications'
  AND rowsecurity = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'RLS not enabled on notifications';
  END IF;

  -- Verify policies exist
  PERFORM 1 FROM pg_policies WHERE policyname LIKE '%notifications%';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No policies found for notifications';
  END IF;

  RAISE NOTICE 'Migration verified successfully';
END $$;
```

---

## From Theory to Practice

### Pattern: Adding a New Create Form

**Step 1: Create Zod Schema** (constitution: single source of truth)
```typescript
// src/atomic-crm/validation/newEntity.ts
export const newEntitySchema = z.object({
  name: z.string().min(1, "Name required"),
  type: z.enum(["a", "b", "c"]).default("a"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export type NewEntity = z.infer<typeof newEntitySchema>;
```

**Step 2: Create Form Component** (design system: layout pattern)
```typescript
// src/atomic-crm/newEntity/NewEntityCreate.tsx
import { newEntitySchema } from "../validation/newEntity";

export function NewEntityCreate() {
  const { data: identity } = useGetIdentity();

  // Form defaults from schema
  const formDefaults = {
    ...newEntitySchema.partial().parse({}),
    created_by: identity?.id,
  };

  return (
    <CreateBase redirect="show">
      {/* Full-page create form layout */}
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <Form defaultValues={formDefaults}>
            <Card>
              <CardContent>
                {/* Form inputs */}
                <TextInput source="name" label="Name" />
                <SelectInput source="type" choices={[...]} />
                <SelectInput source="priority" choices={[...]} />

                <FormToolbar>
                  <div className="flex flex-row gap-2 justify-end">
                    <CancelButton />
                    <SaveButton />
                  </div>
                </FormToolbar>
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
}
```

**Step 3: Add RLS Policies** (supabase: security)
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_new_entity.sql
CREATE TABLE new_entity (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'a',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE new_entity ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON new_entity TO authenticated;
GRANT USAGE ON SEQUENCE new_entity_id_seq TO authenticated;

CREATE POLICY authenticated_select ON new_entity
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- Verification block
DO $$ BEGIN
  PERFORM 1 FROM pg_tables WHERE tablename = 'new_entity' AND rowsecurity = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'RLS not enabled'; END IF;
  RAISE NOTICE 'Migration verified';
END $$;
```

---

## How It All Works Together

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SESSION START                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ User Prompt: "Add a contact form with email validation"                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ UserPromptSubmit Hook Fires                                                  │
│ └─ skill-activation-prompt.sh → skill-activation-prompt.ts                   │
│    ├─ Loads skill-rules.json                                                │
│    ├─ Analyzes prompt: "form", "contact", "validation"                      │
│    ├─ Matches:                                                               │
│    │   ├─ engineering-constitution (keywords: form, validation)             │
│    │   ├─ crispy-design-system (keywords: form, component)                  │
│    │   └─ supabase-crm (keywords: contact → implies database)               │
│    └─ Outputs:                                                               │
│        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                               │
│        🎯 SKILL ACTIVATION CHECK                                             │
│        📚 RECOMMENDED SKILLS:                                                │
│          → engineering-constitution                                          │
│          → crispy-design-system                                              │
│        ACTION: Use Skill tool BEFORE responding                              │
│        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Claude Code Processes with Activated Skills                                  │
│ ├─ Reads engineering-constitution/SKILL.md → Zod patterns, fail-fast        │
│ ├─ Reads crispy-design-system/SKILL.md → Full-page form, 44px targets       │
│ └─ Generates code following all patterns                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Write Tool Executes                                                          │
│ └─ Creates src/atomic-crm/contacts/ContactCreate.tsx                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PostToolUse Hooks Fire (parallel)                                            │
│ ├─ file-track.sh                                                             │
│ │   └─ Logs: [CREATE:Write] src/atomic-crm/contacts/ContactCreate.tsx       │
│ ├─ checkpoint-trigger.sh                                                     │
│ │   └─ Creates: "checkpoint: Automatic save of 1 file(s)"                   │
│ └─ post-tool-use-tracker.sh                                                  │
│     └─ Records: tool=Write, file_count=1, duration=...                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Session Continues...                                                         │
│ Every file modification → hooks fire → checkpoints created                   │
│ Skills remain active → consistent patterns throughout session                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary Table

| Component | Purpose | Key Files | Trigger |
|-----------|---------|-----------|---------|
| **settings.json** | Hook configuration | `.claude/settings.json` | N/A |
| **settings.local.json** | Permissions & MCP | `.claude/settings.local.json` | N/A |
| **checkpoint-state** | Git checkpoint state | `.claude/checkpoint-state` | PostToolUse |
| **skill-activation-prompt.ts** | Prompt analysis engine | `.claude/hooks/` | UserPromptSubmit |
| **checkpoint-trigger.sh** | Auto git commits | `.claude/hooks/` | Write/Edit/MultiEdit |
| **file-track.sh** | Change logging | `.claude/hooks/` | Write/Edit/MultiEdit |
| **skill-rules.json** | Activation rules | `.claude/skills/` | UserPromptSubmit |
| **engineering-constitution** | Dev principles | `.claude/skills/engineering-constitution/` | Implementation tasks |
| **crispy-design-system** | UI/UX patterns | `.claude/skills/crispy-design-system/` | Component work |
| **supabase-crm** | Backend patterns | `.claude/skills/supabase-crm/` | Database/API work |
| **skill-developer** | Meta-skill | `.claude/skills/skill-developer/` | Skill creation |
| **code-finder** | Code discovery | `.claude/agents/` | On-demand (Task tool) |
| **task-implementor** | Implementation | `.claude/agents/` | On-demand (Task tool) |

---

## Key Takeaways

1. **Skills Auto-Activate** — You don't need to ask; the hook system analyzes your prompts and activates relevant skills automatically.

2. **Patterns Are Enforced** — The Engineering Constitution ensures consistent patterns (Zod validation, form defaults, fail-fast) across the entire codebase.

3. **Safety Nets Everywhere** — Every file change creates a git checkpoint. You can always recover.

4. **Observable Operations** — Everything is logged. You can audit what happened and when.

5. **Composable Governance** — Skills work together. New team members automatically follow the same patterns.

---

*This report was generated by analyzing all files in the `.claude` directory, reading skill resource files, examining the skill-activation-prompt.ts engine, and finding real codebase examples.*
