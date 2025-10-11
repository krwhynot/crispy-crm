# Kanban Board Current Implementation Research

**Research Date:** 2025-10-10
**Component Scope:** Opportunity Kanban board in Atomic CRM
**Purpose:** Document existing implementation to design natural enhancements

---

## 1. Existing Kanban Components

### 1.1 OpportunityListContent.tsx
**Path:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`

**Key Features:**
- **Lines 11-56:** Main container component that orchestrates the Kanban board
- **Lines 14-18:** Uses React Admin's `useListContext` for data management
- **Lines 20-23:** Stage filtering based on active filters (multi-select support)
- **Lines 25-41:** Local state management for opportunities grouped by stage
- **Line 46:** Horizontal scrolling container: `className="flex gap-4 overflow-x-auto"`
- **Lines 47-53:** Maps visible stages to OpportunityColumn components

**Current Layout Pattern:**
```tsx
<div className="flex gap-4 overflow-x-auto">
  {visibleStages.map((stage) => (
    <OpportunityColumn stage={stage.value} opportunities={...} />
  ))}
</div>
```

**Design Notes:**
- Clean horizontal flexbox layout with 1rem (16px) gap between columns
- Supports horizontal scrolling for many stages
- Dynamic stage visibility based on filter state
- No background styling on container (transparent)

---

### 1.2 OpportunityColumn.tsx
**Path:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`

**Key Features:**
- **Lines 5-29:** Column component representing a single pipeline stage
- **Line 13:** Column dimensions: `className="flex-1 pb-8 min-w-[160px] max-w-[220px]"`
- **Lines 15-17:** Stage header with centered label
- **Line 19:** Card container: `className="flex flex-col rounded-2xl mt-2 gap-2"`
- **Lines 20-25:** Maps opportunities to OpportunityCard components

**Current Styling:**
```tsx
// Column wrapper
<div className="flex-1 pb-8 min-w-[160px] max-w-[220px]">
  {/* Stage header */}
  <h3 className="text-base font-medium">
    {getOpportunityStageLabel(stage)}
  </h3>

  {/* Cards container */}
  <div className="flex flex-col rounded-2xl mt-2 gap-2">
    {/* OpportunityCard components */}
  </div>
</div>
```

**Design Notes:**
- Flexible width columns (160px min, 220px max)
- Padding bottom for scroll area
- `rounded-2xl` (16px border radius) on card container
- 0.5rem (8px) gap between cards
- No background color (transparent)
- No visual differentiation by stage currently
- Simple, minimalist header without decorative elements

---

### 1.3 OpportunityCard.tsx
**Path:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx`

**Key Features:**
- **Lines 18-96:** Card component displaying individual opportunity
- **Lines 59-65:** Interactive wrapper with click and keyboard handlers
- **Line 66:** Card styling: `className="py-2 transition-all duration-200 shadow-sm hover:shadow-md"`
- **Lines 68-75:** Organization avatar (16x16px)
- **Lines 76-91:** Content area with name, priority badge, and principal indicator

**Current Styling Breakdown:**
```tsx
// Interactive wrapper
<div className="cursor-pointer" onClick={...} role="button" tabIndex={0}>
  {/* Card with hover effects */}
  <Card className="py-2 transition-all duration-200 shadow-sm hover:shadow-md">
    <CardContent className="px-3 flex">
      {/* Avatar */}
      <OrganizationAvatar width={16} height={16} />

      {/* Content */}
      <div className="ml-2 flex-1">
        {/* Name and priority */}
        <div className="flex justify-between items-start mb-1">
          <p className="text-xs font-medium line-clamp-2">{name}</p>
          <Badge variant={getPriorityVariant(priority)} className="...">
            {priority}
          </Badge>
        </div>

        {/* Principal indicator */}
        {principal_organization_id && (
          <Badge variant="outline" className="text-xs px-1 py-0">
            Principal
          </Badge>
        )}
      </div>
    </CardContent>
  </Card>
</div>
```

**Interactive States:**
- **Default:** `shadow-sm` (subtle shadow)
- **Hover:** `shadow-md` (elevated shadow)
- **Transition:** `duration-200` (200ms smooth transition)
- **All properties:** `transition-all` (comprehensive animation)

**Priority Badge Mapping (Lines 43-56):**
- `critical` → `destructive` variant (red)
- `high` → `default` variant (dark/primary)
- `medium` → `secondary` variant (light gray)
- `low` → `outline` variant (bordered)

**Design Notes:**
- Compact vertical padding (py-2 = 0.5rem)
- Tight horizontal padding (px-3 = 0.75rem)
- Small avatar (16x16px) to maximize text space
- Two-line name truncation with `line-clamp-2`
- Badge-driven visual hierarchy
- Clean, data-dense design optimized for scanning

---

### 1.4 Supporting Files

#### stages.ts
**Path:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`

