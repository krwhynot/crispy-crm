# 🧹 Intelligent Project Cleanup Slash Command

An AI-powered slash command for Claude Code that intelligently analyzes and cleans up your project files based on actual relevance, not just age or file type.

## ✨ Features

### Intelligent Relevance Analysis
- **Smart Detection**: Analyzes actual file usage, not just timestamps
- **Code Analysis**: Finds orphaned tests, dead code, and unused exports
- **Documentation Validation**: Verifies docs match current code structure
- **Reference Checking**: Validates all file paths and imports
- **Dependency Graph**: Maps file relationships and usage patterns

### Comprehensive Categorization
- **Relevance Scoring**: 1-10 scale based on multiple factors
- **Confidence Levels**: High/Medium/Low for each recommendation
- **Action Suggestions**: Keep, Archive, Delete, or Review
- **Category Grouping**: Organizes findings by file type and issue

### Safety Features
- **Dry Run Mode**: Preview changes before execution
- **Report Only**: Generate analysis without any changes
- **Balanced Safety**: Summary + single confirmation
- **Cleanup Ignore**: `.cleanupignore` patterns like `.gitignore`
- **Detailed Logging**: Complete audit trail of all actions

### Learning System
- **Pattern Recognition**: Learns from your cleanup decisions
- **Ignore Patterns**: Automatically suggests additions to `.cleanupignore`
- **History Tracking**: Maintains cleanup history for future reference

## 🚀 Quick Start

### Installation

1. **Download the files** from this package
2. **Run the setup script**:
   ```bash
   chmod +x setup-cleanup.sh
   ./setup-cleanup.sh
   ```

Or manually:

1. **Create the command directory**:
   ```bash
   mkdir -p .claude/commands
   ```

2. **Copy the slash command**:
   ```bash
   cp cleanup-command.md .claude/commands/cleanup.md
   ```

3. **Set up ignore patterns**:
   ```bash
   cp .cleanupignore-template .cleanupignore
   ```

### Usage

#### Analysis Only (Recommended First Step)
```bash
claude '/cleanup --report-only'
```
Generates a comprehensive report without making any changes.

#### Preview Changes
```bash
claude '/cleanup --dry-run'
```
Shows exactly what would be cleaned up.

#### Execute Cleanup
```bash
claude '/cleanup --execute'
```
Performs the cleanup with confirmation.

#### Force Cleanup
```bash
claude '/cleanup --force'
```
Skips confirmation (use with caution).

## 📊 Understanding the Report

### Relevance Scores
- **9-10**: Core files, heavily used, recently modified
- **7-8**: Supporting files, valid references
- **5-6**: Unclear usage, needs review
- **3-4**: Likely obsolete, no clear references
- **1-2**: Definitely obsolete, broken references

### Categories Analyzed

#### Temporary Files
- `.tmp`, `.cache`, `.swp`, `~` files
- OS files (`.DS_Store`, `Thumbs.db`)
- Editor backup files

#### Build Artifacts
- `dist/`, `build/`, `.next/`
- Coverage reports
- Compiled outputs

#### Documentation
- Validates code examples
- Checks referenced file paths
- Verifies API documentation

#### Test Files
- Finds orphaned tests
- Validates test imports
- Checks tested functions exist

#### Dependencies
- Identifies unused packages
- Finds missing dependencies
- Detects version mismatches

## 🛠️ Configuration

### .cleanupignore File

Control what never gets cleaned:

```gitignore
# Essential files
package.json
.env*

# Core source
src/index.*
src/core/**

# Important docs
README.md
LICENSE

# Custom patterns
**/IMPORTANT_*
feature/**/
```

### Customization Options

Edit `.claude/commands/cleanup.md` to:
- Adjust relevance scoring thresholds
- Modify categorization rules
- Change report format
- Add custom file patterns
- Integrate with your workflow

## 📈 Workflow Integration

### Recommended Schedule
- **Weekly**: Run `--report-only` to monitor project health
- **Bi-weekly**: Execute cleanup for temporary files
- **Monthly**: Full cleanup including archives
- **Before releases**: Comprehensive cleanup

### CI/CD Integration
Add to your pipeline:
```yaml
- name: Cleanup Analysis
  run: claude '/cleanup --report-only'
```

### Git Workflow
After cleanup:
```bash
git add .
git commit -m "chore: intelligent cleanup - removed obsolete files"
```

## 🎯 Smart Strategies

### Progressive Cleanup
1. Start with `--report-only` to understand your project
2. Review and adjust `.cleanupignore`
3. Run `--dry-run` to preview
4. Execute with `--execute`
5. Learn from patterns for future runs

### Team Collaboration
- Share `.cleanupignore` via git
- Document cleanup decisions
- Review cleanup reports in PRs
- Standardize cleanup schedule

## 📝 Output Examples

### Executive Summary
```
Cleanup Complete: 47 files processed
• Archived: 23 files (4.2 MB)
• Deleted: 12 files (1.1 MB)
• Kept: 12 files
• Saved: 5.3 MB disk space
```

### Detailed Finding
```markdown
File: docs/old-api.md
- Relevance Score: 2/10
- Issue: References removed endpoint /api/v1/users
- Evidence: Import path no longer exists
- Dependencies affected: None
- Recommended: DELETE
```

## 🔧 Troubleshooting

### Command Not Found
Ensure the file exists at `.claude/commands/cleanup.md`

### No Files Analyzed
Check your `.cleanupignore` patterns aren't too broad

### Too Aggressive
Adjust relevance score thresholds in the command

### Missing Dependencies
The command requires git and standard Unix tools

## 🤝 Contributing

To improve the cleanup intelligence:

1. **Add Detection Patterns**: Edit Phase 2 in the command
2. **Improve Scoring**: Adjust Phase 3 scoring logic
3. **Enhance Reports**: Modify Phase 4 report generation
4. **Add File Types**: Extend analysis categories

## 📚 Advanced Features

### Custom Arguments
Extend the command to accept:
- `--threshold=N`: Minimum score for deletion
- `--age=N`: Days to consider files old
- `--category=TYPE`: Clean specific categories only

### Integration Points
- Hook into your build system
- Connect to code quality tools
- Export metrics to monitoring
- Generate cleanup badges

## 📄 License

This cleanup command system is provided as-is for use with Claude Code.

---

**Model**: Claude Opus 4.1 (`claude-opus-4-1-20250805`)  
**Purpose**: Intelligent project maintenance and cleanup  
**Philosophy**: Clean code is not just organized, it's relevant
