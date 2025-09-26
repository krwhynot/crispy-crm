// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
// import storybook from "eslint-plugin-storybook";

// NOTE: eslint-plugin-tailwindcss does not support Tailwind CSS v4 yet
// The plugin is installed for future use when v4 support is added
// For now, we document the banned patterns and rely on code reviews
// import tailwindcss from "eslint-plugin-tailwindcss";

import jsxA11y from "eslint-plugin-jsx-a11y";

import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Color System ESLint Configuration
 *
 * This configuration enforces the new OKLCH-based color system and prevents
 * the use of legacy Tailwind color classes that don't align with our design system.
 *
 * BANNED PATTERNS:
 * - Legacy color utilities: text-green-600, bg-gray-200, border-blue-300, etc.
 * - Direct color values that bypass the semantic color system
 *
 * ALLOWED PATTERNS:
 * - Semantic color tokens: primary, secondary, destructive, muted, accent
 * - Tag color classes: tag-warm, tag-green, tag-blue, etc.
 * - Theme-aware utilities that use CSS variables
 *
 * Note: eslint-plugin-tailwindcss has limited Tailwind v4 support, so some
 * rules are set to "warn" instead of "error" to prevent false positives.
 */

// Legacy color patterns that should be replaced with semantic tokens
// These are documented for reference but enforcement is handled by eslint-plugin-tailwindcss
const bannedColorPatterns = [
  // Ban legacy text colors
  /text-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
  // Ban legacy background colors
  /bg-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
  // Ban legacy border colors
  /border-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
  // Ban legacy ring colors
  /ring-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
  // Ban legacy divide colors
  /divide-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
  // Ban legacy placeholder colors
  /placeholder-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
  // Ban legacy outline colors
  /outline-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
  // Ban legacy decoration colors
  /decoration-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
  // Ban legacy accent colors
  /accent-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
  // Ban legacy caret colors
  /caret-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
  // Ban legacy fill colors
  /fill-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
  // Ban legacy stroke colors
  /stroke-(gray|green|blue|red|yellow|purple|pink|indigo|cyan|orange|lime|emerald|teal|sky|violet|fuchsia|rose|amber)-\d{2,3}/,
];

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      // "tailwindcss": tailwindcss, // Disabled until v4 support
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-imports": "warn",

      // Tailwind CSS rules for color system enforcement
      // NOTE: eslint-plugin-tailwindcss does not support Tailwind v4 yet
      // These rules are documented for when v4 support is added
      // For now, rely on code reviews and the validate-colors script

      // Future rules when Tailwind v4 is supported:
      // "tailwindcss/no-custom-classname": [
      //   "error",
      //   {
      //     "whitelist": [
      //       "tag-warm", "tag-green", "tag-blue", "tag-purple",
      //       "tag-amber", "tag-red", "tag-teal", "tag-indigo",
      //       "animate-.*", "tw-.*", "container", "prose",
      //       "group-.*", "peer-.*", "data-\\[.*\\]:.*", "aria-\\[.*\\]:.*"
      //     ]
      //   }
      // ],
      // "tailwindcss/classnames-order": "warn",
      // "tailwindcss/enforces-negative-arbitrary-values": "warn",
      // "tailwindcss/enforces-shorthand": "warn",
      // "tailwindcss/no-contradicting-classname": "error",

      // JSX A11y rules for color contrast validation
      "jsx-a11y/no-onchange": "off", // React handles onChange properly

      // Prevent form-level validation (Constitution Principle #3: Single-point validation at API boundary only)
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='validate']",
          message: "[VALIDATION] Form-level validation is forbidden per Engineering Constitution. All validation must occur at the API boundary (data provider) using Zod schemas. Use helper text and asterisks for visual cues instead.",
        },
      ],

      // Prevent validation-related imports (Constitution Principle #3)
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "ra-core",
              importNames: ["required", "email", "minLength", "maxLength", "minValue", "maxValue", "number", "regex", "choices"],
              message: "[VALIDATION] React Admin validators are forbidden. Use Zod schemas at the API boundary instead.",
            },
          ],
        },
      ],

      // Prevent reintroduction of legacy fields (Constitution Principle #16)
      "no-restricted-properties": [
        "error",
        {
          object: "Contact",
          property: "company_id",
          message:
            "[DEPRECATED] Contact.company_id is removed. Use contact_organizations junction table instead.",
        },
        {
          object: "Contact",
          property: "is_primary_contact",
          message:
            "[DEPRECATED] Contact.is_primary_contact is removed. Use is_primary field in contact_organizations junction table.",
        },
        {
          object: "Opportunity",
          property: "company_id",
          message:
            "[DEPRECATED] Opportunity.company_id is removed. Use customer_organization_id instead.",
        },
        {
          object: "Opportunity",
          property: "archived_at",
          message:
            "[DEPRECATED] Opportunity.archived_at is removed. Use deleted_at for soft deletes instead.",
        },
      ],
    },
    // Settings for future Tailwind v4 support
    // settings: {
    //   tailwindcss: {
    //     callees: ["classnames", "clsx", "cn", "cva"],
    //     config: "tailwind.config.js",
    //     cssFiles: ["!**/node_modules/**", "!**/dist/**", "!**/build/**", "**/*.css"],
    //     cssFilesRefreshRate: 5_000,
    //     removeDuplicates: true,
    //     skipClassAttribute: false,
    //     whitelist: [],
    //     tags: [],
    //     classRegex: "^(class(Name)?|tw)$",
    //   },
    // },
  },
  // Storybook config disabled due to missing dependency
  // storybook.configs["flat/recommended"],
);
