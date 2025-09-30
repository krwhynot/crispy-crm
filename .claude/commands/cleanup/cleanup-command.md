---
allowed-tools: Bash(find:*), Bash(git:*), Bash(grep:*), Read, Write
argument-hint: [--dry-run] [--force] [--report-only]
description: Intelligent project cleanup with AI-assisted relevance analysis

---

# Intelligent Project Cleanup with Relevance Analysis

## Initialize Cleanup Context
- Current directory: !`pwd`
- Project type: !`cat package.json 2>/dev/null | grep '"name"' || echo "Non-Node project"`
- Git status: !`git status --porcelain | wc -l` uncommitted changes
- Last cleanup: !`cat .cleanup-last-run 2>/dev/null || echo "Never"`
- Cleanup ignore patterns: @.cleanupignore

## Phase 1: Project Structure Discovery

### Active Project Analysis
- Source files: !`find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | head -20`
- Current structure: !`tree -d -L 3 -I 'node_modules|coverage|dist|build|.git'`
- Package.json: @package.json
- Active dependencies: !`cat package.json | grep -E '"dependencies"|"devDependencies"' -A 20`
- Test structure: !`find . -path "*/test*" -o -path "*/spec*" | grep -v node_modules | head -10`

## Phase 2: Intelligent File Analysis

Analyze each file for relevance using these criteria:

### Documentation Files (.md, .mdx)
Check all markdown files for:
1. **Code references validation**
   - Verify all code examples match current API
   - Check file paths mentioned exist
   - Validate import statements in examples
   - Check if referenced functions/classes exist

2. **Content relevance**
   - Does it describe current features?
   - Are version numbers current?
   - Do setup instructions match current config?

### Test Files  
Examine all test files for:
1. **Import validation**
   - Do imported modules exist?
   - Are tested functions still in codebase?
   - Check mock data references

2. **Coverage relevance**
   - Is the tested feature still active?
   - Do test patterns match current code style?

### Source Code Files
Analyze for:
1. **Usage patterns**
   - Files with zero imports from other files
   - Exported functions never imported
   - Components never rendered
   - Utilities never called

2. **Code health**
   - Files with only commented code
   - Files with outdated patterns
   - Deprecated API usage

### Configuration Files
Validate:
1. **Path references**
   - Do all paths in configs exist?
   - Are build outputs current?
   - Do aliases resolve correctly?

2. **Tool relevance**
   - Config for tools not in package.json
   - Duplicate or conflicting configs
   - Outdated version specifications

## Phase 3: Categorization & Scoring

For each analyzed file, assign:

### Relevance Score (1-10)
- **9-10**: Core active files, recently modified, heavily referenced
- **7-8**: Supporting files, occasionally used, valid references  
- **5-6**: Unclear usage, might be needed, requires review
- **3-4**: Likely obsolete, no clear references, outdated content
- **1-2**: Definitely obsolete, broken references, deprecated

### Confidence Level
- **High**: Clear evidence (broken imports, missing references)
- **Medium**: Pattern-based (no imports, old patterns)
- **Low**: Requires human judgment

### Recommended Action
- **Keep**: Score 7+, active use
- **Archive**: Score 3-6, might need later
- **Delete**: Score 1-2, clearly obsolete
- **Review**: Confidence low, edge cases

## Phase 4: Generate Cleanup Report

Create comprehensive analysis report:

```markdown
# Cleanup Analysis Report
Generated: [timestamp]

## Executive Summary
- Files analyzed: [total]
- Obsolete files found: [count]
- Potential disk space recovery: [size]
- Confidence level: [percentage]

## Critical Findings

### Definitely Obsolete ([count] files, [size])
[For each file, show:]
- **File**: [path]
  - Relevance Score: [1-10]
  - Issue: [specific problem found]
  - Evidence: [broken import, missing reference, etc.]
  - Dependencies affected: [list]
  - Recommended: DELETE

### Probably Obsolete ([count] files, [size])
[Similar format with ARCHIVE recommendation]

### Needs Review ([count] files)
[Similar format with specific questions for human]

## File Category Breakdown

### Temporary Files
- .tmp, .cache, .swp files: [count]
- OS files (.DS_Store, Thumbs.db): [count]
- Total size: [size]

### Build Artifacts  
- Old dist/build folders: [list]
- Coverage reports: [count]
- Total size: [size]

### Logs
- NPM/Yarn logs: [count]
- Application logs: [count]
- Total size: [size]

### Test Artifacts
- Orphaned tests: [count]
- Outdated snapshots: [count]
- Dead mocks: [count]

### Documentation
- Outdated docs: [count]
- Broken examples: [count]
- Missing references: [count]

## Code Quality Metrics

### Before Cleanup
- Total files: [count]
- Code coverage: [percentage]
- Dead code: [percentage]
- Documentation accuracy: [percentage]

### After Cleanup (Projected)
- Total files: [count]
- Code coverage: [improved percentage]
- Dead code: [reduced percentage]
- Documentation accuracy: [improved percentage]

## Dependency Analysis
- Unused dependencies found: [list]
- Missing dependencies: [list]
- Version mismatches: [list]

## Prevention Recommendations

### Immediate Actions
1. Add these patterns to .cleanupignore:
   ```
   [suggested patterns based on kept files]
   ```

2. Update these configurations:
   - [config file]: [specific update needed]

3. Fix these documentation sections:
   - [doc file]: [what needs updating]

### Process Improvements
- Set up pre-commit hooks for: [suggestions]
- Add CI checks for: [suggestions]
- Regular cleanup schedule: [recommendation]

## Next Steps

1. Review the detailed findings above
2. Run `/cleanup --dry-run` to preview changes
3. Run `/cleanup --execute` to apply changes
4. Commit with: `git add . && git commit -m "chore: intelligent cleanup - removed X obsolete files"`
```

## Phase 5: Execute Cleanup Plan

Based on provided arguments ($ARGUMENTS):

### If --dry-run or no arguments:
Show what would be done without making changes

### If --report-only:
Generate report and stop

### If --execute:
1. Create archive directory: `archive/[date]-cleanup/`
2. Create backup of .cleanupignore
3. Move files to appropriate locations
4. Update .cleanup-last-run with timestamp
5. Generate final report

## Phase 6: Learning Integration

### Update .cleanupignore
Based on files marked as "keep", suggest additions:
```
# Auto-suggested from cleanup analysis
# Core files to always preserve
src/core/**
src/components/ui/**

# Active documentation
README.md
docs/current/**

# Critical configs
package.json
tsconfig.json
```

### Track Decisions
Create `.cleanup-history/[date].json`:
```json
{
  "date": "[timestamp]",
  "files_analyzed": 247,
  "actions": {
    "kept": ["file1.ts", "file2.tsx"],
    "archived": ["old-doc.md"],
    "deleted": ["temp.log"]
  },
  "patterns_learned": [
    "*.test.ts files without matching source files",
    "docs/* referencing old API versions"
  ]
}
```

## Safety Checks

Before any destructive action:
1. Verify no uncommitted changes in deleted files
2. Check .cleanupignore patterns
3. Ensure archive directory is created
4. Log all actions to .cleanup.log
5. Show summary and request confirmation

Remember to:
- Be conservative with source code
- Aggressive with temp files and logs
- Careful with configuration files
- Preserve anything with unclear purpose for review
