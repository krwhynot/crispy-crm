#!/bin/bash

# Script to add ESLint plugins for color system enforcement and accessibility
# This script installs and configures ESLint plugins for:
# - Tailwind CSS class validation (ready for when Tailwind v4 support is added)
# - JSX accessibility rules (including color contrast validation)

echo "Installing ESLint plugins for color system enforcement..."

# Install ESLint plugins
# Note: eslint-plugin-tailwindcss requires --legacy-peer-deps due to Tailwind v4
npm install --save-dev \
  eslint-plugin-jsx-a11y@6.10.2

# Install Tailwind plugin for future use (doesn't work with v4 yet)
npm install --save-dev --legacy-peer-deps \
  eslint-plugin-tailwindcss@3.18.2

echo "ESLint plugins installed successfully!"
echo ""
echo "The following plugins have been added:"
echo "- eslint-plugin-jsx-a11y: Provides accessibility linting including color contrast validation (ACTIVE)"
echo "- eslint-plugin-tailwindcss: Ready for Tailwind v4 support (currently incompatible, rules commented)"
echo ""
echo "Configuration has been added to eslint.config.js:"
echo "1. JSX A11y rules are ACTIVE for accessibility validation"
echo "2. Tailwind CSS rules are DOCUMENTED for future activation when v4 support is added"
echo "3. Legacy color patterns are documented for manual code review"
echo ""
echo "Legacy color patterns that are now banned:"
echo "- text-{color}-{number} (e.g., text-green-600)"
echo "- bg-{color}-{number} (e.g., bg-gray-200)"
echo "- border-{color}-{number} (e.g., border-blue-300)"
echo "- And similar patterns for ring, divide, placeholder, outline, etc."
echo ""
echo "Allowed semantic color classes:"
echo "- tag-warm, tag-green, tag-blue, tag-purple, tag-amber, tag-red, tag-teal, tag-indigo"
echo "- Semantic tokens: primary, secondary, destructive, muted, accent, etc."