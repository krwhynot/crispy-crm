# ADR-023: Build Optimization - Code Splitting Strategy

## Status

**Accepted**

## Date

Original: 2024-11 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

Crispy CRM uses Vite with Rollup for production builds. As the application grew with React Admin, Supabase, Radix UI, and feature-specific libraries (dnd-kit for Kanban, Chart.js for reports), the default bundling strategy produced unpredictable chunk sizes and poor caching behavior.

### Key Challenges

1. **Unpredictable Bundle Sizes**: Automatic code splitting created chunks that varied significantly between builds, invalidating browser caches unnecessarily.

2. **Mixed Domain Dependencies**: Core framework code (React, React Admin) was being bundled with feature-specific libraries (charts, drag-and-drop), causing users to download unused code.

3. **Dev Server Warmup**: Heavy dependencies like React Admin and Radix UI caused slow initial dev server starts due to on-demand compilation.

4. **Production Bundle Size**: Without manual control, the main bundle exceeded 500KB, hurting initial page load performance.

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Rollup automatic splitting** | Zero config, handles dynamic imports | Unpredictable chunk sizes, poor cache stability, chunks change names between builds |
| **Dynamic imports only** | Lazy loads features on demand | Less control over shared dependencies, potential waterfall requests |
| **No splitting (single bundle)** | Simple build, single request | Huge initial download (1MB+), poor caching, blocks render |
| **Manual chunk splitting** | Predictable sizes, optimal caching, logical grouping | Requires maintenance when adding dependencies |

---

## Decision

**Use manual chunk splitting with 10 domain-specific chunks:**

```typescript
// vite.config.ts:180-229

rollupOptions: {
  output: {
    // Manual chunk splitting for optimal loading
    manualChunks: {
      // React ecosystem - high priority
      "vendor-react": ["react", "react-dom", "react-router-dom"],

      // React Admin core - loaded on every page
      "vendor-ra-core": ["ra-core", "ra-i18n-polyglot", "ra-language-english"],

      // Supabase and data providers
      "vendor-supabase": ["@supabase/supabase-js", "ra-supabase-core"],

      // UI component libraries - shared across pages
      "ui-radix": [
        "@radix-ui/react-dialog",
        "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-popover",
        "@radix-ui/react-select",
        "@radix-ui/react-avatar",
        "@radix-ui/react-checkbox",
        "@radix-ui/react-label",
        "@radix-ui/react-separator",
        "@radix-ui/react-slot",
        "@radix-ui/react-switch",
        "@radix-ui/react-tabs",
        "@radix-ui/react-tooltip",
        "@radix-ui/react-accordion",
        "@radix-ui/react-progress",
        "@radix-ui/react-radio-group",
      ],

      // Form handling libraries
      forms: ["react-hook-form", "@hookform/resolvers", "zod"],

      // Drag and drop - All Kanban boards (dnd-kit)
      "dnd-kit": ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],

      // Chart libraries - Reports only
      charts: ["chart.js", "react-chartjs-2"],

      // Utilities that don't need to be in main bundle
      utils: ["date-fns", "clsx", "class-variance-authority", "inflection"],

      // File handling
      "file-utils": ["papaparse", "jsonexport", "react-dropzone", "react-cropper"],

      // Icons - frequently used but can be separate
      icons: ["lucide-react"],
    },
  },
},
```

### Chunk Categories

| Chunk | Purpose | Load Timing |
|-------|---------|-------------|
| `vendor-react` | React core runtime | Immediate (every page) |
| `vendor-ra-core` | React Admin framework | Immediate (every page) |
| `vendor-supabase` | Database connectivity | Immediate (after auth) |
| `ui-radix` | Shared UI primitives | Immediate (most pages) |
| `forms` | Form state + validation | On form pages |
| `dnd-kit` | Kanban drag-and-drop | Opportunities/Tasks only |
| `charts` | Data visualization | Reports page only |
| `utils` | Date/string utilities | Immediate (widely used) |
| `file-utils` | CSV import/export | Import/Export features only |
| `icons` | Lucide icon library | Immediate (widely used) |

### Chunk Size Warning Limit

```typescript
// vite.config.ts:243

chunkSizeWarningLimit: 300,
```

Vite warns during build when any chunk exceeds 300KB (gzipped). This threshold:
- Catches accidental bundling issues early
- Aligns with performance budgets for mobile/tablet users
- Signals when a chunk needs further splitting

### Dev Server Optimization

The `optimizeDeps.include` array mirrors `manualChunks` to pre-bundle the same packages:

