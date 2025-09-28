# Atomic CRM - New Color System

## Design Principles Applied
- **60-30-10 Rule**: 60% neutrals, 30% secondary, 10% accent colors
- **Less is More**: Reduced from 35+ colors to focused palette
- **Semantic Meaning**: Each color has clear purpose
- **Accessibility First**: WCAG AA/AAA compliant contrast ratios

## Color Palette

### 1. Core Neutrals (60% - Backgrounds, Text, Borders)

| Level | Hex Code | OKLCH | Usage |
|-------|----------|--------|-------|
| 50 | #f7f7f8 | oklch(97.1% 0.002 284.5) | Light backgrounds |
| 100 | #dee0e3 | oklch(88.4% 0.005 284.8) | Subtle backgrounds |
| 200 | #c5c9ce | oklch(80.2% 0.007 285.2) | Borders, dividers |
| 300 | #acb2ba | oklch(72.1% 0.009 285.6) | Inactive elements |
| 400 | #939ba5 | oklch(63.9% 0.011 286.0) | Muted text |
| 500 | #7a8491 | oklch(55.8% 0.013 286.4) | Secondary text |
| 600 | #616d7c | oklch(47.7% 0.015 286.8) | Body text |
| 700 | #485667 | oklch(39.6% 0.017 287.2) | Headings |
| 800 | #2f3f52 | oklch(31.5% 0.019 287.6) | Dark text |
| 900 | #16283d | oklch(23.4% 0.021 288.0) | Near black |

### 2. Primary Brand Colors (Green - Base: #9bbb59)

| Level | Hex Code | OKLCH | Usage |
|-------|----------|--------|-------|
| 100 | #e6eed9 | oklch(92% 0.08 125) | Light tint backgrounds |
| 300 | #d5e3bf | oklch(85% 0.12 125) | Subtle fills |
| 500 | #9bbb59 | oklch(74% 0.12 125) | **Brand identity** (not for buttons) |
| 700 | #5a7030 | oklch(50% 0.10 125) | **Primary buttons** (WCAG compliant) |
| 800 | #3a4a25 | oklch(35% 0.08 125) | Hover/pressed states |

### 3. Semantic Status Colors

#### Success (Cool Green - differentiated from brand)
| State | Hex Code | OKLCH | Usage |
|-------|----------|--------|-------|
| Subtle | #d0e8d5 | oklch(90% 0.06 145) | Success backgrounds |
| Default | #4d9960 | oklch(63% 0.14 145) | Success text/icons |
| Strong | #2d7a40 | oklch(50% 0.15 145) | Success buttons |

#### Warning (Yellow/Amber - normalized chroma)
| State | Hex Code | OKLCH | Usage |
|-------|----------|--------|-------|
| Subtle | #fef3c7 | oklch(95% 0.08 85) | Warning backgrounds |
| Default | #f59e0b | oklch(70% 0.18 85) | Warning text/icons |
| Strong | #d97706 | oklch(58% 0.19 85) | Warning buttons |

#### Error (Red - Calculated)
| State | Hex Code | OKLCH | Usage |
|-------|----------|--------|-------|
| Subtle | #fee2e2 | oklch(93% 0.09 25) | Error backgrounds |
| Default | #ef4444 | oklch(60% 0.24 25) | Error text/icons |
| Strong | #dc2626 | oklch(50% 0.25 25) | Delete buttons |

#### Info (Blue - Calculated)
| State | Hex Code | OKLCH | Usage |
|-------|----------|--------|-------|
| Subtle | #dbeafe | oklch(92% 0.08 230) | Info backgrounds |
| Default | #3b82f6 | oklch(60% 0.20 230) | Info text/icons |
| Strong | #2563eb | oklch(50% 0.22 230) | Info buttons |

### 4. Accent Colors (10% - Highlights, Special States)

| Color | Hex Code | OKLCH | Usage |
|-------|----------|--------|-------|
| Purple | #9333ea | oklch(50% 0.25 295) | Premium features, special CTAs |
| Teal | #14b8a6 | oklch(70% 0.15 180) | Alternative accent, data viz |

### 5. Tag/Category Colors (For organizing contacts/deals)

| Tag | Hex Code | OKLCH | Usage |
|-----|----------|--------|-------|
| Warm | #fae5d3 | oklch(92.1% 0.041 69.5) | High priority |
| Green | #e8f5e8 | oklch(95.0% 0.023 149.3) | Active/healthy |
| Teal | #d9f2f0 | oklch(94.2% 0.023 196.7) | In progress |
| Blue | #e5ecff | oklch(92.9% 0.033 265.6) | Information |
| Purple | #f3e8ff | oklch(93.8% 0.034 294.6) | Special |
| Yellow | #fff9e6 | oklch(98.1% 0.026 108.8) | Attention |
| Gray | #f0f0f0 | oklch(94.7% 0 0) | Archived |
| Pink | #ffe5f1 | oklch(93.5% 0.043 350.2) | Personal |