**Key Features:**
- **Lines 5-45:** Logic for grouping opportunities by stage
- **Lines 20-32:** Initializes empty arrays for each stage
- **Lines 34-42:** Sorts opportunities by index within each stage

**Design Notes:**
- Index-based ordering within columns
- Stage-based grouping logic
- Empty state handling

---

## 2. Current Styling Patterns

### 2.1 Semantic Color System

#### CSS Variables Location
**Path:** `/home/krwhynot/Projects/atomic/src/index.css`

#### Foundation Colors (Lines 44-69)
```css
:root {
  /* Surfaces */
  --background: oklch(1 0 0);              /* Pure white */
  --foreground: oklch(0.145 0 0);          /* Near black */
  --card: oklch(1 0 0);                    /* White card surface */
  --card-foreground: oklch(0.145 0 0);     /* Black text on cards */

  /* Interactive - GRAYSCALE ONLY */
  --primary: oklch(0.205 0 0);             /* Very dark gray */
  --primary-foreground: oklch(0.985 0 0);  /* Near white */
  --secondary: oklch(0.97 0 0);            /* Light gray */
  --secondary-foreground: oklch(0.205 0 0);/* Dark gray */
  --muted: oklch(0.97 0 0);                /* Light gray surfaces */
  --muted-foreground: oklch(0.52 0 0);     /* Medium gray text */
  --accent: oklch(0.97 0 0);               /* Light gray accents/hovers */
  --accent-foreground: oklch(0.205 0 0);   /* Dark gray */
  --destructive: oklch(0.577 0.245 27.325);/* Red for errors */

  /* Borders */
  --border: oklch(0.922 0 0);              /* Light gray borders */
  --input: oklch(0.922 0 0);               /* Input borders */
  --ring: oklch(0.60 0 0);                 /* Focus ring */
}
```

#### State Colors (Lines 71-109)
```css
:root {
  /* Success (green) */
  --success-subtle: oklch(90% 0.06 145);
  --success-default: oklch(63% 0.14 145);
  --success-strong: oklch(50% 0.15 145);
  --success-bg: oklch(95% 0.04 145);
  --success-border: oklch(80% 0.08 145);
  --success-hover: oklch(68% 0.13 145);

  /* Warning (orange/yellow) */
  --warning-subtle: oklch(95% 0.08 85);
  --warning-default: oklch(70% 0.145 85);
  --warning-strong: oklch(55% 0.15 85);
  --warning-bg: oklch(97% 0.05 85);
  --warning-border: oklch(85% 0.1 85);

  /* Info (blue) */
  --info-subtle: oklch(92% 0.08 230);
  --info-default: oklch(60% 0.145 230);
  --info-strong: oklch(50% 0.15 230);
  --info-bg: oklch(96% 0.04 230);
  --info-border: oklch(82% 0.1 230);

  /* Error (red) */
  --error-subtle: oklch(93% 0.09 25);
  --error-default: oklch(60% 0.145 25);
  --error-strong: oklch(50% 0.15 25);
  --error-bg: oklch(96% 0.05 25);
  --error-border: oklch(83% 0.11 25);
}
```

#### Tag Colors (Lines 111-127)
```css
:root {
  --tag-warm-bg: oklch(92.1% 0.041 69.5);
  --tag-green-bg: oklch(95% 0.023 149.3);
  --tag-teal-bg: oklch(94.2% 0.023 196.7);
  --tag-blue-bg: oklch(92.9% 0.033 265.6);
  --tag-purple-bg: oklch(93.8% 0.034 294.6);
  --tag-yellow-bg: oklch(98.1% 0.026 108.8);
  --tag-gray-bg: oklch(94.7% 0 0);
  --tag-pink-bg: oklch(93.5% 0.043 350.2);

  /* Corresponding foregrounds */
  --tag-*-fg: oklch(20% 0.02 [hue]);
}
```

#### Dark Mode Support (Lines 156-257)
- Complete dark mode variable overrides
- Maintains same semantic naming
- Inverted lightness values
- Consistent color relationships

**Constitution Rule #8:** NEVER use hex codes. Always use semantic CSS variables.

---

### 2.2 Shadow and Elevation Patterns

#### Current Usage
**OpportunityCard.tsx (Line 66):**
```tsx
className="shadow-sm hover:shadow-md"
```

