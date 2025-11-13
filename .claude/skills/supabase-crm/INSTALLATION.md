# Installing the supabase-crm Skill

## 📦 What You're Installing

A comprehensive skill for Supabase backend development in Crispy-CRM, including:
- Service layer patterns with DataProvider abstraction
- RLS (Row Level Security) policies and best practices
- Plus additional resources you can create as needed

## 🚀 Quick Installation

### Step 1: Copy the Skill Directory

```bash
cd ~/projects/crispy-crm

# Copy the entire skill directory
cp -r /mnt/user-data/outputs/supabase-crm-skill .claude/skills/supabase-crm

# Verify installation
ls -la .claude/skills/supabase-crm/
```

Expected structure:
```
.claude/skills/supabase-crm/
├── SKILL.md
└── resources/
    ├── service-layer.md
    └── rls-policies.md
```

### Step 2: Update skill-rules.json

The skill should already be configured in your `skill-rules.json` from the earlier setup. Verify it's there:

```bash
cat .claude/skills/skill-rules.json | jq '.skills["supabase-crm"]'
```

If it's not there, add this entry:

```json
{
  "skills": {
    "supabase-crm": {
      "type": "domain",
      "enforcement": "suggest",
      "priority": "high",
      "description": "Supabase backend with RLS, Edge Functions, and CRM business logic",
      "promptTriggers": {
        "keywords": [
          "supabase",
          "database",
          "query",
          "rls",
          "edge function",
          "backend",
          "api",
          "service",
          "migration",
          "organization",
          "contact",
          "opportunity",
          "validation",
          "zod",
          "business logic"
        ],
        "intentPatterns": [
          "(create|write).*?(query|function|service)",
          "(organization|contact|opportunity).*",
          "(validate|validation).*",
          "(rls|policy).*"
        ]
      },
      "fileTriggers": {
        "pathPatterns": [
          "src/services/**/*.ts",
          "src/lib/supabase/**/*.ts",
          "supabase/functions/**/*.ts",
          "supabase/migrations/**/*.sql"
        ],
        "contentPatterns": [
          "import.*supabase",
          "\\.from\\(",
          "\\.select\\(",
          "createClient",
          "organizationService",
          "contactService"
        ]
      }
    }
  }
}
```

### Step 3: Test the Skill

```bash
# Start Claude Code
claude-code

# Test with these prompts:

# 1. Trigger by keyword
"Help me write a service layer method for creating organizations"

# 2. Trigger by file edit
"Edit src/services/organizations.service.ts"

# 3. Trigger by RLS keyword
"Show me how to create RLS policies for the contacts table"
```

Expected: Claude should mention using the `supabase-crm` skill or automatically load it.

## 📚 Resource Files Included

### 1. service-layer.md
**What it covers:**
- DataProvider abstraction pattern
- Service class structure and templates
- Real examples from Crispy-CRM (SalesService)
- CRM-specific patterns (hierarchy, multi-org contacts, stage workflows)
- Error handling and custom error classes
- Testing strategies

**Use when:**
- Creating new service classes
- Implementing business logic
- Working with DataProvider
- Organizing complex operations

### 2. rls-policies.md
**What it covers:**
- RLS policy patterns for shared team collaboration
- Real example from notifications table
- Performance optimization (indexing, simple policies)
- Testing RLS policies
- Common issues and solutions
- Migration templates

**Use when:**
- Creating new database tables
- Setting up access control
- Writing migrations
- Debugging permission issues

## 🔨 Creating Additional Resources (Optional)

You can expand the skill by creating more resource files:

### Suggested Resources

**Edge Functions** (`resources/edge-functions.md`):
```markdown
# Edge Functions

## Purpose
Serverless functions for complex business operations

## Pattern
[Document Edge Function patterns from your codebase]
```

**Migrations** (`resources/migrations.md`):
```markdown
# Database Migrations

## Purpose
Schema evolution and best practices

## Pattern
[Document migration patterns from supabase/migrations/]
```

