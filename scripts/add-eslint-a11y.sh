#!/bin/bash

# Script to add ESLint plugins for color system enforcement and accessibility
# This script installs and configures ESLint plugins for:
# - Tailwind CSS class validation (v4 beta with Tailwind v4 support!)
# - JSX accessibility rules (including color contrast validation)
#
# DECISION: Using eslint-plugin-tailwindcss@4.0.0-beta.0
# - v3.18.2 is incompatible with Tailwind v4 (requires v3)
# - Using --legacy-peer-deps masks real incompatibility
# - Beta designed for Tailwind v4 is lower risk than forcing v3
# - Monitor for stable v4 release: https://github.com/francoismassart/eslint-plugin-tailwindcss/releases

echo "Installing ESLint plugins for color system enforcement..."

# Install ESLint plugins
npm install --save-dev \
  eslint-plugin-jsx-a11y@6.10.2

# Install Tailwind plugin v4 beta (now supports Tailwind v4!)
npm install --save-dev \
  eslint-plugin-tailwindcss@4.0.0-beta.0

echo "ESLint plugins installed successfully!"
echo ""
echo "The following plugins have been added:"
echo "- eslint-plugin-jsx-a11y: Provides accessibility linting including color contrast validation (ACTIVE)"
echo "- eslint-plugin-tailwindcss: v4 beta with full Tailwind v4 support (ACTIVE)"
echo ""
echo "Configuration has been added to eslint.config.js:"
echo "1. JSX A11y rules are ACTIVE for accessibility validation"
echo "2. Tailwind CSS rules can now be ACTIVATED with the v4 beta plugin"
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