**Tailwind Shadow Scale:**
- `shadow-sm` - Subtle: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `shadow` - Default: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`
- `shadow-md` - Medium: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- `shadow-lg` - Large: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- `shadow-xl` - Extra large: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`

#### Button Shadows
**button.tsx (Lines 13, 15, 17, 19):**
```tsx
shadow-xs  // Used for buttons: smaller than shadow-sm
```

#### Current Pattern Analysis
- **Resting state:** Very subtle shadow (shadow-sm)
- **Hover state:** Moderate elevation (shadow-md)
- **Transition:** Smooth 200ms animation
- **No shadow-lg or shadow-xl used anywhere** - opportunity for differentiation

**Design Philosophy:**
- Subtle by default
- Elevation indicates interactivity
- Smooth transitions for polish
- No dramatic shadows (keeps interface clean)

---

### 2.3 Border Radius Patterns

#### Current Usage in Kanban

**OpportunityColumn.tsx (Line 19):**
```tsx
className="flex flex-col rounded-2xl mt-2 gap-2"
// rounded-2xl = 16px border radius
```

**Card Component (card.tsx Line 10):**
```tsx
className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6"
// rounded-xl = 12px border radius (default shadcn/ui)
```

**OpportunityCard.tsx:**
- Inherits `rounded-xl` from shadcn/ui Card component
- No override specified

**Global Radius Configuration (index.css Lines 7-11, 45):**
```css
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);  /* 6px */
  --radius-md: calc(var(--radius) - 2px);  /* 8px */
  --radius-lg: var(--radius);              /* 10px */
  --radius-xl: calc(var(--radius) + 4px);  /* 14px */
}

:root {
  --radius: 0.625rem;  /* 10px base */
}
```

**Radius Scale Analysis:**
- Base radius: **10px**
- Small: **6px**
- Medium: **8px**
- Large: **10px** (same as base)
- Extra large: **14px**

**Tailwind Radius Classes:**
- `rounded-sm` - 2px
- `rounded` - 4px
- `rounded-md` - 6px
- `rounded-lg` - 8px
- `rounded-xl` - 12px ✓ **Used on cards**
- `rounded-2xl` - 16px ✓ **Used on column container**
- `rounded-3xl` - 24px
- `rounded-full` - 9999px (used for avatars)

**Pattern:**
- Larger containers → Larger radius (2xl for column)
- Smaller components → Smaller radius (xl for cards)
- Consistent hierarchy

---

### 2.4 Spacing and Layout Patterns

#### Gap Patterns
```tsx
// Column container (OpportunityListContent.tsx)
gap-4     // 1rem (16px) between columns

// Card container within column (OpportunityColumn.tsx)
gap-2     // 0.5rem (8px) between cards

// Card content (OpportunityCard.tsx)
ml-2      // 0.5rem (8px) avatar margin
mb-1      // 0.25rem (4px) vertical spacing
```

#### Padding Patterns
```tsx
// Column (OpportunityColumn.tsx)
pb-8      // 2rem (32px) bottom padding for scroll

// Card (OpportunityCard.tsx)
py-2      // 0.5rem (8px) vertical
px-3      // 0.75rem (12px) horizontal

// shadcn/ui Card default (card.tsx)
py-6      // 1.5rem (24px) vertical
px-6      // 1.5rem (24px) horizontal
```

**Overrides:**
- OpportunityCard uses tighter spacing than default Card
- Optimized for data density in Kanban view
- More breathing room in detail views

#### Width Constraints
```tsx
// Column (OpportunityColumn.tsx)
min-w-[160px]   // Minimum column width
max-w-[220px]   // Maximum column width
flex-1          // Flexible sizing between min/max
```

**Responsive Behavior:**
- Columns shrink/grow within bounds
- Horizontal scroll when total width exceeds container
- No responsive breakpoints (horizontal scroll handles all cases)

---

### 2.5 Typography Patterns

#### Current Usage in Kanban

**Column Header (OpportunityColumn.tsx Line 15):**
```tsx
<h3 className="text-base font-medium">
// text-base = 16px (1rem)
// font-medium = 500 weight
```

**Card Title (OpportunityCard.tsx Line 78):**
```tsx
<p className="text-xs font-medium line-clamp-2">
// text-xs = 12px (0.75rem)
// line-clamp-2 = max 2 lines with ellipsis
```

**Badge Text (OpportunityCard.tsx Lines 81, 87):**
```tsx
className="text-xs px-1 py-0"
// text-xs = 12px
// Minimal padding for compactness
```

