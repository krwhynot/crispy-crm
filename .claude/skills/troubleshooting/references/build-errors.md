# Build, TypeScript, and Dependency Error Fixes

Comprehensive reference for resolving build-time errors across the Crispy CRM stack.

---

## TypeScript Errors

```bash
# Check types without building
npx tsc --noEmit

# Find specific error location
npx tsc --noEmit 2>&1 | grep -A 3 "error TS"
```

**Common Fixes:**

| Error | Fix |
|-------|-----|
| `TS2307: Cannot find module` | Check import path, run `npm install` |
| `TS2322: Type 'X' is not assignable` | Fix type or add assertion |
| `TS7006: Parameter implicitly has 'any'` | Add explicit type annotation |
| `TS2339: Property does not exist` | Check object shape, add optional chaining |

---

## Vite Build Errors

```bash
# Debug build
npm run build -- --debug

# Check for circular dependencies
npx madge --circular src/
```

**Common Issues:**

| Error | Fix |
|-------|-----|
| `Failed to resolve import` | Check file exists, correct extension |
| `Circular dependency` | Refactor to break the cycle |
| `out of memory` | Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096` |

---

## Dependency Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for peer dependency issues
npm ls 2>&1 | grep "peer dep"

# Force resolution
npm install --legacy-peer-deps
```
