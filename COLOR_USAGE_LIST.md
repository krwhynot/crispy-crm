# Atomic CRM - Complete Color Usage List

## Semantic Colors (CSS Variables - Actively Used)

### Core UI Colors
| Color Variable | Light Theme Value | Dark Theme Value | Where It's Used |
|----------------|------------------|------------------|-----------------|
| `--background` | `oklch(1 0 0)` (white) | `oklch(0.145 0 0)` (near-black) | Main page background, input backgrounds |
| `--foreground` | `oklch(0.145 0 0)` (near-black) | `oklch(0.985 0 0)` (near-white) | Primary text color throughout the app |
| `--primary` | `oklch(0.205 0 0)` (dark) | `oklch(0.922 0 0)` (light) | Default buttons, links, primary actions, focus states |
| `--primary-foreground` | `oklch(0.985 0 0)` (near-white) | `oklch(0.205 0 0)` (dark) | Text on primary colored backgrounds |
| `--secondary` | `oklch(0.97 0 0)` (light gray) | `oklch(0.269 0 0)` (dark gray) | Secondary buttons, subtle backgrounds |
| `--secondary-foreground` | `oklch(0.205 0 0)` (dark) | `oklch(0.985 0 0)` (light) | Text on secondary backgrounds |
| `--destructive` | `oklch(0.577 0.245 27.325)` (red) | `oklch(0.704 0.191 22.216)` (dark red) | Delete buttons, error states, validation errors |
| `--muted` | `oklch(0.97 0 0)` (light gray) | `oklch(0.269 0 0)` (dark gray) | Disabled states, subtle backgrounds, inactive elements |
| `--muted-foreground` | `oklch(0.556 0 0)` (medium gray) | `oklch(0.708 0 0)` (light gray) | Placeholder text, secondary text, descriptions |
| `--accent` | `oklch(0.97 0 0)` (light gray) | `oklch(0.269 0 0)` (dark gray) | Hover states, selected items, active navigation |
| `--accent-foreground` | `oklch(0.205 0 0)` (dark) | `oklch(0.985 0 0)` (light) | Text on accent backgrounds |
| `--card` | `oklch(1 0 0)` (white) | `oklch(0.205 0 0)` (dark) | Card backgrounds, modal backgrounds, dropdown menus |
| `--card-foreground` | `oklch(0.145 0 0)` (near-black) | `oklch(0.985 0 0)` (near-white) | Text on cards |
| `--border` | `oklch(0.922 0 0)` (light gray) | `oklch(1 0 0 / 15%)` (white 15% opacity) | All borders, dividers, separators |
| `--input` | `oklch(0.922 0 0)` (light gray) | `oklch(1 0 0 / 15%)` (white 15% opacity) | Input field borders, select borders |
| `--ring` | `oklch(0.708 0 0)` (medium gray) | `oklch(0.556 0 0)` (darker gray) | Focus rings, active indicators, focus outlines |

## Hardcoded Colors (Need Migration to CSS Variables)

### Tag Colors
Used in: Tag system for categorizing contacts, companies, and deals
| Color Name | Hex Value | Usage |
|------------|-----------|-------|
| Dusty Rose | `#eddcd2` | Tag categorization |
| Cream | `#fff1e6` | Tag categorization |
| Blush Pink | `#fde2e4` | Tag categorization |
| Light Pink | `#fad2e1` | Tag categorization |
| Sage | `#c5dedd` | Tag categorization |
| Mint | `#dbe7e4` | Tag categorization |
| Beige | `#f0efeb` | Tag categorization |
| Sky | `#d6e2e9` | Tag categorization |
| Powder Blue | `#bcd4e6` | Tag categorization |
| Cornflower | `#99c1de` | Tag categorization |

### Note Status Colors
Used in: Contact and deal note status indicators
| Status | Hex Value | Usage |
|--------|-----------|-------|
| Cold | `#7dbde8` | Initial contact, low engagement |
| Warm | `#e8cb7d` | Engaged prospect, showing interest |
| Hot | `#e88b7d` | Ready to close, high priority |
| In Contract | `#a4e87d` | Active deal, contract signed |

### Deal Chart Colors
Used in: Dashboard deal charts (bar charts showing deal pipeline)
| Chart Element | Hex Value | Usage |
|---------------|-----------|-------|
| Won | `#61cdbb` | Successful deals in charts |
| Pending | `#97e3d5` | Pending/in-progress deals |
| Lost | `#e25c3b` | Lost deals in charts |
| Won Text | `#2ebca6` | Text labels for won deals |
| Lost Text/Stroke | `#f47560` | Text labels and chart strokes |

## Component-Specific Color Usage

### Button Variants
| Button Type | Colors Used | Common Locations |
|-------------|-------------|------------------|
| Default | `--primary`, `--primary-foreground` | Save, Submit, Primary CTAs |
| Secondary | `--secondary`, `--secondary-foreground` | Cancel, Secondary actions |
| Destructive | `--destructive`, white | Delete, Remove, Dangerous actions |
| Outline | `--background`, `--border`, `--accent` (hover) | Filter, Sort, Tertiary actions |
| Ghost | transparent, `--accent` (hover) | Icon buttons, Minimal actions |
| Link | `--primary`, underline | Inline links, Text buttons |

### Form States
| State | Colors Used | When Applied |
|-------|-------------|--------------|
| Default | `--input` (border), `--background` | Normal input state |
| Focus | `--ring` (border & shadow) | User focuses input |
| Invalid | `--destructive` (border) | Validation errors |
| Disabled | 50% opacity | Inactive/disabled inputs |

### Interactive States
| State | Color/Style | Applied To |
|-------|-------------|------------|
| Hover | `--accent` background | Buttons, menu items, clickable elements |
| Active/Selected | `--accent` background | Selected navigation, active tabs |
| Focus | `--ring` (2px outline) | All focusable elements |
| Disabled | 50% opacity | All disabled elements |

## Unused But Defined Variables

These CSS variables are defined in the system but not actively used:
- `--chart-1` through `--chart-5` (Chart colors - hardcoded values used instead)
- `--sidebar` and all `--sidebar-*` variables (Sidebar not implemented)
- `--popover` and `--popover-foreground` (Same as card colors)
- `--destructive-foreground` (White is hardcoded instead)

## Summary Statistics

- **✅ 16 semantic colors** actively used via CSS variables
- **⚠️ 19 hardcoded colors** that should be migrated
- **❌ 13 unused variables** that could be removed or implemented
- **Total unique colors in production**: ~35 colors