**Tailwind Text Scale:**
- `text-xs` - 12px / 0.75rem ✓ **Used for cards/badges**
- `text-sm` - 14px / 0.875rem
- `text-base` - 16px / 1rem ✓ **Used for column headers**
- `text-lg` - 18px / 1.125rem
- `text-xl` - 20px / 1.25rem
- `text-2xl` - 24px / 1.5rem

**Font Weights:**
- `font-normal` - 400
- `font-medium` - 500 ✓ **Primary weight used**
- `font-semibold` - 600
- `font-bold` - 700

**Pattern:**
- Consistent use of `font-medium` for emphasis
- `text-xs` for compact data display
- `text-base` for section headers
- No heavy weights (600+) in Kanban

---

### 2.6 Transition and Animation Patterns

#### OpportunityCard Transitions (Line 66)
```tsx
className="transition-all duration-200 shadow-sm hover:shadow-md"
```

**Breakdown:**
- `transition-all` - Animates all CSS properties
- `duration-200` - 200ms transition time
- Affects: shadow, transform, opacity, etc.

#### Button Transitions (button.tsx Line 8)
```tsx
className="... transition-all ..."
// No explicit duration = uses Tailwind default (150ms)
```

#### Badge Transitions (badge.tsx Line 8)
```tsx
className="... transition-[color,box-shadow] ..."
// Specific properties: color and box-shadow only
```

**Transition Duration Scale:**
- Default (no class): 150ms
- `duration-75`: 75ms
- `duration-100`: 100ms
- `duration-150`: 150ms
- `duration-200`: 200ms ✓ **Used for cards**
- `duration-300`: 300ms
- `duration-500`: 500ms

**Current Pattern:**
- Subtle, fast transitions (150-200ms)
- Specific properties for performance (badge)
- `transition-all` when multiple properties change together (card)

#### CSS Animations Available
**index.css imports tw-animate-css (Line 2):**
```css
@import "tw-animate-css";
```

**Package:** `tw-animate-css@1.3.8` (from package.json)

Available animations include:
- Fade: `animate-fade-in`, `animate-fade-out`
- Slide: `animate-slide-in-up`, `animate-slide-in-down`, etc.
- Scale: `animate-scale-in`, `animate-scale-out`
- Bounce: `animate-bounce`
- Pulse: `animate-pulse`
- Spin: `animate-spin`

**Current Usage:** None in Kanban components (opportunity for enhancement)

---

### 2.7 Interactive State Patterns

#### Hover States

**OpportunityCard (Lines 60, 66):**
```tsx
// Container
className="cursor-pointer"

// Card
className="... hover:shadow-md"
```

**FilterChip (Line 21):**
```tsx
className="... hover:bg-muted/80"
// Opacity-based hover (80% = slightly transparent)
```

**Button (button.tsx Lines 13-22):**
```tsx
// Default variant
hover:bg-primary/90  // 90% opacity

// Outline variant
hover:bg-accent hover:text-accent-foreground

// Ghost variant
hover:bg-accent hover:text-accent-foreground
```

**Pattern Analysis:**
- Shadow elevation for clickable surfaces (cards)
- Background color change for buttons/chips
- Opacity modulation (90%, 80%) for subtle effects
- Semantic variables maintained in hover states

#### Focus States

**Button (button.tsx Line 8):**
```tsx
focus-visible:border-ring
focus-visible:ring-ring/50
focus-visible:ring-[3px]
```

**Badge (badge.tsx Line 8):**
```tsx
focus-visible:border-ring
focus-visible:ring-ring/50
focus-visible:ring-[3px]
```

**Focus Pattern:**
- 3px ring with 50% opacity
- Uses semantic `--ring` color
- `focus-visible` (not `focus`) for keyboard-only
- Consistent across interactive components

#### Keyboard Accessibility

**OpportunityCard (Lines 36-41):**
```tsx
const handleKeyDown = (event: React.KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleClick();
  }
};

// Applied to wrapper
onKeyDown={handleKeyDown}
role="button"
tabIndex={0}
```

**Pattern:**
- Full keyboard navigation support
- Enter and Space key activation
- Proper ARIA roles
- Tab indexing for focus management

#### Disabled States

**Button (button.tsx Line 8):**
```tsx
disabled:pointer-events-none
disabled:opacity-50
```

**Current Pattern:**
- 50% opacity for disabled state
- Pointer events disabled
- No custom disabled styling for Kanban cards (not applicable)

---

## 3. Stage System

### 3.1 Stage Configuration