**Validation** (`resources/validation.md`):
```markdown
# Validation Patterns

## Purpose
Zod schemas and RPC validation

## Pattern
[Document validation from src/validation/rpc.ts]
```

**Organizations** (`resources/organizations.md`):
```markdown
# Organization Entity

## Purpose
Hierarchy validation and management

## Business Rules
[Document org-specific rules from your PRD]
```

### How to Add Resources

```bash
# 1. Create the resource file
touch .claude/skills/supabase-crm/resources/edge-functions.md

# 2. Add content (use existing resources as template)
# 3. Reference in SKILL.md

# Add to Resource Files section:
- [Edge Functions](resources/edge-functions.md) - Serverless functions
```

## ✅ Verification Checklist

After installation:

- [ ] Skill directory exists at `.claude/skills/supabase-crm/`
- [ ] SKILL.md file is present and readable
- [ ] At least 2 resource files exist in `resources/`
- [ ] skill-rules.json contains supabase-crm entry
- [ ] JSON validates with `cat .claude/skills/skill-rules.json | jq .`
- [ ] Test prompts trigger the skill

## 🎯 Testing the Skill

### Test 1: Keyword Trigger
```bash
claude-code
```

Then type:
```
I need to create a service method for updating opportunities
```

**Expected:** Skill suggests itself or auto-loads

### Test 2: File Path Trigger
```bash
claude-code
```

Then type:
```
Edit src/services/opportunities.service.ts
```

**Expected:** Skill auto-activates based on file path

### Test 3: Content Pattern Trigger

Open a file that contains `import { supabase }` or `.from(` and start editing.

**Expected:** Skill activates based on content match

## 💡 Usage Tips

### When Working on Backend Code

The skill will help you:
- ✅ Follow DataProvider abstraction patterns
- ✅ Structure service classes correctly
- ✅ Implement proper validation with Zod
- ✅ Create RLS policies with correct patterns
- ✅ Handle errors consistently
- ✅ Apply CRM business rules

### When to Read Resources

**Read service-layer.md when:**
- Creating a new service class
- Implementing CRUD operations
- Adding business rule validation
- Structuring error handling

**Read rls-policies.md when:**
- Creating a new database table
- Writing migrations with RLS
- Debugging permission denied errors
- Optimizing policy performance

## 🔄 Keeping the Skill Updated

As you add patterns to your codebase:

```bash
# 1. Extract the pattern
# 2. Add to appropriate resource file
# 3. Update SKILL.md if needed

# Example: Adding a new validation pattern
echo "
### New Pattern: Phone Number Validation

\`\`\`typescript
const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
\`\`\`
" >> .claude/skills/supabase-crm/resources/validation.md
```

## 🐛 Troubleshooting

### Skill Not Activating

```bash
# 1. Check skill exists
ls .claude/skills/supabase-crm/SKILL.md

# 2. Verify in skill-rules.json
cat .claude/skills/skill-rules.json | jq '.skills | keys'

# 3. Check JSON syntax
cat .claude/skills/skill-rules.json | jq .

# 4. Restart Claude Code
```

### Can't Find Resource File

```bash
# Check resources directory
ls .claude/skills/supabase-crm/resources/

# Verify file name matches SKILL.md references
grep "resources/" .claude/skills/supabase-crm/SKILL.md
```

## 📖 Next Steps

1. **Review SKILL.md** - Understand when to use the skill
2. **Read service-layer.md** - Learn the core patterns
3. **Try creating a service** - Use the templates provided
4. **Add more resources** - Expand based on your needs

## 🎓 Learning Path

**Week 1: Core Patterns**
- Read SKILL.md quick reference
- Study service-layer.md examples
- Create one simple service class

**Week 2: Database & Security**
- Read rls-policies.md
- Add RLS to a new table
- Test policies in SQL editor

**Week 3: Advanced**
- Create edge-functions.md resource
- Document your validation patterns
- Add CRM-specific business rules

---

**Installation complete! Your supabase-crm skill is ready to use.** 🚀

Try this command to verify everything works:
```bash
cd ~/projects/crispy-crm && claude-code
# Then: "Show me how to create a service for managing contacts"
```
