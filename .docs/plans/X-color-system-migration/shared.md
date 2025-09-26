# Color System Migration - Architecture Overview

The codebase currently uses a dual color system: a modern OKLCH-based design system with Tailwind CSS v4 for UI components, and an isolated hex-based palette for tags. This migration will unify all color implementations into a single, comprehensive theme-aware system with 42 OKLCH colors, full WCAG AA compliance, and enhanced tag support while preserving data integrity and user experience.

## Relevant Files

### Core Color System
- `/src/index.css`: Main color definitions using OKLCH format, Tailwind theme configuration, and dark mode variables
- `/src/lib/utils.ts`: CSS class merging utility using tailwind-merge and clsx for intelligent class composition
- `/src/components/admin/theme-provider.tsx`: React context provider managing light/dark/system theme switching
- `/src/components/admin/theme-mode-toggle.tsx`: UI control for theme switching

### Component Files
- `/src/components/ui/button.tsx`: Button variants using semantic color tokens (primary, secondary, destructive)
- `/src/components/ui/badge.tsx`: Badge component with four semantic color variants
- `/src/components/ui/alert.tsx`: Alert component with default and destructive color schemes
- `/src/components/ui/card.tsx`: Card containers using semantic background colors
- `/src/components/ui/input.tsx`: Form inputs with validation state colors
- `/src/components/ui/dialog.tsx`: Modal dialogs with theme-aware backgrounds

### Tag System Files (Migration Targets)
- `/src/atomic-crm/tags/colors.ts`: Array of 10 hardcoded hex colors (primary migration target)
- `/src/atomic-crm/tags/TagChip.tsx`: Tag display component using inline styles with forced black text
- `/src/atomic-crm/tags/TagDialog.tsx`: Tag creation/editing modal with color picker
- `/src/atomic-crm/tags/RoundButton.tsx`: Color picker button component
- `/src/atomic-crm/contacts/TagsListEdit.tsx`: Contact tag management using inline styles
- `/src/atomic-crm/tags/TagCreateModal.tsx`: Modal wrapper for tag creation
- `/src/atomic-crm/tags/TagEditModal.tsx`: Modal wrapper for tag editing

### Build Configuration
- `/vite.config.ts`: Vite configuration with Tailwind CSS v4 plugin integration
- `/package.json`: Dependencies including tailwindcss@4.1.11 and related tools
- `/components.json`: Shadcn/ui configuration with CSS variables enabled
- `/tsconfig.json`: TypeScript path aliases configuration

### Files with Hardcoded Colors (Need Updates)
- `/src/atomic-crm/dashboard/DealsChart.tsx`: Chart colors hardcoded
- `/src/atomic-crm/root/defaultConfiguration.ts`: Sales stage colors
- `/src/App.css`: Legacy demo styles with hex colors
- `/index.html`: Theme colors in meta tags
- `/public/manifest.json`: PWA theme colors

## Relevant Tables

- **tags**: Contains `id`, `name`, and `color` (text) columns where hex colors are stored
- **contacts**: Contains `tags` column as `bigint[]` array referencing tag IDs

## Database Migrations
- `/supabase/migrations/20240730075029_init_db.sql`: Initial schema with tags table
- `/supabase/migrations/20240813084010_tags_policy.sql`: RLS policies for tags
- `/supabase/migrations/[new]_migrate_tag_colors.sql`: Will map hex to semantic identifiers
- `/supabase/migrations/[new]_rollback_tag_colors.sql`: Rollback strategy for safety

## Relevant Patterns

### Color System Patterns
**OKLCH Color Format**: All semantic colors use `oklch(lightness% chroma hue)` format for perceptual uniformity. Example: `/src/index.css:41-100`

**CSS Custom Properties**: Dual-layer variable system where Tailwind tokens (`--color-primary`) reference semantic variables (`--primary`). Example: `/src/index.css:139-153`

**Dark Mode Implementation**: Uses `.dark` class on document root with inverted color definitions in CSS. Example: `/src/index.css:101-138`

**Class Variance Authority (CVA)**: Type-safe component variants mapping to color schemes. Example: `/src/components/ui/button.tsx:10-29`

### Component Patterns
**Semantic Color Naming**: Components use semantic tokens (`primary`, `destructive`, `muted`) rather than specific colors. Example: `/src/components/ui/badge.tsx:10-15`

**Focus State Consistency**: All interactive elements use `ring-[3px]` with theme-aware colors. Example: `/src/components/ui/input.tsx:25-26`

**Validation States**: Form components use `aria-invalid` with destructive color scheme. Example: `/src/components/ui/input.tsx:27`

### Migration Patterns
**Inline Style Replacement**: Convert `style={{ backgroundColor: tag.color }}` to CSS classes like `tag-warm`. Example needed in: `/src/atomic-crm/tags/TagChip.tsx:59`

**Color Token Mapping**: Map hex values to semantic identifiers (e.g., `#fae5d3` → `warm`). Pattern for: `/src/atomic-crm/tags/colors.ts`

**Database Migration**: Convert stored hex values to color identifiers while maintaining backward compatibility. Affects: `tags` table `color` column

**Browser Fallback Strategy**: Provide sRGB fallbacks for OKLCH colors to support older browsers (<93% support). Pattern in requirements.md lines 363-384

**WCAG Validation**: All color combinations must pass contrast checks. Use validation scripts from requirements.md lines 518-549

## Relevant Docs

**`/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md`**: You _must_ read this when working on any color system changes, WCAG compliance, or tag color migration.

**`/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/css-color-system.docs.md`**: You _must_ read this when implementing CSS variables, OKLCH colors, or dark mode support.

**`/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/component-color-usage.docs.md`**: You _must_ read this when updating component variants, focus states, or validation colors.

**`/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/tag-system-colors.docs.md`**: You _must_ read this when migrating tag colors, updating TagChip component, or handling database migrations.

**`/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/build-theme-config.docs.md`**: You _must_ read this when working with Tailwind v4 configuration, build tools, or theme provider setup.

## Critical Considerations

### sRGB Gamut Clipping Prevention
High chroma values in OKLCH can exceed sRGB color space causing colors to clip to gray. Brand colors must use reduced chroma values (e.g., 0.12 instead of 0.145) to prevent clipping. This issue was discovered during implementation and all brand colors have been adjusted. See requirements.md lines 926-931.

### OKLCH Format Requirements
Lightness must include `%` unit (e.g., `oklch(55% 0.01 180)` NOT `oklch(0.55 0.01 180)`). Common mistake causing color parsing failures. The percent sign is mandatory for proper rendering. See requirements.md lines 936-945.

### Breaking Changes (Acceptable)
Primary buttons changing from gray to green and tag colors reducing from 10 to 8 are acceptable visual breaking changes. Component APIs and prop names must remain unchanged for backward compatibility. See requirements.md lines 736-758.

### Tag Color Migration Strategy
Existing tags using hex colors need mapping to new semantic identifiers. Database migration script required with backup table for rollback capability. Color migration map: `#fae5d3`→`warm`, `#d3f5e5`→`green`, etc. See requirements.md lines 414-432, 436-493.

### WCAG Compliance Requirements
All interactive elements must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text). Focus indicators require 3:1 contrast against backgrounds. Validation scripts provided. See requirements.md lines 688-715, 518-549.

### Implementation Order (Critical)
1. Core color system updates must happen before tag migration
2. Fix all hardcoded colors before database migration
3. Database migration only after code deployment
4. See requirements.md lines 759-823 for exact sequence