**Path:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`

#### Stage Definition Interface (Lines 6-11)
```typescript
export interface OpportunityStage {
  value: string;
  label: string;
  color: string;
  description: string;
}
```

#### Stage Type (Lines 13-21)
```typescript
export type OpportunityStageValue =
  | "new_lead"
  | "initial_outreach"
  | "sample_visit_offered"
  | "awaiting_response"
  | "feedback_logged"
  | "demo_scheduled"
  | "closed_won"
  | "closed_lost";
```

#### Stage Definitions (Lines 23-72)

| Stage | Label | Color Variable | Description |
|-------|-------|---------------|-------------|
| `new_lead` | New Lead | `var(--info-subtle)` | Initial prospect identification |
| `initial_outreach` | Initial Outreach | `var(--tag-teal-bg)` | First contact and follow-up |
| `sample_visit_offered` | Sample/Visit Offered | `var(--warning-subtle)` | Product sampling and visit scheduling |
| `awaiting_response` | Awaiting Response | `var(--purple)` | Following up after sample delivery |
| `feedback_logged` | Feedback Logged | `var(--blue)` | Recording customer feedback |
| `demo_scheduled` | Demo Scheduled | `var(--success-subtle)` | Planning product demonstrations |
| `closed_won` | Closed - Won | `var(--success-strong)` | Successful deal completion |
| `closed_lost` | Closed - Lost | `var(--error-subtle)` | Lost opportunity |

**Color Variable Analysis:**

**Semantic Colors Used:**
- `--info-subtle` (blue, light): Early stage indicator
- `--tag-teal-bg`: Mid-pipeline, active engagement
- `--warning-subtle` (orange, light): Attention needed
- `--success-subtle` (green, light): Positive progress
- `--success-strong` (green, dark): Success state
- `--error-subtle` (red, light): Negative outcome

**Non-standard Colors:**
- `--purple`: Not defined in CSS (Lines 24-257 of index.css)
- `--blue`: Not defined in CSS

**Issues Identified:**
1. `--purple` and `--blue` referenced but not defined in `:root`
2. Should be: `--tag-purple-bg` and `--tag-blue-bg` (which ARE defined)
3. Constitution violation: inconsistent variable usage

**Corrected Mapping Recommendation:**
```typescript
"awaiting_response" → "var(--tag-purple-bg)"  // Instead of var(--purple)
"feedback_logged" → "var(--tag-blue-bg)"      // Instead of var(--blue)
```

---

### 3.2 Stage Helper Functions

#### getOpportunityStageLabel (Lines 75-78)
```typescript
export function getOpportunityStageLabel(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.label || stageValue;
}
```
**Used in:** OpportunityColumn.tsx (Line 16)

#### getOpportunityStageColor (Lines 80-83)
```typescript
export function getOpportunityStageColor(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.color || "var(--muted)";
}
```
**Current usage:** Not used in Kanban components (opportunity for enhancement)

#### isActiveStage / isClosedStage (Lines 90-96)
```typescript
export function isActiveStage(stageValue: string): boolean {
  return !["closed_won", "closed_lost"].includes(stageValue);
}