```typescript
// vite.config.ts:11-68

optimizeDeps: {
  include: [
    // React Admin core - pre-bundle these heavy dependencies
    "ra-core",
    "ra-i18n-polyglot",
    "ra-language-english",

    // Supabase
    "@supabase/supabase-js",
    "ra-supabase-core",

    // UI Libraries - Radix UI components
    "@radix-ui/react-dialog",
    // ... (15 Radix components)

    // Heavy libraries
    "@tanstack/react-query",

    // DnD Kit, Chart.js, Form libraries, Utilities, File handling
    // ... (mirrors manualChunks configuration)
  ],
},
```

**Why Mirror?** Pre-bundling these dependencies during dev server start prevents on-demand compilation delays when navigating to pages that use them.

### Production Minification

```typescript
// vite.config.ts:245-255

minify: "terser",
terserOptions: {
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ["console.log", "console.info"],
  },
  format: {
    comments: false,
  },
},
```

**Terser Configuration:**
- `drop_console: true` - Removes all console statements in production
- `drop_debugger: true` - Removes debugger statements
- `pure_funcs` - Marks console.log/info as side-effect-free for tree shaking
- `comments: false` - Strips comments from output

---

## Consequences

### Positive

- **Predictable Caching**: Chunk names remain stable across builds. Users only re-download chunks containing changed code.
- **Logical Grouping**: Domain-based chunks (forms, charts, dnd-kit) load only when needed.
- **Faster Dev Server**: Pre-bundled dependencies reduce initial start time by 3-5 seconds.
- **Early Warning System**: 300KB limit catches bundling issues before they reach production.
- **Smaller Production Bundle**: Console statements and comments stripped, reducing total bundle size.

### Negative

- **Maintenance Overhead**: Adding new dependencies requires updating both `optimizeDeps.include` and `manualChunks`.
- **Manual Sync Required**: If a package is in one list but not the other, dev/prod behavior may differ.
- **Terser Build Time**: Terser minification is slower than esbuild (but produces smaller output).

### Neutral

- **Standard Vite Pattern**: Manual chunks follow established Rollup conventions.
- **Trade-off Accepted**: Build time increase (~2-3s) traded for better runtime performance.

---

## Code Examples

### Correct Pattern - Adding New Heavy Dependency

```typescript
// Step 1: Add to optimizeDeps.include (vite.config.ts)
optimizeDeps: {
  include: [
    // ... existing
    "new-heavy-library",
  ],
},

// Step 2: Add to manualChunks with logical grouping
manualChunks: {
  // ... existing chunks
  "new-feature": ["new-heavy-library", "related-library"],
},
```

### Correct Pattern - Verifying Chunk Sizes

```bash
# Generate bundle analysis
ANALYZE=true npm run build

# Opens dist/stats.html with interactive treemap
# Verify no chunk exceeds 300KB warning threshold
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Adding to manualChunks without optimizeDeps
manualChunks: {
  "new-chunk": ["heavy-lib"],  // Dev server will be slow!
},

// WRONG: Putting unrelated packages in same chunk
manualChunks: {
  "kitchen-sink": ["chart.js", "react-dropzone", "date-fns"],  // No logical grouping
},

// WRONG: Ignoring chunk size warnings
chunkSizeWarningLimit: 1000,  // Defeats the purpose of monitoring

// WRONG: Disabling terser for faster builds
minify: "esbuild",  // Keeps console.log in production
```

```typescript
// WRONG: Feature-specific code in always-loaded chunks
manualChunks: {
  "vendor-react": ["react", "react-dom", "chart.js"],  // Charts not needed on every page
},
```

---

## Related ADRs

- **[ADR-021: Multi-Environment Configuration](./ADR-021-multi-environment-config.md)** - Environment-specific build configuration (CSP, sourcemaps)
- **[ADR-005: DnD Kit Library Selection](../tier-3-frontend/ADR-005-dnd-kit-library.md)** - Why dnd-kit was chosen for Kanban (impacts chunk strategy)
- **[ADR-020: Sentry Error Monitoring](./ADR-020-sentry-error-monitoring.md)** - Sourcemap upload requires production build configuration

---

## References

- Build configuration: `vite.config.ts:180-255`
- Dev optimization: `vite.config.ts:11-68`
- Chunk size limit: `vite.config.ts:243`
- Vite Build Options: https://vitejs.dev/config/build-options.html
- Rollup Manual Chunks: https://rollupjs.org/configuration-options/#output-manualchunks
- Terser Options: https://terser.org/docs/options/
