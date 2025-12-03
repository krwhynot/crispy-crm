#!/bin/bash
# find-polluter.sh - Bisection script to identify which test creates unwanted state
#
# Usage: ./find-polluter.sh <file-to-monitor> <test-pattern>
# Example: ./find-polluter.sh '.git' 'src/**/*.test.ts'
#          ./find-polluter.sh 'test.db' 'tests/**/*.spec.ts'
#
# This script runs each matching test file sequentially and checks if the
# monitored file/directory appears after each test. When found, it reports
# which test caused the pollution.

set -e

# Validate arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <file-to-monitor> <test-pattern>"
    echo ""
    echo "Examples:"
    echo "  $0 '.git' 'src/**/*.test.ts'    # Find test that creates .git"
    echo "  $0 'test.db' 'tests/**/*.spec.ts' # Find test that creates test.db"
    echo "  $0 'tmp/cache' '**/*.test.ts'   # Find test that creates cache dir"
    exit 1
fi

MONITOR_PATH="$1"
TEST_PATTERN="$2"

echo "=== Test Pollution Bisection ==="
echo "Monitoring: $MONITOR_PATH"
echo "Test pattern: $TEST_PATTERN"
echo ""

# Find all matching test files
TEST_FILES=$(find . -path "$TEST_PATTERN" 2>/dev/null | sort)
TOTAL=$(echo "$TEST_FILES" | wc -l | tr -d ' ')

if [ "$TOTAL" -eq 0 ]; then
    echo "No test files found matching pattern: $TEST_PATTERN"
    exit 1
fi

echo "Found $TOTAL test files"
echo ""

# Clean up monitored path if it exists
if [ -e "$MONITOR_PATH" ]; then
    echo "WARNING: $MONITOR_PATH already exists. Removing for clean test."
    rm -rf "$MONITOR_PATH"
fi

# Run each test and check for pollution
COUNT=0
for TEST_FILE in $TEST_FILES; do
    COUNT=$((COUNT + 1))
    echo "[$COUNT/$TOTAL] Running: $TEST_FILE"

    # Run the test, suppressing output
    npm test -- "$TEST_FILE" > /dev/null 2>&1 || true

    # Check if monitored path now exists
    if [ -e "$MONITOR_PATH" ]; then
        echo ""
        echo "=== POLLUTER FOUND ==="
        echo "Test file: $TEST_FILE"
        echo ""
        echo "Details of polluted path:"
        ls -la "$MONITOR_PATH"
        echo ""
        echo "To investigate further:"
        echo "  npm test -- $TEST_FILE --verbose"
        echo "  npm test -- $TEST_FILE --inspect-brk"
        exit 1
    fi
done

echo ""
echo "=== NO POLLUTER FOUND ==="
echo "None of the $TOTAL test files created: $MONITOR_PATH"
exit 0