export function isClosedStage(stageValue: string): boolean {
  return ["closed_won", "closed_lost"].includes(stageValue);
}
```
**Current usage:** Not used in Kanban components (opportunity for differentiation)

---

### 3.3 Stage Visual Differentiation

**Current State:** NO visual differentiation by stage in Kanban

**Evidence:**
- OpportunityColumn.tsx: No background color applied
- OpportunityCard.tsx: No stage-based styling
- `getOpportunityStageColor()` function exists but unused
- All columns look identical regardless of stage

**Opportunities:**
1. Column header background colors (using stage colors)
2. Column border colors
3. Card accent colors (left border, top border, etc.)
4. Stage-based icons or indicators
5. Different shadow intensities by stage
6. Opacity/saturation differences for closed stages

---

## 4. Design System Integration

### 4.1 shadcn/ui Components Used

#### Card Component
**Path:** `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx`

**Structure (Lines 5-82):**
```typescript
Card              // Root container (lines 5-16)
├─ CardHeader     // Header section (18-29)
├─ CardTitle      // Title (31-39)
├─ CardDescription // Subtitle (41-49)
├─ CardAction     // Actions (51-62)
├─ CardContent    // Main content (64-72) ✓ Used
└─ CardFooter     // Footer (74-82)
```

**Default Card Styling (Line 10-12):**
```tsx
className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6"
```

**OpportunityCard Override (OpportunityCard.tsx Line 66):**
```tsx
className="py-2 transition-all duration-200 shadow-sm hover:shadow-md"
// Overrides: py-6 → py-2 (tighter)
// Adds: transition, shadow, hover
// Keeps: bg-card, text-card-foreground, rounded-xl, border
```

**CardContent Default (card.tsx Line 68):**
```tsx
className="px-6"
```

**OpportunityCard Override (Line 67):**
```tsx
className="px-3 flex"
// Overrides: px-6 → px-3 (tighter)
// Adds: flex (for avatar + content layout)
```

---

#### Badge Component
**Path:** `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx`

**Variants (Lines 7-26):**
```tsx
badgeVariants = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-white",
  outline: "text-foreground [a&]:hover:bg-accent"
}
```

**Usage in OpportunityCard:**
1. **Priority Badge (Lines 79-84):**
   ```tsx
   <Badge variant={getPriorityVariant(priority)}>
     {priority}
   </Badge>
   ```
   Variants:
   - `critical` → `destructive` (red background)
   - `high` → `default` (dark background)
   - `medium` → `secondary` (light gray)
   - `low` → `outline` (bordered only)

2. **Principal Indicator (Lines 87-90):**
   ```tsx
   <Badge variant="outline" className="text-xs px-1 py-0">
     Principal
   </Badge>
   ```

**Design Pattern:**
- Semantic variant selection based on data
- Consistent color language (destruction = urgent/negative)
- Outline variant for informational labels
- Size customization via className

---

#### Avatar Component
**Path:** `/home/krwhynot/Projects/atomic/src/components/ui/avatar.tsx`

**Structure (Lines 6-51):**
```typescript
Avatar              // Root container (6-20)
├─ AvatarImage     // Image element (22-33)
└─ AvatarFallback  // Fallback text (35-49)
```

**Default Styling (Lines 13-16):**
```tsx
className="relative flex size-8 shrink-0 overflow-hidden rounded-full"
// size-8 = 32x32px (2rem)
// rounded-full = perfect circle
```

**OrganizationAvatar Custom (OrganizationAvatar.tsx Line 15):**
```tsx
const sizeClass = width !== 40 ? `w-[20px] h-[20px]` : "w-10 h-10";
// Default: 40x40px (w-10)
// Kanban: 20x20px (custom)
```

**OpportunityCard Usage (Line 74):**
```tsx
<OrganizationAvatar width={16} height={16} />
// Even smaller: 16x16px for maximum compactness
```

**Fallback Styling (avatar.tsx Lines 42-45):**
```tsx
className="bg-muted flex size-full items-center justify-center rounded-full"
```

**Design Pattern:**
- Flexible sizing via props
- Graceful fallback to initials
- Circular shape for brand identity
- Muted background for fallback consistency

---

### 4.2 Tailwind CSS 4 Conventions

#### Configuration
**Path:** `/home/krwhynot/Projects/atomic/src/index.css`

**Tailwind 4 Setup (Lines 1-3):**
```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));
```

**Theme Inline Configuration (Lines 6-42):**
```css
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  /* ... color mappings ... */
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* ... etc ... */
}
```

**Key Differences from Tailwind 3:**
1. `@import "tailwindcss"` instead of `@tailwind` directives
2. `@theme inline` for theme customization
3. `@custom-variant` for variant creation
4. CSS variables for color system integration

---

#### Utility Class Patterns

**Layout:**
```tsx
flex flex-col flex-row flex-1
grid grid-cols-2
gap-2 gap-4 gap-8
items-center items-start justify-between
```

**Sizing:**
```tsx
w-full min-w-[160px] max-w-[220px]
h-full size-8 size-full
```

**Spacing:**
```tsx
px-3 py-2 pb-8 ml-2 mb-1 mt-2
space-x-2  // gap between children
```

**Typography:**
```tsx
text-xs text-sm text-base text-2xl
font-medium font-semibold
line-clamp-2
truncate
```

**Colors:**
```tsx
bg-card bg-muted bg-primary
text-foreground text-muted-foreground
border border-border
```

**Effects:**
```tsx
shadow-sm shadow-md
rounded-xl rounded-2xl rounded-full
transition-all duration-200
hover:shadow-md hover:bg-muted/80
```

**Interactive:**
```tsx
cursor-pointer
focus-visible:ring-ring/50
```

**Responsive (not used in Kanban):**
```tsx
sm:grid-cols-2 md:grid-cols-3
// Seen in OpportunityArchivedList.tsx
```

---

#### Class Ordering Convention

**Observed Pattern (from codebase):**
1. Layout: `flex`, `grid`, `flex-col`
2. Sizing: `w-full`, `h-10`
3. Spacing: `gap-4`, `px-3`, `py-2`
4. Typography: `text-xs`, `font-medium`
5. Colors: `bg-card`, `text-foreground`
6. Borders: `border`, `rounded-xl`
7. Effects: `shadow-sm`, `transition-all`
8. Interactive: `hover:shadow-md`

**Enforced by:** ESLint plugin `eslint-plugin-tailwindcss@4.0.0-beta.0` (package.json)

---

### 4.3 Component Architecture Patterns

#### Three-Tier System (from CLAUDE.md)

**Tier 1: Base Components** (`src/components/ui/`)
- Primitive shadcn/ui components
- Example: Card, Badge, Avatar, Button
- No business logic
- Highly reusable

**Tier 2: Admin Layer** (`src/components/admin/`)
- React Admin integration
- Example: ReferenceField, CreateButton, List
- Provides data context
- Handles CRUD operations

**Tier 3: Feature Components** (`src/atomic-crm/`)
- Business logic and domain models
- Example: OpportunityCard, OpportunityColumn
- Combines Tier 1 + Tier 2
- Feature-specific behavior

**Kanban Implementation Example:**
```
OpportunityCard (Tier 3)
├─ Card (Tier 1)
│  └─ CardContent (Tier 1)
├─ Badge (Tier 1) × 2
├─ ReferenceField (Tier 2)
│  └─ OrganizationAvatar (Tier 3)
│     └─ Avatar (Tier 1)
```

**Pattern Benefits:**
- Clear separation of concerns
- Easy to test individual tiers
- Reusable base components
- Domain logic isolated to Tier 3

---

#### Composition Over Inheritance

**Example: OpportunityCard (Lines 8-16):**
```tsx
export const OpportunityCard = ({ opportunity }) => {
  if (!opportunity) return null;
  return <OpportunityCardContent opportunity={opportunity} />;
};

