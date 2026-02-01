#!/bin/bash
set -e

echo "=== Task 2 Verification Script ==="
echo ""

echo "[1/5] Running full test suite..."
npm run test || { echo "❌ Tests failed"; exit 1; }
echo "✅ All tests passed"
echo ""

echo "[2/5] Checking TypeScript compilation..."
npx tsc --noEmit || { echo "❌ TypeScript errors found"; exit 1; }
echo "✅ TypeScript compiles cleanly"
echo ""

echo "[3/5] Checking for provider spreading anti-pattern..."
SPREAD_COUNT=$(rg "{\s*\.\.\.[a-zA-Z]+Provider" src/atomic-crm/providers/ --type ts | wc -l)
if [ "$SPREAD_COUNT" -gt 0 ]; then
  echo "⚠️  Warning: Found $SPREAD_COUNT potential provider spreading instances"
  rg "{\s*\.\.\.[a-zA-Z]+Provider" src/atomic-crm/providers/ --type ts
else
  echo "✅ No provider spreading found"
fi
echo ""

echo "[4/5] Checking code quality..."
npm run lint || { echo "⚠️  Lint warnings found (non-blocking)"; }
echo ""

echo "[5/5] Automated verification complete!"
echo ""
echo "⚠️  MANUAL TESTS REQUIRED:"
echo "   - Product deletion (no phantom reappearance)"
echo "   - Product creation with distributors"
echo "   - Opportunity product sync"
echo "   - Console error check"
echo ""
echo "📄 See VERIFICATION_TASK2.md for full manual test checklist"
