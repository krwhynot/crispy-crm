---
allowed-tools: Bash(find:*), Bash(wc:*), Bash(grep:*), Bash(cat:*), Bash(head:*), Bash(tail:*), Bash(sort:*), Bash(awk:*), Bash(sed:*)
description: Comprehensive codebase analysis with 10+ refactor recommendations using Zen principles
model: claude-opus-4-1-20250805
argument-hint: [focus-area or component-name]
---

# Comprehensive Codebase Refactoring Analysis

## Project Configuration
- Engineering Constitution: @.claude/ENGINEERING_CONSTITUTION.md
- Analysis Focus: ${ARGUMENTS:-entire-codebase}
- Timestamp: !`date "+%Y-%m-%d %H:%M:%S"`
- Git Branch: !`git branch --show-current`
- Last Commit: !`git log -1 --oneline`

## Codebase Metrics Collection

### Repository Statistics
- TypeScript Files: !`find src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l`
- Total Lines: !`find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs wc -l | tail -1 | awk '{print $1}'`
- Component Count: !`find src/components -name "*.tsx" | wc -l`
- Service Count: !`find src/services -name "*.ts" | wc -l`
- Average File Size: !`find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '{sum+=$1; count++} END {print int(sum/count) " lines"}'`

### Code Quality Indicators

#### Complexity Metrics
- Files >200 lines: !`find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 200 {print $2 " (" $1 " lines)"}' | head -10`
- Files >500 lines: !`find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 500 {print $2 " (" $1 " lines)"}'`
- Complex conditionals (3+ &&/||): !`grep -r "&&.*&&\|||.*||" --include="*.tsx" --include="*.ts" src/ | wc -l`
- Deeply nested code (4+ indents): !`grep -r "^[[:space:]]\{16,\}" --include="*.tsx" --include="*.ts" src/ | cut -d: -f1 | sort -u | wc -l`
- Long functions (>50 lines): !`awk '/^[[:space:]]*(const|function|async).*{/,/^[[:space:]]*}/' src/**/*.ts* | awk 'BEGIN{count=0} /^[[:space:]]*(const|function|async)/{if(lines>50)count++; lines=0} {lines++} END{print count}'`

#### Constitution Violations
- Hardcoded Colors: !`grep -r "#[0-9a-fA-F]\{3,6\}\|rgb\|rgba" --include="*.tsx" --include="*.css" src/ | grep -v "var(--" | wc -l`
- Non-Admin Forms: !`grep -r "<form" --include="*.tsx" src/ | grep -v "src/components/admin" | cut -d: -f1 | sort -u`
- Direct Supabase Calls: !`grep -r "supabase\.\|from(" --include="*.tsx" --include="*.ts" src/ | grep -v "dataProvider\|supabaseDataProvider" | wc -l`
- Scattered Validation: !`grep -r "\.parse\|\.safeParse\|zod\|yup" --include="*.tsx" src/ | grep -v "validation/schemas" | wc -l`
- Multiple Data Sources: !`grep -r "fetch(\|axios\|XMLHttpRequest" --include="*.ts" --include="*.tsx" src/ | wc -l`

#### Code Duplication
- Duplicate Imports: !`grep -r "^import" --include="*.tsx" --include="*.ts" src/ | sort | uniq -d | wc -l`
- Similar Function Names: !`grep -r "^[[:space:]]*const.*=" --include="*.tsx" --include="*.ts" src/ | sed 's/.*const \([^=]*\).*/\1/' | sort | uniq -d | head -10`
- Copy-Paste Indicators: !`find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "TODO\|FIXME\|HACK\|XXX" | wc -l`

### Performance Analysis
- Bundle Impact Files: !`find src -name "*.tsx" -exec grep -l "import.*from ['\"].*node_modules" {} \; | wc -l`
- Unoptimized Images: !`find public src -name "*.png" -o -name "*.jpg" -size +100k | wc -l`
- Missing Memoization: !`grep -r "map(\|filter(\|reduce(" --include="*.tsx" src/components | grep -v "useMemo\|useCallback" | wc -l`
- Potential Memory Leaks: !`grep -r "addEventListener\|setInterval\|setTimeout" --include="*.tsx" src/ | grep -v "removeEventListener\|clearInterval\|clearTimeout" | wc -l`

### Architecture Health
- Component Dependencies: !`grep -r "import.*from.*components" --include="*.tsx" src/components | wc -l`
- Circular Dependency Risk: !`grep -r "import.*from '\.\./\.\." --include="*.tsx" --include="*.ts" src/ | wc -l`
- Service Layer Violations: !`grep -r "import.*from.*services" --include="*.tsx" src/components | cut -d: -f1 | sort -u | wc -l`
- State Management Issues: !`grep -r "useState\|useReducer" --include="*.tsx" src/ | wc -l`

## Critical Files Analysis

### Core System Components
@src/atomic-crm/data-provider/supabaseDataProvider.ts
@src/atomic-crm/validation/schemas.ts
@src/components/admin/index.tsx
@src/App.tsx
@src/index.tsx

### Largest Components (Refactor Candidates)
!`find src/components -name "*.tsx" -exec wc -l {} + | sort -rn | head -5 | awk '{print "@" $2}'`

### Most Modified Files (Last 30 Days)
!`git log --since="30 days ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -5 | awk '{print "@src/" $2}'`