export const OpportunityCardContent = ({ opportunity }) => {
  // Implementation
};
```

**Pattern:**
- Small wrapper for null check
- Actual implementation in separate component
- Easy to unit test content independently
- Follows React composition patterns

---

#### Data Provider Pattern

**OpportunityListContent.tsx (Lines 14-18):**
```tsx
const {
  data: unorderedOpportunities,
  isPending,
  filterValues,
} = useListContext<Opportunity>();
```

**Pattern:**
- React Admin provides data context
- No direct API calls in UI components
- Automatic refetch on filter changes
- Loading states handled by provider

**Related Files:**
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (per CLAUDE.md)
- Zod validation at API boundary
- All CRUD through single provider
- Transformation logic centralized

---

## 5. Key Findings and Opportunities

### 5.1 Current Strengths

1. **Clean, Minimal Design**
   - Low visual noise
   - Data-dense without feeling cramped
   - Consistent spacing and typography

2. **Solid Interactive Foundation**
   - Smooth transitions (200ms)
   - Keyboard accessibility
   - Hover states on all interactive elements

3. **Semantic Color System**
   - Well-defined CSS variables
   - Dark mode support
   - Comprehensive state colors (success, warning, info, error)

4. **Flexible Stage System**
   - Type-safe stage definitions
   - Helper functions ready for use
   - Clear closed vs. active stage logic

5. **Component Architecture**
   - Three-tier system working well
   - Clean separation of concerns
   - Easy to extend

---

### 5.2 Enhancement Opportunities

#### Immediate (Low Effort, High Impact)

1. **Stage Visual Differentiation**
   - **Issue:** All columns look identical
   - **Opportunity:** Use existing `getOpportunityStageColor()` function
   - **Implementation:** Column header background colors
   - **Files:** OpportunityColumn.tsx

2. **Fix Color Variable Issues**
   - **Issue:** `--purple` and `--blue` not defined
   - **Fix:** Use `--tag-purple-bg` and `--tag-blue-bg`
   - **Files:** stageConstants.ts (Lines 45, 50)

3. **Closed Stage Differentiation**
   - **Issue:** Closed opportunities look active
   - **Opportunity:** Use `isClosedStage()` helper
   - **Implementation:** Reduced opacity or different styling
   - **Files:** OpportunityCard.tsx, OpportunityColumn.tsx

---

#### Medium (Moderate Effort, High Value)

4. **Column Background Treatments**
   - **Current:** Transparent background
   - **Opportunity:** Subtle background color per stage
   - **Approach:** Use stage color at 5-10% opacity for column container
   - **Example:** `bg-[color-from-stage]/5`

5. **Card Stage Indicators**
   - **Current:** No visual tie to stage
   - **Opportunity:** Left border accent in stage color
   - **Implementation:** `border-l-4 border-[color-from-stage]`
   - **Preserves:** Compact design, adds context

6. **Enhanced Hover States**
   - **Current:** Shadow elevation only
   - **Opportunity:** Combine shadow + slight scale
   - **Implementation:** `hover:scale-[1.02]`
   - **Transition:** Already using `transition-all`

---

#### Advanced (Higher Effort, Polish)

7. **Glassmorphism Effects**
   - **Current:** No backdrop blur anywhere
   - **Opportunity:** Subtle glass effect on columns
   - **Implementation:** `backdrop-blur-sm bg-white/80`
   - **Use Case:** When overlaying busy backgrounds

8. **Stage Transition Animations**
   - **Current:** No animations between stages
   - **Opportunity:** Smooth card movement when dragged (future DnD)
   - **Package:** tw-animate-css already available
   - **Example:** `animate-slide-in-up` when card added

9. **Loading States**
   - **Current:** Basic loading with `isPending` check
   - **Opportunity:** Skeleton cards with shimmer
   - **Variables:** `--loading-shimmer`, `--loading-skeleton` defined
   - **Implementation:** Skeleton Card component

10. **Empty Column States**
    - **Current:** Empty column shows nothing
    - **Opportunity:** Dashed border, "Drop here" messaging
    - **Use Case:** Visual feedback for drag-and-drop

---

### 5.3 Constitution Compliance

**Verified Compliance:**
- ✓ No hex codes used (Rule #8)
- ✓ Semantic CSS variables throughout
- ✓ Three-tier architecture followed
- ✓ shadcn/ui base components used
- ✓ Tailwind CSS conventions consistent

**Issues to Address:**
- ✗ Undefined color variables in stageConstants.ts (Rule #8 violation)
  - `var(--purple)` should be `var(--tag-purple-bg)`
  - `var(--blue)` should be `var(--tag-blue-bg)`

**Recommendations:**
1. Fix color variables before any visual enhancements
2. All new enhancements must use semantic variables
3. Test dark mode for all changes
4. Follow existing pattern: subtle by default, elevation on interaction

---

## 6. Technical Specifications

### 6.1 File Structure
```
src/atomic-crm/opportunities/
├── OpportunityList.tsx          # Parent container, filters, actions
├── OpportunityListContent.tsx   # Kanban orchestrator
├── OpportunityColumn.tsx        # Stage column
├── OpportunityCard.tsx          # Individual opportunity card
├── stageConstants.ts            # Stage definitions & colors
└── stages.ts                    # Stage grouping logic
```

### 6.2 Data Flow
```
OpportunityList (React Admin <List>)
  ↓ (useListContext)
