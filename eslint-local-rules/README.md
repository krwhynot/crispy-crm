# ESLint Local Rules

Custom ESLint rules for Crispy CRM.

## Available Rules

### `no-legacy-tailwind-colors`

Enforces semantic color tokens over legacy Tailwind color classes (e.g., `text-gray-500`, `bg-red-600`).

**Correct:**
```tsx
<div className="text-muted-foreground bg-destructive" />
<span className="border-border" />
```

**Incorrect:**
```tsx
<div className="text-gray-500 bg-red-600" />
<span className="border-amber-200" />
```

## Usage

To enable this rule in `eslint.config.js`:

```javascript
import localRules from "eslint-plugin-local-rules";

export default tseslint.config(
  // ... other config
  {
    plugins: {
      "local-rules": localRules,
    },
    rules: {
      "local-rules/no-legacy-tailwind-colors": "error",
    },
  }
);
```

## Installation

Install `eslint-plugin-local-rules`:

```bash
npm install --save-dev eslint-plugin-local-rules
```

Then create `.eslintplugin.js` in the project root:

```javascript
module.exports = require("./eslint-local-rules/no-legacy-tailwind-colors.js");
```
