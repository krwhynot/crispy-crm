# Agent Router Reference

## Available Agents

| Agent | Model | Tools | Best For |
|-------|-------|-------|----------|
| `test-fixer` | haiku | Read, Edit, Bash, Grep | Fixing test failures |
| `migration-validator` | default | Read, Bash, Grep | Validating SQL migrations |
| `form-builder` | default | Read, Write, Glob, Grep | Form scaffolding |
| `schema-auditor` | default | Read, Grep, Glob, Bash | Database schema audits |
| `rls-auditor` | default | Read, Grep, Glob, Bash | RLS policy security |
| `color-fixer` | haiku | Read, Edit, Grep, Glob | Semantic color fixes |
| `code-finder` | haiku | Read, Grep, Glob | Code discovery |
| `task-implementor` | default | All | General implementation |

## Routing Priority

1. **Explicit Agent Hint** - If task has `**Agent Hint:** \`agent-name\``, use that
2. **Keyword Matching** - Match task description against patterns
3. **Default Fallback** - Use task-implementor

## Keyword Patterns

```typescript
function selectAgent(taskDescription: string, agentHint?: string): string {
  // Priority 1: Explicit hint
  if (agentHint) return agentHint;

  const text = taskDescription.toLowerCase();

  // Priority 2-8: Keyword matching
  if (/\b(test|vitest|failing test|fix test|test error)\b/.test(text)) {
    return "test-fixer";
  }
  if (/\b(create form|scaffold form|new form|entity form)\b/.test(text)) {
    return "form-builder";
  }
  if (/\b(validate migration|check migration|migration review)\b/.test(text)) {
    return "migration-validator";
  }
  if (/\b(rls|policy|security audit|permission)\b/.test(text)) {
    return "rls-auditor";
  }
  if (/\b(schema audit|missing column|view sync)\b/.test(text)) {
    return "schema-auditor";
  }
  if (/\b(color|semantic color|theme drift)\b/.test(text)) {
    return "color-fixer";
  }
  if (/\b(find|locate|where is|search for)\b/.test(text) &&
      /\b(implementation|code|function|class)\b/.test(text)) {
    return "code-finder";
  }

  // Priority 9: Default
  return "task-implementor";
}
```

## When to Override

Use explicit Agent Hints when:
- Task doesn't match patterns but needs specialist
- Multiple patterns match (disambiguation)
- You want to force a specific agent

Example:
```markdown
### Task 5: Update ContactList to use new API

**Agent Hint:** `task-implementor` (general refactoring, not test-related despite "Contact")
```
