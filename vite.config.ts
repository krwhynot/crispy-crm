import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import createHtmlPlugin from "vite-plugin-simple-html";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  optimizeDeps: {
    include: [
      // React Admin core - pre-bundle these heavy dependencies
      'ra-core',
      'ra-i18n-polyglot',
      'ra-language-english',

      // Supabase
      '@supabase/supabase-js',
      'ra-supabase-core',

      // UI Libraries - Radix UI components
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-accordion',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',

      // Heavy libraries
      '@nivo/bar',
      '@tanstack/react-query',
      '@hello-pangea/dnd',

      // Form libraries
      'react-hook-form',
      '@hookform/resolvers',
      'zod',

      // Utilities
      'date-fns',
      'lodash',
      'inflection',
      'clsx',
      'class-variance-authority',
      'lucide-react',

      // File handling
      'papaparse',
      'jsonexport',
      'react-dropzone',
      'react-cropper'
    ]
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
      },
    }),
  ],
  define:
    process.env.NODE_ENV === "production"
      ? {
          "import.meta.env.VITE_IS_DEMO": JSON.stringify(
            process.env.VITE_IS_DEMO,
          ),
          "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
            process.env.VITE_SUPABASE_URL,
          ),
          "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
            process.env.VITE_SUPABASE_ANON_KEY,
          ),
          "import.meta.env.VITE_INBOUND_EMAIL": JSON.stringify(
            process.env.VITE_INBOUND_EMAIL,
          ),
        }
      : undefined,
  base: "./",
  server: {
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/atomic-crm/root/CRM.tsx',
        './src/atomic-crm/dashboard/Dashboard.tsx'
      ]
    },
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.git/**']
    }
  },
  esbuild: {
    keepNames: true,
  },
  build: {
    // Disable source maps for production builds (7.7MB savings)
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal loading
        manualChunks: {
          // React ecosystem - high priority
          "vendor-react": ["react", "react-dom", "react-router-dom"],

          // React Admin core - loaded on every page
          "vendor-ra-core": [
            "ra-core",
            "ra-i18n-polyglot",
            "ra-language-english",
          ],

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

          // Charts and visualization - heavy but not always needed
          "charts-nivo": ["@nivo/bar"],

          // Form handling libraries
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],

          // Drag and drop - only for kanban
          dnd: ["@hello-pangea/dnd"],

          // Utilities that don't need to be in main bundle
          utils: [
            "lodash",
            "date-fns",
            "clsx",
            "class-variance-authority",
            "inflection",
          ],

          // File handling
          "file-utils": [
            "papaparse",
            "jsonexport",
            "react-dropzone",
            "react-cropper",
          ],

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
}));
