/**
 * ESLint Rule: no-legacy-tailwind-colors
 *
 * Enforces semantic color tokens over legacy Tailwind color classes.
 *
 * @fileoverview This rule detects and flags legacy Tailwind color utilities
 * (e.g., text-gray-500, bg-red-600) and suggests semantic alternatives
 * (e.g., text-muted-foreground, bg-destructive).
 *
 * Examples of incorrect code:
 *   <div className="text-gray-500 bg-red-600" />
 *   <span className="border-amber-200" />
 *
 * Examples of correct code:
 *   <div className="text-muted-foreground bg-destructive" />
 *   <span className="border-border" />
 */

const LEGACY_COLORS = [
  "gray",
  "red",
  "green",
  "blue",
  "yellow",
  "amber",
  "orange",
  "purple",
  "pink",
  "indigo",
  "cyan",
  "teal",
  "emerald",
  "lime",
  "rose",
  "fuchsia",
  "violet",
  "sky",
  "slate",
  "zinc",
  "neutral",
  "stone",
];

const LEGACY_SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

const COLOR_PREFIXES = [
  "text",
  "bg",
  "border",
  "ring",
  "divide",
  "placeholder",
  "outline",
  "decoration",
  "accent",
  "caret",
  "fill",
  "stroke",
];

const SEMANTIC_TOKENS = [
  "primary",
  "secondary",
  "destructive",
  "muted",
  "accent",
  "warning",
  "success",
  "foreground",
  "background",
  "border",
  "ring",
  "input",
  "card",
  "popover",
];

const SUGGESTION_MAP = {
  "text-gray-500": "text-muted-foreground",
  "text-gray-600": "text-foreground",
  "text-gray-400": "text-muted-foreground",
  "text-gray-700": "text-foreground",
  "text-gray-900": "text-foreground",
  "text-red-500": "text-destructive",
  "text-red-600": "text-destructive",
  "text-green-600": "text-success",
  "text-green-500": "text-success",
  "text-amber-600": "text-warning",
  "text-amber-500": "text-warning",
  "bg-gray-50": "bg-muted",
  "bg-gray-100": "bg-muted",
  "bg-gray-200": "bg-muted",
  "bg-white": "bg-background",
  "bg-red-50": "bg-destructive/10",
  "bg-red-100": "bg-destructive/20",
  "bg-red-500": "bg-destructive",
  "bg-red-600": "bg-destructive",
  "bg-green-50": "bg-success/10",
  "bg-green-100": "bg-success/20",
  "bg-green-600": "bg-success",
  "bg-amber-50": "bg-warning/10",
  "bg-amber-100": "bg-warning/20",
  "bg-blue-50": "bg-primary/10",
  "bg-blue-100": "bg-primary/20",
  "bg-blue-600": "bg-primary",
  "border-gray-200": "border-border",
  "border-gray-300": "border-border",
  "border-red-500": "border-destructive",
  "border-amber-200": "border-warning",
};

function isSemanticToken(classValue) {
  return SEMANTIC_TOKENS.some((token) => classValue.includes(token));
}

function buildLegacyColorPattern() {
  const colorPattern = LEGACY_COLORS.join("|");
  const shadePattern = LEGACY_SHADES.join("|");
  const prefixPattern = COLOR_PREFIXES.join("|");

  return new RegExp(`\\b(${prefixPattern})-(${colorPattern})-(${shadePattern})\\b`, "g");
}

function extractClassNames(node) {
  if (!node || !node.value) return [];

  if (node.type === "Literal" && typeof node.value === "string") {
    return [node.value];
  }

  if (node.type === "TemplateLiteral") {
    const classNames = [];
    for (const quasi of node.quasis) {
      if (quasi.value && quasi.value.raw) {
        classNames.push(quasi.value.raw);
      }
    }
    return classNames;
  }

  return [];
}

function checkClassNameValue(context, node, classValue) {
  if (!classValue || typeof classValue !== "string") return;

  if (isSemanticToken(classValue)) return;

  const pattern = buildLegacyColorPattern();
  let match;

  while ((match = pattern.exec(classValue)) !== null) {
    const fullMatch = match[0];
    const suggestion = SUGGESTION_MAP[fullMatch] || "a semantic color token";

    context.report({
      node,
      message: `Use semantic color token instead of legacy Tailwind color: "${fullMatch}"`,
      data: {
        legacy: fullMatch,
        suggestion,
      },
      suggest: [
        {
          desc: `Replace "${fullMatch}" with ${suggestion}`,
          fix(fixer) {
            if (SUGGESTION_MAP[fullMatch]) {
              const newValue = classValue.replace(fullMatch, SUGGESTION_MAP[fullMatch]);
              return fixer.replaceText(
                node,
                node.type === "Literal" ? `"${newValue}"` : `\`${newValue}\``
              );
            }
            return null;
          },
        },
      ],
    });
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce semantic color tokens over legacy Tailwind color classes",
      category: "Best Practices",
      recommended: true,
      url: "https://github.com/your-repo/eslint-rules/blob/main/docs/no-legacy-tailwind-colors.md",
    },
    messages: {
      legacyColor: 'Use semantic color token instead of legacy Tailwind color: "{{legacy}}"',
    },
    hasSuggestions: true,
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name && node.name.name === "className" && node.value) {
          const classNames = extractClassNames(node.value);

          for (const className of classNames) {
            checkClassNameValue(context, node.value, className);
          }
        }
      },

      TemplateLiteral(node) {
        const parent = node.parent;

        if (
          parent &&
          parent.type === "CallExpression" &&
          parent.callee &&
          (parent.callee.name === "cn" ||
            parent.callee.name === "clsx" ||
            parent.callee.name === "classnames" ||
            parent.callee.name === "cva")
        ) {
          const classNames = extractClassNames(node);

          for (const className of classNames) {
            checkClassNameValue(context, node, className);
          }
        }
      },
    };
  },
};