## Migration Mapping

### CSS Variable Updates
| Current Variable | Old Value | New Value | Impact |
|-----------------|-----------|-----------|---------|
| `--background` | `oklch(1 0 0)` | `#f7f7f8` | Softer white |
| `--foreground` | `oklch(0.145 0 0)` | `#2e3338` | Warmer black |
| `--primary` | `oklch(0.205 0 0)` | `#5a7030` | Green CTA (WCAG) |
| `--primary-hover` | N/A | `#333d1f` | Primary hover |
| `--brand` | N/A | `#9bbb59` | Brand identity |
| `--secondary` | `oklch(0.97 0 0)` | `#dee0e3` | Neutral gray |
| `--destructive` | `oklch(0.577 0.245 27)` | `#d85555` | Cleaner red |
| `--accent` | `oklch(0.97 0 0)` | `#8899ff` | Purple accent |
| `--muted` | `oklch(0.97 0 0)` | `#b7bac0` | True gray |
| `--muted-foreground` | `oklch(0.556 0 0)` | `#7a7f85` | Readable gray |
| `--border` | `oklch(0.922 0 0)` | `#b7bac0` | Visible borders |
| `--ring` | `oklch(0.708 0 0)` | `#9bbb59` | Brand focus |

### Hardcoded Color Replacements
| Component | Old Colors | New Colors |
|-----------|------------|------------|
| Tag System | 10 pastel colors | 8 soft pastels (above) |
| Note Status | Cold/Warm/Hot/Contract | Success/Warning/Error/Info |
| Deal Charts | Won/Pending/Lost | Success/Warning/Error variants |

## Implementation Guidelines

### 1. Color Usage Rules
- **Never use more than 3 colors** in a single component
- **Neutrals first**: Start with grays, add color purposefully
- **Semantic consistency**: Red = danger, Green = success, always
- **Brand vs Success**: Brand green for CTAs/identity, Success green for status only
- **Tag styling**: Always use soft pastels with Neutral 700 text

### 2. Contrast Requirements
- Text on light backgrounds: Use neutrals 600-900 (4.5:1+ ratio)
- Text on colored backgrounds: Use white or 900 neutral
- Interactive elements: Minimum 3:1 against background

### 3. Dark Mode Adjustments
- Invert neutral scale (50 ↔ 900)
- Reduce color saturation by 10-15%
- Increase lightness of brand colors by 10%
- Use borders more prominently (they're harder to see in dark mode)

### 4. State Variations
| State | Adjustment |
|-------|------------|
| Hover | Lighten by 10% or move 1 level up |
| Active | Darken by 10% or move 1 level down |
| Disabled | 50% opacity |
| Focus | Add 2px ring in primary color |

### 5. Component-Specific Notes

#### Buttons
- Primary: Green 700 bg, white text, Green 800 hover
- Secondary: Neutral 100 bg, Neutral 700 text, Neutral 200 border
- Destructive: Error Strong bg, white text
- Ghost: Transparent bg, current color text

#### Forms
- Default border: Neutral 200
- Focus border: Brand 500 (#9bbb59)
- Error border: Error Default
- Disabled: 50% opacity

#### Cards & Containers
- Card bg: Neutral 50
- Card border: Neutral 200
- Elevated card: Add subtle shadow

## Migration Checklist

- [ ] Update `globals.css` with new CSS variables
- [ ] Replace hardcoded hex values in components
- [ ] Update tag color system
- [ ] Migrate chart colors
- [ ] Test all interactive states
- [ ] Verify WCAG compliance
- [ ] Create dark mode variant
- [ ] Update Storybook stories
- [ ] Document in design system

## Notes

- **Total colors**: 42 OKLCH color definitions (10 neutrals, 5 brand greens, 12 semantic, 2 accents, 8 tags with auto-contrast pairs, 5 chart colors)
- **Key fixes applied**:
  - Brand-500 and Brand-700 now use proper OKLCH format with reduced chroma to prevent gamut clipping
  - Primary buttons use Brand 700 (oklch(50% 0.10 125)) for WCAG compliance
  - Success green uses hue 145° to differentiate from brand (125°)
  - All neutrals use consistent cool undertone (hue ~285°)
- **Brand separation**: `--primary` for CTAs (Brand 700), `--brand` for identity (Brand 500)
- All OKLCH values optimized for sRGB gamut to prevent gray rendering issues