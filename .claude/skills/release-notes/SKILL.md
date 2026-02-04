---
name: release-notes
description: Generate professional release notes by analyzing git history and commits. Interactive workflow with refinement. Triggers on - release notes, changelog, release, version notes, what changed, release summary, prepare release, generate changelog, version history, release documentation, deployment notes.
---

# Release Notes Generator

**Purpose:** Generate professional release notes by analyzing git history and commits. Interactive workflow allows refinement and customization.

## Workflow

1. **Gather Context** - Ask clarifying questions
2. **Analyze History** - Review git commits in version range
3. **Generate Draft** - Create structured release notes
4. **Refine** - Iterate based on user feedback

## Phase 1: Gather Context

Ask the user for:

1. **Version Number** (required)
   - Example: "v2.5.0", "1.3.0"

2. **Date Range** (required)
   - Example: "January 2026", "Last month", "Since v2.4.0"
   - If version tag exists, default to commits since that tag

3. **Project/Product Name** (optional)
   - Example: "POSIT", "Crispy CRM", "API v2"
   - Default to repo name if not provided

4. **Audience** (required)
   - `customer-facing` - No technical jargon, focus on benefits
   - `internal` - Include technical details, PR links
   - `executive` - High-level summary, business impact

**Example Questions:**
```
I'll generate release notes. What version is this for?

What date range should I analyze? (e.g., "January 2026", "Since v2.4.0", "Last 2 weeks")

What's the target audience?
- Customer-facing (focus on benefits, no technical details)
- Internal/Engineering (technical details, PR links)
- Executive (high-level summary, business impact)
```

## Phase 2: Analyze Git History

Use Bash tool to gather commit data:

```bash
# Get commits since last tag or date
git log <since>..<until> --pretty=format:"%h|%s|%an|%ad" --date=short

# Get PR numbers if using GitHub
git log <since>..<until> --pretty=format:"%s" | grep -oP '#\d+' | sort -u

# Check for conventional commit format
git log <since>..<until> --pretty=format:"%s" | grep -E '^(feat|fix|chore|docs|refactor|perf|test|build|ci):'
```

### Categorize Commits

Map commit types to sections:

| Commit Prefix | Section | Customer-Facing? |
|--------------|---------|------------------|
| `feat:`, `feature:` | New Features | ✅ Yes |
| `fix:`, `bugfix:` | Bug Fixes | ✅ Yes |
| `perf:`, `improve:` | Improvements | ✅ Yes |
| `chore:`, `build:`, `ci:` | Technical Updates | ❌ Internal only |
| `refactor:` | Technical Updates | ❌ Internal only |
| `docs:` | Documentation | ⚠️ Internal only |
| `BREAKING:`, `!:` | Breaking Changes | ✅ Always show |

## Phase 3: Generate Draft

Create structured release notes using this template:

```markdown
# Release Notes - {version}

**Release Date:** {date}
**Summary:** {one-sentence overview}

---

## ✨ New Features

{List major new functionality}

### {Feature Name} ({ticket-ref})

{Description focusing on user benefits}

- {Key point 1}
- {Key point 2}
- {Key point 3}

---

## 🔧 Improvements

{Enhancements to existing features}

- **{Improvement Title}** - {Description} ({ticket-ref})

---

## 🐛 Bug Fixes

{Issues that were resolved}

- {Description of fix} ({ticket-ref})

---

## ⚙️ Technical Updates

{Infrastructure, dependencies - internal audience only}

- {Technical change} ({ticket-ref})

---

## 🚨 Breaking Changes

{Changes requiring customer action}

- **{Change Title}** - {Description and migration path}

---

## 📋 Known Issues

{Outstanding problems}

- {Issue description} (workaround: {solution})

---

## 🗑️ Deprecations

{Features being retired}

- **{Feature Name}** - {Deprecation timeline and replacement}
```

### Section Rules

