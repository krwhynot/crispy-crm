# Build System and Theme Configuration Research

Research findings on the build system architecture, Tailwind CSS configuration, and theme management setup that affects color system implementation.

## Relevant Files
- `/package.json`: Project dependencies and build scripts
- `/vite.config.ts`: Main Vite configuration with Tailwind plugin
- `/src/index.css`: CSS-first Tailwind configuration with inline theme
- `/components.json`: Shadcn/ui configuration for component generation
- `/src/lib/utils.ts`: Utility functions for CSS class merging
- `/src/components/admin/theme-provider.tsx`: React theme context provider
- `/src/atomic-crm/tags/colors.ts`: Hardcoded color palette array
- `/tsconfig.json`: TypeScript configuration with path aliases

## Architectural Patterns

### **Tailwind CSS v4 CSS-First Configuration**
- **Version**: `tailwindcss@4.1.11` with `@tailwindcss/vite@4.1.11`
- **Configuration Style**: CSS-first using `@theme inline` syntax in `/src/index.css`
- **No separate config file**: Configuration embedded directly in CSS using new v4 syntax
- **Native Vite integration**: Uses official `@tailwindcss/vite` plugin for optimal build performance

### **OKLCH Color Space Implementation**
- **Color Format**: All theme colors defined using `oklch()` notation
- **CSS Custom Properties**: Colors stored as CSS variables (e.g., `--background`, `--primary`)
- **Theme Mapping**: CSS variables mapped to Tailwind color tokens via `@theme inline` block
- **Dual Theme Support**: Light and dark themes with separate color definitions

### **Theme Management Architecture**
- **Provider Pattern**: Custom React context in `/src/components/admin/theme-provider.tsx`
- **Storage Integration**: Uses `ra-core` store for theme persistence
- **System Theme Detection**: Automatic dark mode detection via `prefers-color-scheme`
- **CSS Class Strategy**: Applies `.dark` class to document root for theme switching

### **CSS Processing Pipeline**
```
index.css → @import "tailwindcss" → Vite Plugin → PostCSS → Optimized CSS
```
- **Entry Point**: `/src/index.css` imports Tailwind base
- **Additional Libraries**: `tw-animate-css` for animations
- **Build Tool**: Vite with native Tailwind v4 plugin integration
- **No PostCSS Config**: Tailwind v4 handles processing internally

### **Utility Libraries Stack**
- **`tailwind-merge@3.3.1`**: Intelligent CSS class merging to resolve conflicts
- **`clsx@2.1.1`**: Conditional CSS class construction utility
- **`class-variance-authority@0.7.1`**: Component variant management system
- **Utility Function**: `cn()` in `/src/lib/utils.ts` combines clsx + tailwind-merge

## Edge Cases & Gotchas

### **Tailwind v4 Breaking Changes**
- **Config Migration Required**: Moving from `tailwind.config.js` to CSS-first configuration
- **Inline Theme Syntax**: Must use `@theme inline` block instead of JavaScript config object
- **No Extend Syntax**: Theme extensions handled differently in v4 CSS configuration
- **Build Tool Dependencies**: Requires `@tailwindcss/vite` plugin, not standard PostCSS setup

### **OKLCH Color Space Considerations**
- **Browser Support**: OKLCH is modern CSS - requires fallbacks for older browsers
- **Color Accuracy**: More perceptually uniform than HSL/RGB but requires color space knowledge
- **Migration Complexity**: Converting existing hex/rgb colors to OKLCH requires careful mapping
- **Alpha Channel**: Uses `/` syntax for opacity (e.g., `oklch(1 0 0 / 15%)`)

### **CSS Custom Property Dependencies**
- **Naming Convention**: Color variables follow `--color-{name}` pattern in theme block
- **Dual Definitions**: Each color requires both light (`:root`) and dark (`.dark`) definitions
- **CSS Variable Mapping**: Theme variables mapped to Tailwind tokens via CSS, not JavaScript
- **Runtime Theme Switching**: Depends on CSS class application, not CSS variable updates

### **Component Library Integration**
- **Shadcn/ui Configuration**: `/components.json` configures component generation
- **CSS Variables Requirement**: `cssVariables: true` required for theme system to work
- **Path Aliases**: TypeScript path mapping in `tsconfig.json` for `@/` imports
- **Component Consistency**: All UI components must use design tokens, not hardcoded colors

### **Build Performance Implications**
- **Vite Plugin**: Native integration provides faster builds than PostCSS chain
- **CSS Bundle Size**: CSS-first configuration can impact bundle splitting
- **Development Mode**: `--force` flag used in dev scripts, suggests cache invalidation needs
- **Production Optimizations**: Build process includes source maps and bundle analysis

## Relevant Docs
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4-beta) - CSS-first configuration guide
- [OKLCH Color Space Specification](https://www.w3.org/TR/css-color-4/#ok-lab) - W3C color space documentation
- [Vite Tailwind Plugin](https://github.com/tailwindlabs/tailwindcss/tree/next/packages/%40tailwindcss-vite) - Official plugin documentation
- [Shadcn/ui Configuration](https://ui.shadcn.com/docs/installation/vite) - Component library setup guide
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) - MDN CSS variables documentation