### Focus Area Deep Dive
${ARGUMENTS:+@src/components/$ARGUMENTS/}
${ARGUMENTS:+@src/atomic-crm/$ARGUMENTS/}
${ARGUMENTS:+@src/services/$ARGUMENTS}

## Zen Code Principles

Apply these five Zen principles during analysis:

1. **Simplicity over Cleverness**: Identify unnecessary abstractions and over-engineered solutions
2. **Clarity over Brevity**: Find code that sacrifices readability for conciseness
3. **Consistency over Perfection**: Detect pattern violations across the codebase
4. **Flow over Structure**: Identify impediments to natural code progression
5. **Purpose over Implementation**: Find code that lost sight of business objectives

## Refactoring Analysis Framework

### Layer 1: Constitution Compliance
- Single data provider enforcement
- API-boundary validation consolidation
- Semantic CSS variable adoption
- Admin layer form migration
- Fail-fast error handling
- Boy Scout Rule application

### Layer 2: Code Quality Enhancement
- Method extraction opportunities (>20 lines)
- Class decomposition needs (>200 lines)
- Naming clarity improvements
- Type safety enhancements
- Dead code elimination
- Duplicate code consolidation

### Layer 3: Architecture Optimization
- Component responsibility alignment
- Service layer boundary enforcement
- State management simplification
- Dependency injection opportunities
- Module boundary clarification
- Testing strategy refinement

### Layer 4: Performance Tuning
- Query optimization requirements
- Memoization candidates
- Bundle size reduction
- Lazy loading opportunities
- Cache strategy implementation
- Render optimization targets

## Required Output Specification

Generate **AT LEAST 10 refactoring recommendations** plus one transformative "Constitution Breaker" suggestion.

### Recommendation Structure
Priority [N]: [IMPACT_LEVEL] - [Title]
Zen Principle: [Applicable principle]
Constitution Alignment: [Compliant/Violation/Exception]
Current State:

File(s): [Specific locations]
Metrics: [Relevant measurements]
Pattern: [Observed anti-pattern]

Problem Statement:
[Clear description of the issue and its impact]
Proposed Solution:
[Detailed refactoring approach with specific techniques]
Implementation Strategy:

[Preparation step]
[Execution step]
[Validation step]
[Migration step]

Effort Estimation: [S/M/L/XL]
Risk Assessment: [Low/Medium/High]`
Business Value: [Specific measurable benefit]
Success Metrics:

[Quantifiable improvement 1]
[Quantifiable improvement 2]
[Quantifiable improvement 3]


### Priority Distribution

**Priorities 1-3: CRITICAL**
- Constitution violations requiring immediate attention
- Security vulnerabilities or data integrity risks
- Performance bottlenecks affecting user experience

**Priorities 4-6: HIGH**
- Code quality issues impeding development velocity
- Maintenance hazards increasing bug probability
- Testing gaps threatening stability

**Priorities 7-9: MEDIUM**
- Architecture improvements enabling scalability
- Developer experience enhancements
- Documentation and knowledge transfer needs

**Priorities 10+: LOW**
- Performance optimizations with marginal gains
- Code aesthetics and consistency improvements
- Future-proofing considerations

### Special Priority 0: The Constitution Breaker
Priority 0: TRANSFORMATIVE - [Revolutionary Change Title]
Rationale for Constitution Violation:
[Compelling argument for why this specific violation creates exceptional value]
Expected Transformation:

User Experience: [10x improvement metric]
Performance: [50%+ improvement metric]
Developer Velocity: [Multiplier effect]
Business Impact: [Market differentiation]

Constitution Rules Violated:

[Specific rule and why it's worth breaking]
[Additional violations if applicable]

Risk Mitigation:

[How to contain the violation's impact]
[Monitoring and rollback strategy]
[Long-term maintenance plan]

Implementation Approach:
[Detailed strategy acknowledging the exceptional nature]

## Analysis Execution

You are a senior software architect with expertise in:
- Clean code principles and SOLID design
- Modern TypeScript and React patterns
- Performance optimization strategies
- Technical debt management
- Zen philosophy applied to software engineering

Analyze the codebase through multiple lenses:
1. Technical correctness and constitution compliance
2. Maintainability and team velocity impact
3. User experience and performance implications
4. Business value and strategic alignment
5. Innovation potential and competitive advantage

For the Constitution Breaker recommendation, think beyond conventional wisdom. Consider:
- Emerging patterns that could revolutionize the codebase
- User experience enhancements that justify technical debt
- Performance optimizations that break abstraction boundaries
- Developer productivity tools worth the complexity cost

Remember: The constitution exists to prevent over-engineering, but exceptional circumstances warrant exceptional measures. One transformative violation could unlock unprecedented value.

## Timeline and Resource Planning

Provide implementation roadmap:
- **Sprint 1** (Quick Wins): Priorities 8-10
- **Sprint 2-3** (Foundation): Priorities 4-7
- **Sprint 4-5** (Critical): Priorities 1-3
- **Quarter 2** (Transformative): Priority 0 with careful planning

## Risk Assessment Matrix

For each recommendation, evaluate:
- User impact during implementation
- Rollback complexity
- Testing requirements
- Team knowledge gaps
- External dependencies

## Final Deliverables

Your analysis should provide:
1. Minimum 10 actionable refactoring recommendations
2. One bold Constitution Breaker proposal
3. Clear implementation priorities
4. Measurable success criteria
5. Risk mitigation strategies
6. Timeline with resource allocation
7. Knowledge transfer requirements

Execute comprehensive analysis now.