**Include section when:**
- New Features: Any `feat:` commits exist
- Improvements: Any `perf:`, `improve:` commits exist
- Bug Fixes: Any `fix:` commits exist
- Technical Updates: Internal audience AND technical commits exist
- Breaking Changes: Any `BREAKING CHANGE:` or `!:` commits exist
- Known Issues: User explicitly requests
- Deprecations: Any `deprecate:` commits or deprecation notices in code

**Omit section if:** No relevant commits exist (keep notes concise)

## Phase 4: Refine

After generating the draft, prompt the user:

```
I've generated the release notes draft above. Would you like me to:
- Add more detail to any section?
- Change the tone or wording?
- Add or remove sections?
- Include specific commit details?
```

### Common Refinement Requests

| Request | Action |
|---------|--------|
| "Make {section} more detailed" | Expand with commit details, examples |
| "Add {section}" | Create new section with relevant commits |
| "Remove technical jargon" | Simplify language, remove internal refs |
| "Add metrics/impact" | Include stats (e.g., "40% faster") |
| "Link to tickets" | Add GitHub issue/PR references |

## Audience Customization

### Customer-Facing
- ✅ Focus on benefits ("You can now...")
- ✅ Use simple language
- ❌ No technical jargon
- ❌ No internal ticket refs (unless public)
- ❌ Omit "Technical Updates" section

### Internal/Engineering
- ✅ Include PR/commit links
- ✅ Technical details (APIs, dependencies)
- ✅ Breaking changes with code examples
- ✅ Migration guides
- ✅ Performance metrics

### Executive
- ✅ High-level summary only
- ✅ Business impact (revenue, adoption)
- ✅ Strategic initiatives
- ❌ No low-level bug fixes
- ❌ No individual commit details

## Integration Patterns

### GitHub Integration

```bash
# Get PR titles
gh pr list --state merged --search "merged:>{date}" --json number,title

# Link commits to PRs
git log <since>..<until> --pretty=format:"%H %s" | while read hash msg; do
  gh pr list --search "$hash" --json number,title
done
```

## Best Practices

1. **Link Everything** - Provide traceability to commits/tickets
2. **Highlight Breaking Changes** - Make them impossible to miss
3. **Include Workarounds** - For known issues, provide temporary solutions
4. **Be Consistent** - Use same format for each release
5. **Focus on Impact** - What changed for the user, not implementation details

## Example Commands

```bash
# Get commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# Get commits in date range
git log --since="2026-01-01" --until="2026-01-31" --oneline

# Get commits between tags
git log v2.4.0..v2.5.0 --oneline

# Count commits by type
git log --pretty=format:"%s" | grep -E '^(feat|fix|chore):' | cut -d: -f1 | sort | uniq -c

# Get breaking changes
git log --grep="BREAKING CHANGE" --format="%s%n%b"
```

## Output Format

Always output in clean Markdown that can be:
- Copied to Confluence/Notion
- Sent in email
- Posted to Slack/Teams
- Published to docs site
- Committed to `CHANGELOG.md`

## Error Handling

**If git history is unclear:**
- Ask user for clarification
- Offer to analyze specific commit ranges
- Suggest conventional commit format for future

**If no commits found:**
- Verify date range is correct
- Check if version tag exists
- Ask if user wants to manually input changes

**If GitHub unavailable:**
- Fall back to git commit messages only
- Extract issue refs from commit messages (e.g., #123)
- Note limitation in generated notes

## Anti-Patterns (DON'T)

❌ Generate without asking questions first
❌ Include every commit (too verbose)
❌ Use technical jargon for customer-facing notes
❌ Omit breaking changes
❌ Generate once and exit (no refinement)
❌ Ignore conventional commit format
❌ Copy commit messages verbatim (rephrase for clarity)

## Success Criteria

✅ User asked clarifying questions
✅ Notes match specified audience level
✅ Breaking changes clearly highlighted
✅ Each section has relevant content only
✅ User offered chance to refine
✅ Output is copy-paste ready
✅ Traceability to commits/tickets maintained
