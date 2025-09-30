# Atomic CRM Troubleshooting Guides

Systematic diagnostic procedures and solutions for common issues in the Atomic CRM system.

## Available Guides

### [Validation Errors](./validation-errors.md)
**DataProvider validation failures during CRUD operations**

**Use when you see:**
- `[DataProvider Error] Validation failed`
- Errors in unifiedDataProvider.ts:101
- Form submission failures with validation errors
- React Admin inline error messages

**Covers:**
- Contact validation failures (required fields, emails, organizations)
- LinkedIn URL format errors
- Legacy field migration issues
- Multi-organization relationship validation
- Database constraint violations
- Diagnostic procedures and testing
- Browser console debugging commands
- Quick reference card for common fixes

**Quick Access:**
```bash
# View in terminal
cat .claude/troubleshooting/validation-errors.md

# Open in editor
code .claude/troubleshooting/validation-errors.md
```

---

## How to Use These Guides

Each guide follows this structure:

1. **Overview** - Error signature and system context
2. **Common Issues** - Most frequent problems with solutions
3. **Advanced Diagnostics** - Deep debugging techniques
4. **Reference** - Schema documentation and error codes
5. **Preventive Measures** - How to avoid the issue
6. **Troubleshooting Checklist** - Step-by-step diagnostic process
7. **Escalation** - When to contact development team

## Creating New Guides

When creating new troubleshooting documentation:

1. **Start with the error** - Real error message from logs
2. **Map the system** - Show relevant architecture/flow
3. **List common causes** - 80% of cases first
4. **Provide diagnostics** - Commands to run, code to test
5. **Show solutions** - Concrete fixes with code examples
6. **Add prevention** - How to avoid in future
7. **Include references** - File locations, line numbers

### Template

```markdown
# Troubleshooting Guide: [Issue Name]

## Overview
[Brief description and error signature]

## System Architecture
[Relevant system components and data flow]

## Common Issues and Solutions

### 1. [Issue Name]
#### Symptoms
#### Root Cause
#### Diagnostic Steps
#### Solutions

## Advanced Diagnostics
## Reference
## Preventive Measures
## Troubleshooting Checklist
## Related Files
## Escalation
```

---

## Contributing

Found an issue not covered? Encountered a new solution?

1. Create a new guide in `.claude/troubleshooting/`
2. Follow the template structure
3. Update this README with a link
4. Include real error examples and solutions

---

## Engineering Principles

All troubleshooting guides follow the project's Engineering Constitution:

- **NO OVER-ENGINEERING** - Simple, direct solutions
- **SINGLE SOURCE OF TRUTH** - Reference authoritative code
- **BOY SCOUT RULE** - Improve docs when fixing issues
- **FAIL FAST** - Clear error messages and quick diagnosis

---

*Directory Created: 2025-09-30*