#!/bin/bash

###############################################################################
# Color System Migration Validation Script
#
# This script performs comprehensive validation of the color system migration
# to ensure all requirements are met before phase advancement.
# All checks must pass (zero errors) before proceeding to the next phase.
###############################################################################

set -e  # Exit on any error

# Color output helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Results array for report
declare -a RESULTS

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 Color System Migration Validation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Function to run a check and record results
run_check() {
    local check_name="$1"
    local check_command="$2"
    local description="$3"

    ((TOTAL_CHECKS++))
    echo -e "${BLUE}→ ${description}...${NC}"

    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ PASSED${NC}"
        ((PASSED_CHECKS++))
        RESULTS+=("✅ ${check_name}: PASSED")
    else
        echo -e "  ${RED}❌ FAILED${NC}"
        ((FAILED_CHECKS++))
        RESULTS+=("❌ ${check_name}: FAILED - ${description}")

        # Show details for failed check
        echo -e "  ${YELLOW}Details:${NC}"
        eval "$check_command" 2>&1 | head -10 | sed 's/^/    /'
    fi
    echo ""
}

# Function to check for warnings (non-blocking)
run_warning_check() {
    local check_name="$1"
    local check_command="$2"
    local description="$3"

    echo -e "${BLUE}→ ${description}...${NC}"

    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ OK${NC}"
        RESULTS+=("✅ ${check_name}: OK")
    else
        echo -e "  ${YELLOW}⚠️  WARNING${NC}"
        ((WARNINGS++))
        RESULTS+=("⚠️  ${check_name}: WARNING - ${description}")
    fi
    echo ""
}

###############################################################################
# CHECK 1: Hardcoded Hex Colors in Source
###############################################################################

check_hex_colors() {
    local hex_count=$(grep -r "#[0-9a-fA-F]\{3,6\}" src/ \
        --include="*.tsx" \
        --include="*.ts" \
        --exclude-dir="node_modules" \
        --exclude-dir="dist" \
        --exclude-dir=".git" \
        | grep -v "^//" \
        | grep -v "^\s*//" \
        | grep -v "^\s*\*" \
        | wc -l)

    if [ "$hex_count" -gt 0 ]; then
        echo "Found $hex_count hardcoded hex colors:"
        grep -r "#[0-9a-fA-F]\{3,6\}" src/ \
            --include="*.tsx" \
            --include="*.ts" \
            --exclude-dir="node_modules" \
            --exclude-dir="dist" \
            | grep -v "^//" \
            | head -5
        return 1
    fi
    return 0
}

run_check "HEX_COLORS" "check_hex_colors" "Checking for hardcoded hex colors in source files"

###############################################################################
# CHECK 2: Legacy Tailwind Color Classes
###############################################################################

check_legacy_colors() {
    local legacy_patterns=(
        "text-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-[0-9]"
        "bg-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-[0-9]"
        "border-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-[0-9]"
        "ring-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-[0-9]"
    )

    local found=0
    for pattern in "${legacy_patterns[@]}"; do
        local count=$(grep -rE "$pattern" src/ \
            --include="*.tsx" \
            --include="*.ts" \
            --exclude-dir="node_modules" \
            --exclude-dir="dist" \
            | wc -l)

        if [ "$count" -gt 0 ]; then
            ((found+=count))
        fi
    done

    if [ "$found" -gt 0 ]; then
        echo "Found $found legacy Tailwind color classes"
        for pattern in "${legacy_patterns[@]}"; do
            grep -rE "$pattern" src/ \
                --include="*.tsx" \
                --include="*.ts" \
                --exclude-dir="node_modules" \
                | head -2
        done
        return 1
    fi
    return 0
}

run_check "LEGACY_COLORS" "check_legacy_colors" "Checking for legacy Tailwind color classes"

###############################################################################
# CHECK 3: CSS Tag Classes Exist
###############################################################################

check_css_tag_classes() {
    local css_file="src/index.css"
    local tag_colors=("warm" "green" "teal" "blue" "purple" "yellow" "gray" "pink")
    local missing=0

    for color in "${tag_colors[@]}"; do
        if ! grep -q "\.tag-$color" "$css_file"; then
            echo "Missing CSS class: .tag-$color"
            ((missing++))
        fi
    done

    if [ "$missing" -gt 0 ]; then
        return 1
    fi
    return 0
}

run_check "CSS_TAG_CLASSES" "check_css_tag_classes" "Validating CSS tag class definitions"

###############################################################################
# CHECK 4: Dark Mode Definitions
###############################################################################

check_dark_mode() {
    local css_file="src/index.css"
    local tag_colors=("warm" "green" "teal" "blue" "purple" "yellow" "gray" "pink")
    local missing=0

    # Check for dark mode CSS variables
    if ! grep -q "\.dark\s*{" "$css_file"; then
        echo "No dark mode section found"
        return 1
    fi

    # Check for dark mode tag color variables
    for color in "${tag_colors[@]}"; do
        if ! grep -q "--tag-${color}-bg" "$css_file"; then
            echo "Missing dark mode variable: --tag-${color}-bg"
            ((missing++))
        fi
        if ! grep -q "--tag-${color}-fg" "$css_file"; then
            echo "Missing dark mode variable: --tag-${color}-fg"
            ((missing++))
        fi
    done

    if [ "$missing" -gt 0 ]; then
        return 1
    fi
    return 0
}

run_check "DARK_MODE" "check_dark_mode" "Verifying dark mode color definitions"

