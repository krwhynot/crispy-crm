#!/bin/bash

###############################################################################
# Phase-Specific Lint and Quality Check Script
#
# This script performs targeted linting and quality checks for each migration
# phase, ensuring code quality standards are maintained throughout the
# color system migration process.
###############################################################################

set -e  # Exit on any error

# Color output helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
PHASE="${1:-all}"
QUICK_MODE="${2:-false}"

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}🔧 Phase-Specific Lint and Quality Check${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}───────────────────────────────────────────────────────────────${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}───────────────────────────────────────────────────────────────${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

###############################################################################
# PHASE 1: Foundation Setup Checks
###############################################################################

phase1_checks() {
    print_section "PHASE 1: Foundation Setup"

    echo -e "${YELLOW}→ Checking CSS color definitions...${NC}"

    # Check for OKLCH color format correctness
    if grep -E "oklch\([0-9]\.[0-9]+" src/index.css | grep -v "oklch([0-9]*%"; then
        echo -e "  ${RED}❌ Found OKLCH colors without percentage format${NC}"
        echo "  OKLCH lightness must use percentage (e.g., 55% not 0.55)"
        grep -E "oklch\([0-9]\.[0-9]+" src/index.css | grep -v "%" | head -5
        return 1
    else
        echo -e "  ${GREEN}✅ OKLCH format is correct${NC}"
    fi

    # Check for tag color CSS variables
    echo -e "${YELLOW}→ Checking tag color CSS variables...${NC}"
    local tag_colors=("warm" "green" "teal" "blue" "purple" "yellow" "gray" "pink")
    local missing_vars=0

    for color in "${tag_colors[@]}"; do
        if ! grep -q "--tag-${color}-bg" src/index.css; then
            echo -e "  ${RED}Missing: --tag-${color}-bg${NC}"
            ((missing_vars++))
        fi
        if ! grep -q "--tag-${color}-fg" src/index.css; then
            echo -e "  ${RED}Missing: --tag-${color}-fg${NC}"
            ((missing_vars++))
        fi
    done

    if [ "$missing_vars" -eq 0 ]; then
        echo -e "  ${GREEN}✅ All tag color variables defined${NC}"
    else
        echo -e "  ${RED}❌ Missing $missing_vars tag color variables${NC}"
        return 1
    fi

    # Check type definitions
    echo -e "${YELLOW}→ Checking type definitions...${NC}"
    if [ -f "src/lib/color-types.ts" ] || [ -f "src/atomic-crm/tags/tag-colors.ts" ]; then
        echo -e "  ${GREEN}✅ Color type files exist${NC}"

        # Check for proper TypeScript exports
        if grep -q "export type TagColorName" src/lib/color-types.ts 2>/dev/null || \
           grep -q "export type TagColorName" src/atomic-crm/tags/tag-colors.ts 2>/dev/null; then
            echo -e "  ${GREEN}✅ TagColorName type exported${NC}"
        else
            echo -e "  ${YELLOW}⚠️  TagColorName type not properly exported${NC}"
        fi
    else
        echo -e "  ${RED}❌ Color type definition files missing${NC}"
        return 1
    fi

    return 0
}

###############################################################################
# PHASE 2: Component Migration Checks
###############################################################################

phase2_checks() {
    print_section "PHASE 2: Component Migration"

    echo -e "${YELLOW}→ Checking for inline styles...${NC}"

    local components=(
        "src/atomic-crm/tags/TagChip.tsx"
        "src/atomic-crm/tags/RoundButton.tsx"
        "src/atomic-crm/contacts/TagsList.tsx"
        "src/atomic-crm/contacts/TagsListEdit.tsx"
    )

    local inline_count=0
    for comp in "${components[@]}"; do
        if [ -f "$comp" ]; then
            if grep -q "style=.*backgroundColor" "$comp" || \
               grep -q "backgroundColor:\s*tag\.color" "$comp"; then
                echo -e "  ${RED}Inline style found in: $(basename $comp)${NC}"
                ((inline_count++))
            fi
        fi
    done

    if [ "$inline_count" -eq 0 ]; then
        echo -e "  ${GREEN}✅ No inline styles in tag components${NC}"
    else
        echo -e "  ${RED}❌ Found $inline_count components with inline styles${NC}"
        return 1
    fi

    # Check for cn() utility usage
    echo -e "${YELLOW}→ Checking for CSS class composition...${NC}"
    if grep -q "cn(" src/atomic-crm/tags/TagChip.tsx 2>/dev/null; then
        echo -e "  ${GREEN}✅ Using cn() utility for class composition${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Consider using cn() utility for dynamic classes${NC}"
    fi

    # Check for hardcoded colors in components
    echo -e "${YELLOW}→ Checking for hardcoded colors...${NC}"
    local hardcoded_patterns=(
        "text-green-600"
        "bg-gray-200"
        "bg-gray-300"
        "border-blue-300"
        "border-orange-300"
    )

    local found_hardcoded=0
    for pattern in "${hardcoded_patterns[@]}"; do
        if grep -r "$pattern" src/atomic-crm/ --include="*.tsx" 2>/dev/null | grep -v "^//"; then
            echo -e "  ${RED}Found hardcoded: $pattern${NC}"
            ((found_hardcoded++))
        fi
    done

    if [ "$found_hardcoded" -eq 0 ]; then
        echo -e "  ${GREEN}✅ No hardcoded color classes found${NC}"
    else
        echo -e "  ${RED}❌ Found $found_hardcoded hardcoded color patterns${NC}"
        return 1
    fi

    return 0
}

###############################################################################
# PHASE 3: Database & API Checks
###############################################################################

phase3_checks() {
    print_section "PHASE 3: Database & API Updates"

    echo -e "${YELLOW}→ Checking for migration scripts...${NC}"

    # Check if migration scripts exist
    if ls /home/krwhynot/Projects/atomic/supabase/migrations/*migrate_tag_colors* 2>/dev/null | grep -q .; then
        echo -e "  ${GREEN}✅ Tag color migration scripts exist${NC}"

        # Check for rollback script
        if ls /home/krwhynot/Projects/atomic/supabase/migrations/*rollback_tag_colors* 2>/dev/null | grep -q .; then
            echo -e "  ${GREEN}✅ Rollback script exists${NC}"
        else
            echo -e "  ${YELLOW}⚠️  No rollback script found${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  Migration scripts not yet created${NC}"
    fi

    # Check seed data scripts
    echo -e "${YELLOW}→ Checking seed data scripts...${NC}"
    if [ -f "scripts/seed-data.js" ]; then
        echo -e "  ${GREEN}✅ Seed data scripts exist${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Seed data scripts not found${NC}"
    fi

    # Check for validation functions
    echo -e "${YELLOW}→ Checking validation utilities...${NC}"
    if grep -q "validateTagColor" src/atomic-crm/tags/tag-colors.ts 2>/dev/null; then
        echo -e "  ${GREEN}✅ Color validation function exists${NC}"
    else
        echo -e "  ${YELLOW}⚠️  No validateTagColor function found${NC}"
    fi

    return 0
}

###############################################################################
# PHASE 4: Testing & Validation Checks
###############################################################################

phase4_checks() {
    print_section "PHASE 4: Testing & Validation"

    echo -e "${YELLOW}→ Checking validation scripts...${NC}"

    # Check for color validation script
    if [ -f "scripts/validate-colors.js" ]; then
        echo -e "  ${GREEN}✅ Color validation script exists${NC}"

        # Run the validation
        if node scripts/validate-colors.js > /dev/null 2>&1; then
            echo -e "  ${GREEN}✅ WCAG compliance check passed${NC}"
        else
            echo -e "  ${RED}❌ WCAG compliance check failed${NC}"
            node scripts/validate-colors.js 2>&1 | grep "❌" | head -5
            return 1
        fi
    else
        echo -e "  ${RED}❌ Color validation script missing${NC}"
        return 1
    fi

    # Check ESLint configuration
    echo -e "${YELLOW}→ Checking ESLint configuration...${NC}"
    if grep -q "bannedColorPatterns" eslint.config.js 2>/dev/null; then
        echo -e "  ${GREEN}✅ ESLint color rules documented${NC}"
    else
        echo -e "  ${YELLOW}⚠️  ESLint color rules not configured${NC}"
    fi

    return 0
}

###############################################################################
# PHASE 5: Documentation & Cleanup Checks
###############################################################################

phase5_checks() {
    print_section "PHASE 5: Documentation & Cleanup"

    echo -e "${YELLOW}→ Checking theme files...${NC}"

    # Check manifest.json
    if [ -f "public/manifest.json" ]; then
        if grep -q "#[0-9a-fA-F]\{6\}" public/manifest.json; then
            echo -e "  ${YELLOW}⚠️  Manifest still uses hex colors${NC}"
        else
            echo -e "  ${GREEN}✅ Manifest updated${NC}"
        fi
    fi

    # Check index.html
    if grep -q "theme-color" index.html; then
        echo -e "  ${GREEN}✅ Theme color meta tags present${NC}"
    else
        echo -e "  ${YELLOW}⚠️  No theme-color meta tags${NC}"
    fi

    # Check for cleanup
    echo -e "${YELLOW}→ Checking for legacy code...${NC}"
    if [ -f "src/atomic-crm/tags/colors.ts" ]; then
        if grep -q "#[0-9a-fA-F]\{6\}" src/atomic-crm/tags/colors.ts; then
            echo -e "  ${YELLOW}⚠️  Legacy hex colors still in colors.ts${NC}"
        fi
    fi

    return 0
}

###############################################################################
# COMPREHENSIVE CHECKS (All Phases)
###############################################################################

all_checks() {
    print_section "Running All Phase Checks"

    local phase1_result=0
    local phase2_result=0
    local phase3_result=0
    local phase4_result=0
    local phase5_result=0

    phase1_checks || phase1_result=$?
    phase2_checks || phase2_result=$?
    phase3_checks || phase3_result=$?
    phase4_checks || phase4_result=$?
    phase5_checks || phase5_result=$?

    local total_failures=$((phase1_result + phase2_result + phase3_result + phase4_result + phase5_result))

    return $total_failures
}

###############################################################################
# QUICK LINT CHECK
###############################################################################

quick_lint() {
    print_section "Quick Lint Check"

    echo -e "${YELLOW}→ Running TypeScript compiler...${NC}"
    if npx tsc --noEmit --pretty false 2>&1 | grep -E "error TS"; then
        echo -e "  ${RED}❌ TypeScript errors found${NC}"
        npx tsc --noEmit --pretty false 2>&1 | grep -E "error TS" | head -5
        return 1
    else
        echo -e "  ${GREEN}✅ No TypeScript errors${NC}"
    fi

    echo -e "${YELLOW}→ Running ESLint (errors only)...${NC}"
    if npx eslint . --quiet 2>&1 | grep -E "error"; then
        echo -e "  ${RED}❌ ESLint errors found${NC}"
        npx eslint . --quiet 2>&1 | head -10
        return 1
    else
        echo -e "  ${GREEN}✅ No ESLint errors${NC}"
    fi

    return 0
}

###############################################################################
# MAIN EXECUTION
###############################################################################

# Main execution logic
main() {
    local exit_code=0

    case "$PHASE" in
        1)
            phase1_checks || exit_code=$?
            ;;
        2)
            phase2_checks || exit_code=$?
            ;;
        3)
            phase3_checks || exit_code=$?
            ;;
        4)
            phase4_checks || exit_code=$?
            ;;
        5)
            phase5_checks || exit_code=$?
            ;;
        all)
            all_checks || exit_code=$?
            ;;
        quick)
            quick_lint || exit_code=$?
            ;;
        *)
            echo -e "${RED}Invalid phase: $PHASE${NC}"
            echo ""
            echo "Usage: $0 [phase] [quick_mode]"
            echo "  phase: 1, 2, 3, 4, 5, all, or quick"
            echo "  quick_mode: true or false (optional)"
            echo ""
            echo "Examples:"
            echo "  $0 1        # Check Phase 1 only"
            echo "  $0 all      # Check all phases"
            echo "  $0 quick    # Quick lint check"
            exit 1
            ;;
    esac

    # Summary
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    if [ "$exit_code" -eq 0 ]; then
        echo -e "${GREEN}✅ LINT CHECK PASSED${NC}"
        echo -e "${GREEN}All checks for phase ${PHASE} completed successfully.${NC}"
    else
        echo -e "${RED}❌ LINT CHECK FAILED${NC}"
        echo -e "${RED}Issues found in phase ${PHASE} checks.${NC}"
        echo -e "${RED}Please resolve all issues before proceeding.${NC}"
    fi
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

    exit $exit_code
}

# Run main function
main