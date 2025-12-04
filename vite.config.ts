import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import createHtmlPlugin from "vite-plugin-simple-html";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",

      // Heavy libraries
      "@tanstack/react-query",
      "@hello-pangea/dnd",

      // Form libraries
      "react-hook-form",
      "@hookform/resolvers",
      "zod",

      // Utilities
      "date-fns",
      "lodash",
      "inflection",
      "clsx",
      "class-variance-authority",
      "lucide-react",

      // File handling
      "papaparse",
      "jsonexport",
      "react-dropzone",
      "react-cropper",
    ],
  },
  plugins: [
    react(),
    tailwindcss(),
    // Only include visualizer in development or when explicitly analyzing
    ...(mode === "development" || process.env.ANALYZE === "true"
      ? [
          visualizer({
            open: process.env.NODE_ENV !== "CI",
            filename: "./dist/stats.html",
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          mainScript: `src/main.tsx`,
        },
        tags: [
          {
            injectTo: "head",
            tag: "meta",
            attrs: {
              "http-equiv": "Content-Security-Policy",
              content:
                mode === "production"
                  ? // Production: Stricter security (includes Sentry + Google Fonts)
                    // Note: 'wasm-unsafe-eval' required for Vite's dynamic import() used by React.lazy()
                    // Note: blob: required for Sentry Session Replay worker
                    "default-src 'self'; " +
                    "script-src 'self' 'wasm-unsafe-eval' blob:; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                    "img-src 'self' data: blob: https:; " +
                    "font-src 'self' data: https://fonts.gstatic.com; " +
                    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://*.sentry.io; " +
                    "worker-src 'self' blob:; " +
                    "child-src 'self' blob:; " +
                    "frame-src 'none'; " +
                    "object-src 'none'; " +
                    "base-uri 'none'; " +
                    "form-action 'self';"
                  : // Development: Allow Vite HMR and inline scripts
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                    "img-src 'self' data: https:; " +
                    "font-src 'self' data: https://fonts.gstatic.com; " +
                    "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in; " +
                    "child-src 'self' blob:; " +
                    "frame-src 'none'; " +
                    "object-src 'none'; " +
                    "base-uri 'none'; " +
                    "form-action 'self';",
            },
          },
        ],
      },
    }),
    // Sentry source map upload - only in production builds
    // Requires SENTRY_AUTH_TOKEN and SENTRY_ORG/SENTRY_PROJECT env vars
    ...(mode === "production" && process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
          }),
        ]
      : []),
  ],
  define:
    process.env.NODE_ENV === "production"
      ? {
          "import.meta.env.VITE_IS_DEMO": JSON.stringify(process.env.VITE_IS_DEMO),
          "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL),
          "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
            process.env.VITE_SUPABASE_ANON_KEY
          ),
        }
      : undefined,
  server: {
    warmup: {
      clientFiles: [
        "./src/main.tsx",
        "./src/App.tsx",
        "./src/atomic-crm/root/CRM.tsx",
        "./src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx",
      ],
    },
    watch: {
      ignored: ["**/node_modules/**", "**/dist/**", "**/coverage/**", "**/.git/**"],
    },
  },
  esbuild: {
    keepNames: true,
    // Reduce memory usage during builds by limiting worker threads
    target: "ES2020",
    // Drop unused code and optimize minification
    drop: [],
  },
  // Limit esbuild workers to reduce memory pressure (default = auto CPU count)
  ssr: {
    noExternal: [],
  },
  build: {
    // Enable source maps for Sentry error tracking
    // Hidden source maps don't expose source code to users but allow Sentry to decode stack traces
    sourcemap: mode === "production" ? "hidden" : true,
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
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
          ],

          // Form handling libraries
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],

          // Drag and drop - only for kanban
          dnd: ["@hello-pangea/dnd"],

          // Utilities that don't need to be in main bundle
          utils: ["lodash", "date-fns", "clsx", "class-variance-authority", "inflection"],

          // File handling
          "file-utils": ["papaparse", "jsonexport", "react-dropzone", "react-cropper"],

          // Icons - frequently used but can be separate
          icons: ["lucide-react"],
        },
        // Optimize chunk names and size warnings
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId
                .split("/")
                .pop()
                ?.replace(/\.(tsx?|jsx?)$/, "")
            : "chunk";
          return `js/${facadeModuleId}-[hash].js`;
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 300,
    // Better minification for production
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
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Vercel deploys to root domain, not subdirectory (was "./" for GitHub Pages)
  base: "/",
}));