###############################################################################
# CHECK 5: Inline Styles in Tag Components
###############################################################################

check_inline_styles() {
    local tag_components=(
        "src/atomic-crm/tags/TagChip.tsx"
        "src/atomic-crm/tags/RoundButton.tsx"
        "src/atomic-crm/contacts/TagsList.tsx"
        "src/atomic-crm/contacts/TagsListEdit.tsx"
        "src/atomic-crm/contacts/ContactListFilter.tsx"
    )

    local found=0
    for component in "${tag_components[@]}"; do
        if [ -f "$component" ]; then
            # Check for inline backgroundColor style
            if grep -q "backgroundColor:\s*tag\.color" "$component" 2>/dev/null || \
               grep -q "style=.*backgroundColor" "$component" 2>/dev/null; then
                echo "Found inline style in: $component"
                ((found++))
            fi
        fi
    done

    if [ "$found" -gt 0 ]; then
        return 1
    fi
    return 0
}

run_check "INLINE_STYLES" "check_inline_styles" "Checking for inline styles in tag components"

###############################################################################
# CHECK 6: TypeScript Compilation
###############################################################################

check_typescript() {
    echo "Running TypeScript compiler check..."
    npx tsc --noEmit
}

run_check "TYPESCRIPT" "check_typescript" "Running TypeScript type checking"

###############################################################################
# CHECK 7: ESLint
###############################################################################

check_eslint() {
    echo "Running ESLint..."
    npx eslint . --max-warnings=0
}

run_check "ESLINT" "check_eslint" "Running ESLint checks"

###############################################################################
# CHECK 8: Color Contrast Validation
###############################################################################

check_wcag_compliance() {
    local validation_script="scripts/validate-colors.js"

    if [ ! -f "$validation_script" ]; then
        echo "Color validation script not found at: $validation_script"
        return 1
    fi

    echo "Running WCAG color contrast validation..."
    node "$validation_script"
}

run_check "WCAG_COMPLIANCE" "check_wcag_compliance" "Validating WCAG color contrast ratios"

###############################################################################
# CHECK 9: Build Test
###############################################################################

check_build() {
    echo "Running production build test..."
    npm run build
}

run_warning_check "BUILD_TEST" "check_build" "Testing production build"

###############################################################################
# CHECK 10: Type Definitions
###############################################################################

check_type_definitions() {
    local type_files=(
        "src/lib/color-types.ts"
        "src/atomic-crm/tags/tag-colors.ts"
    )

    local missing=0
    for file in "${type_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo "Missing type definition file: $file"
            ((missing++))
        fi
    done

    if [ "$missing" -gt 0 ]; then
        return 1
    fi

    # Check for TagColorName type
    if ! grep -q "type TagColorName" src/atomic-crm/tags/tag-colors.ts 2>/dev/null && \
       ! grep -q "type TagColorName" src/lib/color-types.ts 2>/dev/null; then
        echo "TagColorName type not defined"
        return 1
    fi

    return 0
}

run_check "TYPE_DEFINITIONS" "check_type_definitions" "Checking color system type definitions"

###############################################################################
# REPORT GENERATION
###############################################################################

generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="migration-validation-report.txt"

    {
        echo "═══════════════════════════════════════════════════════════════"
        echo "COLOR SYSTEM MIGRATION VALIDATION REPORT"
        echo "Generated: $timestamp"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "SUMMARY"
        echo "───────────────────────────────────────────────────────────────"
        echo "Total Checks:    $TOTAL_CHECKS"
        echo "Passed:          $PASSED_CHECKS"
        echo "Failed:          $FAILED_CHECKS"
        echo "Warnings:        $WARNINGS"
        echo ""
        echo "VALIDATION RESULTS"
        echo "───────────────────────────────────────────────────────────────"
        for result in "${RESULTS[@]}"; do
            echo "$result"
        done
        echo ""

        if [ "$FAILED_CHECKS" -eq 0 ]; then
            echo "STATUS: ✅ PHASE VALIDATION PASSED"
            echo ""
            echo "All validation checks have passed successfully."
            echo "The phase requirements have been met and you may proceed."
        else
            echo "STATUS: ❌ PHASE VALIDATION FAILED"
            echo ""
            echo "CRITICAL: $FAILED_CHECKS validation check(s) failed."
            echo "All issues must be resolved before advancing to the next phase."
            echo ""
            echo "Next Steps:"
            echo "1. Review the failed checks above"
            echo "2. Fix all identified issues"
            echo "3. Run this validation script again"
            echo "4. Repeat until all checks pass"
        fi

        echo ""
        echo "═══════════════════════════════════════════════════════════════"
    } | tee "$report_file"

    echo ""
    echo -e "${BLUE}📄 Report saved to: $report_file${NC}"
}

# Generate final report
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 VALIDATION RESULTS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

generate_report

# Exit with appropriate code
if [ "$FAILED_CHECKS" -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ VALIDATION FAILED: Cannot proceed to next phase${NC}"
    echo -e "${RED}   $FAILED_CHECKS critical check(s) must be resolved${NC}"
    exit 1
else
    echo ""
    echo -e "${GREEN}✅ VALIDATION PASSED: Ready to proceed to next phase${NC}"
    if [ "$WARNINGS" -gt 0 ]; then
        echo -e "${YELLOW}   Note: $WARNINGS warning(s) detected (non-blocking)${NC}"
    fi
    exit 0
fi