OpportunityListContent
  ↓ (getOpportunitiesByStage)
OpportunityColumn (per stage)
  ↓ (map opportunities)
OpportunityCard (per opportunity)
```

### 6.3 Dependencies
```json
{
  "tailwindcss": "^4.1.11",
  "@tailwindcss/vite": "^4.1.11",
  "tw-animate-css": "^1.3.8",
  "class-variance-authority": "^0.7.1",
  "tailwind-merge": "^3.3.1",
  "@radix-ui/*": "Various shadcn/ui dependencies"
}
```

### 6.4 Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Variables required
- `oklch()` color space (cutting edge, fallbacks needed?)
- No IE11 support (Tailwind 4 requirement)

---

## 7. Next Steps for Enhancement

### Phase 1: Foundation Fixes (Day 1)
1. Fix undefined color variables in stageConstants.ts
2. Add stage color to column headers
3. Apply closed stage opacity to cards
4. Test dark mode compatibility

### Phase 2: Visual Polish (Day 2-3)
5. Add column background treatments
6. Implement card stage indicators (left border)
7. Enhance hover states with subtle scale
8. Add stage-specific shadows

### Phase 3: Advanced Features (Week 2)
9. Implement loading skeletons
10. Add empty column states
11. Consider glassmorphism for future overlays
12. Plan for drag-and-drop transitions (future epic)

### Testing Checklist
- [ ] Light mode visual consistency
- [ ] Dark mode visual consistency
- [ ] Keyboard navigation preserved
- [ ] Screen reader compatibility
- [ ] Performance (60fps animations)
- [ ] Mobile/tablet responsive behavior
- [ ] Filter interaction (stage visibility)
- [ ] Constitution compliance verified

---

## 8. References

### Code Files Analyzed
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`
- `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/avatar.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/button.tsx`
- `/home/krwhynot/Projects/atomic/src/index.css`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts`

### Documentation References
- `/home/krwhynot/Projects/atomic/CLAUDE.md` (Engineering Constitution)
- Tailwind CSS 4.x documentation
- shadcn/ui component library
- React Admin 5.x documentation

---

**Research Complete:** 2025-10-10
**Next Action:** Review findings and prioritize enhancement implementation
